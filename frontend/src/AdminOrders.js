import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { safeJson } from './lib/safeFetch';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Unlock,
  Download,
  FileText,
  Eye
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(null);
  const [refundType, setRefundType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // Get admin token
  const getToken = () => {
    try { return localStorage.getItem('soul_food_token') || ''; } catch { return ''; }
  };

  useEffect(() => {
    fetchOrders();
    fetchRefundRequests();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const { ok, data } = await safeJson(res);
      if (!ok) {
        console.error('Failed to fetch orders:', data);
        setOrders([]);
        return;
      }
      // Canonical endpoint returns { items, total, page, limit, pages }.
      setOrders(data.items || data.orders || []);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/admin/refund-requests?status=pending`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const { ok, data } = await safeJson(res);
      if (!ok) {
        setRefundRequests([]);
        return;
      }
      setRefundRequests(data.requests || []);
    } catch (e) {
      console.error('Failed to fetch refund requests:', e);
      setRefundRequests([]);
    }
  };

  const handleProcessRefund = async (orderNumber) => {
    if (!confirm(`Process ${refundType} refund for order ${orderNumber}?`)) {
      return;
    }
    
    setProcessingRefund(orderNumber);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/api/orders/admin/process-refund`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        setProcessingRefund(null);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            toast.success(`Refund of $${data.refund_amount.toFixed(2)} processed successfully!`);
            fetchOrders();
            fetchRefundRequests();
            setExpandedOrder(null);
          } else {
            toast.error(data.detail || 'Failed to process refund');
          }
        } catch (e) {
          toast.error('Failed to process refund');
        }
      }
    };
    
    xhr.send(JSON.stringify({
      order_number: orderNumber,
      refund_type: refundType,
      custom_amount: refundType === 'custom' ? parseFloat(customAmount) : null,
      reason: 'Admin processed refund'
    }));
  };

  const handleResendEmail = async (orderNumber) => {
    setActionLoading(`resend-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/resend-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(data.message || 'Email resent successfully!');
      } else {
        toast.error(`Resend failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleGrantAccess = async (orderNumber) => {
    setActionLoading(`grant-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/grant-access`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(data.message || 'Access granted!');
        if (expandedOrder === orderNumber) loadOrderDetail(orderNumber);
      } else {
        toast.error(`Grant failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleSyncStripe = async (orderNumber) => {
    setActionLoading(`sync-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/sync-stripe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(data.message || 'Synced from Stripe');
        fetchOrders();
      } else if (ok) {
        toast.warning(data.message || 'Stripe says not paid yet');
      } else {
        toast.error(`Sync failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleMarkPaid = async (orderNumber) => {
    const reason = window.prompt(
      `Manually mark ${orderNumber} as PAID?\n\nThis will create download links and skip Stripe verification.\nEnter a reason for the audit log:`,
      'Verified payment via Stripe Dashboard'
    );
    if (!reason || !reason.trim()) return;
    setActionLoading(`paid-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/mark-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(data.message || 'Order marked paid');
        fetchOrders();
      } else {
        toast.error(`Mark-paid failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleRefulfill = async (orderNumber) => {
    setActionLoading(`refulfill-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/admin/refulfill/${encodeURIComponent(orderNumber)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const { ok, data } = await safeJson(res);
      if (ok) {
        toast.success(`Fulfilled: ${data.downloads_created || 0} download link(s) created`);
        if (expandedOrder === orderNumber) loadOrderDetail(orderNumber);
        fetchOrders();
      } else {
        toast.error(`Re-fulfill failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const loadOrderDetail = async (orderNumber) => {
    setDetailLoading(true);
    setOrderDetail(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/detail`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrderDetail(data);
      }
    } catch {
      console.error('Failed to load detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (orderNumber) => {
    if (expandedOrder === orderNumber) {
      setExpandedOrder(null);
      setOrderDetail(null);
    } else {
      setExpandedOrder(orderNumber);
      loadOrderDetail(orderNumber);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'refunded': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      'partial_refund': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      'requested': { color: 'bg-orange-100 text-orange-800', icon: Clock },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Package };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status || 'unknown'}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterStatus || 
      order.payment_status === filterStatus ||
      order.refund_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/admin')}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Admin</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Order Management</h1>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        {/* Pending Refund Requests Alert */}
        {refundRequests.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    {refundRequests.length} pending refund request{refundRequests.length > 1 ? 's' : ''}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-orange-300 text-orange-700"
                  onClick={() => setFilterStatus('requested')}
                >
                  View Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by order # or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">All Orders</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="requested">Refund Requested</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No orders found
              </div>
            ) : (
              <div className="divide-y">
                {filteredOrders.map((order) => (
                  <div key={order.order_number} className="py-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleExpand(order.order_number)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-medium text-slate-800">
                            {order.order_number}
                          </span>
                          {getStatusBadge(order.payment_status)}
                          {order.refund_status && getStatusBadge(order.refund_status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {order.customer_email || 'No email'}
                          </span>
                          <span>{order.items_count} item(s)</span>
                          <span className="font-medium text-green-600">
                            ${(order.total_amount || 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {(order.payment_status !== 'paid' && order.payment_status !== 'completed') && (
                          <>
                            <button
                              onClick={() => handleSyncStripe(order.order_number)}
                              disabled={actionLoading === `sync-${order.order_number}`}
                              className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 disabled:opacity-40 transition-colors"
                              title="Sync from Stripe (verify payment + flip to paid + create download links)"
                              data-testid={`sync-stripe-btn-${order.order_number}`}
                            >
                              {actionLoading === `sync-${order.order_number}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleMarkPaid(order.order_number)}
                              disabled={actionLoading === `paid-${order.order_number}`}
                              className="p-2 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-700 disabled:opacity-40 transition-colors"
                              title="Mark as Paid (manual override — bypasses Stripe)"
                              data-testid={`mark-paid-btn-${order.order_number}`}
                            >
                              {actionLoading === `paid-${order.order_number}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleRefulfill(order.order_number)}
                          disabled={actionLoading === `refulfill-${order.order_number}` || order.payment_status !== 'paid'}
                          className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 disabled:opacity-40 transition-colors"
                          title="Re-run Fulfillment"
                          data-testid={`refulfill-btn-${order.order_number}`}
                        >
                          {actionLoading === `refulfill-${order.order_number}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleResendEmail(order.order_number)}
                          disabled={actionLoading === `resend-${order.order_number}`}
                          className="p-2 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600 disabled:opacity-40 transition-colors"
                          title="Resend Access Email"
                          data-testid={`resend-btn-${order.order_number}`}
                        >
                          {actionLoading === `resend-${order.order_number}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleGrantAccess(order.order_number)}
                          disabled={actionLoading === `grant-${order.order_number}`}
                          className="p-2 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 disabled:opacity-40 transition-colors"
                          title="Grant / Regrant Access"
                          data-testid={`grant-btn-${order.order_number}`}
                        >
                          {actionLoading === `grant-${order.order_number}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button onClick={() => toggleExpand(order.order_number)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                          {expandedOrder === order.order_number ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedOrder === order.order_number && (
                      <div className="mt-4 pt-4 border-t bg-slate-50 rounded-lg p-4">
                        {detailLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-medium text-slate-700 mb-2">Order Details</h4>
                              <div className="space-y-1 text-sm text-slate-600">
                                <p>Type: {order.order_type || (orderDetail?.transaction?.order_type) || '-'}</p>
                                <p>Email: {orderDetail?.transaction?.customer_email || order.customer_email}</p>
                                {orderDetail?.transaction?.customer_name && <p>Name: {orderDetail.transaction.customer_name}</p>}
                                {orderDetail?.transaction?.claimed_by_user_id && (
                                  <p className="text-blue-600 font-medium">Claimed by: {orderDetail.transaction.claimed_by_user_id}</p>
                                )}
                              </div>

                              {/* Items */}
                              {orderDetail?.transaction?.items?.length > 0 && (
                                <div className="mt-3">
                                  <h4 className="font-medium text-slate-700 mb-1 text-sm">Items</h4>
                                  <ul className="space-y-1">
                                    {orderDetail.transaction.items.map((item, idx) => (
                                      <li key={item.product_id || item.id || `item-${idx}`} className="text-xs text-slate-600 flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-green-500 flex-shrink-0" />
                                        {item.name || item.product_id} {item.quantity > 1 ? `x${item.quantity}` : ''}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div>
                              {/* Download Links */}
                              <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                Download Links ({orderDetail?.download_links?.length || 0})
                              </h4>
                              {orderDetail?.download_links?.length > 0 ? (
                                <ul className="space-y-1 max-h-32 overflow-y-auto">
                                  {orderDetail.download_links.map((dl, idx) => (
                                    <li key={dl.token || dl.product_id || `dl-${idx}`} className="text-xs bg-white border rounded p-2 flex items-center justify-between gap-2">
                                      <span className="truncate">{dl.product_name || dl.product_id}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${dl.revoked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                        {dl.revoked ? 'revoked' : 'active'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-400">No download links found.</p>
                              )}

                              {/* Delivery Logs */}
                              {orderDetail?.delivery_logs?.length > 0 && (
                                <div className="mt-3">
                                  <h4 className="font-medium text-slate-700 mb-1 text-sm">Delivery Log</h4>
                                  <ul className="space-y-1 max-h-24 overflow-y-auto">
                                    {orderDetail.delivery_logs.map((log, idx) => (
                                      <li key={log.id || `log-${log.type}-${idx}`} className="text-xs bg-white border rounded p-1.5">
                                        <span className="font-medium">{log.type}</span> — {log.status} — {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Refund Actions */}
                            {order.payment_status === 'paid' && order.refund_status !== 'refunded' && (
                              <div className="sm:col-span-2 pt-3 border-t">
                                <h4 className="font-medium text-slate-700 mb-2">Process Refund</h4>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={refundType}
                                    onChange={(e) => setRefundType(e.target.value)}
                                    className="px-2 py-1.5 text-sm border rounded flex-shrink-0"
                                  >
                                    <option value="full">Full Refund</option>
                                    <option value="partial_15">15% Restocking Fee</option>
                                    <option value="custom">Custom Amount</option>
                                  </select>
                                  
                                  {refundType === 'custom' && (
                                    <Input
                                      type="number"
                                      placeholder="Amount"
                                      value={customAmount}
                                      onChange={(e) => setCustomAmount(e.target.value)}
                                      className="text-sm w-28"
                                    />
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessRefund(order.order_number)}
                                    disabled={processingRefund === order.order_number}
                                    className="bg-red-600 hover:bg-red-700"
                                    data-testid={`refund-btn-${order.order_number}`}
                                  >
                                    {processingRefund === order.order_number ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        Refund
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Refund Request Details */}
                        {order.refund_status === 'requested' && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                            <p className="font-medium text-orange-800 mb-1">Refund Requested</p>
                            {refundRequests.find(r => r.order_number === order.order_number) && (
                              <div className="text-sm text-orange-700">
                                <p>Reason: {refundRequests.find(r => r.order_number === order.order_number)?.reason}</p>
                                <p>Condition: {refundRequests.find(r => r.order_number === order.order_number)?.item_condition}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrders;
