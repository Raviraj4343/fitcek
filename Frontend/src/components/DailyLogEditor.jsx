import React, { useEffect, useState } from 'react'
import Input from './ui/Input'
import Button from './ui/Button'
import FoodSearch from './FoodSearch'

const WATER_OPTIONS = ['', '<1L', '1-2L', '2-3L', '3L+']
const MEAL_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snacks']

const formatLogDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DailyLogEditor({
  date,
  log,
  loading,
  meals = [],
  vitals = { waterIntake: '', sleepHours: '', steps: '' },
  mealType = 'breakfast',
  onMealTypeChange,
  onAddFood,
  onVitalsChange,
  onSave,
}){
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingFood, setPendingFood] = useState(null)
  const [pendingQuantity, setPendingQuantity] = useState('1')

  useEffect(() => {
    setStatus('')
    setPendingFood(null)
    setPendingQuantity('1')
  }, [log, vitals])

  const handleSelectFood = (food) => {
    setPendingFood(food)
    setPendingQuantity('1')
    setStatus('')
  }

  const handleAddFood = () => {
    if (!pendingFood) return
    const quantity = Math.max(1, Number(pendingQuantity) || 1)
    if (onAddFood) onAddFood(pendingFood, mealType, quantity)
    setStatus(`${pendingFood.name} added to ${mealType}.`)
    setPendingFood(null)
    setPendingQuantity('1')
  }

  const save = async () => {
    if (!onSave) return

    const payload = {
      date: formatLogDate(date),
      waterIntake: vitals.waterIntake || undefined,
      sleepHours: vitals.sleepHours === '' ? undefined : Number(vitals.sleepHours),
      steps: vitals.steps === '' ? undefined : Number(vitals.steps),
      meals: meals.map((meal) => ({
        type: meal.type,
        items: meal.items.map((item) => ({
          foodId: item.foodId,
          quantity: Number(item.quantity) || 1,
        })),
      })),
    }

    try {
      setSaving(true)
      setStatus('')
      await onSave(payload)
      setStatus('Daily log saved.')
    } catch (err) {
      setStatus(err?.payload?.message || err?.message || 'Unable to save daily log.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="muted">Loading...</div>

  return (
    <div className="daily-editor">
      <div className="vitals">
        <div className="field">
          <select
            value={vitals.waterIntake}
            onChange={(e) => onVitalsChange && onVitalsChange({ ...vitals, waterIntake: e.target.value })}
            aria-label="Water intake"
          >
            <option value="">Water</option>
            {WATER_OPTIONS.filter(Boolean).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="field-hint">Choose the closest daily range.</div>
        </div>
        <Input label="Sleep (hours)" value={vitals.sleepHours} onChange={e => onVitalsChange && onVitalsChange({ ...vitals, sleepHours: e.target.value })} type="number" min="0" max="24" />
        <Input label="Steps" value={vitals.steps} onChange={e => onVitalsChange && onVitalsChange({ ...vitals, steps: e.target.value })} type="number" min="0" />
      </div>

      <div className="meals">
        <h4>Meals</h4>
        <div className="feature-chip-row">
          {MEAL_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              className={`feature-chip ${mealType === type ? 'active' : ''}`}
              onClick={() => onMealTypeChange && onMealTypeChange(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <FoodSearch onSelect={handleSelectFood} placeholder={`Search foods for ${mealType}...`} />

        {pendingFood ? (
          <div className="meal-add-card">
            <div className="meal-add-copy">
              <strong>{pendingFood.name}</strong>
              <span>
                {pendingFood.caloriesPerUnit} kcal • {pendingFood.proteinPerUnit || 0} g protein • per {pendingFood.unit}
              </span>
            </div>
            <div className="meal-add-controls">
              <input
                className="meal-qty-input"
                type="number"
                min="1"
                value={pendingQuantity}
                onChange={(e) => setPendingQuantity(e.target.value)}
                aria-label={`Quantity for ${pendingFood.name}`}
              />
              <button
                type="button"
                className="meal-add-btn"
                onClick={handleAddFood}
              >
                Add
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {status ? <div className="feature-inline-note">{status}</div> : null}

      <div className="actions" style={{ marginTop: 12 }}>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
