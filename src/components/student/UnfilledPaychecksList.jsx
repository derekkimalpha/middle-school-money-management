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
      <div className="bg-ds-surface border border-ds-hairline rounded-ds-xl h-[140px] animate-pulse" />
    )
  }

  if (paychecks.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-ds-surface border border-ds-hairline rounded-ds-xl overflow-hidden"
    >
      <div className="px-6 md:px-7 pt-6 pb-4 border-b border-ds-hairline">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-ds-md bg-ds-accent-soft text-ds-accent flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" strokeWidth={2} />
          </div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ds-primary">
            Paychecks to fill
          </h2>
        </div>
        <p className="text-[12px] text-ds-tertiary mt-1 font-medium pl-[52px]">
          {paychecks.length} week{paychecks.length !== 1 ? 's' : ''} — tap to fill in any you missed
        </p>
      </div>

      <div className="px-6 md:px-7">
        {paychecks.map((pc, idx) => {
          const total = Number(pc.total_earnings || 0)
          const isSubmitted = pc.status === 'submitted'
          const isLast = idx === paychecks.length - 1
          return (
            <motion.button
              key={pc.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              onClick={() => navigate(`/paycheck?week=${pc.week_number}`)}
              className={`w-full flex items-center justify-between py-3.5 hover:bg-ds-overlay transition-colors text-left ${!isLast ? 'border-b border-ds-hairline' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ds-primary">
                  {pc.week_label || `Week ${pc.week_number}`}
                </p>
                <p className={`text-[11px] mt-0.5 font-medium ${isSubmitted ? 'text-ds-positive' : 'text-ds-tertiary'}`}>
                  {isSubmitted ? 'Submitted — waiting for guide review' : 'Not filled yet'}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {total > 0 && (
                  <span className="text-[13px] font-semibold text-ds-positive tabular-nums">
                    +{formatCurrency(total)}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-ds-tertiary" strokeWidth={2} />
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
