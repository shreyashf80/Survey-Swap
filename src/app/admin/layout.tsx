'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logoutAdmin } from '@/app/actions/adminAuth'
import clsx from 'clsx'

const navItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/surveys', label: 'Surveys' },
  { href: '/admin/fills', label: 'Fill Events' },
  { href: '/admin/credits', label: 'Credit Ledger' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await logoutAdmin()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-mono text-sm">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold uppercase tracking-widest text-gray-100">Ops Dash</h1>
        </div>
        <nav className="flex-grow p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block px-3 py-2 rounded-sm transition-colors uppercase tracking-wider text-xs font-semibold",
                pathname === item.href 
                  ? "bg-gray-800 text-white border-l-4 border-blue-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors uppercase tracking-wider text-xs font-semibold rounded-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        <main className="p-8 overflow-auto flex-grow bg-white text-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
