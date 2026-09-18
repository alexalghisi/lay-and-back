export function formatOdds(price: number | null): string {
    if (price === null) {
        return "—";
    }
    return price.toFixed(2);
}

export function formatMoney(amount: number): string {
    const rounded = Math.round(Math.abs(amount) * 100) / 100;
    const sign = amount < 0 ? "-" : "";
    return `${sign}£${rounded.toFixed(2)}`;
}

export function formatSize(size: number): string {
    if (size >= 1000) {
        return `£${(size / 1000).toFixed(1)}k`;
    }
    return `£${Math.round(size)}`;
}
