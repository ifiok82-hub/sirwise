import { parseBody, type ApiRequest, type ApiResponse } from '../_store';
import { approvePiPayment } from '../_pi';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { paymentId, userUid, productId } = parseBody(req);
    const result = await approvePiPayment({
      paymentId,
      expectedUserUid: userUid,
      productIdHint: productId,
    });
    res.status(result.httpStatus).json(result.body);
  } catch (err: any) {
    console.error('Pi approve error:', err?.message || 'Unknown error');
    res.status(500).json({ success: false, error: 'Failed to approve Pi payment' });
  }
}
