import React, { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import * as api from '../utils/api'
import WeightChart from '../components/WeightChart'

export default function Weight(){
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    api.getWeightHistory({ days: 30 }).then(r=> setHistory(r?.data || [])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="page weight">
      <div className="page-top">
        <h1>Weight</h1>
        <p className="muted">Track your weight and see trends.</p>
      </div>

      <section className="weight-grid">
        <Card>
          <WeightChart data={history} loading={loading} />
        </Card>
        <Card title="Log weight">
          {/* small form could go here; keep minimal for scaffold */}
          <p className="muted">Use the quick weight log in the dashboard or profile.</p>
        </Card>
      </section>
    </div>
  )
}
