# Security Policy

## Supported Versions

Only the latest version on `main` receives security fixes.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use [GitHub private security advisories](https://github.com/YOUR_GITHUB_ORG/iron-burrow-sentinel-api/security/advisories/new) to report a vulnerability. You will receive a response within 5 business days.

Include as much of the following as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any suggested fix, if you have one

## Scope

This repository is the public-facing Sentinel API layer. It intentionally does not contain real RPC URLs, private indexer schemas, production secrets, or internal gateway routes. If you discover that any such material has been accidentally committed, please report it immediately via the advisory process above.

## Out of Scope

- Vulnerabilities in third-party dependencies (report to the upstream project)
- Issues that require physical access to the server
- Social engineering attacks

## Security Practices in This Codebase

- API keys are stored as HMAC-SHA256 hashes; plaintext keys are never persisted
- Key lookup uses constant-time comparison to prevent timing attacks
- Secrets are injected via environment variables; no defaults are safe for production
- See [docs/public-private-boundary.md](docs/public-private-boundary.md) for what this repository deliberately excludes
