import React, { useState, useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/shared/Layout'
import { LoginPage } from './pages/LoginPage'
// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard'
import { StudentPaycheck } from './pages/student/StudentPaycheck'
import { StudentTransfer } from './pages/student/StudentTransfer'
import { StudentPurchase } from './pages/student/StudentPurchase'
import { StudentHistory } from './pages/student/StudentHistory'

// Guide pages
import { GuideRoster } from './pages/guide/GuideRoster'
import { GuideStudentDetail } from './pages/guide/GuideStudentDetail'
import { GuidePurchases } from './pages/guide/GuidePurchases'
import { GuideSession } from './pages/guide/GuideSession'
import { GuideSettings } from './pages/guide/GuideSettings'

const LoadingSpinner = ({ debugMsg }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-sage-bg to-slate-50">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 border-4 border-sage-light border-t-sage rounded-full"
    />
    {debugMsg && <p className="mt-4 text-xs text-gray-400 font-mono max-w-md text-center">{debugMsg}</p>}
  </div>
)

export default function App() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const [currentPage, setCurrentPage] = useState('home')

  const studentNavItems = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'paycheck', label: 'Paycheck', icon: '💰' },
      { id: 'transfer', label: 'Transfer', icon: '↔️' },
      { id: 'purchase', label: 'Buy', icon: '🛍️' },
      { id: 'history', label: 'History', icon: '📋' }
    ],
    []
  )

  const guideNavItems = useMemo(
    () => [
      { id: 'home', label: 'Students', icon: '👥' },
      { id: 'purchases', label: 'Purchases', icon: '📦' },
      { id: 'session', label: 'Session', icon: '⏱️' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
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

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Layout
      user={user}
      role={profile.role}
      navItems={navItems}
      activePage={currentPage}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
    >
      {isGuide ? (
        <Routes>
          <Route path="/" element={<GuideRoster />} />
          <Route path="/student/:id" element={<GuideStudentDetail />} />
          <Route path="/purchases" element={<GuidePurchases />} />
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
          <Route path="/history" element={<StudentHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Layout>
  )
}
