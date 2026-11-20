// E-mail sending. Uses SMTP when configured; otherwise records the message as "simulated".
import nodemailer from 'nodemailer';
import { settings } from '../config.js';
import MailOutbox from '../models/MailOutbox.js';

const { host, port, user, password, from } = settings.smtp;
const transport = host && from
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: user ? { user, pass: password } : undefined })
  : null;

async function deliver(to, subject, text) {
  if (!transport || !to) return 'simulated';
  try { await transport.sendMail({ from, to, subject, text }); return 'sent'; }
  catch (err) { console.warn(`mail to ${to} failed: ${err.message}`); return 'failed'; }
}

async function sendMail(to, subject, body) {
  const status = await deliver(to, subject, body);
  await MailOutbox.create({ to, subject, body, status });
}

/** Fire-and-forget: a mail problem must never break an API call. */
export function queueMails(recipients, subject, body) {
  for (const to of new Set(recipients.filter(Boolean))) {
    setImmediate(() => sendMail(to, subject, body).catch((e) => console.warn('mail log failed:', e.message)));
  }
}
