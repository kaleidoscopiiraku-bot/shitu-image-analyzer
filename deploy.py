"""Install a built app into this user's Applications folder."""
from pathlib import Path
import shutil, datetime
root=Path(__file__).resolve().parent
source=root/'MiMo看图.app'
if not source.is_dir():raise SystemExit('Run python3 build.py first.')
destination=Path.home()/'Applications/MiMo看图.app'
destination.parent.mkdir(parents=True,exist_ok=True)
if destination.exists():
    backup=destination.with_name('MiMo看图-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.app')
    destination.rename(backup)
shutil.copytree(source,destination)
print(destination)
