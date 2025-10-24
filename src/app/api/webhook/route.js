import { createHmac, timingSafeEqual } from 'crypto';

export async function POST(req) {
  const body = await req.text();
  const secret = process.env.WEBHOOK_SECRET;

  if (secret) {
    const header =
      req.headers.get('x-signature') ||
      req.headers.get('x-hub-signature') ||
      '';

    if (!header) {
      return new Response('Missing signature', { status: 401 });
    }

    // Support headers like: "sha256=<hex>" or just "<hex>"
    const sig = header.includes('=') ? header.split('=')[1] : header;
    const expected = createHmac('sha256', secret).update(body).digest('hex');

    try {
      const sigBuf = Buffer.from(sig, 'hex');
      const expectedBuf = Buffer.from(expected, 'hex');

      if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        return new Response('Invalid signature', { status: 401 });
      }
    } catch (e) {
      return new Response('Invalid signature format', { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(body);
    // TODO: replace with your actual webhook processing (DB update, queue job, etc.)
    console.log('Webhook received:', payload);

    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response('Bad Request', { status: 400 });
  }
}
