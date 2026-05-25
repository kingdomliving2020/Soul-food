import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Truck, Globe, MapPin, Clock, Heart, Mail } from 'lucide-react';

const ShippingPolicy = () => {
  const navigate = useNavigate();
  const lastUpdated = 'May 25, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50" data-testid="shipping-policy-page">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
              data-testid="shipping-policy-back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Shipping &amp; Delivery</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-10">
          <div className="mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-xl"><Truck className="w-7 h-7 text-indigo-700" /></div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">SOFU Shipping &amp; Delivery Policy</h2>
            </div>
            <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
          </div>

          {/* DIGITAL PRODUCTS */}
          <section className="mb-8" data-testid="section-digital">
            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" /> Digital Products</h3>
            <ul className="space-y-2 text-slate-700 list-disc list-inside ml-2">
              <li>Digital products are delivered electronically after successful purchase confirmation.</li>
              <li>Customers should receive download access shortly after checkout completion.</li>
            </ul>
          </section>

          {/* PHYSICAL SHIPPING */}
          <section className="mb-8" data-testid="section-physical">
            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-600" /> Physical Product Shipping</h3>
            <div className="bg-slate-50 rounded-xl p-5 mb-4">
              <h4 className="font-semibold text-slate-800 mb-3">Standard Shipping Rates</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-200 py-2"><span>Local Delivery (select areas)</span><span className="font-bold text-emerald-700">FREE</span></div>
                <div className="flex justify-between border-b border-slate-200 py-2"><span>Continental U.S.</span><span className="font-bold">$5.99</span></div>
                <div className="flex justify-between border-b border-slate-200 py-2"><span>West Coast (CA, OR, WA) &amp; Canada</span><span className="font-bold">$7.99</span></div>
                <div className="flex justify-between py-2"><span>Hawaii, Alaska, APO/FPO</span><span className="font-bold">Starting at $15.99</span></div>
              </div>
            </div>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-amber-900 mb-2">Free Shipping Offer</h4>
              <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside">
                <li>Orders over $55 qualify for free standard shipping.</li>
                <li>Bulk/group ministry orders excluded from automatic free shipping eligibility.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Processing &amp; Delivery</h4>
              <ul className="text-slate-700 text-sm space-y-1 list-disc list-inside ml-2">
                <li>Most physical orders ship within 5–10 business days unless otherwise noted.</li>
                <li>Preorders and specialty print items may require additional processing time.</li>
                <li>Customers will receive updates if fulfillment timelines change.</li>
              </ul>
            </div>
          </section>

          {/* MINISTRY */}
          <section className="mb-8" data-testid="section-ministry">
            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-600" /> Ministry &amp; Nonprofit Orders</h3>
            <ul className="space-y-2 text-slate-700 list-disc list-inside ml-2">
              <li>Verified 501(c)(3) organizations may qualify for ministry pricing or bulk-order discounts.</li>
              <li>Verification documentation may be required before discounts are applied.</li>
            </ul>
          </section>

          {/* IMPORTANT NOTES */}
          <section className="mb-8" data-testid="section-notes">
            <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-purple-600" /> Important Notes</h3>
            <ul className="space-y-2 text-slate-700 list-disc list-inside ml-2">
              <li>Shipping rates may vary for large ministry bundles, VBS packages, or specialty orders.</li>
              <li>International shipping outside Canada may require custom invoicing.</li>
              <li>Local delivery availability may vary by region and event schedule.</li>
            </ul>
          </section>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" /> Questions about a specific order?</h4>
            <p className="text-sm text-slate-600">Reach out to <a href="mailto:support@kingdom-soul.com" className="text-indigo-600 underline font-medium">support@kingdom-soul.com</a> with your order number and we'll be in touch within one business day.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
