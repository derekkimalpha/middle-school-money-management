import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, FileText } from 'lucide-react'
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
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft h-[140px] animate-pulse" />
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
      className="mt-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-alpha-blue-200 shadow-soft overflow-hidden"
    >
      <div className="px-6 pt-5 pb-3 border-b border-alpha-blue-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-alpha-blue-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-alpha-navy-800 dark:text-white">
            Paychecks to fill
          </h2>
        </div>
        <p className="text-[12px] text-alpha-blue-700 dark:text-alpha-blue-400 mt-1 font-semibold">
          {paychecks.length} week{paychecks.length !== 1 ? 's' : ''} — tap to fill in any you missed
        </p>
      </div>

      <div className="px-6 py-3">
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
              className="w-full flex items-center justify-between py-3 hover:bg-alpha-blue-50 dark:hover:bg-alpha-blue-900/10 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-alpha-navy-800 dark:text-white">
                  {pc.week_label || `Week ${pc.week_number}`}
                </p>
                <p className={`text-[11px] mt-0.5 ${isSubmitted ? 'text-amber-700 dark:text-amber-400' : 'text-alpha-blue-600 dark:text-alpha-blue-400'}`}>
                  {isSubmitted ? 'Submitted — waiting for guide review' : 'Not filled yet'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {total > 0 && (
                  <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    +{formatCurrency(total)}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-alpha-blue-400 dark:text-alpha-blue-600" strokeWidth={2.4} />
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
