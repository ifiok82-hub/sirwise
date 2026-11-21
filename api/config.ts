import type { ApiRequest, ApiResponse } from './_store.js';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const configured = Boolean((process.env.PI_NETWORK_API_KEY || process.env.PI_API_KEY || '').trim());
  res.status(200).json({
    SYSTEM_MODE: 'VERIFICATION_ONLY',
    PLATFORM: 'SIRWISE Global Digital Hub',
    CHARTER: 'RC BN3583778',
    PI_TESTNET_ENABLED: true,
    PI_API_KEY_CONFIGURED: configured,
    PI_NETWORK_API_KEY_CONFIGURED: configured,
    VALIDATION_KEY:
      process.env.VALIDATION_KEY ||
      'f1d2fd990366c6095405cabec435395ab465da166fa9a20d93eb95175cafee6ef988eddcf245344be1f69b19b70712896cd5ce371bf0a8da46ff77f0b5000bc1',
  });
}
