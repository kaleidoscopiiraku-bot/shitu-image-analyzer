"""Retrieve licensed previews and reject changes to the reviewed source bytes."""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent

def retrieve(entry):
    target = ROOT / 'web' / entry['path']
    assert target.parent == ROOT / 'web/styles/previews'
    def valid(data):
        return len(data) == entry['size'] and hashlib.sha256(data).hexdigest() == entry['sha256']
    if target.exists() and valid(target.read_bytes()):
        return
    assert urllib.parse.urlsplit(entry['url']).hostname == 'raw.githubusercontent.com'
    for attempt in range(3):
        try:
            with urllib.request.urlopen(entry['url'], timeout=60) as response:
                assert urllib.parse.urlsplit(response.url).hostname == 'raw.githubusercontent.com'
                data = response.read(entry['size'] + 1)
            if not valid(data):
                raise ValueError('Preview bytes changed: ' + entry['path'])
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            return
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)

if __name__ == '__main__':
    entries = json.loads((ROOT / 'web/styles/previews-manifest.json').read_text())['entries']
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(retrieve, entries))
    print(f'Verified {len(entries)} licensed previews against SHA-256 manifest.')
