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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are an AI that extracts the merchant and purchase category from a user's query and lists the best credit cards for that specific merchant or category. Output ONLY a valid JSON object with: 'merchant' (string or null), 'category' (string), and 'topCards' (an array of objects with 'name' (string) and 'reason' (string explaining specifically why this card is good for this merchant/category)). List at least 5 top US credit cards. Do not include markdown formatting like ```json."
            }]
          },
          contents: [{
            parts: [{ text: message }]
          }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.1,
          }
        }),
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      console.error("Gemini API error:", JSON.stringify(data, null, 2))
      return NextResponse.json({ error: `API Error: ${data.error?.message || "Unknown error."}` }, { status: 500 })
    }

    const aiOutput = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiOutput) {
      return NextResponse.json({ error: "Received an empty response from AI. Please try again." }, { status: 500 })
    }

    let parsed;
    try {
      parsed = JSON.parse(aiOutput.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (e) {
      console.error("Failed to parse JSON:", aiOutput);
      return NextResponse.json({ error: "Failed to understand the AI's response format." }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ reply: "An error occurred. Please try again." })
  }
}
