import { test, expect, Page } from "@playwright/test";

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="username"]', process.env.APP_USERNAME!);
  await page.fill('input[name="password"]', process.env.APP_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
}

const collapseToggles = (page: Page) => page.getByRole("button", { name: /^(Collapse|Expand) / });
const presetButtons = (page: Page) => page.getByRole("button", { name: "1M", exact: true });

test.describe("Collapsible cards", () => {
  test("desktop shows every card open with no collapse toggles", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await login(page);
    await page.goto("/analytics");

    await expect(page.getByText("Monthly Change", { exact: true })).toBeVisible();
    await expect(collapseToggles(page)).toHaveCount(0);
    await expect(presetButtons(page)).toHaveCount(3);
  });

  test("mobile cards collapse, and widening to desktop opens them again", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await login(page);
    await page.goto("/analytics");

    await expect(collapseToggles(page)).toHaveCount(4);
    await page.getByRole("button", { name: "Collapse Trends" }).click();
    await expect(page.getByRole("button", { name: "Expand Trends" })).toBeVisible();
    await expect(presetButtons(page)).toHaveCount(2);

    await page.setViewportSize(DESKTOP);
    await expect(collapseToggles(page)).toHaveCount(0);
    await expect(presetButtons(page)).toHaveCount(3);
  });
});
