import type { ApiRequest, ApiResponse } from './_store';

export default function handler(req: ApiRequest, res: ApiResponse) {
  res.status(200).json({
    SYSTEM_MODE: 'VERIFICATION_ONLY',
    PLATFORM: 'SIRWISE Global Digital Hub',
    CHARTER: 'RC BN3583778',
    PI_TESTNET_ENABLED: process.env.PI_TESTNET_ENABLED !== 'false',
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY || process.env.VITE_FLW_PUBLIC_KEY || process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
    PI_API_KEY_CONFIGURED: !!process.env.PI_API_KEY,
    PI_MAINNET_KYC_WALLET: process.env.PI_MAINNET_KYC_WALLET || '',
    VALIDATION_KEY:
      process.env.VALIDATION_KEY ||
      'f1d2fd990366c6095405cabec435395ab465da166fa9a20d93eb95175cafee6ef988eddcf245344be1f69b19b70712896cd5ce371bf0a8da46ff77f0b5000bc1',
  });
}
