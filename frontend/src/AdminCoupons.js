import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Toaster, toast } from 'sonner';
import { safeJson } from './lib/safeFetch';
import { Plus, Edit, Trash2, RefreshCw, Eye, EyeOff, Check, X as XIcon } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const emptyForm = {
  code: '',
  discount_type: 'percent',
  discount_percent: 10,
  discount_amount: 0,
  max_uses: 100,
  min_quantity: '',
  conditions: '',
  valid_until: '',
  spend_cap: '',
  hidden: false,
  active: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | active | inactive | expired
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null); // null => create
  const [form, setForm] = useState(emptyForm);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coupons/admin/list`, { headers: authHeaders() });
      const { data } = await safeJson(res);
      if (res.ok) {
        setCoupons(data.coupons || []);
      } else {
        toast.error(data?.detail || 'Failed to load coupons');
      }
    } catch (e) {
      toast.error('Network error loading coupons');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => {
    setEditingCode(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingCode(c.code);
    setForm({
      code: c.code,
      discount_type: c.discount_type || (c.discount_amount > 0 ? 'fixed_cart' : 'percent'),
      discount_percent: c.discount_percent || 0,
      discount_amount: c.discount_amount || 0,
      max_uses: c.max_uses || 100,
      min_quantity: c.min_quantity ?? '',
      conditions: c.conditions || '',
      valid_until: c.valid_until ? String(c.valid_until).slice(0, 16) : '',
      spend_cap: c.spend_cap ?? '',
      hidden: !!c.hidden,
      active: c.active !== false,
    });
    setShowModal(true);
  };

  const submit = async () => {
    if (!form.code.trim()) {
      toast.error('Code is required');
      return;
    }
    const payload = {
      discount_type: form.discount_type,
      max_uses: parseInt(form.max_uses, 10) || 100,
      conditions: form.conditions || null,
      hidden: !!form.hidden,
      active: !!form.active,
    };
    if (form.discount_type === 'percent') {
      payload.discount_percent = parseInt(form.discount_percent, 10) || 0;
      payload.discount_amount = null;
    } else {
      payload.discount_percent = 0;
      payload.discount_amount = parseFloat(form.discount_amount) || 0;
    }
    if (form.min_quantity !== '') payload.min_quantity = parseInt(form.min_quantity, 10);
    if (form.spend_cap !== '') payload.spend_cap = parseFloat(form.spend_cap);
    if (form.valid_until) payload.valid_until = new Date(form.valid_until).toISOString();

    try {
      let res;
      if (editingCode) {
        res = await fetch(`${API_URL}/api/coupons/admin/${encodeURIComponent(editingCode)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/api/coupons/admin/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ code: form.code.trim(), ...payload }),
        });
      }
      const { data } = await safeJson(res);
      if (res.ok) {
        toast.success(editingCode ? 'Coupon updated' : 'Coupon created');
        setShowModal(false);
        fetchCoupons();
      } else {
        toast.error(data?.detail || 'Save failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const toggleActive = async (c) => {
    try {
      const res = await fetch(`${API_URL}/api/coupons/admin/${encodeURIComponent(c.code)}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ active: !(c.active !== false) }),
      });
      const { data } = await safeJson(res);
      if (res.ok) {
        toast.success(`Coupon ${data.active ? 'enabled' : 'disabled'}`);
        fetchCoupons();
      } else {
        toast.error(data?.detail || 'Toggle failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const deleteCoupon = async (code) => {
    if (!window.confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/coupons/admin/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const { data } = await safeJson(res);
      if (res.ok) {
        toast.success('Coupon deleted');
        fetchCoupons();
      } else {
        toast.error(data?.detail || 'Delete failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const isExpired = (c) => {
    if (!c.valid_until) return false;
    return new Date(c.valid_until) < new Date();
  };

  const filtered = coupons.filter(c => {
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active') return c.active !== false && !isExpired(c);
    if (filter === 'inactive') return c.active === false;
    if (filter === 'expired') return isExpired(c);
    return true;
  });

  const fmtDiscount = (c) => {
    if (c.override_per_item) return `$${c.override_per_item}/item`;
    if (c.override_total != null) return `Cart=$${c.override_total}`;
    if ((c.discount_type === 'fixed_cart' || c.discount_amount > 0)) return `$${(c.discount_amount || 0).toFixed(2)} off`;
    return `${c.discount_percent || 0}%`;
  };

  return (
    <div className="space-y-6" data-testid="admin-coupons">
      <Toaster position="top-right" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Coupons</h2>
          <p className="text-sm text-slate-500">Create and manage discount codes. {coupons.length} total.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCoupons} variant="outline" size="sm" data-testid="refresh-coupons">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button onClick={openCreate} size="sm" data-testid="create-coupon-btn" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-1" /> New Coupon
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search by code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          data-testid="search-coupons"
        />
        <div className="flex gap-1 text-xs">
          {['all', 'active', 'inactive', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md border ${filter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
              data-testid={`filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No coupons match the current filters.</td></tr>
            )}
            {!loading && filtered.map(c => {
              const expired = isExpired(c);
              const active = c.active !== false && !expired;
              return (
                <tr key={c.code} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`coupon-row-${c.code}`}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                    {c.code}
                    {c.hidden && <span className="ml-2 text-[10px] uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Hidden</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{fmtDiscount(c)}</td>
                  <td className="px-4 py-3 text-slate-700">{c.times_used || 0} / {c.max_uses || '∞'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {expired ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-700">Expired</span>
                    ) : active ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-600">Disabled</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleActive(c)} className="p-1.5 rounded hover:bg-slate-100" title={active ? 'Disable' : 'Enable'} data-testid={`toggle-${c.code}`}>
                        {active ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                      </button>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-100" title="Edit" data-testid={`edit-${c.code}`}>
                        <Edit className="h-4 w-4 text-slate-600" />
                      </button>
                      <button onClick={() => deleteCoupon(c.code)} className="p-1.5 rounded hover:bg-rose-50" title="Delete" data-testid={`delete-${c.code}`}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCode ? `Edit Coupon: ${editingCode}` : 'New Coupon'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {!editingCode && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Code *</label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. SUMMER25"
                    data-testid="form-code"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Discount Type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  data-testid="form-discount-type"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed_cart">Fixed Dollar ($)</option>
                </select>
              </div>

              {form.discount_type === 'percent' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Discount Percent (0–100)</label>
                  <Input
                    type="number" min="0" max="100"
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                    data-testid="form-discount-percent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Discount Amount ($)</label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.discount_amount}
                    onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                    data-testid="form-discount-amount"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Uses</label>
                  <Input
                    type="number" min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    data-testid="form-max-uses"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Quantity (optional)</label>
                  <Input
                    type="number" min="0"
                    value={form.min_quantity}
                    onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                    placeholder="e.g. 10"
                    data-testid="form-min-qty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expiration (optional)</label>
                <Input
                  type="datetime-local"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  data-testid="form-valid-until"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Spend Cap ($, optional)</label>
                <Input
                  type="number" min="0" step="0.01"
                  value={form.spend_cap}
                  onChange={(e) => setForm({ ...form, spend_cap: e.target.value })}
                  placeholder="Max $ off (caps % discount)"
                  data-testid="form-spend-cap"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Conditions / Notes</label>
                <Input
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                  placeholder="Internal note shown in admin"
                  data-testid="form-conditions"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} data-testid="form-active" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.hidden} onChange={(e) => setForm({ ...form, hidden: e.target.checked })} data-testid="form-hidden" />
                  Hidden (internal-only)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} data-testid="form-cancel">Cancel</Button>
              <Button onClick={submit} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="form-save">
                <Check className="h-4 w-4 mr-1" /> {editingCode ? 'Save Changes' : 'Create Coupon'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
