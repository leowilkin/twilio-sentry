# AGENTS.md

## Commands
- **Start**: `npm start` or `node src/index.js`
- **Dev (watch mode)**: `npm run dev`
- **No test/lint/typecheck commands** — there are no tests, linter, or type-checker configured.

## Architecture
Single-file Express (v4) server (`src/index.js`) that receives Sentry webhook POST requests at `/webhook/sentry`, formats alert messages, and sends SMS via the Twilio SDK. A `/health` GET endpoint returns status. Deployable via Docker (Node 20 Alpine). All configuration is via environment variables (see `.env.example`).

Key functions: `verifySignature` (HMAC-SHA256), `formatAlertMessage` (handles issue, event_alert, metric_alert resources), `getRecipientsForProject` (per-project routing via `PROJECT_ROUTES` JSON env var), `sendSMS`.

## Code Style
- **Runtime**: Node.js, plain JavaScript (CommonJS `require`).
- **Formatting**: 2-space indent, single quotes, trailing commas.
- **Naming**: camelCase for variables/functions, UPPER_SNAKE_CASE for env vars.
- **Error handling**: try/catch with `console.error`; HTTP errors return JSON `{ error }`.
- **Dependencies**: only `express` and `twilio` — keep it minimal.
- **Secrets**: loaded from env vars, never hardcoded. Do not log or commit secrets.
