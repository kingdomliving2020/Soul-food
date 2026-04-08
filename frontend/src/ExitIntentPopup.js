import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ExitIntentPopup = () => {
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);
  const timerRef = useRef(null);

  const shouldSuppress = useCallback(() => {
    // Already shown this session
    if (sessionStorage.getItem('exit_popup_shown')) return true;
    // User has purchases (logged in with content)
    const user = localStorage.getItem('soul_food_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.access_level && parsed.access_level !== 'free') return true;
      } catch {}
    }
    // User is in checkout flow
    if (window.location.pathname.includes('checkout') || 
        window.location.pathname.includes('payment') ||
        window.location.pathname.includes('order-success')) return true;
    return false;
  }, []);

  const showPopup = useCallback(() => {
    if (shownRef.current || shouldSuppress()) return;
    shownRef.current = true;
    sessionStorage.setItem('exit_popup_shown', 'true');
    setVisible(true);
  }, [shouldSuppress]);

  useEffect(() => {
    // Don't initialize if already shown or should suppress
    if (shouldSuppress()) return;

    // Desktop: mouse leaving viewport (top edge)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        showPopup();
      }
    };

    // Mobile: back button / history popstate
    const handlePopState = () => {
      showPopup();
      // Push state back so the user stays on page
      window.history.pushState(null, '', window.location.href);
    };

    // Wait 5 seconds before enabling (don't trigger immediately on load)
    timerRef.current = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
      // Mobile: push a state so we can detect back
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }, 5000);

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showPopup, shouldSuppress]);

  const close = () => setVisible(false);

  const handleGetBundle = () => {
    close();
    const el = document.getElementById('bundle-offer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#bundle-offer';
    }
  };

  const handleFreeLesson = () => {
    close();
    window.location.href = '/lesson/free-sample';
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={close}
        data-testid="exit-popup-backdrop"
      />

      {/* Modal */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90vw] max-w-md"
        role="dialog"
        aria-labelledby="exit-popup-heading"
        data-testid="exit-intent-popup"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Close Button */}
          <button
            onClick={close}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
            aria-label="Close"
            data-testid="exit-popup-close"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>

          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

          <div className="p-6 sm:p-8 text-center">
            <h2 id="exit-popup-heading" className="text-xl sm:text-2xl font-bold text-slate-800 mb-2" data-testid="exit-popup-headline">
              Before you go...
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mb-5">
              Start meaningful faith conversations at home or in your group.
            </p>

            {/* Bundle highlight */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Featured Bundle</p>
              <p className="font-bold text-slate-800 text-base">4C's + Break*fast Starter Bundle</p>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="text-sm text-slate-400 line-through">$26.98</span>
                <span className="text-xl font-bold text-amber-700">$21.99</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">2 full workbooks + online game access</p>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5">
              <Button
                onClick={handleGetBundle}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3.5 rounded-xl text-base font-bold shadow-lg"
                data-testid="exit-popup-get-bundle"
              >
                Get the Bundle
              </Button>
              <Button
                onClick={handleFreeLesson}
                variant="outline"
                className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl text-sm font-semibold"
                data-testid="exit-popup-free-lesson"
              >
                Try a Free Lesson
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExitIntentPopup;
