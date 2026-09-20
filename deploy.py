from pathlib import Path
import json,os,shutil,subprocess,tempfile
src=Path(__file__).resolve().parent
dest=Path('/Users/runting/Library/CloudStorage/OneDrive-个人/codex/拾图')
if src.resolve()==dest.resolve():
 print(f'{dest} 已是项目与应用目录，无需复制。')
 raise SystemExit(0)
dest.mkdir(exist_ok=True)
for name in ['server.py','build.py','deploy.py','README.md','SECURITY-REVIEW.md','.gitignore']:
 shutil.copyfile(src/name,dest/name)
for name in ['Sources','web','extension','tests','launchpad']:
 shutil.copytree(src/name,dest/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.app') if name=='launchpad' else None)
(dest/'paths.json').write_text(json.dumps({'data':str(Path.home()/'Library/Application Support/拾图')},ensure_ascii=False,indent=2))
app=dest/'拾图.app';work=Path(tempfile.mkdtemp(prefix='.shitu-update-',dir=dest.parent));staged=work/'new.app';backup=work/'old.app'
try:
 shutil.copytree(src/'拾图.app',staged)
 subprocess.run(['xattr','-cr',str(staged)],check=True)
 subprocess.run(['codesign','--force','--sign','-',str(staged)],check=True)
 if app.exists():os.replace(app,backup)
 try:os.replace(staged,app)
 except Exception:
  if backup.exists() and not app.exists():os.replace(backup,app)
  raise
finally:
 if app.exists() or not backup.exists():shutil.rmtree(work,ignore_errors=True)
print(dest)
