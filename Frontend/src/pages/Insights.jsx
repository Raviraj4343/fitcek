import React, { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import * as api from '../utils/api'

export default function Insights(){
  const [todayInsight, setTodayInsight] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([api.getTodayInsight(), api.getWeeklySummary()])
      .then(([todayResponse, weeklyResponse]) => {
        if (!mounted) return
        setTodayInsight(todayResponse?.data || null)
        setWeeklySummary(weeklyResponse?.data || null)
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  const score = weeklySummary?.overallScore
  const scorePercent = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0

  return (
    <div className="page feature-page feature-insights">
      <section className="feature-hero card">
        <div className="feature-hero-copy">
          <span className="feature-eyebrow">Insights</span>
          <h1>Summaries and recommendations</h1>
          <p className="muted">
            See today&apos;s nutrition picture and a weekly health summary generated from your real logs and profile targets.
          </p>
        </div>
        <div className="feature-hero-aside">
          <span className="feature-date-chip">{todayInsight?.date || 'Today'}</span>
          <div className="feature-orbit feature-orbit-score">
            <strong>{loading ? '-' : score ?? '-'}</strong>
            <span>{typeof score === 'number' ? 'weekly score' : 'waiting for data'}</span>
          </div>
        </div>
      </section>

      <section className="feature-layout">
        <Card className="feature-main-panel">
          <div className="feature-panel-head">
            <div>
              <h3>Today&apos;s report</h3>
              <p className="muted">A simple view of what you have consumed so far today.</p>
            </div>
          </div>

          {todayInsight ? (
            <div className="feature-stack-list">
              <div className="feature-list-row">
                <div>
                  <strong>Calories consumed today</strong>
                  <span>From today&apos;s logged meals</span>
                </div>
                <div className="feature-list-metric">{todayInsight.today?.calories ?? 0} kcal</div>
              </div>
              <div className="feature-list-row">
                <div>
                  <strong>Protein intake today</strong>
                  <span>From today&apos;s logged meals</span>
                </div>
                <div className="feature-list-metric">{todayInsight.today?.protein ?? 0} g</div>
              </div>
            </div>
          ) : (
            <div className="feature-empty">
              <strong>No insight available yet</strong>
              <p className="muted">Complete your profile and start logging daily data to generate personalized recommendations.</p>
            </div>
          )}
        </Card>

        <Card className="feature-side-panel">
          <div className="feature-panel-head">
            <div>
              <h3>Weekly summary</h3>
              <p className="muted">A quick weekly overview based on your recent logs.</p>
            </div>
          </div>

          {weeklySummary ? (
            <>
              <div className="feature-score-track" aria-hidden="true">
                <span style={{ width: `${scorePercent}%` }} />
              </div>
              <div className="feature-stack-list">
                <div className="feature-list-row">
                  <div><strong>Days logged</strong><span>Current analysis window</span></div>
                  <div className="feature-list-metric">{weeklySummary.daysLogged ?? 0}</div>
                </div>
                <div className="feature-list-row">
                  <div><strong>Average calories</strong><span>Per day</span></div>
                  <div className="feature-list-metric">{weeklySummary.averages?.calories ?? 0}</div>
                </div>
                <div className="feature-list-row">
                  <div><strong>Average protein</strong><span>Per day</span></div>
                  <div className="feature-list-metric">{weeklySummary.averages?.protein ?? 0} g</div>
                </div>
                <div className="feature-list-row">
                  <div><strong>Average sleep</strong><span>Logged nights</span></div>
                  <div className="feature-list-metric">{weeklySummary.averages?.sleep ?? '-'}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="feature-empty">
              <strong>No weekly summary</strong>
              <p className="muted">As your daily logs accumulate, this section will show patterns across calories, protein, and sleep.</p>
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
