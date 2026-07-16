'use client';

import { useEffect, useState } from 'react';
import { MonitorDown, Share, X } from 'lucide-react';
import { getBookmarkIds, getMeta, onBookmarksChanged, setMeta } from '@/lib/bookmarks';

const DISMISS_KEY = 'installPromptDismissedAt';
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // a month of quiet

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Contextual install card. Shows only after the visitor has saved at least one
 * review (the moment the app has demonstrated value), never in standalone
 * mode, and respects dismissal for a month. On Chromium it drives the real
 * install prompt; on iOS it shows the Add-to-Home-Screen steps.
 *
 * The honest pitch: installing puts abya.tv in the Android share sheet, so
 * "Share -> abya.tv" works straight from the YouTube app.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    let alive = true;
    const evaluate = async () => {
      const [ids, dismissedAt] = await Promise.all([
        getBookmarkIds(),
        getMeta<number>(DISMISS_KEY),
      ]);
      if (!alive) return;
      const cooled = !dismissedAt || Date.now() - dismissedAt > DISMISS_COOLDOWN_MS;
      setVisible(ids.length > 0 && cooled);
    };
    evaluate();
    const off = onBookmarksChanged(evaluate);
    return () => {
      alive = false;
      off();
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
  }, []);

  // Chromium shows the card once the event fired; iOS shows instructions.
  if (!visible || (!deferred && !isIOS)) return null;

  const dismiss = () => {
    setVisible(false);
    setMeta(DISMISS_KEY, Date.now());
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'dismissed') setMeta(DISMISS_KEY, Date.now());
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-md border border-ink-500/80 bg-ink-800/95 p-4 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-6">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2.5 top-2.5 text-paper/40 hover:text-paper"
      >
        <X size={16} />
      </button>
      <p className="flex items-center gap-2 pr-6 font-mono text-xs font-bold uppercase tracking-widest text-signal">
        <MonitorDown size={14} /> Keep your saved files handy
      </p>
      {isIOS ? (
        <p className="mt-2 text-sm leading-relaxed text-paper/70">
          Add abya.tv to your home screen: tap <Share size={13} className="inline text-paper/90" />{' '}
          Share, then <span className="text-paper/90">&ldquo;Add to Home Screen.&rdquo;</span> Your
          saved reviews stay on this device. No account, ever.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-paper/70">
            Install abya.tv and it shows up in your share menu — check a video straight from the
            YouTube app. Your saved reviews stay on this device. No account, ever.
          </p>
          <button
            onClick={install}
            className="mt-3 rounded-sm border border-amber px-4 py-2 font-mono text-xs uppercase tracking-widest text-amber transition hover:bg-amber hover:text-ink"
          >
            Install
          </button>
        </>
      )}
    </div>
  );
}
