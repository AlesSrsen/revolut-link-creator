import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENCIES, DEFAULT_FIELDS, buildPaymentLink, restoreState } from '../docs/link.js';
import qrcode from '../docs/vendor/qrcode.mjs';

const fields = { ...DEFAULT_FIELDS, revtag: '@Example123', amount: '12.34', note: 'Café & tea / test? # 🍵' };

test('encodes exact minor units and safely round-trips Unicode and reserved characters', () => {
  const result = buildPaymentLink(fields);
  const url = new URL(result.url);
  assert.equal(url.origin, 'https://revolut.me');
  assert.equal(url.pathname, '/Example123');
  assert.equal(url.searchParams.get('amount'), '1234');
  assert.equal(url.searchParams.get('currency'), 'EUR');
  assert.equal(url.searchParams.get('note'), fields.note);
  for (const [amount, expected] of [['0.29', '29'], ['1,01', '101'], ['00012.3', '1230'], ['999999999.99', '99999999999']]) {
    assert.equal(new URL(buildPaymentLink({ ...fields, amount }).url).searchParams.get('amount'), expected);
  }
});

test('omits optional values, supports every dropdown currency and treats JPY as whole units', () => {
  const url = new URL(buildPaymentLink({ ...fields, amount: '', note: ' ' }).url);
  assert.equal(url.searchParams.has('amount'), false);
  assert.equal(url.searchParams.has('note'), false);
  for (const currency of CURRENCIES) assert.ok(buildPaymentLink({ ...fields, currency, amount: '12' }).url);
  assert.equal(new URL(buildPaymentLink({ ...fields, currency: 'JPY', amount: '1234' }).url).searchParams.get('amount'), '1234');
  assert.ok(buildPaymentLink({ ...fields, currency: 'JPY', amount: '1.5' }).errors.amount);
  assert.ok(buildPaymentLink({ ...fields, currency: 'JPY', amount: '99999999999' }).url);
});

test('rejects invalid money instead of rounding or silently truncating', () => {
  for (const amount of ['0', '0.00', '-1', '+2', '1e3', 'Infinity', '1.001', '1,000.00', '1 000', '.5', '1.', '1000000000', '9'.repeat(1000)]) {
    const result = buildPaymentLink({ ...fields, amount });
    assert.equal(result.url, null, amount);
    assert.ok(result.errors.amount, amount);
  }
});

test('rejects hostile or invalid recipient, currency and message inputs', () => {
  for (const revtag of ['', 'ab', 'a'.repeat(17), '../foo', 'x?note=hi', 'foo/bar', 'foo.bar', 'foo_bar', 'https://evil.test', '<script>', 'český']) {
    assert.ok(buildPaymentLink({ ...fields, revtag }).errors.revtag, revtag);
  }
  assert.ok(buildPaymentLink({ ...fields, currency: 'ZZZ' }).errors.currency);
  assert.ok(buildPaymentLink({ ...fields, note: 'a'.repeat(65) }).errors.note);
  assert.ok(buildPaymentLink({ ...fields, note: '🍵'.repeat(32) }).url);
  assert.ok(buildPaymentLink({ ...fields, note: '🍵'.repeat(33) }).errors.note);
});

test('restores only valid preset data and known draft fields', () => {
  const valid = { name: 'Lunch', fields };
  const restored = restoreState(JSON.stringify({
    draft: { revtag: 'Example123', currency: 'BAD', amount: 3, note: 'Hi', extra: 'ignored' },
    presets: [valid, null, { name: '', fields }, { name: 'bad', fields: { ...fields, amount: '-1' } }, { name: 'missing', fields: {} }],
  }));
  assert.deepEqual(restored.draft, { revtag: 'Example123', currency: 'EUR', amount: '', note: 'Hi' });
  assert.deepEqual(restored.presets, [valid]);
  assert.deepEqual(restoreState(null), { draft: DEFAULT_FIELDS, presets: [] });
  assert.deepEqual(restoreState('null'), { draft: DEFAULT_FIELDS, presets: [] });
  assert.throws(() => restoreState('{broken'), SyntaxError);
});

test('QR encoder handles the longest valid percent-encoded payment link', () => {
  const result = buildPaymentLink({ ...fields, revtag: 'a'.repeat(16), note: '🍵'.repeat(32), amount: '999999999.99' });
  const code = qrcode(0, 'M');
  code.addData(result.url);
  code.make();
  assert.ok(code.getModuleCount() >= 21);
  assert.match(code.createSvgTag({ cellSize: 8, margin: 32 }), /^<svg/);
  assert.equal(code.isDark(0, 0), true);
});
