import React, { useEffect, useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import DailyLogEditor from '../components/DailyLogEditor'
import * as api from '../utils/api'

const formatDate = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

const makeDraftId = () => `meal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const createDraftItem = (item) => {
  const quantity = Number(item.quantity) || 1
  const totalCalories = Number(item.totalCalories) || 0
  const totalProtein = Number(item.totalProtein) || 0
  const totalCarbs = Number(item.totalCarbs) || 0
  const totalFats = Number(item.totalFats) || 0
  const totalFiber = Number(item.totalFiber) || 0
  const totalCalcium = Number(item.totalCalcium) || 0

  return {
    draftId: item.draftId || makeDraftId(),
    foodId: item.foodId?._id || item.foodId,
    foodName: item.foodName || item.foodId?.name || 'Food item',
    quantity,
    caloriesPerUnit: item.caloriesPerUnit ?? (quantity ? totalCalories / quantity : 0),
    proteinPerUnit: item.proteinPerUnit ?? (quantity ? totalProtein / quantity : 0),
    carbsPerUnit: item.carbsPerUnit ?? (quantity ? totalCarbs / quantity : 0),
    fatsPerUnit: item.fatsPerUnit ?? (quantity ? totalFats / quantity : 0),
    fiberPerUnit: item.fiberPerUnit ?? (quantity ? totalFiber / quantity : 0),
    calciumPerUnit: item.calciumPerUnit ?? (quantity ? totalCalcium / quantity : 0),
  }
}

const normalizeMeals = (incomingMeals = []) =>
  incomingMeals.map((meal) => ({
    type: meal.type,
    items: (meal.items || []).map((item) => createDraftItem(item)),
  }))

export default function DailyLog(){
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mealType, setMealType] = useState('breakfast')
  const [draftMeals, setDraftMeals] = useState([])
  const [draftVitals, setDraftVitals] = useState({ waterIntake: '', sleepHours: '', steps: '' })

  useEffect(() => {
    let mounted = true
    api.getTodayLog()
      .then((response) => {
        if (!mounted) return
        const nextLog = response?.data || null
        setLog(nextLog)
        setDraftMeals(normalizeMeals(nextLog?.meals || []))
        setDraftVitals({
          waterIntake: nextLog?.waterIntake || '',
          sleepHours: nextLog?.sleepHours ?? '',
          steps: nextLog?.steps ?? '',
        })
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleAddFood = (food, selectedMealType, quantity = 1) => {
    setDraftMeals((prev) => {
      const existingIndex = prev.findIndex((meal) => meal.type === selectedMealType)
      const nextItem = createDraftItem({
        foodId: food._id,
        foodName: food.name,
        quantity,
        caloriesPerUnit: food.caloriesPerUnit || 0,
        proteinPerUnit: food.proteinPerUnit || 0,
        carbsPerUnit: food.carbsPerUnit || 0,
        fatsPerUnit: food.fatsPerUnit || 0,
        fiberPerUnit: food.fiberPerUnit || 0,
        calciumPerUnit: food.calciumPerUnit || 0,
      })

      if (existingIndex === -1) {
        return [...prev, { type: selectedMealType, items: [nextItem] }]
      }

      return prev.map((meal, index) => (
        index === existingIndex
          ? { ...meal, items: [...meal.items, nextItem] }
          : meal
      ))
    })
  }

  const handleRemoveFood = (type, draftId) => {
    setDraftMeals((prev) => prev
      .map((meal) => (
        meal.type !== type
          ? meal
          : { ...meal, items: meal.items.filter((item) => item.draftId !== draftId) }
      ))
      .filter((meal) => meal.items.length > 0))
  }

  const handleSave = async (payload) => {
    const response = await api.createOrUpdateDailyLog(payload)
    const nextLog = response?.data || null
    setLog(nextLog)
    setDraftMeals(normalizeMeals(nextLog?.meals || []))
    setDraftVitals({
      waterIntake: nextLog?.waterIntake || '',
      sleepHours: nextLog?.sleepHours ?? '',
      steps: nextLog?.steps ?? '',
    })
    return response
  }

  const handleVitalsChange = (nextVitals) => {
    setDraftVitals(nextVitals)
  }

  const liveCalories = draftMeals.reduce(
    (mealSum, meal) => mealSum + meal.items.reduce((itemSum, item) => itemSum + ((item.caloriesPerUnit || 0) * (item.quantity || 1)), 0),
    0
  )

  const liveProtein = draftMeals.reduce(
    (mealSum, meal) => mealSum + meal.items.reduce((itemSum, item) => itemSum + ((item.proteinPerUnit || 0) * (item.quantity || 1)), 0),
    0
  )

  const summary = useMemo(() => {
    const meals = draftMeals || []
    return [
      { label: 'Calories', value: Math.round(liveCalories), suffix: 'kcal' },
      { label: 'Protein', value: Number(liveProtein.toFixed(1)), suffix: 'g' },
      { label: 'Meals', value: meals.length, suffix: 'logged' },
      { label: 'Steps', value: draftVitals.steps || 0, suffix: 'today' }
    ]
  }, [draftMeals, draftVitals.steps, liveCalories, liveProtein])

  const mealTimeline = draftMeals.map((meal) => ({
    type: meal.type,
    items: meal.items,
    count: meal.items?.length || 0,
    calories: meal.items?.reduce((sum, item) => sum + ((item.caloriesPerUnit || 0) * (item.quantity || 1)), 0) || 0
  }))

  return (
    <div className="page feature-page feature-daily-log">
      <section className="feature-hero card">
        <div className="feature-hero-copy">
          <span className="feature-eyebrow">Daily Log</span>
          <h1>Meals, vitals, and progress</h1>
          <p className="muted">
            Capture what you ate, how you slept, your hydration, and your movement in one calm daily workspace.
          </p>
        </div>
        <div className="feature-hero-aside">
          <span className="feature-date-chip">{formatDate(new Date())}</span>
          <div className="feature-orbit feature-orbit-soft">
            <strong>{loading ? '-' : `${Math.round(liveCalories)}`}</strong>
            <span>calories logged</span>
          </div>
        </div>
      </section>

      <section className="feature-summary-grid">
        {summary.map((item) => (
          <Card key={item.label} className="feature-stat-card">
            <span className="feature-stat-label">{item.label}</span>
            <strong className="feature-stat-value">{loading ? '-' : item.value}</strong>
            <span className="feature-stat-note">{item.suffix}</span>
          </Card>
        ))}
      </section>

      <section className="feature-layout feature-layout-wide">
        <Card className="feature-main-panel">
          <div className="feature-panel-head">
            <div>
              <h3>Today&apos;s entry</h3>
              <p className="muted">Update today&apos;s meals, water, sleep, and steps in one place.</p>
            </div>
          </div>
          <DailyLogEditor
            date={new Date()}
            log={log}
            meals={draftMeals}
            vitals={draftVitals}
            mealType={mealType}
            onMealTypeChange={setMealType}
            onAddFood={handleAddFood}
            onVitalsChange={handleVitalsChange}
            loading={loading}
            onSave={handleSave}
          />
        </Card>

        <Card className="feature-side-panel">
          <div className="feature-panel-head">
            <div>
              <h3>Meal snapshot</h3>
              <p className="muted">Review added foods here and remove anything you do not want before saving.</p>
            </div>
          </div>

          {mealTimeline.length > 0 ? (
            <div className="snapshot-scroll">
              {mealTimeline.map((meal) => (
                <div key={meal.type} className="snapshot-meal-group">
                  <div className="snapshot-meal-head">
                    <div>
                      <strong>{String(meal.type).replace(/\b\w/g, (c) => c.toUpperCase())}</strong>
                      <span>{meal.count} item{meal.count === 1 ? '' : 's'}</span>
                    </div>
                    <div className="feature-list-metric">{meal.calories} kcal</div>
                  </div>

                  <div className="snapshot-items">
                    {meal.items.map((item) => (
                      <div key={item.draftId} className="snapshot-item">
                        <div className="snapshot-item-copy">
                          <strong>{item.foodName}</strong>
                          <span>Qty {item.quantity} • {Math.round((item.caloriesPerUnit || 0) * item.quantity)} kcal</span>
                        </div>
                        <button
                          type="button"
                          className="snapshot-remove-btn"
                          aria-label={`Remove ${item.foodName}`}
                          onClick={() => handleRemoveFood(meal.type, item.draftId)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="feature-empty">
              <strong>No meals added yet</strong>
              <p className="muted">Use the editor to search for foods and build your breakfast, lunch, dinner, or snack log.</p>
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
