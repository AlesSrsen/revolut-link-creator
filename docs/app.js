import qrcode from './vendor/qrcode.mjs';
import { CURRENCIES, DEFAULT_FIELDS, STORAGE_KEY, buildPaymentLink, restoreState } from './link.js';

const form = document.querySelector('#payment-form');
const inputs = Object.fromEntries(Object.keys(DEFAULT_FIELDS).map((key) => [key, form.elements.namedItem(key)]));
const output = document.querySelector('#payment-link');
const copyButton = document.querySelector('#copy-link');
const openLink = document.querySelector('#open-link');
const linkStatus = document.querySelector('#link-status');
const presetStatus = document.querySelector('#preset-status');
const presetName = document.querySelector('#preset-name');
const saveButton = document.querySelector('#save-preset');
const presetList = document.querySelector('#preset-list');
const storageNotice = document.querySelector('#storage-notice');
const touched = new Set();
let state = { draft: { ...DEFAULT_FIELDS }, presets: [] };
let currentLink = null;
let qrMarkup = '';

const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
inputs.currency.replaceChildren(...CURRENCIES.map((currency) => new Option(`${currency} — ${currencyNames.of(currency)}`, currency)));

function storageWarning(message) {
  storageNotice.textContent = message;
  storageNotice.hidden = false;
}

try {
  state = restoreState(localStorage.getItem(STORAGE_KEY));
} catch {
  storageWarning('Saved data could not be restored. You can still generate links; saving may be unavailable in this browser.');
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    storageWarning('Browser storage is unavailable or full. Your link still works, but changes will not survive a reload.');
    return false;
  }
}

function readFields() {
  return Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value]));
}

function setFields(fields) {
  for (const [key, input] of Object.entries(inputs)) input.value = fields[key];
}

function formatAmount(fields) {
  if (!fields.amount.trim()) return 'Any amount';
  return new Intl.NumberFormat('en', { style: 'currency', currency: fields.currency }).format(Number(fields.amount.replace(',', '.')));
}

function update() {
  const fields = readFields();
  const result = buildPaymentLink(fields);
  currentLink = result.url;
  state.draft = fields;
  for (const [key, input] of Object.entries(inputs)) {
    const error = document.querySelector(`#${key}-error`);
    const showError = Boolean(result.errors[key] && touched.has(key));
    input.setAttribute('aria-invalid', String(showError));
    error.textContent = result.errors[key] || '';
    error.hidden = !showError;
  }
  document.querySelector('#note-count').textContent = `${fields.note.length} / 64`;
  document.querySelector('#preview-amount').textContent = result.errors.amount ? 'Check amount' : formatAmount(fields);
  document.querySelector('#preview-recipient').textContent = result.errors.revtag ? 'To your Revtag' : `To @${result.revtag || fields.revtag.trim().replace(/^@/, '')}`;
  document.querySelector('#preview-note').textContent = fields.note.trim() || 'Your message will appear here.';
  output.value = currentLink || '';
  copyButton.disabled = !currentLink;
  saveButton.disabled = !currentLink;
  openLink.hidden = !currentLink;
  if (currentLink) openLink.href = currentLink;
  else openLink.removeAttribute('href');
  linkStatus.textContent = currentLink ? 'Ready to share.' : (fields.revtag ? 'Check your payment details to create a link.' : 'Add your Revtag to get started.');
  document.querySelector('#qr-row').hidden = !currentLink;
  document.querySelector('#qr-empty').hidden = Boolean(currentLink);
  document.querySelector('#qr-code').replaceChildren();
  qrMarkup = '';
  if (currentLink) {
    const code = qrcode(0, 'M');
    code.addData(currentLink);
    code.make();
    qrMarkup = code.createSvgTag({ cellSize: 8, margin: 32, scalable: true, alt: 'QR code for your Revolut payment link' });
    const svg = new DOMParser().parseFromString(qrMarkup, 'image/svg+xml').documentElement;
    document.querySelector('#qr-code').append(document.importNode(svg, true));
  }
}

function renderPresets() {
  presetList.replaceChildren();
  document.querySelector('#presets-empty').hidden = state.presets.length > 0;
  for (const preset of state.presets) {
    const item = document.createElement('li');
    const loadButton = document.createElement('button');
    loadButton.type = 'button';
    loadButton.className = 'preset-load';
    loadButton.setAttribute('aria-label', `Load ${preset.name} preset`);
    const title = document.createElement('strong');
    title.textContent = preset.name;
    const detail = document.createElement('span');
    detail.textContent = `${formatAmount(preset.fields)} · ${preset.fields.currency} · @${preset.fields.revtag.trim().replace(/^@/, '')}`;
    loadButton.append(title, detail);
    loadButton.addEventListener('click', () => {
      setFields(preset.fields);
      presetName.value = preset.name;
      touched.clear();
      update();
      const saved = persist();
      presetStatus.textContent = `${preset.name} loaded.${saved ? '' : ' Changes are only in memory.'}`;
    });
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'text-button preset-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${preset.name} preset`);
    deleteButton.addEventListener('click', () => {
      if (!window.confirm(`Delete the “${preset.name}” preset?`)) return;
      state.presets = state.presets.filter((entry) => entry !== preset);
      const saved = persist();
      renderPresets();
      presetStatus.textContent = saved ? `${preset.name} deleted.` : 'Deleted for this session. Browser storage could not be updated.';
      presetName.focus();
    });
    item.append(loadButton, deleteButton);
    presetList.append(item);
  }
}

form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('input', () => {
  update();
  persist();
});
form.addEventListener('focusout', (event) => {
  if (!event.target.name) return;
  touched.add(event.target.name);
  update();
});

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  try {
    const restored = restoreState(event.newValue);
    state.presets = restored.presets;
    if (event.newValue === null) {
      setFields(restored.draft);
      presetName.value = '';
      touched.clear();
      update();
      presetStatus.textContent = 'Saved data cleared in another tab.';
    }
    renderPresets();
  } catch {
    storageWarning('Saved data changed in another tab but could not be restored.');
  }
});

document.querySelector('#preset-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = presetName.value.trim();
  if (!name || !currentLink) {
    presetStatus.textContent = 'Enter a preset name and valid payment details.';
    return;
  }
  const existing = state.presets.find((preset) => preset.name === name);
  if (existing) existing.fields = readFields();
  else state.presets.push({ name, fields: readFields() });
  const saved = persist();
  renderPresets();
  presetStatus.textContent = saved ? `${name} ${existing ? 'updated' : 'saved'} on this device.` : 'Preset is only in memory. Browser storage is unavailable.';
});

copyButton.addEventListener('click', async () => {
  if (!currentLink) return;
  const copiedLink = currentLink;
  try {
    await navigator.clipboard.writeText(copiedLink);
    if (currentLink === copiedLink) linkStatus.textContent = 'Link copied.';
  } catch {
    output.focus();
    output.select();
    linkStatus.textContent = 'Copy was blocked. The link is selected; copy it from the text field.';
  }
});

document.querySelector('#download-qr').addEventListener('click', () => {
  if (!currentLink || !qrMarkup) return;
  const url = URL.createObjectURL(new Blob([qrMarkup], { type: 'image/svg+xml' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = `revolut-${buildPaymentLink(readFields()).revtag}.svg`;
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  linkStatus.textContent = 'QR code downloaded as SVG.';
});

document.querySelector('#clear-data').addEventListener('click', () => {
  if (!window.confirm('Clear the last form and all saved presets from this browser?')) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    storageNotice.hidden = true;
  } catch {
    storageWarning('Could not clear browser storage. Remove this site’s data in your browser settings.');
    return;
  }
  state = { draft: { ...DEFAULT_FIELDS }, presets: [] };
  touched.clear();
  setFields(state.draft);
  presetName.value = '';
  update();
  renderPresets();
  presetStatus.textContent = 'Last form and saved presets cleared.';
  inputs.revtag.focus();
});

setFields(state.draft);
update();
renderPresets();
