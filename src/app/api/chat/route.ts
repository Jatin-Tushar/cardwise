import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { message, wallet } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        reply: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file. Get one free at https://aistudio.google.com/apikey"
      })
    }

    const walletContext = wallet.length > 0
      ? `The user currently has these credit cards in their wallet:\n${wallet.map((c: any) => `- ${c.name} (${c.issuer}, $${c.annualFee}/yr fee, ${c.universalCashbackPercent}% base cashback, earns ${c.currency})`).join("\n")}`
      : "The user has no cards in their wallet yet."

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are Cardwise AI, a helpful credit card recommendation assistant. You help users maximize their credit card rewards and choose the best card for each purchase category. Keep responses concise (2-4 sentences). Be specific about which card to use and why.\n\n${walletContext}`
            }]
          },
          contents: [{
            parts: [{ text: message }]
          }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          }
        }),
      }
    )

    const data = await response.json()
    
    // Log the full response for debugging
    if (!response.ok) {
      console.error("Gemini API error:", JSON.stringify(data, null, 2))
      return NextResponse.json({ 
        reply: `API Error (${response.status}): ${data.error?.message || "Unknown error. Your API key may be invalid. Please get a valid key from https://aistudio.google.com/apikey (it should start with AIzaSy...)"}`
      })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!reply) {
      console.error("Unexpected Gemini response:", JSON.stringify(data, null, 2))
      return NextResponse.json({ reply: "Received an empty response from Gemini. Please try again." })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ reply: "An error occurred. Please try again." })
  }
}
