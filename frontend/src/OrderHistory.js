import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import {
  ArrowLeft, Package, CheckCircle, Clock, RefreshCw, XCircle,
  Gift, Loader2, Book, Receipt
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  completed:         { color: 'bg-green-100 text-green-800',  icon: CheckCircle, label: 'Completed' },
  pending:           { color: 'bg-yellow-100 text-yellow-800', icon: Clock,      label: 'Pending' },
  refunded:          { color: 'bg-blue-100 text-blue-800',    icon: RefreshCw,   label: 'Refunded' },
  partial_refund:    { color: 'bg-blue-100 text-blue-800',    icon: RefreshCw,   label: 'Partial Refund' },
  refund_requested:  { color: 'bg-orange-100 text-orange-800', icon: Clock,      label: 'Refund Requested' },
  cancelled:         { color: 'bg-red-100 text-red-800',      icon: XCircle,     label: 'Cancelled' },
  revoked:           { color: 'bg-red-100 text-red-800',      icon: XCircle,     label: 'Revoked' },
  expired:           { color: 'bg-slate-100 text-slate-600',  icon: XCircle,     label: 'Expired' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: 'bg-slate-100 text-slate-700', icon: Package, label: status || 'Unknown' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`} data-testid={`order-status-${status}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem('soul_food_token');

  useEffect(() => {
    if (!token) {
      navigate('/auth', { state: { returnTo: '/order-history' } });
      return;
    }
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/payments/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else if (res.status === 401) {
        navigate('/auth', { state: { returnTo: '/order-history' } });
      }
    } catch (e) {
      // network error — keep empty
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <Toaster position="top-right" />
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/my-library')} className="text-slate-700" data-testid="back-to-library-btn">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">My Library</span>
          </Button>
          <h1 className="text-xl font-bold text-slate-800">Order History</h1>
          <Button variant="outline" onClick={() => navigate('/quick-order')} className="hidden sm:flex" data-testid="browse-store-btn">
            Browse Store
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <p className="text-sm text-slate-500 mb-6" data-testid="order-history-subtitle">
          A complete, permanent record of every order you've placed — including refunded, cancelled, and gifted orders.
          Looking for content you can use right now? Visit your{' '}
          <button onClick={() => navigate('/my-library')} className="text-indigo-600 font-medium underline" data-testid="go-to-library-link">Library</button>.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="text-center py-16" data-testid="order-history-empty">
              <div className="w-20 h-20 mx-auto rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <Receipt className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No orders yet</h3>
              <p className="text-slate-500 mb-6">When you place an order, it will appear here for your records.</p>
              <Button onClick={() => navigate('/quick-order')} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white" data-testid="empty-browse-btn">
                Browse the Store
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="order-history-list">
            {orders.map((o) => (
              <Card key={o.order_number} className="shadow-sm hover:shadow-md transition-shadow" data-testid={`order-row-${o.order_number}`}>
                <CardHeader className="border-b bg-slate-50/60 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800">Order {o.order_number}</CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">Placed {fmtDate(o.created_at)} · {o.items_count} item{o.items_count === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {o.is_gift && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-700" data-testid={`gift-badge-${o.order_number}`}>
                          <Gift className="w-3.5 h-3.5" />
                          Gift{o.digital_recipient_email ? ` → ${o.digital_recipient_email}` : ''}
                        </span>
                      )}
                      <StatusBadge status={o.display_status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="divide-y divide-slate-100">
                    {o.items.map((it, idx) => (
                      <div key={it.product_id || `${o.order_number}-${idx}`} className="flex items-start justify-between py-2 gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 break-words">{it.name}</p>
                          <p className="text-xs text-slate-500">Qty: {it.quantity || 1}</p>
                          {it.isSmallGroupBundle && it.bundle_contents && (
                            <div className="mt-1 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-[11px] text-slate-700">
                              <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">Bundle</span> · 1 × Instructor Edition · {it.bundle_contents}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-700 flex-shrink-0">${Number(it.price || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 mt-2">
                    <span className="text-sm font-semibold text-slate-600">Total</span>
                    <span className="text-lg font-bold text-indigo-600" data-testid={`order-total-${o.order_number}`}>
                      ${Number(o.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  {o.display_status === 'completed' && !o.is_gift && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/my-library')}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        data-testid={`view-in-library-${o.order_number}`}
                      >
                        <Book className="w-4 h-4 mr-1.5" />
                        Access in Library
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
