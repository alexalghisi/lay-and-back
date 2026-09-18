import { MAX_PRICE, MIN_PRICE, roundToTick } from "@/lib/exchange/odds";
import { NotFoundError, ValidationError } from "./errors";
import type { BetRepository } from "./repository";
import type { Bet, BetPatch, BetStatus, NewBet } from "./types";

const SIDES = new Set(["back", "lay"]);
const STATUSES = new Set<BetStatus>(["open", "won", "lost", "void"]);
const NOTE_LIMIT = 280;

export interface ServiceDeps {
    now: () => number;
    id: () => string;
}

function assertPrice(price: unknown): number {
    if (typeof price !== "number" || !Number.isFinite(price)) {
        throw new ValidationError("Price must be a number");
    }
    if (price < MIN_PRICE || price > MAX_PRICE) {
        throw new ValidationError(`Price must be between ${MIN_PRICE} and ${MAX_PRICE}`);
    }
    if (roundToTick(price) !== price) {
        throw new ValidationError("Price must sit on the odds ladder");
    }
    return price;
}

function assertStake(stake: unknown): number {
    if (typeof stake !== "number" || !Number.isFinite(stake) || stake <= 0) {
        throw new ValidationError("Stake must be a positive number");
    }
    return Number(stake.toFixed(2));
}

function assertNote(note: unknown): string {
    if (note === undefined || note === null) {
        return "";
    }
    if (typeof note !== "string") {
        throw new ValidationError("Note must be text");
    }
    const trimmed = note.trim();
    if (trimmed.length > NOTE_LIMIT) {
        throw new ValidationError(`Note must be ${NOTE_LIMIT} characters or fewer`);
    }
    return trimmed;
}

function assertText(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new ValidationError(`${field} is required`);
    }
    return value.trim();
}

export class BetService {
    constructor(
        private readonly repo: BetRepository,
        private readonly deps: ServiceDeps,
    ) {}

    place(input: NewBet): Bet {
        if (!SIDES.has(input.side)) {
            throw new ValidationError("Side must be back or lay");
        }
        const now = this.deps.now();
        const bet: Bet = {
            id: this.deps.id(),
            selectionId: assertText(input.selectionId, "Selection"),
            selectionName: assertText(input.selectionName, "Selection name"),
            side: input.side,
            price: assertPrice(input.price),
            stake: assertStake(input.stake),
            note: assertNote(input.note),
            status: "open",
            createdAt: now,
            updatedAt: now,
        };
        return this.repo.create(bet);
    }

    list(): Bet[] {
        return this.repo.findAll();
    }

    get(id: string): Bet {
        const bet = this.repo.findById(id);
        if (!bet) {
            throw new NotFoundError(`Bet ${id} not found`);
        }
        return bet;
    }

    amend(id: string, patch: BetPatch): Bet {
        const current = this.get(id);
        const changes: Partial<Bet> = {};

        if (patch.price !== undefined || patch.stake !== undefined) {
            if (current.status !== "open") {
                throw new ValidationError("Only open bets can be repriced");
            }
        }
        if (patch.price !== undefined) {
            changes.price = assertPrice(patch.price);
        }
        if (patch.stake !== undefined) {
            changes.stake = assertStake(patch.stake);
        }
        if (patch.note !== undefined) {
            changes.note = assertNote(patch.note);
        }
        if (patch.status !== undefined) {
            if (!STATUSES.has(patch.status)) {
                throw new ValidationError("Unknown status");
            }
            changes.status = patch.status;
        }
        if (Object.keys(changes).length === 0) {
            throw new ValidationError("Nothing to update");
        }

        changes.updatedAt = this.deps.now();
        const updated = this.repo.update(id, changes);
        if (!updated) {
            throw new NotFoundError(`Bet ${id} not found`);
        }
        return updated;
    }

    remove(id: string): void {
        if (!this.repo.remove(id)) {
            throw new NotFoundError(`Bet ${id} not found`);
        }
    }

    clear(): void {
        this.repo.clear();
    }
}
