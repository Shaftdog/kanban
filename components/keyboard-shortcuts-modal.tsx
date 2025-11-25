'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ShortcutGroup {
  title: string
  shortcuts: Array<{
    keys: string[]
    description: string
  }>
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'B'], description: 'Go to Board' },
      { keys: ['G', 'P'], description: 'Go to Projects' },
      { keys: ['G', 'A'], description: 'Go to Analytics' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    title: 'Board Actions',
    shortcuts: [
      { keys: ['N'], description: 'New milestone' },
      { keys: ['F'], description: 'Focus search' },
      { keys: ['R'], description: 'Refresh board' },
    ],
  },
  {
    title: 'Modal & Dialog',
    shortcuts: [
      { keys: ['Esc'], description: 'Close modal/dialog' },
      { keys: ['Enter'], description: 'Submit form' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Ctrl', 'K'], description: 'Quick search' },
    ],
  },
]

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Show shortcuts modal on ? key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setOpen(true)
      }

      // Handle navigation shortcuts (g + letter)
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
        const handleSecondKey = (e2: KeyboardEvent) => {
          const key = e2.key.toLowerCase()
          if (key === 'b') {
            window.location.href = '/board'
          } else if (key === 'p') {
            window.location.href = '/projects'
          } else if (key === 'a') {
            window.location.href = '/analytics'
          } else if (key === 's') {
            window.location.href = '/settings'
          }
          document.removeEventListener('keydown', handleSecondKey)
        }
        document.addEventListener('keydown', handleSecondKey, { once: true })
        // Clear listener after 1 second if no second key pressed
        setTimeout(() => {
          document.removeEventListener('keydown', handleSecondKey)
        }, 1000)
      }

      // Quick search with Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        // Focus search if on board page
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-slate-400 text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">?</kbd> anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
