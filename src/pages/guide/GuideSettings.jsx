import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Save, X, UserPlus, Shield, Crown } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('classroom')
  const [guides, setGuides] = useState([])
  const [newGuideEmail, setNewGuideEmail] = useState('')
  const [addingGuide, setAddingGuide] = useState(false)

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

      // Fetch guides from guide_classrooms
      if (sessionRes.data && sessionRes.data.length > 0) {
        const guidesRes = await supabase
          .from('guide_classrooms')
          .select('*, guide:profiles!guide_id(id, full_name, email)')
          .eq('session_id', sessionRes.data[0].id)
          .order('created_at')

        setGuides(guidesRes.data || [])
      }

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
          transfer_fee_invest_pct: 0,
          transfer_fee_savings_pct: 0,
          transfer_fee_pct: 0,
          savings_interest_rate: parseFloat(settings.savings_interest_rate) || 4.5,
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
          icon: newJob.icon || '',
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

  const addGuide = async (email) => {
    if (!email.trim() || !activeSession) {
      setToast({ type: 'error', text: 'Please enter an email address' })
      return
    }

    try {
      setAddingGuide(true)

      // Look up profile by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', email.toLowerCase())
        .single()

      if (profileError || !profileData) {
        setToast({ type: 'error', text: 'Profile not found for this email' })
        return
      }

      // Insert into guide_classrooms with role 'guide'
      const { data: newGuideData, error: insertError } = await supabase
        .from('guide_classrooms')
        .insert({
          session_id: activeSession.id,
          guide_id: profileData.id,
          role: 'guide'
        })
        .select('*, guide:profiles!guide_id(id, full_name, email)')

      if (insertError) throw insertError

      setGuides([...guides, newGuideData[0]])
      setNewGuideEmail('')
      setToast({ type: 'success', text: 'Guide added successfully' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to add guide' })
    } finally {
      setAddingGuide(false)
    }
  }

  const removeGuide = async (guideId, role) => {
    if (role === 'lead_guide') {
      setToast({ type: 'error', text: 'Cannot remove the lead guide' })
      return
    }

    if (!window.confirm('Remove this guide?')) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('guide_classrooms')
        .delete()
        .eq('id', guideId)

      if (error) throw error

      setGuides(guides.filter(g => g.id !== guideId))
      setToast({ type: 'success', text: 'Guide removed' })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to remove guide' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-muted dark:text-white/50">No active session. Start a session in Session Management first.</p>
      </div>
    )
  }

  const students = profiles.filter(p => p.role === 'student')

  return (
    <div className="space-y-6 p-8">
      <Toast message={toast} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-ink dark:text-chalk-white font-hand">Settings</h1>
        <p className="text-lg text-ink-muted dark:text-white/50">Configure classroom, game rules, and job assignments</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 border-b border-black/[0.08] dark:border-white/[0.06]"
      >
        <button
          onClick={() => setActiveTab('classroom')}
          className={`px-4 py-3 rounded-sm text-sm font-semibold font-hand transition-colors ${
            activeTab === 'classroom'
              ? 'bg-pencil dark:bg-pencil text-ink dark:text-ink'
              : 'text-ink-muted dark:text-white/50 hover:text-ink dark:hover:text-white'
          }`}
        >
          Classroom
        </button>
        <button
          onClick={() => setActiveTab('payrules')}
          className={`px-4 py-3 rounded-sm text-sm font-semibold transition-colors ${
            activeTab === 'payrules'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
          }`}
        >
          Pay Rules
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-3 rounded-sm text-sm font-semibold transition-colors ${
            activeTab === 'jobs'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
          }`}
        >
          Jobs
        </button>
      </motion.div>

      {/* Classroom Tab */}
      {activeTab === 'classroom' && (
        <>
        {/* My Classroom Section */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-extrabold text-ink dark:text-chalk-white font-hand">My Classroom</h2>

        {activeSession && (
          <div className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] bg-white space-y-4">
            <div>
              <Field label="Class Name">
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Alpha Middle School San Francisco"
                  className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                />
              </Field>
              <div className="flex justify-end mt-2">
                <button
                  onClick={savePaycheckSettings}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold bg-ink dark:bg-chalk-white text-white dark:text-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-ink dark:text-chalk-white mb-3 font-hand">Students in Class ({students.length})</h3>
              {students.length > 0 ? (
                <div className="space-y-2">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center p-3 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/5 bg-gray-50"
                    >
                      <span className="text-ink dark:text-chalk-white font-medium">{student.full_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ink-faint dark:text-white/40 italic">No students in this classroom yet</p>
              )}
            </div>

            {/* Co-Guides Section */}
            <div className="border-t border-black/[0.08] dark:border-white/[0.06] pt-4">
              <h3 className="font-semibold text-ink dark:text-chalk-white mb-3 font-hand">Co-Guides ({guides.length})</h3>

              {guides.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {guides.map(guide => (
                    <div
                      key={guide.id}
                      className="flex items-center justify-between p-3 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/5 bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {guide.role === 'lead_guide' ? (
                          <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        )}
                        <div>
                          <p className="text-ink dark:text-chalk-white font-medium">{guide.guide.full_name}</p>
                          <p className="text-xs text-ink-muted dark:text-white/40">{guide.guide.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                          {guide.role === 'lead_guide' ? 'Lead Guide' : 'Guide'}
                        </span>
                        {guide.role !== 'lead_guide' && (
                          <button
                            onClick={() => removeGuide(guide.id, guide.role)}
                            disabled={saving}
                            className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50"
                            title="Remove guide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ink-faint dark:text-white/40 italic mb-4">No co-guides added yet</p>
              )}

              {/* Add Guide Form */}
              <div className="border-t border-black/[0.08] dark:border-white/[0.06] pt-4 mt-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newGuideEmail}
                      onChange={(e) => setNewGuideEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGuide(newGuideEmail)}
                      placeholder="Enter guide email address"
                      className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => addGuide(newGuideEmail)}
                    disabled={addingGuide || !newGuideEmail.trim()}
                    className="px-4 py-2 text-sm font-semibold bg-teal-600 dark:bg-teal-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {addingGuide ? 'Adding...' : 'Add Guide'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
        </>
      )}

      {/* Pay Rules Tab */}
      {activeTab === 'payrules' && (
        <>
      {/* Paycheck Rules Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-extrabold text-ink dark:text-chalk-white font-hand">Paycheck Rules</h2>

        {settings && (
          <div className="space-y-4">
            {/* Base Pay Section */}
            <div className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-ink dark:text-chalk-white">Base Pay</h3>
                <p className="text-sm text-ink-muted dark:text-white/50">Students earn base pay when they reach the weekly XP threshold</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="XP Threshold">
                  <input
                    type="number"
                    value={settings.xp_threshold || ''}
                    onChange={(e) => setSettings({ ...settings, xp_threshold: e.target.value })}
                    placeholder="e.g., 500"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Minimum weekly XP to earn base pay</p>
                </Field>
                <Field label="Base Pay ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.base_pay || ''}
                    onChange={(e) => setSettings({ ...settings, base_pay: e.target.value })}
                    placeholder="e.g., 10.00"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Amount earned when threshold is met</p>
                </Field>
              </div>
            </div>

            {/* Epic Bonus Section */}
            <div className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-ink dark:text-chalk-white">Epic Bonus</h3>
                <p className="text-sm text-ink-muted dark:text-white/50">Reward students for having epic (productive) days</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Epic Days Required">
                  <input
                    type="number"
                    value={settings.epic_days_required || 5}
                    onChange={(e) => setSettings({ ...settings, epic_days_required: e.target.value })}
                    placeholder="e.g., 5"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">How many epic days needed for the bonus</p>
                </Field>
                <Field label="Epic Week Bonus ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.epic_week_bonus || ''}
                    onChange={(e) => setSettings({ ...settings, epic_week_bonus: e.target.value })}
                    placeholder="e.g., 5.00"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Bonus amount when epic day goal is met</p>
                </Field>
              </div>
            </div>

            {/* Bonus XP Section */}
            <div className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-ink dark:text-chalk-white">Bonus XP</h3>
                <p className="text-sm text-ink-muted dark:text-white/50">Extra pay for XP earned above the threshold</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Bonus XP Per">
                  <input
                    type="number"
                    value={settings.bonus_xp_per || 50}
                    onChange={(e) => setSettings({ ...settings, bonus_xp_per: e.target.value })}
                    placeholder="e.g., 50"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Every X XP above the threshold...</p>
                </Field>
                <Field label="Bonus XP Rate ($ per XP)">
                  <input
                    type="number"
                    step="0.001"
                    value={settings.bonus_xp_rate || ''}
                    onChange={(e) => setSettings({ ...settings, bonus_xp_rate: e.target.value })}
                    placeholder="e.g., 0.01"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">...earns this amount</p>
                </Field>
              </div>
              <div className="p-3 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <p className="text-sm text-gray-700 dark:text-white/70">
                  <strong>Example:</strong> Every {settings.bonus_xp_per || 50} XP above {settings.xp_threshold || 0} = ${(parseFloat(settings.bonus_xp_rate || 0) * (parseFloat(settings.bonus_xp_per || 50))).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Mastery Tests Section */}
            <div className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-ink dark:text-chalk-white">Mastery Tests</h3>
                <p className="text-sm text-ink-muted dark:text-white/50">Reward students for mastery test performance</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Mastery Min Score (%)">
                  <input
                    type="number"
                    value={settings.mastery_min_score || ''}
                    onChange={(e) => setSettings({ ...settings, mastery_min_score: e.target.value })}
                    placeholder="e.g., 70"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Minimum score to earn pass pay</p>
                </Field>
                <Field label="Mastery Pass Pay ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.mastery_pass_pay || ''}
                    onChange={(e) => setSettings({ ...settings, mastery_pass_pay: e.target.value })}
                    placeholder="e.g., 2.50"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Reward for passing</p>
                </Field>
                <Field label="Mastery Perfect Pay ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.mastery_perfect_pay || ''}
                    onChange={(e) => setSettings({ ...settings, mastery_perfect_pay: e.target.value })}
                    placeholder="e.g., 5.00"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Reward for 100%</p>
                </Field>
              </div>
            </div>

            {/* Growth & Interest Section */}
            <div className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] bg-white space-y-4">
              <div>
                <h3 className="font-semibold text-ink dark:text-chalk-white">Growth & Interest</h3>
                <p className="text-sm text-ink-muted dark:text-white/50">Controls how student savings grow over time. Investments track real market performance automatically.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Savings Interest Rate (APY %)">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.savings_interest_rate ?? 4.5}
                    onChange={(e) => setSettings({ ...settings, savings_interest_rate: e.target.value })}
                    placeholder="e.g., 4.5"
                    className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
                  />
                  <p className="text-xs text-ink-faint dark:text-white/40 mt-1">Annual interest rate applied daily to savings accounts (default: 4.5%)</p>
                </Field>
                <div className="p-4 bg-stone-50 dark:bg-white/[0.03] rounded-sm border border-black/[0.05] dark:border-white/[0.04]">
                  <p className="text-xs font-semibold text-ink dark:text-chalk-white mb-1">How it works</p>
                  <p className="text-xs text-ink-muted dark:text-white/50 leading-relaxed">
                    Savings earn daily compound interest at this rate. S&P 500 and NASDAQ accounts automatically track real market performance — no setup needed. Transfers between accounts are free.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Bonuses Section */}
            <div className="p-6 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-ink dark:text-chalk-white">Bonuses</h3>
                  <p className="text-sm text-ink-muted dark:text-white/50">Add custom bonuses students can earn each week</p>
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
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-stone-600 dark:text-stone-400 border-2 border-stone-300 dark:border-white/10 rounded-sm hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Bonus
                </button>
              </div>

              {(settings.custom_bonuses || []).length === 0 ? (
                <div className="text-center py-6 text-ink-faint dark:text-white/40 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-sm">
                  <p className="text-sm">No bonuses configured yet. Click "Add Bonus" to create one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(settings.custom_bonuses || []).map((bonus, idx) => (
                    <div key={bonus.id} className="p-4 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/5 bg-gray-50 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-ink-muted dark:text-white/50 mb-1 block">Bonus Name</label>
                            <input
                              type="text"
                              value={bonus.name}
                              onChange={(e) => {
                                const bonuses = [...settings.custom_bonuses]
                                bonuses[idx] = { ...bonuses[idx], name: e.target.value }
                                setSettings({ ...settings, custom_bonuses: bonuses })
                              }}
                              placeholder="e.g., SMART Goal"
                              className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-ink-muted dark:text-white/50 mb-1 block">
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
                              className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-ink-muted dark:text-white/50 mb-1 block">Student Input</label>
                            <select
                              value={bonus.type}
                              onChange={(e) => {
                                const bonuses = [...settings.custom_bonuses]
                                bonuses[idx] = { ...bonuses[idx], type: e.target.value }
                                setSettings({ ...settings, custom_bonuses: bonuses })
                              }}
                              className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/[0.04] dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10 text-sm"
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
                          className="p-2 rounded-sm hover:bg-red-100 transition-colors mt-5"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      <p className="text-xs text-ink-faint dark:text-white/40">
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
        </>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <>
      {/* Job Manager Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-extrabold text-ink dark:text-chalk-white font-hand">Job Manager</h2>

        <div className="space-y-3">
          {jobs.map(job => (
            <motion.div
              key={job.id}
              className="flex items-center justify-between p-4 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04] hover:border-stone-400 transition-colors"
              whileHover={{ x: 2 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{job.icon}</span>
                  <div>
                    <p className="font-semibold text-ink dark:text-chalk-white">{job.title}</p>
                    <p className="text-sm text-ink-muted dark:text-white/50">{job.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-right mr-4">
                <p className="font-bold text-lg text-stone-600 dark:text-stone-400">${job.weekly_pay}</p>
                <p className="text-xs text-ink-faint dark:text-white/40">per week</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingJob(job)}
                  className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-ink-muted dark:text-white/50" />
                </button>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="p-2 rounded-sm hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {addingJob ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-sm border-2 border-dashed border-gray-200 dark:border-white/10 dark:bg-white/[0.04]/50 space-y-3"
          >
            <Field label="Job Title">
              <input
                type="text"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="e.g., Tutor"
                className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Job description"
                className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
              />
            </Field>
            <Field label="Icon (emoji)">
              <input
                type="text"
                value={newJob.icon}
                onChange={(e) => setNewJob({ ...newJob, icon: e.target.value })}
                placeholder=""
                maxLength="2"
                className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
              />
            </Field>
            <Field label="Weekly Pay ($)">
              <input
                type="number"
                step="0.01"
                value={newJob.weekly_pay}
                onChange={(e) => setNewJob({ ...newJob, weekly_pay: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-500/10"
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
        <h2 className="text-2xl font-extrabold text-ink dark:text-chalk-white font-hand">Job Assignments</h2>

        <div className="space-y-3">
          {students.map(student => (
            <motion.div
              key={student.id}
              className="flex items-center justify-between p-4 rounded-sm border border-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.04]"
              whileHover={{ x: 2 }}
            >
              <p className="font-semibold text-ink dark:text-chalk-white">{student.full_name}</p>
              <select
                value={studentJobs[student.id] || ''}
                onChange={(e) => assignJobToStudent(student.id, e.target.value || null)}
                className="px-3 py-2 rounded-sm border border-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:border-stone-400"
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
        </>
      )}
    </div>
  )
}
