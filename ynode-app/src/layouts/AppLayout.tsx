import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Workflow,
  ListMusic,
  LogOut,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export function AppLayout() {
  const { logout } = useAuthStore();
  const location = useLocation();

  const isInEditor =
    location.pathname.startsWith('/editor') ||
    location.pathname === '/new-workflow';

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/workflows', icon: Workflow, label: 'Workflows' },
    { to: '/executions', icon: ListMusic, label: 'Executions' },
    { to: '/settings/credentials', icon: Key, label: 'Credentials' },
  ];

  return (
    <div className="h-screen bg-black text-foreground flex overflow-hidden selection:bg-primary/20 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      {!isInEditor && (
        <aside className="hidden lg:flex w-64 flex-col border-r border-white/[0.08] bg-black/60 backdrop-blur-xl h-full flex-shrink-0 z-40">
          <div className="p-6 pb-4 border-b border-white/[0.06]">
            <NavLink to="/" className="flex items-center gap-3 group">
              <img src="/ynode_white.svg" alt="yNode" className="h-8 w-auto" />
            </NavLink>
          </div>

          <nav className="px-3 py-4 space-y-1 flex-1">
            <div className="px-2 mb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
              Navigation
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group relative',
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isActive
                            ? 'text-primary'
                            : 'text-zinc-500 group-hover:text-zinc-400'
                        )}
                      />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_theme(colors.primary.DEFAULT)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-white/[0.08] bg-black/20 flex-shrink-0">
            <button
              onClick={logout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all group text-sm font-medium"
            >
              <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {!isInEditor && (
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-xl border-b border-white/[0.08] z-40 flex items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <img src="/ynode_white.svg" alt="yNode" className="h-8 w-auto" />
          </div>
        </div>
      )}

      <main
        className={cn(
          'flex-1 relative z-10',
          isInEditor
            ? 'overflow-hidden'
            : 'overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0'
        )}
      >
        {isInEditor ? (
          <Outlet />
        ) : (
          <div className="min-h-full p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        )}
      </main>

      {!isInEditor && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/[0.08] z-40 flex items-center justify-around px-2 safe-area-inset-bottom">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-colors min-w-[60px]',
                  isActive
                    ? 'text-primary'
                    : 'text-zinc-500 active:text-zinc-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive &&
                        'drop-shadow-[0_0_8px_theme(colors.primary.DEFAULT)]'
                    )}
                  />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-zinc-500 active:text-red-400 transition-colors min-w-[60px]"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </nav>
      )}
    </div>
  );
}
