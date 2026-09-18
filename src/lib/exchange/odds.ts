const LADDER: Array<{ upTo: number; step: number }> = [
    { upTo: 2, step: 0.01 },
    { upTo: 3, step: 0.02 },
    { upTo: 4, step: 0.05 },
    { upTo: 6, step: 0.1 },
    { upTo: 10, step: 0.2 },
    { upTo: 20, step: 0.5 },
    { upTo: 30, step: 1 },
    { upTo: 50, step: 2 },
    { upTo: 100, step: 5 },
    { upTo: 1000, step: 10 },
];

export const MIN_PRICE = 1.01;
export const MAX_PRICE = 1000;

function stepAt(price: number): number {
    for (const band of LADDER) {
        if (price < band.upTo) {
            return band.step;
        }
    }
    return 10;
}

export function roundToTick(price: number): number {
    const clamped = Math.min(MAX_PRICE, Math.max(MIN_PRICE, price));
    const step = stepAt(clamped);
    const snapped = Math.round(clamped / step) * step;
    return Number(snapped.toFixed(2));
}

export function tickUp(price: number): number {
    const current = roundToTick(price);
    if (current >= MAX_PRICE) {
        return MAX_PRICE;
    }
    const step = stepAt(current + 1e-9);
    return roundToTick(current + step);
}

export function tickDown(price: number): number {
    const current = roundToTick(price);
    if (current <= MIN_PRICE) {
        return MIN_PRICE;
    }
    const step = stepAt(current - 1e-9);
    return roundToTick(current - step);
}

export function backProfit(stake: number, price: number): number {
    return stake * (price - 1);
}

export function layLiability(stake: number, price: number): number {
    return stake * (price - 1);
}
