# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Synclium / OpenInvoiceBridge, please report it responsibly:

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

## Security Design & Best Practices

- **Zero Data Persistence**: Uploaded invoice files (PDFs, images, XML, JSON) are processed strictly in memory and never written to disk or third-party storage.
- **XML Security**:
  - DTD Entity expansion is disabled to prevent XML External Entity (XXE) injection.
  - Recursive entity expansion is blocked against Billion Laughs amplification attacks.
  - Deep nesting limits are enforced to prevent stack overflow DoS.
- **API Hardening**:
  - Rate limiting enforced via `@fastify/rate-limit` per client IP.
  - Maximum payload size capped to 5MB to mitigate memory exhaustion.
  - Safe path sanitization on all filesystem operations.
- **Production Guidance**:
  - In production deployments, always run the API behind a hardened reverse proxy (e.g. Nginx, Cloudflare) with TLS 1.3 and WAF rules.
