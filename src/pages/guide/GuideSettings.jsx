import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { Button, Field, Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'

export const GuideSettings = () => {
  const [activeSession, setActiveSession] = useState(null)
  const [settings, setSettings] = useState(null)
  const [className, setClassName] = useState('')
  const [jobs, setJobs] = useState([])
  const [profiles, setProfiles] = useState([])
  const [studentJobs, setStudentJobs] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingJob, setAddingJob] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [newJob, setNewJob] = useState({ title: '', description: '', icon: '', weekly_pay: '' })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [sessionRes, profilesRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            role,
            student_jobs (
              job_id
            )
          `)
      ])

      if (sessionRes.data && sessionRes.data.length > 0) {
        const session = sessionRes.data[0]
        setActiveSession(session)
        setClassName(session.class_name || '')

        const [settingsRes, jobsRes] = await Promise.all([
          supabase
            .from('paycheck_settings')
            .select('*')
            .eq('session_id', session.id)
            .single(),
          supabase
            .from('jobs')
            .select('*')
            .eq('session_id', session.id)
            .order('title')
        ])

        setSettings(settingsRes.data)
        setJobs(jobsRes.data || [])
      }

      setProfiles(profilesRes.data || [])

      const studentJobMap = {}
      profilesRes.data?.forEach(profile => {
        if (profile.student_jobs && profile.student_jobs.length > 0) {
          studentJobMap[profile.id] = profile.student_jobs[0].job_id
        }
      })
      setStudentJobs(studentJobMap)
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const savePaycheckSettings = async () => {
    if (!settings || !activeSession) return

    try {
      setSaving(true)

      // Save paycheck settings
      const { error: settingsError } = await supabase
        .from('paycheck_settings')
        .update({
          xp_threshold: parseFloat(settings.xp_threshold) || 0,
          base_pay: parseFloat(settings.base_pay) || 0,
          epic_days_required: parseFloat(settings.epic_days_required) || 5,
          epic_week_bonus: parseFloat(settings.epic_week_bonus) || 0,
          bonus_xp_per: parseFloat(settings.bonus_xp_per) || 50,
          bonus_xp_rate: parseFloat(settings.bonus_xp_rate) || 0,
          mastery_min_score: parseFloat(settings.mastery_min_score) || 0,
          mastery_pass_pay: parseFloat(settings.mastery_pass_pay) || 0,
          mastery_perfect_pay: parseFloat(settings.mastery_perfect_pay) || 0,
          transfer_fee_invest_pct: parseFloat(settings.transfer_fee_invest_pct) || 10,
          transfer_fee_savings_pct: parseFloat(settings.transfer_fee_savings_pct) || 0,
          transfer_fee_pct: parseFloat(settings.transfer_fee_pct) || 0,
          smart_goal_pay: parseFloat(settings.smart_goal_pay) || 0,
          custom_bonuses: settings.custom_bonuses || []
        })
        .eq('session_id', activeSession.id)

      if (settingsError) throw settingsError

      // Save class name to sessions table
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ class_name: className })
        .eq('id', activeSession.id)

      if (sessionError) throw sessionError

      setToast({ type: 'success', text: 'Settings saved successfully' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const addJob = async () => {
    if (!newJob.title.trim() || !newJob.weekly_pay || !activeSession) {
      setToast({ type: 'error', text: 'Please fill in required fields' })
      return
    }

    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          session_id: activeSession.id,
          title: newJob.title,
          description: newJob.description,
          icon: newJob.icon || '💼',
          weekly_pay: parseFloat(newJob.weekly_pay),
          is_active: true
        })
        .select()

      if (error) throw error
      setJobs([...jobs, data[0]])
      setNewJob({ title: '', description: '', icon: '', weekly_pay: '' })
      setAddingJob(false)
      setToast({ type: 'success', text: 'Job added successfully' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to add job' })
    } finally {
      setSaving(false)
    }
  }

  const updateJob = async (jobId, updates) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)

      if (error) throw error
      setJobs(jobs.map(j => j.id === jobId ? { ...j, ...updates } : j))
      setEditingJob(null)
      setToast({ type: 'success', text: 'Job updated' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to update job' })
    } finally {
      setSaving(false)
    }
  }

  const deleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error
      setJobs(jobs.filter(j => j.id !== jobId))
      setToast({ type: 'success', text: 'Job deleted' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to delete job' })
    } finally {
      setSaving(false)
    }
  }

  const assignJobToStudent = async (studentId, jobId) => {
    try {
      setSaving(true)

      const existing = studentJobs[studentId]
      if (existing) {
        await supabase
          .from('student_jobs')
          .delete()
          .eq('student_id', studentId)
      }

      if (jobId) {
        await supabase
          .from('student_jobs')
          .insert({ student_id: studentId, job_id: jobId })
      }

      setStudentJobs({
        ...studentJobs,
        [studentId]: jobId
      })
      setToast({ type: 'success', text: 'Job assignment updated' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to assign job' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No active session. Start a session in Session Management first.</p>
      </div>
    )
  }

  const students = profiles.filter(p => p.role === 'student')

  return (
    <div className="space-y-6">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
        <p className="text-lg text-slate-600">Configure classroom, game rules, and job assignments</p>
      </motion.div>

      {/* My Classroom Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900">My Classroom</h2>

        {activeSession && (
          <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4">
            <div>
              <Field label="Class Name">
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Alpha Middle School San Francisco"
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Students in Class ({students.length})</h3>
              {students.length > 0 ? (
                <div className="space-y-2">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center p-3 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <span className="text-slate-900 font-medium">{student.full_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No students in this classroom yet</p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Paycheck Rules Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900">Paycheck Rules</h2>

        {settings && (
          <div className="space-y-4">
            {/* Base Pay Section */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900">Base Pay</h3>
                <p className="text-sm text-slate-600">Students earn base pay when they reach the weekly XP threshold</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="XP Threshold">
                  <input
                    type="number"
                    value={settings.xp_threshold || ''}
                    onChange={(e) => setSettings({ ...settings, xp_threshold: e.target.value })}
                    placeholder="e.g., 500"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum weekly XP to earn base pay</p>
                </Field>
                <Field label="Base Pay ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.base_pay || ''}
                    onChange={(e) => setSettings({ ...settings, base_pay: e.target.value })}
                    placeholder="e.g., 10.00"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Amount earned when threshold is met</p>
                </Field>
              </div>
            </div>

            {/* Epic Bonus Section */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900">Epic Bonus</h3>
                <p className="text-sm text-slate-600">Reward students for having epic (productive) days</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Epic Days Required">
                  <input
                    type="number"
                    value={settings.epic_days_required || 5}
                    onChange={(e) => setSettings({ ...settings, epic_days_required: e.target.value })}
                    placeholder="e.g., 5"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">How many epic days needed for the bonus</p>
                </Field>
                <Field label="Epic Week Bonus ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.epic_week_bonus || ''}
                    onChange={(e) => setSettings({ ...settings, epic_week_bonus: e.target.value })}
                    placeholder="e.g., 5.00"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Bonus amount when epic day goal is met</p>
                </Field>
              </div>
            </div>

            {/* Bonus XP Section */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900">Bonus XP</h3>
                <p className="text-sm text-slate-600">Extra pay for XP earned above the threshold</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Bonus XP Per">
                  <input
                    type="number"
                    value={settings.bonus_xp_per || 50}
                    onChange={(e) => setSettings({ ...settings, bonus_xp_per: e.target.value })}
                    placeholder="e.g., 50"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Every X XP above the threshold...</p>
                </Field>
                <Field label="Bonus XP Rate ($ per XP)">
                  <input
                    type="number"
                    step="0.001"
                    value={settings.bonus_xp_rate || ''}
                    onChange={(e) => setSettings({ ...settings, bonus_xp_rate: e.target.value })}
                    placeholder="e.g., 0.01"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">...earns this amount</p>
                </Field>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-700">
                  <strong>Example:</strong> Every {settings.bonus_xp_per || 50} XP above {settings.xp_threshold || 0} = ${(parseFloat(settings.bonus_xp_rate || 0) * (parseFloat(settings.bonus_xp_per || 50))).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Mastery Tests Section */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900">Mastery Tests</h3>
                <p className="text-sm text-slate-600">Reward students for mastery test performance</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Mastery Min Score (%)">
                  <input
                    type="number"
                    value={settings.mastery_min_score || ''}
                    onChange={(e) => setSettings({ ...settings, mastery_min_score: e.target.value })}
                    placeholder="e.g., 70"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum score to earn pass pay</p>
                </Field>
                <Field label="Mastery Pass Pay ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.mastery_pass_pay || ''}
                    onChange={(e) => setSettings({ ...settings, mastery_pass_pay: e.target.value })}
                    placeholder="e.g., 2.50"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Reward for passing</p>
                </Field>
                <Field label="Mastery Perfect Pay ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.mastery_perfect_pay || ''}
                    onChange={(e) => setSettings({ ...settings, mastery_perfect_pay: e.target.value })}
                    placeholder="e.g., 5.00"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Reward for 100%</p>
                </Field>
              </div>
            </div>

            {/* Transfer Fees Section */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900">Transfer Fees</h3>
                <p className="text-sm text-slate-600">Fees charged when students move money between accounts</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Investment → Checking Fee (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.transfer_fee_invest_pct ?? 10}
                    onChange={(e) => setSettings({ ...settings, transfer_fee_invest_pct: e.target.value })}
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Fee for withdrawing from S&P 500 or NASDAQ to Checking</p>
                </Field>
                <Field label="Savings → Checking Fee (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.transfer_fee_savings_pct ?? 0}
                    onChange={(e) => setSettings({ ...settings, transfer_fee_savings_pct: e.target.value })}
                    placeholder="e.g., 0"
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Fee for early withdrawal from Savings</p>
                </Field>
              </div>
            </div>

            {/* Custom Bonuses Section */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Bonuses</h3>
                  <p className="text-sm text-slate-600">Add custom bonuses students can earn each week</p>
                </div>
                <button
                  onClick={() => {
                    const bonuses = [...(settings.custom_bonuses || [])]
                    bonuses.push({
                      id: `bonus_${Date.now()}`,
                      name: '',
                      amount: 0,
                      type: 'checkbox'
                    })
                    setSettings({ ...settings, custom_bonuses: bonuses })
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-sage-600 border-2 border-sage-300 rounded-lg hover:bg-sage-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Bonus
                </button>
              </div>

              {(settings.custom_bonuses || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-sm">No bonuses configured yet. Click "Add Bonus" to create one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(settings.custom_bonuses || []).map((bonus, idx) => (
                    <div key={bonus.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Bonus Name</label>
                            <input
                              type="text"
                              value={bonus.name}
                              onChange={(e) => {
                                const bonuses = [...settings.custom_bonuses]
                                bonuses[idx] = { ...bonuses[idx], name: e.target.value }
                                setSettings({ ...settings, custom_bonuses: bonuses })
                              }}
                              placeholder="e.g., SMART Goal"
                              className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">
                              {bonus.type === 'checkbox' ? 'Fixed Amount ($)' : 'Max Amount ($)'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={bonus.amount || ''}
                              onChange={(e) => {
                                const bonuses = [...settings.custom_bonuses]
                                bonuses[idx] = { ...bonuses[idx], amount: parseFloat(e.target.value) || 0 }
                                setSettings({ ...settings, custom_bonuses: bonuses })
                              }}
                              placeholder="0.00"
                              className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Student Input</label>
                            <select
                              value={bonus.type}
                              onChange={(e) => {
                                const bonuses = [...settings.custom_bonuses]
                                bonuses[idx] = { ...bonuses[idx], type: e.target.value }
                                setSettings({ ...settings, custom_bonuses: bonuses })
                              }}
                              className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 text-sm"
                            >
                              <option value="checkbox">Checkbox (fixed amount)</option>
                              <option value="student_amount">Student sets amount</option>
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const bonuses = settings.custom_bonuses.filter((_, i) => i !== idx)
                            setSettings({ ...settings, custom_bonuses: bonuses })
                          }}
                          className="p-2 rounded-lg hover:bg-rose-100 transition-colors mt-5"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        {bonus.type === 'checkbox'
                          ? `Students check a box to claim $${(bonus.amount || 0).toFixed(2)} for this bonus`
                          : `Students enter their own amount for this bonus`
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={savePaycheckSettings} disabled={saving} full>
              <Save className="w-4 h-4 mr-2 inline" />
              Save All Settings
            </Button>
          </div>
        )}
      </motion.div>

      {/* Job Manager Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900">Job Manager</h2>

        <div className="space-y-3">
          {jobs.map(job => (
            <motion.div
              key={job.id}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-sage transition-colors"
              whileHover={{ x: 2 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{job.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="text-sm text-slate-600">{job.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-right mr-4">
                <p className="font-bold text-lg text-sage">${job.weekly_pay}</p>
                <p className="text-xs text-slate-500">per week</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingJob(job)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="p-2 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {addingJob ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border-2 border-dashed border-slate-300 space-y-3"
          >
            <Field label="Job Title">
              <input
                type="text"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="e.g., Tutor"
                className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Job description"
                className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
              />
            </Field>
            <Field label="Icon (emoji)">
              <input
                type="text"
                value={newJob.icon}
                onChange={(e) => setNewJob({ ...newJob, icon: e.target.value })}
                placeholder="💼"
                maxLength="2"
                className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
              />
            </Field>
            <Field label="Weekly Pay ($)">
              <input
                type="number"
                step="0.01"
                value={newJob.weekly_pay}
                onChange={(e) => setNewJob({ ...newJob, weekly_pay: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
              />
            </Field>
            <div className="flex gap-2">
              <Button onClick={addJob} disabled={saving} full>
                Save Job
              </Button>
              <Button onClick={() => { setAddingJob(false); setNewJob({}); }} variant="ghost" full>
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <Button onClick={() => setAddingJob(true)} full>
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Job
          </Button>
        )}
      </motion.div>

      {/* Job Assignments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900">Job Assignments</h2>

        <div className="space-y-3">
          {students.map(student => (
            <motion.div
              key={student.id}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-200"
              whileHover={{ x: 2 }}
            >
              <p className="font-semibold text-slate-900">{student.full_name}</p>
              <select
                value={studentJobs[student.id] || ''}
                onChange={(e) => assignJobToStudent(student.id, e.target.value || null)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage"
              >
                <option value="">No job</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.icon} {job.title}
                  </option>
                ))}
              </select>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
