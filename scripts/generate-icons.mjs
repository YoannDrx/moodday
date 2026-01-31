#!/usr/bin/env node
/**
 * Script to generate PNG icons from the SVG logo
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const svgPath = join(rootDir, "public/logo.svg");
const iconsDir = join(rootDir, "public/icons");

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-16x16.png", size: 16 },
];

console.log("🎨 Generating PNG icons from logo.svg...\n");

for (const { name, size } of sizes) {
  const outputPath = join(iconsDir, name);

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`✅ Generated ${name} (${size}x${size})`);
}

// Also generate a general icon.png in /public/images for backwards compatibility
const imagesDir = join(rootDir, "public/images");
if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir, { recursive: true });
}

await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(join(imagesDir, "icon.png"));

console.log(`✅ Generated images/icon.png (512x512)`);

console.log("\n🎉 All icons generated successfully!");
