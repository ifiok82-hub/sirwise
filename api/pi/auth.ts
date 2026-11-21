import crypto from 'crypto';
import { getDatabase, saveDatabase, parseBody, type ApiRequest, type ApiResponse } from '../_store.js';

const APP_STUDIO_LOGIN_URL = 'https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'DELETE') {
    res.setHeader(
      'Set-Cookie',
      'sirwise_pi_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None'
    );
    res.status(200).json({ authenticated: false });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ authenticated: false, error: 'Method not allowed' });
    return;
  }

  try {
    // Trust ONLY the accessToken from the request body; ignore any browser-supplied uid/username
    const { accessToken } = parseBody(req);
    if (!accessToken || typeof accessToken !== 'string') {
      res.status(400).json({ authenticated: false, error: 'Missing Pi accessToken' });
      return;
    }

    const appStudioRes = await fetch(APP_STUDIO_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    if (!appStudioRes.ok) {
      const errText = await appStudioRes.text();
      console.error('App Studio Pi login failed:', appStudioRes.status, errText);
      res.status(401).json({ authenticated: false, error: 'Pi authentication verification failed' });
      return;
    }

    const data: any = await appStudioRes.json();
    const verifiedUid = data?.user?.uid;
    const verifiedUsername = data?.user?.username;

    if (!verifiedUid || !verifiedUsername) {
      res.status(401).json({ authenticated: false, error: 'Invalid App Studio user identity response' });
      return;
    }

    const sessionToken = data?.sessionToken || crypto.randomBytes(24).toString('hex');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const db = getDatabase();

    const syntheticEmail = `${verifiedUsername}@pi.pioneer`.toLowerCase();
    let user = db.users.find((u) => u.email.toLowerCase() === syntheticEmail);
    if (!user) {
      user = {
        id: `PI-${verifiedUid.slice(0, 12)}`,
        name: verifiedUsername,
        email: syntheticEmail,
        phone: '+0000000000',
        country: 'Global',
        status: 'Pending',
        timestamp,
        device: 'Pi Browser',
      };
      db.users.push(user);
    }

    db.auditLogs.unshift({
      id: `AL-${Date.now()}`,
      action: `Pi App Studio auth verified for @${verifiedUsername} (uid: ${verifiedUid}).`,
      timestamp,
      user: syntheticEmail,
      severity: 'info',
    });
    saveDatabase(db);

    res.setHeader(
      'Set-Cookie',
      `sirwise_pi_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; Secure; SameSite=None`
    );

    res.status(200).json({
      authenticated: true,
      sessionToken,
      user: {
        uid: verifiedUid,
        username: verifiedUsername,
      },
    });
  } catch (err: any) {
    console.error('Pi auth endpoint error:', err);
    res.status(500).json({ authenticated: false, error: 'Internal authentication error' });
  }
}
