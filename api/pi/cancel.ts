import { getDatabase, saveDatabase, parseBody, type ApiRequest, type ApiResponse } from '../_store';

const PI_TESTNET_API_URL = 'https://api.testnet.minepi.com';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { paymentId } = parseBody(req);
    if (!paymentId) {
      res.status(400).json({ success: false, error: 'Missing paymentId' });
      return;
    }

    const apiKey = process.env.PI_API_KEY || '';
    if (apiKey && !apiKey.includes('placeholder')) {
      const response = await fetch(`${PI_TESTNET_API_URL}/v2/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const data = await response.text();
        console.error('Pi Testnet cancel API error:', data);
      }
    }

    const db = getDatabase();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.auditLogs.unshift({
      id: `AL-${Date.now()}`,
      action: `Incomplete Pi Testnet payment ${paymentId} cancelled.`,
      timestamp,
      user: 'system@sirwise.store',
      severity: 'info',
    });
    saveDatabase(db);

    res.status(200).json({ success: true, status: 'CANCELLED', paymentId });
  } catch (err: any) {
    console.error('Pi Testnet cancel error:', err);
    res.status(200).json({ success: true, status: 'CANCELLED', paymentId: parseBody(req).paymentId });
  }
}
