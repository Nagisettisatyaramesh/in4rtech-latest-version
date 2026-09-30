/**
 * Contact form endpoint (Vercel serverless function): POST /api/contact
 *
 * Sends the enquiry by email via Resend (https://resend.com), so no email address
 * appears anywhere in the website's HTML or JavaScript.
 *
 * Required environment variables (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY  – API key from Resend
 *   CONTACT_TO      – the inbox that should receive enquiries
 *   CONTACT_FROM    – optional sender, e.g. "In4rtech Website <website@in4rtech.com>"
 *                     (the domain must be verified in Resend; defaults to Resend's test sender)
 */
const MAX = { name: 120, email: 200, organisation: 160, area: 80, subject: 200, message: 5000 };
const AREAS = ['Enterprise Architecture', 'AI Consulting', 'Intelligent Automation', 'Technology Strategy', 'Digital Transformation', 'Cloud & Platform Modernisation', 'Not sure yet'];

const line = (v, max) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const text = (v, max) => String(v == null ? '' : v).replace(/\r\n?/g, '\n').trim().slice(0, max);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Honeypot: real visitors never fill this hidden field
  if (line(body.website, 200)) return res.status(200).json({ ok: true });

  const data = {
    name: line(body.name, MAX.name),
    email: line(body.email, MAX.email),
    organisation: line(body.organisation, MAX.organisation),
    area: AREAS.includes(line(body.area, MAX.area)) ? line(body.area, MAX.area) : 'Not sure yet',
    subject: line(body.subject, MAX.subject),
    message: text(body.message, MAX.message),
  };
  if (!data.name || !data.subject || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ ok: false, error: 'Please complete all required fields.' });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || 'In4rtech Website <onboarding@resend.dev>';
  if (!key || !to) return res.status(500).json({ ok: false, error: 'Email is not configured.' });

  const plain = [
    'New enquiry from the In4rtech website', '',
    'Name: ' + data.name,
    'Email: ' + data.email,
    'Organisation: ' + (data.organisation || '—'),
    'Area of interest: ' + data.area,
    'Subject: ' + data.subject, '',
    data.message,
  ].join('\n');
  const html =
    '<h2 style="font-family:Arial,sans-serif">New enquiry from the In4rtech website</h2>' +
    '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
    [['Name', data.name], ['Email', data.email], ['Organisation', data.organisation || '—'], ['Area of interest', data.area], ['Subject', data.subject]]
      .map(([k, v]) => '<tr><td style="padding:4px 12px 4px 0;color:#555">' + k + '</td><td style="padding:4px 0"><b>' + esc(v) + '</b></td></tr>').join('') +
    '</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;margin-top:16px">' + esc(data.message) + '</p>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to], reply_to: data.email,
        subject: '[Website enquiry] ' + data.area + ' – ' + data.subject,
        text: plain, html,
      }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'Email service error.' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Email service unavailable.' });
  }
};
