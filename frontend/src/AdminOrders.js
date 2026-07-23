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
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  Unlock,
  Lock,
  Download,
  FileText,
  Eye,
  FileDown,
  Filter
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
  const [visibilityFilter, setVisibilityFilter] = useState('active'); // 'active' | 'test' | 'archived' | 'all'
  const [selectedOrderNumbers, setSelectedOrderNumbers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(''); // Gmail-style operational filter key
  const [bulkLoading, setBulkLoading] = useState(false);

  // Get admin token
  const getToken = () => {
    try { return localStorage.getItem('soul_food_token') || ''; } catch { return ''; }
  };

  useEffect(() => {
    fetchOrders();
    fetchRefundRequests();
    fetchSummary();
  }, [visibilityFilter]);

  const [summary, setSummary] = useState(null);
  const [fulfillInput, setFulfillInput] = useState({ tracking: '', carrier: '', notify: false });
  const handleSetFulfillment = async (orderNumber, status) => {
    setActionLoading(`fulfill-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/fulfillment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillment_status: status,
          tracking_number: fulfillInput.tracking || null,
          carrier: fulfillInput.carrier || null,
          notify: !!fulfillInput.notify,
        })
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(`Marked ${status}${data.notified ? ' · customer notified' : ''}.`);
        fetchOrders(); fetchSummary();
        if (expandedOrder === orderNumber) loadOrderDetail(orderNumber);
      } else { toast.error(`Failed: ${data.detail || JSON.stringify(data)}`); }
    } catch (err) { toast.error(`Network error: ${err.message}`); }
    finally { setActionLoading(''); }
  };
  const handleSetManualFulfillment = async (orderNumber, status) => {
    setActionLoading(`manual-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/manual-fulfillment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(status === 'fulfilled' ? 'Marked admin fulfillment complete.' : 'Reopened for review.');
        fetchOrders(); fetchSummary();
        if (expandedOrder === orderNumber) loadOrderDetail(orderNumber);
      } else { toast.error(`Failed: ${data.detail || JSON.stringify(data)}`); }
    } catch (err) { toast.error(`Network error: ${err.message}`); }
    finally { setActionLoading(''); }
  };
  const handleSetRecipientAccess = async (orderNumber, confirmed) => {
    setActionLoading(`recipient-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/recipient-access`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed })
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(confirmed ? 'Recipient access confirmed.' : 'Recipient confirmation cleared.');
        fetchOrders(); fetchSummary();
        if (expandedOrder === orderNumber) loadOrderDetail(orderNumber);
      } else { toast.error(`Failed: ${data.detail || JSON.stringify(data)}`); }
    } catch (err) { toast.error(`Network error: ${err.message}`); }
    finally { setActionLoading(''); }
  };
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/summary`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const { ok, data } = await safeJson(res);
      if (ok) setSummary(data);
    } catch (e) { /* ignore */ }
  };

  // P2 — render the three independent status dimensions as compact chips
  const LIFECYCLE_CHIP = {
    // financial
    paid: 'bg-emerald-100 text-emerald-700', pending_payment: 'bg-yellow-100 text-yellow-800',
    refunded: 'bg-blue-100 text-blue-700', partial_refund: 'bg-blue-100 text-blue-700',
    refund_pending: 'bg-orange-100 text-orange-800', chargeback: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700', archived: 'bg-slate-100 text-slate-500',
    // entitlement
    granted: 'bg-emerald-100 text-emerald-700', revoked: 'bg-red-100 text-red-700',
    not_granted: 'bg-slate-100 text-slate-500', admin_override: 'bg-amber-100 text-amber-800',
    // fulfillment
    delivered: 'bg-emerald-100 text-emerald-700', downloaded: 'bg-emerald-100 text-emerald-700',
    shipped: 'bg-indigo-100 text-indigo-700', packed: 'bg-purple-100 text-purple-700',
    not_shipped: 'bg-orange-100 text-orange-800',
    // NEW lane statuses (3-axis model)
    pending: 'bg-orange-100 text-orange-800', pending_review: 'bg-orange-100 text-orange-800',
    fulfilled: 'bg-emerald-100 text-emerald-700', confirmed: 'bg-emerald-100 text-emerald-700',
    complete: 'bg-emerald-100 text-emerald-700', open: 'bg-orange-100 text-orange-700',
    needs_action: 'bg-orange-100 text-orange-700', n_a: 'bg-slate-100 text-slate-400',
    paid_status: 'bg-emerald-100 text-emerald-700',
  };
  const Chip = ({ label, value }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${LIFECYCLE_CHIP[value] || 'bg-slate-100 text-slate-600'}`}>
      <span className="opacity-60 mr-1">{label}</span>{(value || '—').replace(/_/g, ' ')}
    </span>
  );

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100', visibility: visibilityFilter });
      const res = await fetch(`${BACKEND_URL}/api/admin/orders?${params}`, {
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
      setSelectedOrderNumbers([]);
      fetchSummary();
    } catch (e) {
      console.error('Failed to fetch orders:', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectOrder = (orderNumber) => {
    setSelectedOrderNumbers(prev =>
      prev.includes(orderNumber) ? prev.filter(n => n !== orderNumber) : [...prev, orderNumber]
    );
  };

  const toggleSelectAllOrders = () => {
    const visibleNumbers = orders.map(o => o.order_number).filter(Boolean);
    if (selectedOrderNumbers.length === visibleNumbers.length && visibleNumbers.length > 0) {
      setSelectedOrderNumbers([]);
    } else {
      setSelectedOrderNumbers(visibleNumbers);
    }
  };

  const bulkTagOrders = async ({ archive, tag }) => {
    if (selectedOrderNumbers.length === 0) {
      alert('Select at least one order');
      return;
    }
    const verb = tag === 'test' ? 'mark as test' : (archive ? 'archive' : (archive === false ? 'restore' : 'update'));
    if (!confirm(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${selectedOrderNumbers.length} order(s)? (Data is preserved.)`)) return;
    try {
      const body = { order_numbers: selectedOrderNumbers };
      if (archive !== undefined) body.archive = archive;
      if (tag !== undefined) body.tag = tag;
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/bulk-tag`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const { ok, data } = await safeJson(res);
      if (ok) {
        alert(`Updated ${data.modified_total || 0} record(s).`);
        setSelectedOrderNumbers([]);
        fetchOrders();
      } else {
        alert(`Bulk update failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (e) {
      alert(`Network error: ${e.message}`);
    }
  };

  // P3 — Gmail-style operational filters (client-side over the loaded set)
  const GMAIL_FILTERS = [
    { key: '', label: 'All' },
    { key: 'needs_review', label: 'Needs Review' },
    { key: 'pending', label: 'Pending' },
    { key: 'digital_pending', label: 'Digital Pending' },
    { key: 'physical_pending', label: 'Physical Pending' },
    { key: 'downloaded', label: 'Downloaded' },
    { key: 'not_downloaded', label: 'Not Downloaded' },
    { key: 'guest', label: 'Guest' },
    { key: 'registered', label: 'Registered' },
    { key: 'gift', label: 'Gift' },
    { key: 'self', label: 'Self' },
    { key: 'no_email', label: 'No Email' },
    { key: 'refunded', label: 'Refunded' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'test', label: 'Test' },
    { key: 'archived', label: 'Archived' },
  ];

  const matchesGmailFilter = (order, key) => {
    const lc = order.lifecycle || {};
    const dl = order.downloads_count || 0;
    switch (key) {
      case '': return true;
      case 'needs_review': return !!lc.needs_action;
      case 'pending': return lc.financial_status === 'pending_payment' || order.payment_status === 'pending';
      case 'digital_pending': return !lc.has_physical && !!lc.needs_action;
      case 'physical_pending': return !!lc.has_physical && lc.fulfillment_status !== 'delivered';
      case 'downloaded': return dl > 0;
      case 'not_downloaded': return dl === 0 && lc.financial_status === 'paid' && !lc.has_physical;
      case 'guest': return !order.claimed_by_user_id;
      case 'registered': return !!order.claimed_by_user_id;
      case 'gift': return order.purchase_type === 'gift';
      case 'self': return order.purchase_type !== 'gift';
      case 'no_email': return !order.customer_email;
      case 'refunded': return ['refunded', 'partial_refund', 'chargeback'].includes(lc.financial_status);
      case 'cancelled': return lc.financial_status === 'cancelled';
      case 'test': return order.tag === 'test';
      case 'archived': return !!order.is_archived;
      default: return true;
    }
  };

  // Archived/Test rows are excluded by the default 'active' visibility, so those
  // chips also switch the backend visibility scope. All others stay 'active'.
  const selectGmailFilter = (key) => {
    const next = activeFilter === key ? '' : key;
    setActiveFilter(next);
    setVisibilityFilter(next === 'archived' ? 'archived' : next === 'test' ? 'test' : 'active');
    setSelectedOrderNumbers([]);
  };

  // P3 — per-order bulk actions (loop existing endpoints; preview scale)
  const bulkPerOrder = async (actionType) => {
    if (selectedOrderNumbers.length === 0) { alert('Select at least one order'); return; }
    const n = selectedOrderNumbers.length;
    const confirmMsg = {
      resend: `Resend confirmation email for ${n} order(s)?`,
      grant: `Grant download access for ${n} order(s)?`,
      revoke: `Revoke download access for ${n} order(s)? Customers lose access immediately.`,
      refund: `Mark ${n} order(s) as REFUNDED? This immediately revokes access. (No Stripe charge is affected — manual reconciliation.)`,
    }[actionType];
    if (!window.confirm(confirmMsg)) return;
    setBulkLoading(true);
    let okCount = 0, failCount = 0;
    for (const on of selectedOrderNumbers) {
      try {
        const base = `${BACKEND_URL}/api/admin/orders/${encodeURIComponent(on)}`;
        let res;
        if (actionType === 'resend') {
          res = await fetch(`${base}/resend-email`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
        } else if (actionType === 'grant' || actionType === 'revoke') {
          res = await fetch(`${base}/access`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionType, reason: `bulk ${actionType}` }),
          });
        } else if (actionType === 'refund') {
          res = await fetch(`${base}/status`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'refunded', reason: 'bulk manual refund', sync_access: true }),
          });
        }
        const { ok } = await safeJson(res);
        ok ? okCount++ : failCount++;
      } catch { failCount++; }
    }
    setBulkLoading(false);
    if (failCount === 0) toast.success(`${okCount} order(s) updated.`);
    else toast.warning(`${okCount} succeeded, ${failCount} failed.`);
    setSelectedOrderNumbers([]);
    fetchOrders();
    fetchSummary();
  };

  // P3 — CSV export of selected orders (or current filtered view if none selected)
  const exportCsv = () => {
    const rows = selectedOrderNumbers.length > 0
      ? orders.filter(o => selectedOrderNumbers.includes(o.order_number))
      : filteredOrders;
    if (rows.length === 0) { alert('Nothing to export'); return; }
    const cols = ['order_number', 'customer_email', 'customer_name', 'total_amount', 'payment_status',
      'financial_status', 'entitlement_status', 'fulfillment_status', 'purchase_type', 'granted_to',
      'downloads_count', 'tag', 'is_archived', 'created_at'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(',')];
    rows.forEach(o => {
      const lc = o.lifecycle || {};
      lines.push([o.order_number, o.customer_email, o.customer_name, o.total_amount, o.payment_status,
        lc.financial_status, lc.entitlement_status, lc.fulfillment_status, o.purchase_type, o.granted_to,
        o.downloads_count, o.tag, o.is_archived, o.created_at].map(esc).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soulfood-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} order(s) to CSV.`);
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

  // P1 — manual status reconciliation (Stripe-independent) with instant entitlement sync
  const handleSetStatus = async (orderNumber, status) => {
    const labels = { refunded: 'mark as REFUNDED', cancelled: 'mark as CANCELLED', paid: 'reinstate as PAID' };
    if (!window.confirm(`Are you sure you want to ${labels[status] || status} order ${orderNumber}? This will immediately ${status === 'paid' ? 'restore' : 'revoke'} download access. (No Stripe charge is affected.)`)) return;
    setActionLoading(`status-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: `admin manual ${status}`, sync_access: true })
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(`Order ${status}. Entitlement: ${data.entitlement_status || 'unchanged'} (${data.links_changed} links).`);
        fetchOrders();
        if (expandedOrder === orderNumber) loadOrderDetail(orderNumber);
      } else {
        toast.error(`Failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) { toast.error(`Network error: ${err.message}`); }
    finally { setActionLoading(''); }
  };

  // P1 — manual entitlement override (no financial status change)
  const handleSetAccess = async (orderNumber, action) => {
    setActionLoading(`access-${orderNumber}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/access`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: `admin manual ${action}` })
      });
      const { ok, data } = await safeJson(res);
      if (ok && data.success) {
        toast.success(`Access ${action === 'revoke' ? 'revoked' : 'granted'} (${data.links_changed} links).`);
        fetchOrders();
        if (expandedOrder === orderNumber) loadOrderDetail(orderNumber);
      } else {
        toast.error(`Failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) { toast.error(`Network error: ${err.message}`); }
    finally { setActionLoading(''); }
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
      'fulfilled': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'pending_verification': { color: 'bg-amber-100 text-amber-900', icon: AlertCircle, label: 'PENDING VERIFICATION' },
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
        {config.label || status || 'unknown'}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'pending_verification') {
      // Special filter: orders where automated fulfillment failed verification
      const stuck = order.fulfillment_status === 'pending_verification'
        || (Array.isArray(order.fulfillment_verification_failures) && order.fulfillment_verification_failures.length > 0);
      return matchesSearch && stuck;
    }

    const matchesFilter = !filterStatus || 
      order.payment_status === filterStatus ||
      order.refund_status === filterStatus;
    
    return matchesSearch && matchesFilter && matchesGmailFilter(order, activeFilter);
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
        {/* P2 — Operational dashboard */}
        {summary && (
          <div className="mb-6" data-testid="orders-summary-dashboard">
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-3">
              {[
                ['Needs Action', summary.counts.needs_action, 'text-orange-600', 'orders-summary-needs-action'],
                ['Pending', summary.counts.pending_payment, 'text-yellow-600', 'orders-summary-pending'],
                ['Completed', summary.counts.completed, 'text-emerald-600', 'orders-summary-completed'],
                ['Shipped', summary.counts.shipped, 'text-indigo-600', 'orders-summary-shipped'],
                ['Delivered', summary.counts.delivered, 'text-emerald-600', 'orders-summary-delivered'],
                ['Refunded', summary.counts.refunded, 'text-blue-600', 'orders-summary-refunded'],
                ['Cancelled', summary.counts.cancelled, 'text-red-600', 'orders-summary-cancelled'],
                ['Closed', summary.counts.closed, 'text-slate-600', 'orders-summary-closed'],
                ['Total', summary.counts.total, 'text-slate-800', 'orders-summary-total'],
              ].map(([label, val, color, tid]) => (
                <div key={label} className="bg-white rounded-lg border p-2.5 text-center" data-testid={tid}>
                  <p className={`text-xl font-bold ${color}`}>{val}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" data-testid="orders-summary-revenue">
              {[
                ['Gross Sales', summary.revenue.gross_sales, 'text-slate-800'],
                ['Refunds', summary.revenue.refunds, 'text-blue-600'],
                ['Net Revenue', summary.revenue.net_revenue, 'text-emerald-600'],
                ['Outstanding', summary.revenue.outstanding, 'text-orange-600'],
                ['Pending', summary.revenue.pending, 'text-yellow-600'],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-slate-50 rounded-lg border p-2.5 text-center">
                  <p className={`text-lg font-bold ${color}`}>${Number(val).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    data-testid="admin-orders-search-input"
                  />
                </div>
              </div>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
                data-testid="admin-orders-visibility-filter"
              >
                <option value="active">Active</option>
                <option value="test">Test</option>
                <option value="archived">Archived</option>
                <option value="all">All</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg"
                data-testid="admin-orders-filter"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="pending_verification">Pending Verification (stuck fulfillment)</option>
                <option value="requested">Refund Requested</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            {/* P3 — Gmail-style operational filter chips */}
            <div className="mt-3 flex items-center gap-2 flex-wrap" data-testid="admin-orders-filter-chips">
              <Filter className="w-4 h-4 text-slate-400" />
              {GMAIL_FILTERS.map(f => {
                const count = orders.filter(o => matchesGmailFilter(o, f.key)).length;
                const active = activeFilter === f.key;
                return (
                  <button
                    key={f.key || 'all'}
                    onClick={() => selectGmailFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    data-testid={`admin-orders-filter-chip-${f.key || 'all'}`}
                  >
                    {f.label}
                    {f.key !== '' && (
                      <span className={`px-1.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                    )}
                  </button>
                );
              })}
              <div className="ml-auto">
                <Button size="sm" variant="outline" onClick={exportCsv} data-testid="admin-orders-export-csv-btn">
                  <FileDown className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </div>
            </div>
            {selectedOrderNumbers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3 flex-wrap" data-testid="admin-orders-bulk-bar">
                <span className="text-sm font-medium text-slate-700">{selectedOrderNumbers.length} selected</span>
                <Button size="sm" variant="outline" onClick={() => bulkTagOrders({ tag: 'test' })} data-testid="admin-orders-bulk-mark-test-btn">
                  Mark as Test
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkTagOrders({ archive: true })} data-testid="admin-orders-bulk-archive-btn">
                  Archive
                </Button>
                <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => bulkPerOrder('resend')} data-testid="admin-orders-bulk-resend-btn">
                  <Mail className="w-3.5 h-3.5 mr-1" /> Resend Email
                </Button>
                <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => bulkPerOrder('grant')} data-testid="admin-orders-bulk-grant-btn">
                  <Unlock className="w-3.5 h-3.5 mr-1" /> Grant Access
                </Button>
                <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => bulkPerOrder('revoke')} className="text-red-700 border-red-200 hover:bg-red-50" data-testid="admin-orders-bulk-revoke-btn">
                  <Lock className="w-3.5 h-3.5 mr-1" /> Revoke Access
                </Button>
                <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => bulkPerOrder('refund')} className="text-blue-700 border-blue-200 hover:bg-blue-50" data-testid="admin-orders-bulk-refund-btn">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Mark Refunded
                </Button>
                <Button size="sm" variant="outline" onClick={exportCsv} data-testid="admin-orders-bulk-export-btn">
                  <FileDown className="w-3.5 h-3.5 mr-1" /> Export
                </Button>
                {bulkLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                {(visibilityFilter === 'archived' || visibilityFilter === 'all' || visibilityFilter === 'test') && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => bulkTagOrders({ archive: false })} data-testid="admin-orders-bulk-restore-btn">
                      Restore
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulkTagOrders({ tag: 'clear' })} data-testid="admin-orders-bulk-clear-tag-btn">
                      Clear Tag
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSelectedOrderNumbers([])} data-testid="admin-orders-clear-selection-btn">
                  Clear
                </Button>
              </div>
            )}
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
                {filteredOrders.map((order, orderIdx) => (
                  <div key={`${order.order_number || 'order'}-${orderIdx}`} className="py-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrderNumbers.includes(order.order_number)}
                        onChange={(e) => { e.stopPropagation(); toggleSelectOrder(order.order_number); }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 w-4 h-4 cursor-pointer"
                        data-testid={`admin-order-select-${order.order_number}`}
                        aria-label={`Select order ${order.order_number}`}
                      />
                    <div
                      className="flex items-center justify-between cursor-pointer flex-1"
                      onClick={() => toggleExpand(order.order_number)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-mono font-medium text-slate-800">
                            {order.order_number}
                          </span>
                          {getStatusBadge(order.payment_status)}
                          {order.refund_status && getStatusBadge(order.refund_status)}
                          {(order.fulfillment_status === 'pending_verification'
                            || (Array.isArray(order.fulfillment_verification_failures) && order.fulfillment_verification_failures.length > 0)) && (
                            getStatusBadge('pending_verification')
                          )}
                          {order.tag === 'test' && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider"
                              data-testid={`order-test-badge-${order.order_number}`}
                            >
                              Test
                            </span>
                          )}
                          {order.is_archived && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider"
                              data-testid={`order-archived-badge-${order.order_number}`}
                            >
                              Archived
                            </span>
                          )}
                          {order.lifecycle && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.lifecycle.order_status === 'complete' ? 'bg-emerald-100 text-emerald-700' : order.lifecycle.needs_action ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-700'}`}
                              data-testid={`lifecycle-stage-${order.order_number}`}
                            >
                              {order.lifecycle.order_status === 'complete' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {order.lifecycle.order_status_label || order.lifecycle.lifecycle_stage}
                            </span>
                          )}
                        </div>
                        {order.lifecycle && (
                          <div className="flex items-center gap-3 mb-1 flex-wrap" data-testid={`lifecycle-axes-${order.order_number}`}>
                            {/* AXIS 1 — PAYMENT (money only) */}
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Payment</span>
                              <Chip label="" value={order.lifecycle.payment_status} />
                            </div>
                            {/* AXIS 2 — FULFILLMENT (per delivery lane) */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Fulfillment</span>
                              {order.lifecycle.fulfillment?.digital?.applicable && (
                                <Chip label="digital" value={order.lifecycle.fulfillment.digital.status} />
                              )}
                              {order.lifecycle.fulfillment?.physical?.applicable && (
                                <Chip label="physical" value={order.lifecycle.fulfillment.physical.status} />
                              )}
                              {order.lifecycle.fulfillment?.recipient?.applicable && (
                                <Chip label="recipient" value={order.lifecycle.fulfillment.recipient.status} />
                              )}
                              {order.lifecycle.fulfillment?.manual?.applicable && (
                                <Chip label="review" value={order.lifecycle.fulfillment.manual.status} />
                              )}
                            </div>
                            {/* AXIS 3 — ORDER STATUS (overall) */}
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Order</span>
                              <Chip label="" value={order.lifecycle.order_status} />
                            </div>
                            {order.lifecycle.manual_override && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">override</span>
                            )}
                          </div>
                        )}
                        {Array.isArray(order.fulfillment_verification_failures) && order.fulfillment_verification_failures.length > 0 && (
                          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 my-1 max-w-2xl"
                               data-testid={`verification-failures-${order.order_number}`}>
                            <b>Fulfillment verification failed:</b> {order.fulfillment_verification_failures.length} file(s) couldn't be retrieved.
                            {' '}Click <b>Refulfill</b> after attaching/replacing the file in the File Manager.
                            <ul className="mt-1 list-disc pl-5 space-y-0.5">
                              {order.fulfillment_verification_failures.slice(0, 3).map((f, i) => (
                                <li key={i}>
                                  <span className="font-mono">{f.file_key || f.product_id}</span>
                                  {f.name ? ` (${f.name})` : ''}
                                  {f.reason ? ` — ${f.reason}` : ''}
                                </li>
                              ))}
                              {order.fulfillment_verification_failures.length > 3 && (
                                <li>… +{order.fulfillment_verification_failures.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {order.customer_email || 'No email'}
                          </span>
                          <span>{order.items_count} item(s)</span>
                          <span className="font-medium text-green-600">
                            ${(order.total_amount || 0).toFixed(2)}
                          </span>
                          {/* Buyer vs Recipient label */}
                          {order.purchase_type === 'gift' && order.digital_recipient_email ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider"
                              data-testid={`sent-to-recipient-badge-${order.order_number}`}
                              title={`Digital recipient: ${order.digital_recipient_email}`}
                            >
                              <Send className="w-3 h-3" /> Sent to {order.digital_recipient_email}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase tracking-wider"
                              data-testid={`self-purchase-badge-${order.order_number}`}
                            >
                              Self Purchase
                            </span>
                          )}
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
                      <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
                        {(order.payment_status !== 'paid' && order.payment_status !== 'completed') && (
                          <>
                            <button
                              onClick={() => handleSyncStripe(order.order_number)}
                              disabled={actionLoading === `sync-${order.order_number}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 disabled:opacity-40"
                              title="Sync from Stripe — verifies payment, flips to paid, creates download links"
                              data-testid={`sync-stripe-btn-${order.order_number}`}
                            >
                              {actionLoading === `sync-${order.order_number}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              <span>Sync Stripe</span>
                            </button>
                            <button
                              onClick={() => handleMarkPaid(order.order_number)}
                              disabled={actionLoading === `paid-${order.order_number}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-green-50 text-slate-600 hover:text-green-700 border border-slate-200 disabled:opacity-40"
                              title="Mark as Paid — manual override; bypasses Stripe (use only after offline payment)"
                              data-testid={`mark-paid-btn-${order.order_number}`}
                            >
                              {actionLoading === `paid-${order.order_number}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              <span>Mark Paid</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleRefulfill(order.order_number)}
                          disabled={actionLoading === `refulfill-${order.order_number}` || order.payment_status !== 'paid'}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 disabled:opacity-40"
                          title="Re-run Fulfillment — re-checks every file is retrievable, flips status to fulfilled if so. Use after fixing a missing file."
                          data-testid={`refulfill-btn-${order.order_number}`}
                        >
                          {actionLoading === `refulfill-${order.order_number}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>Refulfill</span>
                        </button>
                        <button
                          onClick={() => handleResendEmail(order.order_number)}
                          disabled={actionLoading === `resend-${order.order_number}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-orange-50 text-slate-600 hover:text-orange-700 border border-slate-200 disabled:opacity-40"
                          title="Resend the access email to the buyer with fresh download links (30-day window, 5 downloads each)"
                          data-testid={`resend-btn-${order.order_number}`}
                        >
                          {actionLoading === `resend-${order.order_number}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          <span>Resend Email</span>
                        </button>
                        <button
                          onClick={() => handleGrantAccess(order.order_number)}
                          disabled={actionLoading === `grant-${order.order_number}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 disabled:opacity-40"
                          title="Grant / Regrant Access — gives the buyer's account direct access to all items in this order"
                          data-testid={`grant-btn-${order.order_number}`}
                        >
                          {actionLoading === `grant-${order.order_number}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span>Grant Access</span>
                        </button>
                        <button onClick={() => toggleExpand(order.order_number)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400" data-testid={`expand-order-${order.order_number}`}>
                          {expandedOrder === order.order_number ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
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

                            {/* P4 — Purchasing vs Ownership + P1 entitlement controls */}
                            <div className="sm:col-span-2 pt-3 border-t" data-testid={`ownership-panel-${order.order_number}`}>
                              <h4 className="font-medium text-slate-700 mb-2">Ownership & Entitlement</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                                <div className="bg-white border rounded p-2">
                                  <p className="text-slate-400">Purchased By</p>
                                  <p className="font-medium text-slate-700 truncate" data-testid={`purchased-by-${order.order_number}`}>{orderDetail?.ownership?.purchased_by || '—'}</p>
                                </div>
                                <div className="bg-white border rounded p-2">
                                  <p className="text-slate-400">Granted To {orderDetail?.ownership?.is_gift && <span className="text-pink-600 font-semibold">(gift)</span>}</p>
                                  <p className="font-medium text-slate-700 truncate" data-testid={`granted-to-${order.order_number}`}>{orderDetail?.ownership?.granted_to || '—'}</p>
                                </div>
                                <div className="bg-white border rounded p-2">
                                  <p className="text-slate-400">Entitlement</p>
                                  <p className={`font-semibold ${orderDetail?.ownership?.entitlement_status === 'revoked' ? 'text-red-600' : 'text-emerald-600'}`} data-testid={`entitlement-status-${order.order_number}`}>
                                    {orderDetail?.ownership?.entitlement_status || (orderDetail?.ownership?.active_links > 0 ? 'granted' : '—')}
                                  </p>
                                </div>
                                <div className="bg-white border rounded p-2">
                                  <p className="text-slate-400">Links</p>
                                  <p className="font-medium text-slate-700">{orderDetail?.ownership?.active_links || 0} active / {orderDetail?.ownership?.revoked_links || 0} revoked</p>
                                </div>
                              </div>
                              {orderDetail?.ownership?.manual_override && (
                                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800 mb-3" data-testid={`override-note-${order.order_number}`}>
                                  ⚠️ Manual admin override active{orderDetail?.ownership?.override_reason ? ` — "${orderDetail.ownership.override_reason}"` : ''}{orderDetail?.ownership?.override_at ? ` (${new Date(orderDetail.ownership.override_at).toLocaleString()})` : ''}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <button onClick={() => handleSetStatus(order.order_number, 'refunded')} disabled={actionLoading === `status-${order.order_number}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-40" data-testid={`mark-refunded-${order.order_number}`}>
                                  <RefreshCw className="w-3.5 h-3.5" /> Mark Refunded
                                </button>
                                <button onClick={() => handleSetStatus(order.order_number, 'cancelled')} disabled={actionLoading === `status-${order.order_number}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40" data-testid={`mark-cancelled-${order.order_number}`}>
                                  <XCircle className="w-3.5 h-3.5" /> Mark Cancelled
                                </button>
                                <button onClick={() => handleSetAccess(order.order_number, 'revoke')} disabled={actionLoading === `access-${order.order_number}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40" data-testid={`revoke-access-${order.order_number}`}>
                                  <Lock className="w-3.5 h-3.5" /> Revoke Access
                                </button>
                                <button onClick={() => handleSetStatus(order.order_number, 'paid')} disabled={actionLoading === `status-${order.order_number}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40" data-testid={`reinstate-paid-${order.order_number}`}>
                                  <CheckCircle className="w-3.5 h-3.5" /> Reinstate (Paid)
                                </button>
                              </div>
                            </div>

                            {/* P2 — Physical Fulfillment lifecycle (only for orders with physical items) */}
                            {order.lifecycle?.has_physical && (
                              <div className="sm:col-span-2 pt-3 border-t" data-testid={`fulfillment-panel-${order.order_number}`}>
                                <h4 className="font-medium text-slate-700 mb-2">Physical Fulfillment</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                                  <input value={fulfillInput.tracking} onChange={e => setFulfillInput(f => ({ ...f, tracking: e.target.value }))}
                                    placeholder="Tracking number (optional)" className="border rounded px-2 py-1 text-xs" data-testid={`tracking-input-${order.order_number}`} />
                                  <input value={fulfillInput.carrier} onChange={e => setFulfillInput(f => ({ ...f, carrier: e.target.value }))}
                                    placeholder="Carrier (optional)" className="border rounded px-2 py-1 text-xs" data-testid={`carrier-input-${order.order_number}`} />
                                  <label className="flex items-center gap-2 text-xs text-slate-600">
                                    <input type="checkbox" checked={fulfillInput.notify} onChange={e => setFulfillInput(f => ({ ...f, notify: e.target.checked }))}
                                      data-testid={`notify-checkbox-${order.order_number}`} />
                                    Send shipping notification
                                  </label>
                                </div>
                                {order.lifecycle.tracking_number && (
                                  <p className="text-[11px] text-slate-500 mb-2">Current tracking: <span className="font-mono">{order.lifecycle.tracking_number}</span>{order.lifecycle.carrier ? ` (${order.lifecycle.carrier})` : ''}{order.lifecycle.shipping_notified ? ' · notified ✓' : ''}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  <button onClick={() => handleSetFulfillment(order.order_number, 'packed')} disabled={actionLoading === `fulfill-${order.order_number}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40" data-testid={`mark-packed-${order.order_number}`}>
                                    <Package className="w-3.5 h-3.5" /> Packed
                                  </button>
                                  <button onClick={() => handleSetFulfillment(order.order_number, 'shipped')} disabled={actionLoading === `fulfill-${order.order_number}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40" data-testid={`mark-shipped-${order.order_number}`}>
                                    <Truck className="w-3.5 h-3.5" /> Shipped
                                  </button>
                                  <button onClick={() => handleSetFulfillment(order.order_number, 'delivered')} disabled={actionLoading === `fulfill-${order.order_number}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40" data-testid={`mark-delivered-${order.order_number}`}>
                                    <CheckCircle className="w-3.5 h-3.5" /> Delivered
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Recipient Access lane (gift / third-party) */}
                            {order.lifecycle?.fulfillment?.recipient?.applicable && (
                              <div className="sm:col-span-2 pt-3 border-t" data-testid={`recipient-panel-${order.order_number}`}>
                                <h4 className="font-medium text-slate-700 mb-2">Recipient Access <span className="text-pink-600 text-xs font-semibold">(gift / third-party)</span></h4>
                                <p className="text-xs text-slate-500 mb-2">
                                  Status: <span className="font-semibold" data-testid={`recipient-status-${order.order_number}`}>{(order.lifecycle.fulfillment.recipient.status || '').replace(/_/g, ' ')}</span>
                                  {' '}· Recipient: <span className="font-mono">{order.digital_recipient_email || orderDetail?.ownership?.granted_to || '—'}</span>
                                  <br/>Auto-confirms when the recipient claims/logs-in/downloads. Order stays open until confirmed.
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button onClick={() => handleSetRecipientAccess(order.order_number, true)} disabled={actionLoading === `recipient-${order.order_number}` || order.lifecycle.fulfillment.recipient.status === 'confirmed'}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40" data-testid={`confirm-recipient-${order.order_number}`}>
                                    <CheckCircle className="w-3.5 h-3.5" /> Mark Access Confirmed
                                  </button>
                                  <button onClick={() => handleSetRecipientAccess(order.order_number, false)} disabled={actionLoading === `recipient-${order.order_number}` || order.lifecycle.fulfillment.recipient.status !== 'confirmed'}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40" data-testid={`clear-recipient-${order.order_number}`}>
                                    <XCircle className="w-3.5 h-3.5" /> Clear
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Manual / Organizational review lane (bulk / church / instructor / mixed) */}
                            {order.lifecycle?.fulfillment?.manual?.applicable && (
                              <div className="sm:col-span-2 pt-3 border-t" data-testid={`manual-panel-${order.order_number}`}>
                                <h4 className="font-medium text-slate-700 mb-2">Admin Fulfillment Review <span className="text-amber-600 text-xs font-semibold">(bulk / church / instructor / mixed)</span></h4>
                                <p className="text-xs text-slate-500 mb-2">
                                  Status: <span className="font-semibold" data-testid={`manual-status-${order.order_number}`}>{(order.lifecycle.fulfillment.manual.status || '').replace(/_/g, ' ')}</span>
                                  {' '}· This organizational order needs an admin to confirm all obligations are met before it can complete.
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button onClick={() => handleSetManualFulfillment(order.order_number, 'fulfilled')} disabled={actionLoading === `manual-${order.order_number}` || order.lifecycle.fulfillment.manual.status === 'fulfilled'}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40" data-testid={`mark-fulfilled-${order.order_number}`}>
                                    <CheckCircle className="w-3.5 h-3.5" /> Mark Fulfilled
                                  </button>
                                  <button onClick={() => handleSetManualFulfillment(order.order_number, 'pending_review')} disabled={actionLoading === `manual-${order.order_number}` || order.lifecycle.fulfillment.manual.status !== 'fulfilled'}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-40" data-testid={`reopen-manual-${order.order_number}`}>
                                    <RefreshCw className="w-3.5 h-3.5" /> Reopen
                                  </button>
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
