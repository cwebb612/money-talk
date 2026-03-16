import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("unauthenticated visit to / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', process.env.APP_USERNAME!);
    await page.fill('input[name="password"]', process.env.APP_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
  });

  test("logout redirects to /login and blocks access to /", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', process.env.APP_USERNAME!);
    await page.fill('input[name="password"]', process.env.APP_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");

    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
