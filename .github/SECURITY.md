# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of ArchiGram.ai seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before we've had a chance to fix it
- Use the vulnerability to access data that doesn't belong to you

### Please DO

1. **Email us directly** at security@archigram.ai (or isatimur.work@gmail.com)
2. Include as much information as possible:
   - Type of issue (e.g., XSS, CSRF, injection, etc.)
   - Full paths of source file(s) related to the issue
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Communication**: We will keep you informed of the progress towards a fix and full announcement.
- **Timeline**: We aim to resolve critical vulnerabilities within 7 days of disclosure.
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous).

## Security Best Practices for Contributors

When contributing to ArchiGram.ai, please follow these security guidelines:

### Code Security

- Never commit secrets, API keys, or credentials to the repository
- Use environment variables for all sensitive configuration
- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Follow the principle of least privilege

### Dependencies

- Keep dependencies up to date
- Review security advisories for dependencies
- Use `bun audit` to check for known vulnerabilities
- Prefer well-maintained packages with active security practices

### AI/LLM Security

- Implement rate limiting for AI API calls
- Sanitize user prompts before sending to AI services
- Validate AI-generated output before rendering
- Be aware of prompt injection risks

## Security Features

ArchiGram.ai implements the following security measures:

- **HTTPS Only**: All production traffic is served over HTTPS
- **Content Security Policy**: Strict CSP headers to prevent XSS
- **Input Validation**: User inputs are validated on both client and server
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Dependency Scanning**: Automated security scanning via Dependabot and CodeQL
- **Privacy-First Analytics**: Using Plausible Analytics (no cookies, GDPR compliant)

## Responsible Disclosure

We believe in responsible disclosure and will work with security researchers to understand and address vulnerabilities. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

## Bug Bounty

While we don't currently have a formal bug bounty program, we greatly appreciate security researchers who help improve our security. Significant findings may be rewarded at our discretion.

---

Thank you for helping keep ArchiGram.ai and our users safe!
