import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="username"]', process.env.APP_USERNAME!);
  await page.fill('input[name="password"]', process.env.APP_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
}

async function setAmount(page: Page, name: string, value: string) {
  const field = page.getByRole("textbox", { name, exact: true });
  await field.fill(value);
  await field.blur();
}

async function deleteTestGoals(page: Page) {
  const goals: { _id: string; title: string }[] = await (await page.request.get("/api/goals")).json();
  for (const goal of goals.filter((g) => g.title.startsWith("E2E"))) {
    await page.request.delete(`/api/goals/${goal._id}`);
  }
}

test.describe("Goals", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page);
    await deleteTestGoals(page);
  });

  test.afterEach(async ({ page }) => {
    await deleteTestGoals(page);
  });

  test("creates, edits, shows on the dashboard, completes and deletes a goal", async ({ page }) => {
    const title = `E2E Goal ${Date.now()}`;
    const renamed = `${title} renamed`;

    await page.getByRole("link", { name: "Goals", exact: true }).click();
    await expect(page).toHaveURL("/goals");

    await page.getByRole("button", { name: "+ New Goal" }).click();
    await page.getByLabel("Title").fill(title);
    await setAmount(page, "Target amount", "99000000");
    await page.getByRole("button", { name: "Add Goal" }).click();

    const card = page.getByRole("article", { name: title });
    await expect(card).toBeVisible();
    await expect(card.getByText("of $99,000,000")).toBeVisible();

    await card.getByRole("button", { name: "Edit goal" }).click();
    await page.getByLabel("Title").fill(renamed);
    await page.getByRole("button", { name: "Save Changes" }).click();
    const renamedCard = page.getByRole("article", { name: renamed });
    await expect(renamedCard).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("region", { name: "Goals" }).getByText(renamed)).toBeVisible();

    await page.goto("/goals");
    await renamedCard.getByRole("button", { name: "Show on dashboard" }).click();
    await expect(renamedCard.getByRole("button", { name: "Show on dashboard" })).toHaveAttribute("aria-pressed", "false");
    await page.goto("/");
    await expect(page.getByText(renamed)).toHaveCount(0);

    await page.goto("/goals");
    await renamedCard.getByRole("button", { name: "Edit goal" }).click();
    await page.getByRole("dialog", { name: "Edit goal" }).getByRole("button", { name: "Mark complete" }).click();
    await expect(renamedCard).toHaveCount(0);
    await page.getByRole("button", { name: /Completed and archived/ }).click();
    const closedRow = page.getByRole("listitem").filter({ hasText: renamed });
    await expect(closedRow.getByText(/Completed/)).toBeVisible();

    await closedRow.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(page.getByText(renamed)).toHaveCount(0);
  });

  test("fills the goal form from a suggestion", async ({ page }) => {
    await page.goto("/goals");
    await page.getByRole("button", { name: /Suggestions/ }).click();
    await expect(page.getByText("Suggested goals")).toBeVisible();

    const firstUse = page.getByRole("button", { name: /^Use / }).first();
    const label = await firstUse.getAttribute("aria-label");
    await firstUse.click();

    await expect(page.getByRole("heading", { name: "New goal" })).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue(label!.replace(/^Use /, ""));
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "New goal" })).toHaveCount(0);
  });

  test("shows hover hints and archives and deletes from the edit modal", async ({ page }) => {
    const title = `E2E Modal ${Date.now()}`;
    await page.goto("/goals");
    await page.getByRole("button", { name: "+ New Goal" }).click();
    await page.getByLabel("Title").fill(title);
    await setAmount(page, "Target amount", "99000000");
    await page.getByRole("button", { name: "Add Goal" }).click();

    const card = page.getByRole("article", { name: title });
    await expect(card.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await expect(card.getByRole("button", { name: "Mark complete" })).toHaveCount(0);
    await expect(card.getByRole("button", { name: "Archive" })).toHaveCount(0);

    await card.getByRole("button", { name: "Show on dashboard" }).hover();
    await expect(page.getByRole("tooltip")).toHaveText("Shown on the dashboard. Click to hide it.");
    await card.getByRole("button", { name: "Edit goal" }).hover();
    await expect(page.getByRole("tooltip")).toHaveText("Edit, complete, archive or delete this goal.");

    await card.getByRole("button", { name: "Edit goal" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit goal" });
    await dialog.getByRole("button", { name: "Archive" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card).toHaveCount(0);

    await page.getByRole("button", { name: /Completed and archived/ }).click();
    const row = page.getByRole("listitem").filter({ hasText: title });
    await expect(row.getByText(/Archived/)).toBeVisible();
    await row.getByRole("button", { name: "Reopen" }).click();
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Edit goal" }).click();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await dialog.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("adds a special millionaire goal and an add-amount goal from suggestions", async ({ page }) => {
    await page.goto("/goals");

    await page.getByRole("button", { name: "Suggestions" }).click();
    await page.getByRole("button", { name: "Use Become a millionaire" }).click();
    await page.getByLabel("Title").fill("E2E Millionaire");
    await page.getByRole("button", { name: "Add Goal" }).click();
    const millionaire = page.getByRole("article", { name: "E2E Millionaire" });
    await expect(millionaire.getByLabel("Millionaire", { exact: true })).toBeVisible();
    await expect(millionaire.getByText("of $1,000,000")).toBeVisible();

    await page.getByRole("button", { name: "Suggestions" }).click();
    await page.getByRole("button", { name: /^Use Add .* this year$/ }).click();
    await expect(page.getByLabel("Start date")).toBeVisible();
    await page.getByLabel("Title").fill("E2E Add Amount");
    await page.getByRole("button", { name: "Add Goal" }).click();
    const addAmount = page.getByRole("article", { name: "E2E Add Amount" });
    await expect(addAmount.getByText(/Add \$10,000 since/)).toBeVisible();

    for (const card of [millionaire, addAmount]) {
      await card.getByRole("button", { name: "Edit goal" }).click();
      const dialog = page.getByRole("dialog", { name: "Edit goal" });
      await dialog.getByRole("button", { name: "Delete" }).click();
      await dialog.getByRole("button", { name: "Delete", exact: true }).last().click();
      await expect(card).toHaveCount(0);
    }
  });

  test("shows FIRE as one target type with a Coast FIRE option", async ({ page }) => {
    const title = `E2E FIRE ${Date.now()}`;

    await page.goto("/goals");
    await page.getByRole("button", { name: "+ New Goal" }).click();
    const targetTypes = page.getByRole("group", { name: "Target type" });
    await expect(targetTypes.getByRole("button", { name: "Coast FIRE" })).toHaveCount(0);

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Track").click();
    await page.getByRole("option", { name: "Investments" }).click();
    await targetTypes.getByRole("button", { name: "FIRE", exact: true }).click();
    const fireTypes = page.getByRole("group", { name: "FIRE type" });
    await expect(fireTypes.getByRole("button", { name: "Full FIRE" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("textbox", { name: "Retirement age", exact: true })).toHaveCount(0);

    await fireTypes.getByRole("button", { name: "Coast FIRE" }).click();
    await expect(page.getByRole("textbox", { name: "Retirement age", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Add Goal" }).click();

    const card = page.getByRole("article", { name: title });
    await expect(card.getByText("Coast FIRE")).toBeVisible();

    await card.getByRole("button", { name: "Edit goal" }).click();
    await expect(page.getByRole("group", { name: "Target type" }).getByRole("button", { name: "FIRE", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("group", { name: "FIRE type" }).getByRole("button", { name: "Coast FIRE" })).toHaveAttribute("aria-pressed", "true");
  });
});
