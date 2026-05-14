import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Crown, Medal, Star } from 'lucide-react'
import { AnimNum } from '../../components/shared'
import { useAuth } from '../../hooks/useAuth'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { formatCurrency } from '../../lib/constants'

const RANK_STYLES = {
  1: { icon: Crown, label: 'Money Master' },
  2: { icon: Medal, label: 'Rising Star' },
  3: { icon: Star, label: 'Smart Saver' },
}

export const StudentLeaderboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { leaderboard, myRank, loading } = useLeaderboard(profile?.id, false)

  return (
    <div className="min-h-screen bg-ds-canvas text-ds-primary font-ds-sans">
      <div className="max-w-3xl mx-auto pb-24">
        {/* Header */}
        <div className="px-8 pt-8 pb-2">
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-ds-tertiary hover:text-ds-secondary transition-colors mb-4"
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
            <h1 className="text-[28px] md:text-[32px] font-semibold text-ds-primary tracking-[-0.02em]">
              Leaderboard
            </h1>
            <p className="text-[13px] text-ds-tertiary mt-1">
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
              className="rounded-ds-lg p-5 border border-ds-hairline bg-ds-accent-soft"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ds-inset flex items-center justify-center">
                    <span className="text-xl font-semibold tabular-nums text-ds-accent">#{myRank}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-ds-primary">Your Rank</p>
                    <p className="text-[11px] text-ds-tertiary">
                      {myRank === 1 ? 'You\'re at the top!' :
                       myRank <= 3 ? 'On the podium!' :
                       `${myRank - 1} spot${myRank - 1 === 1 ? '' : 's'} from the top`}
                    </p>
                  </div>
                </div>
                <Trophy className="w-6 h-6 text-ds-accent" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="px-8 pt-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-[64px] bg-ds-inset rounded-ds-lg animate-pulse" />
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
                    className={`flex items-center gap-4 p-4 rounded-ds-lg transition-all ${
                      isMe
                        ? 'bg-ds-accent-soft border border-ds-hairline'
                        : 'bg-ds-surface border border-ds-hairline'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 text-center">
                      {rankStyle ? (
                        <div className="w-8 h-8 rounded-ds-md flex items-center justify-center bg-ds-inset">
                          <RankIcon className="w-4 h-4 text-ds-accent" />
                        </div>
                      ) : (
                        <span className="text-sm font-semibold tabular-nums text-ds-tertiary">
                          {student.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isMe
                        ? 'bg-ds-inset text-ds-accent border border-ds-hairline'
                        : 'bg-ds-inset text-ds-secondary'
                    }`}>
                      {student.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${
                        isMe ? 'text-ds-accent' : 'text-ds-primary'
                      }`}>
                        {student.displayName} {isMe && '(You)'}
                      </p>
                      {rankStyle && (
                        <p className="text-[10px] font-medium text-ds-tertiary">
                          {rankStyle.label}
                        </p>
                      )}
                    </div>

                    {/* Balance */}
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-base font-semibold tabular-nums ${
                        isMe ? 'text-ds-accent' : 'text-ds-primary'
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
    </div>
  )
}
