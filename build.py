from pathlib import Path
import json,os,plistlib,secrets,subprocess,shutil,tempfile
r=Path(__file__).resolve().parent
data_root=Path.home()/'Library/Application Support/拾图'
cfg=data_root/'config.json'
if not cfg.exists(): cfg.write_text(json.dumps({'token':secrets.token_urlsafe(32)}));cfg.chmod(0o600)
app=Path(tempfile.mkdtemp(prefix='shitu-build-'))/'拾图.app';(app/'Contents/MacOS').mkdir(parents=True,exist_ok=True)
info={'CFBundleExecutable':'Shitu','CFBundleIdentifier':'local.codex.shitu','CFBundleName':'拾图','CFBundleDisplayName':'拾图','CFBundleVersion':'1','CFBundleShortVersionString':'0.1.0','CFBundlePackageType':'APPL','CFBundleIconFile':'拾图猫咪.icns','NSHighResolutionCapable':True,'NSPrincipalClass':'NSApplication','NSAppTransportSecurity':{'NSAllowsLocalNetworking':True},'CFBundleDocumentTypes':[{'CFBundleTypeName':'图片','CFBundleTypeRole':'Viewer','LSHandlerRank':'Alternate','LSItemContentTypes':['public.image']}],'NSServices':[{'NSMenuItem':{'default':'用拾图分析图片'},'NSMessage':'analyzeService','NSPortName':'拾图','NSSendTypes':['public.file-url','NSFilenamesPboardType','public.png','public.tiff']}]}
info['ShituLocalToken']=json.loads(cfg.read_text())['token']
info['NSDownloadsFolderUsageDescription']='读取你选中的本地图片。'
info['NSDocumentsFolderUsageDescription']='读取你选中的本地图片。'
(app/'Contents/Info.plist').write_bytes(plistlib.dumps(info))
res=app/'Contents/Resources';res.mkdir()
shutil.copyfile(r/'launchpad'/'拾图猫咪.icns',res/'拾图猫咪.icns')
shutil.copyfile(r/'server.py',res/'server.py')
shutil.copyfile(r/'model-manifest.json',res/'model-manifest.json')
shutil.copytree(r/'web',res/'web')
subprocess.run(['swiftc','-module-cache-path','/tmp/shitu-swift-cache',str(r/'Sources/main.swift'),'-o',str(app/'Contents/MacOS/Shitu'),'-framework','AppKit','-framework','WebKit','-framework','Carbon','-framework','Security'],check=True)
subprocess.run(['xattr','-cr',str(app)],check=True)
subprocess.run(['codesign','--force','--sign','-',str(app)],check=True)
target=r/'拾图.app';replacement=r/'.拾图.app.next';backup=r/'.拾图.app.previous'
if replacement.exists():shutil.rmtree(replacement)
if backup.exists():shutil.rmtree(backup)
shutil.copytree(app,replacement)
subprocess.run(['xattr','-cr',str(replacement)],check=True)
subprocess.run(['codesign','--force','--sign','-',str(replacement)],check=True)
if target.exists():os.replace(target,backup)
try:
    os.replace(replacement,target)
except Exception:
    if backup.exists() and not target.exists():os.replace(backup,target)
    raise
if backup.exists():shutil.rmtree(backup)
for f in ['ui.js','ui.css']:shutil.copy(r/'web'/f,r/'extension'/f)
(r/'extension/config.js').write_text('const SHITU_TOKEN = '+json.dumps(json.loads(cfg.read_text())['token'])+';\n')
print(target)
