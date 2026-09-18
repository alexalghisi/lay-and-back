"use client";

import { useState } from "react";
import type { PlaceRequest } from "@/lib/exchange/engine";
import { backProfit, layLiability, tickDown, tickUp } from "@/lib/exchange/odds";
import { formatMoney, formatOdds } from "@/lib/exchange/format";
import type { Side } from "@/lib/exchange/types";

export interface BetDraft {
    selectionId: string;
    side: Side;
    price: number;
}

interface BetSlipProps {
    draft: BetDraft | null;
    selectionName: (selectionId: string) => string;
    balance: number;
    onPlace: (request: PlaceRequest) => void;
    onClear: () => void;
}

const STAKE_STEPS = [5, 10, 25, 50];

export function BetSlip({ draft, selectionName, balance, onPlace, onClear }: BetSlipProps) {
    const [price, setPrice] = useState(draft?.price ?? 0);
    const [stake, setStake] = useState(10);
    const [activeDraft, setActiveDraft] = useState(draft);

    if (draft && draft !== activeDraft) {
        setActiveDraft(draft);
        setPrice(draft.price);
    }

    if (!draft) {
        return (
            <section className="rounded-xl border border-border bg-panel p-4">
                <h3 className="text-sm font-semibold">Bet slip</h3>
                <p className="mt-3 text-sm text-muted">
                    Pick a blue price to back a runner, or a pink price to lay it. Your order is matched against live
                    liquidity on the exchange.
                </p>
            </section>
        );
    }

    const isBack = draft.side === "back";
    const profit = isBack ? backProfit(stake, price) : stake;
    const liability = isBack ? stake : layLiability(stake, price);
    const canAfford = liability <= balance;
    const valid = stake > 0 && price > 1 && canAfford;

    const accent = isBack ? "border-back" : "border-lay";
    const badge = isBack ? "bg-back" : "bg-lay";

    return (
        <section className={`rounded-xl border ${accent} bg-panel p-4`}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Bet slip</h3>
                <button type="button" onClick={onClear} className="text-xs text-muted hover:text-text">
                    Clear
                </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase text-white ${badge}`}>
                    {draft.side}
                </span>
                <span className="font-medium">{selectionName(draft.selectionId)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-xs text-muted">
                    Odds
                    <div className="mt-1 flex items-center rounded-lg border border-border bg-panel-raised">
                        <button
                            type="button"
                            onClick={() => setPrice((current) => tickDown(current))}
                            className="px-3 py-2 text-lg leading-none text-muted hover:text-text"
                            aria-label="Decrease odds"
                        >
                            −
                        </button>
                        <span className="tabular flex-1 text-center text-base font-semibold text-text">
                            {formatOdds(price)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPrice((current) => tickUp(current))}
                            className="px-3 py-2 text-lg leading-none text-muted hover:text-text"
                            aria-label="Increase odds"
                        >
                            +
                        </button>
                    </div>
                </label>

                <label className="text-xs text-muted">
                    Stake (£)
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={stake}
                        onChange={(event) => setStake(Math.max(0, Number(event.target.value)))}
                        className="tabular mt-1 w-full rounded-lg border border-border bg-panel-raised px-3 py-2 text-base font-semibold text-text outline-none focus:border-back"
                    />
                </label>
            </div>

            <div className="mt-3 flex gap-2">
                {STAKE_STEPS.map((step) => (
                    <button
                        key={step}
                        type="button"
                        onClick={() => setStake((current) => current + step)}
                        className="tabular flex-1 rounded-md border border-border bg-panel-raised py-1.5 text-xs text-muted hover:border-back hover:text-text"
                    >
                        +{step}
                    </button>
                ))}
            </div>

            <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted">{isBack ? "Profit if it wins" : "Profit if it loses"}</dt>
                    <dd className="tabular font-semibold text-profit">{formatMoney(profit)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted">Liability</dt>
                    <dd className="tabular font-semibold text-loss">{formatMoney(liability)}</dd>
                </div>
            </dl>

            {!canAfford && (
                <p className="mt-3 rounded-md bg-lay-soft px-3 py-2 text-xs text-loss">
                    Liability exceeds your available balance.
                </p>
            )}

            <button
                type="button"
                disabled={!valid}
                onClick={() => onPlace({ selectionId: draft.selectionId, side: draft.side, price, size: stake })}
                className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${badge}`}
            >
                Place {draft.side} · {formatMoney(stake)} @ {formatOdds(price)}
            </button>
        </section>
    );
}
