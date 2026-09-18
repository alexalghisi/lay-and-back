import { expect, test } from "@playwright/test";
import type { Bet } from "../src/lib/bets/types";

test.beforeEach(async ({ request }) => {
    const existing = (await (await request.get("/api/bets")).json()) as Bet[];
    for (const bet of existing) {
        await request.delete(`/api/bets/${bet.id}`);
    }
});

test("records, updates and removes a tracked bet", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Selection").selectOption({ label: "Arsenal" });
    await page.getByRole("button", { name: "lay", exact: true }).click();
    await page.getByLabel("Stake", { exact: true }).fill("30");
    await page.getByLabel("Note").fill("value against Arsenal");
    await page.getByRole("button", { name: "Save bet" }).click();

    const stakeField = page.getByLabel("Stake for Arsenal");
    await expect(stakeField).toHaveValue("30");

    await stakeField.fill("45");
    await Promise.all([
        page.waitForResponse(
            (response) => response.url().includes("/api/bets/") && response.request().method() === "PATCH",
        ),
        stakeField.blur(),
    ]);
    await page.reload();
    await expect(page.getByLabel("Stake for Arsenal")).toHaveValue("45");

    await page.getByLabel("Status for Arsenal").selectOption("won");
    await expect(page.getByLabel("Status for Arsenal")).toHaveValue("won");
    await expect(page.getByLabel("Stake for Arsenal")).toBeDisabled();

    await page.getByRole("button", { name: "Delete lay on Arsenal" }).click();
    await expect(page.getByLabel("Stake for Arsenal")).toHaveCount(0);
});
