# PRD: Cardwise

## Overview
Cardwise is a credit card optimization platform that tells users which card to pull out of their wallet for every purchase. Users enter the cards they own, select a spending category or describe a purchase in natural language, and Cardwise instantly ranks the best card to use based on rewards, cashback, ROI (rewards minus annual fees), and category bonuses.

## What (Scope)
V1 ships with:
- Card wallet management (add, remove cards)
- AI chat for nuanced questions and complex multi-factor queries
- Dashboard Summary Stats (Welcome bonuses, annual fees)
- Best Cards recommendations via AI (from wallet and full database)

*Non-Goals (V1):*
- No bank account linking or Plaid integration
- No automatic transaction import
- No credit score monitoring
- No card application processing
- No international card databases (US only for V1)
- No browser extension (V2)
- No "Goals" feature for trip planning (V2)
- No social features or sharing

## Why (Business and User Value)
**Problem:** Over 200 million U.S. credit card holders own 2-5 cards but consistently use only one. They leave hundreds of dollars in rewards on the table every year because they do not know which card earns the most for each category. Existing solutions require manual research across bank websites.

**User Value:** Users will be able to maximize their cashback and points, track welcome bonuses and annual fee renewals, and analyze their card ROI seamlessly without connecting their bank accounts or sharing sensitive financial data.

**Business Value:** The platform will generate revenue through affiliate link clicks ("Apply Now") for recommended cards that the user doesn't currently own.

## Who (Users and Stakeholders)
- **Users:** US-based consumers with 2+ credit cards. Reward optimizers who want to maximize cashback and points. Users who do not want to link bank accounts or share sensitive financial data.
- **Stakeholders:** Jatin Jain & Tushar Parasrampuria (Authors/Founders)

## Requirements

### Scenario: Account Creation
**Given** a first-time user lands on the splash screen
**When** the user taps "Get Started" and creates an account via Email/Password or Google OAuth
**Then** the system creates an empty wallet and redirects the user to Card Setup.

### Scenario: Card Setup - Adding Cards
**Given** the user is in the Card Setup flow or adding a card from My Wallet
**When** the user types in the search bar
**Then** the system debounces input and dynamically checks the card database using fuzzy matching
**And** returns a ranked list of matched cards in real-time.
**When** the user taps a card
**Then** the system adds it to their wallet, auto-populating all relevant details (name, issuer, fee, earn rates, bonuses).

### Scenario: Dashboard - Summary Stats
**Given** the user is on the Home dashboard
**When** the page loads
**Then** the header bar displays a greeting, the total number of cards, sum of annual fees, highest earn rate across all cards, and the sum of one-time benefits.


### Scenario: AI Chat - Basic Query
**Given** the user is using the AI Chat
**When** the user asks a natural language question like "Which card should I use at Costco?"
**Then** the system queries the store database for the category and cross-references against the user's wallet
**And** responds with the best matching card from the wallet and a runner-up, along with relevant notes.

### Scenario: AI Chat - Complex Query
**Given** the user is using the AI Chat
**When** the user asks a multi-factor query (e.g., flight, hotel, and car rental)
**Then** the AI breaks down the response and recommends the best card for each specific category, factoring in things like trip delay insurance and primary rental coverage.

### Scenario: Card Discovery
**Given** the user asks the AI about a category
**When** they want to know the best card they don't have
**Then** the AI queries the full database and returns the top 3 overall cards with their details and affiliate application links.


## Success Criteria

| Metric |
|---|
| **Users who add 2+ cards:** 70% of signups in the first 7 days (Activation) |
| **AI chat messages per user:** 5+ messages/week in Month 2 (Engagement) |
| **Affiliate link clicks:** 5% CTR on "Apply" links in Month 3 (Revenue) |
