# Rabbitbrain

Rabbitbrain is a CLI-focused project for analyzing tweets and turning them into personalized learning tracks.

## Features

- Tweet analysis from X URLs/IDs via `xurl`
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

## Development

```bash
npm run check
npm test
```

## Documentation

- xurl setup and safety notes: `docs/xurl.md`
- Agent instructions: `AGENTS.md`

## License

MIT. See [LICENSE](./LICENSE).
