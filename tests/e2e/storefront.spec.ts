import { test, expect } from "@playwright/test";
test("home, discovery, and authentication navigation work without invented data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good finds/ })).toBeVisible();
  await page
    .getByRole("link", { name: "Explore marketplace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your kind of good." }),
  ).toBeVisible();
  await page.goto("/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await expect(page.getByLabel("Matriculation number")).toBeVisible();
});
test("responsive layouts do not overflow horizontally", async ({ page }) => {
  for (const route of [
    "/",
    "/marketplace",
    "/login",
    "/signup",
    "/stores",
    "/setup",
  ]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
test("private dashboards fail closed without configuration", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/(setup|login)$/);
});
