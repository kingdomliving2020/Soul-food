import { useEffect, useState } from 'react';
import { X, Smartphone, Share, Plus } from 'lucide-react';

/*
 * SOFU Add-to-Home-Screen Prompt
 * --------------------------------
 * Lightweight, non-intrusive PWA install nudge.
 *
 *   • Mobile only (UA + viewport check)
 *   • Repeat visitors only — shows on session #2+
 *   • Delayed trigger (30s after mount, on idle)
 *   • Hidden when already installed (display-mode: standalone)
 *   • Suppressed on auth / checkout / lesson pages (no-friction zones)
 *   • Dismissible — "Maybe later" hides for 14 days; "Don't show again" forever
 *   • iOS fallback shows manual instructions (no beforeinstallprompt support)
 */

const LS_SESSION_COUNT = 'sofu_session_count';
const LS_LAST_SESSION = 'sofu_last_session_at';
const LS_DISMISSED_UNTIL = 'sofu_install_prompt_dismissed_until';
const LS_PROMPT_DISABLED = 'sofu_install_prompt_disabled';

// 30 minutes = end of session; longer gap = new session
const SESSION_GAP_MS = 30 * 60 * 1000;
const DELAY_AFTER_LOAD_MS = 30 * 1000;
const SNOOZE_DAYS = 14;

const SUPPRESSED_PATH_PREFIXES = [
  '/checkout',
  '/auth',
  '/login',
  '/2fa-setup',
  '/2fa-verify',
  '/forgot-password',
  '/reset-password',
  '/payment-success',
  '/payment-cancel',
  '/redeem',
  '/admin',
  '/lesson',
  '/interactive-lesson',
  '/game',
  '/instructor-toolbox',
];

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const narrow = typeof window !== 'undefined' && window.innerWidth <= 820;
  return uaMobile || narrow;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAlreadyInstalled() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if (window.navigator && window.navigator.standalone === true) return true;
  return false;
}

function bumpSessionCount() {
  try {
    const now = Date.now();
    const last = parseInt(localStorage.getItem(LS_LAST_SESSION) || '0', 10);
    let count = parseInt(localStorage.getItem(LS_SESSION_COUNT) || '0', 10);
    if (!last || now - last > SESSION_GAP_MS) {
      count += 1;
      localStorage.setItem(LS_SESSION_COUNT, String(count));
    }
    localStorage.setItem(LS_LAST_SESSION, String(now));
    return count;
  } catch {
    return 0;
  }
}

function getDismissedUntil() {
  try {
    return parseInt(localStorage.getItem(LS_DISMISSED_UNTIL) || '0', 10);
  } catch {
    return 0;
  }
}

function isSuppressedPath() {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname || '';
  return SUPPRESSED_PATH_PREFIXES.some((prefix) => p.startsWith(prefix));
}

const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [iosMode, setIosMode] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Hard gates: skip everything if any of these fail
    if (!isMobile()) return;
    if (isAlreadyInstalled()) return;
    if (isSuppressedPath()) return;
    try {
      if (localStorage.getItem(LS_PROMPT_DISABLED) === '1') return;
      const until = getDismissedUntil();
      if (until && Date.now() < until) return;
    } catch {
      return;
    }

    const sessionCount = bumpSessionCount();
    if (sessionCount < 2) return;

    let timer = null;
    let mounted = true;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredEvent(e);
      timer = setTimeout(() => {
        if (mounted && !isSuppressedPath()) {
          setShow(true);
          requestAnimationFrame(() => setAnimateIn(true));
        }
      }, DELAY_AFTER_LOAD_MS);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Safari doesn't fire beforeinstallprompt — show manual guidance.
    if (isIOS()) {
      timer = setTimeout(() => {
        if (mounted && !isSuppressedPath()) {
          setIosMode(true);
          setShow(true);
          requestAnimationFrame(() => setAnimateIn(true));
        }
      }, DELAY_AFTER_LOAD_MS);
    }

    const handleInstalled = () => {
      setShow(false);
      try { localStorage.setItem(LS_PROMPT_DISABLED, '1'); } catch (_) { /* no-op */ }
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const close = (snoozeDays = SNOOZE_DAYS) => {
    setAnimateIn(false);
    setTimeout(() => setShow(false), 200);
    try {
      const until = Date.now() + snoozeDays * 24 * 60 * 60 * 1000;
      localStorage.setItem(LS_DISMISSED_UNTIL, String(until));
    } catch (_) { /* no-op */ }
  };

  const closePermanent = () => {
    setAnimateIn(false);
    setTimeout(() => setShow(false), 200);
    try { localStorage.setItem(LS_PROMPT_DISABLED, '1'); } catch (_) { /* no-op */ }
  };

  const onInstall = async () => {
    if (!deferredEvent) return;
    try {
      deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        try { localStorage.setItem(LS_PROMPT_DISABLED, '1'); } catch (_) { /* no-op */ }
      } else {
        close(SNOOZE_DAYS);
      }
    } catch (_) {
      close(SNOOZE_DAYS);
    } finally {
      setDeferredEvent(null);
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Add Soul Food to your home screen"
      data-testid="install-prompt"
      className={`fixed inset-x-0 bottom-0 z-[60] pointer-events-none transition-all duration-200 ease-out ${
        animateIn ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="mx-auto max-w-md p-3 pointer-events-auto">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
          <button
            type="button"
            onClick={() => close(SNOOZE_DAYS)}
            aria-label="Dismiss for now"
            data-testid="install-prompt-close"
            className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-4 pr-9">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-indigo-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">
                  Welcome back — add Soul Food to your home screen?
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Faster return access for lessons, games, and your library — no app store, no extra space.
                </p>
              </div>
            </div>

            {iosMode ? (
              <div className="mt-3 text-xs text-gray-700 bg-indigo-50/70 rounded-lg p-2.5 leading-relaxed">
                <p className="font-semibold text-gray-800 mb-1">Two quick taps in Safari:</p>
                <ol className="space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <span className="font-bold text-indigo-700">1.</span>
                    Tap the <Share className="inline w-3.5 h-3.5 mx-0.5 text-indigo-700" /> Share button
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="font-bold text-indigo-700">2.</span>
                    Choose <Plus className="inline w-3.5 h-3.5 mx-0.5 text-indigo-700" /> &ldquo;Add to Home Screen&rdquo;
                  </li>
                </ol>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-2">
              {!iosMode && deferredEvent ? (
                <button
                  type="button"
                  onClick={onInstall}
                  data-testid="install-prompt-install"
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                  Add to home screen
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => close(SNOOZE_DAYS)}
                data-testid="install-prompt-later"
                className={`${iosMode ? 'flex-1' : ''} px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors`}
              >
                Maybe later
              </button>
            </div>

            <button
              type="button"
              onClick={closePermanent}
              data-testid="install-prompt-never"
              className="mt-2 text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              Don&apos;t show again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
