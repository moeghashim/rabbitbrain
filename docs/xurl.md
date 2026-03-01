# xurl Setup and Safe Usage

This project uses `xurl` for X API operations and agent workflows.

## What is installed

- Codex skill: `xurl` (project scope)
- CLI binary: `xurl` (installed via Homebrew cask)

Verify:

```bash
npx skills list
xurl version
```

## Authentication (manual and safe)

Do authentication setup manually on your machine, outside agent sessions.

Required redirect URI in X Developer Portal:

```text
http://localhost:8080/callback
```

Recommended auth flow:

```bash
xurl auth oauth2
```

Check current auth state:

```bash
xurl auth status
```

## Security policy

- Never paste secrets in chat.
- Never run secret-bearing auth flags in agent sessions.
- Never use `-v` or `--verbose` in agent sessions.
- Never read or print `~/.xurl` in agent sessions.

Forbidden secret flags in agent sessions include:

- `--bearer-token`
- `--consumer-key`
- `--consumer-secret`
- `--access-token`
- `--token-secret`
- `--client-id`
- `--client-secret`

## Default commands

```bash
xurl whoami
xurl search "from:XDevelopers" -n 10
xurl post "Hello from xurl"
xurl /2/users/me
```

## npm shortcuts in this repo

```bash
npm run xurl:status
npm run xurl:whoami
npm run xurl:search
```

## Expected behavior before auth

If authentication is not configured yet, `whoami` and `search` may fail with an auth error. That is expected until OAuth setup is complete.
