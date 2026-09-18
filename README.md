# Lay & Back — a betting exchange engine

A working model of how a **betting exchange** actually works under the hood, built as a
single-page trading interface. Unlike a traditional bookmaker where you bet against the
house, an exchange matches customers against each other: one person **backs** an outcome
(bets it will happen) while another **lays** it (bets it will not). This project implements
that market — a live order book, a price/time-priority matching engine, and the profit &
loss maths that sit behind every screen on an exchange.

It was built as a portfolio piece around Betfair's core product, the Exchange.

## What it does

- **Live order book** per selection with the familiar three-deep back (blue) / lay (pink)
  price ladder.
- **Matching engine** with correct exchange semantics:
  - a back order matches resting lay liquidity, a lay order matches resting back liquidity;
  - **best execution** — an order fills at the best available price, not just the requested one;
  - **price then time priority** when several resting orders sit at the same odds;
  - unmatched size rests on the book and can later be matched or cancelled.
- **Bet slip** with the Betfair odds ladder (1.01 → 1000 with the real tick sizes),
  live profit and liability, and balance checks.
- **Profit & loss grid** showing your net position for every possible outcome, updated as
  your bets are matched.
- **Market simulator** that streams counter-orders so liquidity moves, fills happen and the
  ladder breathes like a real market.

## Architecture

The domain logic is pure TypeScript with no framework coupling, which keeps it testable and
lets the same code run identically on the server and the client (no hydration mismatch).

```
src/
  lib/exchange/
    types.ts     domain model (orders, fills, books)
    odds.ts      decimal odds ladder, tick sizes, profit / liability maths
    engine.ts    order book + matching engine + P&L
    market.ts    market definition, seeded RNG, liquidity simulator
    format.ts    deterministic display helpers
    engine.test.ts  unit tests for matching, ladder and P&L
  hooks/
    useExchange.ts   React state on top of the engine
  components/exchange/  presentational UI
  app/             Next.js App Router entry
```

The matching engine is deterministic and side-effect free at its boundaries, so the whole
market is driven by a seeded pseudo-random generator — the same session replays identically.

## Running locally

```bash
npm install
npm run dev
```

Then open the URL printed by the dev server (this project uses port **43117**).

## Scripts

| Command             | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Production build                     |
| `npm run test`      | Run the engine unit tests (Vitest)   |
| `npm run typecheck` | Type-check with no emit              |
| `npm run lint`      | ESLint                               |

## Tech

Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest.

---

**Alessandro Paolo Alghisi** · [alexaalghisi@gmail.com](mailto:alexaalghisi@gmail.com)
