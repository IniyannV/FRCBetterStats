import { BarChart3, Menu, X } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Events', to: '/events' },
  { label: 'Teams', to: '/teams' },
];

export default function Layout({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
          <Link to="/" className="flex min-w-fit items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span>FRCBetterStats</span>
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <GlobalSearch />
          </div>

          <div className="ml-auto hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <ThemeToggle />
          </div>

          <button className="btn ml-auto h-10 w-10 px-0 md:hidden" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </nav>

        {open ? (
          <div className="border-t border-slate-200 p-4 dark:border-slate-800 md:hidden">
            <GlobalSearch />
            <div className="mt-3 flex items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {item.label}
                </NavLink>
              ))}
              <ThemeToggle />
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-24 lg:px-6">{children}</main>
    </div>
  );
}
