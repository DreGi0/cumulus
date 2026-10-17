# Security Policy

## Supported versions

Cumulus has no stable release yet. Until the first release, security fixes
apply to the latest commit on `main`. This table will list supported
versions once packages are published.

| Version | Supported           |
| ------- | ------------------- |
| `main`  | Yes                 |
| < 1.0   | Latest release only |

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Report privately using either:

1. GitHub private vulnerability reporting: go to the repository's
   **Security** tab and choose **Report a vulnerability**.
2. Email andreiraheta28@gmail.com.

Include:

- A description of the issue and its impact.
- Steps to reproduce, ideally with a minimal asset file.
- The affected package and version or commit.

## What to expect

- Acknowledgement within 7 days.
- An assessment and a plan or fix timeline after triage.
- Credit in the release notes if you want it.

## Scope

In scope: parsing of untrusted asset files (crashes, resource exhaustion),
script injection through the web renderer, and vulnerabilities in the
published packages and CLI.

Out of scope: issues in third-party dependencies that are already reported
upstream, and problems that require a compromised development machine.
