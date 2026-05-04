import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// NavItem for sidebar
const NavItem = ({ item, isActive, onNavigate }) => (
  <button
    onClick={() => onNavigate(item.id)}
    className={`
      w-full text-left px-3 py-2.5 rounded-2xl text-[14px] font-bold transition-all
      ${isActive
        ? 'bg-white text-alpha-navy-900 shadow-soft'
        : 'text-white/70 hover:text-white hover:bg-white/5'
      }
    `}
  >
    <div className="flex items-center gap-2.5">
      <div className={`w-5 flex justify-center ${isActive ? 'text-alpha-blue-500' : ''}`}>
        {typeof item.icon === 'string'
          ? <span className="text-[16px] leading-none">{item.icon}</span>
          : <item.icon className="w-[18px] h-[18px]" strokeWidth={2.4} />
        }
      </div>
      <span>{item.label}</span>
    </div>
  </button>
);

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
    <div className="flex h-screen bg-alpha-blue-50 dark:bg-[#0c100c] transition-colors duration-300">

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

      {/* ── Sidebar: Finbit-style dark navy with rounded corners ── */}
      <aside
        className={`
          flex flex-col select-none overflow-hidden
          bg-alpha-navy-900 rounded-r-3xl
          md:w-[240px] md:relative md:translate-x-0 md:z-auto
          ${isMobile
            ? 'fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300'
            : ''
          }
          ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}
        `}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-lg bg-alpha-blue-500 shadow-soft-sm flex items-center justify-center">
              <span className="text-white font-black text-base">$</span>
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[16px] font-black text-white tracking-tight leading-tight">My Money</div>
              <div className="text-[10px] text-white/60 font-semibold mt-0.5 truncate">Alpha School</div>
            </div>
          </button>
        </div>

        {/* Profile Pill */}
        <div className="mx-3 mt-4 mb-5 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-alpha-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-[13px]">
                {firstName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white truncate">{firstName || user?.name}</div>
            </div>
            <div className="w-5 flex justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation with Section Dividers */}
        <nav className="flex-1 px-3 pt-1 space-y-1 overflow-y-auto">
          {/* MAIN Section */}
          <div className="px-3 py-2 pt-3">
            <p className="text-white/40 text-[10px] tracking-widest uppercase font-black mb-2">Main</p>
          </div>
          {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => {
            const isActive = activePage === item.id;
            return (
              <NavItem key={item.id} item={item} isActive={isActive} onNavigate={handleNavClick} />
            );
          })}

          {/* SETTINGS Section */}
          {navItems.length > 1 && (
            <>
              <div className="px-3 py-2 pt-3 mt-2">
                <p className="text-white/40 text-[10px] tracking-widest uppercase font-black">Settings</p>
              </div>
              {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => {
                const isActive = activePage === item.id;
                return (
                  <NavItem key={item.id} item={item} isActive={isActive} onNavigate={handleNavClick} />
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 pb-4 pt-3 space-y-1.5 border-t border-white/10 mt-auto">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
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
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold text-white/70 hover:text-red-300 hover:bg-red-500/10 transition-all"
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
