# Rabbitbrain

Rabbitbrain is a CLI-focused project for analyzing tweets and turning them into personalized learning tracks.

## Features

- Tweet analysis from X URLs/IDs via `xurl`
- Account takeaways from followed X accounts:
  - Follow an account in the web app or CLI
  - Analyze the latest 20 posts into a concise summary plus bullet takeaways
  - Inspect the exact source posts behind each daily snapshot
  - Keep snapshot history per account
- OpenAI-powered extraction of:
  - Topic
  - Summary
  - Intent
  - 5 novel concepts from each tweet
- Interactive learning mode (`--learn`) that:
  - Collects concept familiarity and interest scores (1-5)
  - Prioritizes concepts by novelty and interest
  - Generates a 7-day Feynman learning track (10 min/day, Learn/Explain/Check)
- Model selection per run (`--model`, `--choose-model`)
- Onboarding helper for local setup (`npm run onboarding`)

## Requirements

- Node.js 20+
- `xurl` installed and authenticated for X API access
- OpenAI API key configured

## Setup

```bash
npm install
npm run onboarding
npm run xurl:analyze:auth
```

## Usage

Analyze a tweet:

```bash
npm run xurl:analyze -- "https://x.com/user/status/1234567890"
```

Analyze and generate a learning track:

```bash
npm run xurl:analyze -- "https://x.com/user/status/1234567890" --learn
```

Choose a model interactively:

```bash
npm run xurl:analyze -- "https://x.com/user/status/1234567890" --choose-model
```

Use a specific model:

```bash
npm run xurl:analyze -- "https://x.com/user/status/1234567890" --model gpt-4.1
```

Follow an account for takeaway tracking:

```bash
npm run xurl:takeaway -- follow ctatedev
```

Refresh one account takeaway:

```bash
npm run xurl:takeaway -- refresh ctatedev
```

Refresh all followed account takeaways:

```bash
npm run xurl:takeaway -- refresh --all
```

Show the latest takeaway for an account:

```bash
npm run xurl:takeaway -- show ctatedev
```

Show full takeaway history for an account:

```bash
npm run xurl:takeaway -- show ctatedev --history
```

## Web App

- `/app/takeaway` is the dedicated workspace for account takeaways
- The page lets a signed-in user follow an account, manually refresh its takeaway, inspect source posts, and browse daily history
- Daily refreshes are triggered by the internal cron route `/api/internal/takeaways/refresh`

## Development

```bash
npm run check
npm test
```

## Deployment Notes

- Web account takeaways require the existing X API credentials plus a `CRON_SECRET` value for the internal refresh route
- Vercel cron is configured to call the takeaway refresh route once per day
- CLI takeaway state is stored locally in the Rabbitbrain config directory alongside provider config

## Releases

Rabbitbrain uses Changesets and GitHub Releases.

```bash
npm run changeset
```

Maintainers merge changesets into `main`, and GitHub Actions versions the repo, publishes packages, deploys the web app, and attaches the extension zip to the GitHub Release from the resulting `main` push.

## Documentation

- xurl setup and safety notes: `docs/xurl.md`
- Release runbook: `docs/releases.md`
- Agent instructions: `AGENTS.md`

## License

MIT. See [LICENSE](./LICENSE).
