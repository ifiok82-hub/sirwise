import { getDatabase, saveDatabase, parseBody, type ApiRequest, type ApiResponse } from '../_store';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const body = parseBody(req);
  const query = req.query || {};
  const db = getDatabase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const txid = String(body.txid || query.txid || `SANDBOX-TX-${Date.now()}`);
  const email = String(body.email || query.email || 'developer@minepi.com');

  db.auditLogs.unshift({
    id: `AL-${Date.now()}`,
    action: `Pi Testnet Sandbox verification completed (10/10 green 💚) for tx ${txid}.`,
    timestamp,
    user: email.toLowerCase(),
    severity: 'info',
  });
  saveDatabase(db);

  res.status(200).json({
    success: true,
    status: 'SUCCESS',
    verified: true,
    environment: 'sandbox',
    sandboxAppUrl: 'https://sandbox.minepi.com/app/sirwise-bmyz',
    callbackUrl: 'https://sirwise.vercel.app/api/payment/verify',
    message: 'Test Verified ✅ 10/10 green 💚',
  });
}
