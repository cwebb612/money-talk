import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="username"]', process.env.APP_USERNAME!);
  await page.fill('input[name="password"]', process.env.APP_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
}

test.describe("Reconciliation", () => {
  test("update cash account balance and see dashboard net worth change", async ({ page }) => {
    await login(page);

    // Create a new cash account
    await page.click('a:has-text("Add Account")');
    await page.fill('input[placeholder="e.g. Chase Checking"]', "Reconcile Test");
    await page.click('button:has-text("Cash")');
    await page.fill('input[type="number"]', "1000");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");

    // Navigate to account detail
    await page.click("text=Reconcile Test");
    await expect(page.url()).toContain("/accounts/");

    // Verify institution link area is present
    await expect(page.locator('button:has-text("Update Values")')).toBeVisible();

    // Update the balance
    await page.click('button:has-text("Update Values")');
    const balanceInput = page.locator('input[type="number"]').first();
    await balanceInput.fill("2500");
    await page.click('button:has-text("Save Changes")');

    // Should show updated value
    await expect(page.locator("text=$2,500.00")).toBeVisible();

    // Return to dashboard and verify net worth updated
    await page.click('a:has-text("← Dashboard")');
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=$2,500.00")).toBeVisible();
  });

  test("institution link is clickable", async ({ page }) => {
    await login(page);

    // Create account with institution link
    await page.click('a:has-text("Add Account")');
    await page.fill('input[placeholder="e.g. Chase Checking"]', "Bank With Link");
    await page.click('button:has-text("Cash")');
    await page.fill('input[placeholder="https://your-bank.com"]', "https://example.com");
    await page.fill('input[type="number"]', "500");
    await page.click('button[type="submit"]');

    await page.click("text=Bank With Link");
    const link = page.locator('a:has-text("Go To Account")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("target", "_blank");
  });
});
