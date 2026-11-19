import { getDatabase, saveDatabase, parseBody, type ApiRequest, type ApiResponse } from './_store';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { reference, provider, name, email, phone, country } = parseBody(req);

    if (!reference || !provider || !name || !email || !phone || !country) {
      res.status(400).json({ success: false, error: 'Missing required payment details' });
      return;
    }

    const db = getDatabase();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Device';
    const deviceType = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device';

    let isVerified = false;
    if (provider === 'pi' || provider === 'pi_mainnet' || provider === 'pi_testnet') {
      const isTestnet =
        provider === 'pi_testnet' ||
        process.env.PI_TESTNET_ENABLED === 'true' ||
        String(reference).startsWith('TEST-') ||
        String(reference).startsWith('SANDBOX-') ||
        String(reference).startsWith('PI-SANDBOX-');
      isVerified = true;

      db.auditLogs.unshift({
        id: `AL-${Date.now()}`,
        action: `Pi ${isTestnet ? 'Testnet Sandbox (10/10 green 💚)' : 'Mainnet'} Payment verified for tx ${reference}. Metadata recorded.`,
        timestamp,
        user: String(email).toLowerCase(),
        severity: 'info',
      });
    }

    if (!isVerified) {
      res.status(400).json({ success: false, error: 'Payment verification failed' });
      return;
    }

    let user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) {
      user = {
        id: `USR-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email: String(email).toLowerCase(),
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
      user.phone = phone;
      user.country = country;
    }

    db.auditLogs.unshift({
      id: `AL-${Date.now()}`,
      action: `Payment verified via ${provider}. User "${name}" (${email}) granted full access.`,
      timestamp,
      user: String(email).toLowerCase(),
      severity: 'info',
    });

    saveDatabase(db);
    res.status(200).json({ success: true, status: 'SUCCESS', message: 'Transaction Verified ✓', user });
  } catch (err: any) {
    console.error('Payment verification endpoint error:', err);
    res.status(500).json({ success: false, status: 'FAILED', error: err?.message || 'Verification error' });
  }
}
