"""Choose documented effect examples rather than author/contact graphics."""
import re


def select_example_path(readme):
    candidates = []
    pattern = r'<img\b[^>]*\bsrc=["\']([^"\']+)["\']|!\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)'
    for match in re.finditer(pattern, readme, re.I):
        path = match.group(1) or match.group(2)
        if re.search(r'(?:^|/)assets/examples/sample[-_]\d+\.(?:png|jpe?g|webp)$', path, re.I):
            candidates.append(path)
    if not candidates:
        raise ValueError('No documented effect example; never substitute a contact or QR image')
    return next((p for p in candidates if re.search(r'sample[-_]0?1\.', p, re.I)), candidates[0])
