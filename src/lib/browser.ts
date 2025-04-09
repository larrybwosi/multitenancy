// lib/browser.ts
import puppeteer from "puppeteer-core";

// Define connection options type
interface BrowserConnectionOptions {
  browserWSEndpoint?: string; // For remote connection (e.g., Browserless)
  executablePath?: string; // For local connection (dev only)
}

export async function getBrowserInstance() {
  const options: BrowserConnectionOptions = {};
  const browserWSEndpoint = process.env.BROWSERLESS_WSS_URL;
  // Example for local dev fallback (adjust path to your Chrome/Chromium)
  // const localExecutablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // macOS example

  if (browserWSEndpoint) {
    console.log("Connecting to remote browser:", browserWSEndpoint);
    options.browserWSEndpoint = browserWSEndpoint;
  } else if (process.env.NODE_ENV === "development") {
    // Fallback for local development (WARNING: Won't work in production serverless)
    // options.executablePath = localExecutablePath;
    // console.log("Attempting to connect to local browser:", options.executablePath);
    // If no local path either, throw error
    throw new Error(
      "Puppeteer connection requires BROWSERLESS_WSS_URL env var or a local executable path for development."
    );
  } else {
    throw new Error(
      "Puppeteer connection requires BROWSERLESS_WSS_URL env var in production."
    );
  }

  try {
    const browser = await puppeteer.connect(options);
    console.log("Puppeteer connected successfully.");
    return browser;
  } catch (error) {
    console.error("Puppeteer connection failed:", error);
    throw new Error(`Failed to connect to browser: ${error}`);
  }
}
