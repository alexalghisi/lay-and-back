import { beforeEach, describe, expect, it } from "vitest";
import { betService } from "@/lib/bets/store";
import { GET as listBets, POST as createBet } from "./route";
import { DELETE as deleteBet, GET as getBet, PATCH as patchBet } from "./[id]/route";

function postRequest(body: unknown): Request {
    return new Request("http://localhost/api/bets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

function patchRequest(body: unknown): Request {
    return new Request("http://localhost/api/bets/x", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

function context(id: string) {
    return { params: Promise.resolve({ id }) };
}

const payload = {
    selectionId: "arsenal",
    selectionName: "Arsenal",
    side: "lay",
    price: 3.6,
    stake: 20,
};

describe("bets API", () => {
    beforeEach(() => {
        betService.clear();
    });

    it("creates a bet and lists it", async () => {
        const created = await createBet(postRequest(payload));
        expect(created.status).toBe(201);
        const bet = await created.json();
        expect(bet.id).toBeTruthy();
        expect(bet.status).toBe("open");

        const list = await listBets();
        expect(list.status).toBe(200);
        expect(await list.json()).toHaveLength(1);
    });

    it("rejects an invalid payload with 400", async () => {
        const response = await createBet(postRequest({ ...payload, stake: -1 }));
        expect(response.status).toBe(400);
        expect((await response.json()).error).toMatch(/stake/i);
    });

    it("rejects malformed JSON with 400", async () => {
        const bad = new Request("http://localhost/api/bets", { method: "POST", body: "{" });
        expect((await createBet(bad)).status).toBe(400);
    });

    it("reads, updates and deletes a bet through its id route", async () => {
        const bet = await (await createBet(postRequest(payload))).json();

        const read = await getBet(new Request("http://localhost"), context(bet.id));
        expect(read.status).toBe(200);

        const patched = await patchBet(patchRequest({ stake: 45 }), context(bet.id));
        expect(patched.status).toBe(200);
        expect((await patched.json()).stake).toBe(45);

        const removed = await deleteBet(new Request("http://localhost"), context(bet.id));
        expect(removed.status).toBe(204);

        const missing = await getBet(new Request("http://localhost"), context(bet.id));
        expect(missing.status).toBe(404);
    });

    it("refuses to reprice a settled bet", async () => {
        const bet = await (await createBet(postRequest(payload))).json();
        await patchBet(patchRequest({ status: "won" }), context(bet.id));

        const blocked = await patchBet(patchRequest({ stake: 80 }), context(bet.id));
        expect(blocked.status).toBe(400);
        expect((await blocked.json()).error).toMatch(/open/i);
    });
});
