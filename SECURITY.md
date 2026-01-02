# Security Policy

## Reporting Vulnerabilities

Email security issues to: [database@omg.lol](mailto:database@omg.lol)

## How Your Data is Protected

**Credentials**

- Stored using VS Code's `secrets` API (never plain text)
- Only sent to api.omg.lol via HTTPS
- Never logged or included in error messages

**Authentication**

- OAuth uses `state` parameter to prevent CSRF
- API key input is masked during entry
- Both methods validate before storing

**Your Pastes**

- Not validated or modified
- Only sent to omg.lol (no third parties)
- Local cache uses VS Code's secure storage

## Known Issues

- OAuth credentials are placeholders (API key auth works)
- Debug logging present (will be removed before 1.0.0)
