import { InMemoryBetRepository } from "./repository";
import { BetService } from "./service";

const globalStore = globalThis as unknown as { __betService?: BetService };

export const betService =
    globalStore.__betService ??
    new BetService(new InMemoryBetRepository(), {
        now: () => Date.now(),
        id: () => crypto.randomUUID(),
    });

globalStore.__betService = betService;
