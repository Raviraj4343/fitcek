import React from 'react'

export default function Button({ children, variant = 'primary', disabled = false, className = '', type = 'button', ...props }){
  const base = variant === 'ghost' ? 'btn-ghost' : 'btn-primary'
  const cls = [base, className].filter(Boolean).join(' ')
  return (
    <button type={type} className={cls} disabled={disabled} aria-disabled={disabled} {...props}>{children}</button>
  )
}
