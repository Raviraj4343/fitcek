import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const PUBLIC_PATHS = ['/', '/signin', '/signup', '/auth']

export default function Layout({ children }){
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  const showSidebar = !PUBLIC_PATHS.includes(pathname)

  return (
    <div className="app-root">
      {(showSidebar || sidebarOpen) && (
        <Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} />
      )}
      {sidebarOpen && <div className="drawer-backdrop" onClick={()=>setSidebarOpen(false)} aria-hidden="true" />}
      <div className={`main-area ${showSidebar ? 'has-sidebar' : 'no-sidebar'}`}>
        <Navbar isSidebarOpen={sidebarOpen} onToggleSidebar={()=>setSidebarOpen(s=>!s)} />
        <main className="content-area" onClick={()=> sidebarOpen && setSidebarOpen(false)}>
          {children}
        </main>
      </div>
    </div>
  )
}
