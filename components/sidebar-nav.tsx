'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/board', label: 'Kanban Board' },
  { href: '/projects', label: 'Projects' },
  { href: '/settings', label: 'Settings' },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="p-4 space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'block px-4 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-medium',
            pathname === item.href
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'text-slate-700 dark:text-slate-300'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
