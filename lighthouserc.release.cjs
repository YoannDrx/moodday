const base = require("./lighthouserc.cjs");

const settings = { ...base.ci.collect.settings };
delete settings.chromeFlags;
const chromePath =
  process.env.LIGHTHOUSE_CHROME_PATH ??
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "/usr/bin/google-chrome");

/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    ...base.ci,
    collect: {
      ...base.ci.collect,
      url: [...base.ci.collect.url, "http://127.0.0.1:3200/dashboard"],
      settings,
      chromePath,
      puppeteerScript: "./scripts/lighthouse-auth.cjs",
      puppeteerLaunchOptions: {
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      },
    },
  },
};
