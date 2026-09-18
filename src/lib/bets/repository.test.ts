import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryBetRepository } from "./repository";
import type { Bet } from "./types";

function bet(id: string, createdAt: number): Bet {
    return {
        id,
        selectionId: "man-city",
        selectionName: "Manchester City",
        side: "back",
        price: 2.1,
        stake: 10,
        note: "",
        status: "open",
        createdAt,
        updatedAt: createdAt,
    };
}

describe("InMemoryBetRepository", () => {
    let repo: InMemoryBetRepository;

    beforeEach(() => {
        repo = new InMemoryBetRepository();
    });

    it("returns bets newest first", () => {
        repo.create(bet("a", 1));
        repo.create(bet("b", 3));
        repo.create(bet("c", 2));
        expect(repo.findAll().map((entry) => entry.id)).toEqual(["b", "c", "a"]);
    });

    it("merges changes without dropping the id", () => {
        repo.create(bet("a", 1));
        const updated = repo.update("a", { stake: 99, id: "hacked" });
        expect(updated?.id).toBe("a");
        expect(updated?.stake).toBe(99);
    });

    it("reports update and remove misses", () => {
        expect(repo.update("nope", { stake: 1 })).toBeNull();
        expect(repo.remove("nope")).toBe(false);
    });
});
