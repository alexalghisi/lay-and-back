import { backProfit, layLiability, roundToTick } from "./odds";
import type {
    Fill,
    Market,
    Order,
    PlacementResult,
    PriceLevel,
    SelectionBook,
    Side,
} from "./types";

export interface PlaceRequest {
    selectionId: string;
    side: Side;
    price: number;
    size: number;
    owner?: Order["owner"];
}

export interface PlaceOutcome {
    order: PlacementResult;
    counterFills: Fill[];
}

const EPSILON = 1e-6;

function opposite(side: Side): Side {
    return side === "back" ? "lay" : "back";
}

function aggregate(orders: Order[], direction: "asc" | "desc"): PriceLevel[] {
    const byPrice = new Map<number, number>();
    for (const order of orders) {
        byPrice.set(order.price, (byPrice.get(order.price) ?? 0) + order.remaining);
    }
    const levels = Array.from(byPrice, ([price, size]) => ({ price, size }));
    levels.sort((a, b) => (direction === "asc" ? a.price - b.price : b.price - a.price));
    return levels.filter((level) => level.size > EPSILON);
}

export class ExchangeEngine {
    private readonly resting = new Map<string, Order[]>();
    private readonly lastTraded = new Map<string, number>();
    private readonly volume = new Map<string, number>();
    private clock: number;
    private sequence = 0;

    constructor(private readonly market: Market, startTime = 0) {
        this.clock = startTime;
        for (const selection of market.selections) {
            this.resting.set(selection.id, []);
            this.volume.set(selection.id, 0);
        }
    }

    private nextId(owner: Order["owner"]): string {
        this.sequence += 1;
        return `${owner}-${this.sequence}`;
    }

    tick(byMs = 1): void {
        this.clock += byMs;
    }

    place(request: PlaceRequest): PlaceOutcome {
        const owner = request.owner ?? "you";
        const price = roundToTick(request.price);
        const incoming: Order = {
            id: this.nextId(owner),
            selectionId: request.selectionId,
            side: request.side,
            price,
            size: request.size,
            remaining: request.size,
            createdAt: this.clock,
            owner,
        };

        const fills: Fill[] = [];
        const counterFills: Fill[] = [];
        const book = this.resting.get(request.selectionId);
        if (!book) {
            throw new Error(`Unknown selection: ${request.selectionId}`);
        }

        const candidates = book
            .filter((order) => order.side === opposite(incoming.side) && this.crosses(incoming, order))
            .sort((a, b) => this.priority(incoming.side, a, b));

        for (const resting of candidates) {
            if (incoming.remaining <= EPSILON) {
                break;
            }
            const traded = Math.min(incoming.remaining, resting.remaining);
            incoming.remaining -= traded;
            resting.remaining -= traded;

            fills.push(this.fillFor(incoming, resting.price, traded));
            counterFills.push(this.fillFor(resting, resting.price, traded));

            this.lastTraded.set(request.selectionId, resting.price);
            this.volume.set(request.selectionId, (this.volume.get(request.selectionId) ?? 0) + traded);
        }

        this.resting.set(
            request.selectionId,
            book.filter((order) => order.remaining > EPSILON),
        );

        let resting: Order | null = null;
        if (incoming.remaining > EPSILON) {
            resting = incoming;
            this.resting.get(request.selectionId)!.push(incoming);
        }

        const matchedSize = Number((incoming.size - incoming.remaining).toFixed(2));
        const averagePrice = matchedSize > 0
            ? Number((fills.reduce((sum, fill) => sum + fill.price * fill.size, 0) / matchedSize).toFixed(2))
            : null;

        return {
            order: { fills, matchedSize, averagePrice, resting },
            counterFills,
        };
    }

    cancel(orderId: string): boolean {
        for (const [selectionId, orders] of this.resting) {
            const next = orders.filter((order) => order.id !== orderId);
            if (next.length !== orders.length) {
                this.resting.set(selectionId, next);
                return true;
            }
        }
        return false;
    }

    seedResting(request: PlaceRequest): Order {
        const owner = request.owner ?? "market";
        const order: Order = {
            id: this.nextId(owner),
            selectionId: request.selectionId,
            side: request.side,
            price: roundToTick(request.price),
            size: request.size,
            remaining: request.size,
            createdAt: this.clock,
            owner,
        };
        this.resting.get(request.selectionId)?.push(order);
        return order;
    }

    restingFor(selectionId: string): Order[] {
        return [...(this.resting.get(selectionId) ?? [])];
    }

    snapshot(depth = 3): SelectionBook[] {
        return this.market.selections.map((selection) => {
            const orders = this.resting.get(selection.id) ?? [];
            const lays = orders.filter((order) => order.side === "lay");
            const backs = orders.filter((order) => order.side === "back");
            return {
                selectionId: selection.id,
                toBack: aggregate(lays, "desc").slice(0, depth),
                toLay: aggregate(backs, "asc").slice(0, depth),
                lastTraded: this.lastTraded.get(selection.id) ?? null,
                tradedVolume: Number((this.volume.get(selection.id) ?? 0).toFixed(2)),
            };
        });
    }

    private crosses(incoming: Order, resting: Order): boolean {
        return incoming.side === "back"
            ? resting.price >= incoming.price
            : resting.price <= incoming.price;
    }

    private priority(incomingSide: Side, a: Order, b: Order): number {
        if (a.price !== b.price) {
            return incomingSide === "back" ? b.price - a.price : a.price - b.price;
        }
        return a.createdAt - b.createdAt;
    }

    private fillFor(order: Order, price: number, size: number): Fill {
        return {
            orderId: order.id,
            selectionId: order.selectionId,
            side: order.side,
            price,
            size: Number(size.toFixed(2)),
            matchedAt: this.clock,
            owner: order.owner,
        };
    }
}

export function outcomePnl(fills: Fill[], winnerId: string): number {
    let total = 0;
    for (const fill of fills) {
        const isWinner = fill.selectionId === winnerId;
        if (fill.side === "back") {
            total += isWinner ? backProfit(fill.size, fill.price) : -fill.size;
        } else {
            total += isWinner ? -layLiability(fill.size, fill.price) : fill.size;
        }
    }
    return Number(total.toFixed(2));
}
