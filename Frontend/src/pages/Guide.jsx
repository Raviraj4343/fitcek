import React, { useEffect, useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../utils/api'

const prettify = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getBmiMeta = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return { value: null, category: 'Incomplete profile' }
  const bmi = weightKg / Math.pow(heightCm / 100, 2)
  const rounded = Number(bmi.toFixed(1))

  if (rounded < 18.5) return { value: rounded, category: 'Underweight' }
  if (rounded < 25) return { value: rounded, category: 'Healthy range' }
  if (rounded < 30) return { value: rounded, category: 'Overweight' }
  return { value: rounded, category: 'Obesity range' }
}

const getCalorieTarget = ({ age, gender, weightKg, heightCm, activityLevel, goal }) => {
  if (!age || !weightKg || !heightCm) return null

  let bmr
  if (gender === 'male') bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  else if (gender === 'female') bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  else bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78

  const multiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  }[activityLevel] || 1.2

  let target = bmr * multiplier
  if (goal === 'weight_loss') target -= 300
  if (goal === 'muscle_gain') target += 300

  return Math.round(target)
}

const getProteinTarget = (weightKg, goal) => {
  if (!weightKg) return null
  const factor = goal === 'muscle_gain' ? 1.6 : goal === 'weight_loss' ? 1.2 : 0.9
  return Math.round(weightKg * factor)
}

const getHydrationTarget = (weightKg, activityLevel) => {
  if (!weightKg) return 2200
  const base = weightKg * 35
  const activityBoost = activityLevel === 'active' ? 500 : activityLevel === 'moderate' ? 250 : 0
  return Math.round(base + activityBoost)
}

const waterToMl = (value) => {
  const map = { '<1L': 800, '1-2L': 1500, '2-3L': 2500, '3L+': 3200 }
  return map[value] || 0
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const polarToCartesian = (cx, cy, radius, angle) => ({
  x: cx + radius * Math.cos(angle),
  y: cy + radius * Math.sin(angle)
})

const buildDietTags = (dailyDiet, meals) => {
  const mealNames = (meals || []).flatMap((meal) => (meal.items || []).map((item) => item.foodName))
  const combined = `${dailyDiet || ''} ${mealNames.join(' ')}`.toLowerCase()

  return {
    hasFruitVeg: /(fruit|vegetable|salad|greens|spinach|broccoli|apple|banana|orange|berries|carrot|tomato|cucumber)/.test(combined),
    hasProteinDense: /(egg|chicken|fish|paneer|tofu|dal|lentil|yogurt|curd|milk|soy|protein|beans)/.test(combined),
    hasWholeFoods: /(oats|brown rice|millet|roti|whole|dal|beans|fruit|vegetable|nuts|seeds)/.test(combined),
    hasProcessedFoods: /(fried|pizza|burger|chips|soda|cola|dessert|pastry|instant|noodle|sweet|bakery)/.test(combined)
  }
}

const buildRecommendations = ({
  goal,
  calorieGap,
  proteinGap,
  sleepHours,
  steps,
  medicalConditions,
  dietSignals,
  dietPreference
}) => {
  const conditionText = String(medicalConditions || '').toLowerCase()
  const list = []

  if (goal === 'weight_loss') {
    list.push({
      title: 'Diet focus',
      body: calorieGap > 150
        ? 'Tighten high-calorie extras first: sweet drinks, deep-fried snacks, and oversized dinner portions.'
        : 'Keep meals structured around protein, vegetables, and controlled portions so the calorie deficit stays sustainable.'
    })
    list.push({
      title: 'Exercise focus',
      body: 'Aim for 3 strength sessions per week plus brisk walking on most days to protect muscle while reducing body fat.'
    })
  }

  if (goal === 'muscle_gain') {
    list.push({
      title: 'Diet focus',
      body: proteinGap > 0
        ? 'Add a protein anchor to every meal and include a calorie-dense recovery snack after training.'
        : 'Keep a steady calorie surplus with protein at every meal and a carb source around workouts.'
    })
    list.push({
      title: 'Exercise focus',
      body: 'Prioritize progressive overload: compound lifts, enough rest between hard sessions, and 7-9 hours of sleep.'
    })
  }

  if (goal === 'maintain') {
    list.push({
      title: 'Diet focus',
      body: 'Stay consistent with balanced plates, regular meal timing, and enough protein to support recovery and satiety.'
    })
    list.push({
      title: 'Exercise focus',
      body: 'Use a balanced mix of resistance work, mobility, and light cardio to keep energy, strength, and recovery stable.'
    })
  }

  if (proteinGap > 12) {
    list.push({
      title: 'Protein upgrade',
      body: dietPreference === 'veg'
        ? 'Bring in paneer, Greek yogurt, dal, tofu, soy chunks, or whey to close the protein gap faster.'
        : 'Use eggs, chicken, fish, Greek yogurt, paneer, or whey to close the protein gap efficiently.'
    })
  }

  if (!dietSignals.hasFruitVeg) {
    list.push({
      title: 'Micronutrient support',
      body: 'Add at least 2 servings of fruit and 2 servings of vegetables today to improve fiber, potassium, folate, and antioxidant intake.'
    })
  }

  if (sleepHours !== undefined && sleepHours !== null && sleepHours < 7) {
    list.push({
      title: 'Lifestyle support',
      body: 'Push bedtime earlier, reduce late-night screens, and keep caffeine earlier in the day to improve sleep quality and appetite control.'
    })
  }

  if (steps !== undefined && steps !== null && steps < 7000) {
    list.push({
      title: 'Movement support',
      body: 'Break walking into short blocks after meals. Two 10-minute walks can meaningfully improve daily activity and glucose control.'
    })
  }

  if (conditionText.includes('diabetes') || conditionText.includes('prediabetes')) {
    list.push({
      title: 'Condition-aware note',
      body: 'Favor high-fiber carbs, pair carbs with protein, and avoid long gaps between meals to support steadier blood sugar.'
    })
  }

  if (conditionText.includes('thyroid')) {
    list.push({
      title: 'Condition-aware note',
      body: 'Consistency matters. Keep protein adequate, avoid crash dieting, and follow your clinician guidance around medication timing.'
    })
  }

  if (conditionText.includes('hypertension') || conditionText.includes('blood pressure')) {
    list.push({
      title: 'Condition-aware note',
      body: 'Reduce packaged salty foods, use more potassium-rich produce, and keep hydration steady to support blood-pressure control.'
    })
  }

  return list.slice(0, 3)
}

export default function Guide() {
  const { user } = useAuth() || {}
  const [todayLog, setTodayLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyDiet, setDailyDiet] = useState('')
  const [medicalConditions, setMedicalConditions] = useState('')
  const [focusGoal, setFocusGoal] = useState(null)
  const [activeRadarIndex, setActiveRadarIndex] = useState(0)

  const resolvedGoal = ['weight_loss', 'muscle_gain', 'maintain'].includes(user?.goal)
    ? user.goal
    : 'maintain'

  useEffect(() => {
    setFocusGoal(resolvedGoal)
  }, [resolvedGoal])

  useEffect(() => {
    let mounted = true

    api.getTodayLog()
      .then((res) => {
        if (!mounted) return
        setTodayLog(res?.data || null)
      })
      .catch(() => {
        if (mounted) setTodayLog(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  const report = useMemo(() => {
    const profile = {
      age: user?.age,
      gender: user?.gender,
      heightCm: user?.heightCm,
      weightKg: user?.weightKg,
      activityLevel: user?.activityLevel,
      goal: focusGoal || resolvedGoal,
      dietPreference: user?.dietPreference
    }

    const bmi = getBmiMeta(profile.weightKg, profile.heightCm)
    const calorieTarget = getCalorieTarget(profile)
    const proteinTarget = getProteinTarget(profile.weightKg, profile.goal)
    const hydrationTarget = getHydrationTarget(profile.weightKg, profile.activityLevel)

    const actualCalories = todayLog?.totalCalories ?? 0
    const actualProtein = todayLog?.totalProtein ?? 0
    const steps = todayLog?.steps ?? null
    const sleepHours = todayLog?.sleepHours ?? null
    const waterMl = waterToMl(todayLog?.waterIntake)
    const calorieGap = calorieTarget ? Math.max(0, calorieTarget - actualCalories) : 0
    const proteinGap = proteinTarget ? Math.max(0, proteinTarget - actualProtein) : 0
    const hydrationGap = Math.max(0, hydrationTarget - waterMl)
    const sleepGap = sleepHours === null ? 8 : Math.max(0, 8 - sleepHours)
    const stepsGap = steps === null ? 8000 : Math.max(0, 8000 - steps)
    const dietSignals = buildDietTags(dailyDiet, todayLog?.meals || [])

    const nutrientGaps = [
      {
        label: 'Protein',
        current: `${Math.round(actualProtein)} g`,
        target: proteinTarget ? `${proteinTarget} g` : 'Set profile',
        severity: clamp(proteinTarget ? Math.round((proteinGap / proteinTarget) * 100) : 0, 0, 100),
        note: proteinGap > 0 ? `${Math.round(proteinGap)} g short of your target.` : 'Target reached for today.'
      },
      {
        label: 'Energy',
        current: `${Math.round(actualCalories)} kcal`,
        target: calorieTarget ? `${calorieTarget} kcal` : 'Set profile',
        severity: clamp(calorieTarget ? Math.round((calorieGap / calorieTarget) * 100) : 0, 0, 100),
        note: calorieGap > 0 ? `${Math.round(calorieGap)} kcal still needed for your plan.` : 'Intake is in a strong range.'
      },
      {
        label: 'Hydration',
        current: waterMl ? `${Math.round(waterMl / 1000 * 10) / 10} L` : 'Not logged',
        target: `${Math.round(hydrationTarget / 100) / 10} L`,
        severity: clamp(Math.round((hydrationGap / hydrationTarget) * 100), 0, 100),
        note: hydrationGap > 0 ? 'Hydration looks light for your body size and activity.' : 'Hydration is on track.'
      }
    ]

    if (!dietSignals.hasFruitVeg) {
      nutrientGaps.push({
        label: 'Fiber and micros',
        current: 'Low',
        target: '4+ servings',
        severity: 76,
        note: 'Add fruit, vegetables, legumes, and whole grains to improve fiber, potassium, and folate coverage.'
      })
    } else if (profile.dietPreference === 'veg') {
      nutrientGaps.push({
        label: 'B12 and iron',
        current: dietSignals.hasProteinDense ? 'Some support' : 'Watch closely',
        target: 'Regular sources',
        severity: dietSignals.hasProteinDense ? 42 : 72,
        note: 'Vegetarian eating usually needs more deliberate B12, iron, and high-quality protein planning.'
      })
    }

    const completeness = [profile.age, profile.gender, profile.heightCm, profile.weightKg, profile.activityLevel].filter(Boolean).length
    const baseScore = Math.round(
      completeness * 8 +
      (bmi.value && bmi.value >= 18.5 && bmi.value < 25 ? 16 : 8) +
      (calorieTarget ? clamp(28 - Math.round((calorieGap / Math.max(calorieTarget, 1)) * 40), 8, 28) : 10) +
      (proteinTarget ? clamp(24 - Math.round((proteinGap / Math.max(proteinTarget, 1)) * 45), 6, 24) : 8) +
      clamp(12 - Math.round(sleepGap * 2), 4, 12) +
      clamp(12 - Math.round(stepsGap / 1000), 4, 12)
    )

    const recommendations = buildRecommendations({
      goal: profile.goal,
      calorieGap,
      proteinGap,
      sleepHours,
      steps,
      medicalConditions,
      dietSignals,
      dietPreference: profile.dietPreference
    })

    return {
      bmi,
      calorieTarget,
      proteinTarget,
      hydrationTarget,
      actualCalories,
      actualProtein,
      sleepHours,
      steps,
      waterLabel: todayLog?.waterIntake || 'Not logged',
      nutrientGaps,
      recommendations,
      score: clamp(baseScore, 0, 100)
    }
  }, [dailyDiet, focusGoal, medicalConditions, resolvedGoal, todayLog, user])

  const summaryCards = [
    {
      label: 'BMI',
      value: report.bmi.value ?? '-',
      note: report.bmi.category
    },
    {
      label: 'Calorie need',
      value: report.calorieTarget ?? '-',
      note: 'Estimated daily target'
    },
    {
      label: 'Protein target',
      value: report.proteinTarget ?? '-',
      note: 'Daily recovery goal'
    },
    {
      label: 'Guide score',
      value: report.score,
      note: 'Readiness snapshot'
    }
  ]

  const focusLine = [
    user?.activityLevel ? prettify(user.activityLevel) : 'Activity missing',
    user?.dietPreference ? prettify(user.dietPreference) : 'Diet missing',
    user?.weightKg ? `${user.weightKg} kg` : 'Weight missing'
  ].join(' • ')

  const radarItems = report.nutrientGaps.map((gap, index) => ({
    ...gap,
    index,
    aligned: Math.max(8, 100 - gap.severity),
    shortLabel: gap.label === 'Fiber and micros' ? 'Fiber' : gap.label
  }))

  const radarCenter = 140
  const radarRadius = 82
  const radarLevels = [0.2, 0.4, 0.6, 0.8, 1]
  const radarPoints = radarItems.map((item, index) => {
    const angle = (-Math.PI / 2) + (index / Math.max(radarItems.length, 1)) * Math.PI * 2
    const plot = polarToCartesian(radarCenter, radarCenter, radarRadius * (item.aligned / 100), angle)
    const labelPosition = polarToCartesian(radarCenter, radarCenter, radarRadius + 18, angle)
    const axis = polarToCartesian(radarCenter, radarCenter, radarRadius, angle)

    return {
      ...item,
      index,
      plot,
      labelPosition,
      axis
    }
  })

  const radarPolygon = radarPoints.map((point) => `${point.plot.x},${point.plot.y}`).join(' ')
  const activeRadarPoint = radarPoints[activeRadarIndex] || radarPoints[0] || null

  return (
    <div className="page feature-page guide-page">
      <section className="guide-hero card">
        <div className="guide-hero-copy">
          <span className="feature-eyebrow">Guide</span>
          <h1>Your personalized health guide</h1>
          <p className="muted">
            Analyze profile signals, today&apos;s diet, activity, and medical context in one elegant view with practical next steps.
          </p>

          <div className="guide-hero-badges">
            <span className="dashboard-badge">{user?.goal ? prettify(focusGoal) : 'Set your goal in profile'}</span>
            <span className="dashboard-badge">{loading ? 'Loading today’s log' : 'Built from your real app data'}</span>
          </div>
          <div className="guide-hero-meta">{focusLine}</div>
        </div>

        <div className="guide-hero-visual">
          <div className="guide-score-orbit" aria-hidden="true">
            <div className="guide-score-core">
              <span>Guide score</span>
              <strong>{report.score}</strong>
              <small>out of 100</small>
            </div>
          </div>
          <div className="guide-score-caption">
            <strong>{report.bmi.category}</strong>
            <span>BMI, calorie needs, intake quality, and recovery signals rolled into one quick snapshot.</span>
          </div>
        </div>
      </section>

      <section className="feature-summary-grid">
        {summaryCards.map((card) => (
          <Card key={card.label} className="feature-stat-card">
            <span className="feature-stat-label">{card.label}</span>
            <strong className="feature-stat-value">{card.value}</strong>
            <span className="feature-stat-note">{card.note}</span>
          </Card>
        ))}
      </section>

      <section className="guide-section-stack">
        <Card className="guide-context-panel">
          <div className="feature-panel-head">
            <div>
              <h3>Quick context</h3>
              <p className="muted">Saved profile fields are already included. Only add the extra details that affect today&apos;s guidance.</p>
            </div>
          </div>

          <div className="guide-input-grid">
            <div className="guide-goal-row">
              {['weight_loss', 'muscle_gain', 'maintain'].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  className={`feature-chip ${(focusGoal || resolvedGoal) === goal ? 'active' : ''}`}
                  onClick={() => setFocusGoal(goal)}
                >
                  {prettify(goal)}
                </button>
              ))}
            </div>

            <div className="guide-form-grid">
              <div className="guide-form-block">
                <label htmlFor="guide-conditions" className="guide-label">Medical conditions</label>
                <textarea
                  id="guide-conditions"
                  className="guide-textarea"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="Examples: PCOS, hypothyroid, hypertension, diabetes, anemia"
                />
              </div>

              <div className="guide-form-block">
                <label htmlFor="guide-diet" className="guide-label">Daily diet notes</label>
                <textarea
                  id="guide-diet"
                  className="guide-textarea"
                  value={dailyDiet}
                  onChange={(e) => setDailyDiet(e.target.value)}
                  placeholder="Describe usual meals, snacks, drinks, fruits, vegetables, and anything you want the guide to consider."
                />
              </div>
            </div>

            <div className="guide-inline-actions">
              <Button onClick={() => { setDailyDiet(''); setMedicalConditions(''); setFocusGoal(resolvedGoal) }} variant="ghost">
                Reset context
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="guide-report-grid">
        <Card className="guide-report-panel">
          <div className="feature-panel-head">
            <div>
              <h3>Today&apos;s priorities</h3>
              <p className="muted">A quick spider view of how aligned your key nutrition priorities are today.</p>
            </div>
          </div>

          <div className="guide-radar-shell">
            <div className="guide-radar-card">
              {activeRadarPoint ? (
                <div className="guide-radar-tooltip">
                  <strong>{activeRadarPoint.label}</strong>
                  <span>{activeRadarPoint.current} / {activeRadarPoint.target}</span>
                </div>
              ) : null}
              <svg
                viewBox="0 0 280 280"
                className="guide-radar-chart"
                role="img"
                aria-label="Spider chart showing alignment across your key nutrition priorities"
              >
                {radarLevels.map((level) => {
                  const ringPoints = radarItems.map((_, index) => {
                    const angle = (-Math.PI / 2) + (index / Math.max(radarItems.length, 1)) * Math.PI * 2
                    const point = polarToCartesian(radarCenter, radarCenter, radarRadius * level, angle)
                    return `${point.x},${point.y}`
                  }).join(' ')

                  return <polygon key={level} points={ringPoints} className="guide-radar-ring" />
                })}

                {radarPoints.map((point) => (
                  <line
                    key={point.label}
                    x1={radarCenter}
                    y1={radarCenter}
                    x2={point.axis.x}
                    y2={point.axis.y}
                    className="guide-radar-axis"
                  />
                ))}

                <polygon points={radarPolygon} className="guide-radar-area" />

                {radarPoints.map((point) => (
                  <circle
                    key={`${point.label}-dot`}
                    cx={point.plot.x}
                    cy={point.plot.y}
                    r={activeRadarIndex === point.index ? '7' : '5'}
                    className={`guide-radar-dot ${activeRadarIndex === point.index ? 'active' : ''}`}
                    onMouseEnter={() => setActiveRadarIndex(point.index)}
                  />
                ))}

                {radarPoints.map((point) => (
                  <circle
                    key={`${point.label}-hover`}
                    cx={point.plot.x}
                    cy={point.plot.y}
                    r="16"
                    className="guide-radar-hit"
                    onMouseEnter={() => setActiveRadarIndex(point.index)}
                    onFocus={() => setActiveRadarIndex(point.index)}
                    tabIndex="0"
                    role="button"
                    aria-label={`${point.label}: ${point.current} out of ${point.target}, ${point.aligned}% aligned`}
                  />
                ))}

                {radarPoints.map((point) => (
                  <text
                    key={`${point.label}-text`}
                    x={point.labelPosition.x}
                    y={point.labelPosition.y}
                    textAnchor="middle"
                    className={`guide-radar-label ${activeRadarIndex === point.index ? 'active' : ''}`}
                    onMouseEnter={() => setActiveRadarIndex(point.index)}
                  >
                    {point.shortLabel}
                  </text>
                ))}
              </svg>
            </div>

            <div className="guide-radar-legend">
              {radarItems.map((item) => (
                <div
                  key={item.label}
                  className={`guide-radar-legend-item ${activeRadarIndex === item.index ? 'active' : ''}`}
                  onMouseEnter={() => setActiveRadarIndex(item.index)}
                  onFocus={() => setActiveRadarIndex(item.index)}
                  tabIndex="0"
                >
                  <div className="guide-radar-legend-top">
                    <strong>{item.label}</strong>
                    <div className="guide-radar-legend-meta">
                      <span>{item.current} / {item.target}</span>
                      <div className="guide-gap-severity">{item.aligned}%</div>
                    </div>
                  </div>
                  <div className="guide-radar-legend-track" aria-hidden="true">
                    <span style={{ width: `${item.aligned}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="guide-kpi-stack">
            <div className="guide-kpi-card">
              <span>Calories logged</span>
              <strong>{report.actualCalories} kcal</strong>
            </div>
            <div className="guide-kpi-card">
              <span>Protein logged</span>
              <strong>{Math.round(report.actualProtein)} g</strong>
            </div>
            <div className="guide-kpi-card">
              <span>Hydration</span>
              <strong>{report.waterLabel}</strong>
            </div>
            <div className="guide-kpi-card">
              <span>Recovery</span>
              <strong>{report.sleepHours ?? '-'} h sleep</strong>
            </div>
          </div>
        </Card>

        <Card className="guide-report-panel">
          <div className="feature-panel-head">
            <div>
              <h3>Action plan</h3>
              <p className="muted">Short, practical next steps for your current goal.</p>
            </div>
          </div>

          <div className="guide-recommendations guide-recommendations-stack">
            {report.recommendations.map((item) => (
              <div key={item.title} className="guide-recommendation-card">
                <span>{item.title}</span>
                <strong>{item.body}</strong>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
