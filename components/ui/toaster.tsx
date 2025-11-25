'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          title: 'text-slate-900 dark:text-white',
          description: 'text-slate-600 dark:text-slate-400',
          actionButton: 'bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900',
          cancelButton: 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white',
          error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
          success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
        },
      }}
      richColors
    />
  )
}
