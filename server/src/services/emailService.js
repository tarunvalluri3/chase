import { Resend } from 'resend';

let client;

function getClient() {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY in environment');
    }
    client = new Resend(apiKey);
  }
  return client;
}

// Thin wrapper around Resend: sends exactly one email, nothing else. Throws
// on failure -- callers (notificationService) are responsible for catching
// and deciding what that means for retries/logging, this module has no
// opinion on either.
export async function sendEmail({ to, subject, html, text }) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error('Missing RESEND_FROM_EMAIL in environment');
  }

  const { data, error } = await getClient().emails.send({ from, to, subject, html, text });

  if (error) {
    throw new Error(error.message ?? 'Resend send failed');
  }

  return data;
}
