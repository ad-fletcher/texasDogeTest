'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function NavBar() {
  return (
    <nav className="w-full bg-stone-50 border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6 lg:px-16">
        <Link href="/" aria-label="Go to home" className="group">
          <span className="text-xl font-bold text-slate-900 font-serif tracking-wide group-hover:opacity-80">
            Texas DOGE
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/analyst">
            <Button
              variant="outline"
              className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
            >
              Analyst
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}


