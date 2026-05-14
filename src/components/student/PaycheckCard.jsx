import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/constants'

const STATUS_LABELS = {
  draft: 'In progress',
  submitted: 'Submitted',
  verified: 'Submitted',
  allocated: 'Submitted',
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
      <div className="bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7 h-[140px] animate-pulse" />
    )
  }

  const total = Number(paycheck?.total_earnings || 0)
  const status = paycheck?.status || 'draft'
  const isSubmitted = status !== 'draft'
  const totalXp = paycheck
    ? (paycheck.xp_mon || 0) + (paycheck.xp_tue || 0) + (paycheck.xp_wed || 0) + (paycheck.xp_thu || 0) + (paycheck.xp_fri || 0)
    : 0
  const masteryPay = Number(paycheck?.mastery_pay || 0)
  const basePay = Number(paycheck?.base_pay || 0)
  const epicBonus = Number(paycheck?.epic_bonus || 0)
  const xpBonus = Number(paycheck?.xp_bonus || 0)
  const jobPay = Number(paycheck?.job_pay || 0)
  const otherPay = Number(paycheck?.other_pay || 0)
  const hasContent = paycheck && (totalXp > 0 || masteryPay > 0 || jobPay > 0 || otherPay !== 0)

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-ds-surface border border-ds-hairline rounded-ds-xl p-6 md:p-7 hover:border-ds-border transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-ds-md flex items-center justify-center flex-shrink-0 transition-colors ${
            isSubmitted
              ? 'bg-ds-accent text-ds-on-accent'
              : 'bg-ds-accent-soft text-ds-accent'
          }`}>
            {isSubmitted
              ? <Check className="w-4 h-4" strokeWidth={2.4} />
              : <FileText className="w-4 h-4" strokeWidth={2} />}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ds-primary">This week's paycheck</p>
          </div>
        </div>
        <p className="text-[26px] font-bold tracking-tight tabular-nums text-ds-primary">
          {total > 0 ? `+${formatCurrency(total)}` : '$0.00'}
        </p>
      </div>

      {hasContent ? (
        <div className="space-y-2 mt-4 pt-4 border-t border-ds-hairline">
          {totalXp > 0 && (
            <div className="flex justify-between text-[12px] text-ds-secondary">
              <span>{totalXp.toLocaleString()} min XP</span>
              <span className="tabular-nums font-medium text-ds-primary">{formatCurrency(basePay + xpBonus + epicBonus)}</span>
            </div>
          )}
          {masteryPay > 0 && (
            <div className="flex justify-between text-[12px] text-ds-secondary">
              <span>Mastery tests</span>
              <span className="tabular-nums font-medium text-ds-primary">{formatCurrency(masteryPay)}</span>
            </div>
          )}
          {jobPay > 0 && (
            <div className="flex justify-between text-[12px] text-ds-secondary">
              <span>Job pay</span>
              <span className="tabular-nums font-medium text-ds-primary">{formatCurrency(jobPay)}</span>
            </div>
          )}
          {otherPay !== 0 && (
            <div className="flex justify-between text-[12px] text-ds-secondary">
              <span>Bonuses / fines</span>
              <span className="tabular-nums font-medium text-ds-primary">{otherPay > 0 ? '+' : ''}{formatCurrency(otherPay)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-ds-tertiary mt-2">
          Nothing logged yet — tap to start this week's paycheck.
        </p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-hairline">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.05em] ${
          isSubmitted ? 'text-ds-positive' : 'text-ds-tertiary'
        }`}>
          {STATUS_LABELS[status] || 'Tap to open'}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-ds-tertiary" strokeWidth={2} />
      </div>
    </button>
  )
}
