import React from 'react'

function Card({ title, children }){
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  )
}

export default function Dashboard(){
  return (
    <div className="page dashboard">
      <h1>Dashboard</h1>
      <div className="grid">
        <Card title="Active Users">1,234</Card>
        <Card title="Monthly MRR">$12,345</Card>
        <Card title="Health Score">85%</Card>
      </div>
    </div>
  )
}
