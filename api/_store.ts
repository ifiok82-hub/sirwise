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

export function getDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_DB_FILE, 'utf-8'));
    }
    const repoDb = path.resolve(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(repoDb)) {
      return JSON.parse(fs.readFileSync(repoDb, 'utf-8'));
    }
  } catch (err) {
    console.error('Database read warning:', err);
  }
  return {
    users: [],
    auditLogs: [
      {
        id: 'AL-1',
        action: 'SIRWISE Global Digital Hub serverless store initialized.',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'SYSTEM',
        severity: 'info',
      },
    ],
    downloads: [],
  };
}

export function saveDatabase(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(TMP_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Database write warning:', err);
  }
}

export function getProductsList() {
  try {
    const productsFile = path.resolve(process.cwd(), 'data', 'products.json');
    if (fs.existsSync(productsFile)) {
      return JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed reading products.json:', err);
  }
  return [];
}
