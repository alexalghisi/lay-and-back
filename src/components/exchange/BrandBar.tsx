"use client";

import { formatMoney } from "@/lib/exchange/format";
import type { Market } from "@/lib/exchange/types";

interface BrandBarProps {
    market: Market;
    balance: number;
    live: boolean;
    onToggleLive: () => void;
}

export function BrandBar({ market, balance, live, onToggleLive }: BrandBarProps) {
    return (
        <header className="border-b border-border bg-panel/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-back text-lg font-bold text-white">
                        L&amp;B
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold leading-tight">Lay &amp; Back</h1>
                        <p className="text-xs text-muted">Betting exchange · matching engine demo</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-border bg-panel-raised px-3 py-1.5 text-right">
                        <p className="text-[11px] uppercase tracking-wide text-muted">Available</p>
                        <p className="tabular text-base font-semibold text-text">{formatMoney(balance)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleLive}
                        aria-pressed={live}
                        className="flex items-center gap-2 rounded-lg border border-border bg-panel-raised px-3 py-2 text-sm font-medium transition hover:border-back"
                    >
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${live ? "bg-profit" : "bg-muted"}`}
                            aria-hidden="true"
                        />
                        {live ? "Live" : "Paused"}
                    </button>
                </div>
            </div>
            <div className="mx-auto max-w-6xl px-4 pb-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-xl font-semibold">{market.event}</h2>
                    <span className="text-sm text-muted">{market.competition}</span>
                    <span className="ml-auto text-sm text-muted">Kick-off {market.startsAt}</span>
                </div>
            </div>
        </header>
    );
}
