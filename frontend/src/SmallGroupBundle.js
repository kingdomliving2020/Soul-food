import React, { useState, useMemo } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { useCart } from './CartContext';
import { toast } from 'sonner';
import { X, Users, Check } from 'lucide-react';

// Participant booklet options the customer can pick per slot.
// IDs match the catalog SKUs; price is what the booklet costs INSIDE the bundle.
const BOOKLET_OPTIONS = [
  { id: 'ihi-ae-booklet',      label: 'In His Image — Adult',       edition: 'adult', series: 'IHI' },
  { id: 'ihi-ye-booklet',      label: 'In His Image — Youth',       edition: 'youth', series: 'IHI' },
  { id: '4cs-ae',              label: "4 C's of Christianity — Adult", edition: 'adult', series: '4Cs' },
  { id: '4cs-ye',              label: "4 C's of Christianity — Youth", edition: 'youth', series: '4Cs' },
  { id: 'breakfast-ae',        label: 'Foundation in Christ — Adult', edition: 'adult', series: 'Foundation' },
  { id: 'breakfast-ye',        label: 'Foundation in Christ — Youth', edition: 'youth', series: 'Foundation' },
];

// Bundle tiers. The buyer picks a class size — no math, no configuration.
// `seats` = how many participant booklets the buyer can pick.
// `payFor` = how many participants the price reflects (the rest are "free seats").
// Price is held flat per tier so churches can buy by class size.
const TIERS = [
  {
    key: 'sgb-4',
    label: 'Small Group Bundle',
    subtitle: '1 Instructor + 4 Participants',
    seats: 4,
    payFor: 4,
    price: 44,
    badge: 'Original',
    color: 'emerald',
  },
  {
    key: 'sgb-starter',
    label: 'Starter Bundle',
    subtitle: '1 Instructor + 5 Participants',
    seats: 5,
    payFor: 5,
    price: 55,
    badge: 'New',
    color: 'sky',
  },
  {
    key: 'sgb-small',
    label: 'Small Group (10)',
    subtitle: '1 Instructor + 10 Participants · pay for 8',
    seats: 10,
    payFor: 8,
    price: 88,
    badge: '+2 Free Seats',
    color: 'teal',
  },
  {
    key: 'sgb-medium',
    label: 'Medium Group (15)',
    subtitle: '1 Instructor + 15 Participants · pay for 12',
    seats: 15,
    payFor: 12,
    price: 132,
    badge: '+3 Free Seats',
    color: 'indigo',
  },
];

const DEFAULT_TIER = TIERS[0];

const PRESETS = [
  { key: '4a',   label: '4 Adult',          mix: ['ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ae-booklet'] },
  { key: '4y',   label: '4 Youth',          mix: ['ihi-ye-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet'] },
  { key: '2-2',  label: '2 Adult + 2 Youth',mix: ['ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet'] },
  { key: '3-1',  label: '3 Adult + 1 Youth',mix: ['ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ye-booklet'] },
  { key: '1-3',  label: '1 Adult + 3 Youth',mix: ['ihi-ae-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet'] },
];

// Backwards compatible export — used by other files for the 4-seat bundle CTA copy.
export const BUNDLE_PRICE = DEFAULT_TIER.price;

const SmallGroupBundleModal = ({ open, onClose }) => {
  const { addToCart } = useCart();
  const [tier, setTier] = useState(DEFAULT_TIER);
  const [slots, setSlots] = useState(() => Array(DEFAULT_TIER.seats).fill('ihi-ae-booklet'));
  const [activePreset, setActivePreset] = useState('4a');

  // When tier changes, resize the slots to match new seat count, defaulting to Adult.
  const changeTier = (next) => {
    setTier(next);
    setSlots(() => Array(next.seats).fill('ihi-ae-booklet'));
    setActivePreset('custom');
  };

  const summary = useMemo(() => {
    const counts = {};
    for (const id of slots) {
      const opt = BOOKLET_OPTIONS.find(o => o.id === id);
      const label = opt?.label || id;
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts).map(([label, n]) => `${n}× ${label}`).join(' · ');
  }, [slots]);

  if (!open) return null;

  const applyPreset = (presetKey) => {
    const p = PRESETS.find(x => x.key === presetKey);
    if (!p) return;
    // Resize preset mix to current tier seat count by repeating/truncating.
    const next = [];
    for (let i = 0; i < tier.seats; i++) {
      next.push(p.mix[i % p.mix.length]);
    }
    setSlots(next);
    setActivePreset(presetKey);
  };

  const updateSlot = (idx, value) => {
    const next = [...slots];
    next[idx] = value;
    setSlots(next);
    setActivePreset('custom');
  };

  const handleAdd = () => {
    addToCart({
      id: tier.key,
      productId: tier.key,
      uniqueKey: `${tier.key}-${Date.now()}`,
      name: `${tier.label} — 1 IE + ${tier.seats} Participant Seats`,
      price: tier.price,
      salePrice: tier.price,
      listPrice: tier.price,
      quantity: 1,
      isSmallGroupBundle: true,
      metadata: {
        instructor_edition: 1,
        participant_seats: tier.seats,
        pay_for_seats: tier.payFor,
        participant_mix: slots,
        summary,
        bundleTier: tier.key,
      },
    });
    toast.success(`${tier.label} added · ${summary}`);
    onClose();
  };

  return (
    <div
      data-testid="sgb-modal"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{tier.label}</h3>
              <p className="text-xs text-slate-600">{tier.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" data-testid="sgb-close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Tier picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Pick Your Class Size
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {TIERS.map(t => {
                const isActive = tier.key === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => changeTier(t)}
                    data-testid={`sgb-tier-${t.key}`}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <div className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${isActive ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      {t.badge}
                    </div>
                    <div className="font-bold text-sm leading-tight mb-0.5">
                      {t.seats} Seats
                    </div>
                    <div className={`text-[11px] ${isActive ? 'text-emerald-50' : 'text-slate-500'}`}>
                      ${t.price.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Includes summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-1">Includes</div>
            <ul className="text-sm text-slate-700 space-y-1">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 1 Instructor Edition (no duplicates)</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> {tier.seats} Participant Booklets (you choose the mix)</li>
              {tier.payFor < tier.seats && (
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Price reflects {tier.payFor} participants — {tier.seats - tier.payFor} free seats included</li>
              )}
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Auto $1 off each extra booklet added to your cart</li>
            </ul>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Quick Picks</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  data-testid={`sgb-preset-${p.key}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    activePreset === p.key
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  activePreset === 'custom' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                Custom Mix
              </span>
            </div>
          </div>

          {/* Dynamic seat pickers */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Your {tier.seats} Booklets</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slots.map((id, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-16">Seat {idx + 1}</span>
                  <select
                    data-testid={`sgb-slot-${idx + 1}`}
                    value={id}
                    onChange={(e) => updateSlot(idx, e.target.value)}
                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {BOOKLET_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Bundle total</div>
              <div className="text-2xl font-bold text-slate-900">${tier.price.toFixed(2)}</div>
            </div>
            <div className="text-xs text-slate-600 max-w-[60%] text-right">
              <span className="text-emerald-700 font-semibold">Best for {tier.seats}-person classes.</span> <br />
              Need more seats? Add booklets to your cart — each one is $1 off.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} data-testid="sgb-cancel">Cancel</Button>
          <Button
            onClick={handleAdd}
            data-testid="sgb-add-to-cart"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Add Bundle to Cart · ${tier.price.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
};

// The storefront product card you click to open the modal.
export const SmallGroupBundleCard = ({ onOpen }) => (
  <Card data-testid="sgb-card" className="shadow-xl border-2 border-emerald-200 hover:border-emerald-400 transition-colors h-full flex flex-col">
    <CardContent className="p-5 flex flex-col h-full">
      <div className="self-start mb-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
        🟢 Built for Groups
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-1">Small Group Bundles</h3>
      <p className="text-sm text-slate-600 mb-4">
        Pick your class size — 4, 5, 10, or 15 seats. Ministry teams · homeschool · church classes.
      </p>
      <ul className="text-sm text-slate-700 space-y-1.5 mb-5">
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> 1 Instructor Edition (no duplicates)</li>
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> Participant Booklets — your mix of Adult / Youth</li>
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> Bigger tiers include free seats (no math)</li>
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> +$1 OFF each extra booklet added</li>
      </ul>
      <div className="mt-auto">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-bold text-emerald-700">From ${BUNDLE_PRICE.toFixed(2)}</span>
          <span className="text-xs text-slate-500">4 · 5 · 10 · 15 seats</span>
        </div>
        <Button
          onClick={onOpen}
          data-testid="sgb-open"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold py-3"
        >
          Pick Class Size →
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default SmallGroupBundleModal;
