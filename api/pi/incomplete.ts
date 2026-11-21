import { parseBody, type ApiRequest, type ApiResponse } from '../_store.js';
import { handleIncompletePiPayment } from '../_pi.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { paymentId, txid, userUid, email, name, phone, country } = parseBody(req);
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Device';
    const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device';

    const result = await handleIncompletePiPayment({
      paymentId,
      txid,
      expectedUserUid: userUid,
      email,
      name,
      phone,
      country,
      device,
    });
    res.status(result.httpStatus).json(result.body);
  } catch (err: any) {
    console.error('Pi incomplete payment handler error:', err?.message || 'Unknown error');
    res.status(500).json({ success: false, error: 'Failed to process incomplete Pi payment' });
  }
}
