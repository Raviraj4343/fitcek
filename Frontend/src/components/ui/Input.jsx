import React from 'react'

export default function Input({ id, label, type = 'text', value, onChange, required = false, name, placeholder = ' ', className = '', ...props }){
  const ariaLabel = label || name || undefined
  return (
    <div className={`field ${className}`}>
      <input id={id} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} aria-label={ariaLabel} aria-required={required} {...props} />
      {label && <label htmlFor={id}>{label}</label>}
    </div>
  )
}
