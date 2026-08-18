import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Bell,
  Globe,
  Download,
  LogOut,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useDashboardTasks } from '../hooks/useDashboardTasks';
import { computeCompletedCount, computeOnTimeRate } from '../lib/taskStats';
import { LedgerStrip, StatTile } from '../components/dashboard/StatTile';

// DESIGN.md §8 — built out from a one-line placeholder: avatar header,
// ledger-strip stats, then ledger-row settings sections. Change password,
// Two-factor authentication, and Active sessions open Clerk's own
// <UserProfile /> surface (openUserProfile()) rather than being custom
// flows — per the implementation note, Clerk already provides all three
// against the existing account with zero new backend work. Export your
// history and Delete account have no backend to call yet, so they render
// as visibly disabled/"coming soon" rather than silently inert.
export default function Profile() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();
  const { tasks } = useDashboardTasks();

  const handleSignOut = () => signOut(() => navigate('/', { replace: true }));

  const name = user?.fullName || user?.firstName || 'Your account';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initials = getInitials(user);

  const completedCount = computeCompletedCount(tasks);
  const onTimeRate = computeOnTimeRate(tasks);

  return (
    <div className="flex flex-col gap-8 px-gutter pt-2 pb-10">
      {/* ---- header ---- */}
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-(--radius-pill) font-serif text-section text-canvas"
          style={{ background: 'var(--gradient-avatar)' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-task text-ink">{name}</p>
          <p className="truncate text-meta text-ink-3">{email}</p>
        </div>
      </div>

      {/* ---- ledger strip ---- */}
      <LedgerStrip>
        <StatTile label="Completed" count={completedCount} color="var(--color-completed)" />
        <StatTile
          label="On-time rate"
          count={onTimeRate === null ? '—' : `${onTimeRate}%`}
          color="var(--color-pine)"
        />
      </LedgerStrip>

      {/* ---- Account ---- */}
      <SettingsSection title="Account">
        <SettingsRow icon={UserIcon} label="Name & email" value={email} onClick={() => openUserProfile()} />
        <SettingsRow icon={KeyRound} label="Change password" onClick={() => openUserProfile()} />
        <SettingsRow icon={ShieldCheck} label="Two-factor authentication" onClick={() => openUserProfile()} />
        <SettingsRow icon={Smartphone} label="Active sessions" onClick={() => openUserProfile()} />
      </SettingsSection>

      {/* ---- Preferences ---- */}
      <SettingsSection title="Preferences">
        <SettingsRow icon={Bell} label="Notifications" value="On" />
        <SettingsRow icon={Globe} label="Time zone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
      </SettingsSection>

      {/* ---- Your data ---- */}
      <SettingsSection title="Your data">
        <SettingsRow icon={Download} label="Export your history" value="Coming soon" disabled />
      </SettingsSection>

      {/* ---- Session ---- */}
      <SettingsSection title="Session">
        <SettingsRow icon={LogOut} label="Sign out" onClick={handleSignOut} />
        <SettingsRow icon={Trash2} label="Delete account" value="Coming soon" disabled danger />
      </SettingsSection>
    </div>
  );
}

function getInitials(user) {
  const first = user?.firstName?.[0];
  const last = user?.lastName?.[0];
  if (first || last) return `${first ?? ''}${last ?? ''}`.toUpperCase();
  const email = user?.primaryEmailAddress?.emailAddress;
  return email ? email[0].toUpperCase() : '?';
}

// DESIGN.md §4.1/§7 — ledger rows: mono uppercase section label, then a
// hairline-divided list, no card chrome (this is summary/scan content,
// not individually elevated like a task card).
function SettingsSection({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="px-1 text-micro text-ink-3 uppercase">{title}</h2>
      <ul className="flex flex-col rounded-(--radius-lg) border border-(--border-hairline) bg-surface">
        {Array.isArray(children)
          ? children.map((child, index) => (
              <li key={index} className={index > 0 ? 'border-t border-(--color-rule)' : ''}>
                {child}
              </li>
            ))
          : children}
      </ul>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, value, onClick, disabled = false, danger = false }) {
  const color = danger ? 'var(--color-danger)' : 'var(--color-ink)';
  const content = (
    <span className="flex min-h-(--size-tap-min) w-full items-center gap-3 px-4 py-3 text-left">
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" style={{ color: danger ? 'var(--color-danger)' : 'var(--color-ink-3)' }} />
      <span className="flex-1 text-body" style={{ color }}>
        {label}
      </span>
      {value && (
        <span className="text-meta" style={{ color: disabled ? 'var(--color-ink-disabled)' : 'var(--color-ink-3)' }}>
          {value}
        </span>
      )}
      {onClick && !disabled && <ChevronRight size={16} strokeWidth={1.8} className="shrink-0" style={{ color: 'var(--color-ink-3)' }} aria-hidden="true" />}
    </span>
  );

  if (!onClick || disabled) {
    return (
      <span aria-disabled={disabled || undefined} className={disabled ? 'block opacity-60' : 'block'}>
        {content}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full transition-colors hover:bg-surface-sunken">
      {content}
    </button>
  );
}
