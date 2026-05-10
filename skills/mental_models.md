# AI Mental Models

This file stores strategic frameworks and mental models gathered from LinkedIn, blogs, and industry leaders to help structure your thinking when approaching a new PM challenge.

## 1. The Build vs. Buy vs. Borrow Model

| Strategy | When to use | Pros & Cons |
|---|---|---|
| Borrow (Prompting / APIs) | To validate the use case | Fastest time to market, lowest upfront cost, but highest variable cost |
| Buy (RAG / Managed Services) | Need domain-specific knowledge but lack ML resources | Good middle ground for enterprise use cases |
| Build (Fine-Tuning / Custom) | The model itself is the core differentiator and product moat | Extremely high upfront cost, highly defensible |

## 2. The Human-in-the-Loop Spectrum

| Mode | How it works | Best for | Example |
|---|---|---|---|
| Copilot | AI drafts, human reviews | High-stakes environments | GitHub Copilot |
| Agent | AI executes, human supervises | Low-stakes, high-volume tasks | AutoGPT |
| Oracle | AI provides an answer, human acts | Decision support | Data Analysis chatbots |

## 3. The Context vs. Cost Trade-off

> Never give an LLM more context than a human would need to solve the same problem. Giving an LLM a 100k page document when a 2-page summary would do is burning money and increasing hallucination risk.

## 4. The Switchboard / Vendor Agnostic Middleware Model

> Never hardcode a direct dependency on a single LLM vendor (like OpenAI). Build a many-to-one middleware layer.

This enables a pluggable architecture. You can instantly switch vendors, weight vendors based on latency or API cost, and negotiate better pricing because you aren't locked in.
