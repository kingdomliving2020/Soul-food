import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, RefreshCw, Trash2, Download, Link2, Unlink, Search,
  ArrowLeft, Loader2, Plus, FileText, Image as ImageIcon,
  Music, FileType, AlertCircle, CheckCircle, History,
  FileDown, FileUp, ShieldCheck
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
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migrateBusy, setMigrateBusy] = useState(false);
  const [migrateSummary, setMigrateSummary] = useState(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);
  const importInputRef = useRef(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, current: '' });
  const [dragActive, setDragActive] = useState(false);

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

  const handleBulkUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (files.length === 1) return handleUpload(files[0]);
    setUploading(true);
    setBulkProgress({ done: 0, total: files.length, current: files[0]?.name || '' });
    let ok = 0, failed = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setBulkProgress({ done: i, total: files.length, current: f.name });
      try {
        const fd = new FormData();
        fd.append('file', f);
        fd.append('category', category || 'uploads');
        fd.append('description', '');
        const res = await fetch(`${API}/api/admin/files/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          failed.push(`${f.name}: ${d.detail || res.status}`);
        } else {
          ok += 1;
        }
      } catch (e) {
        failed.push(`${f.name}: ${e.message}`);
      }
    }
    setBulkProgress({ done: files.length, total: files.length, current: '' });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (failed.length === 0) toast.success(`Uploaded ${ok} files`);
    else toast.warning(`Uploaded ${ok}, failed ${failed.length}: ${failed.slice(0, 3).join('; ')}${failed.length > 3 ? '…' : ''}`);
    setPage(0);
    load();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer?.files?.length) handleBulkUpload(e.dataTransfer.files);
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

  const runMigration = async (apply) => {
    setMigrateBusy(true);
    setMigrateSummary(null);
    try {
      const res = await fetch(`${API}/api/admin/files/migrate-legacy?apply=${apply}&attach=true`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Migration failed');
      setMigrateSummary(data);
      if (apply) {
        toast.success(`Migrated ${data.migrated} new file(s); ${data.already_migrated} already up-to-date`);
        load();
      } else {
        toast.success(`Dry-run complete: ${data.would_migrate} new, ${data.already_migrated} already migrated`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setMigrateBusy(false);
    }
  };

  const exportManifest = async () => {
    setSyncBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/files/export-manifest`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Export failed');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soul-food-files-manifest-${stamp}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported manifest: ${data.count} file(s)`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncBusy(false);
    }
  };

  const handleImportManifest = async (file) => {
    if (!file) return;
    setSyncBusy(true);
    setSyncSummary(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
      if (!items.length) throw new Error('Manifest contains no items');
      const res = await fetch(`${API}/api/admin/files/import-manifest?verify_storage=true`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Import failed');
      setSyncSummary(data);
      toast.success(`Import complete: ${data.inserted} new, ${data.updated} updated`);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncBusy(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const verifyStorage = async () => {
    setSyncBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/files/verify-storage?limit=1000`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verify failed');
      setSyncSummary({ ...data, _verify: true });
      if (data.unreachable_count === 0) {
        toast.success(`All ${data.reachable} blob(s) reachable in Object Storage`);
      } else {
        toast.warning(`${data.unreachable_count} of ${data.checked} blob(s) unreachable`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 p-6" data-testid="admin-file-manager"
         onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
         onDragLeave={() => setDragActive(false)}
         onDrop={onDrop}>
      <Toaster richColors position="top-right" />
      {dragActive && (
        <div className="fixed inset-0 z-50 bg-indigo-600/20 border-4 border-dashed border-indigo-500 rounded-xl pointer-events-none flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-xl shadow-xl">
            <p className="text-lg font-semibold text-indigo-700">Drop files to upload</p>
            <p className="text-xs text-slate-500">Any file type, up to 500 MB each, unlimited count</p>
          </div>
        </div>
      )}
      {bulkProgress.total > 0 && bulkProgress.done < bulkProgress.total && (
        <div className="fixed bottom-6 right-6 z-40 bg-white border border-slate-200 rounded-lg shadow-lg p-4 w-80" data-testid="bulk-progress">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Uploading {bulkProgress.done + 1} of {bulkProgress.total}
          </p>
          <p className="text-xs text-slate-500 truncate mb-2" title={bulkProgress.current}>{bulkProgress.current}</p>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all"
                 style={{ width: `${(bulkProgress.done / Math.max(1, bulkProgress.total)) * 100}%` }} />
          </div>
        </div>
      )}
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
            <Button
              onClick={() => { setMigrateSummary(null); setMigrateOpen(true); }}
              variant="outline"
              size="sm"
              data-testid="migrate-legacy-btn"
            >
              <History className="w-4 h-4 mr-1" /> Migrate legacy
            </Button>
            <Button
              onClick={() => { setSyncSummary(null); setSyncOpen(true); }}
              variant="outline"
              size="sm"
              data-testid="sync-prod-btn"
            >
              <FileDown className="w-4 h-4 mr-1" /> Sync prod
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              onChange={(e) => handleBulkUpload(e.target.files)}
              data-testid="upload-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="upload-btn"
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Upload files
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
      {/* Migrate legacy dialog */}
      <Dialog open={migrateOpen} onOpenChange={(o) => !migrateBusy && setMigrateOpen(o)}>
        <DialogContent className="bg-white max-w-2xl" data-testid="migrate-dialog">
          <DialogHeader><DialogTitle>Migrate legacy files</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Moves all files in <code className="bg-slate-100 px-1 rounded">/app/backend/content/</code> into
              durable Emergent Object Storage so they survive every redeploy. Idempotent — files already
              migrated are skipped (sha256 dedup). Files under <code>downloads/</code> that match a known
              product file are auto-attached to those products.
            </p>
            <p className="text-xs text-slate-500">
              Run a dry-run first to preview the plan, then click "Apply" to actually migrate.
            </p>
            {migrateSummary && (
              <div className="border rounded p-3 bg-slate-50 text-xs space-y-1" data-testid="migrate-summary">
                <div><b>Mode:</b> {migrateSummary.apply ? 'APPLIED' : 'DRY-RUN'}</div>
                <div><b>Total:</b> {migrateSummary.total}</div>
                <div><b>Migrated:</b> {migrateSummary.migrated}</div>
                <div><b>Would migrate:</b> {migrateSummary.would_migrate}</div>
                <div><b>Already migrated:</b> {migrateSummary.already_migrated}</div>
                <div><b>Auto-attached:</b> {migrateSummary.auto_attached_count}</div>
                <div><b>Skipped (ext):</b> {migrateSummary.skipped_ext}</div>
                <div className={migrateSummary.errors > 0 ? 'text-red-600' : ''}>
                  <b>Errors:</b> {migrateSummary.errors}
                </div>
                {migrateSummary.errors > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-red-600">
                    {(migrateSummary.results || []).filter(r => ['error', 'upload_failed'].includes(r.status)).slice(0, 10).map((r) => (
                      <li key={r.path}>{r.path} — {r.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMigrateOpen(false)} disabled={migrateBusy}>Close</Button>
            <Button
              variant="outline"
              onClick={() => runMigration(false)}
              disabled={migrateBusy}
              data-testid="migrate-dryrun-btn"
            >
              {migrateBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null} Dry run
            </Button>
            <Button
              onClick={() => runMigration(true)}
              disabled={migrateBusy}
              data-testid="migrate-apply-btn"
            >
              {migrateBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null} Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Sync prod dialog */}
      <Dialog open={syncOpen} onOpenChange={(o) => !syncBusy && setSyncOpen(o)}>
        <DialogContent className="bg-white max-w-2xl" data-testid="sync-dialog">
          <DialogHeader><DialogTitle>Sync to production (manifest)</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Use this when production's File Manager is missing files that exist in preview.
              Emergent Object Storage is keyed by your <code className="bg-slate-100 px-1 rounded">EMERGENT_LLM_KEY</code> —
              your blobs typically reach both environments. What's missing in prod is the <code>db.files</code> index.
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-600">
              <li><b>In preview</b>: click <b>Export manifest</b> to download the JSON.</li>
              <li><b>In production</b> (kingdom-soul.com /admin/files): click <b>Import manifest</b> and select that JSON.</li>
              <li>Click <b>Verify storage</b> to confirm every blob is readable. Any unreachable blobs will be listed.</li>
            </ol>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => handleImportManifest(e.target.files[0])}
              data-testid="import-manifest-input"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportManifest} disabled={syncBusy} variant="outline" size="sm" data-testid="export-manifest-btn">
                {syncBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />} Export manifest
              </Button>
              <Button onClick={() => importInputRef.current?.click()} disabled={syncBusy} size="sm" data-testid="import-manifest-btn">
                {syncBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileUp className="w-4 h-4 mr-1" />} Import manifest
              </Button>
              <Button onClick={verifyStorage} disabled={syncBusy} variant="outline" size="sm" data-testid="verify-storage-btn">
                {syncBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1" />} Verify storage
              </Button>
            </div>
            {syncSummary && (
              <div className="border rounded p-3 bg-slate-50 text-xs space-y-1" data-testid="sync-summary">
                {syncSummary._verify ? (
                  <>
                    <div><b>Verify result:</b></div>
                    <div>Checked: {syncSummary.checked}</div>
                    <div>Reachable: {syncSummary.reachable}</div>
                    <div className={syncSummary.unreachable_count > 0 ? 'text-red-600' : ''}>
                      Unreachable: {syncSummary.unreachable_count}
                    </div>
                  </>
                ) : (
                  <>
                    <div><b>Import result:</b></div>
                    <div>Inserted: {syncSummary.inserted}</div>
                    <div>Updated: {syncSummary.updated}</div>
                    <div>Skipped: {syncSummary.skipped}</div>
                    <div className={syncSummary.unreachable_count > 0 ? 'text-amber-600' : ''}>
                      Unreachable blobs: {syncSummary.unreachable_count}
                    </div>
                    <div className={(syncSummary.errors || []).length > 0 ? 'text-red-600' : ''}>
                      Errors: {(syncSummary.errors || []).length}
                    </div>
                  </>
                )}
                {(syncSummary.unreachable || []).length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-amber-700 max-h-40 overflow-auto">
                    {(syncSummary.unreachable || []).slice(0, 30).map((u, i) => (
                      <li key={i}>{u.original_filename || u.storage_path}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncOpen(false)} disabled={syncBusy}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFileManager;
