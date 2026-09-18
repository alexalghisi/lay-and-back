import { ExchangeEngine, type PlaceRequest } from "./engine";
import { MAX_PRICE, MIN_PRICE, roundToTick, tickDown, tickUp } from "./odds";
import type { Market, Side } from "./types";

export const MARKET: Market = {
    id: "1.2489317",
    event: "Manchester City v Arsenal",
    competition: "English Premier League — Match Odds",
    startsAt: "Sat 15:00",
    selections: [
        { id: "man-city", name: "Manchester City" },
        { id: "arsenal", name: "Arsenal" },
        { id: "draw", name: "The Draw" },
    ],
};

const FAIR_PRICES: Record<string, number> = {
    "man-city": 2.1,
    arsenal: 3.6,
    draw: 3.75,
};

export function createPrng(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function spreadPrices(fair: number, depth: number): { back: number[]; lay: number[] } {
    const back: number[] = [];
    const lay: number[] = [];
    let low = tickDown(fair);
    let high = tickUp(fair);
    for (let i = 0; i < depth; i += 1) {
        back.push(low);
        lay.push(high);
        low = tickDown(low);
        high = tickUp(high);
    }
    return { back, lay };
}

export function seedInitialBook(engine: ExchangeEngine, rng: () => number): void {
    for (const selection of MARKET.selections) {
        const fair = FAIR_PRICES[selection.id];
        const { back, lay } = spreadPrices(fair, 3);
        back.forEach((price, index) => {
            engine.seedResting({
                selectionId: selection.id,
                side: "back",
                price,
                size: roundToTick(40 + rng() * 220 + index * 30),
            });
        });
        lay.forEach((price, index) => {
            engine.seedResting({
                selectionId: selection.id,
                side: "lay",
                price,
                size: roundToTick(40 + rng() * 220 + index * 30),
            });
        });
    }
}

export function nextMarketOrder(rng: () => number): PlaceRequest {
    const selection = MARKET.selections[Math.floor(rng() * MARKET.selections.length)];
    const fair = FAIR_PRICES[selection.id];
    const side: Side = rng() > 0.5 ? "back" : "lay";
    const drift = Math.round((rng() - 0.5) * 6);
    let price = fair;
    for (let i = 0; i < Math.abs(drift); i += 1) {
        price = drift >= 0 ? tickUp(price) : tickDown(price);
    }
    price = Math.min(MAX_PRICE, Math.max(MIN_PRICE, price));
    return {
        selectionId: selection.id,
        side,
        price: roundToTick(price),
        size: roundToTick(10 + rng() * 120),
        owner: "market",
    };
}
