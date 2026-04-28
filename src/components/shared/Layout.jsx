import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const Layout = ({
  user = null,
  role = '',
  navItems = [],
  activePage = '',
  onNavigate,
  onSignOut,
  children,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const isStudent = role === 'student';
  const firstName = user?.name?.split(' ')[0] || '';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (e) => {
      setIsMobile(!e.matches);
      if (e.matches) setSidebarOpen(false);
    };
    setIsMobile(!mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const handleNavClick = (itemId) => {
    onNavigate(itemId);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#faf8f4] dark:bg-[#1e2a1e] transition-colors duration-300">

      {/* ── Mobile Sidebar Backdrop ── */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}

      {/* ── Sidebar: Composition Notebook Cover ── */}
      <aside
        className={`
          flex flex-col select-none overflow-hidden
          bg-[#243024] border-r border-[#1a241a]
          md:w-[240px] md:relative md:translate-x-0 md:z-auto
          ${isMobile
            ? 'fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300'
            : ''
          }
          ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}
        `}
      >
        {/* Composition notebook tape strip */}
        <div className="h-1.5 bg-pencil/80" />

        {/* Brand — clickable to go home */}
        <div className="px-5 pt-5 pb-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-md bg-pencil flex items-center justify-center">
              <span className="text-[#243024] font-black text-sm">$</span>
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[17px] font-hand font-bold text-white tracking-tight leading-tight">My Money</div>
              <div className="text-[11px] text-white/30 font-medium mt-0.5 truncate">Alpha School</div>
            </div>
          </button>
        </div>

        {/* Student avatar + name */}
        {isStudent && (
          <div className="mx-4 mb-3 p-4 rounded-lg bg-white/[0.05] border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pencil/15 border-2 border-pencil/30 flex items-center justify-center flex-shrink-0">
                <span className="text-pencil font-hand font-bold text-[16px]">
                  {firstName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-hand font-semibold text-white">{firstName}</div>
                <div className="text-[11px] text-white/35">Student</div>
              </div>
            </div>
          </div>
        )}

        {/* Guide badge */}
        {role === 'guide' && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-white/[0.05] border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-pencil/20 border-2 border-pencil/40 flex items-center justify-center">
                <span className="text-pencil font-hand font-bold text-[15px]">
                  {firstName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-hand font-semibold text-white">{user?.name}</div>
                <div className="text-[11px] font-bold text-pencil/70 uppercase tracking-wider">Guide</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 text-[13px] relative focus:ring-2 focus:ring-pencil/30 focus:outline-none
                  ${isActive
                    ? 'bg-pencil/15 text-pencil font-semibold'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] font-medium'
                  }
                `}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 flex justify-center">
                    {typeof item.icon === 'string'
                      ? <span className="text-[16px] leading-none">{item.icon}</span>
                      : <item.icon className="w-[18px] h-[18px]" />
                    }
                  </div>
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-pencil"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 pb-4 pt-3 space-y-0.5 border-t border-white/[0.06] mt-auto">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/30 hover:text-pencil/80 hover:bg-white/[0.04] transition-all duration-150"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDark ? 'sun' : 'moon'}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 6, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="w-5 flex justify-center"
              >
                {isDark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
              </motion.div>
            </AnimatePresence>
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150"
          >
            <div className="w-5 flex justify-center">
              <LogOut className="w-[15px] h-[15px]" />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar — subtle notebook feel */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#faf8f4]/80 dark:bg-[#1e2a1e]/80 border-b border-black/[0.06] dark:border-white/[0.06] px-8 h-[52px] flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-800 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 focus:ring-2 focus:ring-pencil/30 focus:outline-none"
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-[16px] font-hand font-bold text-ink dark:text-chalk-white">
              {navItems.find((item) => item.id === activePage)?.label || 'My Money'}
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[12px] font-medium text-ink-muted dark:text-white/50 leading-tight">{user.email}</div>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
