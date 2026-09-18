import type { Bet } from "./types";

export interface BetRepository {
    create(bet: Bet): Bet;
    findAll(): Bet[];
    findById(id: string): Bet | null;
    update(id: string, changes: Partial<Bet>): Bet | null;
    remove(id: string): boolean;
    clear(): void;
}

export class InMemoryBetRepository implements BetRepository {
    private readonly bets = new Map<string, Bet>();

    create(bet: Bet): Bet {
        this.bets.set(bet.id, bet);
        return bet;
    }

    findAll(): Bet[] {
        return Array.from(this.bets.values()).sort((a, b) => b.createdAt - a.createdAt);
    }

    findById(id: string): Bet | null {
        return this.bets.get(id) ?? null;
    }

    update(id: string, changes: Partial<Bet>): Bet | null {
        const current = this.bets.get(id);
        if (!current) {
            return null;
        }
        const updated = { ...current, ...changes, id: current.id };
        this.bets.set(id, updated);
        return updated;
    }

    remove(id: string): boolean {
        return this.bets.delete(id);
    }

    clear(): void {
        this.bets.clear();
    }
}
