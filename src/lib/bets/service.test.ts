import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "./errors";
import { InMemoryBetRepository } from "./repository";
import { BetService } from "./service";
import type { NewBet } from "./types";

function makeService() {
    let clock = 1_000;
    let counter = 0;
    const repo = new InMemoryBetRepository();
    const service = new BetService(repo, {
        now: () => (clock += 1),
        id: () => `bet-${(counter += 1)}`,
    });
    return { repo, service };
}

const validBet: NewBet = {
    selectionId: "man-city",
    selectionName: "Manchester City",
    side: "back",
    price: 2.1,
    stake: 25,
};

describe("BetService.place", () => {
    let harness: ReturnType<typeof makeService>;

    beforeEach(() => {
        harness = makeService();
    });

    it("creates an open bet with generated id and timestamps", () => {
        const bet = harness.service.place(validBet);
        expect(bet.id).toBe("bet-1");
        expect(bet.status).toBe("open");
        expect(bet.createdAt).toBe(bet.updatedAt);
        expect(harness.service.list()).toHaveLength(1);
    });

    it("trims optional notes and defaults them to empty", () => {
        expect(harness.service.place(validBet).note).toBe("");
        expect(harness.service.place({ ...validBet, note: "  value bet  " }).note).toBe("value bet");
    });

    it("rejects a price off the odds ladder", () => {
        expect(() => harness.service.place({ ...validBet, price: 2.011 })).toThrow(ValidationError);
    });

    it("rejects a non-positive stake", () => {
        expect(() => harness.service.place({ ...validBet, stake: 0 })).toThrow(ValidationError);
    });

    it("rejects a missing selection", () => {
        expect(() => harness.service.place({ ...validBet, selectionId: "" })).toThrow(ValidationError);
    });
});

describe("BetService.amend", () => {
    let harness: ReturnType<typeof makeService>;

    beforeEach(() => {
        harness = makeService();
    });

    it("reprices an open bet and bumps updatedAt", () => {
        const created = harness.service.place(validBet);
        const amended = harness.service.amend(created.id, { price: 2.2, stake: 30 });
        expect(amended.price).toBe(2.2);
        expect(amended.stake).toBe(30);
        expect(amended.updatedAt).toBeGreaterThan(created.updatedAt);
    });

    it("blocks repricing once a bet is settled", () => {
        const created = harness.service.place(validBet);
        harness.service.amend(created.id, { status: "won" });
        expect(() => harness.service.amend(created.id, { price: 2.2 })).toThrow(ValidationError);
    });

    it("rejects an empty patch", () => {
        const created = harness.service.place(validBet);
        expect(() => harness.service.amend(created.id, {})).toThrow(ValidationError);
    });

    it("throws when the bet is unknown", () => {
        expect(() => harness.service.amend("missing", { stake: 5 })).toThrow(NotFoundError);
    });
});

describe("BetService.remove", () => {
    it("deletes a bet and throws on a second delete", () => {
        const { service } = makeService();
        const created = service.place(validBet);
        service.remove(created.id);
        expect(service.list()).toHaveLength(0);
        expect(() => service.remove(created.id)).toThrow(NotFoundError);
    });
});
