# Security Policy

## Reporting a vulnerability

Please do **not** report security vulnerabilities in public issues, pull requests or discussions.

Report them privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability** (private security advisory). Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- The affected component (app, backend, a specific package) and version or commit
- Any suggested fix

We aim to acknowledge reports within 3 business days and to keep you updated until the issue is resolved. Please give us reasonable time to fix the issue before any public disclosure.

## Scope

In scope: the code in this repository, including authentication, tenant isolation (row-level security), billing and plan enforcement, webhook handling, credential storage (the vault) and the workflow runtime.

Out of scope: vulnerabilities in third-party services we integrate with (Supabase, Stripe, Vapi, Composio, Inngest, Vercel), and issues that require a compromised user device or already-leaked credentials.

## Handling secrets

Never include real API keys, tokens or database credentials in issues, pull requests or logs. If you find a leaked secret in the repository or its history, report it privately as above so it can be rotated.
