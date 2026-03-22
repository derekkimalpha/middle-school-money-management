import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-52 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col sticky top-0 transition-colors duration-300">
        {/* Logo */}
        <div className="p-5 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              $
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">my money</div>
              {role && (
                <div className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-widest font-semibold">{role}</div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full text-left px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm
                  ${isActive
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom: Theme Toggle + Sign Out */}
        <div className="p-3 border-t border-slate-200 dark:border-gray-800 space-y-2">
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </motion.button>

          {/* Sign Out */}
          <motion.button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-gray-800 px-8 py-3.5 z-10 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {navItems.find((item) => item.id === activePage)?.label || 'My Money'}
            </h1>
            <div className="flex items-center gap-3">
              {role === 'guide' && (
                <div className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide">
                  Guide
                </div>
              )}
              {user && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-gray-500">{user.email}</div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
