"use client"

import { useState, useEffect, useMemo } from "react"
import Fuse from "fuse.js"
import { Search, Plus, Trash2, CreditCard, ExternalLink, X, ChevronDown } from "lucide-react"
import { getCardImageUrl, formatIssuer } from "@/lib/cards"
import type { CardData } from "@/lib/cards"

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
    keys: ['name', 'issuer', 'network'],
    threshold: 0.3
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
        <div className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg`}>
          <CreditCard className={size === "lg" ? "w-10 h-10" : size === "md" ? "w-6 h-6" : "w-4 h-4"} />
        </div>
      )
    }
    return <img src={imgUrl} alt={card.name} className={`${sizeClasses[size]} rounded-lg object-cover shadow-lg border border-slate-700`} onError={() => setImgError(true)} />
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">My Cards</h2>
          <p className="text-slate-400">{wallet.length} card{wallet.length !== 1 ? "s" : ""} in your wallet</p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>

      {/* Add Card Search */}
      {showSearch && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl mb-8 relative">
          <button onClick={() => { setShowSearch(false); setSearchQuery("") }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-semibold mb-4">Search & Add a Card</h3>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={isLoading ? "Loading..." : `Search from ${allCards.length} cards...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 bg-slate-800/95 border border-slate-700 rounded-xl max-h-72 overflow-y-auto">
              {searchResults.length > 0 ? searchResults.map(card => (
                <div key={card.cardId} className="flex items-center gap-3 p-3 border-b border-slate-700/50 hover:bg-slate-700/60 transition-colors cursor-pointer group" onClick={() => addToWallet(card)}>
                  <CardImageBlock card={card} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-100 truncate">{card.name}</div>
                    <div className="text-xs text-slate-400">{formatIssuer(card.issuer)} • ${card.annualFee}/yr</div>
                  </div>
                  <Plus className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                </div>
              )) : <div className="p-4 text-center text-slate-500">No cards found</div>}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cards Grid */}
        <div className="lg:col-span-2">
          {wallet.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No cards in your wallet yet.</p>
              <button onClick={() => setShowSearch(true)} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                + Add your first card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wallet.map(card => (
                <div
                  key={card.cardId}
                  onClick={() => setSelectedCard(card)}
                  className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl group ${selectedCard?.cardId === card.cardId ? "border-indigo-500 shadow-lg shadow-indigo-500/10" : "border-slate-800 hover:border-slate-700"}`}
                >
                  <div className="flex items-start gap-4">
                    <CardImageBlock card={card} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-100 truncate group-hover:text-white transition-colors">{card.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{formatIssuer(card.issuer)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{card.network}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/50">
                    <div className="text-sm text-slate-300">${card.annualFee}<span className="text-slate-500">/yr</span></div>
                    <div className="text-sm text-indigo-400">{card.universalCashbackPercent}% base</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Details Panel */}
        <div className="lg:col-span-1">
          {selectedCard ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg sticky top-24">
              <div className="flex justify-center mb-6">
                <CardImageBlock card={selectedCard} size="lg" />
              </div>
              <h3 className="text-xl font-bold text-center mb-1">{selectedCard.name}</h3>
              <p className="text-sm text-slate-400 text-center mb-6">{formatIssuer(selectedCard.issuer)}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Network</span>
                  <span className="text-sm font-medium">{selectedCard.network}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Annual Fee</span>
                  <span className="text-sm font-medium">${selectedCard.annualFee}{selectedCard.isAnnualFeeWaived ? " (waived)" : ""}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Base Cashback</span>
                  <span className="text-sm font-medium">{selectedCard.universalCashbackPercent}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Currency</span>
                  <span className="text-sm font-medium">{selectedCard.currency}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-sm text-slate-400">Type</span>
                  <span className="text-sm font-medium">{selectedCard.isBusiness ? "Business" : "Personal"}</span>
                </div>
                {selectedCard.offers && selectedCard.offers.length > 0 && (
                  <div className="py-2 border-b border-slate-800/50">
                    <span className="text-sm text-slate-400 block mb-1">Sign-up Bonus</span>
                    <span className="text-sm font-medium text-emerald-400">
                      Spend ${selectedCard.offers[0].spend?.toLocaleString()} in {selectedCard.offers[0].days} days
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {selectedCard.url && (
                  <a href={selectedCard.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm transition-colors">
                    <ExternalLink className="w-4 h-4" /> View on Issuer Site
                  </a>
                )}
                <button
                  onClick={() => removeFromWallet(selectedCard.cardId)}
                  className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-lg text-sm transition-colors border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" /> Remove from Wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-8 text-center sticky top-24">
              <ChevronDown className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-bounce" />
              <p className="text-slate-500 text-sm">Select a card to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
