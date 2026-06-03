import { exec as bridgeExec } from './bridge.js';
import { shellEscape } from './utils.js';

let MODULE: string | null = null;
const cache: Record<string, string | undefined | null> = {};

/** Set the module base directory for config file access. */
export function setModuleDir(path: string) { MODULE = path; }

/** Pre-populate the config cache by reading all `.val` files from the config directory. */
export async function cfgInit() {
  if (!MODULE) return;
  const cfgDir = shellEscape(MODULE + '/config');
  const cmd = `for f in ${cfgDir}/*.val; do [ -f "\$f" ] || continue; k="\${f##*/}"; k="\${k%.val}"; v="\$(cat "\$f")"; [ -n "\$v" ] || continue; printf 'CFG:%s\n' "\$k"; printf '%s\n' "\$v"; done`;
  const result = await bridgeExec(cmd);
  const stdout = (result.stdout || '').trim();
  if (!stdout) return;
  const lines = stdout.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.startsWith('CFG:')) continue;
    const key = line.slice(4);
    const next = lines[i + 1];
    const value = next || '';
    cache[key] = value;
    i++;
  }
}

async function readConfig(key: string): Promise<string | null> {
  if (!MODULE) return null;
  const result = await bridgeExec(
    `cat ${shellEscape(MODULE + '/config/' + key + '.val')} 2>/dev/null || true`
  );
  return (result.stdout || '').trim() || null;
}

function writeConfig(key: string, val: string | undefined | null) {
  if (!MODULE) return Promise.resolve();
  const cmd =
    `mkdir -p ${shellEscape(MODULE + '/config')} && printf '%s' ${shellEscape(val || '')} > ${shellEscape(MODULE + '/config/' + key + '.val')}`;
  return bridgeExec(cmd).catch((err: any) => console.warn('Config write failed for', key, err));
}

/** Retrieve a config value by key. Checks the in-memory cache first, then reads from disk. Returns the stored value, `defaultValue`, or `null`. */
export async function cfgGet(key: string, defaultValue?: string): Promise<string | undefined | null> {
  if (key in cache) return cache[key];
  const val = await readConfig(key);
  cache[key] = val ?? defaultValue;
  return cache[key];
}

/** Set a config value both in cache and on disk. */
export function cfgSet(key: string, val: string | undefined | null) {
  cache[key] = val;
  writeConfig(key, val);
}

/** Remove one key (or all keys when called without argument) from the in-memory cache. */
export function cfgInvalidate(key?: string) {
  if (key) {
    delete cache[key];
  } else {
    for (const k of Object.keys(cache)) delete cache[k];
  }
}

/** Persist all pending config writes to disk. Currently a no-op (writes are synchronous). */
export async function cfgFlush() {
}

/** Migrate legacy localStorage keys (`selectedLanguage`, `themeMode`, `themePreset`) to the new config system. Idempotent — only runs once. */
export async function migrateLocalStorage() {
  try {
    if (localStorage.getItem('_cfg_migrated')) return;
    const map: Record<string, string> = {
      selectedLanguage: 'lang',
      themeMode: 'theme',
      themePreset: 'theme_preset',
    };
    for (const [oldKey, newKey] of Object.entries(map)) {
      const val = localStorage.getItem(oldKey);
      if (val) {
        cache[newKey] = val;
        writeConfig(newKey, val);
      }
    }
    localStorage.removeItem('themeMode');
    localStorage.removeItem('themePreset');
    localStorage.removeItem('clockFormat');
    localStorage.setItem('_cfg_migrated', '1');
  } catch (e) {
    console.warn('Migration failed:', e);
  }
}
