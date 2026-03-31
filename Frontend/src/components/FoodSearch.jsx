import React, { useEffect, useState } from 'react'
import Input from './ui/Input'
import * as api from '../utils/api'

export default function FoodSearch({ onSelect, placeholder = 'Search foods...' }){
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (!q || q.trim().length < 1) { setResults([]); return }
    let t = setTimeout(async ()=>{
      setLoading(true)
      try{
        const res = await api.searchFoods(q)
        setResults(res?.data || [])
      }catch(err){ setResults([]) }
      setLoading(false)
    }, 300)
    return ()=> clearTimeout(t)
  }, [q])

  return (
    <div className="food-search">
      <Input name="food-search" value={q} onChange={e=>setQ(e.target.value)} placeholder={placeholder} />
      <div className="suggestions">
        {loading && <div className="muted">Searching…</div>}
        {results.map(r=> (
          <div key={r._id} className="suggestion" onClick={()=> onSelect && onSelect(r)}>
            <div className="s-left">
              <div className="s-name">{r.name}</div>
              <div className="muted">{r.caloriesPerUnit} kcal • {r.unit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
