# krrt7.dev

TypeScript-only Next.js implementation of the krrt7.dev portfolio site.

## What it does

- Serves the portfolio homepage at `/`
- Pulls GitHub repos and contribution data for `krrt7`
- Renders the dark hero/about/projects/contributions layout from the latest site
- Keeps route assets, metadata routes, and app behavior under `src/app`

## Setup

```console
bun install
```

For live GitHub data, set `GITHUB_TOKEN` or authenticate with `gh auth login`.
Without a token, the app renders with empty GitHub data.

## Run

```console
bun dev
```

Then open `http://127.0.0.1:3000/`.

## Build

```console
bun run build
```
