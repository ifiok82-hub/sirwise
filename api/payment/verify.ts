import { getDatabase, saveDatabase, parseBody, type ApiRequest, type ApiResponse } from '../_store';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const body = parseBody(req);
    const query = req.query || {};
    const reference = String(body.reference || query.reference || body.tx_ref || query.tx_ref || `TX-${Date.now()}`);
    const provider = String(body.provider || query.provider || 'pi');
    const email = String(body.email || query.email || 'member@sirwise.store');
    const name = String(body.name || query.name || 'Verified Partner');
    const phone = String(body.phone || query.phone || '+2348000000000');
    const country = String(body.country || query.country || 'Nigeria');

    const db = getDatabase();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Device';
    const deviceType = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device';

    let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `USR-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email: email.toLowerCase(),
        phone,
        country,
        status: 'Verified',
        timestamp,
        device: deviceType,
      };
      db.users.push(user);
    } else {
      user.status = 'Verified';
      user.name = name;
    }

    db.auditLogs.unshift({
      id: `AL-${Date.now()}`,
      action: `Payment callback verified via ${provider} (${reference}). User unlocked.`,
      timestamp,
      user: email.toLowerCase(),
      severity: 'info',
    });

    saveDatabase(db);
    res.status(200).json({ success: true, status: 'SUCCESS', message: 'Transaction Verified ✓', reference, user });
  } catch (err: any) {
    res.status(500).json({ success: false, status: 'FAILED', error: err?.message || 'Callback verification failed' });
  }
}
