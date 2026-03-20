import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAccounts = (studentId) => {
  const [accounts, setAccounts] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAccounts = async () => {
    if (!studentId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('student_id', studentId)

      if (error) throw error

      if (data) {
        // Transform array into object with account types as keys
        const accountsObj = {}
        data.forEach((account) => {
          accountsObj[account.account_type] = account.balance
        })
        setAccounts(accountsObj)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [studentId])

  const refreshAccounts = () => {
    fetchAccounts()
  }

  return {
    accounts,
    loading,
    refreshAccounts
  }
}
