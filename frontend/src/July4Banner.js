import React from 'react';

/**
 * Freedom25Banner (exported as July4Banner for existing imports).
 * "25 Days of Freedom" site-wide campaign — code FREEDOM25 = 25% off orders $100+.
 * Auto-hides after the campaign window. Messaging always discloses the $100+ floor
 * to stay truthful with the backend coupon config (min_cart_total = 100).
 */
const CAMPAIGN_END = Date.UTC(2026, 7, 1, 4, 0, 0); // Aug 1 04:00 UTC (end of campaign window)

const FEATURED = [
  { name: 'Foundation in Christ', img: '/covers/tile-foundation.png', tag: 'Booklets Available Now' },
  { name: 'Small Group Bundles', img: '/covers/tile-smallgroup-community.png', tag: '1 IE + Participant Seats' },
  { name: 'Game Master Bundle', img: '/covers/tile-games.png', tag: 'Fellowship & Fun' },
  { name: 'In His Image', img: '/covers/tile-ihi.png', tag: 'Start Here' },
];

const July4Banner = () => {
  if (Date.now() > CAMPAIGN_END) return null;

  return (
    <section
      data-testid="freedom25-banner"
      className="relative overflow-hidden border-y-2 border-amber-400/50"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(251,191,36,0.5) 1px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
          <span aria-hidden="true">★</span>
          <span>25 Days of Freedom · Limited Time</span>
          <span aria-hidden="true">★</span>
        </div>

        <h2
          data-testid="freedom25-headline"
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 text-center"
        >
          25 Days of{' '}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
            Freedom
          </span>
        </h2>

        <p
          data-testid="freedom25-subheadline"
          className="text-base sm:text-lg text-amber-50 max-w-2xl mb-2 mx-auto text-center"
        >
          Grow your faith. Equip your family. Strengthen your ministry.
        </p>
        <p className="text-sm sm:text-base text-indigo-100 max-w-2xl mb-5 mx-auto text-center">
          Use code{' '}
          <span className="bg-amber-400 text-indigo-950 px-2 py-0.5 rounded font-mono font-bold">FREEDOM25</span>{' '}
          for <span className="font-semibold text-white">25% off orders $100+</span> on select Soul Food resources — for a limited time.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-7">
          <a
            data-testid="freedom25-cta"
            href="/quick-order?promo=FREEDOM25"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 px-7 py-3 rounded-xl text-base sm:text-lg font-bold shadow-xl transform hover:scale-105 transition-all"
          >
            Shop Now
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Featured products */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="freedom25-featured">
          {FEATURED.map((p) => (
            <a
              key={p.name}
              href="/quick-order?promo=FREEDOM25"
              className="group bg-white/90 hover:bg-white backdrop-blur-sm border-2 border-amber-300/50 hover:border-amber-400 rounded-xl p-3 transition-all shadow-sm hover:shadow-md"
              data-testid={`freedom25-featured-${p.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="aspect-square bg-white rounded-lg overflow-hidden mb-2 border border-slate-100">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="text-slate-800 text-sm font-semibold leading-tight">{p.name}</div>
              {p.tag && (
                <div className="text-indigo-700 text-[10px] uppercase tracking-wider mt-1 font-bold min-h-[1.5em]">{p.tag}</div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default July4Banner;
