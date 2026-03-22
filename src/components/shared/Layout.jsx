import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut, ChevronRight } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const Layout = ({
  user = null,
  role = '',
  navItems = [],
  activePage = '',
  onNavigate,
  onSignOut,
  children
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-[#f8f9fb] dark:bg-[#0a0a0f] transition-colors duration-500">
      {/* Sidebar — Linear-inspired: dimmer, recedes behind content */}
      <aside className="w-[220px] bg-[#f1f2f4] dark:bg-[#111118] border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col select-none transition-colors duration-500">

        {/* Brand */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {/* Logo mark — SVG alpha with gradient */}
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] dark:from-[#6366f1] dark:via-[#8b5cf6] dark:to-[#a78bfa]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-sm tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>A</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[#1a1a2e] dark:text-white/90 tracking-[-0.01em] leading-tight">My Money</div>
              <div className="text-[10px] text-black/40 dark:text-white/30 font-medium mt-0.5 truncate">Alpha School{role ? ` \u00B7 ${role}` : ''}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-[2px] overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full text-left px-2.5 py-[7px] rounded-lg transition-all duration-150 text-[13px] relative group
                  ${isActive
                    ? 'bg-black/[0.07] dark:bg-white/[0.08] text-[#1a1a2e] dark:text-white font-semibold'
                    : 'text-black/50 dark:text-white/40 hover:text-black/80 dark:hover:text-white/70 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] font-medium'
                  }
                `}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] w-5 text-center leading-none opacity-80">{item.icon}</span>
                  <span className="leading-none">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#1a1a2e] dark:bg-[#8b5cf6]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 pb-4 pt-2 space-y-[2px] border-t border-black/[0.04] dark:border-white/[0.04] mt-auto">
          {/* Theme toggle — pill style */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium text-black/40 dark:text-white/35 hover:text-black/70 dark:hover:text-white/60 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all duration-150"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDark ? 'sun' : 'moon'}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-5 flex justify-center"
              >
                {isDark ? <Sun className="w-[14px] h-[14px]" /> : <Moon className="w-[14px] h-[14px]" />}
              </motion.div>
            </AnimatePresence>
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium text-black/40 dark:text-white/35 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/[0.05] dark:hover:bg-red-500/[0.08] transition-all duration-150"
          >
            <div className="w-5 flex justify-center">
              <LogOut className="w-[14px] h-[14px]" />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar — minimal, blurred */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#f8f9fb]/80 dark:bg-[#0a0a0f]/80 border-b border-black/[0.06] dark:border-white/[0.06] px-8 h-12 flex items-center justify-between transition-colors duration-500">
          <div className="flex items-center gap-2">
            <h1 className="text-[13px] font-semibold text-black/80 dark:text-white/80 tracking-[-0.01em]">
              {navItems.find((item) => item.id === activePage)?.label || 'My Money'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {role === 'guide' && (
              <div className="px-2 py-0.5 rounded-md bg-violet-500/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400 text-[10px] font-semibold uppercase tracking-wider">
                Guide
              </div>
            )}
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{user.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[12px] font-medium text-black/70 dark:text-white/70 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-black/35 dark:text-white/30 leading-tight">{user.email}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className=""
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
