# Development Rules

## Code Quality
- No `any` types unless absolutely necessary.
- Check `node_modules` for external API type definitions instead of guessing.
- NEVER use inline imports:
  - no `await import("./foo.js")`
  - no `import("pkg").Type` in type positions
  - no dynamic imports for types
  - always use standard top-level imports
- Never remove functionality to fix type errors from outdated dependencies; upgrade dependencies instead.
- Always ask before removing functionality that appears intentional.

## Style
- ESM TypeScript.
- Relative imports must include `.js` extension.
- Keep public APIs in `src/index.ts` (re-export), keep internals in separate modules.
- No emojis in commit messages or code comments.

## Commands
- After code changes (not docs changes): `npm run check`
- Fix all errors, warnings, and infos before committing.

## Git
- Never commit unless explicitly requested.
