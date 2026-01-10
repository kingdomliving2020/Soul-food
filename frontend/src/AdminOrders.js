import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
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
  Mail
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

  useEffect(() => {
    fetchOrders();
    fetchRefundRequests();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${BACKEND_URL}/api/orders/admin/list?limit=100`, true);
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        setLoading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setOrders(data.orders || []);
          } catch (e) {
            console.error('Failed to parse orders:', e);
          }
        }
      }
    };
    
    xhr.send();
  };

  const fetchRefundRequests = async () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${BACKEND_URL}/api/orders/admin/refund-requests?status=pending`, true);
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setRefundRequests(data.requests || []);
          } catch (e) {
            console.error('Failed to parse refund requests:', e);
          }
        }
      }
    };
    
    xhr.send();
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
                      onClick={() => setExpandedOrder(expandedOrder === order.order_number ? null : order.order_number)}
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
                      <div className="flex items-center gap-2">
                        {expandedOrder === order.order_number ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedOrder === order.order_number && (
                      <div className="mt-4 pt-4 border-t bg-slate-50 rounded-lg p-4">
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-slate-700 mb-2">Order Details</h4>
                            <p className="text-sm text-slate-600">Type: {order.order_type}</p>
                            <p className="text-sm text-slate-600">Source: {order.source}</p>
                          </div>
                          
                          {/* Refund Actions */}
                          {order.payment_status === 'paid' && order.refund_status !== 'refunded' && (
                            <div>
                              <h4 className="font-medium text-slate-700 mb-2">Process Refund</h4>
                              <div className="space-y-2">
                                <select
                                  value={refundType}
                                  onChange={(e) => setRefundType(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded"
                                >
                                  <option value="full">Full Refund (100%)</option>
                                  <option value="partial_15">Partial - 15% Restocking Fee</option>
                                  <option value="custom">Custom Amount</option>
                                </select>
                                
                                {refundType === 'custom' && (
                                  <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className="text-sm"
                                  />
                                )}
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessRefund(order.order_number)}
                                  disabled={processingRefund === order.order_number}
                                  className="w-full bg-red-600 hover:bg-red-700"
                                >
                                  {processingRefund === order.order_number ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      Process Refund
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
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
