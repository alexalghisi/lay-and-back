"use client";

import type { FeedEntry } from "@/hooks/useExchange";

interface MarketFeedProps {
    feed: FeedEntry[];
}

export function MarketFeed({ feed }: MarketFeedProps) {
    return (
        <section className="rounded-xl border border-border bg-panel p-4">
            <h3 className="text-sm font-semibold">Activity</h3>
            {feed.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Your order activity and fills will stream here.</p>
            ) : (
                <ul className="mt-3 space-y-1.5 text-xs">
                    {feed.map((entry) => (
                        <li key={entry.id} className="text-muted">
                            {entry.text}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
