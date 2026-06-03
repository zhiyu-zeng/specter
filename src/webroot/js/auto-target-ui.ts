import { exec, getModuleDir } from './bridge.js';
import { cfgGet, cfgSet, cfgInvalidate } from './cfg.js';
import { showToast } from './toast.js';
import { getTranslation } from './i18n.js';
import { appendToOutput } from './terminal.js';
import { shellEscape } from './utils.js';

const t = (key: string, fallback: string): string => getTranslation(key) || fallback;

export function openAutoTargetDialog() {
  const dialog = document.createElement('md-dialog');
  dialog.id = 'auto-target-dialog';

  cfgGet('toggle_auto_target', '1').then(enabled => {
    cfgGet('auto_target_interval', '300').then(interval => {
      dialog.innerHTML = `
        <div slot="headline">
          <div class="at-dialog-headline">
            <md-icon aria-hidden="true">update</md-icon>
            <span>${t('auto_target_title', 'Auto Targeting')}</span>
          </div>
        </div>
        <div slot="content">
          <p class="at-dialog-desc">${t('auto_target_desc', 'Automatically watches for newly installed apps and adds them to Tricky Store target.txt.')}</p>

          <div class="list-container at-dialog-list">
            <div class="list-item list-item--toggle">
              <div class="li-icon"><md-icon aria-hidden="true">autorenew</md-icon></div>
              <div class="list-item-content">
                <div class="toggle-text">${t('auto_target_enable', 'Enable Auto Targeting')}</div>
                <span class="supporting-text">${t('auto_target_enable_desc', 'Watch for new app installs')}</span>
              </div>
              <div class="spacer"></div>
              <md-switch icons id="at-toggle" ${enabled === '1' ? 'selected' : ''}></md-switch>
            </div>

            <div class="list-item" id="at-interval-row">
              <div class="li-icon"><md-icon aria-hidden="true">timer</md-icon></div>
              <div class="list-item-content">
                <div class="toggle-text">${t('auto_target_interval', 'Interval (seconds)')}</div>
                <span class="supporting-text">${t('auto_target_interval_desc', 'How often to check for new apps. Minimum 3 seconds.')}</span>
              </div>
              <div class="spacer"></div>
              <md-outlined-text-field
                id="at-interval"
                inputmode="numeric"
                pattern="[0-9]*"
                min="3"
                value="${interval}"
                class="at-interval-field"
                style="text-align:center"
                aria-label="${t('auto_target_interval_aria', 'Interval in seconds')}"
              ></md-outlined-text-field>
            </div>
          </div>
        </div>
        <div slot="actions">
          <md-text-button id="at-cancel" class="dialog-action-close">${t('dialog_cancel', 'Cancel')}</md-text-button>
          <md-filled-button id="at-save">${t('dialog_save', 'Save')}</md-filled-button>
        </div>
      `;

      document.body.appendChild(dialog);
      dialog.addEventListener('close', () => document.body.removeChild(dialog));

      const toggle = dialog.querySelector('#at-toggle') as MdSwitch;
      const intervalField = dialog.querySelector('#at-interval') as HTMLInputElement;
      const saveBtn = dialog.querySelector('#at-save') as HTMLButtonElement;
      const cancelBtn = dialog.querySelector('#at-cancel') as HTMLButtonElement;

      cancelBtn.addEventListener('click', () => dialog.close());

      saveBtn.addEventListener('click', async () => {
        const newEnabled = toggle.selected ? '1' : '0';
        const newInterval = parseInt(intervalField.value || '15', 10);
        const clampedInterval = Math.max(3, newInterval);

        saveBtn.disabled = true;

        const modDir = getModuleDir();
        if (!modDir) {
          showToast(t('simple_toast_error', 'Failed'), { icon: 'error', type: 'error', autoCloseDelay: 3000 });
          saveBtn.disabled = false;
          return;
        }

        try {
          const oldEnabled = await cfgGet('toggle_auto_target', '1');
          cfgSet('toggle_auto_target', newEnabled);
          cfgSet('auto_target_interval', String(clampedInterval));

          if (modDir && newEnabled === '1' && oldEnabled !== '1') {
            await exec(`sh ${shellEscape(modDir + '/features/auto_target.sh')} >/dev/null 2>&1`);
            appendToOutput('[AUTO_TARGET] Immediate scan triggered via UI');
          }

          cfgInvalidate('toggle_auto_target');
          cfgInvalidate('auto_target_interval');

          showToast(t('auto_target_saved', 'Auto targeting settings saved'), { icon: 'check_circle', type: 'success', autoCloseDelay: 2500 });
          dialog.close();
        } catch (e) {
          showToast(t('simple_toast_error', 'Failed'), { icon: 'error', type: 'error', autoCloseDelay: 3000 });
        } finally {
          saveBtn.disabled = false;
        }
      });

      dialog.show();
    });
  });
}

export function wireAutoTarget() {
  const btn = document.getElementById('auto-target-btn');
  if (!btn) return;
  btn.addEventListener('click', openAutoTargetDialog);
}
