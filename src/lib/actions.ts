"use server"

import { createClient } from "@/utils/supabase/server"
import { auth } from "@/auth"

export async function getUserWallet() {
  const session = await auth()
  if (!session?.user?.email) return { wallet: [], hasCompletedOnboarding: false }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_wallets')
    .select('wallet_data, onboarded')
    .eq('email', session.user.email)
    .single()

  if (error || !data) {
    return { wallet: [], hasCompletedOnboarding: false }
  }

  return {
    wallet: data.wallet_data || [],
    hasCompletedOnboarding: data.onboarded || false
  }
}

export async function updateUserWallet(wallet: any[], onboarded: boolean) {
  const session = await auth()
  if (!session?.user?.email) throw new Error("Unauthorized")

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('user_wallets')
    .upsert({ 
      email: session.user.email,
      wallet_data: wallet,
      onboarded: onboarded,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'email'
    })

  if (error) {
    console.error("Error updating user wallet in Supabase:", JSON.stringify(error, null, 2))
    throw new Error("Failed to update wallet")
  }
}
