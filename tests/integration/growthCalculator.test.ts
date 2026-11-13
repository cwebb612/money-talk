import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="username"]', process.env.APP_USERNAME!);
  await page.fill('input[name="password"]', process.env.APP_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
}

async function setField(page: Page, name: string, value: string) {
  const field = page.getByRole("textbox", { name, exact: true });
  await field.fill(value);
  await field.blur();
}

async function setGrowth(page: Page, values: { start: string; years: string; rate: string; monthly: string }) {
  await setField(page, "Starting amount", values.start);
  await setField(page, "Years", values.years);
  await setField(page, "Annual return", values.rate);
  await setField(page, "Monthly contribution", values.monthly);
}

test.describe("Growth calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page);
    await page.goto("/analytics");
    await expect(page.getByText("Growth Calculator", { exact: true })).toBeVisible();
  });

  test("projects a custom starting amount with contributions", async ({ page }) => {
    await setGrowth(page, { start: "10000", years: "1", rate: "0", monthly: "100" });

    await expect(page.getByRole("button", { name: "Custom" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("$11,200", { exact: true })).toBeVisible();
    await expect(page.getByText("$1,200", { exact: true })).toBeVisible();
  });

  test("describes how bold the annual return is", async ({ page }) => {
    await setField(page, "Annual return", "5");
    await expect(page.getByText("Moderate", { exact: true })).toBeVisible();
    await setField(page, "Annual return", "16");
    await expect(page.getByText("Speculative", { exact: true })).toBeVisible();
  });
});
