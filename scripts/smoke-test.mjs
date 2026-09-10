import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.BASE_URL || "http://localhost:3000";
const stamp = Date.now();
const email = `qa-${stamp}@example.test`;
const companyName = `مطعم اختبار Qira ${stamp}`;
const password = `Sufra-test-${stamp}!`;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    !message.text().includes("Failed to load resource")
  )
    browserErrors.push(message.text());
});
mkdirSync(".artifacts", { recursive: true });
let secondContext;
const checks = [];
const check = (message) => {
  checks.push(message);
  console.log(`PASS: ${message}`);
};
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page).toHaveTitle(/Qira/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page
    .locator(".hero-actions")
    .getByRole("button", { name: "شاهد كيف تعمل المنصة" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "المطبخ الرقمي", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator(".mini-kitchen-columns"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  check("Tour opens, changes views, and closes with Escape");
  const faq = page.getByRole("button", {
    name: /ماذا يحدث بعد انتهاء الشهرين/,
  });
  await faq.click();
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  const loyaltyAddOn = page
    .locator(".addon-row")
    .filter({ hasText: "نقاط الولاء" });
  await loyaltyAddOn.click();
  await expect(loyaltyAddOn).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "اطلب عرضك المخصص", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator(".selected-addons"),
  ).toContainText("نقاط الولاء");
  await page.keyboard.press("Escape");
  check("FAQ and package configurator preserve the selected state");
  const contact = page.locator("#contact form");
  await contact.locator("[name=fullName]").fill("فريق اختبار Qira");
  await contact.locator("[name=restaurant]").fill("مطعم الاختبار الآلي");
  await contact.locator("[name=phone]").fill("0501234567");
  await contact.locator("[name=email]").fill(email);
  await contact
    .locator("[name=message]")
    .fill("طلب اختبار آلي للتحقق من حفظ النموذج. لا يتطلب متابعة.");
  await contact.getByRole("button", { name: "أرسل طلبك", exact: true }).click();
  await expect(page.locator("#contact .form-success")).toBeVisible();
  await expect(page.locator("#contact .reference-number b")).toHaveText(
    /^[A-F0-9]{8}$/,
  );
  check("Contact form saves to PostgreSQL and returns a reference");
  await page.locator(".nav-cta").click();
  const auth = page.locator(".auth-form");
  await auth.locator("[name=fullName]").fill("مدير الاختبار");
  await auth.locator("[name=restaurant]").fill(companyName);
  await auth.locator("[name=email]").fill(email);
  await auth.locator("[name=phone]").fill("0501234567");
  await auth.locator("[name=password]").fill(password);
  await auth.locator("[name=consent]").check();
  await auth
    .getByRole("button", { name: "أنشئ حسابي وابدأ الشهرين المجانيين" })
    .click();
  await page.waitForURL("**/dashboard");
  await expect(page.locator(".workspace-onboarding")).toBeVisible();
  check("Registration creates an authenticated, empty restaurant workspace");
  await page.screenshot({ path: ".artifacts/workspace-empty.png" });
  await page.getByRole("button", { name: "ابدأ مناوبتك الأولى" }).click();
  await page.getByRole("dialog").locator("[name=amount]").fill("500");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "ابدأ المناوبة", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".shift-hero-card")).toContainText("مناوبة نشطة");
  check("A cash shift opens with a stored opening balance");
  await page.getByRole("link", { name: "قائمة العميل", exact: true }).click();
  await page.waitForURL("**/demo");
  await page
    .getByRole("button", { name: "إضافة برجر Qira الكلاسيكي", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إضافة ليمون ونعناع", exact: true })
    .click();
  await expect(page.locator(".cart-panel .cart-lines .cart-line")).toHaveCount(
    2,
  );
  await page.screenshot({ path: ".artifacts/menu-cart.png" });
  await page
    .locator(".cart-panel")
    .getByRole("button", { name: "أرسل الطلب التجريبي", exact: true })
    .click();
  await expect(page.locator(".customer-order-card")).toHaveCount(1);
  await expect(page.locator(".customer-order-card .status-badge")).toHaveText(
    "جديد",
  );
  await page
    .locator(".customer-order-card")
    .getByRole("button", { name: "ابدأ التحضير", exact: true })
    .click();
  await expect(page.locator(".customer-order-card .status-badge")).toHaveText(
    "قيد التحضير",
  );
  await page
    .locator(".customer-order-card")
    .getByRole("button", { name: "الطلب جاهز", exact: true })
    .click();
  await expect(page.locator(".customer-order-card .status-badge")).toHaveText(
    "جاهز",
  );
  await page
    .locator(".customer-order-card")
    .getByRole("button", { name: "تسجيل الدفع التجريبي", exact: true })
    .click();
  await expect(page.locator(".customer-order-card .status-badge")).toHaveText(
    "مكتمل",
  );
  const ownOrders = await (
    await context.request.get(`${base}/api/orders?scope=dashboard`)
  ).json();
  const order = ownOrders.orders[0];
  expect(order.total).toBe(6000);
  expect(order.status).toBe("paid");
  check(
    "Cart, server-authoritative total, kitchen transitions and cash recording work",
  );
  const immutableResponse = await context.request.patch(`${base}/api/orders`, {
    data: { id: order.id, status: "preparing" },
  });
  expect(immutableResponse.status()).toBe(409);
  check("Closed orders cannot be edited or reopened");
  await page.getByRole("button", { name: "اطلب الخدمة", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("طلب الخدمة");
  await page
    .locator(".demo-notice")
    .getByRole("link", { name: "لوحة مطعمك", exact: true })
    .click();
  await expect(page.locator(".workspace-kpi").first()).toContainText("٦٠");
  await expect(page.locator(".service-feed")).toContainText(
    "طلب مساعدة الفريق",
  );
  await page.screenshot({ path: ".artifacts/workspace.png" });
  check("Dashboard reflects saved sales and customer service requests");
  await page.getByRole("button", { name: "التقارير", exact: true }).click();
  const downloadCsv = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  expect((await downloadCsv).suggestedFilename()).toMatch(/\.csv$/);
  const downloadExcel = page.waitForEvent("download");
  await page.getByRole("button", { name: "Excel", exact: true }).click();
  expect((await downloadExcel).suggestedFilename()).toMatch(/\.xml$/);
  check("Reports export downloadable Arabic CSV and Excel XML files");
  await page.getByRole("button", { name: "المناوبات", exact: true }).click();
  await page
    .getByRole("button", { name: "إغلاق المناوبة", exact: true })
    .click();
  await page.getByRole("dialog").locator("[name=amount]").fill("559");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "أغلق المناوبة واحسب الفرق", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const workspaceData = await (
    await context.request.get(`${base}/api/workspace`)
  ).json();
  expect(workspaceData.shifts[0].openingAmount).toBe(50000);
  expect(workspaceData.shifts[0].expectedAmount).toBe(56000);
  expect(workspaceData.shifts[0].closingAmount).toBe(55900);
  check("Shift reconciliation accurately calculates the cash discrepancy");
  await page.getByRole("button", { name: "قائمة الطعام", exact: true }).click();
  const availability = page.getByRole("switch", {
    name: "إتاحة برجر Qira الكلاسيكي",
  });
  await availability.click();
  await expect(availability).toHaveAttribute("aria-checked", "false");
  const blockedOrder = await context.request.post(`${base}/api/orders`, {
    data: {
      requestKey: crypto.randomUUID(),
      items: [{ id: "burger", quantity: 1 }],
    },
  });
  expect(blockedOrder.status()).toBe(409);
  check("Item availability persists and is validated on the server");
  const key = crypto.randomUUID();
  const newPayload = {
    requestKey: key,
    items: [{ id: "lemon", quantity: 1 }],
    total: 1,
  };
  const firstCreate = await context.request.post(`${base}/api/orders`, {
    data: newPayload,
  });
  expect(firstCreate.status()).toBe(201);
  const firstSaved = (await firstCreate.json()).order;
  const retryCreate = await context.request.post(`${base}/api/orders`, {
    data: newPayload,
  });
  expect((await retryCreate.json()).order.id).toBe(firstSaved.id);
  expect(firstSaved.total).toBe(1800);
  await context.request.patch(`${base}/api/orders`, {
    data: { id: firstSaved.id, status: "preparing" },
  });
  await context.request.patch(`${base}/api/orders`, {
    data: { id: firstSaved.id, status: "ready" },
  });
  const withoutShift = await context.request.patch(`${base}/api/orders`, {
    data: { id: firstSaved.id, status: "paid" },
  });
  expect(withoutShift.status()).toBe(409);
  check(
    "Idempotency prevents duplicate orders and closed shifts block payment",
  );
  expect((await context.request.post(`${base}/api/auth/logout`)).status()).toBe(
    200,
  );
  expect((await context.request.get(`${base}/api/workspace`)).status()).toBe(
    401,
  );
  const wrongPassword = await context.request.post(`${base}/api/auth/login`, {
    data: { email, password: "wrong-password" },
  });
  expect(wrongPassword.status()).toBe(401);
  const login = await context.request.post(`${base}/api/auth/login`, {
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  expect((await context.request.get(`${base}/api/workspace`)).status()).toBe(
    200,
  );
  check("Logout, invalid credentials, and secure login work correctly");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dims = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dims.scrollWidth).toBeLessThanOrEqual(dims.width);
    if (width === 390)
      await page.screenshot({ path: ".artifacts/workspace-mobile.png" });
  }
  check("Restaurant workspace fits mobile, tablet and desktop screens");
  secondContext = await browser.newContext();
  const secondName = `مطعم معزول ${stamp}`;
  const secondRegistration = await secondContext.request.post(
    `${base}/api/auth/register`,
    {
      data: {
        fullName: "مدير ثانٍ",
        restaurant: secondName,
        email: `qa-b-${stamp}@example.test`,
        phone: "0501234568",
        branchCount: "1",
        password,
        consent: true,
      },
    },
  );
  expect(secondRegistration.status()).toBe(201);
  const otherOrders = await (
    await secondContext.request.get(`${base}/api/orders?scope=dashboard`)
  ).json();
  expect(otherOrders.orders).toEqual([]);
  const forbidden = await secondContext.request.patch(`${base}/api/orders`, {
    data: { id: order.id, status: "preparing" },
  });
  expect(forbidden.status()).toBe(404);
  check("A second company cannot read or modify the first company’s orders");
  const deleteB = await secondContext.request.delete(`${base}/api/workspace`, {
    data: { confirmation: secondName },
  });
  expect(deleteB.status()).toBe(200);
  const badConfirmation = await context.request.delete(
    `${base}/api/workspace`,
    { data: { confirmation: "خطأ" } },
  );
  expect(badConfirmation.status()).toBe(400);
  const deleteA = await context.request.delete(`${base}/api/workspace`, {
    data: { confirmation: companyName },
  });
  expect(deleteA.status()).toBe(200);
  const loggedOut = await context.request.get(
    `${base}/api/orders?scope=dashboard`,
  );
  expect(loggedOut.status()).toBe(401);
  check("Workspace deletion requires confirmation and removes account access");
  for (const path of [
    "/legal/privacy",
    "/legal/terms",
    "/legal/retention",
    "/robots.txt",
    "/sitemap.xml",
    "/api/health",
  ])
    expect((await context.request.get(`${base}${path}`)).status()).toBe(200);
  expect(
    (await context.request.get(`${base}/this-page-does-not-exist`)).status(),
  ).toBe(404);
  check(
    "Legal pages, SEO routes, healthcheck and custom 404 respond correctly",
  );
  writeFileSync(
    ".artifacts/smoke-results.json",
    JSON.stringify({ checks, browserErrors }, null, 2),
  );
  console.log("BROWSER ERRORS:", JSON.stringify(browserErrors));
  console.log(`Completed ${checks.length} end-to-end checks.`);
} catch (error) {
  await page
    .screenshot({ path: ".artifacts/test-failure.png", fullPage: true })
    .catch(() => {});
  console.error("TEST FAILED AT", page.url(), error);
  console.error("BROWSER ERRORS:", JSON.stringify(browserErrors));
  process.exitCode = 1;
} finally {
  await secondContext?.close();
  await context.close();
  await browser.close();
}
