"""Loopback authorization, supported-mode, and local-history regression tests."""
import base64
import importlib.util
import json
import stat
import tempfile
import threading
import time
import unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

spec=importlib.util.spec_from_file_location('bridge',Path(__file__).parents[1]/'server.py')
b=importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)

class BridgeTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=b.ThreadingHTTPServer(('127.0.0.1',0),b.Handler)
  b.PORT=cls.server.server_port
  threading.Thread(target=cls.server.serve_forever,daemon=True).start()
 @classmethod
 def tearDownClass(cls):
  cls.server.shutdown()
  cls.server.server_close()
 def request(self,path='/jobs',body=None,auth=True,origin=None,host=None):
  headers={}
  if auth: headers['Authorization']='Bearer '+b.TOKEN
  if origin: headers['Origin']=origin
  if host: headers['Host']=host
  req=Request(f'http://127.0.0.1:{b.PORT}'+path,data=json.dumps(body,ensure_ascii=False).encode() if body is not None else None,headers=headers)
  try:
   with urlopen(req) as r:return r.status,json.load(r)
  except HTTPError as e:return e.code,json.load(e)
 def sample_result(self,prefix='测试'):
  return {field:prefix+field for field in b.FIELDS}
 def test_unauthenticated_cannot_read_history(self):
  self.assertEqual(self.request('/history',auth=False)[0],401)
 def test_remote_page_cannot_submit(self):
  self.assertEqual(self.request(body={'image':'abc'},origin='https://example.com')[0],403)
 def test_dns_rebinding_rejected(self):
  self.assertEqual(self.request('/health',host='evil.example')[0],403)
 def test_invalid_image_rejected(self):
  self.assertEqual(self.request(body={'image':base64.b64encode(b'not image').decode(),'provider':'mlx-adapter'})[0],400)
 def test_only_supported_providers_are_accepted(self):
  for provider in ('local','openai'):
   self.assertEqual(self.request(body={'image':base64.b64encode(b'\xff\xd8\xfffixture').decode(),'provider':provider})[0],400)
   status,_=self.request('/settings',{'provider':provider})
   self.assertEqual(status,400)

 def test_codex_cli_provider_dispatches_selected_image_and_source_url(self):
  old=b.codex_cli_analyze
  seen=[]
  def fake_codex(encoded,source_url=''):
   seen.append((encoded,source_url))
   return self.sample_result('Codex')
  b.codex_cli_analyze=fake_codex
  try:
   encoded=base64.b64encode(b'\xff\xd8\xffselected-fixture').decode()
   status,job=self.request(body={'image':encoded,'provider':'chatgpt-web','source_url':'https://example.test/pin/42'})
   self.assertEqual(status,202)
   for _ in range(40):
    _,result=self.request('/jobs/'+job['id'])
    if result['status'] in ('done','error'):break
    time.sleep(.05)
   self.assertEqual(result['status'],'done')
   self.assertEqual(result['provider'],'chatgpt-web')
   self.assertEqual(seen,[(encoded,'https://example.test/pin/42')])
   self.assertNotIn('image',result)
  finally:
   b.codex_cli_analyze=old
 def test_custom_api_provider_dispatches_selected_image_and_source_url(self):
  old=b.custom_api_analyze
  seen=[]
  def fake_custom(encoded,source_url=''):
   seen.append((encoded,source_url))
   return self.sample_result('自定义')
  b.custom_api_analyze=fake_custom
  try:
   encoded=base64.b64encode(b'\xff\xd8\xffcustom-fixture').decode()
   status,job=self.request(body={'image':encoded,'provider':'custom-api','source_url':'https://example.test/pin/custom'})
   self.assertEqual(status,202)
   for _ in range(40):
    _,result=self.request('/jobs/'+job['id'])
    if result['status'] in ('done','error'):break
    time.sleep(.05)
   self.assertEqual(result['status'],'done')
   self.assertEqual(result['provider'],'custom-api')
   self.assertEqual(seen,[(encoded,'https://example.test/pin/custom')])
   self.assertNotIn('image',result)
  finally:
   b.custom_api_analyze=old
 def test_custom_api_key_is_saved_privately_and_never_returned(self):
  old_config,old_provider=b.CONFIG,b.CURRENT_PROVIDER
  try:
   with tempfile.TemporaryDirectory() as folder:
    b.CONFIG=Path(folder)/'config.json'
    b.CONFIG.write_text(json.dumps({'token':b.TOKEN}))
    body={'provider':'custom-api','custom_api':{'endpoint':'https://example.test/v1/chat/completions','model':'vision-test','api_key':'super-secret'}}
    status,response=self.request('/settings',body)
    self.assertEqual(status,200)
    self.assertEqual(response['provider'],'custom-api')
    self.assertEqual(response['custom_api'],{'endpoint':'https://example.test/v1/chat/completions','model':'vision-test','key_configured':True})
    self.assertNotIn('super-secret',json.dumps(response))
    saved=json.loads(b.CONFIG.read_text())
    self.assertEqual(saved['custom_api']['api_key'],'super-secret')
    self.assertEqual(stat.S_IMODE(b.CONFIG.stat().st_mode),0o600)
    status,health=self.request('/health')
    self.assertEqual(status,200)
    self.assertNotIn('super-secret',json.dumps(health))
  finally:
   b.CONFIG,b.CURRENT_PROVIDER=old_config,old_provider
 def test_custom_api_uses_selected_image_and_json_output(self):
  old_config,old_urlopen=b.CONFIG,b.urlopen
  seen=[]
  class FakeResponse:
   def __enter__(self): return self
   def __exit__(self,*_): return False
   def read(self): return json.dumps({'choices':[{'message':{'content':json.dumps(self_result)}}]}).encode()
  self_result=self.sample_result('远程')
  def fake_urlopen(request,timeout=0):
   seen.append((request,timeout))
   return FakeResponse()
  try:
   with tempfile.TemporaryDirectory() as folder:
    b.CONFIG=Path(folder)/'config.json'
    b.CONFIG.write_text(json.dumps({'token':b.TOKEN,'custom_api':{'endpoint':'https://example.test/v1/chat/completions','model':'vision-test','api_key':'super-secret'}}))
    b.urlopen=fake_urlopen
    encoded=base64.b64encode(b'\xff\xd8\xffselected-fixture').decode()
    self.assertEqual(b.custom_api_analyze(encoded,'https://example.test/pin/7'),self_result)
    request,timeout=seen[0]
    payload=json.loads(request.data)
    self.assertEqual(timeout,b.CUSTOM_API_TIMEOUT)
    self.assertEqual(payload['model'],'vision-test')
    self.assertEqual(payload['response_format'],{'type':'json_object'})
    image=[part for part in payload['messages'][1]['content'] if part['type']=='image_url'][0]
    self.assertEqual(image['image_url']['url'],'data:image/jpeg;base64,'+encoded)
    self.assertIn('https://example.test/pin/7',payload['messages'][1]['content'][0]['text'])
    self.assertEqual(request.get_header('Authorization'),'Bearer super-secret')
    self.assertNotIn('super-secret',request.data.decode())
  finally:
   b.CONFIG,b.urlopen=old_config,old_urlopen
 def test_provider_setting_persists_enhanced_only(self):
  old_config,old_provider=b.CONFIG,b.CURRENT_PROVIDER
  try:
   with tempfile.TemporaryDirectory() as folder:
    b.CONFIG=Path(folder)/'config.json'
    b.CONFIG.write_text(json.dumps({'token':b.TOKEN,'provider':'local'}))
    status,result=self.request('/settings',{'provider':'mlx-adapter'})
    self.assertEqual(status,200)
    self.assertEqual(result['provider'],'mlx-adapter')
    saved=json.loads(b.CONFIG.read_text())
    self.assertEqual(saved,{'token':b.TOKEN,'provider':'mlx-adapter'})
  finally:
   b.CONFIG,b.CURRENT_PROVIDER=old_config,old_provider
 def test_health_does_not_expose_api_key_settings(self):
  status,result=self.request('/health')
  self.assertEqual(status,200)
  self.assertIn(result['provider'],b.SUPPORTED_PROVIDERS)
  self.assertIn('key_configured',result.get('custom_api',{}))
  self.assertNotIn('api_key',json.dumps(result))
 def test_system_reports_hardware_recommendation_and_codex_status_only(self):
  status,result=self.request('/system')
  self.assertEqual(status,200)
  self.assertIn('hardware',result);self.assertIn('recommendation',result);self.assertIn('codex',result)
  self.assertNotIn('token',json.dumps(result));self.assertNotIn('api_key',json.dumps(result))
  self.assertIn('installed',result['codex']);self.assertIn('authenticated',result['codex'])
 def test_setup_marks_first_run_complete_without_exposing_config(self):
  old_config,old_provider=b.CONFIG,b.CURRENT_PROVIDER
  try:
   with tempfile.TemporaryDirectory() as folder:
    b.CONFIG=Path(folder)/'config.json';b.CONFIG.write_text(json.dumps({'token':b.TOKEN}))
    status,result=self.request('/setup',{'provider':'chatgpt-web'})
    self.assertEqual(status,200);self.assertTrue(result['setup_complete']);self.assertEqual(result['provider'],'chatgpt-web')
    saved=json.loads(b.CONFIG.read_text());self.assertTrue(saved['setup_complete']);self.assertNotIn('api_key',json.dumps(result))
  finally:
   b.CONFIG,b.CURRENT_PROVIDER=old_config,old_provider
 def test_history_keeps_latest_ten_without_image_or_url(self):
  old=b.HISTORY_FILE
  try:
   with tempfile.TemporaryDirectory() as folder:
    b.HISTORY_FILE=Path(folder)/'history.json'
    for index in range(11):
     status,response=self.request('/history',{
      'name':f'图片 {index}','provider':'mlx-adapter',
      'result':self.sample_result(str(index)),
      'image':'should-not-be-saved','url':'https://example.test/image.jpg'
     })
     self.assertEqual(status,200)
    history=response['history']
    self.assertEqual(len(history),10)
    self.assertEqual(history[0]['name'],'图片 10')
    self.assertEqual(history[-1]['name'],'图片 1')
    self.assertEqual(set(history[0]),{'id','created','name','provider','result'})
    self.assertNotIn('image',json.dumps(history))
    self.assertNotIn('example.test',json.dumps(history))
    self.assertEqual(json.loads(b.HISTORY_FILE.read_text()),history)
    self.assertEqual(stat.S_IMODE(b.HISTORY_FILE.stat().st_mode),0o600)
    status,loaded=self.request('/history')
    self.assertEqual(status,200)
    self.assertEqual(len(loaded['history']),10)
  finally:
   b.HISTORY_FILE=old
 def test_history_rejects_invalid_provider_or_incomplete_modules(self):
  old=b.HISTORY_FILE
  try:
   with tempfile.TemporaryDirectory() as folder:
    b.HISTORY_FILE=Path(folder)/'history.json'
    self.assertEqual(self.request('/history',{'name':'bad','provider':'openai','result':self.sample_result()})[0],400)
    missing=self.sample_result();missing['style']=''
    self.assertEqual(self.request('/history',{'name':'bad','provider':'chatgpt-web','result':missing})[0],400)
    self.assertFalse(b.HISTORY_FILE.exists())
  finally:
   b.HISTORY_FILE=old
 def test_mlx_adapter_uses_only_the_selected_image(self):
  seen=[]
  old=(b.mlx_request,b.start_mlx_server)
  def fake_request(path,body=None,timeout=5):
   if path=='/v1/models':return {'data':[{'id':'test-mlx-model'}]}
   seen.append(body)
   return {'choices':[{'message':{'content':json.dumps(self.sample_result('增强'))}}]}
  b.mlx_request=fake_request
  b.start_mlx_server=lambda:None
  try:
   encoded=base64.b64encode(b'\x89PNG\r\n\x1a\nselected-fixture').decode()
   status,job=self.request(body={'image':encoded,'provider':'mlx-adapter'})
   self.assertEqual(status,202)
   for _ in range(40):
    _,result=self.request('/jobs/'+job['id'])
    if result['status'] in ('done','error'):break
    time.sleep(.05)
   self.assertEqual(result['status'],'done')
   self.assertEqual(result['provider'],'mlx-adapter')
   self.assertEqual(seen[0]['model'],'test-mlx-model')
   content=seen[0]['messages'][1]['content']
   self.assertEqual([part['image_url']['url'] for part in content if part['type']=='image_url'],
    ['data:image/jpeg;base64,'+encoded])
   self.assertNotIn('image',result)
  finally:
   b.mlx_request,b.start_mlx_server=old
 def test_blank_style_is_rejected(self):
  old=b.mlx_analyze
  job_id='blank-style-test'
  result=self.sample_result()
  result['style']=''
  b.mlx_analyze=lambda encoded:result
  b.BUSY.acquire()
  b.JOBS[job_id]={'status':'running','created':time.time()}
  try:
   b.analyze(job_id,base64.b64encode(b'fixture').decode(),'mlx-adapter')
   self.assertEqual(b.JOBS[job_id]['status'],'error')
   self.assertIn('不完整',b.JOBS[job_id]['error'])
  finally:
   b.mlx_analyze=old
   b.JOBS.pop(job_id,None)
if __name__=='__main__':unittest.main()
