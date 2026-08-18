const DASHBOARD_PATH = "/dashboard";

module.exports = async (browser, { url }) => {
  const target = new URL(url);
  if (target.pathname !== DASHBOARD_PATH) return;

  const email = process.env.LIGHTHOUSE_USER_EMAIL;
  const password = process.env.LIGHTHOUSE_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "LIGHTHOUSE_USER_EMAIL and LIGHTHOUSE_USER_PASSWORD are required",
    );
  }

  const pages = await browser.pages();
  const page = pages[0] ?? (await browser.newPage());
  await page.goto(
    `${target.origin}/auth/signin?callbackUrl=${encodeURIComponent(DASHBOARD_PATH)}`,
    { waitUntil: "networkidle2" },
  );
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  const signedInUrl = new URL(page.url());
  if (signedInUrl.pathname !== DASHBOARD_PATH) {
    throw new Error(
      "Lighthouse fixture could not authenticate to the dashboard",
    );
  }
};
