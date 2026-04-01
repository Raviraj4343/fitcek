import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const clampPercent = (value, max) => {
  if (value === null || value === undefined || Number.isNaN(Number(value)) || max <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((Number(value) / max) * 100)))
}

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

const getBodyBalanceScore = (bmi) => {
  const numeric = Number(bmi)
  if (!numeric) return 0
  const idealBmi = 22
  return clamp(Math.round(100 - Math.abs(numeric - idealBmi) * 12))
}

const toTitle = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const formatTimelineDate = (isoDate) => {
  if (!isoDate) return 'Recently'
  const now = new Date()
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate

  const dayDiff = Math.floor((now.setHours(0, 0, 0, 0) - date.getTime()) / 86400000)
  if (dayDiff <= 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'
  return `${dayDiff}d ago`
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

const prettify = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export default function Dashboard(){
  const { user } = useAuth() || {}
  const [stats, setStats] = useState({ bmi: null, requiredCalories: null, requiredProtein: null })
  const [today, setToday] = useState({ calories: 0, protein: 0 })
  const [activityItems, setActivityItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePulse, setActivePulse] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load(){
      try {
        const [res, todayRes, historyRes, weightRes] = await Promise.all([
          api.getHealthStats(),
          api.getTodayInsight().catch(() => null),
          api.getHistoryLogs().catch(() => null),
          api.getWeightHistory({ days: 7 }).catch(() => null)
        ])
        if (!mounted) return
        const data = res?.data || {}
        const todayData = todayRes?.data?.today || {}
        const logs = Array.isArray(historyRes?.data) ? historyRes.data : []
        const latestLog = logs[0] || null
        const weightLogs = Array.isArray(weightRes?.data?.logs) ? weightRes.data.logs : []
        const latestWeight = weightLogs.length ? weightLogs[weightLogs.length - 1] : null

        const timeline = []

        if (latestLog) {
          const mealCount = Array.isArray(latestLog.meals)
            ? latestLog.meals.reduce((sum, meal) => sum + (Array.isArray(meal.items) ? meal.items.length : 0), 0)
            : 0

          timeline.push({
            id: `log-${latestLog.date}`,
            text: `Logged ${Math.round(latestLog.totalCalories || 0)} kcal and ${Math.round(latestLog.totalProtein || 0)} g protein${mealCount ? ` across ${mealCount} food entries` : ''}.`,
            time: formatTimelineDate(latestLog.date)
          })

          if (latestLog.steps) {
            timeline.push({
              id: `steps-${latestLog.date}`,
              text: `Recorded ${latestLog.steps.toLocaleString()} steps.`,
              time: formatTimelineDate(latestLog.date)
            })
          }

          if (latestLog.sleepHours !== null && latestLog.sleepHours !== undefined) {
            timeline.push({
              id: `sleep-${latestLog.date}`,
              text: `Logged ${latestLog.sleepHours} hours of sleep.`,
              time: formatTimelineDate(latestLog.date)
            })
          }

          if (latestLog.waterIntake) {
            timeline.push({
              id: `water-${latestLog.date}`,
              text: `Water intake set to ${toTitle(latestLog.waterIntake)}.`,
              time: formatTimelineDate(latestLog.date)
            })
          }
        }

        if (latestWeight?.weightKg) {
          timeline.push({
            id: `weight-${latestWeight.date}`,
            text: `Weight updated to ${latestWeight.weightKg} kg.`,
            time: formatTimelineDate(latestWeight.date)
          })
        }

        setActivityItems(timeline.slice(0, 4))

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
      progress: getBodyBalanceScore(stats.bmi)
    },
    {
      id: 'calories',
      label: 'Daily Calories',
      value: loading ? '-' : formatValue(stats.requiredCalories),
      note: 'Estimated daily target',
      accent: 'blue',
      progress: stats.requiredCalories ? clampPercent(today.calories, stats.requiredCalories) : 0
    },
    {
      id: 'protein',
      label: 'Protein Goal',
      value: loading ? '-' : formatValue(stats.requiredProtein, 'g'),
      note: 'Suggested daily intake',
      accent: 'green',
      progress: stats.requiredProtein ? clampPercent(today.protein, stats.requiredProtein) : 0
    }
  ]

  const summaryItems = [
    { label: 'Goal', value: user?.goal ? String(user.goal).replace(/_/g, ' ') : 'Complete profile' },
    { label: 'Activity', value: user?.activityLevel ? String(user.activityLevel).replace(/_/g, ' ') : 'Not set' },
    { label: 'Diet', value: user?.dietPreference ? String(user.dietPreference).replace(/_/g, ' ') : 'Not set' },
    { label: 'Weight', value: user?.weightKg ? `${user.weightKg} kg` : 'Not set' }
  ]

  const calorieGap = Math.max(0, (stats.requiredCalories || 0) - (today.calories || 0))
  const proteinGap = Math.max(0, (stats.requiredProtein || 0) - (today.protein || 0))

  const pulseRows = [
    {
      id: 'body-balance',
      label: 'Body balance',
      value: metricCards[0].progress,
      summary: stats.bmi ? `BMI ${stats.bmi} · ${getBmiCategory(stats.bmi)}` : 'Complete your profile to refine this score.',
      modalTitle: 'How to improve body balance',
      modalLead: user?.goal === 'weight_loss'
        ? 'A steadier calorie deficit, enough protein, and daily movement will improve this score over time.'
        : user?.goal === 'muscle_gain'
          ? 'A steady surplus with strength training and consistent protein intake supports healthier body composition.'
          : 'Consistency matters most here: stable meals, enough protein, and regular movement improve this marker.',
      suggestions: [
        'Build your main meals around lean protein plus vegetables and a controlled carb portion.',
        user?.goal === 'weight_loss'
          ? 'Aim for a 20 to 30 minute walk after lunch or dinner on most days.'
          : 'Include 3 strength sessions each week to improve body composition quality.',
        'Recheck weight, meals, and activity regularly so the dashboard can update this trend more accurately.'
      ],
      mealPlan: [
        'Breakfast: 2 eggs or paneer bhurji with 2 rotis and salad.',
        'Lunch: 1 palm-sized serving of protein, 1 cup rice or 2 rotis, and half a plate of vegetables.',
        'Dinner: Keep protein high and avoid oversized late-night portions.'
      ]
    },
    {
      id: 'energy-target',
      label: 'Energy target',
      value: metricCards[1].progress,
      summary: stats.requiredCalories
        ? `${today.calories || 0} / ${stats.requiredCalories} kcal today`
        : 'Set your profile to unlock an energy target.',
      modalTitle: 'How to improve energy target',
      modalLead: stats.requiredCalories
        ? `You are about ${Math.round(calorieGap)} kcal below your current daily target. Add one or two balanced meals to close the gap.`
        : 'Set your age, height, weight, and activity in Profile to generate a useful calorie target.',
      suggestions: [
        'Choose calorie-dense but balanced foods so you improve energy without relying on junk food.',
        'Split the remaining calories into a snack and one stronger meal so it feels easier to complete.',
        'Pair carbs with protein to improve energy and recovery together.'
      ],
      mealPlan: [
        'Option 1: 1 bowl oats with milk, banana, and 1 tablespoon peanut butter.',
        'Option 2: 2 rotis with dal and paneer or chicken curry.',
        'Option 3: Greek yogurt or curd with fruit and a handful of nuts.'
      ]
    },
    {
      id: 'recovery-fuel',
      label: 'Recovery fuel',
      value: metricCards[2].progress,
      summary: stats.requiredProtein
        ? `${Math.round(today.protein || 0)} g / ${stats.requiredProtein} g protein`
        : 'Set your profile to unlock a protein target.',
      modalTitle: 'How to improve recovery fuel',
      modalLead: stats.requiredProtein
        ? `You are about ${Math.round(proteinGap)} g short of your protein target. One focused high-protein meal can lift this quickly.`
        : 'Set your profile to generate a protein goal tailored to your weight and objective.',
      suggestions: [
        user?.dietPreference === 'veg'
          ? 'Use paneer, tofu, Greek yogurt, dal, soy chunks, or whey to close the gap efficiently.'
          : 'Use eggs, chicken, fish, Greek yogurt, paneer, or whey to close the gap efficiently.',
        'Add protein to breakfast first because it is usually the easiest place to improve.',
        'Try to spread protein across 3 meals instead of stacking it all at dinner.'
      ],
      mealPlan: user?.dietPreference === 'veg'
        ? [
            'Meal idea: 150 g paneer with 2 rotis gives a strong protein bump.',
            'Snack idea: 1 scoop whey or 200 g Greek yogurt adds quick recovery protein.',
            'Dinner add-on: 1 bowl dal plus curd can meaningfully lift your total.'
          ]
        : [
            'Meal idea: 3 eggs plus toast is a simple protein boost.',
            'Lunch idea: 120 to 150 g chicken or fish with rice or roti improves recovery fast.',
            'Snack idea: Greek yogurt, milk, or whey can close the remaining gap.'
          ]
    }
  ]

  const selectedPulse = pulseRows.find((row) => row.id === activePulse) || null

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
              <button
                key={row.id}
                type="button"
                className="dashboard-pulse-row"
                onClick={() => setActivePulse(row.id)}
              >
                <div className="dashboard-pulse-copy">
                  <span>{row.label}</span>
                  <strong>{row.value}%</strong>
                </div>
                <div className="dashboard-pulse-track" aria-hidden="true">
                  <span style={{ width: `${row.value}%` }} />
                </div>
              </button>
            ))}
          </div>

          <div className="dashboard-callout">
            <strong>Recent activity</strong>
            {activityItems.length ? (
              <ul className="activity-list">
                {activityItems.map((item) => (
                  <li key={item.id} className="activity-item">
                    <div className="activity-text">{item.text}</div>
                    <div className="activity-time">{item.time}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                No recent activity is available yet. Once you start logging meals, weight, or daily data, your timeline will appear here.
              </p>
            )}
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

      {selectedPulse ? (
        <div className="dashboard-modal-backdrop" onClick={() => setActivePulse(null)} aria-hidden="true">
          <div
            className="dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="dashboard-modal-close"
              aria-label="Close recommendation"
              onClick={() => setActivePulse(null)}
            >
              ×
            </button>

            <div className="dashboard-modal-head">
              <span className="dashboard-eyebrow">Boost Guide</span>
              <h3 id="dashboard-modal-title">{selectedPulse.modalTitle}</h3>
              <p className="muted">{selectedPulse.modalLead}</p>
            </div>

            <div className="dashboard-modal-body">
              <div className="dashboard-modal-highlight">
                <span>{selectedPulse.label}</span>
                <strong>{selectedPulse.summary}</strong>
              </div>

              <div className="dashboard-modal-grid">
                <div className="dashboard-modal-card">
                  <span>What to do</span>
                  {selectedPulse.suggestions.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>

                <div className="dashboard-modal-card">
                  <span>Meal ideas</span>
                  {selectedPulse.mealPlan.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>

              <div className="dashboard-modal-foot">
                <span>Profile goal</span>
                <strong>{prettify(user?.goal || 'maintain')}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
