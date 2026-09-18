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

## Betting notebook (CRUD)

Alongside the live board there is a persisted **betting notebook** — a small record of the
bets you are tracking, exposed over a REST API and managed from the UI.

| Method   | Route            | Purpose                          |
| -------- | ---------------- | -------------------------------- |
| `GET`    | `/api/bets`      | List saved bets (newest first)   |
| `POST`   | `/api/bets`      | Create a bet                     |
| `GET`    | `/api/bets/:id`  | Read one bet                     |
| `PATCH`  | `/api/bets/:id`  | Amend stake / price / note / status |
| `DELETE` | `/api/bets/:id`  | Delete a bet                     |

The storage sits behind a `BetRepository` interface (an in-memory implementation ships here),
and a `BetService` owns validation and the open → settled lifecycle. Both the clock and the id
generator are injected so the logic is deterministic under test.

## Testing

The suite follows the usual pyramid:

- **Unit** — the repository and the validating service (`src/lib/bets/*.test.ts`) and the
  matching engine (`src/lib/exchange/engine.test.ts`).
- **Feature / integration** — the REST handlers driven with real `Request` objects, asserting
  the full CRUD cycle and the 400/404 paths (`src/app/api/bets/bets.api.test.ts`).
- **End to end** — a Playwright spec that creates, edits, settles and deletes a bet through the
  browser (`e2e/notebook.spec.ts`).

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
| `npm run test`      | Unit + feature tests (Vitest)        |
| `npm run test:e2e`  | End-to-end tests (Playwright)        |
| `npm run typecheck` | Type-check with no emit              |
| `npm run lint`      | ESLint                               |

## Tech

Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest.

---

**Alessandro Paolo Alghisi** · [alexaalghisi@gmail.com](mailto:alexaalghisi@gmail.com)
