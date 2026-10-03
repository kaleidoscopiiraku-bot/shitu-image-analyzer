import json, re, subprocess, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).parents[1]
class PublicReleaseTest(unittest.TestCase):
 def test_licensed_catalogue_and_independent_prompts(self):
  styles=json.loads((ROOT/'web/styles/library.json').read_text())['styles']
  self.assertEqual(len(styles),233)
  for item in styles:
   self.assertEqual(item['sourceKind'],'github-original')
   self.assertNotIn('xsec_token',json.dumps(item))
   self.assertRegex(item['previewSourceUrl'],r'/assets/examples/sample[-_]\d+\.(png|jpe?g|webp)$')
   self.assertTrue((ROOT/'web'/item['preview']).is_file())
   license=ROOT/'web/styles/licenses'/item['id']/'LICENSE'
   self.assertIn('PolyForm Noncommercial',license.read_text())
   self.assertTrue(item['original'])
   self.assertIsNone(re.search(r'上半部分|下半部分|各占画面\s*50|50:50',item['prompt']))
 def test_fresh_device_pairing_reuse_and_permissions(self):
  with tempfile.TemporaryDirectory(prefix='mimo-pairing-test-') as temp:
   folder=Path(temp);driver=folder/'driver.swift';binary=folder/'pairing-test'
   driver.write_text('''import Foundation
@main enum Test {
 static func main() throws {
  let root=URL(fileURLWithPath:CommandLine.arguments[1])
  let a=root.appendingPathComponent("a"),b=root.appendingPathComponent("b")
  let first=try PairingConfiguration.loadToken(at:a)
  let second=try PairingConfiguration.loadToken(at:b)
  precondition(first != second && first.count == 43 && second.count == 43)
  let cfg=a.appendingPathComponent("config.json")
  var contents=try JSONSerialization.jsonObject(with:Data(contentsOf:cfg)) as! [String:Any]
  contents["setup_complete"]=true
  try JSONSerialization.data(withJSONObject:contents).write(to:cfg)
  let again=try PairingConfiguration.loadToken(at:a)
  precondition(first == again)
  let preserved=try JSONSerialization.jsonObject(with:Data(contentsOf:cfg)) as! [String:Any]
  precondition(preserved["setup_complete"] as? Bool == true)
  let permissions=try FileManager.default.attributesOfItem(atPath:cfg.path)[.posixPermissions] as! NSNumber
  precondition(permissions.intValue == 0o600)
  print("Fresh tokens differ; existing config and permissions preserved")
 }
}''')
   subprocess.run(['swiftc','-module-cache-path','/tmp/mimo-release-swift-cache',str(ROOT/'Sources/PairingConfiguration.swift'),str(driver),'-o',str(binary)],check=True,capture_output=True)
   result=subprocess.run([str(binary),str(folder/'profiles')],check=True,capture_output=True,text=True)
   self.assertIn('Fresh tokens differ',result.stdout)
