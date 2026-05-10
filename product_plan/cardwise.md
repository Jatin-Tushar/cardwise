# PRD: Cardwise

Authors: Jatin Jain & Tushar Parasrampuria
Last Update: 10th May 2026

---

## Metadata

| Role / Item | Details |
|---|---|
| Product Owner | Jatin Jain |
| Engineering Lead | Tushar Parasrampuria |
| Data Source | MCP integration with CardCurator.ai card database and store database |

---

## 1. Overview

Cardwise is a credit card optimization platform that tells users which card to pull out of their wallet for every purchase. Users enter the cards they own, select a spending category or describe a purchase in natural language, and Cardwise instantly ranks the best card to use based on rewards, cashback, ROI (rewards minus annual fees), and category bonuses.

V1 ships with: card wallet management, category-based optimization, AI chat for nuanced questions, a spending tracker, and a card tracker.

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

### Section 2.2: This Week's Actions (Smart Alerts)
Horizontally scrollable alert cards. Each alert is actionable.

| Alert Type | Example | Action |
|---|---|---|
| Transfer Bonus Expiring | "65% Transfer Bonus Expiring Soon: Chase UR → Marriott Bonvoy, ends in 6d" | "Transfer Now →" |
| Unclaimed Statement Credits | "$688 unclaimed across Amex Gold, Blue Cash Everyday" | "View Credits →" |
| Welcome Bonus Milestone | "You are $200 away from your Chase Sapphire 60k bonus" | "Track Progress →" |
| Annual Fee Renewal | "Your Amex Gold $250 annual fee renews in 14 days" | "Review Card →" |

### Flow 2.2.1: Alert Generation Logic
1. System checks card database for each card in user's wallet
2. Compares current date against known transfer bonus windows, credit deadlines, and welcome bonus timelines
3. Ranks alerts by urgency (days remaining) and financial impact (dollar value)
4. Displays top 2 alerts. "Show More" reveals full list

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

### Flow 2.3.4: Context-Aware Chat from Category Pages
1. User taps "Dining" category on Home
2. System opens AI chat with pre-filled context: "I'm spending on Dining"
3. User can refine: "I'm going to a fine dining restaurant in Manhattan, party of 6, estimated bill $800"
4. AI factors in: earn rate, purchase protection, extended warranty, and any active promotions

### Flow 2.3.5: Edge Cases — AI Chat
- User asks about a card not in their wallet — AI clarifies "That card isn't in your wallet. Want me to compare it against your current cards?"
- User asks about a niche category (e.g., "pet insurance") — AI maps it to the closest known category and explains its reasoning
- User asks about international purchases — AI factors in foreign transaction fees for each card
- User asks about a specific store the database doesn't recognize — AI responds "I don't have data for [Store]. What type of store is it?" and uses the user's answer to categorize

### Section 2.4: AI Chat Window (Floating)
- Pinned at the bottom of the Home page as a collapsed chat bar
- Placeholder text: "Ask me anything about your cards..."
- Tapping expands to full-screen AI chat interface

---

## Page 3: Best Cards by Category

### Section 3.1: Category Grid
A 3-column grid of spending category tiles. Each tile shows:
- Category icon and name
- Subcategory description (e.g., "Restaurants, bars, cafes")
- Best card from user's wallet for that category
- Earn rate (e.g., "3x POINTS" or "5% CASHBACK")

#### Full Category List (V1)

| Category | Subcategories |
|---|---|
| Dining | Restaurants, bars, cafes |
| Food Delivery | DoorDash, UberEats, Grubhub |
| Groceries | Supermarkets, grocery stores |
| Gas | Gas stations, fuel |
| Streaming | Netflix, Spotify, Disney+, etc. |
| Transit | Public transportation, rideshare |
| Flights | Airline tickets, airport purchases |
| Hotels | Hotel bookings, resort stays |
| E-commerce Shopping | Amazon, online retail |
| In-Store Clothing | Mall, department stores, apparel |
| Electronics | Best Buy, Apple, tech purchases |
| Car Rental | Hertz, Enterprise, rental agencies |
| Rent | Monthly rent payments |
| Services | Car wash, salons, dry cleaning |
| Online Shopping | General e-commerce, marketplace purchases |

### Flow 3.1.1: Category Tile Tap
1. User taps a category tile (e.g., "Dining")
2. System navigates to Category Detail Page
3. Category context is pre-loaded into the AI chat typing area as: "I'm spending on Dining — which card should I use?"

### Section 3.2: High Value Purchases
A separate section below the standard categories for big-ticket items:

| Category | Examples |
|---|---|
| Car Purchase | New/used vehicle, down payment |
| House Purchase | Down payment, closing costs |
| Furniture | Large home furnishings |

### Flow 3.2.1: High Value Purchase Tap
1. User taps "Car Purchase"
2. System opens a detail page showing:
   - Which cards allow large transactions
   - Which cards offer 0% APR intro periods
   - Which cards offer purchase protection
   - Which cards offer extended warranty
3. AI chat pre-loads: "I'm making a large car purchase — which card maximizes value?"

---


## Page 4: My Wallet

### Section 4.1: Wallet Summary Bar
Three stat cards at the top:

| Stat | Display |
|---|---|
| Total Cards | e.g., "5 Cards" |
| Total Annual Fees | e.g., "$325" |
| Net Value/Year | e.g., "+$363" (rewards earned minus fees) |

### Section 4.2: Cards Grouped by Rewards Program
Cards are organized by rewards ecosystem:
- Chase Ultimate Rewards (2 cards, $0 annual fees)
- American Express Membership Rewards (2 cards, $325 annual fees)
- Citi ThankYou Points (1 card, $0 annual fees)

Each group is collapsible. Under each group:
- Visual card image (official card art from database)
- Card name and issuer
- Annual fee, base earn rate, max earn rate
- Welcome bonus status (e.g., "20,000 pts · $500/3mo")
- Action buttons: "View Details" | "Edit" | "Delete" | "Bonus History"

### Flow 4.2.1: View Card Details
1. User taps "View Details" on Chase Freedom Flex
2. System shows full card profile:
   - All category earn rates in a table
   - Current quarterly bonus categories (if rotating)
   - Benefits: purchase protection, extended warranty, cell phone protection
   - Foreign transaction fee: Yes/No
   - Credit limit (user-entered, optional)
   - Annual fee renewal date

### Flow 4.2.2: Add a New Card
1. User taps "+ Add Card" button (top-right)
2. Fuzzy search modal opens
3. User searches and selects a card
4. Card is added to wallet with all data auto-populated
5. Wallet summary stats recalculate instantly

### Flow 4.2.3: Remove a Card
1. User taps trash icon on a card
2. Confirmation dialog: "Remove Chase Freedom Flex from your wallet? This will not affect your actual card account."
3. User confirms
4. Card removed. Wallet stats and category recommendations recalculate

### Flow 4.2.4: Compare Cards
1. User taps "Compare" button (top-right, next to "+ Add Card")
2. System enters comparison mode: user selects 2-3 cards
3. System shows side-by-side table:
   - Annual fee, base rate, category rates, benefits, foreign transaction fees
4. AI summary at bottom: "For your spending patterns, [Card A] provides $200 more value per year than [Card B]"

---

## Page 5: Category Detail Page

### Flow 5.1: Category Landing
1. User arrives from Home (e.g., tapped "Dining")
2. Page header: Category name, icon, and description
3. Two sections:

#### Section A: Best From Your Wallet
- Ranked list of user's cards for this category
- Each card shows: earn rate, rewards type, and estimated annual value for this category
- Top card is highlighted with a "Best Pick" badge

#### Section B: Best Overall (From Database)
- Top 3 cards from the full database for this category
- Each card shows: name, issuer, earn rate, annual fee, and "Apply →" affiliate link
- If user already owns the top-ranked card, show a checkmark: "You already have the best card for this category"

### Flow 5.2: Ask More (AI Integration)
- Below both sections, a chat input bar with pre-filled context
- User can ask follow-up questions: "What if I'm spending over $500?" or "Does this card have purchase protection for electronics bought at restaurants?"

---

## Page 6: Card Tracker

### Section 6.1: Welcome Bonus Tracker
Table showing progress toward each card's sign-up bonus:

| Card | Bonus | Requirement | Progress | Deadline | Status |
|---|---|---|---|---|---|
| Chase Sapphire Preferred | 60,000 UR | $4,000 in 3 months | $2,800 / $4,000 | 45 days left | On Track |
| Amex Gold | 60,000 MR | $6,000 in 6 months | $1,200 / $6,000 | 120 days left | At Risk |

### Section 6.2: Annual Fee Tracker
- Shows all cards with annual fees
- Renewal dates
- ROI calculation: "Net value = Rewards earned ($500) - Annual fee ($250) = +$250"
- Flag cards with negative ROI: "Consider downgrading [Card] — you earned $80 but pay $95/year"

### Section 6.3: Credit Utilization Overview
- User can optionally enter credit limits per card
- System shows utilization per card and overall
- Alerts if any card exceeds 30% utilization

---

## Page 7: ROI Analysis

### Flow 7.1: ROI Dashboard
1. For each card in wallet, calculate: (Total Rewards Value + Credits Used) - Annual Fee = Net Value
2. Display as a ranked list, best to worst
3. Cards with negative net value are flagged in red
4. AI recommendation: "Your Amex Platinum has -$150 net value. The annual fee renews in 60 days. Consider downgrading to Amex Green to save $400/year while keeping MR earning."

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
| transactions | Manually entered transactions (amount, category, card, date) |
| preferences | Category weightings, notification settings |

---

# Success Metrics (V1)

| Metric | Type | Target | Timeframe |
|---|---|---|---|
| Users who add 2+ cards | Activation | 70% of signups | First 7 days |
| Category tile taps per session | Engagement | 3+ taps/session | Month 1 |
| AI chat messages per user | Engagement | 5+ messages/week | Month 2 |
| Transactions logged per user | Retention | 10+/month | Month 3 |
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

# Open Questions

| Question | Owner | Status |
|---|---|---|
| What is the MCP endpoint structure for CardCurator card data? | Tushar | Open |
| Do we need CardCurator API key or is MCP sufficient? | Tushar | Open |
| How do we handle rotating quarterly categories (e.g., Chase Freedom 5% categories)? | Jatin | Open |
| What is our affiliate partner for "Apply" links? | Jatin | Open |
| Should the AI chat use GPT-4o, Claude, or a mix? | Both | Open |
| How do we handle cards from the same issuer with overlapping benefits? | Jatin | Open |
