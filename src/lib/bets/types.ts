import type { Side } from "@/lib/exchange/types";

export type BetStatus = "open" | "won" | "lost" | "void";

export interface Bet {
    id: string;
    selectionId: string;
    selectionName: string;
    side: Side;
    price: number;
    stake: number;
    note: string;
    status: BetStatus;
    createdAt: number;
    updatedAt: number;
}

export interface NewBet {
    selectionId: string;
    selectionName: string;
    side: Side;
    price: number;
    stake: number;
    note?: string;
}

export interface BetPatch {
    price?: number;
    stake?: number;
    note?: string;
    status?: BetStatus;
}
