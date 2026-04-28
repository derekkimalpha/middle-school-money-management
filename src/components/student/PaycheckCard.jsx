import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/constants'

const STATUS_LABELS = {
  draft: 'In progress',
  submitted: 'Submitted for review',
  verified: 'Approved — ready to allocate',
  allocated: 'Allocated',
}

const getCurrentWeekLabel = () => {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Compact card on the home dashboard showing this week's paycheck progress.
 * Tappable — navigates to /paycheck for full editor.
 */
export const PaycheckCard = ({ studentId }) => {
  const navigate = useNavigate()
  const [paycheck, setPaycheck] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    let cancelled = false

    const fetch = async () => {
      const weekLabel = getCurrentWeekLabel()
      const { data, error } = await supabase
        .from('weekly_paychecks')
        .select('*')
        .eq('student_id', studentId)
        .eq('week_label', weekLabel)
        .maybeSingle()
      if (cancelled) return
      if (error) {
        console.error('PaycheckCard fetch error:', error)
        setLoading(false)
        return
      }
      setPaycheck(data || null)
      setLoading(false)
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [studentId])

  const handleClick = () => navigate('/paycheck')

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum animate-pulse h-[120px]"
      />
    )
  }

  const total = Number(paycheck?.total_earnings || 0)
  const status = paycheck?.status || 'draft'
  const totalXp = paycheck
    ? (paycheck.xp_mon || 0) + (paycheck.xp_tue || 0) + (paycheck.xp_wed || 0) + (paycheck.xp_thu || 0) + (paycheck.xp_fri || 0)
    : 0
  const masteryPay = Number(paycheck?.mastery_pay || 0)
  const basePay = Number(paycheck?.base_pay || 0)
  const epicBonus = Number(paycheck?.epic_bonus || 0)
  const xpBonus = Number(paycheck?.xp_bonus || 0)
  const jobPay = Number(paycheck?.job_pay || 0)
  const otherPay = Number(paycheck?.other_pay || 0)

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-2xl p-5 bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-gum-sm transition-all"
    >
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.15em] text-black/55 dark:text-white/50 font-black">
          This week's paycheck
        </p>
        <p className="text-[28px] font-black tabular-nums text-emerald-700 dark:text-emerald-400">
          {total > 0 ? `+${formatCurrency(total)}` : formatCurrency(0)}
        </p>
      </div>

      {paycheck && (totalXp > 0 || masteryPay > 0 || jobPay > 0 || otherPay !== 0) ? (
        <div className="space-y-1.5 mt-3">
          {totalXp > 0 && (
            <div className="flex justify-between text-[12px] text-black/65 dark:text-white/55 font-semibold">
              <span>{totalXp.toLocaleString()} min XP</span>
              <span className="tabular-nums">{formatCurrency(basePay + xpBonus + epicBonus)}</span>
            </div>
          )}
          {masteryPay > 0 && (
            <div className="flex justify-between text-[12px] text-black/65 dark:text-white/55 font-semibold">
              <span>Mastery tests</span>
              <span className="tabular-nums">{formatCurrency(masteryPay)}</span>
            </div>
          )}
          {jobPay > 0 && (
            <div className="flex justify-between text-[12px] text-black/65 dark:text-white/55 font-semibold">
              <span>Job pay</span>
              <span className="tabular-nums">{formatCurrency(jobPay)}</span>
            </div>
          )}
          {otherPay !== 0 && (
            <div className="flex justify-between text-[12px] text-black/65 dark:text-white/55 font-semibold">
              <span>Bonuses / fines</span>
              <span className="tabular-nums">{otherPay > 0 ? '+' : ''}{formatCurrency(otherPay)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-black/55 dark:text-white/40 mt-1 font-semibold">
          Nothing logged yet — tap to start this week's paycheck.
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t-[2px] border-black/15">
        <span className="text-[11px] font-bold text-black/55 dark:text-white/40 uppercase tracking-wider">
          {STATUS_LABELS[status] || 'Tap to enter →'}
        </span>
        <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/30" strokeWidth={2.4} />
      </div>
    </button>
  )
}
