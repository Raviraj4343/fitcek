import React from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function DesignSystem(){
  return (
    <div style={{padding:24}}>
      <h1>Design system — tokens & components</h1>

      <section style={{marginTop:20}}>
        <h2>Buttons</h2>
        <div style={{display:'flex',gap:12}}>
          <Button>Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h2>Inputs</h2>
        <div style={{maxWidth:420}}>
          <Input id="ds-email" label="Email" type="email" value="" onChange={()=>{}} />
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h2>Cards</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Card title="Card title">Card body content</Card>
          <Card>Simple card</Card>
        </div>
      </section>

    </div>
  )
}
