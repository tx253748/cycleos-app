'use client'

import { useAuth } from './contexts/AuthContext'
import { LoginScreen } from './components/LoginScreen'
import CycleOS from './components/CycleOS'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <CycleOS />
}
