import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, TrendingUp, DollarSign, Award, Crown, Medal, Star, Gift, Zap } from 'lucide-react'
import { AnimNum, Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'
import { formatCurrency, getLevel } from '../../lib/constants'

export const GuideClassStats = () => {
  const [students, setStudents] = useState([])
  const [badges, setBadges] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusNote, setBonusNote] = useState('')
  const [grantingBonus, setGrantingBonus] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [studentsRes, badgesRes, activityRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(`id, full_name, accounts(account_type, balance)`)
          .eq('role', 'student')
          .order('full_name'),
        supabase
          .from('student_badges')
          .select('student_id, badge_id, earned_at, badges:badge_definitions(title, icon)')
          .order('earned_at', { ascending: false })
          .limit(20),
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15),
      ])

      setStudents(studentsRes.data || [])
      setBadges(badgesRes.data || [])
      setRecentActivity(activityRes.data || [])
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // Computed stats
  const ranked = students
    .map(s => {
      const total = (s.accounts || [])
        .filter(a => a.account_type !== 'bonus')
        .reduce((sum, a) => sum + (a.balance || 0), 0)
      return { ...s, total }
    })
    .sort((a, b) => b.total - a.total)

  const totalClassWealth = ranked.reduce((sum, s) => sum + s.total, 0)
  const averageBalance = ranked.length > 0 ? totalClassWealth / ranked.length : 0
  const topStudent = ranked[0]
  const investorCount = students.filter(s =>
    (s.accounts || []).some(a => (a.account_type === 'sp500' || a.account_type === 'nasdaq') && a.balance > 0)
  ).length

  const levelDistribution = {}
  ranked.forEach(s => {
    const lvl = getLevel(s.total)
    levelDistribution[lvl.name] = (levelDistribution[lvl.name] || 0) + 1
  })

  const handleClassBonus = async () => {
    const amount = parseFloat(bonusAmount)
    if (!amount || amount <= 0) {
      setToast({ type: 'error', text: 'Enter a valid bonus amount' })
      return
    }

    setGrantingBonus(true)
    try {
      // Add bonus to every student's bonus account
      const updates = students.map(student => {
        const bonusAccount = (student.accounts || []).find(a => a.account_type === 'bonus')
        if (!bonusAccount) return null
        return supabase
          .from('accounts')
          .update({ balance: (bonusAccount.balance || 0) + amount })
          .eq('id', bonusAccount.id)
      }).filter(Boolean)

      await Promise.all(updates)
      setToast({ type: 'success', text: `$${amount} bonus sent to all ${students.length} students!` })
      setBonusAmount('')
      setBonusNote('')
      await fetchData()
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to grant bonus' })
    } finally {
      setGrantingBonus(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-surface-2 dark:bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <Toast message={toast} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-hand font-bold text-ink dark:text-chalk-white">Class Stats</h1>
        <p className="text-[13px] text-ink-muted dark:text-white/40 mt-1">
          Overview of your class's financial progress
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Wealth', value: totalClassWealth, icon: DollarSign, color: '#7c8c78' },
          { label: 'Avg Balance', value: averageBalance, icon: Users, color: '#6b8a87' },
          { label: 'Students', value: students.length, icon: Users, color: '#a68b5b', isCurrency: false },
          { label: 'Investors', value: investorCount, icon: TrendingUp, color: '#78716c', isCurrency: false },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className="rounded-xl p-4 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${metric.color}15` }}>
                <metric.icon className="w-3.5 h-3.5" style={{ color: metric.color }} />
              </div>
              <span className="text-[10px] font-bold text-ink-faint dark:text-white/30 uppercase tracking-wider">{metric.label}</span>
            </div>
            <p className="text-xl font-black tabular-nums text-ink dark:text-chalk-white">
              {metric.isCurrency === false ? metric.value : <AnimNum value={metric.value} prefix="$" />}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Class Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
          <Trophy className="w-3.5 h-3.5 inline mr-1.5" />
          Leaderboard
        </h2>
        <div className="space-y-1.5">
          {ranked.slice(0, 10).map((student, index) => {
            const ICONS = { 0: Crown, 1: Medal, 2: Star }
            const COLORS = { 0: '#e8c840', 1: '#a3ada0', 2: '#a68b5b' }
            const RankIcon = ICONS[index]
            const level = getLevel(student.total)

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 + index * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.06] transition-colors"
              >
                <div className="w-7 text-center flex-shrink-0">
                  {RankIcon ? (
                    <RankIcon className="w-5 h-5 mx-auto" style={{ color: COLORS[index] }} />
                  ) : (
                    <span className="text-[13px] font-bold tabular-nums text-ink-muted dark:text-white/40">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-ink dark:text-chalk-white truncate">{student.full_name}</p>
                  <p className="text-[10px] text-ink-faint dark:text-white/25">✦ {level.name}</p>
                </div>
                <p className="text-sm font-black tabular-nums text-ink dark:text-chalk-white">
                  {formatCurrency(student.total)}
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Level Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
          <Award className="w-3.5 h-3.5 inline mr-1.5" />
          Level Distribution
        </h2>
        <div className="rounded-xl p-5 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
          <div className="space-y-3">
            {Object.entries(levelDistribution).map(([name, count]) => {
              const pct = students.length > 0 ? (count / students.length) * 100 : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-ink dark:text-chalk-white">{name}</span>
                    <span className="text-[11px] text-ink-muted dark:text-white/40">{count} student{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-3 dark:bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-pencil"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Recent Badges */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <h2 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
            Recent Badges
          </h2>
          <div className="space-y-2">
            {badges.slice(0, 5).map((badge, i) => {
              const studentName = students.find(s => s.id === badge.student_id)?.full_name || 'Student'
              return (
                <div
                  key={`${badge.student_id}-${badge.badge_id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]"
                >
                  <span className="text-xl">{badge.badges?.icon || '🏆'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink dark:text-chalk-white">{studentName}</p>
                    <p className="text-[11px] text-ink-faint dark:text-white/30">{badge.badges?.title}</p>
                  </div>
                  <p className="text-[10px] text-ink-faint dark:text-white/25">
                    {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Quick Bonus */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-[13px] font-bold text-ink-muted dark:text-white/50 uppercase tracking-wider mb-3">
          <Gift className="w-3.5 h-3.5 inline mr-1.5" />
          Class-Wide Bonus
        </h2>
        <div className="rounded-xl p-5 bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-[12px] text-ink-light dark:text-white/50 mb-4">
            Send a bonus to every student's bonus account at once.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-white/30 text-sm">$</span>
              <input
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-surface-2 dark:bg-white/[0.04] text-[13px] text-ink dark:text-chalk-white placeholder-ink-faint dark:placeholder-white/30 focus:outline-none focus:border-ink/20 dark:focus:border-white/20"
              />
            </div>
            <button
              onClick={handleClassBonus}
              disabled={grantingBonus || !bonusAmount}
              className="px-5 py-2.5 rounded-xl bg-ink dark:bg-chalk-white text-white dark:text-ink text-[13px] font-bold hover:bg-ink/90 dark:hover:bg-chalk-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {grantingBonus ? 'Sending...' : 'Send to All'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
