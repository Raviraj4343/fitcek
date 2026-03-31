import React from 'react'

export default function Button({ children, variant = 'primary', disabled, ...props }){
  const cls = variant === 'ghost' ? 'btn-ghost' : 'btn-primary'
  return (
    <button className={cls} disabled={disabled} {...props}>{children}</button>
  )
}
