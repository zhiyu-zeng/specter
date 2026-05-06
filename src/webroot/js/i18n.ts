import { cfgGet, cfgSet } from './cfg.js';
import { fetchJson } from './utils.js';

let currentStrings: Record<string, string> = {};
let fallbackStrings: Record<string, string> = {};

export async function initI18n() {
  try {
    fallbackStrings = await fetchJson(`lang/source/string.json?ts=${Date.now()}`) || {};
  } catch (e) { console.warn('Failed to load fallback strings:', e); fallbackStrings = {}; }

  const saved = await cfgGet('lang', 'auto') || 'auto';
  let langCode: string;
  if (saved === 'auto') {
    const detected = (navigator.language || '').slice(0, 2);
    const available = ['en', 'zh', 'ru', 'es', 'ar'];
    langCode = available.includes(detected) ? detected : 'en';
  } else {
    langCode = saved;
  }
  await applyLanguage(langCode);
  wireLanguageSelect(langCode);
}

export async function applyLanguage(langCode: string) {
  const url = langCode === 'en'
    ? `lang/source/string.json?ts=${Date.now()}`
    : `lang/${langCode}.json?ts=${Date.now()}`;

  try {
    const res = await fetch(url);
    currentStrings = await res.json();
  } catch (e) { console.warn('Failed to load language:', e);
    currentStrings = {};
  }

  applyTranslations();
  cfgSet('lang', langCode);
  document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { langCode } }));
}

export function getTranslation(key: string): string | null {
  return currentStrings[key] || fallbackStrings[key] || null;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = (el as HTMLElement).dataset.i18n;
    if (!key) return;

    if (el.tagName === 'TITLE') {
      const val = currentStrings[key] || fallbackStrings[key];
      if (val) document.title = val;
      return;
    }

    const val = currentStrings[key] || fallbackStrings[key];
    if (!val) return;

    if (el.tagName === 'MD-NAVIGATION-TAB' || el.tagName === 'MD-ASSIST-CHIP' || el.tagName === 'MD-FILTER-CHIP') {
      (el as any).label = val;
      return;
    }

    if (val.includes('<')) {
      el.innerHTML = val;
    } else {
      while (el.firstChild) el.removeChild(el.firstChild);
      el.appendChild(document.createTextNode(val));
    }
  });

  document.querySelectorAll('md-filter-chip[data-preset]').forEach(chip => {
    const preset = (chip as HTMLElement).dataset.preset;
    if (!preset) return;
    const key = 'theme_preset_' + preset;
    const val = currentStrings[key] || fallbackStrings[key];
    if (val) (chip as any).label = val;
  });
}

function wireLanguageSelect(currentLang: string) {
  const select = document.getElementById('language-select');
  if (!select) return;

  Promise.all([
    customElements.whenDefined('md-outlined-select'),
    customElements.whenDefined('md-select-option'),
  ]).then(async () => {

  const LANGUAGES: [string, string, string][] = [
    ['en', '🇬🇧', 'English'],
    ['zh', '🇨🇳', '中文'],
    ['ru', '🇷🇺', 'Русский'],
    ['es', '🇪🇸', 'Español'],
    ['ar', '🇸🇦', 'العربية'],
  ];

  LANGUAGES.forEach(([code, flag, name]) => {
    const item = document.createElement('md-select-option');
    (item as any).value = code;
    const headline = document.createElement('div');
    headline.slot = 'headline';
    headline.textContent = `${flag} ${name}`;
    item.appendChild(headline);
    item.addEventListener('click', async () => {
      try {
        await applyLanguage(code);
        (select as any).value = code;
      } catch (e) {
        console.warn('Language change failed:', e);
      }
    });
    select.appendChild(item);
  });

  await new Promise(r => requestAnimationFrame(r));
  (select as any).value = currentLang;
  });
}
