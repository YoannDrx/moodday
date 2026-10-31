import { expect, it } from "vitest";
import { usesIsolatedTestDelivery } from "@/lib/mail/isolated-test-delivery";
const environment = {
  MOODDAY_TEST_MAIL_TRANSPORT: "isolated",
  PLAYWRIGHT_DATABASE_GUARD_CONFIGURED: "true",
  DATABASE_URL: "postgresql://test@127.0.0.1:55439/test",
  BETTER_AUTH_URL: "http://localhost:3200",
};
it("requires an explicit isolated transport and local database and origin", () => {
  const recipients = ["playwright-test-one@example.test"];
  expect(usesIsolatedTestDelivery(environment, recipients)).toBe(true);
  expect(usesIsolatedTestDelivery({}, recipients)).toBe(false);
  expect(
    usesIsolatedTestDelivery({ ...environment, VERCEL: "1" }, recipients),
  ).toBe(false);
  expect(
    usesIsolatedTestDelivery(
      { ...environment, DATABASE_URL: "postgresql://test@remote.example/db" },
      recipients,
    ),
  ).toBe(false);
  expect(
    usesIsolatedTestDelivery(
      { ...environment, BETTER_AUTH_URL: "bad" },
      recipients,
    ),
  ).toBe(false);
});
it("never silently skips real recipients or a mixed recipient list", () => {
  expect(
    usesIsolatedTestDelivery(environment, ["playwright-test-one@gmail.com"]),
  ).toBe(false);
  expect(
    usesIsolatedTestDelivery(environment, [
      "playwright-test-one@example.test",
      "real@example.com",
    ]),
  ).toBe(false);
  expect(usesIsolatedTestDelivery(environment, [])).toBe(false);
});
