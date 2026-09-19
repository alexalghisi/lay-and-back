"use client";

import { useState } from "react";
import { formatOdds } from "@/lib/exchange/format";
import { roundToTick, tickDown, tickUp } from "@/lib/exchange/odds";
import { MARKET } from "@/lib/exchange/market";
import type { Bet, BetPatch, BetStatus, NewBet } from "@/lib/bets/types";
import type { Side } from "@/lib/exchange/types";

interface BettingNotebookProps {
    bets: Bet[];
    loading: boolean;
    error: string | null;
    onSave: (input: NewBet) => Promise<void>;
    onAmend: (id: string, patch: BetPatch) => Promise<void>;
    onRemove: (id: string) => Promise<void>;
}

const STATUS_LABELS: Record<BetStatus, string> = {
    open: "Open",
    won: "Won",
    lost: "Lost",
    void: "Void",
};

function statusTone(status: BetStatus): string {
    if (status === "won") {
        return "text-profit";
    }
    if (status === "lost") {
        return "text-loss";
    }
    return "text-muted";
}

function BetRow({ bet, onAmend, onRemove }: { bet: Bet } & Pick<BettingNotebookProps, "onAmend" | "onRemove">) {
    const [stake, setStake] = useState(String(bet.stake));
    const [busy, setBusy] = useState(false);

    const commitStake = async () => {
        const value = Number(stake);
        if (!Number.isFinite(value) || value <= 0 || value === bet.stake) {
            setStake(String(bet.stake));
            return;
        }
        setBusy(true);
        try {
            await onAmend(bet.id, { stake: value });
        } finally {
            setBusy(false);
        }
    };

    return (
        <li className="rounded-lg border border-border bg-panel-raised px-3 py-2">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <span
                        className={`mr-2 text-xs font-semibold uppercase ${
                            bet.side === "back" ? "text-back" : "text-lay"
                        }`}
                    >
                        {bet.side}
                    </span>
                    <span className="font-medium">{bet.selectionName}</span>
                    <p className="tabular text-xs text-muted">@ {formatOdds(bet.price)}</p>
                </div>
                <button
                    type="button"
                    onClick={() => { void onRemove(bet.id); }}
                    aria-label={`Delete ${bet.side} on ${bet.selectionName}`}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-loss hover:text-loss"
                >
                    Delete
                </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-muted">
                    Stake
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={stake}
                        disabled={bet.status !== "open" || busy}
                        aria-label={`Stake for ${bet.selectionName}`}
                        onChange={(event) => setStake(event.target.value)}
                        onBlur={commitStake}
                        className="tabular w-20 rounded-md border border-border bg-panel px-2 py-1 text-text disabled:opacity-50"
                    />
                </label>

                <label className="ml-auto flex items-center gap-1 text-xs text-muted">
                    Status
                    <select
                        value={bet.status}
                        aria-label={`Status for ${bet.selectionName}`}
                        onChange={(event) => { void onAmend(bet.id, { status: event.target.value as BetStatus }); }}
                        className={`rounded-md border border-border bg-panel px-2 py-1 ${statusTone(bet.status)}`}
                    >
                        {(Object.keys(STATUS_LABELS) as BetStatus[]).map((value) => (
                            <option key={value} value={value}>
                                {STATUS_LABELS[value]}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {bet.note && <p className="mt-2 text-xs text-muted">{bet.note}</p>}
        </li>
    );
}

export function BettingNotebook({ bets, loading, error, onSave, onAmend, onRemove }: BettingNotebookProps) {
    const [selectionId, setSelectionId] = useState(MARKET.selections[0].id);
    const [side, setSide] = useState<Side>("back");
    const [price, setPrice] = useState(2);
    const [stake, setStake] = useState(10);
    const [note, setNote] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const selection = MARKET.selections.find((entry) => entry.id === selectionId);
        if (!selection) {
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            await onSave({
                selectionId: selection.id,
                selectionName: selection.name,
                side,
                price: roundToTick(price),
                stake,
                note,
            });
            setNote("");
        } catch (cause) {
            setFormError((cause as Error).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-xl border border-border bg-panel p-4">
            <h3 className="text-sm font-semibold">Betting notebook</h3>
            <p className="mt-1 text-xs text-muted">Record and manage the bets you are tracking. Saved to the API.</p>

            <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted">
                    Selection
                    <select
                        value={selectionId}
                        aria-label="Selection"
                        onChange={(event) => setSelectionId(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-panel-raised px-3 py-2 text-sm text-text"
                    >
                        {MARKET.selections.map((selection) => (
                            <option key={selection.id} value={selection.id}>
                                {selection.name}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="text-xs text-muted">
                    Side
                    <div className="mt-1 grid grid-cols-2 gap-2">
                        {(["back", "lay"] as Side[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={side === value}
                                onClick={() => setSide(value)}
                                className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${
                                    side === value
                                        ? value === "back"
                                            ? "border-back bg-back-soft text-text"
                                            : "border-lay bg-lay-soft text-text"
                                        : "border-border bg-panel-raised text-muted"
                                }`}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>

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
                        <span className="tabular flex-1 text-center text-sm font-semibold text-text">
                            {formatOdds(roundToTick(price))}
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
                        aria-label="Stake"
                        onChange={(event) => setStake(Math.max(0, Number(event.target.value)))}
                        className="tabular mt-1 w-full rounded-lg border border-border bg-panel-raised px-3 py-2 text-sm font-semibold text-text"
                    />
                </label>

                <label className="text-xs text-muted sm:col-span-2">
                    Note
                    <input
                        type="text"
                        value={note}
                        aria-label="Note"
                        placeholder="Why this bet?"
                        onChange={(event) => setNote(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-panel-raised px-3 py-2 text-sm text-text"
                    />
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-back py-2.5 text-sm font-semibold text-white transition disabled:opacity-40 sm:col-span-2"
                >
                    Save bet
                </button>
            </form>

            {formError && <p className="mt-3 rounded-md bg-lay-soft px-3 py-2 text-xs text-loss">{formError}</p>}
            {error && <p className="mt-3 rounded-md bg-lay-soft px-3 py-2 text-xs text-loss">{error}</p>}

            <div className="mt-4">
                {loading ? (
                    <p className="text-sm text-muted">Loading your bets…</p>
                ) : bets.length === 0 ? (
                    <p className="text-sm text-muted">No saved bets yet. Add one above to start tracking.</p>
                ) : (
                    <ul className="space-y-2">
                        {bets.map((bet) => (
                            <BetRow key={bet.id} bet={bet} onAmend={onAmend} onRemove={onRemove} />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
