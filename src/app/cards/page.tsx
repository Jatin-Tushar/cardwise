import { auth } from "@/auth"
import { redirect } from "next/navigation"
import MyCardsClient from "@/components/cards/MyCardsClient"

export default async function MyCardsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-nd-navy-dark text-nd-offwhite font-sans selection:bg-nd-gold/30">
      <header className="border-b-2 border-nd-gold bg-nd-navy sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-nd-gold rounded-none flex items-center justify-center font-bold text-nd-navy-dark text-xl tracking-tighter shadow-[4px_4px_0_0_#ffffff]">C</div>
              <h1 className="text-2xl font-bold tracking-widest text-nd-white">Cardwise</h1>
            </a>
          </div>
            <a href="/dashboard" className="text-sm font-bold tracking-widest text-nd-gold hover:text-nd-white transition-colors">← Back to Dashboard</a>
        </div>
      </header>

      <main className="px-6 py-12">
        <MyCardsClient />
      </main>
    </div>
  )
}
