import { parseBody, type ApiRequest, type ApiResponse } from '../_store.js';
import { verifyRecordedPayment } from '../_pi.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const body = parseBody(req);
    const query = req.query || {};
    const reference = String(body.reference || query.reference || body.tx_ref || query.tx_ref || '');
    const email = String(body.email || query.email || '');

    const result = verifyRecordedPayment({ reference, email });
    res.status(result.httpStatus).json(result.body);
  } catch (err: any) {
    res.status(500).json({ success: false, status: 'FAILED', error: 'Callback verification failed' });
  }
}
