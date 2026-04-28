import React, { useMemo } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Banknote, Users, Package, Timer, Settings, FileCheck, BarChart2, AlertTriangle, MapPin } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useGrowthEngine } from './hooks/useGrowthEngine'
import { ThemeProvider } from './hooks/useTheme'
import { Layout } from './components/shared/Layout'
import { LoginPage } from './pages/LoginPage'
import { RoleSelector } from './pages/RoleSelector'
// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard'
import { StudentPaycheck } from './pages/student/StudentPaycheck'
import { StudentTransfer } from './pages/student/StudentTransfer'
import { StudentCashOut } from './pages/student/StudentCashOut'

// Guide pages
import { GuideRoster } from './pages/guide/GuideRoster'
import { GuideStudentDetail } from './pages/guide/GuideStudentDetail'
import { GuidePurchases } from './pages/guide/GuidePurchases'
import GuideSession from './pages/guide/GuideSession'
import { GuideSettings } from './pages/guide/GuideSettings'
import { GuidePaychecks } from './pages/guide/GuidePaychecks'
import { GuideClassStats } from './pages/guide/GuideClassStats'
import { GuideFines } from './pages/guide/GuideFines'
import { GuideMAP } from './pages/guide/GuideMAP'

const LoadingSpinner = ({ debugMsg }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f7] dark:bg-[#141211]">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-10 h-10 border-[3px] border-stone-200 dark:border-stone-700 border-t-stone-700 dark:border-t-stone-400 rounded-full"
    />
    {debugMsg && <p className="mt-4 text-xs text-gray-400 font-mono max-w-md text-center">{debugMsg}</p>}
  </div>
)

function AppInner() {
  const { user, profile, loading, authError, passwordRecovery, signIn, signUp, resetPassword, updatePassword, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Run growth engine once per day (applies savings interest + market returns)
  useGrowthEngine(!!profile)

  // Sidebar is intentionally minimal: just Home and Paycheck.
  // Transfer and Cash Out are still routes (/transfer, /cash-out) but accessed
  // via buttons on the dashboard, not the nav.
  const studentNavItems = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: Home, path: '/' },
      { id: 'paycheck', label: 'Paycheck', icon: Banknote, path: '/paycheck' },
    ],
    []
  )

  const guideNavItems = useMemo(
    () => [
      { id: 'home', label: 'Students', icon: Users, path: '/' },
      { id: 'paychecks', label: 'Paychecks', icon: FileCheck, path: '/paychecks' },
      { id: 'purchases', label: 'Purchases', icon: Package, path: '/purchases' },
      { id: 'stats', label: 'Class Stats', icon: BarChart2, path: '/stats' },
      { id: 'fines', label: 'Fines', icon: AlertTriangle, path: '/fines' },
      { id: 'map', label: 'MAP', icon: MapPin, path: '/map' },
      { id: 'session', label: 'Session', icon: Timer, path: '/session' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ],
    []
  )

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || passwordRecovery) {
    return <LoginPage onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} onUpdatePassword={updatePassword} loading={loading} forceMode={passwordRecovery ? 'reset' : null} />
  }

  // User is authenticated but profile failed to load
  if (!profile) {
    if (authError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f7] dark:bg-[#141211] px-4">
          <p className="text-ink dark:text-stone-300 text-center mb-4">{authError}</p>
          <div className="flex gap-3">
            <button
              onClick={refreshProfile}
              className="px-4 py-2 bg-ink text-white rounded font-semibold text-sm hover:bg-ink/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-ink dark:text-stone-300 rounded font-semibold text-sm hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )
    }
    return <LoadingSpinner debugMsg="Setting up your account..." />
  }

  // First-time user: show role selection
  if (!profile.setup_complete) {
    return <RoleSelector profile={profile} onComplete={refreshProfile} />
  }

  const isGuide = profile.role === 'guide'
  const navItems = isGuide ? guideNavItems : studentNavItems

  const currentPath = location.pathname
  const activePage = navItems.find(item =>
    item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)
  )?.id || 'home'

  const handleNavigate = (pageId) => {
    const item = navItems.find(n => n.id === pageId)
    if (item) navigate(item.path)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Layout
      user={user}
      role={profile.role}
      navItems={navItems}
      activePage={activePage}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
    >
      {isGuide ? (
        <Routes>
          <Route path="/" element={<GuideRoster />} />
          <Route path="/student/:id" element={<GuideStudentDetail />} />
          <Route path="/paychecks" element={<GuidePaychecks />} />
          <Route path="/purchases" element={<GuidePurchases />} />
          <Route path="/stats" element={<GuideClassStats />} />
          <Route path="/fines" element={<GuideFines />} />
          <Route path="/map" element={<GuideMAP />} />
          <Route path="/session" element={<GuideSession />} />
          <Route path="/settings" element={<GuideSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/paycheck" element={<StudentPaycheck />} />
          <Route path="/transfer" element={<StudentTransfer />} />
          <Route path="/cash-out" element={<StudentCashOut />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Layout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
