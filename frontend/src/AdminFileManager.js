import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, RefreshCw, Trash2, Download, Link2, Unlink, Search,
  ArrowLeft, Loader2, Plus, FileText, Image as ImageIcon,
  Music, FileType, AlertCircle, CheckCircle
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const PAGE_SIZE = 50;

const getToken = () => localStorage.getItem('soul_food_token');

const iconFor = (ct) => {
  if (!ct) return FileType;
  if (ct.startsWith('image/')) return ImageIcon;
  if (ct.startsWith('audio/')) return Music;
  if (ct.includes('pdf')) return FileText;
  return FileType;
};

const fmtSize = (b) => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const AdminFileManager = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [replaceFor, setReplaceFor] = useState(null);
  const [attachFor, setAttachFor] = useState(null);
  const [attachForm, setAttachForm] = useState({ target_type: 'product', target_id: '', role: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: String(page * PAGE_SIZE),
        include_deleted: String(includeDeleted),
      });
      if (search.trim()) params.set('search', search.trim());
      if (category.trim()) params.set('category', category.trim());
      const res = await fetch(`${API}/api/admin/files?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setFiles(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, includeDeleted]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file, opts = {}) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', opts.category || category || 'uploads');
      fd.append('description', opts.description || '');
      const res = await fetch(`${API}/api/admin/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      toast.success(`Uploaded ${data.file?.original_filename}`);
      setPage(0);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplace = async (file, fileId) => {
    if (!file) return;
    setActionId(`replace-${fileId}`);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/admin/files/${fileId}/replace`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Replace failed');
      toast.success('Replaced');
      load();
      setReplaceFor(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionId('');
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Soft-delete this file? It can be restored later.')) return;
    setActionId(`del-${fileId}`);
    try {
      const res = await fetch(`${API}/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Delete failed');
      }
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionId('');
    }
  };

  const handleRestore = async (fileId) => {
    setActionId(`rest-${fileId}`);
    try {
      const res = await fetch(`${API}/api/admin/files/${fileId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Restore failed');
      }
      toast.success('Restored');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionId('');
    }
  };

  const handleDownload = async (file) => {
    setActionId(`dl-${file.id}`);
    try {
      const res = await fetch(`${API}/api/admin/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Download failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionId('');
    }
  };

  const submitAttach = async () => {
    if (!attachForm.target_id.trim()) {
      toast.error('target_id is required');
      return;
    }
    setActionId(`att-${attachFor.id}`);
    try {
      const res = await fetch(`${API}/api/admin/files/${attachFor.id}/attach`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: attachForm.target_type,
          target_id: attachForm.target_id.trim(),
          role: attachForm.role.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Attach failed');
      toast.success('Attached');
      setAttachFor(null);
      setAttachForm({ target_type: 'product', target_id: '', role: '' });
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionId('');
    }
  };

  const detach = async (fileId, attachId) => {
    setActionId(`det-${attachId}`);
    try {
      const res = await fetch(`${API}/api/admin/files/${fileId}/attach/${attachId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Detach failed');
      }
      toast.success('Detached');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionId('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 p-6" data-testid="admin-file-manager">
      <Toaster richColors position="top-right" />
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} data-testid="back-btn">
              <ArrowLeft className="w-4 h-4 mr-1" /> Admin
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">File Manager</h1>
            <Badge className="bg-green-100 text-green-700">Durable storage</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={load} variant="outline" size="sm" data-testid="refresh-btn">
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => handleUpload(e.target.files[0])}
              data-testid="upload-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="upload-btn"
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Upload file
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search filename…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="pl-9"
                  data-testid="search-input"
                />
              </div>
              <Input
                placeholder="Category (optional)"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(0); }}
                className="max-w-[200px]"
                data-testid="category-input"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(0); }}
                  data-testid="include-deleted-toggle"
                />
                Show deleted
              </label>
              <span className="text-sm text-slate-500" data-testid="total-count">
                {total} {total === 1 ? 'file' : 'files'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-slate-500 text-sm">Loading…</p>
            ) : files.length === 0 ? (
              <div className="p-12 text-center">
                <Upload className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No files yet. Click "Upload file" to add one.</p>
              </div>
            ) : (
              <table className="w-full text-sm" data-testid="files-table">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">Filename</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Attachments</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => {
                    const Icon = iconFor(f.content_type);
                    const isDeleted = f.is_deleted;
                    return (
                      <tr key={f.id} className={`border-b hover:bg-slate-50 ${isDeleted ? 'opacity-60' : ''}`} data-testid={`file-row-${f.id}`}>
                        <td className="px-4 py-3"><Icon className="w-5 h-5 text-slate-400" /></td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 truncate max-w-[280px]" title={f.original_filename}>
                            {f.original_filename}
                          </div>
                          {f.description && <div className="text-xs text-slate-500 truncate max-w-[280px]">{f.description}</div>}
                          {isDeleted && <Badge className="mt-1 bg-red-100 text-red-700 text-[10px]">Deleted</Badge>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{f.category}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtSize(f.size_bytes)}</td>
                        <td className="px-4 py-3">
                          {(f.attachments || []).length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {(f.attachments || []).map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => detach(f.id, a.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 hover:bg-red-50 hover:text-red-600 border border-blue-100"
                                  title={`Click to detach from ${a.target_type}:${a.target_id}`}
                                  data-testid={`detach-${a.id}`}
                                >
                                  <Link2 className="w-3 h-3" />
                                  <span className="font-mono">{a.target_type}:{a.target_id.slice(0, 12)}</span>
                                  <Unlink className="w-2.5 h-2.5 opacity-0 hover:opacity-100" />
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {!isDeleted && (
                              <>
                                <button
                                  onClick={() => handleDownload(f)}
                                  disabled={actionId === `dl-${f.id}`}
                                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-blue-600 disabled:opacity-40"
                                  title="Download"
                                  data-testid={`dl-${f.id}`}
                                >
                                  {actionId === `dl-${f.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setAttachFor(f)}
                                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-indigo-600"
                                  title="Attach to product/order"
                                  data-testid={`attach-${f.id}`}
                                >
                                  <Link2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setReplaceFor(f)}
                                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-amber-600"
                                  title="Replace"
                                  data-testid={`replace-${f.id}`}
                                >
                                  <Upload className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(f.id)}
                                  disabled={actionId === `del-${f.id}`}
                                  className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 disabled:opacity-40"
                                  title="Delete"
                                  data-testid={`del-${f.id}`}
                                >
                                  {actionId === `del-${f.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                            {isDeleted && (
                              <button
                                onClick={() => handleRestore(f.id)}
                                disabled={actionId === `rest-${f.id}`}
                                className="px-2 py-1 rounded text-xs bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40"
                                data-testid={`rest-${f.id}`}
                              >
                                {actionId === `rest-${f.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Restore'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page + 1} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} data-testid="prev-page">
                Prev
              </Button>
              <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} data-testid="next-page">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Replace dialog */}
      <Dialog open={!!replaceFor} onOpenChange={(o) => !o && setReplaceFor(null)}>
        <DialogContent className="bg-white" data-testid="replace-dialog">
          <DialogHeader><DialogTitle>Replace file</DialogTitle></DialogHeader>
          {replaceFor && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Replacing <strong>{replaceFor.original_filename}</strong>. The previous version stays in storage as backup.
              </p>
              <input
                ref={replaceInputRef}
                type="file"
                onChange={(e) => handleReplace(e.target.files[0], replaceFor.id)}
                className="block w-full text-sm"
                data-testid="replace-input"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceFor(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach dialog */}
      <Dialog open={!!attachFor} onOpenChange={(o) => !o && setAttachFor(null)}>
        <DialogContent className="bg-white" data-testid="attach-dialog">
          <DialogHeader><DialogTitle>Attach to product or order</DialogTitle></DialogHeader>
          {attachFor && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">File: <strong>{attachFor.original_filename}</strong></p>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Type</label>
                <select
                  value={attachForm.target_type}
                  onChange={(e) => setAttachForm({ ...attachForm, target_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  data-testid="attach-type"
                >
                  <option value="product">Product</option>
                  <option value="order">Order</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  {attachForm.target_type === 'product' ? 'Product ID (e.g. holiday_ae)' : 'Order Number (e.g. SF-2026-XXXXX)'}
                </label>
                <Input
                  value={attachForm.target_id}
                  onChange={(e) => setAttachForm({ ...attachForm, target_id: e.target.value })}
                  data-testid="attach-target-id"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Role (optional, e.g. primary, preview, bonus)</label>
                <Input
                  value={attachForm.role}
                  onChange={(e) => setAttachForm({ ...attachForm, role: e.target.value })}
                  data-testid="attach-role"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachFor(null)}>Cancel</Button>
            <Button onClick={submitAttach} data-testid="attach-submit">Attach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFileManager;
