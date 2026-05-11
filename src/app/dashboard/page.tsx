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
    <div className="min-h-screen bg-nd-navy-dark text-nd-offwhite font-sans selection:bg-nd-gold/30">
      <header className="border-b-2 border-nd-gold bg-nd-navy sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-nd-gold rounded-none flex items-center justify-center font-bold text-nd-navy-dark text-xl uppercase tracking-tighter shadow-[4px_4px_0_0_#ffffff]">C</div>
            <h1 className="text-2xl font-bold tracking-widest uppercase text-nd-white">Cardwise</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="/cards" className="text-sm font-bold tracking-widest uppercase text-nd-gold hover:text-nd-white transition-colors hidden sm:inline-block">
              My Cards
            </a>

            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button type="submit" className="text-sm font-bold tracking-widest uppercase text-nd-muted hover:text-nd-white transition-colors flex items-center gap-2 group">
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline-block">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="px-6 py-12">
        <DashboardClient user={session.user} />
      </main>
    </div>
  )
}
