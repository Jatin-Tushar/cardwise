---
last_updated: 2026-05-09
domain: pricing
---
# Pricing Decision Memory Layer

Log decisions with their full reasoning, false beliefs you held, and what corrected them. This serves as institutional memory for pricing strategy.

## Current Pricing Model
- **Structure:** [e.g., Tiered Subscription + Usage-based Overage]
- **Key Levers:** [e.g., Seats, API calls, AI Token usage, Feature access]
- **Cost Margin Target:** [e.g., 60% gross margin after LLM API costs]

## Historical Decisions & Rationale
| Date | Decision | Rationale | Outcome / Impact |
|------|----------|-----------|------------------|
| [Date] | [E.g., Moved from purely token-based to flat monthly tiers] | Users expressed anxiety over unpredictable AI costs. Flat tiers provide predictable revenue and user peace of mind. | [Pending / Successful] |
| [Date] | [E.g., Absorbed GPT-4o cost for premium users] | High churn among power users who felt "nickeled and dimed." | [Pending / Successful] |

## False Beliefs Corrected
- **Belief:** [e.g., Users will pay a premium for faster inference.]
- **Reality:** [e.g., 85% of users prefer slightly slower generation if it means 50% cheaper costs.]

## Open Pricing Questions
- How do we handle heavy outliers (top 1% of users consuming 40% of API costs)?
- Should we charge separately for RAG / storage vs. raw generation?