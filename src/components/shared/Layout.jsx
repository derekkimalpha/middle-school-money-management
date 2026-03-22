import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/* ── XP Progress Ring (SVG) ─────────────────────── */
const XPRing = ({ progress = 0, size = 64, stroke = 4, color = '#f59e0b' }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
      />
    </svg>
  );
};

export const Layout = ({
  user = null,
  role = '',
  navItems = [],
  activePage = '',
  onNavigate,
  onSignOut,
  children,
  level = null,
  xpProgress = 0,
  streak = 0,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const isStudent = role === 'student';
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] transition-colors duration-300">

      {/* ── Sidebar: Dark glass panel ─────────────── */}
      <aside className="w-[240px] flex flex-col bg-[#111113] border-r border-white/[0.06] select-none">

        {/* Brand */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-black text-sm">$</span>
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-white tracking-tight leading-tight">My Money</div>
              <div className="text-[11px] text-white/30 font-medium mt-0.5 truncate">Alpha School</div>
            </div>
          </div>
        </div>

        {/* Student Status: Avatar ring + Level + Streak */}
        {isStudent && (
          <div className="mx-4 mb-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar with XP ring */}
              <div className="relative flex-shrink-0">
                <XPRing progress={xpProgress} size={48} stroke={3} color="#f59e0b" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                    <span className="text-white font-bold text-[13px]">
                      {firstName?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white truncate">{firstName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {level && (
                    <span className="text-[11px] font-bold text-amber-400">{level.icon} {level.name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Streak badge */}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <span className="text-[13px]">🔥</span>
                <span className="text-[11px] font-bold text-orange-400">{streak}-day streak</span>
              </div>
            )}
          </div>
        )}

        {/* Guide badge */}
        {role === 'guide' && (
          <div className="mx-4 mb-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-white font-bold text-[13px]">
                  {firstName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Guide</div>
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
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 text-[13px] relative
                  ${isActive
                    ? 'bg-white/[0.1] text-white font-semibold'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] font-medium'
                  }
                `}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[16px] w-5 text-center leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-teal-400"
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150"
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150"
          >
            <div className="w-5 flex justify-center">
              <LogOut className="w-[15px] h-[15px]" />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main panel ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#f5f5f7]/80 dark:bg-[#09090b]/80 border-b border-black/[0.04] dark:border-white/[0.06] px-8 h-[52px] flex items-center justify-between transition-colors duration-300">
          <h1 className="text-[14px] font-semibold text-gray-800 dark:text-white/80">
            {navItems.find((item) => item.id === activePage)?.label || 'My Money'}
          </h1>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[12px] font-medium text-gray-600 dark:text-white/50 leading-tight">{user.email}</div>
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
