"use client";

import { formatOdds, formatSize } from "@/lib/exchange/format";
import type { Market, PriceLevel, SelectionBook, Side } from "@/lib/exchange/types";

interface MarketBoardProps {
    market: Market;
    books: SelectionBook[];
    onPick: (selectionId: string, side: Side, price: number) => void;
}

interface CellProps {
    level: PriceLevel | undefined;
    side: Side;
    best: boolean;
    onPick: () => void;
}

function LadderCell({ level, side, best, onPick }: CellProps) {
    const base = side === "back" ? "bg-back-soft hover:bg-back/40" : "bg-lay-soft hover:bg-lay/40";
    const ring = best ? (side === "back" ? "ring-1 ring-back" : "ring-1 ring-lay") : "";

    if (!level) {
        return (
            <div className="flex h-14 flex-col items-center justify-center rounded-md border border-border bg-panel/40 text-muted">
                <span className="tabular text-sm">—</span>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onPick}
            className={`flex h-14 flex-col items-center justify-center rounded-md border border-border ${base} ${ring} transition`}
        >
            <span className="tabular text-sm font-semibold text-text">{formatOdds(level.price)}</span>
            <span className="tabular text-[11px] text-muted">{formatSize(level.size)}</span>
        </button>
    );
}

export function MarketBoard({ market, books, onPick }: MarketBoardProps) {
    return (
        <section className="rounded-xl border border-border bg-panel">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wide text-muted">
                <span>Selection</span>
                <div className="grid grid-cols-6 gap-1 text-center">
                    <span className="col-span-3 text-back">Back</span>
                    <span className="col-span-3 text-lay">Lay</span>
                </div>
            </div>

            <ul>
                {market.selections.map((selection) => {
                    const book = books.find((entry) => entry.selectionId === selection.id);
                    const toBack = book?.toBack ?? [];
                    const toLay = book?.toLay ?? [];
                    const backCells = [toBack[2], toBack[1], toBack[0]];
                    const layCells = [toLay[0], toLay[1], toLay[2]];

                    return (
                        <li
                            key={selection.id}
                            className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
                        >
                            <div>
                                <p className="font-medium">{selection.name}</p>
                                <p className="tabular text-xs text-muted">
                                    Last traded {formatOdds(book?.lastTraded ?? null)} · Matched{" "}
                                    {formatSize(book?.tradedVolume ?? 0)}
                                </p>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                                {backCells.map((level, index) => (
                                    <LadderCell
                                        key={`back-${index}`}
                                        level={level}
                                        side="back"
                                        best={index === 2}
                                        onPick={() => level && onPick(selection.id, "back", level.price)}
                                    />
                                ))}
                                {layCells.map((level, index) => (
                                    <LadderCell
                                        key={`lay-${index}`}
                                        level={level}
                                        side="lay"
                                        best={index === 0}
                                        onPick={() => level && onPick(selection.id, "lay", level.price)}
                                    />
                                ))}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
