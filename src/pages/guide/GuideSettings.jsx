import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { FinTip, Button, Field, Toast } from '../../components/shared'
import { supabase } from '../../lib/supabase'

export const GuideSettings = () => {
  const [activeSession, setActiveSession] = useState(null)
  const [settings, setSettings] = useState(null)
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

      const [sessionRes, settingsRes, jobsRes, profilesRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1),
        null,
        null,
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

        const [settingsRes2, jobsRes2] = await Promise.all([
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

        setSettings(settingsRes2.data)
        setJobs(jobsRes2.data || [])
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
      const { error } = await supabase
        .from('paycheck_settings')
        .update({
          xp_threshold: parseFloat(settings.xp_threshold) || 0,
          base_pay: parseFloat(settings.base_pay) || 0,
          epic_week_bonus: parseFloat(settings.epic_week_bonus) || 0,
          bonus_xp_rate: parseFloat(settings.bonus_xp_rate) || 0,
          mastery_pass_pay: parseFloat(settings.mastery_pass_pay) || 0,
          mastery_perfect_pay: parseFloat(settings.mastery_perfect_pay) || 0,
          mastery_min_score: parseFloat(settings.mastery_min_score) || 0,
          transfer_fee_pct: parseFloat(settings.transfer_fee_pct) || 0
        })
        .eq('session_id', activeSession.id)

      if (error) throw error
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

  const toggleRole = async (profileId, newRole) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId)

      if (error) throw error
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, role: newRole } : p))
      setToast({ type: 'success', text: `User promoted to ${newRole}` })
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to update role' })
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
        <p className="text-lg text-slate-600">Configure game rules and job assignments</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900">Paycheck Rules</h2>

        <FinTip
          icon="⚙️"
          title="Understanding Paycheck Settings"
          color="from-sage-50 to-green-50"
        >
          <p className="space-y-2">
            <div><strong>XP Threshold:</strong> Minimum XP needed to earn bonus XP pay</div>
            <div><strong>Base Pay:</strong> Weekly earning for completing assignments</div>
            <div><strong>Epic Week Bonus:</strong> Bonus for completing all assignments</div>
            <div><strong>Bonus XP Rate:</strong> Pay per XP above threshold (e.g., $0.01 per XP)</div>
            <div><strong>Mastery:</strong> Pay for passing/perfect scores on skill mastery</div>
            <div><strong>Transfer Fee:</strong> Percentage cost to transfer between accounts</div>
          </p>
        </FinTip>

        {settings && (
          <div className="space-y-4 p-6 rounded-lg border border-slate-200 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="XP Threshold">
                <input
                  type="number"
                  value={settings.xp_threshold || ''}
                  onChange={(e) => setSettings({ ...settings, xp_threshold: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
              <Field label="Base Pay ($)">
                <input
                  type="number"
                  step="0.01"
                  value={settings.base_pay || ''}
                  onChange={(e) => setSettings({ ...settings, base_pay: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
              <Field label="Epic Week Bonus ($)">
                <input
                  type="number"
                  step="0.01"
                  value={settings.epic_week_bonus || ''}
                  onChange={(e) => setSettings({ ...settings, epic_week_bonus: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
              <Field label="Bonus XP Rate ($ per XP)">
                <input
                  type="number"
                  step="0.001"
                  value={settings.bonus_xp_rate || ''}
                  onChange={(e) => setSettings({ ...settings, bonus_xp_rate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
              <Field label="Mastery Pass Pay ($)">
                <input
                  type="number"
                  step="0.01"
                  value={settings.mastery_pass_pay || ''}
                  onChange={(e) => setSettings({ ...settings, mastery_pass_pay: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
              <Field label="Mastery Perfect Pay ($)">
                <input
                  type="number"
                  step="0.01"
                  value={settings.mastery_perfect_pay || ''}
                  onChange={(e) => setSettings({ ...settings, mastery_perfect_pay: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
              <Field label="Mastery Min Score (%)">
                <input
                  type="number"
                  value={settings.mastery_min_score || ''}
                  onChange={(e) => setSettings({ ...settings, mastery_min_score: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
              <Field label="Transfer Fee (%)">
                <input
                  type="number"
                  step="0.1"
                  value={settings.transfer_fee_pct || ''}
                  onChange={(e) => setSettings({ ...settings, transfer_fee_pct: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-100"
                />
              </Field>
            </div>

            <Button onClick={savePaycheckSettings} disabled={saving} full>
              <Save className="w-4 h-4 mr-2 inline" />
              Save Settings
            </Button>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900">Role Management</h2>

        <div className="space-y-2">
          {profiles.map(profile => (
            <motion.div
              key={profile.id}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-200"
              whileHover={{ x: 2 }}
            >
              <div>
                <p className="font-semibold text-slate-900">{profile.full_name}</p>
                <p className="text-sm text-slate-600 capitalize">{profile.role}</p>
              </div>
              <div className="space-x-2">
                {profile.role !== 'student' && (
                  <button
                    onClick={() => toggleRole(profile.id, 'student')}
                    className="px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Make Student
                  </button>
                )}
                {profile.role !== 'guide' && (
                  <button
                    onClick={() => toggleRole(profile.id, 'guide')}
                    className="px-3 py-1 rounded-lg text-sm font-semibold bg-sage-bg text-sage hover:bg-sage-100 transition-colors"
                  >
                    Make Guide
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
