import { auth } from "@/auth"
import { redirect } from "next/navigation"
import MyCardsClient from "./MyCardsClient"

export default async function MyCardsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-slate-800/80 bg-slate-900/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">C</div>
              <h1 className="text-xl font-bold tracking-tight">Cardwise</h1>
            </a>
          </div>
          <a href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">← Back to Dashboard</a>
        </div>
      </header>

      <main className="px-6 py-8">
        <MyCardsClient />
      </main>
    </div>
  )
}
