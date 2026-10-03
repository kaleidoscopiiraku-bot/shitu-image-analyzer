# V2 release boundary

- App builds contain no pairing token or user config. First launch generates a cryptographically random 32-byte token per data directory using SecRandomCopyBytes, saves config.json with mode 0600, and reuses existing configuration.
- Extension pairing is explicit, validated against the authenticated loopback health endpoint, and stored in chrome.storage.local. Options do not display the saved token. The package has no config.js or shared secret.
- HTTP bridge checks loopback Host, Origin and bearer authentication. Static UI is public on loopback; data endpoints and previews remain authenticated. No unauthenticated token-discovery endpoint exists.
- Native actions are limited to the trusted main frame at 127.0.0.1:19428. Original-source links use an explicit HTTPS hostname allowlist.
- Input-image retrieval and provider analysis retain existing validation. Codex CLI and custom API modes can send selected images to their chosen providers; local mode stays on this Mac.
- Release data is an allowlisted noncommercial collection, excluding personal Xiaohongshu attachments, browser snapshots, account state, model weights, private LoRA, training images and local logs/histories.
- Ad-hoc signing is used; Developer ID signing and notarization are not claimed. Python 3.9+ is a desktop dependency. This is an Apple Silicon development release.
