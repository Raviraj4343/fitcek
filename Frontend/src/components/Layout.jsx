import React from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children }){
  return (
    <div className="app-root">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  )
}
