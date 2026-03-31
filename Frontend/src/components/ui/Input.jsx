import React from 'react'

export default function Input({ id, label, type='text', value, onChange, required=false, name }){
  return (
    <div className="field">
      <input id={id} name={name} type={type} value={value} onChange={onChange} placeholder=" " required={required} />
      {label && <label htmlFor={id}>{label}</label>}
    </div>
  )
}
