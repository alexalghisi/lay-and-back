export type Side = "back" | "lay";

export interface Selection {
    id: string;
    name: string;
}

export interface Market {
    id: string;
    event: string;
    competition: string;
    startsAt: string;
    selections: Selection[];
}

export interface Order {
    id: string;
    selectionId: string;
    side: Side;
    price: number;
    size: number;
    remaining: number;
    createdAt: number;
    owner: "you" | "market";
}

export interface Fill {
    orderId: string;
    selectionId: string;
    side: Side;
    price: number;
    size: number;
    matchedAt: number;
    owner: Order["owner"];
}

export interface PriceLevel {
    price: number;
    size: number;
}

export interface SelectionBook {
    selectionId: string;
    toBack: PriceLevel[];
    toLay: PriceLevel[];
    lastTraded: number | null;
    tradedVolume: number;
}

export interface PlacementResult {
    fills: Fill[];
    matchedSize: number;
    averagePrice: number | null;
    resting: Order | null;
}
