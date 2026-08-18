import { Home, ListChecks, BarChart3, User } from 'lucide-react';

// DESIGN.md §6.1/§6.3 — the four nav destinations, shared by BottomNav
// (mobile pill track) and Sidebar (desktop, >=960px). Kept in its own
// module (not exported from BottomNav.jsx) so both stay plain component
// files for Fast Refresh.
export const NAV_TABS = [
  { key: 'home', label: 'Home', to: '/', icon: Home, isActive: (path) => path === '/' },
  {
    key: 'tasks',
    label: 'Tasks',
    to: '/tasks/active',
    icon: ListChecks,
    isActive: (path) => path.startsWith('/tasks'),
  },
  {
    key: 'insights',
    label: 'Insights',
    to: '/insights',
    icon: BarChart3,
    isActive: (path) => path.startsWith('/insights'),
  },
  { key: 'profile', label: 'Profile', to: '/profile', icon: User, isActive: (path) => path.startsWith('/profile') },
];
