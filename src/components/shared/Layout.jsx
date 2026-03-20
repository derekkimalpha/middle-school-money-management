import React from 'react';
import { motion } from 'framer-motion';

export const Layout = ({
  user = null,
  role = '',
  navItems = [],
  activePage = '',
  onNavigate,
  onSignOut,
  children
}) => {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-48 bg-white border-r border-slate-200 flex flex-col sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sage-400 to-green-500 flex items-center justify-center text-white font-bold">
              $
            </div>
            <div>
              <div className="font-bold text-slate-900">my money</div>
              {role && <div className="text-xs text-slate-500 uppercase tracking-wider">{role}</div>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-all font-medium text-sm
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-sage-400 to-green-400 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </motion.button>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-slate-200">
          <motion.button
            onClick={onSignOut}
            className="w-full px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-700 hover:border-rose-400 hover:text-rose-700 transition-all text-sm font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign Out
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-slate-200 px-8 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {navItems.find((item) => item.id === activePage)?.label || 'My Money'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {role === 'guide' && (
                <motion.div
                  className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  Guide Mode
                </motion.div>
              )}
              {user && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
