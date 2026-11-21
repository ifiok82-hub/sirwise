import {
  getDatabase,
  saveDatabase,
  getProductsList,
  type DatabaseSchema,
  type PiPaymentRecord,
} from './_store';

export const PI_PLATFORM_API_BASE = 'https://api.minepi.com';

export interface PiPlatformPayment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo?: string;
  metadata?: Record<string, any>;
  direction: 'user_to_app' | 'app_to_user' | string;
  network?: string;
  created_at?: string;
  status?: {
    developer_approved?: boolean;
    transaction_verified?: boolean;
    developer_completed?: boolean;
    cancelled?: boolean;
    user_cancelled?: boolean;
  };
  transaction?: {
    txid?: string;
    verified?: boolean;
    _link?: string;
  } | null;
}

export interface PiServiceDeps {
  fetchImpl?: typeof fetch;
  getDb?: () => DatabaseSchema;
  saveDb?: (db: DatabaseSchema) => void;
  getProducts?: typeof getProductsList;
  apiKey?: string;
}

export interface PiActionResult {
  httpStatus: number;
  body: Record<string, any>;
}

function resolveApiKey(deps?: PiServiceDeps): string {
  if (deps && typeof deps.apiKey === 'string') return deps.apiKey;
  return (process.env.PI_NETWORK_API_KEY || process.env.PI_API_KEY || '').trim();
}

function isPlaceholderKey(apiKey: string): boolean {
  const lower = apiKey.toLowerCase();
  return !apiKey || lower.includes('placeholder') || lower.startsWith('pi_api_key_') || lower.startsWith('your_server_only');
}

function nowTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

async function fetchPiPayment(
  paymentId: string,
  apiKey: string,
  fetchImpl: typeof fetch
): Promise<{ ok: true; payment: PiPlatformPayment } | { ok: false; httpStatus: number; error: string }> {
  const res = await fetchImpl(`${PI_PLATFORM_API_BASE}/v2/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Key ${apiKey}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      httpStatus: res.status === 404 ? 404 : 502,
      error: `Pi Platform payment lookup failed (${res.status})${errText ? `: ${errText.slice(0, 160)}` : ''}`,
    };
  }

  const payment = (await res.json()) as PiPlatformPayment;
  if (!payment || payment.identifier !== paymentId) {
    return { ok: false, httpStatus: 400, error: 'Payment identifier mismatch from Pi Platform' };
  }

  return { ok: true, payment };
}

function validatePaymentAgainstCatalog(
  payment: PiPlatformPayment,
  products: ReturnType<typeof getProductsList>,
  productIdHint?: string
):
  | { ok: true; productId: string; productName: string; expectedAmount: number; isAdminTest: boolean }
  | { ok: false; httpStatus: number; error: string } {
  if (payment.direction !== 'user_to_app') {
    return { ok: false, httpStatus: 400, error: `Invalid payment direction: ${payment.direction}` };
  }

  if (!payment.user_uid || typeof payment.user_uid !== 'string') {
    return { ok: false, httpStatus: 400, error: 'Missing user_uid on Pi payment' };
  }

  const isAdminTest = Boolean(payment.metadata?.adminTest === true);
  if (isAdminTest) {
    if (Math.abs(Number(payment.amount) - 1) > 1e-6) {
      return { ok: false, httpStatus: 400, error: 'Admin diagnostic payment must equal exactly 1 Pi' };
    }
    return {
      ok: true,
      productId: 'admin-testnet-diagnostic',
      productName: 'Admin Pi Testnet Diagnostic',
      expectedAmount: 1,
      isAdminTest: true,
    };
  }

  const metaProductId = typeof payment.metadata?.productId === 'string' ? payment.metadata.productId : '';
  const resolvedProductId = metaProductId || productIdHint || '';
  if (!resolvedProductId) {
    return { ok: false, httpStatus: 400, error: 'Missing productId in Pi payment metadata' };
  }
  if (metaProductId && productIdHint && metaProductId !== productIdHint) {
    return { ok: false, httpStatus: 400, error: 'Payment metadata productId does not match requested product' };
  }

  const product = products.find((p) => p.id === resolvedProductId);
  if (!product) {
    return { ok: false, httpStatus: 400, error: `Unknown productId: ${resolvedProductId}` };
  }

  const expectedAmount = Number(product.pricePI);
  const actualAmount = Number(payment.amount);
  if (!Number.isFinite(actualAmount) || Math.abs(actualAmount - expectedAmount) > 1e-6) {
    return {
      ok: false,
      httpStatus: 400,
      error: `Payment amount mismatch for ${product.id}: expected ${expectedAmount} Pi, got ${actualAmount} Pi`,
    };
  }

  return {
    ok: true,
    productId: product.id,
    productName: product.name,
    expectedAmount,
    isAdminTest: false,
  };
}

export async function approvePiPayment(
  input: { paymentId?: string; expectedUserUid?: string; productIdHint?: string },
  deps?: PiServiceDeps
): Promise<PiActionResult> {
  const paymentId = String(input.paymentId || '').trim();
  if (!paymentId) {
    return { httpStatus: 400, body: { success: false, error: 'Missing paymentId' } };
  }

  const apiKey = resolveApiKey(deps);
  if (isPlaceholderKey(apiKey)) {
    return {
      httpStatus: 500,
      body: { success: false, error: 'Server PI_NETWORK_API_KEY is not configured' },
    };
  }

  const fetchImpl = deps?.fetchImpl || fetch;
  const getDb = deps?.getDb || getDatabase;
  const saveDb = deps?.saveDb || saveDatabase;
  const getProducts = deps?.getProducts || getProductsList;

  const lookup = await fetchPiPayment(paymentId, apiKey, fetchImpl);
  if (!lookup.ok) {
    return { httpStatus: lookup.httpStatus, body: { success: false, error: lookup.error } };
  }
  const payment = lookup.payment;

  if (payment.status?.cancelled || payment.status?.user_cancelled) {
    return { httpStatus: 400, body: { success: false, error: 'Payment has been cancelled' } };
  }

  if (input.expectedUserUid && payment.user_uid !== input.expectedUserUid) {
    return { httpStatus: 403, body: { success: false, error: 'Payment user_uid does not match authenticated user' } };
  }

  const validation = validatePaymentAgainstCatalog(payment, getProducts(), input.productIdHint);
  if (!validation.ok) {
    return { httpStatus: validation.httpStatus, body: { success: false, error: validation.error } };
  }

  const db = getDb();
  db.piPayments = db.piPayments || [];
  let record = db.piPayments.find((r) => r.paymentId === paymentId);

  if (record && (record.status === 'approved' || record.status === 'completed')) {
    return {
      httpStatus: 200,
      body: {
        success: true,
        status: record.status === 'completed' ? 'COMPLETED' : 'APPROVED',
        paymentId,
        productId: record.productId,
        idempotent: true,
      },
    };
  }

  const ts = nowTimestamp();
  if (!record) {
    record = {
      paymentId,
      userUid: payment.user_uid,
      productId: validation.productId,
      amount: validation.expectedAmount,
      direction: 'user_to_app',
      network: payment.network,
      status: 'created',
      fulfilled: false,
      createdAt: ts,
      updatedAt: ts,
    };
    db.piPayments.unshift(record);
    // Persist payment identifier before calling Pi approve API
    saveDb(db);
  }

  if (!payment.status?.developer_approved) {
    const approveRes = await fetchImpl(
      `${PI_PLATFORM_API_BASE}/v2/payments/${encodeURIComponent(paymentId)}/approve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!approveRes.ok) {
      const errText = await approveRes.text().catch(() => '');
      return {
        httpStatus: 502,
        body: {
          success: false,
          error: `Pi approve failed (${approveRes.status})${errText ? `: ${errText.slice(0, 160)}` : ''}`,
        },
      };
    }
  }

  record.status = 'approved';
  record.updatedAt = nowTimestamp();
  db.auditLogs.unshift({
    id: `AL-${Date.now()}`,
    action: `Pi U2A payment ${paymentId} approved for ${validation.productId} (${validation.expectedAmount} Pi).`,
    timestamp: record.updatedAt,
    user: payment.user_uid,
    severity: 'info',
  });
  saveDb(db);

  return {
    httpStatus: 200,
    body: {
      success: true,
      status: 'APPROVED',
      paymentId,
      productId: validation.productId,
      amount: validation.expectedAmount,
    },
  };
}

export async function completePiPayment(
  input: {
    paymentId?: string;
    txid?: string;
    expectedUserUid?: string;
    productIdHint?: string;
    email?: string;
    name?: string;
    phone?: string;
    country?: string;
    device?: string;
  },
  deps?: PiServiceDeps
): Promise<PiActionResult> {
  const paymentId = String(input.paymentId || '').trim();
  const txid = String(input.txid || '').trim();
  if (!paymentId || !txid) {
    return { httpStatus: 400, body: { success: false, error: 'Missing paymentId or txid' } };
  }

  const apiKey = resolveApiKey(deps);
  if (isPlaceholderKey(apiKey)) {
    return {
      httpStatus: 500,
      body: { success: false, error: 'Server PI_NETWORK_API_KEY is not configured' },
    };
  }

  const fetchImpl = deps?.fetchImpl || fetch;
  const getDb = deps?.getDb || getDatabase;
  const saveDb = deps?.saveDb || saveDatabase;
  const getProducts = deps?.getProducts || getProductsList;

  const db = getDb();
  db.piPayments = db.piPayments || [];
  db.entitlements = db.entitlements || [];

  // Idempotent short-circuit if this exact paymentId was already fulfilled
  let record: PiPaymentRecord | undefined = db.piPayments.find((r) => r.paymentId === paymentId);
  if (record?.fulfilled) {
    if (record.txid && record.txid !== txid) {
      return { httpStatus: 409, body: { success: false, error: 'txid mismatch on already-completed payment' } };
    }
    return {
      httpStatus: 200,
      body: {
        success: true,
        verified: true,
        status: 'SUCCESS',
        alreadyFulfilled: true,
        entitlementGranted: false,
        paymentId,
        txid: record.txid || txid,
        productId: record.productId,
      },
    };
  }

  const lookup = await fetchPiPayment(paymentId, apiKey, fetchImpl);
  if (!lookup.ok) {
    return { httpStatus: lookup.httpStatus, body: { success: false, error: lookup.error } };
  }
  const payment = lookup.payment;

  if (payment.status?.cancelled || payment.status?.user_cancelled) {
    return { httpStatus: 400, body: { success: false, error: 'Cannot complete a cancelled payment' } };
  }

  if (input.expectedUserUid && payment.user_uid !== input.expectedUserUid) {
    return { httpStatus: 403, body: { success: false, error: 'Payment user_uid does not match authenticated user' } };
  }

  if (record && record.userUid !== payment.user_uid) {
    return { httpStatus: 403, body: { success: false, error: 'Stored payment user_uid mismatch' } };
  }

  const remoteTxid = payment.transaction?.txid;
  if (!remoteTxid || remoteTxid !== txid) {
    return {
      httpStatus: 400,
      body: { success: false, error: 'Blockchain txid does not match Pi Platform payment record' },
    };
  }

  if (payment.transaction?.verified === false || payment.status?.transaction_verified === false) {
    return {
      httpStatus: 400,
      body: { success: false, error: 'Pi blockchain transaction is not yet verified' },
    };
  }

  const validation = validatePaymentAgainstCatalog(payment, getProducts(), input.productIdHint || record?.productId);
  if (!validation.ok) {
    return { httpStatus: validation.httpStatus, body: { success: false, error: validation.error } };
  }

  const ts = nowTimestamp();
  if (!record) {
    record = {
      paymentId,
      txid,
      userUid: payment.user_uid,
      productId: validation.productId,
      amount: validation.expectedAmount,
      direction: 'user_to_app',
      network: payment.network,
      status: 'approved',
      fulfilled: false,
      createdAt: ts,
      updatedAt: ts,
    };
    db.piPayments.unshift(record);
  } else {
    record.txid = txid;
    record.updatedAt = ts;
  }
  // Persist payment identifier + txid before calling Pi /complete or granting entitlements
  saveDb(db);

  if (!payment.status?.developer_completed) {
    const completeRes = await fetchImpl(
      `${PI_PLATFORM_API_BASE}/v2/payments/${encodeURIComponent(paymentId)}/complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      }
    );

    if (!completeRes.ok) {
      const errText = await completeRes.text().catch(() => '');
      return {
        httpStatus: 502,
        body: {
          success: false,
          error: `Pi complete failed (${completeRes.status})${errText ? `: ${errText.slice(0, 160)}` : ''}`,
        },
      };
    }
  }

  const userEmail = String(input.email || `partner-${payment.user_uid.slice(0, 8)}@sirwise.store`).toLowerCase();
  const userName = String(input.name || 'SIRWISE Partner');

  let entitlementGranted = false;
  if (!validation.isAdminTest) {
    const alreadyEntitled = db.entitlements.some(
      (e) => e.paymentId === paymentId || (e.userUid === payment.user_uid && e.productId === validation.productId)
    );
    if (!alreadyEntitled) {
      db.entitlements.push({
        userUid: payment.user_uid,
        productId: validation.productId,
        paymentId,
        txid,
        grantedAt: nowTimestamp(),
      });
      entitlementGranted = true;
    }
  }

  let user = db.users.find((u) => u.email.toLowerCase() === userEmail);
  if (!user) {
    user = {
      id: `USR-${payment.user_uid.slice(0, 8).toUpperCase()}`,
      name: userName,
      email: userEmail,
      phone: String(input.phone || '+2348000000000'),
      country: String(input.country || 'Global'),
      status: 'Verified',
      timestamp: ts,
      device: input.device || 'Pi Browser',
    };
    db.users.push(user);
  } else {
    user.status = 'Verified';
    if (input.name) user.name = userName;
  }

  record.status = 'completed';
  record.fulfilled = true;
  record.fulfilledAt = nowTimestamp();
  record.email = userEmail;
  record.updatedAt = record.fulfilledAt;

  db.auditLogs.unshift({
    id: `AL-${Date.now()}`,
    action: `Pi U2A payment ${paymentId} completed (txid ${txid}) for ${validation.productId} (${validation.expectedAmount} Pi).`,
    timestamp: record.fulfilledAt,
    user: userEmail,
    severity: 'info',
  });
  saveDb(db);

  return {
    httpStatus: 200,
    body: {
      success: true,
      verified: true,
      status: 'SUCCESS',
      paymentId,
      txid,
      productId: validation.productId,
      amount: validation.expectedAmount,
      entitlementGranted,
      user,
    },
  };
}

export async function cancelPiPayment(
  input: { paymentId?: string },
  deps?: PiServiceDeps
): Promise<PiActionResult> {
  const paymentId = String(input.paymentId || '').trim();
  if (!paymentId) {
    return { httpStatus: 400, body: { success: false, error: 'Missing paymentId' } };
  }

  const apiKey = resolveApiKey(deps);
  if (isPlaceholderKey(apiKey)) {
    return {
      httpStatus: 500,
      body: { success: false, error: 'Server PI_NETWORK_API_KEY is not configured' },
    };
  }

  const fetchImpl = deps?.fetchImpl || fetch;
  const getDb = deps?.getDb || getDatabase;
  const saveDb = deps?.saveDb || saveDatabase;

  const lookup = await fetchPiPayment(paymentId, apiKey, fetchImpl);
  if (!lookup.ok) {
    return { httpStatus: lookup.httpStatus, body: { success: false, error: lookup.error } };
  }
  const payment = lookup.payment;

  if (payment.transaction?.txid) {
    return completePiPayment({ paymentId, txid: payment.transaction.txid }, deps);
  }

  if (!payment.status?.cancelled && !payment.status?.user_cancelled) {
    const cancelRes = await fetchImpl(
      `${PI_PLATFORM_API_BASE}/v2/payments/${encodeURIComponent(paymentId)}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!cancelRes.ok) {
      const errText = await cancelRes.text().catch(() => '');
      return {
        httpStatus: 502,
        body: {
          success: false,
          error: `Pi cancel failed (${cancelRes.status})${errText ? `: ${errText.slice(0, 160)}` : ''}`,
        },
      };
    }
  }

  const db = getDb();
  db.piPayments = db.piPayments || [];
  const ts = nowTimestamp();
  const record = db.piPayments.find((r) => r.paymentId === paymentId);
  if (record) {
    record.status = 'cancelled';
    record.updatedAt = ts;
  } else {
    db.piPayments.unshift({
      paymentId,
      userUid: payment.user_uid,
      productId: String(payment.metadata?.productId || 'unknown'),
      amount: Number(payment.amount || 0),
      direction: 'user_to_app',
      network: payment.network,
      status: 'cancelled',
      fulfilled: false,
      createdAt: ts,
      updatedAt: ts,
    });
  }
  db.auditLogs.unshift({
    id: `AL-${Date.now()}`,
    action: `Incomplete Pi U2A payment ${paymentId} cancelled.`,
    timestamp: ts,
    user: payment.user_uid || 'system',
    severity: 'info',
  });
  saveDb(db);

  return { httpStatus: 200, body: { success: true, status: 'CANCELLED', paymentId } };
}

export async function handleIncompletePiPayment(
  input: {
    paymentId?: string;
    txid?: string;
    expectedUserUid?: string;
    email?: string;
    name?: string;
    phone?: string;
    country?: string;
    device?: string;
  },
  deps?: PiServiceDeps
): Promise<PiActionResult> {
  const paymentId = String(input.paymentId || '').trim();
  if (!paymentId) {
    return { httpStatus: 400, body: { success: false, error: 'Missing paymentId' } };
  }

  const apiKey = resolveApiKey(deps);
  if (isPlaceholderKey(apiKey)) {
    return {
      httpStatus: 500,
      body: { success: false, error: 'Server PI_NETWORK_API_KEY is not configured' },
    };
  }

  const fetchImpl = deps?.fetchImpl || fetch;
  const lookup = await fetchPiPayment(paymentId, apiKey, fetchImpl);
  if (!lookup.ok) {
    return { httpStatus: lookup.httpStatus, body: { success: false, error: lookup.error } };
  }

  const payment = lookup.payment;
  const authoritativeTxid = payment.transaction?.txid || input.txid;
  if (authoritativeTxid) {
    return completePiPayment(
      {
        ...input,
        paymentId,
        txid: authoritativeTxid,
      },
      deps
    );
  }

  return cancelPiPayment({ paymentId }, deps);
}

export function verifyRecordedPayment(
  input: { reference?: string; email?: string },
  deps?: Pick<PiServiceDeps, 'getDb'>
): PiActionResult {
  const reference = String(input.reference || '').trim();
  if (!reference) {
    return { httpStatus: 400, body: { success: false, status: 'FAILED', error: 'Missing payment reference' } };
  }

  const getDb = deps?.getDb || getDatabase;
  const db = getDb();
  const piPayments = db.piPayments || [];

  const matched = piPayments.find(
    (p) =>
      p.status === 'completed' &&
      p.fulfilled === true &&
      (p.paymentId === reference || p.txid === reference)
  );

  if (!matched) {
    return {
      httpStatus: 403,
      body: {
        success: false,
        status: 'FAILED',
        error: 'No server-verified completed Pi payment found for this reference.',
      },
    };
  }

  const email = String(input.email || matched.email || '').toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === email);

  return {
    httpStatus: 200,
    body: {
      success: true,
      status: 'SUCCESS',
      message: 'Transaction Verified ✓',
      reference,
      paymentId: matched.paymentId,
      txid: matched.txid,
      productId: matched.productId,
      user,
    },
  };
}
