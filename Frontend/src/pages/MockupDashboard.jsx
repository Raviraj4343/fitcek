import React from 'react'
import Card from '../components/ui/Card'
import '../styles/global.css'

export default function MockupDashboard(){
  const stats = [
    { id: 'users', label: 'Active Users', value: '1,234' },
    { id: 'mrr', label: 'Monthly MRR', value: '$12,345' },
    { id: 'score', label: 'Health Score', value: '85%' }
  ]
  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand">AQTEV</div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" aria-label="Toggle sidebar">☰</button>
          </div>
          <div className="topbar-right">
            <a className="avatar">RR</a>
          </div>
        </header>

        <main className="content-area">
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div className="dashboard-top">
              <h1>Dashboard</h1>
              <p style={{color:'var(--color-muted)'}}>Overview of your key metrics and recent activity</p>
            </div>

            <section className="stats-grid">
              {stats.map(s => (
                <Card key={s.id} className="stat-card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:18}}>{s.value}</div>
                      <div style={{color:'var(--color-muted)',fontSize:13}}>{s.label}</div>
                    </div>
                    <div style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:10,background:'linear-gradient(180deg,rgba(37,99,235,0.09),rgba(29,78,216,0.06))'}}> 
                      {/* icon placeholder */}
                    </div>
                  </div>
                </Card>
              ))}
            </section>

            <section className="dashboard-grid">
              <Card title="Recent activity" className="activity-card">
                <ul className="activity-list">
                  <li className="activity-item"><div className="activity-text">New user signed up: alice@example.com</div><div className="activity-time">2h</div></li>
                  <li className="activity-item"><div className="activity-text">Payment received: $99</div><div className="activity-time">8h</div></li>
                </ul>
              </Card>

              <Card title="Subscriptions">
                <div className="subs-list">
                  <div className="sub-row"><div>Starter</div><div>$29/mo</div></div>
                  <div className="sub-row"><div>Pro</div><div>$199/mo</div></div>
                </div>
              </Card>
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}
