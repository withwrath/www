// Vercel serverless function: POST /api/subscribe  { email }
const RESEND_API = 'https://api.resend.com';
const FROM = 'wrath labs <timo@withwrath.xyz>';

async function resend(path, body) {
  const res = await fetch(RESEND_API + path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Resend ${path} failed (${res.status})`);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    // Confirmation email
    await resend('/emails', {
      from: FROM,
      to: [email],
      subject: "you're on the wrath waitlist!",
      text:
        "thanks for joining the waitlist for hosted inference access.\n\n" +
        "we'll reach out as soon as your spot opens up.\n\n— wrath labs\nhttps://www.withwrath.xyz",
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not subscribe. Please try again.' });
  }
}
