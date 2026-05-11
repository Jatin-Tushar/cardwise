"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Fuse from "fuse.js"
import { Search, Plus, Trash2, CreditCard, ArrowRight, Send, Bot, User, Loader2, ExternalLink } from "lucide-react"
import { getCardImageUrl, formatIssuer } from "@/lib/cards"
import Link from "next/link"
import type { CardData } from "@/lib/cards"

export default function DashboardClient({ user }: { user: any }) {
  const [wallet, setWallet] = useState<CardData[]>([])
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  
  const [allCards, setAllCards] = useState<CardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CardData[]>([])

  // AI Chat state
  const [aiResult, setAiResult] = useState<{
    myCard: CardData | null;
    myCardReason: string;
    bestOverallCard: CardData | null;
    bestOverallReason: string;
    merchant: string | null;
    category: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

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

  // Scroll chat to bottom on new messages (removed for single response layout)

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
    setAiResult(null)
    setAiError(null)
    setIsChatLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAiError(data.error || "An error occurred.")
        return;
      }

      const { merchant, category, topCards } = data;

      let myCard = null;
      let myCardReason = "";

      // 1. Find best card in wallet
      if (wallet && wallet.length > 0) {
        for (const suggested of topCards) {
          const match = wallet.find((c: any) => 
            suggested.name.toLowerCase().includes(c.name.toLowerCase()) || 
            c.name.toLowerCase().includes(suggested.name.toLowerCase())
          );
          if (match) {
            myCard = match;
            myCardReason = suggested.reason;
            break;
          }
        }
        if (!myCard) {
          myCard = wallet.reduce((prev: any, current: any) => 
            (prev.universalCashbackPercent > current.universalCashbackPercent) ? prev : current
          );
          myCardReason = `Since you don't have a specialized card for ${merchant || category}, this card gives your highest base rate (${myCard.universalCashbackPercent}%).`;
        }
      }

      // 2. Find best overall card from ALL cards
      let bestOverallCard = null;
      let bestOverallReason = "";
      
      if (allCards && allCards.length > 0 && topCards && topCards.length > 0) {
        for (const suggested of topCards) {
          const match = allCards.find((c: any) => 
            suggested.name.toLowerCase().includes(c.name.toLowerCase()) || 
            c.name.toLowerCase().includes(suggested.name.toLowerCase())
          );
          if (match) {
            bestOverallCard = match;
            bestOverallReason = suggested.reason;
            break;
          }
        }
      }

      setAiResult({
        myCard,
        myCardReason,
        bestOverallCard,
        bestOverallReason,
        merchant,
        category
      });
      
    } catch {
      setAiError("Sorry, I couldn't process your request right now. Please try again.")
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
      <div className="max-w-xl mx-auto pt-16 font-sans">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-nd-gold/20 backdrop-blur-md mb-8 border border-nd-gold/50 rounded-2xl">
            <CreditCard className="w-10 h-10 text-nd-gold" />
          </div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase text-nd-white">Build Your Wallet</h2>
          <p className="text-nd-muted font-bold tracking-widest uppercase">Add the credit cards you currently own to start.</p>
        </div>
        
        <div className="bg-nd-navy-light/30 backdrop-blur-xl border border-nd-navy-light/50 p-8 sm:p-10 rounded-3xl shadow-2xl">
          {searchBlock}
          
          <div className="mt-12 mb-10">
            <h3 className="text-sm font-black text-nd-white uppercase tracking-widest mb-6 flex justify-between items-center border-b-2 border-nd-navy-light pb-4">
              <span>Added Cards</span>
              <span className="bg-nd-gold text-nd-navy-dark py-1 px-3 text-xs shadow-[2px_2px_0_0_#ffffff]">{wallet.length}</span>
            </h3>
            {walletBlock}
          </div>

          <div className="flex justify-end pt-8 border-t border-nd-navy-light/50">
            <button 
              onClick={finishOnboarding}
              disabled={wallet.length === 0}
              className="flex items-center gap-2 bg-nd-gold text-nd-navy-dark px-8 py-3 font-black uppercase tracking-widest hover:bg-nd-gold-light active:translate-y-1 disabled:opacity-50 transition-all rounded-xl shadow-lg border border-nd-gold/50"
            >
              Continue to Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // MAIN DASHBOARD VIEW
  const totalFees = wallet.reduce((sum, card) => sum + (card.annualFee || 0), 0)
  
  const totalOpeningPoints = wallet.reduce((sum, card) => {
    const firstOffer = card.offers?.[0];
    if (!firstOffer) return sum;
    const points = firstOffer.amount?.[0]?.amount || 0;
    return sum + points;
  }, 0);
  
  const formattedOpeningPoints = totalOpeningPoints > 1000 
    ? (totalOpeningPoints / 1000).toFixed(0) + "K" 
    : totalOpeningPoints.toString();

  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
  const firstName = user?.name?.split(" ")[0] || "there"
  
  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="mb-12 border-b border-nd-navy-light/50 pb-6">
        <h2 className="text-4xl font-black tracking-tighter mb-2 text-nd-white uppercase">{timeGreeting}, {firstName}</h2>
        <p className="text-nd-muted text-lg tracking-wide uppercase font-semibold">Your Wallet Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Link href="/cards" className="block bg-nd-gold/90 backdrop-blur-xl border border-nd-gold/50 p-8 rounded-3xl shadow-xl hover:bg-nd-gold transition-all cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-nd-navy-dark text-xs tracking-[0.2em] font-bold uppercase mb-4">Total Cards</h3>
              <p className="text-6xl font-black text-nd-navy-dark">{wallet.length}</p>
            </div>
            <ArrowRight className="w-8 h-8 text-nd-navy-dark group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>
        <div className="bg-nd-gold/90 backdrop-blur-xl border border-nd-gold/50 p-8 rounded-3xl shadow-xl">
          <h3 className="text-nd-navy-dark text-xs tracking-[0.2em] font-bold uppercase mb-4">Annual Fees</h3>
          <p className="text-6xl font-black text-nd-navy-dark">${totalFees}</p>
        </div>
        <div className="bg-nd-gold/90 backdrop-blur-xl border border-nd-gold/50 p-8 rounded-3xl shadow-xl">
          <h3 className="text-nd-navy-dark text-xs tracking-[0.2em] font-bold uppercase mb-4">Welcome Bonus Pts</h3>
          <p className="text-6xl font-black text-nd-navy-dark tracking-tighter">{formattedOpeningPoints}</p>
        </div>
      </div>
      
      {/* Ask AI Section */}
      <div className="mb-16 relative group">
        <div className="relative z-10 bg-nd-navy-light/30 backdrop-blur-xl flex items-center border border-nd-navy-light/50 rounded-2xl shadow-xl">
          <Bot className="ml-6 h-8 w-8 text-nd-gold" />
          <input 
            type="text" 
            placeholder="WHERE ARE YOU SHOPPING TODAY?" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            className="w-full bg-transparent py-6 pl-6 pr-6 text-xl font-bold uppercase tracking-wide focus:outline-none text-nd-white placeholder-nd-muted" 
          />
          <button 
            onClick={sendChatMessage}
            disabled={isChatLoading || !chatInput.trim()}
            className="mr-3 bg-nd-gold px-8 py-4 text-nd-navy-dark font-black tracking-widest uppercase hover:bg-nd-gold-light disabled:opacity-50 transition-colors rounded-xl shadow-lg active:translate-y-1"
          >
            ASK
          </button>
        </div>

        {/* Analysis Result Area */}
        {(aiResult || isChatLoading || aiError) && (
          <div className="mt-12 pt-10 border-t border-nd-navy-light/50 relative z-10">
            {isChatLoading ? (
              <div className="flex gap-6 justify-start">
                <div className="w-16 h-16 bg-nd-gold/20 backdrop-blur-md border border-nd-gold/50 rounded-2xl flex items-center justify-center shrink-0">
                  <Bot className="w-8 h-8 text-nd-gold animate-pulse" />
                </div>
                <div className="bg-nd-navy-light/30 backdrop-blur-xl border border-nd-navy-light/50 rounded-2xl px-8 py-5 flex items-center gap-4 shadow-xl">
                  <Loader2 className="w-6 h-6 text-nd-gold animate-spin" />
                  <span className="text-nd-white font-bold tracking-widest uppercase">Analyzing Data...</span>
                </div>
              </div>
            ) : aiError ? (
              <div className="bg-red-900/40 backdrop-blur-xl border border-red-500/50 rounded-2xl p-6 text-white font-bold tracking-widest uppercase shadow-xl">
                {aiError}
              </div>
            ) : aiResult ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-2xl font-black text-nd-white uppercase tracking-tight border-l-4 border-nd-gold pl-4">
                  ANALYSIS: <span className="text-nd-gold">{aiResult.merchant || aiResult.category}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                  {/* Your Best Card */}
                  <div className="bg-nd-navy-light/30 backdrop-blur-xl border border-nd-navy-light/50 p-8 rounded-3xl relative shadow-xl flex flex-col overflow-hidden">
                    <div className="absolute top-0 right-0 bg-nd-gold text-nd-navy-dark text-xs font-black px-4 py-2 uppercase tracking-[0.2em] rounded-bl-2xl">
                      USE THIS CARD
                    </div>
                    {aiResult.myCard ? (
                      <div className="flex flex-col gap-6 mt-6 flex-1">
                        <CardImage card={aiResult.myCard} size="lg" />
                        <div>
                          <div className="font-black text-nd-white text-2xl uppercase tracking-tight mb-2">{aiResult.myCard.name}</div>
                          <p className="text-nd-offwhite font-medium text-lg leading-snug border-l-2 border-nd-gold pl-4">{aiResult.myCardReason}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-nd-muted font-bold tracking-widest uppercase mt-8">NO CARDS IN WALLET</div>
                    )}
                  </div>
                  
                  {/* Best Overall Card */}
                  {aiResult.bestOverallCard && (aiResult.myCard?.cardId !== aiResult.bestOverallCard.cardId) && (
                    <div className="bg-nd-navy-dark/40 backdrop-blur-xl border border-nd-navy-light/30 p-8 rounded-3xl relative shadow-xl flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 bg-nd-muted text-nd-navy-dark text-xs font-black px-4 py-2 uppercase tracking-[0.2em] rounded-bl-2xl">
                        TOP ALTERNATIVE
                      </div>
                      <div className="flex flex-col gap-6 mt-6 flex-1">
                        <CardImage card={aiResult.bestOverallCard} size="lg" />
                        <div className="flex-1">
                          <div className="font-black text-nd-white text-2xl uppercase tracking-tight mb-2">{aiResult.bestOverallCard.name}</div>
                          <p className="text-nd-muted font-medium text-lg leading-snug">{aiResult.bestOverallReason}</p>
                        </div>
                        {aiResult.bestOverallCard.url && (
                          <div className="pt-6 mt-auto">
                            <a 
                              href={aiResult.bestOverallCard.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-3 w-full bg-nd-white/10 hover:bg-nd-white/20 text-nd-white py-4 rounded-xl font-black tracking-widest uppercase transition-colors border border-nd-white/30 backdrop-blur-md"
                            >
                              APPLY NOW <ExternalLink className="w-5 h-5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
