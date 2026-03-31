import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import '../styles/global.css'

export default function Landing(){
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 32px'}}>
        <div style={{fontWeight:700,fontSize:20,color:'var(--color-primary)'}}>AQTEV</div>
        <nav style={{display:'flex',gap:12,alignItems:'center'}}>
          <Link to="/signin" style={{textDecoration:'none',color:'var(--color-muted)'}}>Sign in</Link>
          <Link to="/signup"><Button variant="primary">Get started</Button></Link>
        </nav>
      </header>

      <main style={{display:'grid',gridTemplateColumns:'1fr 460px',gap:40,alignItems:'center',padding:'48px 64px'}}>
        <section>
          <h1 style={{fontSize:'var(--fs-xxl)',margin:0}}>Smarter health tracking for professionals</h1>
          <p style={{color:'var(--color-muted)',marginTop:12,maxWidth:560}}>AQTEV helps you collect, visualize and act on daily health data — with elegant dashboards and simple workflows for your team and customers.</p>

          <div style={{display:'flex',gap:12,marginTop:20}}>
            <Link to="/signup"><Button>Start free</Button></Link>
            <Link to="/signin"><Button variant="ghost">Schedule demo</Button></Link>
          </div>

          <section style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:36}}>
            <Card><div style={{fontWeight:700}}>1,234</div><div style={{color:'var(--color-muted)'}}>Active users</div></Card>
            <Card><div style={{fontWeight:700}}>$12k</div><div style={{color:'var(--color-muted)'}}>Monthly revenue</div></Card>
            <Card><div style={{fontWeight:700}}>85%</div><div style={{color:'var(--color-muted)'}}>Health score</div></Card>
          </section>
        </section>

        <aside>
          <Card>
            <h3 style={{marginTop:0}}>Create an account</h3>
            <p style={{color:'var(--color-muted)'}}>Get started with a 14-day free trial — no credit card required.</p>
            <div style={{marginTop:12}}>
              <Link to="/signup"><Button style={{width:'100%'}}>Create account</Button></Link>
            </div>
          </Card>
        </aside>
      </main>

      <footer style={{marginTop:'auto',padding:20,background:'transparent',textAlign:'center',color:'var(--color-muted)'}}>© {new Date().getFullYear()} AQTEV — Built with care.</footer>
    </div>
  )
}
