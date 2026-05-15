"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Fuse from "fuse.js"
import { Search, Plus, Trash2, CreditCard, ArrowRight, Send, Bot, User, Loader2, ExternalLink, Sparkles } from "lucide-react"
import { getCardImageUrl, formatIssuer } from "@/lib/cards"
import Link from "next/link"
import type { CardData } from "@/lib/cards"
import { getUserWallet, updateUserWallet } from "@/lib/actions"

export default function DashboardClient({ user }: { user: any }) {
  const [wallet, setWallet] = useState<CardData[]>([])
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  
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
  const [showBreakdown, setShowBreakdown] = useState<'fees' | 'points' | null>(null)

  // Load wallet from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const { wallet, hasCompletedOnboarding } = await getUserWallet();
        setWallet(wallet);
        setHasCompletedOnboarding(hasCompletedOnboarding);
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setIsDataLoaded(true);
      }
    }
    loadData();

    // Fetch master DB
    fetch('https://raw.githubusercontent.com/andenacitelli/credit-card-bonuses-api/main/exports/data.json')
      .then(res => res.json())
      .then(data => { setAllCards(data); setIsLoading(false) })
      .catch(err => { console.error(err); setIsLoading(false) })
  }, [])

  // Scroll chat to bottom on new messages (removed for single response layout)

  // Fuse search setup
  const fuse = useMemo(() => new Fuse(allCards, {
    keys: [
      { name: 'combined', getFn: (card) => `${card.issuer} ${card.name} ${card.network}` },
      'name', 
      'issuer', 
      'network'
    ],
    threshold: 0.3,
    ignoreLocation: true
  }), [allCards])

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }
    const results = fuse.search(searchQuery).map(res => res.item).slice(0, 8)
    setSearchResults(results)
  }, [searchQuery, fuse])

  const addToWallet = async (card: CardData) => {
    if (wallet.find(c => c.cardId === card.cardId)) return
    const newWallet = [...wallet, card]
    setWallet(newWallet)
    setSearchQuery("")
    await updateUserWallet(newWallet, hasCompletedOnboarding).catch(console.error)
  }

  const removeFromWallet = async (id: string) => {
    const newWallet = wallet.filter(c => c.cardId !== id)
    setWallet(newWallet)
    await updateUserWallet(newWallet, hasCompletedOnboarding).catch(console.error)
  }

  const finishOnboarding = async () => {
    setHasCompletedOnboarding(true)
    await updateUserWallet(wallet, true).catch(console.error)
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
    const sizeClasses = { sm: "w-10 h-6", md: "w-14 h-9", lg: "w-24 h-16" }
    const imgUrl = getCardImageUrl(card.imageUrl)

    if (!imgUrl || imgError) {
      return (
        <div className={`${sizeClasses[size]} rounded-md bg-gradient-to-br from-nd-gold to-nd-gold-dark flex items-center justify-center shadow-sm`}>
          <CreditCard className={size === "sm" ? "w-3 h-3 text-white" : "w-5 h-5 text-white"} />
        </div>
      )
    }

    return (
      <img
        src={imgUrl}
        alt={card.name}
        className={`${sizeClasses[size]} rounded-md object-cover shadow-sm border border-nd-navy-light`}
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
          className="w-full bg-white border border-nd-navy-light rounded-lg py-3 pl-10 pr-4 text-nd-white focus:outline-none focus:ring-2 focus:ring-nd-gold transition-shadow disabled:opacity-50"
        />
      </div>
      
      {searchQuery && (
        <div className="absolute z-10 w-full mt-2 bg-white/95 backdrop-blur-xl border border-nd-navy-light rounded-xl shadow-2xl max-h-80 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map(card => (
              <div key={card.cardId} className="flex items-center gap-3 p-3 border-b border-nd-navy-light hover:bg-nd-navy-dark transition-colors cursor-pointer group" onClick={() => addToWallet(card)}>
                <CardImage card={card} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-nd-white truncate">{card.name}</div>
                  <div className="text-xs text-nd-muted">{formatIssuer(card.issuer)} • {card.network} • ${card.annualFee}/yr</div>
                </div>
                <button className="text-nd-muted group-hover:text-nd-gold transition-colors shrink-0">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-nd-muted">No cards found</div>
          )}
        </div>
      )}
    </div>
  )

  // Wallet block (inline JSX)
  const walletBlock = (
    <div className="space-y-3">
      {wallet.map(card => (
        <div key={card.cardId} className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-nd-navy-light hover:border-nd-gold transition-colors">
          <CardImage card={card} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-nd-white">{card.name}</div>
            <div className="text-sm text-nd-muted">{formatIssuer(card.issuer)} • Fee: ${card.annualFee}/yr • Base: {card.universalCashbackPercent}%</div>
          </div>
          <button onClick={() => removeFromWallet(card.cardId)} className="text-nd-muted hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all shrink-0">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
      {wallet.length === 0 && <div className="text-nd-muted text-center py-8 bg-white/30 rounded-lg border border-dashed border-nd-navy-light">Your wallet is empty. Search above to add cards.</div>}
    </div>
  )

  // ONBOARDING VIEW
  if (!isDataLoaded) {
    return (
      <div className="max-w-xl mx-auto pt-32 flex justify-center">
        <Loader2 className="w-10 h-10 text-nd-gold animate-spin" />
      </div>
    )
  }

  if (!hasCompletedOnboarding) {
    return (
      <div className="max-w-xl mx-auto pt-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-nd-gold/20 backdrop-blur-md mb-8 border border-nd-gold/50 rounded-2xl">
            <CreditCard className="w-10 h-10 text-nd-gold" />
          </div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter text-nd-white">Build Your Wallet</h2>
          <p className="text-nd-muted font-bold tracking-widest">Add the credit cards you currently own to start.</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl border border-nd-navy-light p-8 sm:p-10 rounded-3xl shadow-sm">
          {searchBlock}
          
          <div className="mt-12 mb-10">
            <h3 className="text-sm font-black text-nd-white tracking-widest mb-6 flex justify-between items-center border-b-2 border-nd-navy-light pb-4">
              <span>Added Cards</span>
              <span className="bg-nd-gold text-nd-navy-dark py-1 px-3 text-xs shadow-[2px_2px_0_0_#ffffff]">{wallet.length}</span>
            </h3>
            {walletBlock}
          </div>

          <div className="flex justify-end pt-8 border-t border-nd-navy-light/50">
            <button 
              onClick={finishOnboarding}
              disabled={wallet.length === 0}
              className="flex items-center gap-2 bg-nd-gold text-nd-navy-dark px-8 py-3 font-black tracking-widest hover:bg-nd-gold-light active:translate-y-1 disabled:opacity-50 transition-all rounded-xl shadow-lg border border-nd-gold/50"
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 border-b border-nd-navy-light/50 pb-4">
        <h2 className="text-5xl mb-1 text-nd-gold-dark capitalize">{timeGreeting}, {firstName}</h2>
        <p className="text-nd-muted text-sm tracking-wide font-semibold">Your Wallet Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/cards" className="block bg-white/80 backdrop-blur-xl border border-nd-navy-light p-5 rounded-2xl shadow-sm hover:border-nd-gold transition-all cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-nd-muted text-[10px] tracking-[0.2em] font-bold mb-2">Total Cards</h3>
              <p className="text-3xl font-medium text-nd-white">{wallet.length}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-nd-gold group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <div onClick={() => setShowBreakdown(showBreakdown === 'fees' ? null : 'fees')} className="bg-white/80 backdrop-blur-xl border border-nd-navy-light p-5 rounded-2xl shadow-sm hover:border-nd-gold transition-all cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-nd-muted text-[10px] tracking-[0.2em] font-bold mb-2">Annual Fees</h3>
              <p className="text-3xl font-medium text-nd-white">${totalFees}</p>
            </div>
          </div>
        </div>
        <div onClick={() => setShowBreakdown(showBreakdown === 'points' ? null : 'points')} className="bg-white/80 backdrop-blur-xl border border-nd-navy-light p-5 rounded-2xl shadow-sm hover:border-nd-gold transition-all cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-nd-muted text-[10px] tracking-[0.2em] font-bold mb-2">Welcome Bonus Pts</h3>
              <p className="text-3xl font-medium text-nd-white tracking-tighter">{formattedOpeningPoints}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Breakdown Section */}
      {showBreakdown && (
        <div className="mb-8 p-5 bg-white/90 border border-nd-navy-light rounded-2xl shadow-sm animate-in slide-in-from-top-2">
          <h3 className="text-xs font-black text-nd-white tracking-widest mb-4 border-b border-nd-navy-light pb-2">
            {showBreakdown === 'fees' ? 'Annual Fees Breakdown' : 'Welcome Bonus Breakdown'}
          </h3>
          <div className="space-y-3">
            {[...wallet].sort((a, b) => {
              const valA = showBreakdown === 'fees' ? (a.annualFee || 0) : (a.offers?.[0]?.amount?.[0]?.amount || 0);
              const valB = showBreakdown === 'fees' ? (b.annualFee || 0) : (b.offers?.[0]?.amount?.[0]?.amount || 0);
              return valB - valA;
            }).map(card => {
              const points = card.offers?.[0]?.amount?.[0]?.amount || 0;
              const isFees = showBreakdown === 'fees';
              const val = isFees ? (card.annualFee || 0) : points;
              if (!isFees && !val) return null;
              return (
                <div key={card.cardId} className="flex justify-between items-center text-sm">
                  <span className="text-nd-muted flex items-center gap-3">
                    <CardImage card={card} size="sm" />
                    {card.name}
                  </span>
                  <span className="font-bold text-nd-white">
                    {isFees ? `$${val}` : val.toLocaleString() + ' pts'}
                  </span>
                </div>
              )
            })}
            {showBreakdown !== 'fees' && wallet.every(c => !(c.offers?.[0]?.amount?.[0]?.amount)) && (
              <div className="text-nd-muted text-sm italic">No welcome bonuses found for your current cards.</div>
            )}
          </div>
        </div>
      )}
      
      {/* Ask AI Section */}
      <div className="mb-12 relative group">
        <div className="relative z-10 bg-white/80 backdrop-blur-xl flex items-center border border-nd-navy-light rounded-2xl shadow-sm">
          <Sparkles className="ml-6 h-6 w-6 text-nd-gold" />
          <input 
            type="text" 
            placeholder="Where are you shopping today?" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            className="w-full bg-transparent py-4 pl-4 pr-4 text-lg font-bold tracking-wide focus:outline-none text-nd-white placeholder-nd-muted" 
          />
          <button 
            onClick={sendChatMessage}
            disabled={isChatLoading || !chatInput.trim()}
            className="mr-2 bg-nd-gold px-6 py-3 text-white font-black tracking-widest hover:bg-nd-gold-light disabled:opacity-50 transition-colors rounded-xl shadow-sm active:translate-y-1"
          >
            Ask
          </button>
        </div>

        {/* Analysis Result Area */}
        {(aiResult || isChatLoading || aiError) && (
          <div className="mt-12 pt-10 border-t border-nd-navy-light/50 relative z-10">
            {isChatLoading ? (
              <div className="flex gap-6 justify-start">
                <div className="w-16 h-16 bg-nd-gold/20 backdrop-blur-md border border-nd-gold/50 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-8 h-8 text-nd-gold animate-pulse" />
                </div>
                <div className="bg-white/80 backdrop-blur-xl border border-nd-navy-light rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
                  <Loader2 className="w-5 h-5 text-nd-gold animate-spin" />
                  <span className="text-nd-white text-sm font-bold tracking-widest">Analyzing Data...</span>
                </div>
              </div>
            ) : aiError ? (
              <div className="bg-red-900/40 backdrop-blur-xl border border-red-500/50 rounded-2xl p-6 text-white font-bold tracking-widest shadow-xl">
                {aiError}
              </div>
            ) : aiResult ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-xl font-black text-nd-white tracking-tight border-l-4 border-nd-gold pl-3">
                  Analysis: <span className="text-nd-gold">{aiResult.merchant || aiResult.category}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                  {/* Your Best Card */}
                  <div className="bg-white/80 backdrop-blur-xl border border-nd-navy-light p-6 rounded-2xl relative shadow-sm flex flex-col overflow-hidden">
                    <div className="absolute top-0 right-0 bg-nd-gold text-white text-[10px] font-black px-3 py-1 tracking-[0.2em] rounded-bl-xl">
                      Use This Card
                    </div>
                    {aiResult.myCard ? (
                      <div className="flex flex-col gap-6 mt-6 flex-1">
                        <CardImage card={aiResult.myCard} size="lg" />
                        <div>
                          <div className="font-black text-nd-white text-xl tracking-tight mb-2">{aiResult.myCard.name}</div>
                          <p className="text-nd-muted font-medium text-sm leading-snug border-l-2 border-nd-gold pl-3">{aiResult.myCardReason}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-nd-muted font-bold tracking-widest mt-8">No cards in wallet</div>
                    )}
                  </div>
                  
                  {/* Best Overall Card */}
                  {aiResult.bestOverallCard && (aiResult.myCard?.cardId !== aiResult.bestOverallCard.cardId) && (
                    <div className="bg-white/50 backdrop-blur-xl border border-nd-navy-light p-6 rounded-2xl relative shadow-sm flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 bg-nd-muted text-white text-[10px] font-black px-3 py-1 tracking-[0.2em] rounded-bl-xl">
                        TOP ALTERNATIVE
                      </div>
                      <div className="flex flex-col gap-6 mt-6 flex-1">
                        <CardImage card={aiResult.bestOverallCard} size="lg" />
                        <div className="flex-1">
                          <div className="font-black text-nd-white text-xl tracking-tight mb-2">{aiResult.bestOverallCard.name}</div>
                          <p className="text-nd-muted font-medium text-sm leading-snug">{aiResult.bestOverallReason}</p>
                        </div>
                        {aiResult.bestOverallCard.url && (
                          <div className="pt-6 mt-auto">
                            <a 
                              href={aiResult.bestOverallCard.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full bg-nd-gold/10 hover:bg-nd-gold/20 text-nd-gold py-3 rounded-xl text-xs font-black tracking-widest transition-colors border border-nd-gold/30 backdrop-blur-md"
                            >
                              Apply Now <ExternalLink className="w-4 h-4" />
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
