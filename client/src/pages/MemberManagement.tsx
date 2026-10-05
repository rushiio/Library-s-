import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Printer,
  Shield,
  GraduationCap,
  Sparkles,
  QrCode,
  Lock,
  Building2,
  RefreshCw,
  Mail,
  Phone,
  Key,
  Trash2,
  ShieldAlert,
  UserCheck,
  UserX,
  Check,
  X,
  Layers,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Role } from '../types';

export const MemberManagement: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Add / Edit Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [department, setDepartment] = useState('Computer Engineering');
  const [phone, setPhone] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetProcessing, setResetProcessing] = useState(false);

  // Virtual Library Card Modal State
  const [activeCardUser, setActiveCardUser] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/users?search=${encodeURIComponent(search)}&role=${roleFilter}&status=${statusFilter}&department=${departmentFilter}&limit=50`
      );
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [roleFilter, statusFilter, departmentFilter]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTemporaryPassword(pwd);
  };

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setRole('STUDENT');
    setDepartment('Computer Engineering');
    setPhone('');
    setEnrollmentNumber('');
    setMustChangePassword(true);
    generateRandomPassword();
    setShowMemberModal(true);
  };

  const handleOpenEditModal = (u: any) => {
    setEditingUserId(u.id);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setDepartment(u.department || 'Computer Engineering');
    setPhone(u.phone || '');
    setEnrollmentNumber(u.enrollmentNumber || '');
    setTemporaryPassword('');
    setMustChangePassword(Boolean(u.mustChangePassword));
    setShowMemberModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      setSaving(true);
      if (editingUserId) {
        // Update user
        const res = await api.put(`/users/${editingUserId}`, {
          name,
          email,
          role,
          department,
          phone,
          enrollmentNumber,
          mustChangePassword,
        });

        if (res.data.success) {
          setNotification({ type: 'success', message: res.data.message });
          setShowMemberModal(false);
          fetchMembers();
        }
      } else {
        // Create user
        const res = await api.post('/users', {
          name,
          email,
          role,
          department,
          phone,
          enrollmentNumber,
          temporaryPassword,
          mustChangePassword,
        });

        if (res.data.success) {
          setNotification({ type: 'success', message: res.data.message });
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
          setShowMemberModal(false);
          fetchMembers();
        }
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Failed to save member.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Deactivate / Reactivate
  const handleToggleStatus = async (targetUser: any) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'reactivate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} account for ${targetUser.name}?`)) return;

    try {
      const res = await api.put(`/users/${targetUser.id}`, { status: newStatus });
      if (res.data.success) {
        setNotification({ type: 'success', message: `User ${targetUser.name} ${action}d successfully.` });
        fetchMembers();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.error || `Failed to ${action} user.` });
    }
  };

  // Reset User Password
  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetNewPassword.trim()) return;

    try {
      setResetProcessing(true);
      const res = await api.post(`/users/${resetModalUser.id}/reset-password`, {
        newPassword: resetNewPassword.trim(),
      });
      if (res.data.success) {
        setNotification({ type: 'success', message: res.data.message });
        setResetModalUser(null);
        setResetNewPassword('');
        fetchMembers();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.error || 'Failed to reset password.' });
    } finally {
      setResetProcessing(false);
    }
  };

  // Delete User with Safeguards
  const handleDeleteUser = async (targetUser: any) => {
    if (!confirm(`CAUTION: Permanently delete account for "${targetUser.name}" (${targetUser.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/users/${targetUser.id}`);
      if (res.data.success) {
        setNotification({ type: 'success', message: res.data.message });
        fetchMembers();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.error || 'Failed to delete user.' });
    }
  };

  const printCard = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-200/50 dark:border-purple-800/50">
            <Shield className="h-3.5 w-3.5" />
            <span>Administrative User & Role Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional User Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provision staff and student accounts, assign roles (Admin, Librarian, Faculty, Student), manage account status, and enforce secure password policies.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
        >
          <UserPlus className="h-4 w-4" /> Provision New Account
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, Member ID (e.g. STU001), or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="LIBRARIAN">Librarian</option>
              <option value="FACULTY">Faculty</option>
              <option value="STUDENT">Student</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="INACTIVE">Deactivated</option>
            </select>

            <button
              onClick={fetchMembers}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">Loading institutional user accounts...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No matching user accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-semibold">User & Contact</th>
                  <th className="pb-3 font-semibold">Member ID</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Created / Last Login</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=8b5cf6&color=fff`}
                          alt={u.name}
                          className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.mustChangePassword && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold" title="Forced password change on login">
                                Force Pwd Change
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {u.memberId}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : u.role === 'LIBRARIAN'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : u.role === 'FACULTY'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                      {u.department || 'General'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : u.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {u.status || (u.isActive ? 'ACTIVE' : 'INACTIVE')}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-slate-500 whitespace-nowrap">
                      <div>{new Date(u.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {u.lastLoginAt ? `Login: ${new Date(u.lastLoginAt).toLocaleDateString()}` : 'Never logged in'}
                      </div>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveCardUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800"
                          title="Virtual ID Card"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResetModalUser(u);
                            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
                            let pwd = '';
                            for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                            setResetNewPassword(pwd);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit User Profile & Role"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
                          title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Reactivate Account'}
                        >
                          {u.status === 'ACTIVE' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit User */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingUserId ? 'Edit Account & Permissions' : 'Provision New Library Account'}
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role Assignment *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="LIBRARIAN">Librarian</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98230 11000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {!editingUserId && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Initial Password *</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-purple-600 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-purple-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Force user to change password at next login</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingUserId ? 'Save Changes' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset User Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                <span>Reset User Password</span>
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Setting new temporary password for <strong>{resetModalUser.name}</strong> ({resetModalUser.email}). They will be forced to change this password when logging in.
            </p>

            <form onSubmit={handleExecuteResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetProcessing}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {resetProcessing ? 'Resetting...' : 'Confirm Password Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Virtual ID Card */}
      {activeCardUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Institutional Library Card</h3>
              </div>
              <button
                onClick={() => setActiveCardUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 shadow-xl border border-purple-800/40 relative overflow-hidden mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-sm">
                    L
                  </div>
                  <span className="text-xs font-black tracking-wider uppercase">LibraAI Smart Card</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {activeCardUser.role}
                </span>
              </div>

              <div className="flex gap-4 items-center mb-6">
                <img
                  src={activeCardUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeCardUser.name)}&background=8b5cf6&color=fff`}
                  alt={activeCardUser.name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-purple-500/40"
                />
                <div>
                  <h4 className="text-lg font-black leading-tight">{activeCardUser.name}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{activeCardUser.department || 'General'}</p>
                  <p className="text-[10px] text-purple-300 font-mono mt-0.5">ID: {activeCardUser.memberId}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 text-slate-900 flex flex-col items-center justify-center">
                <div className="font-mono text-xs font-black tracking-widest uppercase">
                  ||||| | |||| ||||| ||| |||||
                </div>
                <div className="text-[9px] font-mono font-bold mt-1 text-slate-600">{activeCardUser.memberId}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveCardUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={printCard}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
