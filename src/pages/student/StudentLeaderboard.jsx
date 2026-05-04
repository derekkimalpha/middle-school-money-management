import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Crown, Medal, Star } from 'lucide-react'
import { AnimNum } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { formatCurrency } from '../../lib/constants'

const RANK_STYLES = {
  1: { icon: Crown, color: '#e8c840', bg: 'rgba(232,200,64,0.1)', label: 'Money Master' },
  2: { icon: Medal, color: '#a3ada0', bg: 'rgba(163,173,160,0.1)', label: 'Rising Star' },
  3: { icon: Star, color: '#a68b5b', bg: 'rgba(166,139,91,0.1)', label: 'Smart Saver' },
}

export const StudentLeaderboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { leaderboard, myRank, loading } = useLeaderboard(profile?.id, false)

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="px-8 pt-8 pb-2">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-ink-muted dark:text-white/40 hover:text-ink dark:hover:text-white/60 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium">Back</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h1 className="text-4xl font-bold text-alpha-navy-800 dark:text-white">
            Leaderboard
          </h1>
          <p className="text-[13px] text-ink-muted dark:text-white/40 mt-1">
            {myRank ? `You're #${myRank} out of ${leaderboard.length}` : 'See how you stack up'}
          </p>
        </motion.div>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <div className="px-8 py-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-5 border-2 border-pencil/30 dark:border-pencil/20 bg-pencil/[0.04]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pencil/10 flex items-center justify-center">
                  <span className="text-xl font-black text-pencil">#{myRank}</span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-ink dark:text-chalk-white">Your Rank</p>
                  <p className="text-[11px] text-ink-muted dark:text-white/40">
                    {myRank === 1 ? 'You\'re at the top!' :
                     myRank <= 3 ? 'On the podium!' :
                     `${myRank - 1} spot${myRank - 1 === 1 ? '' : 's'} from the top`}
                  </p>
                </div>
              </div>
              <Trophy className="w-6 h-6 text-pencil" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="px-8 pt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-[64px] bg-surface-2 dark:bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((student, index) => {
              const rankStyle = RANK_STYLES[student.rank]
              const RankIcon = rankStyle?.icon
              const isMe = student.isMe

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isMe
                      ? 'bg-pencil/[0.06] border border-pencil/20 dark:border-pencil/15'
                      : 'bg-white dark:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {rankStyle ? (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: rankStyle.bg }}
                      >
                        <RankIcon className="w-4 h-4" style={{ color: rankStyle.color }} />
                      </div>
                    ) : (
                      <span className="text-sm font-bold tabular-nums text-ink-muted dark:text-white/40">
                        {student.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    isMe
                      ? 'bg-pencil/20 text-pencil border border-pencil/30'
                      : 'bg-surface-3 dark:bg-white/[0.08] text-ink-light dark:text-white/50'
                  }`}>
                    {student.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-bold truncate ${
                      isMe ? 'text-pencil-dark dark:text-pencil' : 'text-ink dark:text-chalk-white'
                    }`}>
                      {student.displayName} {isMe && '(You)'}
                    </p>
                    {rankStyle && (
                      <p className="text-[10px] font-medium" style={{ color: rankStyle.color }}>
                        {rankStyle.label}
                      </p>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-base font-black tabular-nums ${
                      isMe ? 'text-pencil-dark dark:text-pencil' : 'text-ink dark:text-chalk-white'
                    }`}>
                      {formatCurrency(student.total)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
