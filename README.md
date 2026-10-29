# MOMENTRA

MOMENTRA is a planning command center for weddings, birthdays, anniversaries, and community events. It combines budget planning, timeline management, vendors, guests, run-of-show scheduling, risks, ideas, and an AI/local copilot in one responsive Next.js application.

## Requirements

- Node.js 18 or newer
- npm

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Enables Gemini responses for the Copilot. Without it, MOMENTRA uses its deterministic local engine. |
| `NEXT_PUBLIC_APP_ENV` | No | Application environment label, such as `development` or `production`. |

## Demo walkthrough

1. Open the welcome screen and select one of the seeded demo events.
2. Review the overview, budget, timeline, vendors, guests, run of show, risks, and ideas tabs.
3. Edit planning data and observe Ripple Replanning updates to related entities.
4. Use Copilot for planning suggestions or budget scenarios.
5. Export event data as PDF or CSV from the relevant dashboard surfaces.

Event data is persisted in browser storage, so the demo remains usable without a backend database or API key.

## Architecture

- `src/app` contains the Next.js App Router pages and the server-side Copilot route.
- `src/components` contains the dashboard and shared UI.
- `src/context`, `src/hooks`, and `src/data` provide application state, seeded events, and persistence.
- `src/lib` contains deterministic budget, timeline, risk, ripple, export, and currency engines.
- `src/types` and `src/schemas` define the domain contracts and runtime validation.

## Validation

```bash
npm test
npm run build
```

The test suite covers the calculation engines and persistence boundaries.

## Product capabilities

- Browser persistence keeps event plans available across reloads without a database.
- The deterministic local Copilot engine provides complete planning workflows without credentials.
- Optional Gemini integration adds live AI suggestions while keeping calculations and changeset application authoritative in MOMENTRA.
- PDF and CSV exports are generated directly from the current event state.

## Deployment

The app can be deployed to Vercel or another Node-compatible Next.js host:

```bash
npm run build
npm start
```

Set `GEMINI_API_KEY` in the deployment environment if Gemini-powered responses are desired.
