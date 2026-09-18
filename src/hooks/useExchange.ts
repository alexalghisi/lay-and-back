"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExchangeEngine, outcomePnl, type PlaceRequest } from "@/lib/exchange/engine";
import {
    MARKET,
    createPrng,
    nextMarketOrder,
    seedInitialBook,
} from "@/lib/exchange/market";
import type { Fill, Order, SelectionBook } from "@/lib/exchange/types";

const SEED = 8_312_004;
const STARTING_BALANCE = 500;
const TICK_MS = 1_200;
const MAX_FEED = 12;

export interface FeedEntry {
    id: string;
    text: string;
}

export interface ExchangeState {
    books: SelectionBook[];
    myFills: Fill[];
    openOrders: Order[];
    balance: number;
    feed: FeedEntry[];
    live: boolean;
}

interface Runtime {
    engine: ExchangeEngine;
    rng: () => number;
}

function buildRuntime(): Runtime {
    const engine = new ExchangeEngine(MARKET, 0);
    const rng = createPrng(SEED);
    seedInitialBook(engine, rng);
    return { engine, rng };
}

export function useExchange() {
    const [runtime] = useState<Runtime>(buildRuntime);
    const feedSeqRef = useRef(0);

    const [state, setState] = useState<ExchangeState>(() => ({
        books: runtime.engine.snapshot(),
        myFills: [],
        openOrders: [],
        balance: STARTING_BALANCE,
        feed: [],
        live: true,
    }));

    const selectionName = useCallback((selectionId: string) => {
        return MARKET.selections.find((selection) => selection.id === selectionId)?.name ?? selectionId;
    }, []);

    const pushFeed = useCallback((current: FeedEntry[], text: string): FeedEntry[] => {
        feedSeqRef.current += 1;
        const entry: FeedEntry = { id: `f-${feedSeqRef.current}`, text };
        return [entry, ...current].slice(0, MAX_FEED);
    }, []);

    const placeBet = useCallback(
        (request: PlaceRequest) => {
            const outcome = runtime.engine.place({ ...request, owner: "you" });

            setState((prev) => {
                const newFills = outcome.order.fills;
                const matchedStake = newFills.reduce((sum, fill) => sum + fill.size, 0);
                const resting = outcome.order.resting;
                const cost = request.side === "back"
                    ? matchedStake + (resting ? resting.remaining : 0)
                    : newFills.reduce((sum, fill) => sum + fill.size * (fill.price - 1), 0)
                        + (resting ? resting.remaining * (resting.price - 1) : 0);

                const openOrders = resting ? [...prev.openOrders, resting] : prev.openOrders;
                const label = request.side === "back" ? "Back" : "Lay";
                const feedText = matchedStake > 0
                    ? `${label} ${selectionName(request.selectionId)} matched £${matchedStake.toFixed(0)} @ ${outcome.order.averagePrice}`
                    : `${label} ${selectionName(request.selectionId)} £${request.size.toFixed(0)} @ ${request.price} unmatched`;

                return {
                    ...prev,
                    books: runtime.engine.snapshot(),
                    myFills: [...newFills, ...prev.myFills],
                    openOrders,
                    balance: Number((prev.balance - cost).toFixed(2)),
                    feed: pushFeed(prev.feed, feedText),
                };
            });

            return outcome;
        },
        [runtime, pushFeed, selectionName],
    );

    const cancelOrder = useCallback(
        (orderId: string) => {
            const target = MARKET.selections
                .flatMap((selection) => runtime.engine.restingFor(selection.id))
                .find((order) => order.id === orderId);

            if (!target) {
                return;
            }
            runtime.engine.cancel(orderId);
            setState((prev) => {
                const refund = target.side === "back"
                    ? target.remaining
                    : target.remaining * (target.price - 1);
                return {
                    ...prev,
                    books: runtime.engine.snapshot(),
                    openOrders: prev.openOrders.filter((order) => order.id !== orderId),
                    balance: Number((prev.balance + refund).toFixed(2)),
                    feed: pushFeed(prev.feed, `Cancelled ${target.side} ${selectionName(target.selectionId)} @ ${target.price}`),
                };
            });
        },
        [runtime, pushFeed, selectionName],
    );

    const toggleLive = useCallback(() => {
        setState((prev) => ({ ...prev, live: !prev.live }));
    }, []);

    useEffect(() => {
        if (!state.live) {
            return;
        }
        const timer = window.setInterval(() => {
            runtime.engine.tick(TICK_MS);
            const request = nextMarketOrder(runtime.rng);
            const outcome = runtime.engine.place(request);
            const yourMatches = outcome.counterFills.filter((fill) => fill.owner === "you");

            setState((prev) => {
                let openOrders = prev.openOrders;
                let feed = prev.feed;
                if (yourMatches.length > 0) {
                    const stillOpen = new Map(prev.openOrders.map((order) => [order.id, order.remaining]));
                    for (const fill of yourMatches) {
                        const left = (stillOpen.get(fill.orderId) ?? 0) - fill.size;
                        stillOpen.set(fill.orderId, left);
                        feed = pushFeed(feed, `Your ${fill.side} ${selectionName(fill.selectionId)} matched £${fill.size.toFixed(0)} @ ${fill.price}`);
                    }
                    openOrders = prev.openOrders
                        .map((order) => ({ ...order, remaining: stillOpen.get(order.id) ?? order.remaining }))
                        .filter((order) => order.remaining > 0.01);
                }
                return {
                    ...prev,
                    books: runtime.engine.snapshot(),
                    myFills: yourMatches.length > 0 ? [...yourMatches, ...prev.myFills] : prev.myFills,
                    openOrders,
                    feed,
                };
            });
        }, TICK_MS);

        return () => window.clearInterval(timer);
    }, [runtime, state.live, pushFeed, selectionName]);

    const exposure = useMemo(() => {
        return MARKET.selections.map((selection) => ({
            selectionId: selection.id,
            name: selection.name,
            ifWins: outcomePnl(state.myFills, selection.id),
        }));
    }, [state.myFills]);

    return {
        market: MARKET,
        ...state,
        exposure,
        placeBet,
        cancelOrder,
        toggleLive,
        selectionName,
    };
}
