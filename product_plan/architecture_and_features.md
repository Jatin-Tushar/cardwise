# PRD: Cardwise

Authors: Jatin Jain & Tushar Parasrampuria
Last Update: 10th May 2026

---

## 1. Overview

Cardwise is a credit card optimization platform that tells users which card to pull out of their wallet for every purchase. Users enter the cards they own, select a spending category or describe a purchase in natural language, and Cardwise instantly ranks the best card to use based on rewards, cashback, ROI (rewards minus annual fees), and category bonuses.

V1 ships with: card wallet management, AI chat for nuanced questions, and dashboard summary stats.

## 2. Problem

Over 200 million U.S. credit card holders own 2-5 cards but consistently use only one. They leave hundreds of dollars in rewards on the table every year because they do not know which card earns the most for each category. Existing solutions require manual research across bank websites.

## 3. Target User

- US-based consumers with 2+ credit cards
- Reward optimizers who want to maximize cashback and points
- Users who do not want to link bank accounts or share sensitive financial data

---

# Pages & Features

## Page 1: Onboarding (First-Time User)

### Flow 1.1: Account Creation
1. User lands on splash screen with tagline "Find the best card for every purchase"
2. User taps "Get Started"
3. User creates account via Email/Password or Google OAuth
4. System creates empty wallet and redirects to Card Setup

### Flow 1.2: Card Setup (Add Your Cards)
1. System shows search bar: "Search for your credit card"
2. Search uses fuzzy matching against full card database (e.g., typing "freedom" shows Chase Freedom Flex, Chase Freedom Unlimited, Chase Freedom Rise)
3. User taps a card to add it to their wallet
4. System auto-populates: card name, issuer, annual fee, base earn rate, category bonuses, and welcome bonus details
5. User can add multiple cards in sequence
6. Minimum 1 card required to proceed
7. User taps "Done" and is redirected to Home

### Flow 1.3: Card Search — Edge Cases
- User types a misspelled name (e.g., "amrican expres gold") — fuzzy search still resolves correctly
- User searches a card not in the database — system shows "Card not found.
- User adds a duplicate card — system warns "You already have this card in your wallet"

### Flow 1.4: Card Search flow
1. User enters text into the search bar
2. System debounces input (e.g., 300ms) to prevent excessive API calls
3. System dynamically checks the card database using fuzzy matching as the user types (no "Enter" press required)
4. System returns a ranked list of matched cards (prioritizing exact matches and popular cards)
5. UI dynamically updates the results dropdown in real-time, showing card art, card name, and issuer
6. User selects their card from the dropdown list

---

## Page 2: Home (Dashboard)

The Home page is divided into the following sections from top to bottom:

### Section 2.1: Header Bar
- Greeting: "Good afternoon, [Name]"
- Summary stats: "[X] cards · $[Y]/yr fees · up to [Z]x earn rate · $[W] one-time benefits across all cards"
- "Ask AI" button pinned to top-right corner — tapping opens the AI Chat panel

### Flow 2.1.1: Summary Stats Generation Logic
- **[X] cards**: Count of all cards currently in the user's wallet
- **$[Y]/yr fees**: Sum of `annual_fee` for all cards in the wallet
- **[Z]x earn rate**: The highest `max_earn_rate` across all cards in the user's wallet (e.g., if the user has a card with 5x on dining and another with 3x on groceries, Z = 5)
- **$[W] one-time benefits**: Sum of the dollar value of all non-recurring card benefits that the user has not yet claimed this benefit year (e.g., welcome bonuses, statement credits, airport lounge access value)



### Section 2.3: AI Chat

A full-width natural language input bar prominently displayed below the Smart Alerts section.

- Placeholder text: *"Hi, where are you shopping today?"*
- Supports free-form natural language input (e.g., "Whole Foods", "booking flights to Tokyo", "dinner at a fancy restaurant")
- On submit, hands off the query to the AI backend for card recommendation
- Results are displayed inline below the search bar (no page navigation required), in two sections:

**Section A — Best From Your Wallet**
- Best matching card from the user's current wallet
- Displays: card name, earn rate for this category/merchant, and a one-line rationale
- Any relevant notes (e.g., card network restrictions, active offers)

**Section B — Best Overall Card**
- Best card for this category/merchant from the full card database (regardless of whether the user owns it)
- Displays: card name, issuer, earn rate, and annual fee
- The card is clickable and opens an affiliate application link ("Apply Now →")

### Flow 2.3.1: Basic Query
1. User types: "Which card should I use at Costco?"
2. System queries MCP store database for Costco's merchant category code
3. System cross-references user's wallet cards against that category
4. AI responds with a ranked recommendation:
   - Best from your wallet: "[Card Name] — earns 4% on wholesale clubs"
   - Runner-up: "[Card Name] — earns 2% on all purchases"
   - Note: "Costco only accepts Visa in-store. Your [Amex Gold] will not work here."

### Flow 2.3.2: Complex Multi-Factor Query
1. User types: "I'm flying Delta from JFK to LAX next month, booking a hotel for 3 nights, and renting a car. Which cards should I use for each?"
2. AI breaks down the response:
   - Flight: "[Card] — earns 5x on airlines, plus trip delay insurance"
   - Hotel: "[Card] — earns 3x on hotels, plus free night certificate progress"
   - Car Rental: "[Card] — offers primary rental car insurance, saving you $25/day on CDW"
3. AI also flags: "Your Chase Sapphire Reserve trip delay insurance requires you to book the flight on that card"

### Flow 2.3.3: Card Discovery (From Database)
1. User types: "What's the best card for groceries that I don't have?"
2. System queries full card database (not just user's wallet)
3. AI responds with Top 3 overall cards for groceries:
   - Card name, issuer, earn rate, annual fee
   - Affiliate link: "Apply Now →"
4. AI also shows: "From your current cards, [Card] earns 2x on groceries"



### Flow 2.3.5: Edge Cases — AI Chat
- User asks about a card not in their wallet — AI clarifies "That card isn't in your wallet. Want me to compare it against your current cards?"
- User asks about a niche category (e.g., "pet insurance") — AI maps it to the closest known category and explains its reasoning
- User asks about international purchases — AI factors in foreign transaction fees for each card
- User asks about a specific store the database doesn't recognize — AI responds "I don't have data for [Store]. What type of store is it?" and uses the user's answer to categorize

### Section 2.4: AI Chat Window (Floating)
- Pinned at the bottom of the Home page as a collapsed chat bar
- Placeholder text: "Ask me anything about your cards..."
- Tapping expands to full-screen AI chat interface


## Page 3: My Cards (Wallet)

### Section 3.1: Card List
A list of all cards the user currently has in their wallet.
- User can search for new cards to add
- Visual card image
- Card name and issuer
- Remove card button

### Flow 3.1.1: Add a New Card
1. User enters text in the search bar
2. Fuzzy search checks against the database
3. User selects a card to add
4. Wallet is updated instantly

### Flow 3.1.2: Remove a Card
1. User taps trash icon on a card
2. Card removed instantly from local storage

---

# Data Architecture

## Card Database (via MCP)
Source: CardCurator.ai database via MCP connection

| Field | Type | Example |
|---|---|---|
| card_id | string | "chase-freedom-flex" |
| card_name | string | "Chase Freedom Flex" |
| issuer | string | "Chase" |
| network | string | "Visa" / "Mastercard" / "Amex" |
| annual_fee | number | 0 |
| base_earn_rate | string | "1x" |
| max_earn_rate | string | "5x" |
| category_rates | object | { "dining": "3x", "travel": "5x", "drugstores": "3x" } |
| rotating_categories | array | ["Q1: Gas, Q2: Amazon, Q3: Dining, Q4: Walmart"] |
| welcome_bonus | object | { "points": 20000, "spend_requirement": 500, "timeframe": "3 months" } |
| benefits | array | ["Purchase protection", "Extended warranty", "Cell phone protection"] |
| foreign_transaction_fee | boolean | false |
| card_image_url | string | "https://..." |
| rewards_program | string | "Chase Ultimate Rewards" |

## Store Database (via MCP)
Source: MCP integration

| Field | Type | Example |
|---|---|---|
| store_name | string | "Costco" |
| merchant_category | string | "Wholesale Clubs" |
| accepted_networks | array | ["Visa"] |
| online_category | string | "Online Shopping" |
| active_offers | array | [{ card: "Amex", description: "Spend $50 get $10" }] |

## User Data (Local / Auth)
We do NOT store card numbers, bank credentials, or financial data. We only store:

| Field | Description |
|---|---|
| user_id | Unique identifier |
| wallet | Array of card_ids from the card database |

| preferences | Category weightings, notification settings |

---

# Success Metrics (V1)

| Metric | Type | Target | Timeframe |
|---|---|---|---|
| Users who add 2+ cards | Activation | 70% of signups | First 7 days |
| AI chat messages per user | Engagement | 5+ messages/week | Month 2 |
| Affiliate link clicks | Revenue | 5% CTR on "Apply" links | Month 3 |

---

# Non-Goals (V1)

- No bank account linking or Plaid integration
- No automatic transaction import
- No credit score monitoring
- No card application processing
- No international card databases (US only for V1)
- No browser extension (V2)
- No "Goals" feature for trip planning (V2)
- No social features or sharing

---