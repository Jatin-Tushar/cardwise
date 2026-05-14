"use client"

import { useState, useEffect, useMemo } from "react"
import Fuse from "fuse.js"
import { Search, Plus, Trash2, CreditCard, ExternalLink, X, ChevronDown } from "lucide-react"
import { getCardImageUrl, formatIssuer } from "@/lib/cards"
import type { CardData } from "@/lib/cards"

const formatNetwork = (network: string) => {
  if (!network) return ""
  return network.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function MyCardsClient() {
  const [wallet, setWallet] = useState<CardData[]>([])
  const [allCards, setAllCards] = useState<CardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CardData[]>([])
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("cardwise_wallet")
    if (saved) setWallet(JSON.parse(saved))

    fetch('https://raw.githubusercontent.com/andenacitelli/credit-card-bonuses-api/main/exports/data.json')
      .then(res => res.json())
      .then(data => { setAllCards(data); setIsLoading(false) })
      .catch(err => { console.error(err); setIsLoading(false) })
  }, [])

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
    if (!searchQuery) { setSearchResults([]); return }
    const results = fuse.search(searchQuery).map(res => res.item).slice(0, 8)
    setSearchResults(results)
  }, [searchQuery, fuse])

  const addToWallet = (card: CardData) => {
    if (wallet.find(c => c.cardId === card.cardId)) return
    const newWallet = [...wallet, card]
    setWallet(newWallet)
    localStorage.setItem("cardwise_wallet", JSON.stringify(newWallet))
    setSearchQuery("")
    setShowSearch(false)
  }

  const removeFromWallet = (id: string) => {
    const newWallet = wallet.filter(c => c.cardId !== id)
    setWallet(newWallet)
    localStorage.setItem("cardwise_wallet", JSON.stringify(newWallet))
    if (selectedCard?.cardId === id) setSelectedCard(null)
  }

  const CardImageBlock = ({ card, size = "md" }: { card: CardData; size?: "sm" | "md" | "lg" }) => {
    const [imgError, setImgError] = useState(false)
    const sizeClasses = { sm: "w-12 h-8", md: "w-24 h-16", lg: "w-48 h-32" }
    const imgUrl = getCardImageUrl(card.imageUrl)
    if (!imgUrl || imgError) {
      return (
        <div className={`${sizeClasses[size]} bg-nd-navy-light/40 backdrop-blur-md flex items-center justify-center border border-nd-white/20 rounded-xl shadow-lg`}>
          <CreditCard className={size === "lg" ? "w-10 h-10 text-nd-white" : size === "md" ? "w-6 h-6 text-nd-white" : "w-4 h-4 text-nd-white"} />
        </div>
      )
    }
    return <img src={imgUrl} alt={card.name} className={`${sizeClasses[size]} object-cover border border-nd-white/20 rounded-xl shadow-lg`} onError={() => setImgError(true)} />
  }

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-12 border-b border-nd-navy-light/50 pb-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2 uppercase text-nd-white">My Cards</h2>
          <p className="text-nd-muted font-bold tracking-widest uppercase">{wallet.length} card{wallet.length !== 1 ? "s" : ""} in your wallet</p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 bg-nd-gold text-nd-navy-dark px-6 py-3 font-black uppercase tracking-widest hover:bg-nd-gold-light active:translate-y-1 transition-all rounded-xl shadow-lg border border-nd-gold/50"
        >
          <Plus className="w-5 h-5" /> Add Card
        </button>
      </div>

      {/* Add Card Search */}
      {showSearch && (
        <div className="bg-nd-navy-light/30 backdrop-blur-xl border border-nd-navy-light/50 p-8 rounded-3xl shadow-2xl mb-12 relative">
          <button onClick={() => { setShowSearch(false); setSearchQuery("") }} className="absolute top-6 right-6 text-nd-muted hover:text-nd-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h3 className="font-black text-nd-white uppercase tracking-widest mb-6">Search & Add a Card</h3>
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-nd-muted" />
            <input
              type="text"
              placeholder={isLoading ? "LOADING..." : `SEARCH FROM ${allCards.length} CARDS...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-nd-navy-dark/50 border border-nd-navy-light/50 py-4 pl-14 pr-4 rounded-xl text-nd-white uppercase font-bold tracking-widest focus:outline-none focus:border-nd-gold transition-colors placeholder-nd-muted shadow-inner"
            />
          </div>
          {searchQuery && (
            <div className="mt-4 bg-nd-navy-dark/80 backdrop-blur-md border border-nd-navy-light/50 rounded-xl max-h-72 overflow-y-auto shadow-xl">
              {searchResults.length > 0 ? searchResults.map(card => (
                <div key={card.cardId} className="flex items-center gap-4 p-4 border-b border-nd-navy-light/30 hover:bg-nd-navy-light/40 transition-colors cursor-pointer group" onClick={() => addToWallet(card)}>
                  <CardImageBlock card={card} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-nd-white uppercase tracking-wide truncate">{card.name}</div>
                    <div className="text-xs text-nd-gold font-bold tracking-widest uppercase mt-1">{formatIssuer(card.issuer)} • ${card.annualFee}/YR</div>
                  </div>
                  <Plus className="w-6 h-6 text-nd-muted group-hover:text-nd-gold transition-colors shrink-0" />
                </div>
              )) : <div className="p-6 text-center font-bold tracking-widest uppercase text-nd-muted">No cards found</div>}
            </div>
          )}
        </div>
      )}

      <div>
        {wallet.length === 0 ? (
          <div className="bg-nd-navy-light/20 backdrop-blur-xl border border-nd-navy-light/50 rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-2xl">
            <CreditCard className="w-16 h-16 text-nd-muted mx-auto mb-6" />
            <p className="text-nd-white font-bold tracking-widest uppercase mb-6 text-xl">No cards in your wallet yet.</p>
            <button onClick={() => setShowSearch(true)} className="text-nd-gold hover:text-nd-white font-black tracking-widest uppercase transition-colors border-b-2 border-nd-gold pb-1 hover:border-nd-white">
              + ADD YOUR FIRST CARD
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {wallet.map(card => {
              const isSelected = selectedCard?.cardId === card.cardId;
              return (
                <div
                  key={card.cardId}
                  className={`bg-nd-navy-light/20 backdrop-blur-md border rounded-2xl transition-all group overflow-hidden ${isSelected ? "border-nd-gold shadow-lg shadow-nd-gold/20 scale-[1.02]" : "border-nd-navy-light/50 hover:border-nd-gold/50 shadow-lg hover:shadow-xl hover:bg-nd-navy-light/30"}`}
                >
                  <div className="p-6 cursor-pointer" onClick={() => setSelectedCard(isSelected ? null : card)}>
                    <div className="flex items-start gap-6">
                      <CardImageBlock card={card} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-nd-white uppercase tracking-wide truncate group-hover:text-nd-gold transition-colors">{card.name}</div>
                        <div className="text-xs text-nd-muted font-bold uppercase tracking-widest mt-2">{formatIssuer(card.issuer)}</div>
                        <div className="text-xs text-nd-muted font-bold uppercase tracking-widest mt-1">{formatNetwork(card.network)}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-nd-navy-light/50">
                      <div className="text-sm font-black text-nd-white uppercase tracking-widest">${card.annualFee}<span className="text-nd-muted">/YR</span></div>
                      <div className="text-sm font-black text-nd-gold uppercase tracking-widest">{card.universalCashbackPercent}% BASE</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="bg-nd-navy-dark/60 backdrop-blur-lg border-t border-nd-gold/50 p-6 px-8 animate-in slide-in-from-top-4 fade-in duration-300">
                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between py-3 border-b border-nd-navy-light/30">
                          <span className="text-sm font-bold uppercase tracking-widest text-nd-muted">Network</span>
                          <span className="text-sm font-black uppercase tracking-widest text-nd-white">{formatNetwork(card.network)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-nd-navy-light/30">
                          <span className="text-sm font-bold uppercase tracking-widest text-nd-muted">Annual Fee</span>
                          <span className="text-sm font-black uppercase tracking-widest text-nd-white">${card.annualFee}{card.isAnnualFeeWaived ? " (waived)" : ""}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-nd-navy-light/30">
                          <span className="text-sm font-bold uppercase tracking-widest text-nd-muted">Base Cashback</span>
                          <span className="text-sm font-black uppercase tracking-widest text-nd-gold">{card.universalCashbackPercent}%</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-nd-navy-light/30">
                          <span className="text-sm font-bold uppercase tracking-widest text-nd-muted">Type</span>
                          <span className="text-sm font-black uppercase tracking-widest text-nd-white">{card.isBusiness ? "Business" : "Personal"}</span>
                        </div>
                        {card.offers && card.offers.length > 0 && (
                          <div className="py-3 border-b border-nd-navy-light/30">
                            <span className="text-sm font-bold uppercase tracking-widest text-nd-muted block mb-2">Sign-up Bonus</span>
                            <span className="text-sm font-black uppercase tracking-wide text-nd-gold">
                              SPEND ${card.offers[0].spend?.toLocaleString()} IN {card.offers[0].days} DAYS
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        {card.url && (
                          <a href={card.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex flex-1 items-center justify-center gap-3 bg-nd-white/10 hover:bg-nd-white/20 text-nd-white py-4 rounded-xl font-black tracking-widest uppercase transition-colors border border-nd-white/30 backdrop-blur-md">
                            <ExternalLink className="w-5 h-5" /> VIEW SITE
                          </a>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromWallet(card.cardId); }}
                          className="flex flex-1 items-center justify-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-4 rounded-xl font-black tracking-widest uppercase transition-colors"
                        >
                          <Trash2 className="w-5 h-5" /> REMOVE
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
