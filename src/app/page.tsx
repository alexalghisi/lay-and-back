"use client";

import { useState } from "react";
import { BrandBar } from "@/components/exchange/BrandBar";
import { MarketBoard } from "@/components/exchange/MarketBoard";
import { BetSlip, type BetDraft } from "@/components/exchange/BetSlip";
import { ExposurePanel } from "@/components/exchange/ExposurePanel";
import { OpenOrders } from "@/components/exchange/OpenOrders";
import { MarketFeed } from "@/components/exchange/MarketFeed";
import { SignatureFooter } from "@/components/exchange/SignatureFooter";
import { useExchange } from "@/hooks/useExchange";
import type { PlaceRequest } from "@/lib/exchange/engine";
import type { Side } from "@/lib/exchange/types";

export default function Home() {
    const exchange = useExchange();
    const [draft, setDraft] = useState<BetDraft | null>(null);

    const pick = (selectionId: string, side: Side, price: number) => {
        setDraft({ selectionId, side, price });
    };

    const place = (request: PlaceRequest) => {
        exchange.placeBet(request);
        setDraft(null);
    };

    return (
        <>
            <BrandBar
                market={exchange.market}
                balance={exchange.balance}
                live={exchange.live}
                onToggleLive={exchange.toggleLive}
            />

            <main className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-4 py-6 lg:grid-cols-[1.6fr_1fr]">
                <div className="flex flex-col gap-4">
                    <MarketBoard market={exchange.market} books={exchange.books} onPick={pick} />
                    <p className="rounded-xl border border-border bg-panel/60 px-4 py-3 text-sm text-muted">
                        On an exchange you bet against other people, not the house. <span className="text-back">Back</span>{" "}
                        means an outcome will happen; <span className="text-lay">lay</span> means it will not. Prices are
                        matched by price, then by time — exactly how the real order book behaves.
                    </p>
                    <MarketFeed feed={exchange.feed} />
                </div>

                <aside className="flex flex-col gap-4">
                    <BetSlip
                        draft={draft}
                        selectionName={exchange.selectionName}
                        balance={exchange.balance}
                        onPlace={place}
                        onClear={() => setDraft(null)}
                    />
                    <ExposurePanel exposure={exchange.exposure} hasBets={exchange.myFills.length > 0} />
                    <OpenOrders
                        orders={exchange.openOrders}
                        selectionName={exchange.selectionName}
                        onCancel={exchange.cancelOrder}
                    />
                </aside>
            </main>

            <SignatureFooter />
        </>
    );
}
