import { describe, expect, it } from "vitest";
import { ExchangeEngine, outcomePnl } from "./engine";
import { roundToTick, tickDown, tickUp } from "./odds";
import type { Fill, Market } from "./types";

const MARKET: Market = {
    id: "test",
    event: "A v B",
    competition: "Test",
    startsAt: "now",
    selections: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
    ],
};

function engine(): ExchangeEngine {
    return new ExchangeEngine(MARKET);
}

describe("odds ladder", () => {
    it("uses Betfair tick sizes across bands", () => {
        expect(tickUp(1.5)).toBe(1.51);
        expect(tickUp(2)).toBe(2.02);
        expect(tickUp(3)).toBe(3.05);
        expect(tickDown(4)).toBe(3.95);
        expect(tickDown(10)).toBe(9.8);
    });

    it("snaps arbitrary prices onto the ladder", () => {
        expect(roundToTick(2.013)).toBe(2.02);
        expect(roundToTick(3.33)).toBe(3.35);
    });
});

describe("matching", () => {
    it("matches an incoming back against the best resting lay with price improvement", () => {
        const ex = engine();
        ex.seedResting({ selectionId: "a", side: "lay", price: 2.5, size: 100 });
        ex.seedResting({ selectionId: "a", side: "lay", price: 2.6, size: 100 });

        const { order } = ex.place({ selectionId: "a", side: "back", price: 2.5, size: 60 });

        expect(order.matchedSize).toBe(60);
        expect(order.averagePrice).toBe(2.6);
        expect(order.resting).toBeNull();
    });

    it("honours price then time priority", () => {
        const ex = engine();
        ex.seedResting({ selectionId: "a", side: "back", price: 2.0, size: 50 });
        ex.tick(5);
        ex.seedResting({ selectionId: "a", side: "back", price: 2.0, size: 50 });

        const { order, counterFills } = ex.place({ selectionId: "a", side: "lay", price: 2.0, size: 50 });

        expect(order.matchedSize).toBe(50);
        expect(counterFills).toHaveLength(1);
        expect(counterFills[0].orderId).toBe("market-1");
    });

    it("rests the unmatched remainder on the book", () => {
        const ex = engine();
        ex.seedResting({ selectionId: "a", side: "lay", price: 3.0, size: 20 });

        const { order } = ex.place({ selectionId: "a", side: "back", price: 3.0, size: 80 });

        expect(order.matchedSize).toBe(20);
        expect(order.resting?.remaining).toBe(60);
    });

    it("keeps the book uncrossed after seeding", () => {
        const ex = engine();
        ex.seedResting({ selectionId: "a", side: "back", price: 2.0, size: 100 });
        ex.seedResting({ selectionId: "a", side: "lay", price: 2.1, size: 100 });

        const [book] = ex.snapshot();
        expect(book.toBack[0].price).toBe(2.1);
        expect(book.toLay[0].price).toBe(2.0);
        expect(book.toLay[0].price).toBeLessThan(book.toBack[0].price);
    });

    it("does not match when prices do not cross", () => {
        const ex = engine();
        ex.seedResting({ selectionId: "a", side: "lay", price: 3.0, size: 50 });

        const { order } = ex.place({ selectionId: "a", side: "back", price: 3.2, size: 50 });

        expect(order.matchedSize).toBe(0);
        expect(order.resting?.remaining).toBe(50);
    });
});

describe("profit and loss", () => {
    const fills: Fill[] = [
        { orderId: "1", selectionId: "a", side: "back", price: 2.5, size: 100, matchedAt: 0, owner: "you" },
        { orderId: "2", selectionId: "b", side: "lay", price: 3.0, size: 50, matchedAt: 0, owner: "you" },
    ];

    it("prices a winning back and a losing lay", () => {
        expect(outcomePnl(fills, "a")).toBe(200);
    });

    it("prices a losing back and a winning lay", () => {
        expect(outcomePnl(fills, "b")).toBe(-200);
    });
});
