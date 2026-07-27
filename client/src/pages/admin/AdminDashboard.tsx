import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Car, LogOut, Users, UserCheck, Shield, Trash2, Edit3, Search, Filter,
  CheckCircle, AlertCircle, RefreshCw, X, ShieldAlert, Award, FileText
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import { formatDate, formatDateTime, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Delete Modal state
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notification message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [filterRole, searchQuery]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?role=${filterRole}&search=${encodeURIComponent(searchQuery)}`);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      learner_licence_status: u.learner_licence_status || 'not_applied',
      driving_licence_status: u.driving_licence_status || 'not_applied',
      identity_verified: u.identity_verified ? 1 : 0,
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.post(`/admin/users/${editingUser.id}/update`, editForm);
      showToast(`User ${editForm.name} updated successfully!`);
      setEditingUser(null);
      loadUsers();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      showToast(`User ${deletingUser.name} deleted successfully!`);
      setDeletingUser(null);
      loadUsers();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">DriveSense <span className="text-red-400">Admin</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-red-400">System Admin</p>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors flex items-center gap-1.5">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Management Portal</h1>
            <p className="text-slate-500 text-sm">Manage user accounts, applicant statuses, and system permissions</p>
          </div>
          <button onClick={() => { loadUsers(); loadStats(); }} className="btn-secondary text-sm self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <StatBox icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
            <StatBox icon={UserCheck} label="Applicants" value={stats.totalApplicants} color="bg-indigo-500" />
            <StatBox icon={Shield} label="RTO Officers" value={stats.totalOfficers} color="bg-teal-500" />
            <StatBox icon={ShieldAlert} label="Reviewers" value={stats.totalReviewers} color="bg-amber-500" />
            <StatBox icon={Award} label="Licences Issued" value={stats.passedLicences} color="bg-emerald-500" />
            <StatBox icon={FileText} label="Pending Tests" value={stats.pendingTests} color="bg-purple-500" />
          </div>
        )}

        {/* Filters & Search */}
        <div className="card p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            {['all', 'applicant', 'rto_officer', 'review_officer', 'admin'].map((role) => (
              <button key={role} onClick={() => setFilterRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterRole === role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {role === 'all' ? 'All Roles' : getRoleLabel(role)}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, app ID..."
              className="input-field pl-9 text-xs" />
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="px-4 py-3">User & Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Application ID</th>
                  <th className="px-4 py-3">Learner Status</th>
                  <th className="px-4 py-3">Driving Test Status</th>
                  <th className="px-4 py-3">Final Score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      {u.phone && <p className="text-[11px] text-slate-400">{u.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'review_officer' ? 'bg-amber-100 text-amber-700' :
                        u.role === 'rto_officer' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.application_id ? (
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-800">{u.application_id}</p>
                          <span className={`text-[10px] ${u.identity_verified ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {u.identity_verified ? '✓ Verified' : 'Unverified'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'applicant' ? (
                        <div>
                          <span className={getStatusColor(u.learner_licence_status || 'not_applied')}>
                            {getStatusLabel(u.learner_licence_status || 'not_applied')}
                          </span>
                          {u.learner_test_score !== null && (
                            <p className="text-[11px] text-slate-400 mt-0.5">Score: {u.learner_test_score}/10</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'applicant' ? (
                        <span className={getStatusColor(u.driving_licence_status || 'not_applied')}>
                          {getStatusLabel(u.driving_licence_status || 'not_applied')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{u.rto_center || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.final_score !== null && u.final_score !== undefined ? (
                        <span className={`font-bold text-xs ${u.final_result_status === 'pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {u.final_score}/100 ({u.final_result_status?.toUpperCase()})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(u)}
                          className="p-1.5 rounded text-slate-600 hover:bg-slate-200 transition-colors" title="Edit User">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingUser(u)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      No matching users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card max-w-lg w-full p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-lg">Edit User Profile</h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input-field" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                    <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="input-field">
                      <option value="applicant">Applicant</option>
                      <option value="rto_officer">RTO Officer</option>
                      <option value="review_officer">Review Officer</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                    <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="input-field" />
                  </div>
                </div>

                {editingUser.role === 'applicant' && (
                  <>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-800 mb-2">Applicant Licence Statuses</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Learner Licence Status</label>
                          <select value={editForm.learner_licence_status}
                            onChange={(e) => setEditForm({ ...editForm, learner_licence_status: e.target.value })}
                            className="input-field text-xs">
                            <option value="not_applied">Not Applied</option>
                            <option value="applied">Applied</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Driving Licence Status</label>
                          <select value={editForm.driving_licence_status}
                            onChange={(e) => setEditForm({ ...editForm, driving_licence_status: e.target.value })}
                            className="input-field text-xs">
                            <option value="not_applied">Not Applied</option>
                            <option value="test_scheduled">Test Scheduled</option>
                            <option value="test_completed">Test Completed</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="verifyCheck" checked={!!editForm.identity_verified}
                        onChange={(e) => setEditForm({ ...editForm, identity_verified: e.target.checked ? 1 : 0 })}
                        className="accent-slate-900 rounded" />
                      <label htmlFor="verifyCheck" className="text-xs text-slate-700">Identity Verified (DigiLocker)</label>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary text-xs">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-6 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Delete User Account?</h3>
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to delete <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})?
              </p>
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mb-6">
                ⚠️ Warning: This will permanently delete their application, test scores, bookings, videos, and review requests.
              </p>

              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingUser(null)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button onClick={handleDeleteUser} disabled={deleting} className="btn-danger text-sm">
                  {deleting ? 'Deleting...' : 'Yes, Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="card p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value ?? 0}</p>
        <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    applicant: 'Applicant',
    rto_officer: 'RTO Officer',
    review_officer: 'Review Officer',
    admin: 'System Admin',
  };
  return map[role] || role;
}
