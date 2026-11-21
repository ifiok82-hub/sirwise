import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export interface ApiRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse extends ServerResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  send: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => this;
}

export interface PiPaymentRecord {
  paymentId: string;
  txid?: string;
  userUid: string;
  productId: string;
  amount: number;
  direction: 'user_to_app';
  network?: string;
  status: 'created' | 'approved' | 'completed' | 'cancelled';
  fulfilled: boolean;
  fulfilledAt?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementRecord {
  userUid: string;
  productId: string;
  paymentId: string;
  txid: string;
  grantedAt: string;
}

export interface DatabaseSchema {
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    status: 'Verified' | 'Revoked' | 'Pending';
    timestamp: string;
    device: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  downloads: Array<{
    id: string;
    productId: string;
    productName: string;
    userEmail: string;
    timestamp: string;
  }>;
  piPayments?: PiPaymentRecord[];
  entitlements?: EntitlementRecord[];
}

const TMP_DB_FILE = '/tmp/sirwise-db.json';

export function parseBody(req: ApiRequest): Record<string, any> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function normalizeDb(parsed: Partial<DatabaseSchema>): DatabaseSchema {
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    downloads: Array.isArray(parsed.downloads) ? parsed.downloads : [],
    piPayments: Array.isArray(parsed.piPayments) ? parsed.piPayments : [],
    entitlements: Array.isArray(parsed.entitlements) ? parsed.entitlements : [],
  };
}

export function getDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      return normalizeDb(JSON.parse(fs.readFileSync(TMP_DB_FILE, 'utf-8')));
    }
    const repoDb = path.resolve(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(repoDb)) {
      return normalizeDb(JSON.parse(fs.readFileSync(repoDb, 'utf-8')));
    }
  } catch (err) {
    console.error('Database read warning:', err);
  }
  return normalizeDb({
    auditLogs: [
      {
        id: 'AL-1',
        action: 'SIRWISE Global Digital Hub serverless store initialized.',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'SYSTEM',
        severity: 'info',
      },
    ],
  });
}

export function saveDatabase(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(TMP_DB_FILE, JSON.stringify(normalizeDb(db), null, 2), 'utf-8');
  } catch (err) {
    console.error('Database write warning:', err);
  }
}

const AUTHORITATIVE_PRODUCTS_FALLBACK = [
  { id: 'prod-course-mba', sku: 'SKU-SIR-MBA-ACC', name: 'MBA Digital Acceleration Program', category: 'courses', priceUSD: 99, pricePI: 10, downloadUrl: '/downloads/sirwise-mba-program-kit.zip' },
  { id: 'prod-ebook-sovereign', sku: 'SKU-SIR-SOV-WEALTH', name: 'Sovereign Wealth Guide', category: 'ebooks', priceUSD: 49, pricePI: 5, downloadUrl: '/downloads/sirwise-sovereign-wealth-guide.pdf' },
  { id: 'prod-temp-pitch', sku: 'SKU-SIR-PITCH-DECK', name: 'Venture Pitch Deck Master Template', category: 'templates', priceUSD: 59, pricePI: 6, downloadUrl: '/downloads/sirwise-venture-pitch-deck.zip' },
  { id: 'prod-saas-ledger', sku: 'SKU-SIR-LEDGER-ACC', name: 'LedgerWise Cloud Accounting Software', category: 'saas', priceUSD: 79, pricePI: 8, downloadUrl: '/downloads/sirwise-ledgerwise-software.zip' },
  { id: 'prod-asset-media', sku: 'SKU-SIR-MEDIA-VAULT', name: 'Creative Media Asset Vault', category: 'assets', priceUSD: 69, pricePI: 7, downloadUrl: '/downloads/sirwise-creative-media-vault.zip' },
  { id: 'prod-consult-mentorship', sku: 'SKU-SIR-CONSULT-MENT', name: 'Elite Consulting & Mentorship Session', category: 'consulting', priceUSD: 199, pricePI: 20, downloadUrl: '/downloads/sirwise-consulting-booking.pdf' },
  { id: 'prod-temp-calc', sku: 'SKU-SIR-VAL-CALC', name: 'Professional Valuation Calculators Package', category: 'templates', priceUSD: 49, pricePI: 5, downloadUrl: '/downloads/sirwise-valuation-calculators.zip' },
  { id: 'prod-course-ai', sku: 'SKU-SIR-AI-PROF', name: 'AI Professor Masterclass & Toolkit', category: 'saas', priceUSD: 89, pricePI: 9, downloadUrl: '/downloads/sirwise-ai-professor-blueprint.zip' },
];

export function getProductsList(): Array<{
  id: string;
  sku: string;
  name: string;
  category: string;
  priceUSD: number;
  pricePI: number;
  downloadUrl: string;
}> {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'products.json'),
      path.resolve('/var/task', 'data', 'products.json'),
    ];
    for (const productsFile of candidates) {
      if (fs.existsSync(productsFile)) {
        const parsed = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Failed reading products.json:', err);
  }
  return AUTHORITATIVE_PRODUCTS_FALLBACK;
}
