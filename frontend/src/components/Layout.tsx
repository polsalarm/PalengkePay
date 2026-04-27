import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, QrCode, ScanLine, List, User, UserPlus, Users, HandCoins, Store } from 'lucide-react';
import { WalletButton } from './WalletButton';

const vendorNav = [
  { to: '/vendor/home', icon: Home, label: 'Home' },
  { to: '/vendor/qr', icon: QrCode, label: 'My QR' },
  { to: '/vendor/transactions', icon: List, label: 'History' },
  { to: '/vendor/utang', icon: HandCoins, label: 'Utang' },
  { to: '/vendor/profile', icon: User, label: 'Profile' },
];

const customerNav = [
  { to: '/customer/home', icon: Home, label: 'Home' },
  { to: '/customer/scan', icon: ScanLine, label: 'Pay' },
  { to: '/customer/history', icon: List, label: 'History' },
  { to: '/customer/utang', icon: HandCoins, label: 'Utang' },
  { to: '/market', icon: Store, label: 'Market' },
];

const adminNav = [
  { to: '/admin/market', icon: Users, label: 'Dashboard' },
  { to: '/admin/register', icon: UserPlus, label: 'Register' },
];

function useNavItems() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/vendor')) return vendorNav;
  if (pathname.startsWith('/customer') || pathname === '/market') return customerNav;
  if (pathname.startsWith('/admin')) return adminNav;
  return null;
}

export function Layout() {
  const navItems = useNavItems();
  const { pathname } = useLocation();
  const isFullscreen = pathname === '/vendor/qr' || pathname === '/onboard';

  if (isFullscreen) {
    return <Outlet />;
  }

  return (
    /* App shell: locked to viewport height, internal scroll only */
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-200 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">₱</span>
          </div>
          <span className="font-semibold text-slate-900">PalengkePay</span>
        </div>

        {navItems && (
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="p-4 border-t border-slate-200 shrink-0">
          <WalletButton />
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden shrink-0 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-6 h-6 rounded-md bg-teal-700 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">₱</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">PalengkePay</span>
          </div>
          <div className="shrink-0 ml-3">
            <WalletButton />
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex shrink-0 bg-white border-b border-slate-200 h-14 items-center justify-end px-6 z-20">
          <WalletButton />
        </header>

        {/* Scrollable content — this is the ONLY scroll container */}
        <main className="flex-1 overflow-y-auto">
          <div className={`max-w-3xl mx-auto w-full px-4 lg:px-8 pt-6 ${navItems ? 'pb-24' : 'pb-6'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      {navItems && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200">
          <div className="flex h-16 items-center">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-w-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium leading-tight">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
