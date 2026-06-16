/**
 * Admin Products Manager — Dee's publishing console.
 *
 * Lets non-developer admins create / edit / publish products without code:
 *   - List all products in db.products (paginated)
 *   - Create new product (SKU + name + price + type + edition/series)
 *   - Edit existing product, adjust inventory, toggle status
 *   - One-click "Seed from catalog" to import the canonical PRODUCTS dict
 *
 * After creating a product, use File Manager → Attach to link a PDF/workbook
 * to its product_id so checkout fulfillment can deliver it.
 */
import { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCcw, Save, Trash2, Edit2, Package, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EMPTY_PRODUCT = {
  sku: '',
  name: '',
  description: '',
  price: 0,
  compare_price: null,
  type: 'digital',
  status: 'active',
  inventory_count: null,
  low_stock_threshold: 10,
  series: '',
  edition: '',
  files: [],
  metadata: {},
};

const StatusPill = ({ status }) => {
  const map = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-slate-200 text-slate-700',
    sold_out: 'bg-amber-100 text-amber-800',
    draft: 'bg-blue-100 text-blue-800',
  };
  return <Badge className={`${map[status] || 'bg-slate-100 text-slate-700'} text-xs`}>{status}</Badge>;
};

const TypePill = ({ type }) => {
  const map = {
    digital: 'bg-indigo-100 text-indigo-800',
    physical: 'bg-purple-100 text-purple-800',
    subscription: 'bg-emerald-100 text-emerald-800',
  };
  return <Badge className={`${map[type] || 'bg-slate-100 text-slate-700'} text-xs`}>{type}</Badge>;
};

const AdminProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editTarget, setEditTarget] = useState(null); // null | "new" | {existing product}
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const limit = 25;

  const authHeaders = () => {
    const token = localStorage.getItem('soul_food_token') || '';
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) qs.set('status', statusFilter);
      if (typeFilter) qs.set('type', typeFilter);
      const res = await fetch(`${API_URL}/api/admin/products?${qs.toString()}`, { headers: authHeaders() });
      const data = await res.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
    // authHeaders reads localStorage on each call — safe to omit from deps
    // eslint-disable-next-line
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openNew = () => {
    setForm({ ...EMPTY_PRODUCT });
    setSaveError('');
    setEditTarget('new');
  };

  const openEdit = (product) => {
    setForm({
      ...EMPTY_PRODUCT,
      ...product,
      // backend stores numbers; ensure string inputs work
      price: Number(product.price ?? 0),
      compare_price: product.compare_price ?? null,
      inventory_count: product.inventory_count ?? null,
      low_stock_threshold: product.low_stock_threshold ?? 10,
      files: product.files || [],
      metadata: product.metadata || {},
    });
    setSaveError('');
    setEditTarget(product);
  };

  const closeDialog = () => {
    setEditTarget(null);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!form.sku.trim() || !form.name.trim()) {
      setSaveError('SKU and name are required.');
      return;
    }
    if (!form.price || isNaN(Number(form.price))) {
      setSaveError('Price must be a valid number.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description || '',
        price: Number(form.price),
        compare_price: form.compare_price === null || form.compare_price === '' ? null : Number(form.compare_price),
        type: form.type || 'digital',
        status: form.status || 'active',
        inventory_count: form.inventory_count === null || form.inventory_count === '' ? null : Number(form.inventory_count),
        low_stock_threshold: Number(form.low_stock_threshold || 10),
        series: form.series || null,
        edition: form.edition || null,
        files: form.files || [],
        metadata: form.metadata || {},
      };
      const isNew = editTarget === 'new';
      const url = isNew
        ? `${API_URL}/api/admin/products`
        : `${API_URL}/api/admin/products/${editTarget.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.detail || data.message || `Save failed (${res.status}).`);
        return;
      }
      closeDialog();
      fetchProducts();
    } catch (e) {
      setSaveError(`Network error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await fetch(`${API_URL}/api/admin/products/seed-from-catalog`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSeedMsg(`✓ ${data.message || 'Catalog seeded'} — ${data.created || 0} created, ${data.updated || 0} updated.`);
        fetchProducts();
      } else {
        setSeedMsg(data.detail || `Seed failed (${res.status})`);
      }
    } catch (e) {
      setSeedMsg(`Network error: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4" data-testid="admin-products-manager">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-700" />
            Products
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">Create + publish products without developer help. After saving, head to <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">File Manager</span> to attach PDFs.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchProducts} data-testid="products-refresh-btn">
            <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" disabled={seeding} onClick={handleSeed} data-testid="products-seed-catalog-btn">
            <Download className="w-4 h-4 mr-1" /> {seeding ? 'Seeding…' : 'Seed from catalog'}
          </Button>
          <Button size="sm" onClick={openNew} data-testid="products-new-btn">
            <Plus className="w-4 h-4 mr-1" /> New product
          </Button>
        </div>
      </div>

      {seedMsg && (
        <div className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700" data-testid="seed-message">
          {seedMsg}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white"
          data-testid="products-status-filter"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="sold_out">Sold out</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
          className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white"
          data-testid="products-type-filter"
        >
          <option value="">All types</option>
          <option value="digital">Digital</option>
          <option value="physical">Physical</option>
          <option value="subscription">Subscription</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <p className="mb-2">No products yet.</p>
              <p className="text-xs">Click <strong>Seed from catalog</strong> to import the existing SOFU catalog, or <strong>New product</strong> to add one from scratch.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2.5">SKU</th>
                    <th className="text-left px-4 py-2.5">Name</th>
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-right px-4 py-2.5">Price</th>
                    <th className="text-right px-4 py-2.5">Inv</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-right px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id || p.sku} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`product-row-${p.sku}`}>
                      <td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-800">{p.name}</div>
                        {(p.series || p.edition) && (
                          <div className="text-xs text-slate-500">{[p.series, p.edition].filter(Boolean).join(' · ')}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5"><TypePill type={p.type} /></td>
                      <td className="px-4 py-2.5 text-right tabular-nums">${Number(p.price || 0).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        {p.inventory_count === null || p.inventory_count === undefined ? '—' : p.inventory_count}
                      </td>
                      <td className="px-4 py-2.5"><StatusPill status={p.status} /></td>
                      <td className="px-4 py-2.5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} data-testid={`product-edit-${p.sku}`}>
                          <Edit2 className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {total > limit && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Page {page} of {totalPages} — {total} total</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl" data-testid="product-edit-dialog">
          <DialogHeader>
            <DialogTitle>{editTarget === 'new' ? 'New product' : `Edit: ${form.name || form.sku}`}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">SKU *</label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. HOL-AE-DG"
                disabled={editTarget !== 'new'}
                data-testid="product-form-sku"
              />
              {editTarget !== 'new' && <p className="text-[10px] text-slate-500 mt-1">SKU cannot be changed after creation.</p>}
            </div>

            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm"
                data-testid="product-form-status"
              >
                <option value="active">Active (visible on storefront)</option>
                <option value="draft">Draft (hidden, not for sale)</option>
                <option value="inactive">Inactive</option>
                <option value="sold_out">Sold out</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Holiday Series — Adult Edition"
                data-testid="product-form-name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description shown on storefront cards"
                rows={3}
                data-testid="product-form-description"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Price *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                data-testid="product-form-price"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Compare-at (was) price</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.compare_price ?? ''}
                onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                placeholder="Optional"
                data-testid="product-form-compare-price"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm"
                data-testid="product-form-type"
              >
                <option value="digital">Digital (PDF / iPDF)</option>
                <option value="physical">Physical (print + ship)</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Inventory count</label>
              <Input
                type="number"
                min="0"
                value={form.inventory_count ?? ''}
                onChange={(e) => setForm({ ...form, inventory_count: e.target.value })}
                placeholder="Leave blank for unlimited (digital)"
                data-testid="product-form-inventory"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Series</label>
              <Input
                value={form.series || ''}
                onChange={(e) => setForm({ ...form, series: e.target.value })}
                placeholder="e.g. holiday_4c"
                data-testid="product-form-series"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Edition</label>
              <Input
                value={form.edition || ''}
                onChange={(e) => setForm({ ...form, edition: e.target.value })}
                placeholder="AE / YE / IE"
                data-testid="product-form-edition"
              />
            </div>
          </div>

          {saveError && (
            <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md flex items-start gap-2" data-testid="product-form-error">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="mt-2 text-xs text-slate-600 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-md">
            <strong>Next step:</strong> after saving, open the <span className="font-mono">File Manager</span> tab and attach the PDF/workbook to this product so checkout can deliver it.
          </div>

          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={closeDialog} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="product-form-save-btn">
              {saving ? (
                <><RefreshCcw className="w-4 h-4 mr-1 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-1" /> {editTarget === 'new' ? 'Create product' : 'Save changes'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductsManager;
