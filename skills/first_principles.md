# First Principles Thinking

Use this document to break down complex PM problems into their fundamental truths before jumping to "let's use AI."

## Core Principles for AI Products

### 1. AI is a hammer, but not everything is a nail.
> Can this problem be solved with a simple regex or a SQL query in 5 milliseconds? If yes, do not use an LLM.

### 2. The Interface is often more important than the Model.
> Even if the AI is perfectly accurate, is the UX frictionless? Are we forcing users to learn prompt engineering, or are we abstracting it away into buttons and workflows?

### 3. Data is the only true moat.
> Any competitor can call the OpenAI API. What proprietary data are we feeding into the context window that makes our output uniquely valuable?

### 4. Graceful Degradation.
> What happens when the AI API goes down? Can the user still accomplish their goal manually within our app?

### 5. The Data Flywheel / Feedback Loop Obligation.
> Every time a user or risk team member corrects an AI output, where does that data go? If human decisions aren't being passed back to retrain/fine-tune the model, your AI is static and will never scale. Design the feedback mechanism first.
