import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut } from 'lucide-react';
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
    <div className="flex h-screen bg-gray-50 dark:bg-[#0c0a1a] transition-colors duration-300">
      {/* Sidebar — Game menu style */}
      <aside className="w-[240px] relative flex flex-col select-none overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600 via-purple-700 to-indigo-900 dark:from-[#1e1147] dark:via-[#150d3a] dark:to-[#0c0a1a]" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
        {/* Glow effect at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-violet-400/20 dark:bg-violet-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Brand */}
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-purple-900/30">
                <span className="text-xl">💰</span>
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-extrabold text-white tracking-tight leading-tight">My Money</div>
                <div className="text-[11px] text-white/50 font-medium mt-0.5 truncate">Alpha School{role ? ` · ${role}` : ''}</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 text-[14px] relative group
                    ${isActive
                      ? 'bg-white/20 text-white font-bold shadow-lg shadow-purple-900/20 backdrop-blur-sm'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/10 font-medium'
                    }
                  `}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[18px] w-6 text-center leading-none">{item.icon}</span>
                    <span className="leading-none">{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-400/20 to-purple-400/10 -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Bottom controls */}
          <div className="px-3 pb-4 pt-3 space-y-1 border-t border-white/10 mt-auto">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-white/40 hover:text-white/70 hover:bg-white/10 transition-all duration-200"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-6 flex justify-center"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.div>
              </AnimatePresence>
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            >
              <div className="w-6 flex justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-gray-50/80 dark:bg-[#0c0a1a]/80 border-b border-gray-200 dark:border-white/[0.06] px-8 h-14 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-bold text-gray-900 dark:text-white">
              {navItems.find((item) => item.id === activePage)?.label || 'My Money'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {role === 'guide' && (
              <div className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[11px] font-bold uppercase tracking-wider">
                Guide
              </div>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/20">
                  <span className="text-white text-[11px] font-bold">{user.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">{user.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-white/40 leading-tight">{user.email}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
