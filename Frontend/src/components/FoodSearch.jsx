import React, { useEffect, useState } from 'react'
import Input from './ui/Input'
import * as api from '../utils/api'

export default function FoodSearch({ onSelect, placeholder = 'Search foods...' }){
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!q || q.trim().length < 1) {
      setResults([])
      setError('')
      return
    }

    let active = true
    const t = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.searchFoods(q.trim())
        if (!active) return
        setResults(res?.data || [])
      } catch (err) {
        if (!active) return
        setResults([])
        setError(err?.payload?.message || err?.message || 'Unable to search foods.')
      } finally {
        if (active) setLoading(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(t)
    }
  }, [q])

  const handleSelect = (food) => {
    if (onSelect) onSelect(food)
    setQ('')
    setResults([])
    setError('')
  }

  return (
    <div className="food-search">
      <Input
        id="food-search"
        name="food-search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
      />

      {(loading || error || results.length > 0 || q.trim()) ? (
        <div className="suggestions">
          {loading ? <div className="muted suggestion-state">Searching...</div> : null}
          {!loading && error ? <div className="muted suggestion-state">{error}</div> : null}
          {!loading && !error && q.trim() && results.length === 0 ? (
            <div className="muted suggestion-state">No foods found.</div>
          ) : null}
          {results.map(r => {
            const meta = [
              r.nameHindi,
              `${r.caloriesPerUnit} kcal`,
              `${r.proteinPerUnit} g protein`,
              r.unit,
            ].filter(Boolean).join(' • ')

            return (
              <button key={r._id} type="button" className="suggestion" onClick={() => handleSelect(r)}>
                <div className="s-left">
                  <div className="s-name">{r.name}</div>
                  <div className="muted">{meta}</div>
                </div>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
