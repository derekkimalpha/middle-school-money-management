import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookOpen, Sparkles, Trophy, Zap, Briefcase } from 'lucide-react'
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
      accent: '#1F6FEB',
    },
    {
      Icon: Sparkles,
      title: 'Bonus XP',
      body: `Every ${bonusXpPer} XP over ${xpThreshold.toLocaleString()} → +$${bonusXpRate}. Stack as much as you want.`,
      accent: '#114290',
    },
    {
      Icon: Trophy,
      title: 'Epic week bonus',
      body: `Get ${epicDaysRequired} epic days in one week → +$${epicWeekBonus} bonus.`,
      accent: '#0B3068',
    },
    {
      Icon: BookOpen,
      title: 'Mastery tests',
      body: `Score ${masteryMinScore}%+ → +$${masteryPassPay}. Score 100% → +$${masteryPerfectPay}. Per test.`,
      accent: '#1856B7',
    },
  ]

  if (settings.custom_bonuses?.length) {
    rules.push({
      Icon: Briefcase,
      title: 'Bonuses & jobs',
      body: `Your guide can add custom bonuses (jobs, leadership, extra credit). They show up on your paycheck card.`,
      accent: '#1F6FEB',
    })
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.03] border-[3px] border-black shadow-gum overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-cobalt-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="text-left">
          <p className="text-[11px] uppercase tracking-[0.15em] text-black/55 dark:text-white/50 font-black">
            How XP earns money
          </p>
          <p className="text-[14px] font-bold text-black dark:text-white mt-0.5">
            Tap to see the rules
          </p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-9 h-9 rounded-full bg-cobalt-50 dark:bg-white/[0.06] border-[2px] border-black flex items-center justify-center flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-black dark:text-white" strokeWidth={3} />
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
            <div className="px-5 pt-2 pb-5 border-t-[2px] border-black space-y-3">
              {rules.map(({ Icon, title, body, accent }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-[2px] border-black mt-0.5"
                    style={{ backgroundColor: accent }}
                  >
                    <Icon className="w-4 h-4 text-white" strokeWidth={2.6} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black text-black dark:text-white">{title}</p>
                    <p className="text-[12px] text-black/65 dark:text-white/55 font-semibold leading-snug mt-0.5">{body}</p>
                  </div>
                </motion.div>
              ))}
              <p className="text-[11px] text-black/40 dark:text-white/30 italic mt-3 pt-3 border-t border-black/10">
                Rules can change session to session — this card always shows what's active right now.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
