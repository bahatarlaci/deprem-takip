import { expect, test } from "@playwright/test";

const mockResponse = {
  data: [
    {
      eventID: "701434",
      date: "2026-01-15T01:51:03",
      location: "Gediz (Kütahya)",
      latitude: 39.0225,
      longitude: 29.70083,
      depth: 5.17,
      type: "ML",
      magnitude: 4.4,
      rms: 0.35,
      country: "Türkiye",
      province: "Kütahya",
      district: "Gediz",
      neighborhood: "Çukurören",
      isEventUpdate: false,
      lastUpdateDate: null,
    },
  ],
  meta: {
    fetchedAt: "2026-02-15T23:59:59",
    count: 1,
    source: "https://deprem.afad.gov.tr/apiv2/event/filter",
    radialOverridesBounding: false,
  },
};

test("dashboard açılır ve filtre değişimi isteğe yansır", async ({ page }) => {
  const requestedUrls: string[] = [];

  await page.route("**/api/earthquakes**", async (route) => {
    requestedUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockResponse),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Deprem Takip Paneli" })).toBeVisible();
  await expect(page.getByTestId("event-row-701434")).toBeVisible();

  await page.getByLabel("Min Büyüklük").fill("4");
  await page.getByRole("button", { name: "Uygula" }).click();

  await expect.poll(() => requestedUrls.some((url) => url.includes("minmag=4"))).toBe(true);
});
