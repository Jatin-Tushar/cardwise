# Mistakes & Lessons Learned

A log of past failures, shipped bugs, and hard lessons. Review this before launching any major feature.

## 1. The Over-Promising AI Mistake

| Aspect | Details |
|---|---|
| What happened | We launched a feature claiming it could completely automate a workflow. It only worked 80% of the time. Users churned because their expectations were misaligned. |
| Lesson Learned | Always position AI as an assistant, not a replacement, until you have five 9s of reliability. Under-promise and over-deliver. |

## 2. The Hidden Token Cost

| Aspect | Details |
|---|---|
| What happened | We allowed users to run a background agent that recursively called an LLM API. A single user consumed $400 in API credits in one night. |
| Lesson Learned | Never launch an autonomous looping agent without hard-coded rate limits and daily cost caps per user. |

## 3. [Add your next lesson here...]

| Aspect | Details |
|---|---|
| What happened | |
| Lesson Learned | |
