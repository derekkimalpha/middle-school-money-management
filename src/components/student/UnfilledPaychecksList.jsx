import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/constants'

/**
 * Lists all unfilled paychecks (draft or submitted) for current session.
 * Ordered oldest first so kids fill in any missed weeks.
 * Tappable → navigate to /paycheck?week=N
 */
export const UnfilledPaychecksList = ({ studentId, currentSessionNumber, currentWeekNumber }) => {
  const navigate = useNavigate()
  const [paychecks, setPaychecks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId || !currentSessionNumber) return
    let cancelled = false

    const fetch = async () => {
      const { data, error } = await supabase
        .from('weekly_paychecks')
        .select('*')
        .eq('student_id', studentId)
        .eq('session_number', currentSessionNumber)
        .neq('status', 'allocated')
        .lte('week_number', currentWeekNumber)
        .order('week_number', { ascending: true })

      if (cancelled) return
      if (error) {
        console.error('UnfilledPaychecksList fetch error:', error)
        setLoading(false)
        return
      }
      setPaychecks(data || [])
      setLoading(false)
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [studentId, currentSessionNumber, currentWeekNumber])

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum h-[140px] animate-pulse" />
    )
  }

  if (paychecks.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum overflow-hidden"
    >
      <div className="px-5 pt-4 pb-3 border-b-[2px] border-black">
        <h2 className="text-[16px] font-black tracking-tight text-black dark:text-white">
          Paychecks to fill
        </h2>
        <p className="text-[11px] text-black/55 dark:text-white/45 mt-1 font-semibold">
          {paychecks.length} week{paychecks.length !== 1 ? 's' : ''} — tap to fill in any you missed
        </p>
      </div>

      <div className="px-5 py-2">
        {paychecks.map((pc, idx) => {
          const total = Number(pc.total_earnings || 0)
          const isSubmitted = pc.status === 'submitted'
          return (
            <motion.button
              key={pc.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              onClick={() => navigate(`/paycheck?week=${pc.week_number}`)}
              className="w-full flex items-center justify-between py-3 hover:bg-cobalt-50 dark:hover:bg-cobalt-500/5 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-black dark:text-white">
                  {pc.week_label || `Week ${pc.week_number}`}
                </p>
                <p className={`text-[11px] mt-0.5 ${isSubmitted ? 'text-amber-700 dark:text-amber-400' : 'text-black/55 dark:text-white/45'}`}>
                  {isSubmitted ? 'Submitted — waiting for guide review' : 'Not filled yet'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {total > 0 && (
                  <span className="text-[13px] font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                    +{formatCurrency(total)}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/30" strokeWidth={2.4} />
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
