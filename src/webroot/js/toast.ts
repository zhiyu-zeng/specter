import { escapeHtml } from './utils.js';
import { getTranslation } from './i18n.js';

interface ToastOptions {
  /** Optional action button label */
  action?: string;
  /** Material icon name (e.g. `'check_circle'`, `'error'`) */
  icon?: string;
  /** Visual style variant */
  type?: 'success' | 'error' | 'info' | 'warning';
  /** Auto-close delay in ms (default 3000); 0 disables auto-close */
  autoCloseDelay?: number;
  /** Callback invoked when the action button is clicked */
  onActionClick?: () => void;
  /** Additional CSS class name(s) for the toast element */
  className?: string;
}

const toastTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/** Show a Material-styled toast notification. Returns the toast element for manual manipulation. */
export function showToast(message: string, options: ToastOptions = {}) {
  const { action, icon, type, autoCloseDelay = 3000, onActionClick, className } = options;

  const toast = document.createElement('div');
  toast.className = 'md-toast' + (className ? ' ' + className : '') + (type ? ' md-toast--' + type : '');
  toast.innerHTML = `
    ${icon ? `<md-icon class="md-toast__icon">${icon}</md-icon>` : ''}
    <span class="md-toast__message">${escapeHtml(message)}</span>
    <div class="md-toast__actions">
      ${action ? `<button class="md-toast__action">${action}</button>` : ''}
      <button class="md-toast__close" aria-label="${getTranslation('dialog_close') || 'Close'}"><md-icon>close</md-icon></button>
    </div>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('md-toast--open'));

  const closeBtn = toast.querySelector('.md-toast__close');
  if (closeBtn) closeBtn.addEventListener('click', () => close(toast));

  if (action && onActionClick) {
    const actionBtn = toast.querySelector('.md-toast__action');
    if (actionBtn) actionBtn.addEventListener('click', () => {
      close(toast);
      onActionClick();
    });
  }

  if (autoCloseDelay > 0) {
    const timer = setTimeout(() => close(toast), autoCloseDelay);
    toastTimers.set(toast, timer);
  }

  initSwipe(toast);

  return toast;
}

function initSwipe(toast: HTMLElement) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const onStart = (e: PointerEvent) => {
    startX = e.clientX;
    currentX = 0;
    dragging = true;
    toast.style.transition = 'none';
    const timer = toastTimers.get(toast);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(toast);
    }
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    currentX = e.clientX - startX;
    const isRtl = document.documentElement.dir === 'rtl';
    if (isRtl) {
      if (currentX > 0) currentX = 0;
    } else {
      if (currentX < 0) currentX = 0;
    }
    const maxDrag = window.innerWidth * 0.4;
    const absX = Math.min(Math.abs(currentX), maxDrag);
    if (isRtl) {
      toast.style.transform = `translateX(calc(50% - ${absX}px)) translateY(0)`;
    } else {
      toast.style.transform = `translateX(calc(-50% + ${absX}px)) translateY(0)`;
    }
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    toast.style.transition = '';
    const isRtl = document.documentElement.dir === 'rtl';
    if ((isRtl && currentX < -80) || (!isRtl && currentX > 80)) {
      close(toast, { dismiss: true });
    } else {
      toast.style.transform = '';
      toast.classList.add('md-toast--open');
    }
  };

  toast.addEventListener('pointerdown', onStart, { passive: true });
  toast.addEventListener('pointermove', onMove, { passive: true });
  toast.addEventListener('pointerup', onEnd);
  toast.addEventListener('pointercancel', onEnd);
}

function close(toast: HTMLElement, { dismiss = false }: { dismiss?: boolean } = {}) {
  toast.classList.remove('md-toast--open');
  if (dismiss) toast.classList.add('md-toast--dismiss');
  toast.addEventListener('transitionend', () => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, { once: true });
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

/** Manually close a toast notification by its element reference. */
export function closeToast(toast: HTMLElement) {
  close(toast);
}
