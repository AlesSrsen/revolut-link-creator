export const CURRENCIES = [
  'EUR', 'CZK', 'GBP', 'USD', 'AUD', 'CAD', 'CHF', 'DKK', 'HKD', 'HUF', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'ZAR',
];

export const DEFAULT_FIELDS = { revtag: '', currency: 'EUR', amount: '', note: '' };
export const STORAGE_KEY = 'revolut-link-creator.v1';

export function buildPaymentLink(fields) {
  const revtag = fields.revtag.trim().replace(/^@/, '');
  const amount = fields.amount.trim();
  const errors = {};
  let minorUnits;

  if (!/^[A-Za-z0-9]{3,16}$/.test(revtag)) {
    errors.revtag = 'Use 3–16 English letters or numbers, with an optional @.';
  }
  if (!CURRENCIES.includes(fields.currency)) {
    errors.currency = 'Choose a currency from the list.';
  }
  if (fields.note.length > 64) {
    errors.note = 'Keep the message within 64 characters.';
  }
  if (amount) {
    const digits = fields.currency === 'JPY' ? 0 : 2;
    if (!/^\d{1,12}(?:[.,]\d{1,2})?$/.test(amount)) {
      errors.amount = 'Enter a positive amount, without thousands separators.';
    } else {
      const [whole, fraction = ''] = amount.split(/[.,]/);
      if (fraction.length > digits) {
        errors.amount = 'Use a whole number for JPY.';
      } else {
        minorUnits = BigInt(whole + fraction.padEnd(digits, '0'));
        if (minorUnits < 1n || minorUnits > 99999999999n) {
          errors.amount = `Use an amount from ${digits ? '0.01 to 999,999,999.99' : '1 to 99,999,999,999'}.`;
        }
      }
    }
  }
  if (Object.keys(errors).length) return { errors, url: null };

  const url = new URL(`https://revolut.me/${revtag}`);
  url.searchParams.set('currency', fields.currency);
  if (minorUnits !== undefined) url.searchParams.set('amount', minorUnits.toString());
  if (fields.note.trim()) url.searchParams.set('note', fields.note.trim());
  return { errors, url: url.href, revtag, minorUnits };
}

export function restoreState(raw) {
  const state = raw ? JSON.parse(raw) : {};
  const readFields = (fields) => Object.fromEntries(
    Object.entries(DEFAULT_FIELDS).map(([key, fallback]) => [
      key, typeof fields?.[key] === 'string' ? fields[key] : fallback,
    ]),
  );
  const draft = readFields(state?.draft);
  if (!CURRENCIES.includes(draft.currency)) draft.currency = 'EUR';
  const presets = Array.isArray(state?.presets) ? state.presets.filter((preset) => (
    typeof preset?.name === 'string' && preset.name.trim().length > 0 &&
    preset.name.length <= 40 && preset.fields &&
    Object.keys(DEFAULT_FIELDS).every((key) => typeof preset.fields[key] === 'string') &&
    buildPaymentLink(preset.fields).url
  )).map((preset) => ({ name: preset.name, fields: readFields(preset.fields) })) : [];
  return { draft, presets };
}
