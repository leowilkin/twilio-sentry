GONE are the days of silent sentry errors only to hit you in your sleep when you check slack or your inbox to find... production error after production error...

now, you can get them hand delivered straight to your SMS inbox. don't like them? fix them then..

anyways, continue for the real README.

# Sentry → Twilio SMS Integration

Receives Sentry incident webhooks and sends SMS notifications via Twilio.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

## Sentry Configuration

1. Go to **Settings → Developer Settings** in Sentry
2. Create a new **Internal Integration**
3. Set the **Webhook URL** to: `https://your-domain.com/webhook/sentry`
4. Enable webhook subscriptions for:
   - Issue (created, resolved, assigned, etc.)
   - Event Alert (for alert rule triggers)
   - Metric Alert (for metric-based alerts)
5. Copy the **Client Secret** to your `.env` file for signature verification

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Twilio phone number to send from |
| `NOTIFICATION_NUMBERS` | Comma-separated recipient phone numbers |
| `SENTRY_CLIENT_SECRET` | (Optional) For webhook signature verification |
| `PORT` | Server port (default: 3000) |

## Endpoints

- `POST /webhook/sentry` - Receives Sentry webhooks
- `GET /health` - Health check endpoint

## Docker

```bash
docker build -t sentry-twilio .
docker run -p 3000:3000 --env-file .env sentry-twilio
```

## Testing

Use ngrok or similar to expose your local server for testing:
```bash
ngrok http 3000
```
