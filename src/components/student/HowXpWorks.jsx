import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookOpen, Sparkles, Trophy, Zap, Briefcase, Star } from 'lucide-react'
import { usePaycheckSettings } from '../../hooks/usePaycheckSettings'

/**
 * Auto-generated explainer that reads the live paycheck_settings table
 * so kids always see the exact rules currently in effect.
 *
 * Collapsible card. Default closed so it doesn't dominate the page.
 */
export const HowXpWorks = () => {
  const { settings } = usePaycheckSettings()
  const [open, setOpen] = useState(false)

  if (!settings) return null

  const xpThreshold = settings.xp_threshold ?? 600
  const basePay = settings.base_pay ?? 10
  const bonusXpPer = settings.bonus_xp_per ?? 50
  const bonusXpRate = settings.bonus_xp_rate ?? 1
  const epicDaysRequired = settings.epic_days_required ?? 5
  const epicWeekBonus = settings.epic_week_bonus ?? 5
  const masteryPerfectPay = settings.mastery_perfect_pay ?? 100
  const masteryPassPay = settings.mastery_pass_pay ?? 20
  const masteryMinScore = settings.mastery_min_score ?? 90

  const rules = [
    {
      Icon: Zap,
      title: 'Base pay',
      body: `Hit ${xpThreshold.toLocaleString()} XP minutes in a week → you earn $${basePay} flat.`,
    },
    {
      Icon: Sparkles,
      title: 'Bonus XP',
      body: `Every ${bonusXpPer} XP over ${xpThreshold.toLocaleString()} → +$${bonusXpRate}. Stack as much as you want.`,
    },
    {
      Icon: Trophy,
      title: 'Epic week bonus',
      body: `Get ${epicDaysRequired} epic days in one week → +$${epicWeekBonus} bonus.`,
    },
    {
      Icon: BookOpen,
      title: 'Mastery tests',
      body: `Score ${masteryMinScore}%+ → +$${masteryPassPay}. Score 100% → +$${masteryPerfectPay}. Per test.`,
    },
  ]

  if (settings.custom_bonuses?.length) {
    rules.push({
      Icon: Briefcase,
      title: 'Bonuses & jobs',
      body: `Your guide can add custom bonuses (jobs, leadership, extra credit). They show up on your paycheck card.`,
    })
  }

  return (
    <div className="bg-ds-surface border border-ds-hairline rounded-ds-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 md:px-7 py-4 hover:bg-ds-overlay transition-colors"
      >
        <div className="text-left flex items-center gap-3">
          <div className="w-10 h-10 rounded-ds-md bg-ds-inset text-ds-secondary flex items-center justify-center flex-shrink-0">
            <Star className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ds-primary">
              How XP earns money
            </p>
            <p className="text-[11px] text-ds-tertiary font-medium mt-0.5">
              Tap to see the rules
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center flex-shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5 text-ds-tertiary" strokeWidth={2.4} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 md:px-7 pt-3 pb-5 border-t border-ds-hairline space-y-3">
              {rules.map(({ Icon, title, body }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-ds-sm bg-ds-accent-soft text-ds-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ds-primary">{title}</p>
                    <p className="text-[12px] text-ds-secondary leading-snug mt-0.5">{body}</p>
                  </div>
                </motion.div>
              ))}
              <p className="text-[11px] text-ds-tertiary italic mt-3 pt-3 border-t border-ds-hairline">
                Rules can change session to session — this card always shows what's active right now.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
