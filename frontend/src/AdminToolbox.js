import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';
import {
  Plus, Trash2, Upload, Link2, GripVertical, Eye, EyeOff, Pencil,
  ChevronUp, ChevronDown, X, FileText, Loader2, Folder, Search
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmtSize = (b) => (b ? `${(b / 1024).toFixed(b > 1024 * 1024 ? 1 : 0)} ${b > 1024 * 1024 ? 'MB' : 'KB'}` : '');

const AdminToolbox = () => {
  const token = localStorage.getItem('soul_food_token') || '';
  const headers = { Authorization: `Bearer ${token}` };
  const [sections, setSections] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [newSection, setNewSection] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/toolbox/sections`, { headers });
      const data = await res.json();
      setSections(data.sections || []);
      if (!activeKey && data.sections?.length) setActiveKey(data.sections[0].key);
    } catch { toast.error('Failed to load sections'); }
    finally { setLoading(false); }
    // eslint-disable-next-line
  }, []);

  const fetchAssets = useCallback(async (key) => {
    if (!key) return;
    setAssetsLoading(true);
    try {
      const res = await fetch(`${API}/admin/toolbox/sections/${key}/assets`, { headers });
      const data = await res.json();
      setAssets(data.assets || []);
    } catch { toast.error('Failed to load assets'); }
    finally { setAssetsLoading(false); }
    // eslint-disable-next-line
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);
  useEffect(() => { if (activeKey) fetchAssets(activeKey); }, [activeKey, fetchAssets]);

  const active = sections.find(s => s.key === activeKey);

  const createSection = async () => {
    if (!newSection.trim()) return;
    const res = await fetch(`${API}/admin/toolbox/sections`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSection.trim() }),
    });
    if (res.ok) { toast.success('Section created'); setNewSection(''); fetchSections(); }
    else { const e = await res.json(); toast.error(e.detail || 'Failed'); }
  };

  const updateSection = async (id, patch) => {
    const res = await fetch(`${API}/admin/toolbox/sections/${id}`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) { fetchSections(); setRenaming(null); }
    else { const e = await res.json(); toast.error(e.detail || 'Failed'); }
  };

  const deleteSection = async (s) => {
    if (!window.confirm(`Delete section "${s.title}" and unassign its files? (files stay in File Manager)`)) return;
    const res = await fetch(`${API}/admin/toolbox/sections/${s.id}`, { method: 'DELETE', headers });
    if (res.ok) { toast.success('Section deleted'); if (activeKey === s.key) setActiveKey(null); fetchSections(); }
    else { const e = await res.json(); toast.error(e.detail || 'Failed'); }
  };

  const move = async (idx, dir) => {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next);
    await fetch(`${API}/admin/toolbox/sections/reorder`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordered_ids: next.map(s => s.id) }),
    });
  };

  const uploadAsset = async (file) => {
    const fd = new FormData();
    fd.append('section_key', activeKey);
    fd.append('file', file);
    const res = await fetch(`${API}/admin/toolbox/assets/upload`, { method: 'POST', headers, body: fd });
    if (res.ok) { toast.success('Uploaded & assigned'); fetchAssets(activeKey); fetchSections(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.detail || 'Upload failed'); }
  };

  const removeAsset = async (id) => {
    const res = await fetch(`${API}/admin/toolbox/assets/${id}`, { method: 'DELETE', headers });
    if (res.ok) { toast.success('Removed'); fetchAssets(activeKey); fetchSections(); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-orange-600 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-toolbox-page">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Instructor Toolbox</h1>
        <p className="text-sm text-slate-500 mt-1">Manage the sections and publisher resources instructors see in their Toolbox. Instructors can also upload their own class resources into these sections.</p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Sections list */}
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3" data-testid="toolbox-sections-panel">
          <div className="flex items-center gap-2">
            <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="New section name…"
              onKeyDown={e => e.key === 'Enter' && createSection()} data-testid="new-section-input" />
            <Button size="sm" onClick={createSection} className="bg-orange-600 hover:bg-orange-700 flex-shrink-0" data-testid="add-section-btn">
              <Plus size={16} />
            </Button>
          </div>
          <div className="space-y-1.5">
            {sections.map((s, idx) => (
              <div key={s.id}
                className={`rounded-lg border p-2.5 transition-colors ${activeKey === s.key ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'}`}
                data-testid={`section-row-${s.key}`}>
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-slate-300 flex-shrink-0" />
                  <button className="flex-1 text-left min-w-0" onClick={() => setActiveKey(s.key)}>
                    {renaming === s.id ? (
                      <Input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && updateSection(s.id, { title: renameVal })}
                        onBlur={() => updateSection(s.id, { title: renameVal })}
                        className="h-7 text-sm" data-testid={`rename-input-${s.key}`} />
                    ) : (
                      <span className={`text-sm font-medium truncate block ${s.enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{s.title}</span>
                    )}
                    <span className="text-[11px] text-slate-400">{s.publisher_count} publisher · {s.instructor_count} instructor</span>
                  </button>
                  {s.is_default && <Badge variant="outline" className="text-[9px] flex-shrink-0">core</Badge>}
                </div>
                <div className="flex items-center gap-1 mt-1.5 pl-5">
                  <button title="Move up" onClick={() => move(idx, -1)} className="p-1 text-slate-400 hover:text-slate-700" data-testid={`section-up-${s.key}`}><ChevronUp size={14} /></button>
                  <button title="Move down" onClick={() => move(idx, 1)} className="p-1 text-slate-400 hover:text-slate-700" data-testid={`section-down-${s.key}`}><ChevronDown size={14} /></button>
                  <button title="Rename" onClick={() => { setRenaming(s.id); setRenameVal(s.title); }} className="p-1 text-slate-400 hover:text-blue-600" data-testid={`section-rename-${s.key}`}><Pencil size={13} /></button>
                  <button title={s.enabled ? 'Disable' : 'Enable'} onClick={() => updateSection(s.id, { enabled: !s.enabled })} className="p-1 text-slate-400 hover:text-amber-600" data-testid={`section-toggle-${s.key}`}>
                    {s.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {!s.is_default && (
                    <button title="Delete" onClick={() => deleteSection(s)} className="p-1 text-slate-400 hover:text-red-600" data-testid={`section-delete-${s.key}`}><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets panel */}
        <div className="bg-white rounded-xl border shadow-sm p-4" data-testid="toolbox-assets-panel">
          {!active ? (
            <div className="text-center text-slate-400 py-16">Select a section to manage its resources.</div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Folder size={18} className="text-orange-500" />{active.title}</h2>
                  <p className="text-xs text-slate-500">{active.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAssign(true)} data-testid="assign-existing-btn">
                    <Link2 size={15} className="mr-1.5" /> Assign Existing
                  </Button>
                  <label className="inline-flex">
                    <input type="file" className="hidden" data-testid="upload-asset-input"
                      onChange={e => { if (e.target.files?.[0]) { uploadAsset(e.target.files[0]); e.target.value = ''; } }} />
                    <span className="inline-flex items-center cursor-pointer bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md px-3 py-1.5" data-testid="upload-asset-btn">
                      <Upload size={15} className="mr-1.5" /> Upload New
                    </span>
                  </label>
                </div>
              </div>

              {active.special_view && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-700 mb-3">
                  This section also has a built-in interactive view ({active.special_view.replace('_', ' ')}) for instructors. Files you assign here appear as additional downloadable resources.
                </div>
              )}

              {assetsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500 w-6 h-6" /></div>
              ) : assets.length === 0 ? (
                <div className="text-center text-slate-400 py-12 border-2 border-dashed rounded-lg" data-testid="assets-empty">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  No resources assigned yet. Use “Assign Existing” or “Upload New”.
                </div>
              ) : (
                <div className="space-y-2" data-testid="assets-list">
                  {assets.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50" data-testid={`asset-row-${a.id}`}>
                      <div className="w-9 h-9 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{a.label}</p>
                        <p className="text-[11px] text-slate-400">{a.filename} · {fmtSize(a.size_bytes)}</p>
                      </div>
                      <Badge className={`text-[10px] ${a.lane === 'publisher' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{a.lane}</Badge>
                      <button onClick={() => removeAsset(a.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Remove from section" data-testid={`remove-asset-${a.id}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAssign && active && (
        <AssignModal sectionKey={active.key} headers={headers} onClose={() => setShowAssign(false)}
          onAssigned={() => { fetchAssets(active.key); fetchSections(); }} assignedFileIds={assets.map(a => a.file_id)} />
      )}
    </div>
  );
};

const AssignModal = ({ sectionKey, headers, onClose, onAssigned, assignedFileIds }) => {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/files?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}`, { headers });
      const data = await res.json();
      setFiles(data.items || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const assign = async (fileId) => {
    const res = await fetch(`${API}/admin/toolbox/assets`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_key: sectionKey, file_id: fileId }),
    });
    if (res.ok) { toast.success('Assigned'); onAssigned(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.detail || 'Failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="assign-modal">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-800">Assign an existing file</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search File Manager…" className="pl-9" data-testid="assign-search-input" />
          </div>
        </div>
        <div className="overflow-y-auto p-2 flex-1">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500 w-6 h-6" /></div>
          ) : files.length === 0 ? (
            <div className="text-center text-slate-400 py-10">No files found.</div>
          ) : files.map(f => {
            const already = assignedFileIds.includes(f.id);
            return (
              <div key={f.id} className="flex items-center gap-3 p-2.5 rounded hover:bg-slate-50" data-testid={`assign-file-${f.id}`}>
                <FileText size={16} className="text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{f.original_filename}</p>
                  <p className="text-[11px] text-slate-400">{f.category} · {fmtSize(f.size_bytes)}</p>
                </div>
                <Button size="sm" variant={already ? 'outline' : 'default'} disabled={already}
                  className={already ? '' : 'bg-orange-600 hover:bg-orange-700'} onClick={() => assign(f.id)} data-testid={`assign-btn-${f.id}`}>
                  {already ? 'Assigned' : 'Assign'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminToolbox;
