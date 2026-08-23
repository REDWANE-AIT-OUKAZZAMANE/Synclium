# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Synclium, please report it responsibly:

1. **Do not** create a public GitHub issue for security vulnerabilities.
2. Email: `security@synclium.org` or open a private GitHub Security Advisory at [Security Advisories](https://github.com/REDWANE-AIT-OUKAZZAMANE/Synclium/security/advisories).
3. Include:
   - Description of the vulnerability
   - Steps to reproduce (minimal PoC)
   - Potential impact
   - Suggested remediation (if any)

We aim to:
- Acknowledge reports within 48 hours
- Provide initial assessment within 7 days
- Release fixes within 30 days for Critical and High severity issues

---

## Security Architecture & Design Principles

### 1. Zero Ingestion Persistence
- Uploaded invoice files (PDFs, images, XML, JSON, ASTs) are processed **strictly in memory** and never written to disk, databases, or third-party persistent storage.
- File buffers and OCR streams are immediately discarded upon response completion.

### 2. Tiered, Persistent Rate Limiting & Bot Mitigation
To prevent abuse of upstream AI models while protecting privacy, Synclium enforces a persistent, identity-based rate-limiting architecture powered by **Upstash Redis**:

- **Anonymous Tier**: 1 scan per calendar day (UTC). Keyed by `scan:anon:{SHA256(IP + Secret_Salt)}:{YYYY-MM-DD}`.
- **GitHub Authenticated Tier**: 3 scans per calendar day (UTC). Keyed by `scan:auth:{GitHub_User_ID}:{YYYY-MM-DD}` via verified OAuth sessions.
- **General API Protection**: 30 requests/minute per IP hash for pure compute endpoints (`/convert`, `/validate`).
- **Bot Verification**: Cloudflare Turnstile token validation required before AI extraction requests reach quota counters.
- **Fail-Closed Security**: If the rate-limiting persistence layer is unreachable, `/extract` responds with `503 Service Unavailable` rather than failing open to prevent runaway resource exhaustion.
- **Privacy & Retention**:
  - Raw IP addresses are **never logged or persisted**. Only salted SHA-256 hashes are stored.
  - All Redis rate-limiting keys carry an automatic 24-hour TTL (`EXPIRE`) and are permanently cleared after expiry.

### 3. XML & Parser Security
- **XXE Mitigation**: DTD and external entity resolution are disabled across all XML parsers (`fast-xml-parser`, `xmlbuilder2`).
- **Billion Laughs Mitigation**: Recursive entity expansion is strictly prohibited to prevent exponential memory amplification.
- **Structural Integrity**: Node depth and payload size limits (5 MB maximum) prevent stack-overflow DoS.

### 4. Production Deployment Guidance
- In production deployments, host Synclium behind a hardened reverse proxy (e.g. Cloudflare, Nginx, or AWS ALB) with TLS 1.3, strict CORS, and WAF rules.
- Set a strong, randomly generated `IP_HASH_SALT` and `AUTH_SECRET` in production.
