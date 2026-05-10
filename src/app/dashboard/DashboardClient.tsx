"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Fuse from "fuse.js"
import { Search, Plus, Trash2, CreditCard, ArrowRight, Send, Bot, User, Loader2 } from "lucide-react"
import { getCardImageUrl, formatIssuer } from "@/lib/cards"
import type { CardData } from "@/lib/cards"

export default function DashboardClient({ user }: { user: any }) {
  const [wallet, setWallet] = useState<CardData[]>([])
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  
  const [allCards, setAllCards] = useState<CardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CardData[]>([])

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<{role: "user"|"assistant", content: string}[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load wallet from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cardwise_wallet")
    const onboarded = localStorage.getItem("cardwise_onboarded")
    if (saved) setWallet(JSON.parse(saved))
    if (onboarded) setHasCompletedOnboarding(true)

    // Fetch master DB
    fetch('https://raw.githubusercontent.com/andenacitelli/credit-card-bonuses-api/main/exports/data.json')
      .then(res => res.json())
      .then(data => { setAllCards(data); setIsLoading(false) })
      .catch(err => { console.error(err); setIsLoading(false) })
  }, [])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Fuse search setup
  const fuse = useMemo(() => new Fuse(allCards, {
    keys: ['name', 'issuer', 'network'],
    threshold: 0.3
  }), [allCards])

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }
    const results = fuse.search(searchQuery).map(res => res.item).slice(0, 8)
    setSearchResults(results)
  }, [searchQuery, fuse])

  const addToWallet = (card: CardData) => {
    if (wallet.find(c => c.cardId === card.cardId)) return
    const newWallet = [...wallet, card]
    setWallet(newWallet)
    localStorage.setItem("cardwise_wallet", JSON.stringify(newWallet))
    setSearchQuery("")
  }

  const removeFromWallet = (id: string) => {
    const newWallet = wallet.filter(c => c.cardId !== id)
    setWallet(newWallet)
    localStorage.setItem("cardwise_wallet", JSON.stringify(newWallet))
  }

  const finishOnboarding = () => {
    setHasCompletedOnboarding(true)
    localStorage.setItem("cardwise_onboarded", "true")
  }

  // AI Chat handler
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput("")
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }])
    setIsChatLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          wallet: wallet.map(c => ({ name: c.name, issuer: c.issuer, annualFee: c.annualFee, universalCashbackPercent: c.universalCashbackPercent, currency: c.currency })),
        }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process your request right now. Please check your API configuration." }])
    } finally {
      setIsChatLoading(false)
    }
  }

  // Card image component
  const CardImage = ({ card, size = "sm" }: { card: CardData; size?: "sm" | "md" | "lg" }) => {
    const [imgError, setImgError] = useState(false)
    const sizeClasses = { sm: "w-12 h-8", md: "w-20 h-13", lg: "w-32 h-20" }
    const imgUrl = getCardImageUrl(card.imageUrl)

    if (!imgUrl || imgError) {
      return (
        <div className={`${sizeClasses[size]} rounded-md bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-md`}>
          <CreditCard className={size === "sm" ? "w-4 h-4" : "w-6 h-6"} />
        </div>
      )
    }

    return (
      <img
        src={imgUrl}
        alt={card.name}
        className={`${sizeClasses[size]} rounded-md object-cover shadow-md border border-slate-700`}
        onError={() => setImgError(true)}
      />
    )
  }

  // Search block (inline JSX, not a component function)
  const searchBlock = (
    <div className="relative mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder={isLoading ? "Loading card database..." : `Search from ${allCards.length} credit cards...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:opacity-50"
        />
      </div>
      
      {searchQuery && (
        <div className="absolute z-10 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map(card => (
              <div key={card.cardId} className="flex items-center gap-3 p-3 border-b border-slate-700/50 hover:bg-slate-700/60 transition-colors cursor-pointer group" onClick={() => addToWallet(card)}>
                <CardImage card={card} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100 truncate">{card.name}</div>
                  <div className="text-xs text-slate-400">{formatIssuer(card.issuer)} • {card.network} • ${card.annualFee}/yr</div>
                </div>
                <button className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-500">No cards found</div>
          )}
        </div>
      )}
    </div>
  )

  // Wallet block (inline JSX)
  const walletBlock = (
    <div className="space-y-3">
      {wallet.map(card => (
        <div key={card.cardId} className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <CardImage card={card} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-100">{card.name}</div>
            <div className="text-sm text-slate-400">{formatIssuer(card.issuer)} • Fee: ${card.annualFee}/yr • Base: {card.universalCashbackPercent}%</div>
          </div>
          <button onClick={() => removeFromWallet(card.cardId)} className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all shrink-0">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
      {wallet.length === 0 && <div className="text-slate-500 text-center py-8 bg-slate-950/30 rounded-lg border border-dashed border-slate-800">Your wallet is empty. Search above to add cards.</div>}
    </div>
  )

  // ONBOARDING VIEW
  if (!hasCompletedOnboarding) {
    return (
      <div className="max-w-xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-6">
            <CreditCard className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Let&apos;s build your wallet</h2>
          <p className="text-slate-400">Add the credit cards you currently own to start.</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
          {searchBlock}
          
          <div className="mt-8 mb-8">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex justify-between items-center">
              <span>Added Cards</span>
              <span className="bg-indigo-500/20 text-indigo-300 py-0.5 px-2 rounded-full text-xs">{wallet.length}</span>
            </h3>
            {walletBlock}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800/50">
            <button 
              onClick={finishOnboarding}
              disabled={wallet.length === 0}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-indigo-500/20"
            >
              Continue to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // MAIN DASHBOARD VIEW
  const totalFees = wallet.reduce((sum, card) => sum + card.annualFee, 0)
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
  const firstName = user?.name?.split(" ")[0] || "there"
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-1">{timeGreeting}, {firstName} 👋</h2>
        <p className="text-slate-400">Here&apos;s a summary of your current card setup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:border-slate-700 transition-colors">
          <h3 className="text-slate-400 text-sm mb-2 font-medium">Total Cards</h3>
          <p className="text-4xl font-bold text-white tracking-tight">{wallet.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:border-slate-700 transition-colors">
          <h3 className="text-slate-400 text-sm mb-2 font-medium">Total Annual Fees</h3>
          <p className="text-4xl font-bold text-white tracking-tight">${totalFees}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
            <CreditCard className="w-32 h-32" />
          </div>
          <h3 className="text-indigo-200 text-sm mb-2 font-medium relative z-10">Wallet Optimization</h3>
          <p className="text-4xl font-bold text-white tracking-tight relative z-10">Good</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Manage Wallet */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">Manage Wallet</h2>
              <p className="text-slate-400 text-sm">Add new cards or remove old ones to keep your recommendations accurate.</p>
            </div>
            {searchBlock}
            {walletBlock}
          </div>
        </div>
        
        {/* Right Column: AI Chat */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col" style={{ minHeight: "420px" }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Ask AI
            </h3>
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1" style={{ maxHeight: "300px" }}>
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Ask me anything about your cards!</p>
                  <p className="text-xs text-slate-600 mt-1">e.g. &quot;Best card for groceries?&quot;</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"}`}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat input */}
            <div className="relative mt-auto">
              <input 
                type="text" 
                placeholder="e.g. Best card for groceries?" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-white placeholder-slate-500" 
              />
              <button 
                onClick={sendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="absolute right-2 top-2 bg-indigo-600 p-1.5 rounded-md text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
