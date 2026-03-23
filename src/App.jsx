import React, { useMemo } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Banknote, ArrowLeftRight, ShoppingBag, BookOpen, ClipboardList, Users, Package, Timer, Settings, FileCheck, Trophy, BarChart2, AlertTriangle, MapPin, DollarSign } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useAccounts } from './hooks/useAccounts'
import { useGrowthEngine } from './hooks/useGrowthEngine'
import { useStreak } from './hooks/useStreak'
import { useAutoGrant } from './hooks/useAutoGrant'
import { ThemeProvider } from './hooks/useTheme'
import { Layout } from './components/shared/Layout'
import { AchievementToast } from './components/shared/AchievementToast'
import { getLevel, getNextLevel } from './lib/constants'
import { LoginPage } from './pages/LoginPage'
// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard'
import { StudentPaycheck } from './pages/student/StudentPaycheck'
import { StudentTransfer } from './pages/student/StudentTransfer'
import { StudentPurchase } from './pages/student/StudentPurchase'
import { StudentHistory } from './pages/student/StudentHistory'
import { StudentLearn } from './pages/student/StudentLearn'
import { StudentLeaderboard } from './pages/student/StudentLeaderboard'
import { InvestmentDetail } from './pages/student/InvestmentDetail'
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
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isStudent = profile?.role === 'student'
  const { accounts } = useAccounts(isStudent ? profile?.id : null)

  // Run growth engine once per day (applies savings interest + market returns)
  useGrowthEngine(!!profile)

  // Fetch student streak
  const { streak } = useStreak(isStudent ? profile?.id : null)

  // Auto-grant badges when conditions are met
  const { newBadges, dismissBadge } = useAutoGrant(
    isStudent ? profile?.id : null,
    accounts,
    streak
  )

  // Compute level / XP progress for student sidebar
  const studentMeta = useMemo(() => {
    if (!isStudent || !accounts) return { level: null, xpProgress: 0, streak: 0 }
    const total = Object.entries(accounts)
      .filter(([key]) => key !== 'bonus')
      .reduce((sum, [, bal]) => sum + bal, 0)
    const level = getLevel(total)
    const next = getNextLevel(total)
    const xpProgress = next
      ? Math.min(((total - level.min) / (next.min - level.min)) * 100, 100)
      : 100
    return { level, xpProgress, streak }
  }, [isStudent, accounts, streak])

  const studentNavItems = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: Home, path: '/' },
      { id: 'paycheck', label: 'Paycheck', icon: Banknote, path: '/paycheck' },
      { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, path: '/transfer' },
      { id: 'purchase', label: 'Buy', icon: ShoppingBag, path: '/purchase' },
      { id: 'cashout', label: 'Cash Out', icon: DollarSign, path: '/cash-out' },
      { id: 'learn', label: 'Learn', icon: BookOpen, path: '/learn' },
      { id: 'history', label: 'History', icon: ClipboardList, path: '/history' },
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

  if (!user || !profile) {
    return <LoginPage onSignInWithGoogle={signInWithGoogle} loading={loading} />
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

  // Transform new badges for achievement toast
  const achievementsToShow = newBadges.map(b => ({
    type: 'badge',
    icon: b.icon,
    title: b.title,
    description: b.description,
  }))

  return (
    <>
      {/* Achievement celebration overlay */}
      {achievementsToShow.length > 0 && (
        <AchievementToast
          achievements={achievementsToShow}
          onDismiss={() => newBadges.forEach(b => dismissBadge(b.id))}
        />
      )}

      <Layout
        user={user}
        role={profile.role}
        navItems={navItems}
        activePage={activePage}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
        level={studentMeta.level}
        xpProgress={studentMeta.xpProgress}
        streak={studentMeta.streak}
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
            <Route path="/purchase" element={<StudentPurchase />} />
            <Route path="/cash-out" element={<StudentCashOut />} />
            <Route path="/leaderboard" element={<StudentLeaderboard />} />
            <Route path="/learn" element={<StudentLearn />} />
            <Route path="/history" element={<StudentHistory />} />
            <Route path="/invest/:type" element={<InvestmentDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Layout>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
