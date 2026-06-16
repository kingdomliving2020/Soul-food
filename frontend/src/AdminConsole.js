import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Users, Package, ShoppingCart, 
  Image, BookOpen, Shield, Settings, LogOut, Menu, X,
  ChevronRight, Plus, Edit, Trash2, Eye, Clock, Archive,
  Download, Upload, RefreshCw, Search, Filter, AlertTriangle,
  Video, History, Lock, Unlock, Mail, TicketCheck, Tag, CheckCircle
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Toaster, toast } from 'sonner';
import { safeJson } from './lib/safeFetch';
import AdminCodesRedemptions from './AdminCodesRedemptions';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// =============================================================================
// ADMIN CONTEXT & AUTH
// =============================================================================

const AdminContext = React.createContext(null);

const useAdmin = () => {
  const context = React.useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

// =============================================================================
// SIDEBAR NAVIGATION
// =============================================================================

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/files', icon: Upload, label: 'File Manager' },
  { path: '/admin/content', icon: FileText, label: 'Content Manager' },
  { path: '/admin/instructor-content', icon: BookOpen, label: 'Instructor Content' },
  { path: '/admin/media', icon: Image, label: 'Media Library' },
  { path: '/admin/products', icon: Package, label: 'Products & Inventory' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/users', icon: Users, label: 'Users & Roles' },
  { path: '/admin/logs', icon: Shield, label: 'Audit Logs' },
  { path: '/admin/codes', icon: TicketCheck, label: 'Submitted Codes' },
  { path: '/admin/codes-redemptions', icon: Tag, label: 'Codes & Redemptions' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('soul_food_token');
    localStorage.removeItem('soul_food_user');
    localStorage.removeItem('soul_food_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('soulFoodToken');
    localStorage.removeItem('soulFoodUser');
    navigate('/');
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-orange-500">Soul Food Admin</h1>
              <button 
                className="lg:hidden text-slate-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-1">DevOps Console</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                  
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-orange-600 text-white' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                      `}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// =============================================================================
// DASHBOARD
// =============================================================================

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAdmin();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
    </div>;
  }
  
  const summary = stats?.summary || {};
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <span className="text-sm text-slate-500">Welcome, Admin</span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={summary.total_users || 0} 
          icon={Users}
          color="blue"
        />
        <StatCard 
          title="Total Lessons" 
          value={summary.total_lessons || 0} 
          icon={FileText}
          color="green"
        />
        <StatCard 
          title="Total Orders" 
          value={summary.total_orders || 0} 
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard 
          title="Revenue" 
          value={`$${(summary.total_revenue || 0).toFixed(2)}`} 
          icon={Package}
          color="orange"
        />
      </div>
      
      {/* Content Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Content Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Published Lessons</span>
              <span className="font-semibold text-green-600">{summary.published_lessons || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Draft Lessons</span>
              <span className="font-semibold text-yellow-600">{summary.draft_lessons || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Products</span>
              <span className="font-semibold text-blue-600">{summary.total_products || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/content" className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <Plus size={18} className="text-orange-600" />
              <span className="text-sm">New Lesson</span>
            </Link>
            <Link to="/admin/products" className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <Package size={18} className="text-blue-600" />
              <span className="text-sm">Manage Products</span>
            </Link>
            <Link to="/admin/users" className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <Users size={18} className="text-green-600" />
              <span className="text-sm">Manage Users</span>
            </Link>
            <Link to="/admin/logs" className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <Shield size={18} className="text-purple-600" />
              <span className="text-sm">View Logs</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Content Health (read-only diagnostic) */}
      <ContentHealthTile token={token} />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Orders</h2>
          {stats?.recent_orders?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_orders.map((order, i) => (
                <div key={order.order_number || order.session_id || `order-${i}`} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{order.email || 'Guest'}</p>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-semibold ${order.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    ${order.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No recent orders</p>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Users</h2>
          {stats?.recent_users?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_users.map((user, i) => (
                <div key={user.id || user.email || `ruser-${i}`} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{user.name || user.email}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'instructor' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role || 'user'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No recent users</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ContentHealthTile = ({ token }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/content-health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error('content-health load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6" data-testid="content-health-tile">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Content Health</h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  const dirs = data?.directories || {};
  const missingDirs = Object.entries(dirs).filter(([, info]) => info && info.exists === false).map(([p]) => p);
  const broken = data?.broken_link_count || 0;
  const totalPdfs = data?.total_pdf_files || 0;
  const totalMb = data?.total_size_mb || 0;
  const isHealthy = missingDirs.length === 0 && broken === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6" data-testid="content-health-tile">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Content Health</h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
            data-testid="content-health-status-badge"
          >
            {isHealthy ? 'Healthy' : 'Issues detected'}
          </span>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="text-xs text-slate-500 hover:text-slate-700 underline disabled:opacity-50"
          data-testid="content-health-refresh"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3" data-testid="content-health-pdfs">
          <p className="text-xs text-slate-500">PDFs on disk</p>
          <p className="text-xl font-bold text-slate-800">{totalPdfs}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3" data-testid="content-health-size">
          <p className="text-xs text-slate-500">Total size</p>
          <p className="text-xl font-bold text-slate-800">{totalMb} MB</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3" data-testid="content-health-missing-dirs">
          <p className="text-xs text-slate-500">Missing dirs</p>
          <p className={`text-xl font-bold ${missingDirs.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{missingDirs.length}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3" data-testid="content-health-broken-links">
          <p className="text-xs text-slate-500">Broken links</p>
          <p className={`text-xl font-bold ${broken > 0 ? 'text-red-600' : 'text-green-600'}`}>{broken}</p>
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        {Object.entries(dirs).map(([path, info]) => (
          <div key={path} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
            <span className="font-mono text-xs text-slate-600">{path}</span>
            {info?.exists ? (
              <span className="text-xs text-green-700">{info.pdf_count || 0} PDFs</span>
            ) : (
              <span className="text-xs font-semibold text-red-700">MISSING</span>
            )}
          </div>
        ))}
      </div>

      {!isHealthy && (
        <p className="mt-3 text-xs text-slate-500 italic" data-testid="content-health-hint">
          Tip: missing directories usually mean the deploy bundle excluded <code>/app/content/**</code>. Redeploy with the full content tree, or run the same check on production at <code>/api/admin/content-health</code> to compare.
        </p>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// CONTENT MANAGER
// =============================================================================

const ContentManager = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '', search: '' });
  const { token } = useAdmin();
  
  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.type) params.append('type', filter.type);
      
      const res = await fetch(`${API_URL}/api/admin/content?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);
  
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);
  
  const updateStatus = async (contentId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/${contentId}/status?status=${newStatus}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Content ${newStatus}`);
        fetchContent();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };
  
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-red-100 text-red-700',
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Content Manager</h1>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus size={18} className="mr-2" />
          New Content
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <select 
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          
          <select 
            value={filter.type}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            <option value="lesson">Lesson</option>
            <option value="page">Page</option>
          </select>
          
          <div className="flex-1 min-w-[200px]">
            <Input 
              placeholder="Search content..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Content List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : content.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Series</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Version</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Updated</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {content.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.id}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.series || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[item.status] || statusColors.draft}`}>
                      {item.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">v{item.version || 1}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-slate-400 hover:text-blue-600" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-orange-600" title="Edit">
                        <Edit size={16} />
                      </button>
                      {item.status !== 'published' && (
                        <button 
                          onClick={() => updateStatus(item.id, 'published')}
                          className="p-1 text-slate-400 hover:text-green-600" 
                          title="Publish"
                        >
                          <ChevronRight size={16} />
                        </button>
                      )}
                      {item.status !== 'archived' && (
                        <button 
                          onClick={() => updateStatus(item.id, 'archived')}
                          className="p-1 text-slate-400 hover:text-red-600" 
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <FileText size={48} className="mb-4 text-slate-300" />
            <p>No content found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// USERS MANAGER
// =============================================================================

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'member', password: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const { token } = useAdmin();
  
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || []);
      }
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token, search, roleFilter]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const toggleLock = async (userId, isCurrentlyDisabled) => {
    try {
      const action = isCurrentlyDisabled ? 'unlock' : 'lock';
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { ok, data } = await safeJson(res);
      if (ok) {
        toast.success(data.message || `Account ${action}ed`);
        fetchUsers();
      } else {
        toast.error(`${action} failed (${res.status}): ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    }
  };
  
  const resetPassword = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { ok, data } = await safeJson(res);
      if (ok) {
        toast.success(`Password reset! Temp: ${data.temporary_password || '(check email)'}`);
      } else {
        toast.error(`Reset failed: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.email) { toast.error('Email is required'); return; }
    setInviteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteData.email,
          name: inviteData.name,
          role: inviteData.role,
          ...(inviteData.password ? { password: inviteData.password } : {})
        })
      });
      const { ok, status, data } = await safeJson(res);
      if (ok) {
        toast.success(`User created! ${data.temporary_password ? `Temp password: ${data.temporary_password}` : ''}`);
        setShowInvite(false);
        setInviteData({ email: '', name: '', role: 'member', password: '' });
        fetchUsers();
      } else {
        toast.error(`Create failed (${status}): ${data.detail || data.message || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const { ok, data } = await safeJson(res);
      if (ok) {
        toast.success(`Role updated to ${newRole}`);
        setEditingRole(null);
        fetchUsers();
      } else {
        toast.error(`Role update failed: ${data.detail || data.message || JSON.stringify(data)}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    }
  };
  
  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    instructor: 'bg-blue-100 text-blue-700',
    student: 'bg-green-100 text-green-700',
    adult: 'bg-purple-100 text-purple-700',
    member: 'bg-slate-100 text-slate-700',
  };
  
  const availableRoles = ['admin', 'instructor', 'member', 'adult', 'student'];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Users & Roles</h1>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setShowInvite(true)}
          data-testid="invite-user-btn"
        >
          <Plus size={18} className="mr-2" />
          Invite User
        </Button>
      </div>

      {/* Invite User Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()} data-testid="invite-modal">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Invite New User</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <Input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={e => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  data-testid="invite-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <Input
                  value={inviteData.name}
                  onChange={e => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  data-testid="invite-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={inviteData.role}
                  onChange={e => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  data-testid="invite-role"
                >
                  {availableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password (leave blank for auto-generated)</label>
                <Input
                  type="password"
                  value={inviteData.password}
                  onChange={e => setInviteData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  data-testid="invite-password"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowInvite(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={inviteLoading} className="flex-1 bg-orange-600 hover:bg-orange-700" data-testid="invite-submit">
                  {inviteLoading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="member">Member</option>
            <option value="student">Student</option>
            <option value="adult">Adult</option>
          </select>
          
          <div className="flex-1 min-w-[200px]">
            <Input 
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : users.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Created</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{user.name || 'No Name'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingRole === user.id ? (
                      <select
                        defaultValue={user.role || 'member'}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        onBlur={() => setEditingRole(null)}
                        autoFocus
                        className="text-xs px-2 py-1 border border-blue-300 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-200 outline-none"
                        data-testid={`role-select-${user.id}`}
                      >
                        {availableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}
                        onClick={() => setEditingRole(user.id)}
                        title="Click to change role"
                        data-testid={`role-badge-${user.id}`}
                      >
                        {user.role || 'member'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.disabled ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Locked</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingRole(user.id)}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Change Role"
                        data-testid={`edit-btn-${user.id}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => resetPassword(user.id)}
                        className="p-1 text-slate-400 hover:text-orange-600" 
                        title="Reset Password"
                      >
                        <Mail size={16} />
                      </button>
                      <button 
                        onClick={() => toggleLock(user.id, user.disabled)}
                        className={`p-1 ${user.disabled ? 'text-green-600' : 'text-slate-400 hover:text-red-600'}`}
                        title={user.disabled ? 'Unlock' : 'Lock'}
                      >
                        {user.disabled ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Users size={48} className="mb-4 text-slate-300" />
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// ORDERS MANAGER
// =============================================================================

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);  // expanded order detail
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const { token } = useAdmin();

  const fetchOrders = useCallback(async (p = page, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 25 });
      if (q.trim()) params.set('search', q.trim());
      const res = await fetch(`${API_URL}/api/admin/orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items || []);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders(1, search);
  };

  const loadDetail = async (orderNumber) => {
    if (selected?.transaction?.order_number === orderNumber) { setSelected(null); return; }
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/detail`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelected(data);
      } else {
        toast.error('Could not load order detail');
      }
    } catch { toast.error('Failed to load detail'); }
    finally { setDetailLoading(false); }
  };

  const resendEmail = async (orderNumber) => {
    setActionLoading(`resend-${orderNumber}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/resend-email`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message || 'Email sent');
      else toast.error(data.detail || 'Failed');
    } catch { toast.error('Failed to resend'); }
    finally { setActionLoading(''); }
  };

  const grantAccess = async (orderNumber) => {
    setActionLoading(`grant-${orderNumber}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/grant-access`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message || 'Access granted'); loadDetail(orderNumber); }
      else toast.error(data.detail || 'Failed');
    } catch { toast.error('Failed to grant access'); }
    finally { setActionLoading(''); }
  };

  const syncFromStripe = async (orderNumber) => {
    setActionLoading(`sync-${orderNumber}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/sync-stripe`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Synced from Stripe');
        fetchOrders();
        if (selected?.transaction?.order_number === orderNumber) loadDetail(orderNumber);
      } else if (res.ok) {
        toast.warning(data.message || 'Stripe says not paid yet');
      } else {
        toast.error(data.detail || 'Stripe sync failed');
      }
    } catch { toast.error('Failed to sync'); }
    finally { setActionLoading(''); }
  };

  const markPaid = async (orderNumber) => {
    const reason = window.prompt(
      `Manually mark ${orderNumber} as PAID?\n\nThis will create download links and skip Stripe verification.\nEnter a reason for the audit log:`,
      'Verified payment via Stripe Dashboard'
    );
    if (!reason || !reason.trim()) return;
    setActionLoading(`paid-${orderNumber}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/mark-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Order marked paid');
        fetchOrders();
        if (selected?.transaction?.order_number === orderNumber) loadDetail(orderNumber);
      } else {
        toast.error(data.detail || 'Failed');
      }
    } catch { toast.error('Failed to mark paid'); }
    finally { setActionLoading(''); }
  };

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800" data-testid="admin-orders-heading">Orders</h1>
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search email, name, order #..."
            className="w-full sm:w-72"
            data-testid="admin-orders-search-input"
          />
          <Button type="submit" variant="outline" data-testid="admin-orders-search-btn">
            <Search size={16} className="mr-1" /> Search
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setSearch(''); setPage(1); fetchOrders(1, ''); }}>
            <RefreshCw size={16} />
          </Button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-orders-table">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Order #</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const on = order.order_number;
                  const isOpen = selected?.transaction?.order_number === on;
                  return (
                    <React.Fragment key={on}>
                      <tr className={`hover:bg-slate-50 cursor-pointer ${isOpen ? 'bg-purple-50' : ''}`}
                          onClick={() => loadDetail(on)} data-testid={`order-row-${on}`}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-800">{on}</td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800 truncate max-w-[200px]">{order.customer_email || 'Guest'}</p>
                          {order.customer_name && <p className="text-xs text-slate-500">{order.customer_name}</p>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">${(order.total_amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            order.payment_status === 'paid' || order.payment_status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>{order.payment_status || 'pending'}</span>
                          {order.claimed_by_user_id && (
                            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">claimed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => loadDetail(on)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-blue-600" title="View Details" data-testid={`view-detail-${on}`}>
                              <Eye size={15} />
                            </button>
                            {order.payment_status !== 'paid' && order.payment_status !== 'completed' && (
                              <>
                                <button onClick={() => syncFromStripe(on)} disabled={actionLoading === `sync-${on}`}
                                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-indigo-600 disabled:opacity-40" title="Sync from Stripe" data-testid={`sync-stripe-${on}`}>
                                  {actionLoading === `sync-${on}` ? <RefreshCw size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                                </button>
                                <button onClick={() => markPaid(on)} disabled={actionLoading === `paid-${on}`}
                                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-green-700 disabled:opacity-40" title="Mark as Paid (manual override)" data-testid={`mark-paid-${on}`}>
                                  {actionLoading === `paid-${on}` ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                </button>
                              </>
                            )}
                            <button onClick={() => resendEmail(on)} disabled={actionLoading === `resend-${on}`}
                              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-orange-600 disabled:opacity-40" title="Resend Email" data-testid={`resend-email-${on}`}>
                              {actionLoading === `resend-${on}` ? <RefreshCw size={15} className="animate-spin" /> : <Mail size={15} />}
                            </button>
                            <button onClick={() => grantAccess(on)} disabled={actionLoading === `grant-${on}`}
                              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-green-600 disabled:opacity-40" title="Grant/Regrant Access" data-testid={`grant-access-${on}`}>
                              {actionLoading === `grant-${on}` ? <RefreshCw size={15} className="animate-spin" /> : <Unlock size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isOpen && selected && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50 px-6 py-5 border-b-2 border-purple-200">
                            {detailLoading ? (
                              <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" /></div>
                            ) : (
                              <div className="grid md:grid-cols-2 gap-6 text-sm">
                                {/* Left: Order Info */}
                                <div>
                                  <h4 className="font-bold text-slate-700 mb-2">Order Info</h4>
                                  <dl className="space-y-1 text-slate-600">
                                    <div className="flex"><dt className="w-28 font-medium text-slate-500">Order:</dt><dd className="font-mono">{selected.transaction?.order_number}</dd></div>
                                    <div className="flex"><dt className="w-28 font-medium text-slate-500">Email:</dt><dd>{selected.transaction?.customer_email}</dd></div>
                                    <div className="flex"><dt className="w-28 font-medium text-slate-500">Name:</dt><dd>{selected.transaction?.customer_name || '-'}</dd></div>
                                    <div className="flex"><dt className="w-28 font-medium text-slate-500">Total:</dt><dd className="font-semibold">${(selected.transaction?.total_amount || 0).toFixed(2)}</dd></div>
                                    <div className="flex"><dt className="w-28 font-medium text-slate-500">Status:</dt><dd>{selected.transaction?.payment_status}</dd></div>
                                    {selected.transaction?.claimed_by_user_id && (
                                      <div className="flex"><dt className="w-28 font-medium text-slate-500">Claimed by:</dt><dd className="text-blue-600">{selected.transaction.claimed_by_user_id}</dd></div>
                                    )}
                                  </dl>

                                  <h4 className="font-bold text-slate-700 mt-4 mb-2">Items ({selected.transaction?.items?.length || 0})</h4>
                                  <ul className="space-y-1 text-slate-600">
                                    {(selected.transaction?.items || []).map((it, i) => (
                                      <li key={it.product_id || `item-${i}`} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                        {it.name || it.product_id} {it.quantity > 1 ? `x${it.quantity}` : ''}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Right: Download Links & Logs */}
                                <div>
                                  <h4 className="font-bold text-slate-700 mb-2">Download Links ({selected.download_links?.length || 0})</h4>
                                  {selected.download_links?.length > 0 ? (
                                    <ul className="space-y-1 text-slate-600 max-h-40 overflow-y-auto">
                                      {selected.download_links.map((dl, i) => (
                                        <li key={dl.token || dl.product_id || `dl-${i}`} className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded border">
                                          <span className="truncate">{dl.product_name || dl.product_id}</span>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${dl.revoked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                            {dl.revoked ? 'revoked' : 'active'}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-slate-400 text-xs">No download links found.</p>
                                  )}

                                  {selected.delivery_logs?.length > 0 && (
                                    <>
                                      <h4 className="font-bold text-slate-700 mt-4 mb-2">Delivery Log</h4>
                                      <ul className="space-y-1 text-xs text-slate-500 max-h-32 overflow-y-auto">
                                        {selected.delivery_logs.map((log, i) => (
                                          <li key={log.id || `log-${i}`} className="bg-white p-2 rounded border">
                                            <span className="font-medium text-slate-700">{log.type}</span> — {log.status} — {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <ShoppingCart size={40} className="mb-3 text-slate-300" />
            <p>{search ? 'No orders match your search' : 'No orders found'}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p-1); fetchOrders(page-1, search); }}>Prev</Button>
          <span className="text-sm text-slate-500 self-center">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(p => p+1); fetchOrders(page+1, search); }}>Next</Button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// PRODUCTS MANAGER
// =============================================================================

const ProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { token } = useAdmin();
  
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
        setLowStockCount(data.low_stock_count || 0);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products & Inventory</h1>
          {lowStockCount > 0 && (
            <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
              <AlertTriangle size={14} />
              {lowStockCount} items low on stock
            </p>
          )}
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus size={18} className="mr-2" />
          Add Product
        </Button>
      </div>
      
      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : products.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.type}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-600">{product.sku}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    ${product.price?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {product.inventory_count !== null ? (
                      <span className={`text-sm ${product.inventory_count <= 10 ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                        {product.inventory_count}
                      </span>
                    ) : (
                      <span className="text-slate-400">∞</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-700' :
                      product.status === 'sold_out' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-slate-400 hover:text-blue-600" title="Edit">
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Package size={48} className="mb-4 text-slate-300" />
            <p>No products found</p>
            <p className="text-sm mt-1">Add your first product to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MEDIA LIBRARY
// =============================================================================

const MediaLibrary = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { token } = useAdmin();
  
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMedia(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);
  
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        toast.success('File uploaded!');
        fetchMedia();
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  const deleteMedia = async (mediaId) => {
    if (!window.confirm('Delete this file?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/media/${mediaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('File deleted');
        fetchMedia();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Media Library</h1>
        <label className="cursor-pointer">
          <input 
            type="file" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button className="bg-orange-600 hover:bg-orange-700" disabled={uploading}>
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} className="mr-2" />
                Upload File
              </>
            )}
          </Button>
        </label>
      </div>
      
      {/* Media Grid */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : media.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((item) => (
              <div key={item.id} className="group relative border rounded-lg p-3 hover:border-orange-300 transition-colors">
                <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center mb-2">
                  {item.file_type === 'image' ? (
                    <Image size={32} className="text-slate-400" />
                  ) : item.file_type === 'pdf' ? (
                    <FileText size={32} className="text-red-500" />
                  ) : item.file_type === 'video' ? (
                    <Video size={32} className="text-blue-500" />
                  ) : (
                    <FileText size={32} className="text-slate-400" />
                  )}
                </div>
                <p className="text-xs text-slate-800 truncate" title={item.original_filename}>
                  {item.original_filename}
                </p>
                <p className="text-xs text-slate-500">{formatFileSize(item.file_size)}</p>
                
                {/* Hover actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteMedia(item.id)}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Image size={48} className="mb-4 text-slate-300" />
            <p>No media files</p>
            <p className="text-sm mt-1">Upload PDFs, images, or videos</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// INSTRUCTOR CONTENT
// =============================================================================

const InstructorContentManager = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAdmin();
  
  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/instructor-content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching instructor content:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);
  
  const typeLabels = {
    answer_key: 'Answer Key',
    facilitation_notes: 'Facilitation Notes',
    faith_nuggets: 'Faith Nuggets'
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Instructor Content</h1>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus size={18} className="mr-2" />
          Add Content
        </Button>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-800">Instructor-Only Content</h3>
            <p className="text-sm text-blue-700 mt-1">
              Content uploaded here is protected by server-side RBAC and will only be visible to users with Instructor or Admin roles.
            </p>
          </div>
        </div>
      </div>
      
      {/* Content List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : content.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Lesson ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Created</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {content.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm text-slate-800">{item.lesson_id}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {typeLabels[item.type] || item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-slate-400 hover:text-blue-600" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-orange-600" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <BookOpen size={48} className="mb-4 text-slate-300" />
            <p>No instructor content yet</p>
            <p className="text-sm mt-1">Add answer keys, facilitation notes, and more</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// AUDIT LOGS
// =============================================================================


// =============================================================================
// SUBMITTED CODES
// =============================================================================

const SubmittedCodes = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAdmin();

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/submitted-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching codes:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800" data-testid="admin-codes-heading">Submitted Codes</h1>
        <Button variant="outline" onClick={fetchCodes} data-testid="admin-codes-refresh">
          <RefreshCw size={16} className="mr-2" /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : codes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-codes-table">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">User Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">User Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Submitted</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {codes.map((c, i) => (
                  <tr key={c.code || `code-${i}`} className="hover:bg-slate-50" data-testid={`code-row-${i}`}>
                    <td className="px-4 py-3 font-mono text-sm text-slate-800">{c.code}</td>
                    <td className="px-4 py-3 text-slate-700">{c.user_email}</td>
                    <td className="px-4 py-3 text-slate-500">{c.user_name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c.submitted_at ? new Date(c.submitted_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        c.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>{c.status || 'pending'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <TicketCheck size={40} className="mb-3 text-slate-300" />
            <p>No submitted codes yet</p>
          </div>
        )}
      </div>
    </div>
  );
};


const AuditLogs = () => {
  const [logs, setLogs] = useState({ admin_logs: [], security_logs: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admin');
  const { token } = useAdmin();
  
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);
  
  const currentLogs = activeTab === 'admin' ? logs.admin_logs : logs.security_logs;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'admin' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Admin Actions
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'security' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Security Events
        </button>
      </div>
      
      {/* Logs List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : currentLogs?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {currentLogs.map((log, i) => (
              <div key={log.id || i} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">
                      {log.action || log.event_type}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {log.resource_type && `${log.resource_type}${log.resource_id ? `: ${log.resource_id}` : ''}`}
                      {log.user_email && ` | User: ${log.user_email}`}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <History size={48} className="mb-4 text-slate-300" />
            <p>No logs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN ADMIN CONSOLE
// =============================================================================

const AdminConsole = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('soul_food_token') || '');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user has admin access
    if (!token) {
      // Redirect to login
      navigate('/auth');
    }
  }, [token, navigate]);
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Admin Access Required</h1>
          <p className="text-slate-600 mb-4">Please log in with an admin account to access the console.</p>
          <Button onClick={() => navigate('/auth')} className="bg-orange-600 hover:bg-orange-700">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <AdminContext.Provider value={{ token, setToken }}>
      <div className="min-h-screen bg-slate-100">
        <Toaster position="top-right" />
        
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          
          <div className="flex-1 lg:ml-0">
            {/* Top bar */}
            <header className="bg-white border-b px-4 py-3 sticky top-0 z-30">
              <div className="flex items-center justify-between">
                <button 
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={24} />
                </button>
                
                <div className="flex items-center gap-4">
                  <Link to="/" className="text-sm text-orange-600 hover:text-orange-700">
                    ← Back to Site
                  </Link>
                </div>
              </div>
            </header>
            
            {/* Main content */}
            <main className="p-4 lg:p-6">
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="content/*" element={<ContentManager />} />
                <Route path="instructor-content/*" element={<InstructorContentManager />} />
                <Route path="media/*" element={<MediaLibrary />} />
                <Route path="products/*" element={<ProductsManager />} />
                <Route path="orders/*" element={<OrdersManager />} />
                <Route path="users/*" element={<UsersManager />} />
                <Route path="logs/*" element={<AuditLogs />} />
                <Route path="codes/*" element={<SubmittedCodes />} />
                <Route path="codes-redemptions/*" element={<AdminCodesRedemptions />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </AdminContext.Provider>
  );
};

export default AdminConsole;
