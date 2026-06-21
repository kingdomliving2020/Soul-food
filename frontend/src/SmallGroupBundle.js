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

const PRESETS = [
  { key: '4a',   label: '4 Adult',          mix: ['ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ae-booklet'] },
  { key: '4y',   label: '4 Youth',          mix: ['ihi-ye-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet'] },
  { key: '2-2',  label: '2 Adult + 2 Youth',mix: ['ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet'] },
  { key: '3-1',  label: '3 Adult + 1 Youth',mix: ['ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ae-booklet', 'ihi-ye-booklet'] },
  { key: '1-3',  label: '1 Adult + 3 Youth',mix: ['ihi-ae-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet', 'ihi-ye-booklet'] },
];

export const BUNDLE_PRICE = 44.99;

const SmallGroupBundleModal = ({ open, onClose }) => {
  const { addToCart } = useCart();
  const [slots, setSlots] = useState(PRESETS[0].mix);
  const [activePreset, setActivePreset] = useState('4a');

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
    setSlots(p.mix);
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
      id: 'bundle-small-group',
      productId: 'bundle-small-group',
      uniqueKey: `bundle-small-group-${Date.now()}`,
      name: 'Small Group Bundle — 1 IE + 4 Participant Seats',
      price: BUNDLE_PRICE,
      salePrice: BUNDLE_PRICE,
      listPrice: BUNDLE_PRICE,
      quantity: 1,
      isSmallGroupBundle: true,
      metadata: {
        instructor_edition: 1,
        participant_mix: slots,
        summary,
      },
    });
    toast.success(`Small Group Bundle added · ${summary}`);
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
              <h3 className="text-lg font-bold text-slate-900">Small Group Bundle</h3>
              <p className="text-xs text-slate-600">Choose your 4 participant booklets</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" data-testid="sgb-close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Includes summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-1">Includes</div>
            <ul className="text-sm text-slate-700 space-y-1">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 1 Instructor Edition</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 4 Participant Booklets (you choose the mix)</li>
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

          {/* 4 slot pickers */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Your 4 Booklets</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slots.map((id, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-12">Slot {idx + 1}</span>
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
              <div className="text-2xl font-bold text-slate-900">${BUNDLE_PRICE.toFixed(2)}</div>
            </div>
            <div className="text-xs text-slate-600 max-w-[60%] text-right">
              <span className="text-emerald-700 font-semibold">Save up to $39.96</span> vs buying separately. <br />
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
            Add Bundle to Cart · ${BUNDLE_PRICE.toFixed(2)}
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
        🟢 Best for Small Groups
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-1">Small Group Bundle</h3>
      <p className="text-sm text-slate-600 mb-4">
        Built for ministry teams, study groups, homeschool & church classes.
      </p>
      <ul className="text-sm text-slate-700 space-y-1.5 mb-5">
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> 1 Instructor Edition</li>
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> 4 Participant Booklets (your mix)</li>
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> Choose Adult, Youth, or any combo</li>
        <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> +$1 OFF each extra booklet added</li>
      </ul>
      <div className="mt-auto">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-bold text-emerald-700">${BUNDLE_PRICE.toFixed(2)}</span>
          <span className="text-xs text-slate-500">Save up to $39.96 vs separately</span>
        </div>
        <Button
          onClick={onOpen}
          data-testid="sgb-open"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold py-3"
        >
          Build Your Bundle →
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default SmallGroupBundleModal;
