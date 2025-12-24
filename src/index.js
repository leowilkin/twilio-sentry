const express = require('express');
const crypto = require('crypto');
const twilio = require('twilio');

const app = express();
app.use(express.json());

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  NOTIFICATION_NUMBERS,
  SENTRY_CLIENT_SECRET,
  PORT = 3000,
} = process.env;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const recipientNumbers = NOTIFICATION_NUMBERS?.split(',').map(n => n.trim()) || [];

function verifySignature(req, secret) {
  if (!secret) return true;
  
  const signature = req.headers['sentry-hook-signature'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(req.body), 'utf8');
  const digest = hmac.digest('hex');
  
  return digest === signature;
}

function formatAlertMessage(payload) {
  const resource = payload.headers?.['sentry-hook-resource'] || 'unknown';
  const { action, data } = payload.body;
  
  // Issue webhooks (Sentry-Hook-Resource: issue)
  // Payload: data.issue with title, project, level, web_url
  if (resource === 'issue' && data?.issue) {
    const issue = data.issue;
    return [
      `🚨 Sentry Issue ${action?.toUpperCase() || 'ALERT'}`,
      `Title: ${issue.title}`,
      `Project: ${issue.project?.name || 'Unknown'}`,
      `Level: ${issue.level || 'error'}`,
      `URL: ${issue.web_url || issue.permalink || 'N/A'}`,
    ].join('\n');
  }
  
  // Issue Alert webhooks (Sentry-Hook-Resource: event_alert)
  // Payload: data.event (the triggering event), data.triggered_rule
  if (resource === 'event_alert' && data?.event) {
    const event = data.event;
    const triggeredRule = data.triggered_rule || 'Unknown rule';
    return [
      `🚨 Sentry Alert Triggered`,
      `Rule: ${triggeredRule}`,
      `Message: ${event.title || event.message || 'No message'}`,
      `Project: ${event.project || 'Unknown'}`,
      `URL: ${event.web_url || 'N/A'}`,
    ].join('\n');
  }
  
  // Metric Alert webhooks (Sentry-Hook-Resource: metric_alert)
  // Payload: data.metric_alert, data.description_title, data.description_text, data.web_url
  // action: critical, warning, or resolved
  if (resource === 'metric_alert') {
    const metricAlert = data.metric_alert || {};
    return [
      `📊 Sentry Metric Alert: ${action?.toUpperCase() || 'ALERT'}`,
      `Title: ${data.description_title || metricAlert.alert_rule?.name || 'Unknown'}`,
      `Description: ${data.description_text || 'N/A'}`,
      `URL: ${data.web_url || 'N/A'}`,
    ].join('\n');
  }
  
  return `🚨 Sentry Notification: ${action || 'Alert'}\n${JSON.stringify(data).slice(0, 200)}`;
}

async function sendSMS(message) {
  const results = [];
  
  for (const to of recipientNumbers) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: TWILIO_FROM_NUMBER,
        to,
      });
      console.log(`SMS sent to ${to}: ${result.sid}`);
      results.push({ to, success: true, sid: result.sid });
    } catch (error) {
      console.error(`Failed to send SMS to ${to}:`, error.message);
      results.push({ to, success: false, error: error.message });
    }
  }
  
  return results;
}

app.post('/webhook/sentry', async (req, res) => {
  if (!verifySignature(req, SENTRY_CLIENT_SECRET)) {
    console.warn('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const resource = req.headers['sentry-hook-resource'];
  console.log(`Received Sentry webhook: ${resource} - ${req.body.action}`);
  
  try {
    const message = formatAlertMessage({ headers: req.headers, body: req.body });
    const results = await sendSMS(message);
    
    res.json({ 
      success: true, 
      message: 'Notification sent',
      results,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Sentry-Twilio integration running on port ${PORT}`);
  console.log(`Webhook endpoint: POST /webhook/sentry`);
});
