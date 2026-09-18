"use client";

import { formatMoney, formatOdds } from "@/lib/exchange/format";
import type { Order } from "@/lib/exchange/types";

interface OpenOrdersProps {
    orders: Order[];
    selectionName: (selectionId: string) => string;
    onCancel: (orderId: string) => void;
}

export function OpenOrders({ orders, selectionName, onCancel }: OpenOrdersProps) {
    return (
        <section className="rounded-xl border border-border bg-panel p-4">
            <h3 className="text-sm font-semibold">
                Unmatched orders {orders.length > 0 && <span className="text-muted">({orders.length})</span>}
            </h3>
            {orders.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Orders waiting for liquidity show up here until they match.</p>
            ) : (
                <ul className="mt-3 space-y-2">
                    {orders.map((order) => (
                        <li
                            key={order.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-panel-raised px-3 py-2 text-sm"
                        >
                            <div>
                                <span
                                    className={`mr-2 text-xs font-semibold uppercase ${
                                        order.side === "back" ? "text-back" : "text-lay"
                                    }`}
                                >
                                    {order.side}
                                </span>
                                <span>{selectionName(order.selectionId)}</span>
                                <p className="tabular text-xs text-muted">
                                    {formatMoney(order.remaining)} @ {formatOdds(order.price)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onCancel(order.id)}
                                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:border-loss hover:text-loss"
                            >
                                Cancel
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
