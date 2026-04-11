---
name: langfuse-integration
description: ASL standard for integrating Langfuse LLM observability into any AstralStackLab repository. Use whenever adding, modifying, or reviewing LLM call instrumentation. Enforces the ASL tag schema (project/module/model/env) required for ASTRA dashboard aggregation. Covers both langfuse-langchain CallbackHandler and native Langfuse SDK patterns, flush requirements for Cloud Run Jobs, env var naming, and optional/graceful-degradation wiring.
---

> Governance: AGENT.md § 14 — LLM Observability Standard

# ASL Langfuse Integration Standard

## Why This Standard Exists

ASTRA (`/llm` panel) aggregates LLM usage data across all ASL repositories using Langfuse tag filters.
If tags are inconsistent or missing, ASTRA cannot correctly slice data by project, module, or model.

**Tag consistency is a prerequisite for ASTRA to function — not a best practice.**

---

## ASL Tag Schema (Mandatory)

Every Langfuse trace in any ASL repository must carry these four tags:

| Tag | Format | Example |
|-----|--------|---------|
| `project` | repo identifier | `project:asl-hub-data`, `project:orien`, `project:lyra` |
| `module` | functional module within the repo | `module:mana`, `module:filter`, `module:digest` |
| `model` | LLM model name | `model:gemini-2.5-flash`, `model:claude-sonnet` |
| `env` | runtime environment | `env:production`, `env:development` |

Rules:
- All four tags are required on every trace.
- `project` must match the repo's `product_slug` in `PRODUCT.yaml`.
- `model` should be dynamic (read from config or the actual model string), never hardcoded to a stale value.
- `env` must read from `process.env.NODE_ENV`, defaulting to `'development'`.

---

## Environment Variables (Standard Names)

Use these exact names across all ASL repositories:

```
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com   # omit if using Langfuse Cloud default
```

Store in GCP Secret Manager with the pattern `{product_slug}-langfuse-public-key` / `{product_slug}-langfuse-secret-key`.

Langfuse integration must be **optional**: if keys are absent, the service must run normally without tracing. Never throw or exit on missing Langfuse config.

---

## Integration Path A — langfuse-langchain (LangChain-based LLM calls)

Use when the repo uses LangChain (`@langchain/*`) to invoke LLMs.

**Package:**
```bash
npm install langfuse-langchain
```

**Pattern:**

```typescript
import { CallbackHandler } from 'langfuse-langchain';

// In your LLM service constructor:
if (config.langfuseSecretKey && config.langfusePublicKey) {
  this.langfuseHandler = new CallbackHandler({
    secretKey: config.langfuseSecretKey,
    publicKey: config.langfusePublicKey,
    baseUrl: config.langfuseBaseUrl,          // optional
    tags: [
      `project:${PROJECT_SLUG}`,
      `module:${MODULE_NAME}`,
      `model:${modelName}`,                   // use actual model string, not hardcoded
      `env:${process.env.NODE_ENV ?? 'development'}`,
    ],
  });
}

// Pass to LangChain invoke:
const callbacks = this.langfuseHandler ? [this.langfuseHandler] : [];
const response = await model.invoke(messages, { callbacks });
```

**Flush (Cloud Run Jobs only):**

```typescript
async flush(): Promise<void> {
  if (this.langfuseHandler && 'flushAsync' in this.langfuseHandler) {
    await (this.langfuseHandler as any).flushAsync();
  }
}
```

Call `flush()` at the end of the job's `execute()` method. Cloud Run Services do not need manual flush — the SDK handles it automatically.

---

## Integration Path B — Native Langfuse SDK (direct LLM SDK calls)

Use when the repo calls LLM APIs directly (`@google/generative-ai`, `@anthropic-ai/sdk`, etc.) without LangChain.

**Package:**
```bash
npm install langfuse
```

**Pattern:**

```typescript
import { Langfuse } from 'langfuse';

// Initialise once (in constructor or module scope):
const langfuse = config.langfusePublicKey && config.langfuseSecretKey
  ? new Langfuse({
      publicKey: config.langfusePublicKey,
      secretKey: config.langfuseSecretKey,
      baseUrl: config.langfuseBaseUrl,
    })
  : undefined;

// Wrap each LLM call:
const trace = langfuse?.trace({
  name: 'descriptive-trace-name',
  tags: [
    `project:${PROJECT_SLUG}`,
    `module:${MODULE_NAME}`,
    `model:${modelName}`,
    `env:${process.env.NODE_ENV ?? 'development'}`,
  ],
});

const generation = trace?.generation({
  name: 'generation-name',
  model: modelName,
  input: { prompt },
});

const result = await llmClient.generateContent(prompt);

generation?.end({
  output: result.text(),
  usage: {
    input: result.usageMetadata?.promptTokenCount ?? 0,
    output: result.usageMetadata?.candidatesTokenCount ?? 0,
  },
});
```

**Flush (Cloud Run Jobs only):**

```typescript
await langfuse?.flushAsync();
```

Call at the end of the job's execute method. Cloud Run Services do not need manual flush.

---

## Choosing Between Path A and Path B

| Condition | Use |
|-----------|-----|
| Repo already uses `@langchain/*` for LLM calls | Path A (`langfuse-langchain`) |
| Repo calls LLM SDK directly (Gemini, Anthropic, OpenAI SDK) | Path B (native `langfuse`) |
| Mixed (some LangChain, some direct) | Path B for direct calls, Path A for LangChain calls |

Do not use both `CallbackHandler` and native SDK for the same trace — pick one per LLM call site.

---

## Wiring Config Through the Call Stack

Langfuse keys must flow from environment variables → job/service config → LLM client. Never read `process.env` directly inside a low-level client.

**Correct pattern:**

```
index.ts / app entrypoint
  → reads process.env.LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL
  → passes to Job/Service config interface
      → Job/Service passes to LLM client constructor
          → LLM client initialises Langfuse (or not, if keys absent)
```

**Job config interface example:**

```typescript
interface MyJobConfig {
  // ... other fields
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseBaseUrl?: string;
}
```

---

## Cloud Run Job: Flush Checklist

Cloud Run Jobs terminate after `execute()` completes. Langfuse traces are buffered in memory and must be flushed before the process exits or data will be lost.

- Call `await langfuse.flushAsync()` (native SDK) or `await handler.flushAsync()` (langfuse-langchain) at the end of `execute()`.
- Place flush **after** all LLM calls complete — not in a `finally` block that could run before awaited calls finish.
- Cloud Run **Services** (long-running HTTP servers): no manual flush needed.

---

## Compliance Checklist

Before merging any Langfuse integration:

- [ ] All four tags present on every trace: `project`, `module`, `model`, `env`
- [ ] `project` tag matches `product_slug` in `PRODUCT.yaml`
- [ ] `model` tag is dynamic (not hardcoded to a stale string)
- [ ] `env` tag reads from `NODE_ENV`, defaults to `'development'`
- [ ] Env var names match standard: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`
- [ ] Integration is optional — service runs normally when keys are absent
- [ ] Cloud Run Job calls `flushAsync()` before process exit
- [ ] No business logic changed — only observability wrappers added
- [ ] Secrets stored in GCP Secret Manager, not in repo
