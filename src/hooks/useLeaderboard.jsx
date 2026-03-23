import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches class leaderboard — all students ranked by net worth.
 * For student view: shows rank + anonymous names for others.
 * For guide view: shows full names.
 */
export const useLeaderboard = (currentUserId, isGuide = false) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUserId) return

    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            accounts (
              account_type,
              balance
            )
          `)
          .eq('role', 'student')

        if (error) throw error

        const ranked = (data || [])
          .map(student => {
            const total = (student.accounts || [])
              .filter(a => a.account_type !== 'bonus')
              .reduce((sum, a) => sum + (a.balance || 0), 0)
            return {
              id: student.id,
              name: student.full_name,
              total,
              isMe: student.id === currentUserId,
            }
          })
          .sort((a, b) => b.total - a.total)
          .map((student, index) => ({
            ...student,
            rank: index + 1,
            displayName: student.name,
          }))

        setLeaderboard(ranked)
        const me = ranked.find(s => s.isMe)
        if (me) setMyRank(me.rank)
      } catch (err) {
        console.error('Leaderboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [currentUserId, isGuide])

  return { leaderboard, myRank, loading }
}

