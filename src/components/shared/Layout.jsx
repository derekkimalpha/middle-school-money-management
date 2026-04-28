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
    <div className="flex h-screen bg-cream dark:bg-[#0c100c] transition-colors duration-300">

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

      {/* ── Sidebar: Gumroad-style chunky panel ── */}
      <aside
        className={`
          flex flex-col select-none overflow-hidden
          bg-white border-r-[3px] border-black
          md:w-[240px] md:relative md:translate-x-0 md:z-auto
          ${isMobile
            ? 'fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300'
            : ''
          }
          ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}
        `}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b-[3px] border-black">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-cobalt-400 border-[3px] border-black shadow-gum-sm flex items-center justify-center">
              <span className="text-white font-black text-base">$</span>
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[18px] font-black text-black tracking-tight leading-tight">My Money</div>
              <div className="text-[11px] text-black/55 font-semibold mt-0.5 truncate">Alpha School</div>
            </div>
          </button>
        </div>

        {/* Avatar */}
        <div className="mx-4 mt-4 mb-3 p-3 rounded-xl bg-cobalt-50 border-[3px] border-black shadow-gum-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cobalt-400 border-[3px] border-black flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-[15px]">
                {firstName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-black truncate">{firstName || user?.name}</div>
              <div className="text-[11px] text-black/60 font-semibold uppercase tracking-wider">
                {isStudent ? 'Student' : 'Guide'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl text-[14px] font-bold transition-all
                  ${isActive
                    ? 'bg-cobalt-400 text-white border-[3px] border-black shadow-gum-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-gum-pressed'
                    : 'text-black/65 hover:text-black hover:bg-cobalt-50 border-[3px] border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 flex justify-center">
                    {typeof item.icon === 'string'
                      ? <span className="text-[16px] leading-none">{item.icon}</span>
                      : <item.icon className="w-[18px] h-[18px]" strokeWidth={2.4} />
                    }
                  </div>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 pb-4 pt-3 space-y-1 border-t-[3px] border-black mt-auto">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold text-black/55 hover:text-black hover:bg-cobalt-50 border-[2px] border-transparent hover:border-black/10 transition-all"
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
            <span>{isDark ? 'Light' : 'Dark'} Mode</span>
          </button>

          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold text-black/55 hover:text-red-600 hover:bg-red-50 border-[2px] border-transparent hover:border-red-200 transition-all"
          >
            <div className="w-5 flex justify-center">
              <LogOut className="w-[15px] h-[15px]" strokeWidth={2.4} />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-cream dark:bg-[#0c100c] border-b-[3px] border-black px-6 md:px-8 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-black hover:bg-black/5 transition-colors"
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
                <Menu className="w-5 h-5" strokeWidth={2.4} />
              </button>
            )}
            <h1 className="text-[18px] font-black text-black dark:text-white">
              {navItems.find((item) => item.id === activePage)?.label || 'My Money'}
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[12px] font-semibold text-black/60 dark:text-white/50 leading-tight">{user.email}</div>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-cream dark:bg-[#0c100c]">
          {children}
        </main>
      </div>
    </div>
  );
};
