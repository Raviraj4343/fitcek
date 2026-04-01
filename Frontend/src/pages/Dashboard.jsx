import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const clampPercent = (value, max) => {
  if (value === null || value === undefined || Number.isNaN(Number(value)) || max <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((Number(value) / max) * 100)))
}

const getBmiCategory = (bmi) => {
  const numeric = Number(bmi)
  if (!numeric) return 'Awaiting profile data'
  if (numeric < 18.5) return 'Lean range'
  if (numeric < 25) return 'Balanced range'
  if (numeric < 30) return 'Elevated range'
  return 'High range'
}

const formatValue = (value, suffix = '') => {
  if (value === null || value === undefined) return '-'
  return `${value}${suffix}`
}

export default function Dashboard(){
  const { user } = useAuth() || {}
  const [stats, setStats] = useState({ bmi: null, requiredCalories: null, requiredProtein: null })
  const [today, setToday] = useState({ calories: 0, protein: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load(){
      try {
        const [res, todayRes] = await Promise.all([
          api.getHealthStats(),
          api.getTodayInsight().catch(() => null)
        ])
        if (!mounted) return
        const data = res?.data || {}
        const todayData = todayRes?.data?.today || {}
        setStats({
          bmi: data.bmi ?? null,
          requiredCalories: data.requiredCalories ?? null,
          requiredProtein: data.requiredProtein ?? null
        })
        setToday({
          calories: todayData.calories ?? 0,
          protein: todayData.protein ?? 0
        })
      } catch (e) {
        // keep graceful empty state
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const metricCards = [
    {
      id: 'bmi',
      label: 'BMI',
      value: loading ? '-' : formatValue(stats.bmi),
      note: getBmiCategory(stats.bmi),
      accent: 'teal',
      progress: clampPercent(stats.bmi, 35)
    },
    {
      id: 'calories',
      label: 'Daily Calories',
      value: loading ? '-' : formatValue(stats.requiredCalories),
      note: 'Estimated daily target',
      accent: 'blue',
      progress: clampPercent(stats.requiredCalories, 3200)
    },
    {
      id: 'protein',
      label: 'Protein Goal',
      value: loading ? '-' : formatValue(stats.requiredProtein, 'g'),
      note: 'Suggested daily intake',
      accent: 'green',
      progress: clampPercent(stats.requiredProtein, 180)
    }
  ]

  const summaryItems = [
    { label: 'Goal', value: user?.goal ? String(user.goal).replace(/_/g, ' ') : 'Complete profile' },
    { label: 'Activity', value: user?.activityLevel ? String(user.activityLevel).replace(/_/g, ' ') : 'Not set' },
    { label: 'Diet', value: user?.dietPreference ? String(user.dietPreference).replace(/_/g, ' ') : 'Not set' },
    { label: 'Weight', value: user?.weightKg ? `${user.weightKg} kg` : 'Not set' }
  ]

  const pulseRows = [
    { label: 'Body balance', value: metricCards[0].progress },
    { label: 'Energy target', value: metricCards[1].progress },
    { label: 'Recovery fuel', value: metricCards[2].progress }
  ]

  return (
    <div className="page dashboard dashboard-page">
      <section className="dashboard-hero card">
        <div className="dashboard-hero-copy">
          <span className="dashboard-eyebrow">Daily overview</span>
          <h1>Dashboard</h1>
          <p className="muted">
            A clean view of your health targets, profile signals, and what deserves attention today.
          </p>

          <div className="dashboard-hero-badges">
            <span className="dashboard-badge">{metricCards[0].note}</span>
            <span className="dashboard-badge">Simple, focused progress tracking</span>
          </div>
        </div>

        <div className="dashboard-hero-visual" aria-hidden="true">
          <div className="dashboard-orbit">
            <div className="dashboard-orbit-core">
              <span className="dashboard-orbit-label">Today</span>
              <strong>{loading ? '-' : formatValue(today.calories)}</strong>
              <span className="dashboard-orbit-caption">calories</span>
            </div>
          </div>
          <div className="dashboard-hero-mini-stats">
            <div>
              <span>BMI</span>
              <strong>{loading ? '-' : formatValue(stats.bmi)}</strong>
            </div>
            <div>
              <span>Protein</span>
              <strong>{loading ? '-' : formatValue(today.protein, 'g')}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid dashboard-metrics">
        {metricCards.map((metric) => (
          <Card key={metric.id} className={`stat-card stat-card-${metric.accent}`}>
            <div className="stat-row">
              <div className="stat-icon" aria-hidden="true">
                <span className="stat-icon-dot" />
              </div>
              <div className="stat-copy">
                <div className="stat-label">{metric.label}</div>
                <div className="stat-value">{metric.value}</div>
                <div className="stat-note">{metric.note}</div>
              </div>
            </div>
            <div className="stat-progress" aria-hidden="true">
              <span style={{ width: `${metric.progress}%` }} />
            </div>
          </Card>
        ))}
      </section>

      <section className="dashboard-grid dashboard-layout">
        <Card className="activity-card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Wellness pulse</h3>
              <p className="muted">A compact view of your key markers, without the visual clutter.</p>
            </div>
          </div>

          <div className="dashboard-pulse-list">
            {pulseRows.map((row) => (
              <div key={row.label} className="dashboard-pulse-row">
                <div className="dashboard-pulse-copy">
                  <span>{row.label}</span>
                  <strong>{row.value}%</strong>
                </div>
                <div className="dashboard-pulse-track" aria-hidden="true">
                  <span style={{ width: `${row.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-callout">
            <strong>Recent activity</strong>
            <p className="muted">
              No recent activity is available yet. Once you start logging meals, weight, or daily data, your timeline will appear here.
            </p>
          </div>
        </Card>

        <Card className="subs-card dashboard-panel dashboard-profile-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Profile snapshot</h3>
              <p className="muted">A lean summary of the settings shaping your recommendations.</p>
            </div>
          </div>

          <div className="dashboard-summary-list">
            {summaryItems.map((item) => (
              <div key={item.label} className="dashboard-summary-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <Link to="/profile" className="dashboard-link-cta">Open profile</Link>
        </Card>
      </section>
    </div>
  )
}
