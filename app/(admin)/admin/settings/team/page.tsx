'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  Clock,
  ChevronDown,
  MoreHorizontal,
  KeyRound,
  ShieldOff,
  ShieldCheck,
  Trash2,
  UserCog,
  Check,
  Download,
  Search,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import {
  GOLD,
  inputBase,
  focusBorder,
  blurBorder,
  SectionCard,
  FieldLabel,
  HelperText,
  Divider,
  SettingsSubNav,
} from '@/components/admin/settings/shared';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

type MemberRole   = 'admin' | 'superadmin' | 'viewer';
type MemberStatus = 'active' | 'invited' | 'suspended';

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  lastLoginAt: string | null;
  createdAt: string;
  avatar?: string | null;
}

interface ActivityEntry {
  _id: string;
  adminName: string;
  adminRole: string;
  action: string;
  detail: string;
  createdAt: string;
}

interface InviteForm {
  firstName: string;
  lastName: string;
  email: string;
  role: MemberRole;
  message: string;
}

// ── Permissions matrix data ────────────────────────────────────────────────────

const PERMISSIONS = [
  { feature: 'Dashboard',            superAdmin: true,  admin: true,  viewer: true  },
  { feature: 'Products — View',      superAdmin: true,  admin: true,  viewer: true  },
  { feature: 'Products — Edit',      superAdmin: true,  admin: true,  viewer: false },
  { feature: 'Products — Delete',    superAdmin: true,  admin: false, viewer: false },
  { feature: 'Orders — View',        superAdmin: true,  admin: true,  viewer: true  },
  { feature: 'Orders — Update',      superAdmin: true,  admin: true,  viewer: false },
  { feature: 'Customers — View',     superAdmin: true,  admin: true,  viewer: true  },
  { feature: 'Customers — Suspend',  superAdmin: true,  admin: true,  viewer: false },
  { feature: 'Bank Transfers',       superAdmin: true,  admin: true,  viewer: false },
  { feature: 'Promo Codes',          superAdmin: true,  admin: true,  viewer: true  },
  { feature: 'Inventory',            superAdmin: true,  admin: true,  viewer: true  },
  { feature: 'Analytics',            superAdmin: true,  admin: true,  viewer: true  },
  { feature: 'Settings',             superAdmin: true,  admin: false, viewer: false },
  { feature: 'Team Management',      superAdmin: true,  admin: false, viewer: false },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null, status: MemberStatus): string {
  if (!iso) {
    // "Never" is wrong for active accounts — the field simply wasn't tracked
    // until recently. Only say "Never" for pending invites who truly haven't logged in.
    return status === 'invited' ? 'Never logged in' : 'Before tracking';
  }
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    invited_admin:     'Invited Admin',
    updated_role:      'Updated Role',
    suspended_admin:   'Suspended Admin',
    restored_admin:    'Restored Admin',
    removed_admin:     'Removed Admin',
    reset_password:    'Reset Password',
    updated_order:     'Updated Order',
    confirmed_transfer:'Confirmed Transfer',
    deleted_product:   'Deleted Product',
  };
  return map[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function exportActivityCSV(logs: ActivityEntry[]) {
  const header = 'Admin,Role,Action,Detail,Date\n';
  const rows = logs.map((l) =>
    [
      `"${l.adminName}"`,
      `"${l.adminRole}"`,
      `"${actionLabel(l.action)}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
      `"${formatDateTime(l.createdAt)}"`,
    ].join(',')
  );
  const csv = header + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `admin-activity-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TeamSettingsPage() {
  const router = useRouter();

  // ── auth ──
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser]     = useState<AdminUser | null>(null);

  // ── team ──
  const [members, setMembers]             = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // ── invite modal ──
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [inviteForm, setInviteForm]   = useState<InviteForm>({ firstName: '', lastName: '', email: '', role: 'admin', message: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // ── activity log ──
  const [logs, setLogs]             = useState<ActivityEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage]     = useState(1);
  const [logsTotal, setLogsTotal]   = useState(0);
  const [logsPages, setLogsPages]   = useState(1);
  const [adminList, setAdminList]   = useState<{ _id: string; name: string }[]>([]);
  const [actionList, setActionList] = useState<string[]>([]);
  const [logFilter, setLogFilter]   = useState({ adminId: '', actionType: '', dateFrom: '', dateTo: '' });

  // ── auth check ──
  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) router.push('/admin/login');
        else setAdminUser(data.data);
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  // ── fetch team ──
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const r = await fetch('/api/admin/team');
      const d = await r.json();
      if (d.success) setMembers(d.data);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── fetch activity log ──
  const fetchLogs = useCallback(async (page = 1, reset = false) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page:       String(page),
        limit:      '20',
        adminId:    logFilter.adminId,
        actionType: logFilter.actionType,
        dateFrom:   logFilter.dateFrom,
        dateTo:     logFilter.dateTo,
      });
      const r = await fetch(`/api/admin/team/activity?${params}`);
      const d = await r.json();
      if (d.success) {
        setLogs((prev) => reset ? d.data.logs : [...prev, ...d.data.logs]);
        setLogsTotal(d.data.total);
        setLogsPages(d.data.pages);
        setLogsPage(page);
        if (page === 1) {
          setAdminList(d.data.adminList ?? []);
          setActionList(d.data.actionList ?? []);
        }
      }
    } finally {
      setLogsLoading(false);
    }
  }, [logFilter]);

  useEffect(() => { fetchLogs(1, true); }, [fetchLogs]);

  // ── member actions ──
  async function handleRoleChange(memberId: string, role: MemberRole) {
    setActionLoading(memberId);
    try {
      const r = await fetch(`/api/admin/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (r.ok) {
        setMembers((prev) => prev.map((m) => m._id === memberId ? { ...m, role } : m));
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleSuspend(member: TeamMember) {
    setActionLoading(member._id);
    const isSuspended = member.status !== 'suspended';
    try {
      const r = await fetch(`/api/admin/team/${member._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended }),
      });
      if (r.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m._id === member._id
              ? { ...m, status: isSuspended ? 'suspended' : 'active' }
              : m
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPassword(memberId: string) {
    setActionLoading(memberId);
    try {
      await fetch(`/api/admin/team/${memberId}/reset-password`, { method: 'POST' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(memberId: string) {
    setActionLoading(memberId);
    try {
      const r = await fetch(`/api/admin/team/${memberId}`, { method: 'DELETE' });
      if (r.ok) {
        setMembers((prev) => prev.filter((m) => m._id !== memberId));
      }
    } finally {
      setActionLoading(null);
      setConfirmRemoveId(null);
    }
  }

  // ── invite ──
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteForm.firstName.trim() || !inviteForm.lastName.trim() || !inviteForm.email.trim()) {
      setInviteError('First name, last name, and email are required.');
      return;
    }

    setInviteLoading(true);
    try {
      const r = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const d = await r.json();
      if (d.success) {
        setInviteSuccess(d.message ?? 'Invitation sent.');
        setInviteForm({ firstName: '', lastName: '', email: '', role: 'admin', message: '' });
        fetchMembers();
        setTimeout(() => { setInviteOpen(false); setInviteSuccess(''); }, 2200);
      } else {
        setInviteError(d.error ?? 'Something went wrong.');
      }
    } finally {
      setInviteLoading(false);
    }
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
      </div>
    );
  }

  const adminName    = `${adminUser.firstName} ${adminUser.lastName}`;
  const isSuperAdmin = adminUser.role === 'superadmin';

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      <AdminSidebar
        adminName={adminName}
        adminRole={adminUser.role}
        avatarUrl={adminUser.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <AdminTopNav
        pageTitle="Settings"
        adminName={adminName}
        avatarUrl={adminUser.avatar}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="lg:pl-55 pt-14 min-h-screen">
        <div className="flex min-h-[calc(100vh-56px)]">
          <SettingsSubNav />

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
              {/* ── Page header ── */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-[0.88rem] tracking-[0.06em] font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    Team Management
                  </h1>
                  <p className="mt-1 text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.36)' }}>
                    Manage admin accounts and permissions
                  </p>
                </div>
                {isSuperAdmin && (
                  <InviteButton onClick={() => setInviteOpen(true)} />
                )}
              </div>

              {/* ── Team members ── */}
              <TeamMembersSection
                members={members}
                loading={membersLoading}
                currentAdminId={adminUser._id}
                isSuperAdmin={isSuperAdmin}
                actionLoading={actionLoading}
                confirmRemoveId={confirmRemoveId}
                onConfirmRemove={setConfirmRemoveId}
                onRoleChange={handleRoleChange}
                onToggleSuspend={handleToggleSuspend}
                onResetPassword={handleResetPassword}
                onRemove={handleRemove}
              />

              {/* ── Role permissions matrix ── */}
              <RolePermissionsMatrix />

              {/* ── Activity log ── */}
              <ActivityLogSection
                logs={logs}
                loading={logsLoading}
                total={logsTotal}
                page={logsPage}
                pages={logsPages}
                adminList={adminList}
                actionList={actionList}
                filter={logFilter}
                onFilterChange={(f) => setLogFilter((prev) => ({ ...prev, ...f }))}
                onLoadMore={() => fetchLogs(logsPage + 1)}
                onExport={() => exportActivityCSV(logs)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Invite Admin Modal ── */}
      <InviteModal
        open={inviteOpen}
        form={inviteForm}
        loading={inviteLoading}
        error={inviteError}
        success={inviteSuccess}
        onClose={() => { setInviteOpen(false); setInviteError(''); setInviteSuccess(''); }}
        onChange={(patch) => setInviteForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={handleInvite}
      />

      {/* ── Confirm remove overlay ── */}
      <AnimatePresence>
        {confirmRemoveId && (
          <ConfirmRemoveModal
            member={members.find((m) => m._id === confirmRemoveId)!}
            loading={actionLoading === confirmRemoveId}
            onConfirm={() => handleRemove(confirmRemoveId)}
            onCancel={() => setConfirmRemoveId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Team Members Section ───────────────────────────────────────────────────────

function TeamMembersSection({
  members,
  loading,
  currentAdminId,
  isSuperAdmin,
  actionLoading,
  confirmRemoveId,
  onConfirmRemove,
  onRoleChange,
  onToggleSuspend,
  onResetPassword,
  onRemove,
}: {
  members: TeamMember[];
  loading: boolean;
  currentAdminId: string;
  isSuperAdmin: boolean;
  actionLoading: string | null;
  confirmRemoveId: string | null;
  onConfirmRemove: (id: string | null) => void;
  onRoleChange: (id: string, role: MemberRole) => void;
  onToggleSuspend: (m: TeamMember) => void;
  onResetPassword: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <SectionCard title="Admin Accounts" subtitle={`${members.length} team member${members.length !== 1 ? 's' : ''}`}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
        </div>
      ) : members.length === 0 ? (
        <p className="text-center py-8 text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          No team members yet. Invite someone to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <MemberCard
              key={member._id}
              member={member}
              isSelf={member._id === currentAdminId}
              isSuperAdmin={isSuperAdmin}
              actionLoading={actionLoading === member._id}
              onRoleChange={(role) => onRoleChange(member._id, role)}
              onToggleSuspend={() => onToggleSuspend(member)}
              onResetPassword={() => onResetPassword(member._id)}
              onRemove={() => onConfirmRemove(member._id)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────────

function MemberCard({
  member,
  isSelf,
  isSuperAdmin,
  actionLoading,
  onRoleChange,
  onToggleSuspend,
  onResetPassword,
  onRemove,
}: {
  member: TeamMember;
  isSelf: boolean;
  isSuperAdmin: boolean;
  actionLoading: boolean;
  onRoleChange: (role: MemberRole) => void;
  onToggleSuspend: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials    = getInitials(member.firstName, member.lastName);
  const suspended   = member.status === 'suspended';
  const invited     = member.status === 'invited';

  return (
    <div
      className="flex items-center gap-4 px-4 py-3"
      style={{
        background: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.06)',
        opacity: suspended ? 0.55 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[0.56rem] font-semibold shrink-0"
        style={{ background: GOLD, color: 'oklch(0.10 0 0)' }}
      >
        {member.avatar
          ? <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          : initials
        }
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[0.58rem] tracking-[0.08em] font-medium" style={{ color: 'rgba(255,255,255,0.82)' }}>
            {member.firstName} {member.lastName}
            {isSelf && (
              <span className="ml-2 text-[0.40rem] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>
                (you)
              </span>
            )}
          </p>
          <RoleBadge role={member.role} />
          <StatusBadge status={member.status} />
        </div>
        <p className="mt-0.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {member.email}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          <Clock size={9} strokeWidth={1.8} />
          {invited ? 'Invitation pending' : `Last seen ${formatDate(member.lastLoginAt, member.status)}`}
        </p>
      </div>

      {/* Actions */}
      {isSuperAdmin && !isSelf && (
        <div className="relative shrink-0" ref={menuRef}>
          {actionLoading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.30)' }} />
          ) : (
            <button
              type="button"
              onClick={() => { setMenuOpen((o) => !o); setRoleMenuOpen(false); }}
              className="flex items-center justify-center w-7 h-7 transition-colors duration-150"
              style={{ color: menuOpen ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)' }}
            >
              <MoreHorizontal size={15} strokeWidth={1.8} />
            </button>
          )}

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-[calc(100%+6px)] w-52 py-1 z-20"
                style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              >
                {/* Edit Role — opens sub-menu */}
                <div className="relative">
                  <ActionItem
                    icon={<UserCog size={13} strokeWidth={1.8} />}
                    label="Edit Role"
                    suffix={<ChevronDown size={10} strokeWidth={2} style={{ transform: roleMenuOpen ? 'rotate(180deg)' : '' }} />}
                    onClick={() => setRoleMenuOpen((o) => !o)}
                  />
                  <AnimatePresence>
                    {roleMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{    opacity: 0, height: 0     }}
                        transition={{ duration: 0.12 }}
                        className="overflow-hidden"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        {(['superadmin', 'admin', 'viewer'] as MemberRole[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => { onRoleChange(r); setMenuOpen(false); setRoleMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-6 py-2 text-left transition-colors duration-100"
                            style={{
                              background: member.role === r ? 'rgba(180,130,60,0.08)' : 'transparent',
                              color: member.role === r ? GOLD : 'rgba(255,255,255,0.48)',
                            }}
                          >
                            {member.role === r && <Check size={10} strokeWidth={2.5} />}
                            <span className="text-[0.50rem] tracking-[0.08em] font-medium">
                              {r === 'superadmin' ? 'Super Admin' : r === 'viewer' ? 'Viewer' : 'Admin'}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <ActionItem
                  icon={<KeyRound size={13} strokeWidth={1.8} />}
                  label="Reset Password"
                  onClick={() => { onResetPassword(); setMenuOpen(false); }}
                />

                <div className="my-1 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

                <ActionItem
                  icon={suspended
                    ? <ShieldCheck size={13} strokeWidth={1.8} />
                    : <ShieldOff   size={13} strokeWidth={1.8} />
                  }
                  label={suspended ? 'Restore Account' : 'Suspend Account'}
                  onClick={() => { onToggleSuspend(); setMenuOpen(false); }}
                  danger={!suspended}
                />

                {!invited && (
                  <ActionItem
                    icon={<Trash2 size={13} strokeWidth={1.8} />}
                    label="Remove from Team"
                    onClick={() => { onRemove(); setMenuOpen(false); }}
                    danger
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Role Permissions Matrix ────────────────────────────────────────────────────

function RolePermissionsMatrix() {
  return (
    <SectionCard title="Role Permissions" subtitle="What each role can access across the admin panel">
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="pb-3 text-[0.46rem] tracking-widest uppercase font-semibold pr-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Feature
              </th>
              {[
                { label: 'Super Admin', color: GOLD },
                { label: 'Admin',       color: 'rgba(147,197,253,0.85)' },
                { label: 'Viewer',      color: 'rgba(255,255,255,0.38)' },
              ].map((col) => (
                <th key={col.label} className="pb-3 text-center text-[0.46rem] tracking-widest uppercase font-semibold w-24" style={{ color: col.color }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((row, i) => (
              <tr
                key={row.feature}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                }}
              >
                <td className="py-2.5 pr-6 text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.58)' }}>
                  {row.feature}
                </td>
                {[row.superAdmin, row.admin, row.viewer].map((has, ci) => (
                  <td key={ci} className="py-2.5 text-center text-[0.58rem]">
                    {has
                      ? <span style={{ color: 'rgba(74,222,128,0.85)' }}>✓</span>
                      : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ── Activity Log Section ───────────────────────────────────────────────────────

function ActivityLogSection({
  logs,
  loading,
  total,
  page,
  pages,
  adminList,
  actionList,
  filter,
  onFilterChange,
  onLoadMore,
  onExport,
}: {
  logs: ActivityEntry[];
  loading: boolean;
  total: number;
  page: number;
  pages: number;
  adminList: { _id: string; name: string }[];
  actionList: string[];
  filter: { adminId: string; actionType: string; dateFrom: string; dateTo: string };
  onFilterChange: (f: Partial<typeof filter>) => void;
  onLoadMore: () => void;
  onExport: () => void;
}) {
  return (
    <SectionCard
      title="Admin Activity Log"
      subtitle="Full audit trail of actions taken across the admin panel"
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Admin filter */}
        <select
          value={filter.adminId}
          onChange={(e) => onFilterChange({ adminId: e.target.value })}
          className="h-8 px-3 text-[0.50rem] tracking-[0.06em] outline-none appearance-none"
          style={{
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.55)',
            colorScheme: 'dark',
          }}
        >
          <option value="">All Admins</option>
          {adminList.map((a) => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>

        {/* Action type filter */}
        <select
          value={filter.actionType}
          onChange={(e) => onFilterChange({ actionType: e.target.value })}
          className="h-8 px-3 text-[0.50rem] tracking-[0.06em] outline-none appearance-none"
          style={{
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.55)',
            colorScheme: 'dark',
          }}
        >
          <option value="">All Actions</option>
          {actionList.map((a) => (
            <option key={a} value={a}>{actionLabel(a)}</option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filter.dateFrom}
          onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
          className="h-8 px-3 text-[0.50rem] tracking-[0.06em] outline-none"
          style={{
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.55)',
            colorScheme: 'dark',
          }}
        />
        <span className="text-[0.44rem]" style={{ color: 'rgba(255,255,255,0.20)' }}>–</span>
        <input
          type="date"
          value={filter.dateTo}
          onChange={(e) => onFilterChange({ dateTo: e.target.value })}
          className="h-8 px-3 text-[0.50rem] tracking-[0.06em] outline-none"
          style={{
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.55)',
            colorScheme: 'dark',
          }}
        />

        <div className="flex-1" />

        {/* Export */}
        <ExportButton onClick={onExport} />
      </div>

      <Divider />

      {/* Log entries */}
      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 size={16} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center py-8 text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          No activity found for the selected filters.
        </p>
      ) : (
        <div className="space-y-0">
          {logs.map((log, i) => (
            <div
              key={log._id}
              className="flex items-start gap-3 py-3"
              style={{
                borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {/* Role initials badge */}
              <span
                className="shrink-0 flex items-center justify-center w-6 h-6 text-[0.38rem] font-bold mt-0.5"
                style={{
                  background: log.adminRole === 'superadmin' ? 'rgba(180,130,60,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${log.adminRole === 'superadmin' ? 'rgba(180,130,60,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  color: log.adminRole === 'superadmin' ? GOLD : 'rgba(255,255,255,0.40)',
                }}
              >
                {log.adminRole === 'superadmin' ? 'SA' : 'A'}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[0.52rem] tracking-[0.06em] leading-snug" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  <span className="font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>{log.adminName}</span>
                  {' · '}
                  {log.detail}
                </p>
                <p className="mt-0.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {formatDateTime(log.createdAt)}
                </p>
              </div>

              {/* Action type badge */}
              <span
                className="shrink-0 px-2 py-0.5 text-[0.40rem] tracking-widest uppercase font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.28)',
                }}
              >
                {actionLabel(log.action)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {page < pages && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-9 text-[0.50rem] tracking-widest uppercase font-semibold transition-colors duration-150"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            color: loading ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.35)',
          }}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : null}
          {loading ? 'Loading…' : `Load More · ${total - logs.length} remaining`}
        </button>
      )}
    </SectionCard>
  );
}

// ── Invite Admin Modal ─────────────────────────────────────────────────────────

function InviteModal({
  open,
  form,
  loading,
  error,
  success,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: InviteForm;
  loading: boolean;
  error: string;
  success: string;
  onClose: () => void;
  onChange: (patch: Partial<InviteForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.72)' }}
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 className="text-[0.66rem] tracking-[0.14em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  Invite Team Member
                </h2>
                <p className="mt-0.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  They'll receive an email with a setup link · expires in 48h
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 transition-colors duration-150"
                style={{ color: 'rgba(255,255,255,0.28)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.60)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={onSubmit}>
              <div className="p-5 space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel required>First Name</FieldLabel>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => onChange({ firstName: e.target.value })}
                      placeholder="John"
                      className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                      style={inputBase}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>
                  <div>
                    <FieldLabel required>Last Name</FieldLabel>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => onChange({ lastName: e.target.value })}
                      placeholder="Smith"
                      className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                      style={inputBase}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel required>Email Address</FieldLabel>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    placeholder="john@example.com"
                    className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                    style={inputBase}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                </div>

                <div>
                  <FieldLabel required>Role</FieldLabel>
                  <select
                    value={form.role}
                    onChange={(e) => onChange({ role: e.target.value as MemberRole })}
                    className="h-9 px-3 text-[0.56rem] tracking-[0.06em] outline-none appearance-none w-full"
                    style={{ ...inputBase, colorScheme: 'dark', cursor: 'pointer' }}
                  >
                    <option value="superadmin">Super Admin — Full access</option>
                    <option value="admin">Admin — Standard access</option>
                    <option value="viewer">Viewer — Read-only access</option>
                  </select>
                  <HelperText>
                    {form.role === 'superadmin'
                      ? 'Full access including team management and settings'
                      : form.role === 'admin'
                        ? 'Can manage orders, products, customers and more'
                        : 'Can view all data but cannot make changes'}
                  </HelperText>
                </div>

                <div>
                  <FieldLabel>Personal Message</FieldLabel>
                  <textarea
                    value={form.message}
                    onChange={(e) => onChange({ message: e.target.value })}
                    placeholder="Optional welcome message included in the invite email..."
                    rows={2}
                    className="px-3 py-2.5 text-[0.56rem] tracking-[0.06em] resize-none rounded-none leading-relaxed"
                    style={inputBase}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                </div>

                {error && (
                  <p className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(239,68,68,0.80)' }}>
                    {error}
                  </p>
                )}
                {success && (
                  <p className="flex items-center gap-1.5 text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(74,222,128,0.80)' }}>
                    <Check size={11} strokeWidth={2.5} />
                    {success}
                  </p>
                )}
              </div>

              {/* Modal footer */}
              <div
                className="flex items-center justify-end gap-2 px-5 py-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <CancelButton onClick={onClose} />
                <SendInviteButton loading={loading} />
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Confirm Remove Modal ───────────────────────────────────────────────────────

function ConfirmRemoveModal({
  member,
  loading,
  onConfirm,
  onCancel,
}: {
  member: TeamMember;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <motion.div
        key="rm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{    opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.72)' }}
        onClick={onCancel}
      />
      <motion.div
        key="rm-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1    }}
        exit={{    opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm p-6"
        style={{ background: '#141414', border: '1px solid rgba(239,68,68,0.20)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-9 h-9 shrink-0"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
          >
            <AlertTriangle size={16} strokeWidth={1.8} style={{ color: 'rgba(239,68,68,0.80)' }} />
          </div>
          <div>
            <p className="text-[0.60rem] tracking-[0.08em] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Remove Team Member
            </p>
            <p className="mt-0.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              This action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-[0.52rem] tracking-[0.06em] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ color: 'rgba(255,255,255,0.75)' }}>{member.firstName} {member.lastName}</span> ({member.email}) will be permanently removed from the admin team and lose all access immediately.
        </p>

        <div className="flex items-center justify-end gap-2">
          <CancelButton onClick={onCancel} />
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 h-8 px-4 text-[0.52rem] tracking-[0.12em] uppercase font-semibold transition-all duration-150"
            style={{
              background: 'rgba(239,68,68,0.85)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} strokeWidth={2} />}
            Remove
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Shared small components ────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
  const map: Record<MemberRole, { label: string; bg: string; color: string; border: string }> = {
    superadmin: { label: 'Super Admin', bg: 'rgba(180,130,60,0.12)', color: GOLD,                           border: 'rgba(180,130,60,0.25)' },
    admin:      { label: 'Admin',       bg: 'rgba(147,197,253,0.08)', color: 'rgba(147,197,253,0.85)',      border: 'rgba(147,197,253,0.20)' },
    viewer:     { label: 'Viewer',      bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.38)',      border: 'rgba(255,255,255,0.10)' },
  };
  const s = map[role];
  return (
    <span
      className="px-1.5 py-0.5 text-[0.40rem] tracking-[0.12em] uppercase font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; color: string }> = {
    active:    { label: 'Active',    color: 'rgba(74,222,128,0.75)'  },
    invited:   { label: 'Invited',   color: 'rgba(251,191,36,0.75)'  },
    suspended: { label: 'Suspended', color: 'rgba(239,68,68,0.75)'   },
  };
  const s = map[status];
  return (
    <span className="flex items-center gap-1 text-[0.40rem] tracking-widest uppercase font-medium" style={{ color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function ActionItem({
  icon,
  label,
  suffix,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  suffix?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base  = danger ? 'rgba(239,68,68,0.65)' : 'rgba(255,255,255,0.52)';
  const hover = danger ? 'rgba(239,68,68,0.90)' : 'rgba(255,255,255,0.82)';

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
      style={{
        color:      hovered ? hover : base,
        background: hovered ? (danger ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)') : 'transparent',
      }}
    >
      {icon}
      <span className="flex-1 text-[0.52rem] tracking-[0.08em]">{label}</span>
      {suffix}
    </button>
  );
}

function InviteButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 h-8 px-4 text-[0.52rem] tracking-[0.14em] uppercase font-semibold transition-all duration-150 shrink-0"
      style={{
        background: hovered ? 'oklch(0.48 0.09 70)' : GOLD,
        color: 'oklch(0.10 0 0)',
        border: '1px solid transparent',
      }}
    >
      <Plus size={11} strokeWidth={2.5} />
      Invite Admin
    </button>
  );
}

function SendInviteButton({ loading }: { loading: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 h-8 px-4 text-[0.52rem] tracking-[0.14em] uppercase font-semibold transition-all duration-150"
      style={{
        background: loading ? 'rgba(180,130,60,0.55)' : hovered ? 'oklch(0.48 0.09 70)' : GOLD,
        color: 'oklch(0.10 0 0)',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} strokeWidth={2} />}
      {loading ? 'Sending…' : 'Send Invitation'}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center h-8 px-4 text-[0.52rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'rgba(255,255,255,0.45)',
      }}
    >
      Cancel
    </button>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1.5 h-8 px-3 text-[0.48rem] tracking-widest uppercase font-semibold transition-colors duration-150"
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.35)',
      }}
    >
      <Download size={11} strokeWidth={2} />
      Export CSV
    </button>
  );
}
