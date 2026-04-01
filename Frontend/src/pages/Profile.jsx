import React, { useState, useEffect } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import ConfirmationModal from '../components/ConfirmationModal'
import * as api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const GENDERS = ['male', 'female', 'other']
const GOALS = [
  { v: 'weight_loss', l: 'Weight loss' },
  { v: 'muscle_gain', l: 'Muscle gain' },
  { v: 'maintain', l: 'Maintain' }
]
const ACTIVITY = ['sedentary', 'light', 'moderate', 'active']
const DIETS = ['veg', 'non_veg', 'mixed']

const EMPTY_FORM = {
  name: '',
  age: '',
  gender: 'male',
  heightCm: '',
  weightKg: '',
  bodyFatPercent: '',
  goal: 'maintain',
  activityLevel: 'moderate',
  dietPreference: 'mixed'
}

const prettify = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export default function Profile(){
  const { user, refresh } = useAuth() || {}
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState('')
  const [pendingSavePayload, setPendingSavePayload] = useState(null)

  useEffect(() => {
    if (!user) return

    setAvatarPreview(user.avatarUrl || null)
    setForm({
      name: user.name ?? '',
      age: user.age ?? '',
      gender: user.gender ?? 'male',
      heightCm: user.heightCm ?? '',
      weightKg: user.weightKg ?? '',
      bodyFatPercent: user.bodyFatPercent ?? '',
      goal: user.goal ?? 'maintain',
      activityLevel: user.activityLevel ?? 'moderate',
      dietPreference: user.dietPreference ?? 'mixed'
    })
    setIsEditing(!user.profileCompleted)
  }, [user])

  const validate = (values) => {
    const e = {}
    if (!values.name?.trim() || values.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!values.age || values.age < 10 || values.age > 120) e.age = 'Age must be 10-120'
    if (!GENDERS.includes(values.gender)) e.gender = 'Invalid gender'
    if (!values.heightCm || values.heightCm < 50 || values.heightCm > 300) e.heightCm = 'Height 50-300 cm'
    if (!values.weightKg || values.weightKg < 10 || values.weightKg > 500) e.weightKg = 'Weight 10-500 kg'
    if (values.bodyFatPercent !== '' && (values.bodyFatPercent < 1 || values.bodyFatPercent > 70)) e.bodyFatPercent = 'Body fat 1-70%'
    if (!GOALS.some((goal) => goal.v === values.goal)) e.goal = 'Invalid goal'
    if (!ACTIVITY.includes(values.activityLevel)) e.activityLevel = 'Invalid activity level'
    if (!DIETS.includes(values.dietPreference)) e.dietPreference = 'Invalid diet'
    return e
  }

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setStatus('')
  }

  const resetFormFromUser = () => {
    if (!user) return
    setForm({
      name: user.name ?? '',
      age: user.age ?? '',
      gender: user.gender ?? 'male',
      heightCm: user.heightCm ?? '',
      weightKg: user.weightKg ?? '',
      bodyFatPercent: user.bodyFatPercent ?? '',
      goal: user.goal ?? 'maintain',
      activityLevel: user.activityLevel ?? 'moderate',
      dietPreference: user.dietPreference ?? 'mixed'
    })
    setErrors({})
  }

  const performSave = async (payload) => {
    setSaving(true)
    setStatus('')
    try {
      if (user?.profileCompleted) await api.updateProfile(payload)
      else await api.setupProfile(payload)
      await refresh()
      setIsEditing(false)
      setStatus('Profile saved successfully.')
    } catch (err) {
      setStatus(err?.payload?.message || err.message || 'Unable to save profile right now.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const values = { ...form }
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = {
      name: values.name.trim(),
      age: Number(values.age),
      gender: values.gender,
      heightCm: Number(values.heightCm),
      weightKg: Number(values.weightKg),
      bodyFatPercent: values.bodyFatPercent === '' ? undefined : Number(values.bodyFatPercent),
      goal: values.goal,
      activityLevel: values.activityLevel,
      dietPreference: values.dietPreference
    }

    setPendingSavePayload(payload)
  }

  const handleAvatarChange = (file) => {
    if (!file) return
    setAvatarFile(file)
    setStatus('')
    try {
      setAvatarPreview(URL.createObjectURL(file))
    } catch (e) {}
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setStatus('Choose an image before uploading.')
      return
    }

    setUploading(true)
    setStatus('')
    try {
      await api.uploadAvatar(avatarFile)
      await refresh()
      setAvatarFile(null)
      setStatus('Avatar uploaded successfully.')
    } catch (err) {
      setStatus(err?.payload?.message || err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelEdit = () => {
    resetFormFromUser()
    setIsEditing(false)
    setStatus('')
  }

  const profileSummary = [
    { label: 'Goal', value: prettify(user?.goal || form.goal) },
    { label: 'Activity', value: prettify(user?.activityLevel || form.activityLevel) },
    { label: 'Diet', value: prettify(user?.dietPreference || form.dietPreference) }
  ]

  const showEditableForm = isEditing || !user?.profileCompleted

  return (
    <>
      <div className="page profile-page">
        <div className="page-top profile-top">
          <div>
            <h1>Profile</h1>
            <p className="muted">
              {user?.profileCompleted
                ? 'Keep your health details current so your dashboard and insights stay accurate.'
                : 'Complete your profile to unlock tailored recommendations and tracking.'}
            </p>
          </div>
        </div>

        <div className="card profile-card profile-shell">
          <section className="profile-hero">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={`${user?.name || 'User'} avatar`} className="profile-avatar-image" />
                ) : (
                  <span className="profile-avatar-fallback" aria-hidden="true">
                    {(user?.name || form.name || 'U').trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="profile-avatar-actions">
                <div className="profile-avatar-head">
                  <div className="profile-avatar-copy">
                    <h2>{user?.name || form.name || 'Your profile'}</h2>
                    <p>{user?.email || 'Add your details and a photo to personalize your account.'}</p>
                  </div>
                  {user?.profileCompleted && !isEditing ? (
                    <Button onClick={() => { setIsEditing(true); setStatus('') }} className="profile-edit-trigger">
                      Edit
                    </Button>
                  ) : null}
                </div>

                <div className="profile-upload-row">
                  <label htmlFor="avatar" className="profile-file-label">Choose image</label>
                  <input id="avatar" className="profile-file-input" type="file" accept="image/*" onChange={(e) => handleAvatarChange(e.target.files?.[0])} />
                  <span className="profile-file-name">{avatarFile ? avatarFile.name : 'PNG, JPG, or WEBP up to 5 MB'}</span>
                </div>

                <div className="profile-upload-actions">
                  <Button onClick={handleAvatarUpload} disabled={uploading || !avatarFile}>
                    {uploading ? 'Uploading...' : 'Upload avatar'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="profile-summary-grid">
              {profileSummary.map((item) => (
                <div key={item.label} className="profile-summary-card">
                  <span className="profile-summary-label">{item.label}</span>
                  <strong className="profile-summary-value">{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          {status ? <div className="profile-status">{status}</div> : null}

          {showEditableForm ? (
            <form className="profile-form profile-form-panel" onSubmit={handleSubmit} noValidate>
            <Input
              id="profile-name"
              label="Name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-text">{errors.name}</div>}

            <Input
              id="profile-age"
              label="Age"
              type="number"
              value={form.age}
              onChange={(e) => handleChange('age', e.target.value === '' ? '' : Number(e.target.value))}
              className={errors.age ? 'error' : ''}
            />
            {errors.age && <div className="error-text">{errors.age}</div>}

            <label className="field-label">Gender</label>
            <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className={errors.gender ? 'error-select' : ''}>
              {GENDERS.map((gender) => <option key={gender} value={gender}>{prettify(gender)}</option>)}
            </select>
            {errors.gender && <div className="error-text">{errors.gender}</div>}

            <Input
              id="profile-height"
              label="Height (cm)"
              type="number"
              value={form.heightCm}
              onChange={(e) => handleChange('heightCm', e.target.value === '' ? '' : Number(e.target.value))}
              className={errors.heightCm ? 'error' : ''}
            />
            {errors.heightCm && <div className="error-text">{errors.heightCm}</div>}

            <Input
              id="profile-weight"
              label="Weight (kg)"
              type="number"
              value={form.weightKg}
              onChange={(e) => handleChange('weightKg', e.target.value === '' ? '' : Number(e.target.value))}
              className={errors.weightKg ? 'error' : ''}
            />
            {errors.weightKg && <div className="error-text">{errors.weightKg}</div>}

            <Input
              id="profile-body-fat"
              label="Body fat % (optional)"
              type="number"
              value={form.bodyFatPercent}
              onChange={(e) => handleChange('bodyFatPercent', e.target.value === '' ? '' : Number(e.target.value))}
              className={errors.bodyFatPercent ? 'error' : ''}
            />
            {errors.bodyFatPercent && <div className="error-text">{errors.bodyFatPercent}</div>}

            <label className="field-label">Goal</label>
            <select value={form.goal} onChange={(e) => handleChange('goal', e.target.value)} className={errors.goal ? 'error-select' : ''}>
              {GOALS.map((goal) => <option key={goal.v} value={goal.v}>{goal.l}</option>)}
            </select>
            {errors.goal && <div className="error-text">{errors.goal}</div>}

            <label className="field-label">Activity level</label>
            <select value={form.activityLevel} onChange={(e) => handleChange('activityLevel', e.target.value)} className={errors.activityLevel ? 'error-select' : ''}>
              {ACTIVITY.map((activity) => <option key={activity} value={activity}>{prettify(activity)}</option>)}
            </select>
            {errors.activityLevel && <div className="error-text">{errors.activityLevel}</div>}

            <label className="field-label">Diet preference</label>
            <select value={form.dietPreference} onChange={(e) => handleChange('dietPreference', e.target.value)} className={errors.dietPreference ? 'error-select' : ''}>
              {DIETS.map((diet) => <option key={diet} value={diet}>{prettify(diet)}</option>)}
            </select>
            {errors.dietPreference && <div className="error-text">{errors.dietPreference}</div>}

            <div className="profile-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : user?.profileCompleted ? 'Save changes' : 'Save profile'}
              </Button>
              {user?.profileCompleted ? (
                <Button type="button" variant="ghost" className="profile-cancel-btn" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              ) : null}
            </div>
            </form>
          ) : (
            <section className="profile-overview">
              <div className="profile-overview-grid">
                <div className="profile-detail-card">
                  <span className="profile-detail-label">Full name</span>
                  <strong>{user?.name}</strong>
                </div>
                <div className="profile-detail-card">
                  <span className="profile-detail-label">Email</span>
                  <strong>{user?.email}</strong>
                </div>
                <div className="profile-detail-card">
                  <span className="profile-detail-label">Age</span>
                  <strong>{user?.age || 'Not set'}</strong>
                </div>
                <div className="profile-detail-card">
                  <span className="profile-detail-label">Gender</span>
                  <strong>{prettify(user?.gender || 'Not set')}</strong>
                </div>
                <div className="profile-detail-card">
                  <span className="profile-detail-label">Height</span>
                  <strong>{user?.heightCm ? `${user.heightCm} cm` : 'Not set'}</strong>
                </div>
                <div className="profile-detail-card">
                  <span className="profile-detail-label">Weight</span>
                  <strong>{user?.weightKg ? `${user.weightKg} kg` : 'Not set'}</strong>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      <ConfirmationModal
        open={Boolean(pendingSavePayload)}
        eyebrow={user?.profileCompleted ? 'Review Changes' : 'Complete Profile'}
        title={user?.profileCompleted ? 'Save these profile updates?' : 'Save your profile now?'}
        description={
          user?.profileCompleted
            ? 'Your dashboard, recommendations, and health tracking will refresh with these new details.'
            : 'This will complete your profile and unlock personalized guidance across the app.'
        }
        confirmLabel={saving ? 'Saving...' : user?.profileCompleted ? 'Save changes' : 'Save profile'}
        cancelLabel="Keep editing"
        confirmDisabled={saving}
        cancelDisabled={saving}
        onClose={() => {
          if (saving) return
          setPendingSavePayload(null)
        }}
        onConfirm={async () => {
          if (!pendingSavePayload || saving) return
          const payload = pendingSavePayload
          setPendingSavePayload(null)
          await performSave(payload)
        }}
      />
    </>
  )
}
