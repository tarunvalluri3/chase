import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Globe,
  Download,
  LogOut,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useDashboardTasks } from '../hooks/useDashboardTasks';
import { computeCompletedCount, computeOnTimeRate } from '../lib/taskStats';
import { LedgerStrip, StatTile } from '../components/dashboard/StatTile';
import { NotificationsSettingsRow } from '../components/notifications/NotificationsSettingsRow';

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
    <div>
      {/* ---- header ---- */}
      <div>
        <div aria-hidden="true">{initials}</div>
        <div>
          <p>{name}</p>
          <p>{email}</p>
        </div>
        <button type="button" onClick={() => openUserProfile()}>
          Edit profile
        </button>
      </div>

      {/* ---- ledger strip ---- */}
      <LedgerStrip>
        <StatTile label="Completed" count={completedCount} color="var(--color-completed)" />
        <StatTile
          label="On-time rate"
          count={onTimeRate === null ? '—' : `${onTimeRate}%`}
          color="var(--color-brand)"
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
        <NotificationsSettingsRow />
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
    <div>
      <h2>{title}</h2>
      <ul>
        {Array.isArray(children)
          ? children.map((child, index) => <li key={index}>{child}</li>)
          : children}
      </ul>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, value, onClick, disabled = false, danger = false }) {
  const content = (
    <span>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      {value && <span>{value}</span>}
      {onClick && !disabled && <ChevronRight aria-hidden="true" />}
    </span>
  );

  if (!onClick || disabled) {
    return <span aria-disabled={disabled || undefined}>{content}</span>;
  }

  return (
    <button type="button" onClick={onClick}>
      {content}
    </button>
  );
}
