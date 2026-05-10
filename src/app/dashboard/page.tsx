import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import { LogOut } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-slate-800/80 bg-slate-900/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">C</div>
            <h1 className="text-xl font-bold tracking-tight">Cardwise</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="/cards" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:inline-block">
              My Cards
            </a>
            <span className="text-sm font-medium text-slate-300 hidden sm:inline-block">
              {session.user.name}
            </span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button type="submit" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 group">
                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm hidden sm:inline-block">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <DashboardClient user={session.user} />
      </main>
    </div>
  )
}
