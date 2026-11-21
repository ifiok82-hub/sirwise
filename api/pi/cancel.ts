import { parseBody, type ApiRequest, type ApiResponse } from '../_store.js';
import { cancelPiPayment } from '../_pi.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { paymentId } = parseBody(req);
    const result = await cancelPiPayment({ paymentId });
    res.status(result.httpStatus).json(result.body);
  } catch (err: any) {
    console.error('Pi cancel error:', err?.message || 'Unknown error');
    res.status(500).json({ success: false, error: 'Failed to cancel Pi payment' });
  }
}
