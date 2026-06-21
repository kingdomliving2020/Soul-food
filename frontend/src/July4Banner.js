import React from 'react';

/**
 * July4Banner — Phase 1 Independence Day campaign.
 * Auto-hides after July 7, 2026 (server-side check would be ideal, but client-side
 * is fine for a soft campaign window and avoids a deploy to turn it off).
 *
 * CTA navigates to /quick-order?promo=FREEDOM10 — PromoCapture catches the param,
 * stores the code, and the checkout will auto-apply the 10% discount.
 */
const CAMPAIGN_END = Date.UTC(2026, 6, 7, 4, 0, 0); // July 7 04:00 UTC = end of July 6 ET

const FEATURED = [
  { name: 'In His Image', img: '/covers/ihi-ae-booklet.png' },
  { name: 'GRinCH Bingo', img: '/covers/game-gridiron-ae.png' },
  { name: 'Passport Trek', img: '/covers/game-passport-ae.png' },
  { name: 'Foundation in Christ', img: '/covers/game-gridiron-ae.png', tag: 'Coming Soon' },
];

const July4Banner = () => {
  if (Date.now() > CAMPAIGN_END) return null;

  return (
    <section
      data-testid="july4-banner"
      className="relative overflow-hidden border-y-2 border-red-700/40"
      style={{
        background:
          'linear-gradient(135deg, #7f1d1d 0%, #1e3a8a 50%, #7f1d1d 100%)',
      }}
    >
      {/* Stars overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1.5px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-widest mb-2">
          <span aria-hidden="true">★</span>
          <span>Independence Day Campaign · Limited Time</span>
          <span aria-hidden="true">★</span>
        </div>

        <h2
          data-testid="july4-headline"
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3"
        >
          Freedom Takes on a Whole New Meaning{' '}
          <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
            in Christ
          </span>
        </h2>

        <p
          data-testid="july4-subheadline"
          className="text-base sm:text-lg text-blue-100 max-w-2xl mb-5"
        >
          Celebrate Independence Day by exploring the freedom found in Jesus Christ.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-7">
          <a
            data-testid="july4-cta"
            href="/quick-order?promo=FREEDOM10"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 px-7 py-3 rounded-xl text-base sm:text-lg font-bold shadow-2xl hover:shadow-amber-400/40 transform hover:scale-105 transition-all"
          >
            Shop the July 4 Collection
            <span aria-hidden="true">→</span>
          </a>
          <div className="text-amber-200 text-sm">
            Use code{' '}
            <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded font-mono font-bold">
              FREEDOM10
            </span>{' '}
            at checkout (auto-applies)
          </div>
        </div>

        {/* Featured products */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="july4-featured">
          {FEATURED.map((p) => (
            <a
              key={p.name}
              href="/quick-order?promo=FREEDOM10"
              className="group bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15 hover:border-amber-300/60 rounded-xl p-3 transition-all"
              data-testid={`july4-featured-${p.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="aspect-square bg-white/90 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="text-white text-sm font-semibold leading-tight">{p.name}</div>
              {p.tag && (
                <div className="text-amber-300 text-[10px] uppercase tracking-wider mt-1 font-bold">
                  {p.tag}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default July4Banner;
