"""Package the separately built public app and credential-free Chrome extension."""
from pathlib import Path
import hashlib, os, shutil, subprocess, tempfile, zipfile
root=Path(__file__).resolve().parent
release=root/'release';release.mkdir(exist_ok=True)
version='2.0.0'
app=root/'MiMo看图.app'
zip_path=release/f'mimo-{version}-macos-arm64.zip'
subprocess.run(['ditto','-c','-k','--keepParent',str(app),str(zip_path)],check=True)
ext_zip=release/f'mimo-{version}-chrome-extension.zip'
with zipfile.ZipFile(ext_zip,'w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted((root/'extension').rglob('*')):
        if p.is_file() and p.name not in ['config.js','.DS_Store']:
            archive.write(p,str(p.relative_to(root)))
stage=Path(tempfile.mkdtemp(prefix='mimo-dmg-'))
shutil.copytree(app,stage/app.name)
os.symlink('/Applications',stage/'Applications')
shutil.copy2(release/'INSTALLATION.txt',stage/'INSTALLATION.txt')
dmg=release/f'mimo-{version}-macos-arm64.dmg'
subprocess.run(['hdiutil','create','-volname','MiMo看图 V2','-srcfolder',str(stage),'-ov','-format','UDZO',str(dmg)],check=True)
shutil.copy2(root/'MODEL-DOWNLOADS.md',release/'MODEL-DOWNLOADS.md')
assets=[dmg,zip_path,ext_zip,release/'INSTALLATION.txt',release/'MODEL-DOWNLOADS.md']
lines=[]
for path in assets:
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
    lines.append(h.hexdigest()+'  '+path.name)
(release/'SHA256SUMS.txt').write_text('\n'.join(lines)+'\n')
print('Release assets:',[(p.name,p.stat().st_size) for p in assets])
