import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approvePiPayment,
  completePiPayment,
  handleIncompletePiPayment,
  verifyRecordedPayment,
  type PiPlatformPayment,
} from '../api/_pi';
import { getProductsList, type DatabaseSchema } from '../api/_store';

const TEST_ONLY_KEY = 'test-mock-pi-key-not-real';

function createMemoryStore(initial?: Partial<DatabaseSchema>) {
  let db: DatabaseSchema = {
    users: [],
    auditLogs: [],
    downloads: [],
    piPayments: [],
    entitlements: [],
    ...initial,
  };
  return {
    getDb: () => db,
    saveDb: (next: DatabaseSchema) => {
      db = next;
    },
    read: () => db,
  };
}

function createMockPiFetch(
  paymentMap: Record<string, PiPlatformPayment>,
  calls: Array<{ method: string; url: string; body?: string }>
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || 'GET').toUpperCase();
    const body = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ method, url, body });

    const match = url.match(/\/v2\/payments\/([^/]+)(?:\/(approve|complete|cancel))?$/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'unexpected url' }), { status: 404 });
    }

    const paymentId = decodeURIComponent(match[1]);
    const action = match[2];
    const payment = paymentMap[paymentId];
    if (!payment) {
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    }

    if (method === 'GET' && !action) {
      return new Response(JSON.stringify(payment), { status: 200 });
    }

    if (method === 'POST' && action === 'approve') {
      payment.status = { ...(payment.status || {}), developer_approved: true };
      return new Response(JSON.stringify(payment), { status: 200 });
    }

    if (method === 'POST' && action === 'complete') {
      payment.status = { ...(payment.status || {}), developer_completed: true };
      return new Response(JSON.stringify(payment), { status: 200 });
    }

    if (method === 'POST' && action === 'cancel') {
      payment.status = { ...(payment.status || {}), cancelled: true };
      return new Response(JSON.stringify(payment), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }) as typeof fetch;
}

test('fails closed with HTTP 500 when PI_NETWORK_API_KEY is missing or placeholder', async () => {
  const store = createMemoryStore();
  const res = await approvePiPayment(
    { paymentId: 'pay_1', expectedUserUid: 'uid_1', productIdHint: 'prod-ebook-sovereign' },
    { apiKey: '', getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(res.httpStatus, 500);
  assert.equal(res.body.success, false);
  assert.equal(store.read().piPayments?.length, 0);
  assert.equal(store.read().entitlements?.length, 0);
});

test('authoritative U2A approve + complete validates catalog price and grants entitlement once', async () => {
  const store = createMemoryStore();
  const calls: Array<{ method: string; url: string; body?: string }> = [];
  const paymentMap: Record<string, PiPlatformPayment> = {
    pay_valid_1: {
      identifier: 'pay_valid_1',
      user_uid: 'uid_pioneer_1',
      amount: 5, // matches prod-ebook-sovereign pricePI = 5
      direction: 'user_to_app',
      network: 'Pi Testnet',
      metadata: { productId: 'prod-ebook-sovereign' },
      status: { developer_approved: false, transaction_verified: false, developer_completed: false },
      transaction: null,
    },
  };
  const fetchImpl = createMockPiFetch(paymentMap, calls);

  const approveRes = await approvePiPayment(
    { paymentId: 'pay_valid_1', expectedUserUid: 'uid_pioneer_1', productIdHint: 'prod-ebook-sovereign' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(approveRes.httpStatus, 200);
  assert.equal(approveRes.body.status, 'APPROVED');
  assert.equal(store.read().entitlements?.length, 0);

  // Idempotent approve retry does not call /approve again
  const approveRetry = await approvePiPayment(
    { paymentId: 'pay_valid_1', expectedUserUid: 'uid_pioneer_1', productIdHint: 'prod-ebook-sovereign' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(approveRetry.httpStatus, 200);
  assert.equal(approveRetry.body.idempotent, true);
  assert.equal(calls.filter((c) => c.url.endsWith('/approve')).length, 1);

  // Simulate blockchain submission on Pi Platform
  paymentMap.pay_valid_1.status = {
    developer_approved: true,
    transaction_verified: true,
    developer_completed: false,
  };
  paymentMap.pay_valid_1.transaction = { txid: 'tx_chain_1', verified: true };

  const completeRes = await completePiPayment(
    {
      paymentId: 'pay_valid_1',
      txid: 'tx_chain_1',
      expectedUserUid: 'uid_pioneer_1',
      productIdHint: 'prod-ebook-sovereign',
      email: 'pioneer@example.com',
      name: 'Pioneer Tester',
    },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(completeRes.httpStatus, 200);
  assert.equal(completeRes.body.verified, true);
  assert.equal(completeRes.body.entitlementGranted, true);
  assert.equal(store.read().entitlements?.length, 1);
  assert.equal(store.read().entitlements?.[0].productId, 'prod-ebook-sovereign');

  // Idempotent complete retry does not call /complete again or duplicate entitlement
  const completeRetry = await completePiPayment(
    {
      paymentId: 'pay_valid_1',
      txid: 'tx_chain_1',
      expectedUserUid: 'uid_pioneer_1',
      productIdHint: 'prod-ebook-sovereign',
    },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(completeRetry.httpStatus, 200);
  assert.equal(completeRetry.body.alreadyFulfilled, true);
  assert.equal(completeRetry.body.entitlementGranted, false);
  assert.equal(calls.filter((c) => c.url.endsWith('/complete')).length, 1);
  assert.equal(store.read().entitlements?.length, 1);

  // Conflicting txid on already-fulfilled payment is rejected (409)
  const conflictRetry = await completePiPayment(
    { paymentId: 'pay_valid_1', txid: 'tx_other' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(conflictRetry.httpStatus, 409);

  // verifyRecordedPayment accepts fulfilled reference and rejects unknown references
  const verifiedCheck = verifyRecordedPayment({ reference: 'tx_chain_1' }, { getDb: store.getDb });
  assert.equal(verifiedCheck.httpStatus, 200);
  assert.equal(verifiedCheck.body.success, true);

  const bogusCheck = verifyRecordedPayment({ reference: 'tx_fake_999' }, { getDb: store.getDb });
  assert.equal(bogusCheck.httpStatus, 403);
  assert.equal(bogusCheck.body.success, false);
});

test('rejects tampered amount, wrong direction, uid mismatch, and txid mismatch without calling approve/complete', async () => {
  const store = createMemoryStore();
  const calls: Array<{ method: string; url: string; body?: string }> = [];
  const paymentMap: Record<string, PiPlatformPayment> = {
    pay_underpaid: {
      identifier: 'pay_underpaid',
      user_uid: 'uid_1',
      amount: 1, // tampered: prod-course-mba costs 10 Pi
      direction: 'user_to_app',
      metadata: { productId: 'prod-course-mba' },
      status: {},
    },
    pay_a2u: {
      identifier: 'pay_a2u',
      user_uid: 'uid_1',
      amount: 10,
      direction: 'app_to_user',
      metadata: { productId: 'prod-course-mba' },
      status: {},
    },
    pay_uid_mismatch: {
      identifier: 'pay_uid_mismatch',
      user_uid: 'uid_real',
      amount: 10,
      direction: 'user_to_app',
      metadata: { productId: 'prod-course-mba' },
      status: {},
    },
    pay_tx_mismatch: {
      identifier: 'pay_tx_mismatch',
      user_uid: 'uid_1',
      amount: 10,
      direction: 'user_to_app',
      metadata: { productId: 'prod-course-mba' },
      status: { developer_approved: true, transaction_verified: true },
      transaction: { txid: 'tx_real', verified: true },
    },
  };
  const fetchImpl = createMockPiFetch(paymentMap, calls);

  const r1 = await approvePiPayment(
    { paymentId: 'pay_underpaid', expectedUserUid: 'uid_1', productIdHint: 'prod-course-mba' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(r1.httpStatus, 400);

  const r2 = await approvePiPayment(
    { paymentId: 'pay_a2u', expectedUserUid: 'uid_1', productIdHint: 'prod-course-mba' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(r2.httpStatus, 400);

  const r3 = await approvePiPayment(
    { paymentId: 'pay_uid_mismatch', expectedUserUid: 'uid_spoof', productIdHint: 'prod-course-mba' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(r3.httpStatus, 403);

  const r4 = await completePiPayment(
    { paymentId: 'pay_tx_mismatch', txid: 'tx_forged', expectedUserUid: 'uid_1' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(r4.httpStatus, 400);

  assert.equal(calls.filter((c) => c.method === 'POST').length, 0);
  assert.equal(store.read().entitlements?.length, 0);
});

test('incomplete payment handler completes with txid and cancels without txid', async () => {
  const store = createMemoryStore();
  const calls: Array<{ method: string; url: string; body?: string }> = [];
  const paymentMap: Record<string, PiPlatformPayment> = {
    pay_inc_complete: {
      identifier: 'pay_inc_complete',
      user_uid: 'uid_inc_1',
      amount: 6, // prod-temp-pitch pricePI = 6
      direction: 'user_to_app',
      metadata: { productId: 'prod-temp-pitch' },
      status: { developer_approved: true, transaction_verified: true, developer_completed: false },
      transaction: { txid: 'tx_inc_1', verified: true },
    },
    pay_inc_cancel: {
      identifier: 'pay_inc_cancel',
      user_uid: 'uid_inc_1',
      amount: 6,
      direction: 'user_to_app',
      metadata: { productId: 'prod-temp-pitch' },
      status: { developer_approved: true, transaction_verified: false, developer_completed: false },
      transaction: null,
    },
  };
  const fetchImpl = createMockPiFetch(paymentMap, calls);

  const resComplete = await handleIncompletePiPayment(
    { paymentId: 'pay_inc_complete', expectedUserUid: 'uid_inc_1' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(resComplete.httpStatus, 200);
  assert.equal(resComplete.body.verified, true);
  assert.equal(store.read().entitlements?.length, 1);

  const resCancel = await handleIncompletePiPayment(
    { paymentId: 'pay_inc_cancel', expectedUserUid: 'uid_inc_1' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(resCancel.httpStatus, 200);
  assert.equal(resCancel.body.status, 'CANCELLED');
  assert.equal(calls.some((c) => c.url.endsWith('/pay_inc_cancel/cancel')), true);
  assert.equal(store.read().entitlements?.length, 1);
});

test('admin diagnostic payment (1 Pi) never unlocks storefront entitlements', async () => {
  const store = createMemoryStore();
  const calls: Array<{ method: string; url: string; body?: string }> = [];
  const paymentMap: Record<string, PiPlatformPayment> = {
    pay_admin_1: {
      identifier: 'pay_admin_1',
      user_uid: 'uid_admin',
      amount: 1,
      direction: 'user_to_app',
      metadata: { adminTest: true, isTestnet: true },
      status: { developer_approved: true, transaction_verified: true, developer_completed: false },
      transaction: { txid: 'tx_admin_1', verified: true },
    },
  };
  const fetchImpl = createMockPiFetch(paymentMap, calls);

  const res = await completePiPayment(
    { paymentId: 'pay_admin_1', txid: 'tx_admin_1', expectedUserUid: 'uid_admin' },
    { apiKey: TEST_ONLY_KEY, fetchImpl, getDb: store.getDb, saveDb: store.saveDb, getProducts: getProductsList }
  );
  assert.equal(res.httpStatus, 200);
  assert.equal(res.body.verified, true);
  assert.equal(res.body.entitlementGranted, false);
  assert.equal(store.read().entitlements?.length, 0);
});
