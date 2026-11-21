import { parseBody, type ApiRequest, type ApiResponse } from './_store.js';
import { verifyRecordedPayment } from './_pi.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { reference, email } = parseBody(req);
    const result = verifyRecordedPayment({ reference, email });
    res.status(result.httpStatus).json(result.body);
  } catch (err: any) {
    console.error('Payment verification endpoint error:', err?.message || 'Unknown error');
    res.status(500).json({ success: false, status: 'FAILED', error: 'Verification error' });
  }
}
