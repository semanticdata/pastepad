# Security Policy

## Reporting Vulnerabilities

Email security issues to: [database@omg.lol](mailto:database@omg.lol)

## How Your Data is Protected

**Credentials**

- Stored using VS Code's `secrets` API (encrypted at rest)
- Only transmitted to api.omg.lol via HTTPS
- Never included in error messages or user-visible output
- Sensitive keys automatically redacted from logs: `password`, `token`, `secret`, `authorization`, `apikey`

**Authentication**

- API key input is masked during entry (password field)
- Credentials validated with omg.lol API before storage
- OAuth infrastructure implemented but temporarily disabled (pending client_id/client_secret configuration)
- OAuth uses `state` parameter to prevent CSRF when enabled

**Your Pastes**

- Content never validated or modified by the extension
- Only transmitted to omg.lol via HTTPS
- Local cache uses VS Code's workspace state
- Paste content is not logged

**Network Security**

- All API requests use HTTPS
- TLS encryption enforced for all communication with api.omg.lol
- No HTTP fallback

**Logging & Error Handling**

- Structured logging with configurable levels (debug, info, warn, error)
- Default log level: info
- Automatic redaction of sensitive data from metadata
- Credentials never logged

## Known Issues

- Console.error in error handler
- OAuth client credentials are placeholders (OAuth flow not currently active)
