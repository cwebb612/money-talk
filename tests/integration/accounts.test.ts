import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="username"]', process.env.APP_USERNAME!);
  await page.fill('input[name="password"]', process.env.APP_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
}

test.describe("Account Management", () => {
  test("create a cash account and see it on dashboard", async ({ page }) => {
    await login(page);

    await page.click('a:has-text("Add Account")');
    await expect(page).toHaveURL("/accounts/new");

    await page.fill('input[placeholder="e.g. Chase Checking"]', "Test Checking");
    await page.click('button:has-text("Cash")');
    await page.fill('input[type="number"]', "5000");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Test Checking")).toBeVisible();
    await expect(page.locator("text=$5,000.00")).toBeVisible();
  });

  test("create a stock account with holdings and see calculated value", async ({ page }) => {
    await login(page);

    await page.click('a:has-text("Add Account")');
    await page.fill('input[placeholder="e.g. Chase Checking"]', "Fidelity Stocks");
    await page.click('button:has-text("Stock")');
    await page.click('button:has-text("+ Add holding")');

    const tickerInput = page.locator('input[placeholder="Ticker"]').first();
    const qtyInput = page.locator('input[placeholder="Qty"]').first();
    const priceInput = page.locator('input[placeholder="Price"]').first();

    await tickerInput.fill("AAPL");
    await qtyInput.fill("10");
    await priceInput.fill("200");

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Fidelity Stocks")).toBeVisible();
    await expect(page.locator("text=$2,000.00")).toBeVisible();
  });
});
