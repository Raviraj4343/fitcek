import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Brand from '../components/Brand'
import '../styles/global.css'

export default function Landing(){
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>

      <main className="landing-main">
        <section className="hero">
          <h1 style={{fontSize:'var(--fs-xxl)',margin:0}}><Brand textOnly inline /> — Health tracking built for teams</h1>
          <p style={{color:'var(--color-muted)',marginTop:12, maxWidth:680}}><Brand textOnly inline /> helps clinics, coaches, and wellness teams capture reliable daily measurements, track progress over time, and turn observations into simple, shareable action plans. Secure and team-friendly, <Brand textOnly inline /> is built to support better client outcomes.</p>

          <div style={{display:'flex',gap:12,marginTop:20}}>
            <Link to="/signup"><Button>Get started — free</Button></Link>
            <Link to="/signin"><Button variant="ghost">View demo</Button></Link>
          </div>

          <div style={{marginTop:36}}>
            <p style={{color:'var(--color-muted)',maxWidth:680}}>Trusted by care teams for dependable monitoring and clear progress reporting — without adding complexity to daily workflows.</p>
          </div>
        </section>

        {/* Aside CTA removed as per design preference */}
      </main>

      <footer style={{marginTop:'auto',padding:20,background:'transparent',textAlign:'center',color:'var(--color-muted)'}}>© {new Date().getFullYear()} <Brand textOnly inline /> — Built with care.</footer>
    </div>
  )
}
