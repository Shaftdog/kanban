import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 lg:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 lg:mb-8 text-slate-900 dark:text-white">
          AI-Powered Kanban Board
        </h1>
        <p className="mb-8 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Intelligent task management with AI-powered prioritization
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-slate-900 dark:text-white"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  )
}
