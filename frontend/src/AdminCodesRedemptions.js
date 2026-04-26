/**
 * Admin Codes & Redemptions — system of record for batch redemption codes.
 *
 * Surfaces:
 *   - Batch list (aggregated via /api/admin/codes-redemptions/batches)
 *   - Drill-down to codes within a batch
 *   - CSV import (auto-detects student_batch / game_only / hour_seasonal / subscription)
 *   - Per-code override (status + reason) with audit trail
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Upload, RefreshCcw, ArrowLeft, AlertTriangle, CheckCircle2, Ban, ChevronRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const useAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('soul_food_token') : '';
  return { Authorization: `Bearer ${token}` };
};

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: 'bg-green-100 text-green-800',
    REDEEMED: 'bg-blue-100 text-blue-800',
    REVOKED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-slate-200 text-slate-700',
  };
  return <Badge className={`${map[status] || 'bg-slate-100 text-slate-700'} text-xs font-mono`}>{status}</Badge>;
};

const AdminCodesRedemptions = () => {
  const headers = useAuthHeaders();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [codes, setCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('REVOKED');
  const [overrideReason, setOverrideReason] = useState('');

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/codes-redemptions/batches`, { headers });
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (e) {
      console.error('Failed to load batches', e);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const openBatch = async (batch) => {
    setSelectedBatch(batch);
    setCodesLoading(true);
    try {
      const params = new URLSearchParams();
      if (batch.series !== null && batch.series !== undefined) params.set('series', batch.series || '');
      if (batch.edition) params.set('edition', batch.edition);
      if (batch.delivery_type) params.set('delivery_type', batch.delivery_type);
      const res = await fetch(
        `${API_URL}/api/admin/codes-redemptions/batches/${encodeURIComponent(batch.batch_id)}/codes?${params}`,
        { headers }
      );
      const data = await res.json();
      setCodes(data.codes || []);
    } finally {
      setCodesLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMessage('');
    setImportError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/admin/codes-redemptions/import-csv`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'Import failed');
      setImportMessage(
        `Imported ${file.name} as "${data.schema_detected}" — ${data.inserted} inserted, ${data.skipped_duplicates} duplicates skipped`
      );
      await loadBatches();
    } catch (err) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const submitOverride = async () => {
    if (!overrideTarget || overrideReason.trim().length < 2) return;
    try {
      const res = await fetch(
        `${API_URL}/api/admin/codes-redemptions/codes/${encodeURIComponent(overrideTarget.code)}/override`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: overrideStatus, reason: overrideReason.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Override failed');
      setOverrideTarget(null);
      setOverrideReason('');
      // Refresh code list
      if (selectedBatch) await openBatch(selectedBatch);
      await loadBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  // -------------------- batch detail view --------------------
  if (selectedBatch) {
    return (
      <div className="space-y-4" data-testid="admin-codes-batch-detail">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => { setSelectedBatch(null); setCodes([]); }}
            data-testid="back-to-batches-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to batches
          </Button>
          <div className="text-sm text-slate-600">
            <span className="font-mono">{selectedBatch.batch_id}</span> · {selectedBatch.total} total · {selectedBatch.redeemed} redeemed · {selectedBatch.remaining} remaining
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedBatch.series && <span className="mr-2">{selectedBatch.series}</span>}
              {selectedBatch.edition} · {selectedBatch.delivery_type}
              {selectedBatch.total_hours && <span className="ml-2 text-slate-500 text-sm">· {selectedBatch.total_hours}h</span>}
              {selectedBatch.duration_days && <span className="ml-2 text-slate-500 text-sm">· {selectedBatch.duration_days}d</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {codesLoading ? (
              <p className="text-slate-500 text-sm">Loading codes…</p>
            ) : (
              <table className="w-full text-sm" data-testid="batch-codes-table">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2">Code</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Uses</th>
                    <th className="py-2">Redeemed by</th>
                    <th className="py-2">Override</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.code} className="border-b hover:bg-slate-50" data-testid={`code-row-${c.code}`}>
                      <td className="py-2 font-mono text-xs">{c.code}</td>
                      <td className="py-2"><StatusBadge status={c.status} /></td>
                      <td className="py-2">{c.uses_used} / {c.max_uses}</td>
                      <td className="py-2 text-slate-600">{c.redeemed_by_email || '—'}</td>
                      <td className="py-2 text-slate-500 text-xs">
                        {c.override_status ? (
                          <span title={c.override_reason || ''}>
                            <AlertTriangle className="w-3 h-3 inline text-amber-500" /> {c.override_status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setOverrideTarget(c);
                            setOverrideStatus(c.status === 'REVOKED' ? 'RESTORED' : 'REVOKED');
                            setOverrideReason('');
                          }}
                          data-testid={`override-btn-${c.code}`}
                        >
                          Override
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!overrideTarget} onOpenChange={(o) => !o && setOverrideTarget(null)}>
          <DialogContent className="bg-white" data-testid="override-dialog">
            <DialogHeader>
              <DialogTitle>Override code</DialogTitle>
            </DialogHeader>
            {overrideTarget && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 font-mono">{overrideTarget.code}</p>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">New status</label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    data-testid="override-status-select"
                  >
                    <option value="REVOKED">REVOKED — block redemption</option>
                    <option value="EXPIRED">EXPIRED — mark expired</option>
                    <option value="RESTORED">RESTORED — re-enable (sets status to ACTIVE)</option>
                    <option value="ACTIVE">ACTIVE — force active</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Reason (audit trail)</label>
                  <Textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Why this override? (visible in audit logs)"
                    rows={3}
                    data-testid="override-reason-input"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideTarget(null)}>Cancel</Button>
              <Button
                onClick={submitOverride}
                disabled={overrideReason.trim().length < 2}
                data-testid="override-submit-btn"
              >
                Apply override
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------------------- batch list view --------------------
  return (
    <div className="space-y-4" data-testid="admin-codes-redemptions">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Codes & Redemptions</span>
            <Button onClick={loadBatches} variant="ghost" size="sm" data-testid="refresh-batches-btn">
              <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </CardTitle>
          <p className="text-sm text-slate-500">
            System of record for batch redemption codes. Marketing/demo coupons are tracked separately.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
            <label className="flex items-center gap-3 cursor-pointer">
              <Upload className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium">
                {importing ? 'Importing…' : 'Import CSV — auto-detects schema'}
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
                data-testid="import-csv-input"
              />
              <Button asChild size="sm" disabled={importing} data-testid="import-csv-btn">
                <span>Choose file…</span>
              </Button>
            </label>
            {importMessage && (
              <p className="mt-2 text-sm text-green-700 flex items-center gap-1" data-testid="import-success">
                <CheckCircle2 className="w-4 h-4" /> {importMessage}
              </p>
            )}
            {importError && (
              <p className="mt-2 text-sm text-red-700 flex items-center gap-1" data-testid="import-error">
                <Ban className="w-4 h-4" /> {importError}
              </p>
            )}
          </div>

          {loading ? (
            <p className="text-slate-500 text-sm">Loading batches…</p>
          ) : batches.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No batches imported yet. Upload a CSV above.</p>
          ) : (
            <table className="w-full text-sm" data-testid="batches-table">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Batch</th>
                  <th className="py-2">Series</th>
                  <th className="py-2">Edition</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Redeemed</th>
                  <th className="py-2">Remaining</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr
                    key={`${b.batch_id}-${b.delivery_type}`}
                    className="border-b hover:bg-slate-50 cursor-pointer"
                    onClick={() => openBatch(b)}
                    data-testid={`batch-row-${b.batch_id}`}
                  >
                    <td className="py-2 font-mono text-xs">{b.batch_id}</td>
                    <td className="py-2">{b.series || '—'}</td>
                    <td className="py-2">{b.edition || '—'}</td>
                    <td className="py-2">
                      <Badge className="bg-slate-100 text-slate-700 text-xs">{b.delivery_type}</Badge>
                      {b.total_hours && <span className="ml-2 text-xs text-slate-500">{b.total_hours}h</span>}
                      {b.duration_days && <span className="ml-2 text-xs text-slate-500">{b.duration_days}d</span>}
                    </td>
                    <td className="py-2 font-medium">{b.total}</td>
                    <td className="py-2 text-blue-700">{b.redeemed}</td>
                    <td className="py-2 text-green-700 font-medium">{b.remaining}</td>
                    <td className="py-2 text-right text-slate-400">
                      <ChevronRight className="w-4 h-4 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCodesRedemptions;
