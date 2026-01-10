import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Package, Download, CreditCard, Calendar, Clock } from 'lucide-react';

const RefundPolicy = () => {
  const navigate = useNavigate();
  const lastUpdated = 'January 10, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Refund Policy</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Refund & Return Policy</h1>
          <p className="text-slate-500 mb-8">Last Updated: {lastUpdated}</p>

          {/* Quick Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quick Summary (Plain English)
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-slate-800">Digital Items</p>
                  <p className="text-sm text-slate-600">Non-refundable once accessed or downloaded</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-slate-800">Pre-orders</p>
                  <p className="text-sm text-slate-600">100% refundable before shipping</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-slate-800">Subscriptions</p>
                  <p className="text-sm text-slate-600">Cancel at least 3 days before renewal</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-slate-800">Physical Items</p>
                  <p className="text-sm text-slate-600">Unopened: 100% • Opened: 85% (15% restocking)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Definitions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Definitions</h2>
            <ul className="space-y-3 text-slate-700">
              <li>
                <strong>"Instant Access Items":</strong> Digital products such as iPDFs, downloadable ePubs, and any content made available immediately after purchase or login.
              </li>
              <li>
                <strong>"Physical Merchandise":</strong> Tangible items shipped to you (examples: printed workbooks, journals, accessories, apparel, bookmarks, etc.).
              </li>
              <li>
                <strong>"Pre-order":</strong> An item purchased before it is available to ship.
              </li>
            </ul>
          </section>

          {/* Digital Items */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Download className="w-6 h-6 text-red-500" />
              Digital Items (Instant Access) — No Refunds
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">
                All Instant Access Items are non-refundable and non-returnable once:
              </p>
              <ul className="list-disc ml-6 mt-2 text-red-700">
                <li>Access has been provided through your account, or</li>
                <li>The digital file has been downloaded, or</li>
                <li>A download link has been delivered.</li>
              </ul>
            </div>
            <p className="text-slate-600">
              <strong>Why?</strong> Digital items can't be "returned" once delivered.
            </p>
            <p className="text-slate-600 mt-2">
              If you experience a technical issue accessing a file you purchased, contact us and we will help troubleshoot or re-send access where appropriate.
            </p>
          </section>

          {/* Physical Merchandise */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              Physical Merchandise Returns
            </h2>
            
            <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">Return Window</h3>
            <p className="text-slate-700 mb-4">
              You may request a return within <strong>30 days</strong> of delivery (based on carrier tracking).
            </p>
            
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Return Condition Requirements</h3>
            <ul className="list-disc ml-6 text-slate-700 mb-4">
              <li>Items must be returned in the condition received.</li>
              <li>Unopened/unused items must be sealed (where applicable) and in original packaging.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Refund Amounts</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800">Unopened/Unused</p>
                <p className="text-2xl font-bold text-green-600 mt-1">100% Refund</p>
                <p className="text-sm text-green-700 mt-1">(excluding shipping)</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-semibold text-yellow-800">Opened Items</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">85% Refund</p>
                <p className="text-sm text-yellow-700 mt-1">(15% restocking fee)</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Shipping Costs</h3>
            <ul className="list-disc ml-6 text-slate-700">
              <li>Return shipping is paid by the customer, unless the item arrived damaged/defective or we made an error.</li>
              <li>Original shipping fees (if any) are non-refundable, unless required by law or the return is due to our error.</li>
            </ul>
          </section>

          {/* Damaged/Defective */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Damaged, Defective, or Incorrect Items</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800">
                If your physical merchandise arrives <strong>damaged</strong>, <strong>defective</strong>, or you received the <strong>wrong item</strong>, contact us within <strong>7 days</strong> of delivery with:
              </p>
              <ul className="list-disc ml-6 mt-2 text-orange-700">
                <li>Your order number</li>
                <li>Clear photos of the item and packaging</li>
              </ul>
              <p className="text-orange-800 mt-3">
                We will work with you to provide a replacement, store credit, or a refund, depending on availability and your preference.
              </p>
            </div>
          </section>

          {/* Pre-Orders */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-500" />
              Pre-Orders — Full Refund Before Shipping
            </h2>
            <p className="text-slate-700">
              Pre-orders may be canceled for a <strong>100% refund</strong> anytime <strong>before the item ships</strong>.
            </p>
            <p className="text-slate-700 mt-2">
              Once a pre-order has shipped, it is treated as a standard physical merchandise order and follows the return rules above.
            </p>
          </section>

          {/* Subscriptions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-teal-500" />
              Subscriptions — Cancel 3 Days Before Renewal
            </h2>
            <p className="text-slate-700">
              Subscriptions renew automatically unless canceled.
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-3">
              <p className="text-teal-800 font-medium">
                To avoid being charged for the next billing cycle, you must cancel your subscription <strong>at least 3 days before your renewal date</strong>.
              </p>
            </div>
            <p className="text-slate-700 mt-3">
              If you cancel after that cutoff, your subscription will remain active through the end of the current paid period, and the next renewal charge may still process.
            </p>
          </section>

          {/* How to Request */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-indigo-500" />
              How to Request a Return, Refund, or Cancellation
            </h2>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <p className="text-indigo-800 mb-4">To start a return or request a refund:</p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Button
                  onClick={() => navigate('/orders/lookup')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Look Up Your Order
                </Button>
                <span className="text-indigo-600 self-center">or</span>
                <a 
                  href="mailto:support@kingdom-soul.com"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-300 rounded-lg text-indigo-700 hover:bg-indigo-100"
                >
                  <Mail className="w-4 h-4" />
                  Email support@kingdom-soul.com
                </a>
              </div>
              
              <p className="text-indigo-700 font-medium">Include in your request:</p>
              <ul className="list-disc ml-6 text-indigo-700 mt-2">
                <li>Order number</li>
                <li>Item(s) you're requesting to return/refund</li>
                <li>Reason for the request</li>
                <li>Photos (required for damage/defect claims)</li>
              </ul>
            </div>
          </section>

          {/* Processing Time */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Refund Processing Time</h2>
            <p className="text-slate-700">If your return is approved:</p>
            <ul className="list-disc ml-6 text-slate-700 mt-2">
              <li>Refunds are issued to the <strong>original payment method</strong>.</li>
              <li>Processing typically takes <strong>5-10 business days</strong> after we receive and inspect the returned item (bank posting times vary).</li>
            </ul>
          </section>

          {/* Exceptions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Exceptions & Abuse Prevention</h2>
            <p className="text-slate-700">
              We reserve the right to deny refunds/returns in cases of:
            </p>
            <ul className="list-disc ml-6 text-slate-700 mt-2">
              <li>Items returned outside the return window</li>
              <li>Items returned in unacceptable condition</li>
              <li>Repeated return abuse, suspected fraud, or chargeback abuse</li>
            </ul>
            <p className="text-slate-600 mt-4 italic">
              This policy does not limit any rights you may have under applicable consumer protection laws.
            </p>
          </section>

          {/* CTA */}
          <div className="border-t pt-8 mt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/orders/lookup')}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Look Up an Order
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/quick-order')}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
