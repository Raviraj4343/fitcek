import React, { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import api from '../utils/api'

export default function Dashboard(){
  const [stats, setStats] = useState({ bmi: null, requiredCalories: null, requiredProtein: null })
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{
        const res = await api.getHealthStats()
        if(!mounted) return
        const d = res?.data || {}
        setStats({ bmi: d.bmi, requiredCalories: d.requiredCalories, requiredProtein: d.requiredProtein })
      }catch(e){
        // ignore
      }finally{ if(mounted) setLoading(false) }
    }
    load()
    return ()=>{ mounted = false }
  }, [])

  return (
    <div className="page dashboard">
      <div className="dashboard-top">
        <h1>Dashboard</h1>
        <p className="muted">Overview of your key metrics and recent activity</p>
      </div>

      <section className="stats-grid">
        <Card className="stat-card">
          <div className="stat-row">
            <div>
              <div className="stat-value">{loading ? '—' : (stats.bmi ?? '—')}</div>
              <div className="stat-label">BMI</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-row">
            <div>
              <div className="stat-value">{loading ? '—' : (stats.requiredCalories ?? '—')}</div>
              <div className="stat-label">Daily Calories (est.)</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-row">
            <div>
              <div className="stat-value">{loading ? '—' : (stats.requiredProtein ?? '—')}</div>
              <div className="stat-label">Daily Protein (g)</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="dashboard-grid">
        <Card title="Recent activity" className="activity-card">
          <div className="muted">No recent activity available.</div>
        </Card>

        <Card title="Profile summary" className="subs-card">
          <div className="muted">Open your profile to complete setup and view personalized recommendations.</div>
        </Card>
      </section>
    </div>
  )
}
