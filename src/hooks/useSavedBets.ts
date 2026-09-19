"use client";

import { useCallback, useEffect, useState } from "react";
import type { Bet, BetPatch, NewBet } from "@/lib/bets/types";

const ENDPOINT = "/api/bets";

async function parse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(body.error ?? "Request failed");
    }
    return response.json() as Promise<T>;
}

export function useSavedBets() {
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await parse<Bet[]>(await fetch(ENDPOINT));
                if (active) {
                    setBets(data);
                    setError(null);
                }
            } catch (cause) {
                if (active) {
                    setError((cause as Error).message);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const save = useCallback(async (input: NewBet) => {
        const created = await parse<Bet>(
            await fetch(ENDPOINT, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(input),
            }),
        );
        setBets((current) => [created, ...current]);
    }, []);

    const amend = useCallback(async (id: string, patch: BetPatch) => {
        try {
            const updated = await parse<Bet>(
                await fetch(`${ENDPOINT}/${id}`, {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(patch),
                }),
            );
            setBets((current) => current.map((bet) => (bet.id === id ? updated : bet)));
            setError(null);
        } catch (cause) {
            setError((cause as Error).message);
            throw cause;
        }
    }, []);

    const remove = useCallback(async (id: string) => {
        try {
            const response = await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
            if (!response.ok) {
                throw new Error("Could not delete bet");
            }
            setBets((current) => current.filter((bet) => bet.id !== id));
            setError(null);
        } catch (cause) {
            setError((cause as Error).message);
            throw cause;
        }
    }, []);

    return { bets, loading, error, save, amend, remove };
}
