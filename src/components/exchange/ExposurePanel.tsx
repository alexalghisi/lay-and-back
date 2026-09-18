"use client";

import { formatMoney } from "@/lib/exchange/format";

interface ExposureRow {
    selectionId: string;
    name: string;
    ifWins: number;
}

interface ExposurePanelProps {
    exposure: ExposureRow[];
    hasBets: boolean;
}

function toneFor(value: number): string {
    if (value > 0) {
        return "text-profit";
    }
    if (value < 0) {
        return "text-loss";
    }
    return "text-muted";
}

export function ExposurePanel({ exposure, hasBets }: ExposurePanelProps) {
    return (
        <section className="rounded-xl border border-border bg-panel p-4">
            <h3 className="text-sm font-semibold">Profit &amp; loss</h3>
            {hasBets ? (
                <ul className="mt-3 space-y-2">
                    {exposure.map((row) => (
                        <li key={row.selectionId} className="flex items-center justify-between text-sm">
                            <span className="text-muted">If {row.name} wins</span>
                            <span className={`tabular font-semibold ${toneFor(row.ifWins)}`}>
                                {formatMoney(row.ifWins)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-muted">
                    No matched bets yet. Your position across every outcome will appear here.
                </p>
            )}
        </section>
    );
}
