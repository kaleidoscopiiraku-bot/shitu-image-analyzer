"""Build a portable V2 app without embedding any local credentials."""
from pathlib import Path
import argparse, os, plistlib, subprocess, shutil, tempfile

root=Path(__file__).resolve().parent
subprocess.run([__import__('sys').executable,str(root/'fetch_previews.py')],check=True)
parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=root/'MiMo看图.app')
args=parser.parse_args()
app=Path(tempfile.mkdtemp(prefix='mimo-build-'))/'MiMo看图.app'
(app/'Contents/MacOS').mkdir(parents=True)
info={'CFBundleExecutable':'Shitu','CFBundleIdentifier':'local.codex.shitu','CFBundleName':'MiMo看图','CFBundleDisplayName':'MiMo看图','CFBundleVersion':'2','CFBundleShortVersionString':'2.0.0','CFBundlePackageType':'APPL','CFBundleIconFile':'拾图猫咪.icns','NSHighResolutionCapable':True,'NSPrincipalClass':'NSApplication','NSAppTransportSecurity':{'NSAllowsLocalNetworking':True},'CFBundleDocumentTypes':[{'CFBundleTypeName':'图片','CFBundleTypeRole':'Viewer','LSHandlerRank':'Alternate','LSItemContentTypes':['public.image']}],'NSServices':[{'NSMenuItem':{'default':'用MiMo看图分析图片'},'NSMessage':'analyzeService','NSPortName':'MiMo看图','NSSendTypes':['public.file-url','NSFilenamesPboardType','public.png','public.tiff']}], 'NSDownloadsFolderUsageDescription':'读取你选中的本地图片。','NSDocumentsFolderUsageDescription':'读取你选中的本地图片。'}
(app/'Contents/Info.plist').write_bytes(plistlib.dumps(info))
resources=app/'Contents/Resources';resources.mkdir()
for name in ['server.py','model-manifest.json']:
    shutil.copy2(root/name,resources/name)
shutil.copy2(root/'launchpad/拾图猫咪.icns',resources/'拾图猫咪.icns')
shutil.copytree(root/'web',resources/'web')
subprocess.run(['swiftc','-module-cache-path','/tmp/mimo-release-swift-cache',str(root/'Sources/main.swift'),str(root/'Sources/PairingConfiguration.swift'),'-o',str(app/'Contents/MacOS/Shitu'),'-framework','AppKit','-framework','WebKit','-framework','Carbon','-framework','Security'],check=True)
subprocess.run(['xattr','-cr',str(app)],check=True)
subprocess.run(['codesign','--force','--sign','-',str(app)],check=True)
subprocess.run(['codesign','--verify','--deep','--strict',str(app)],check=True)
target=args.output.resolve();target.parent.mkdir(parents=True,exist_ok=True)
if target.exists():raise SystemExit('Output exists; choose a different --output to preserve it.')
shutil.copytree(app,target)
for name in ['ui.js','ui.css']:shutil.copy2(root/'web'/name,root/'extension'/name)
print(target)
