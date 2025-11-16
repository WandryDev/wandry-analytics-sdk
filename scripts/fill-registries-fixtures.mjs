#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const fillRegistriesFixtures = async () => {
  // Read the registries file
  const registriesFilePath = join(
    __dirname,
    "../src/__tests__/fixtures/real-registries.ts"
  );
  const registriesFileContent = readFileSync(registriesFilePath, "utf-8");

  // Extract the array from the TypeScript file
  // Find the content between export default [ and ];
  const arrayMatch = registriesFileContent.match(
    /export default\s+(\[[\s\S]*\]);?/
  );
  if (!arrayMatch) {
    throw new Error("Could not find registries array in file");
  }

  // Evaluate the array to get the JavaScript object
  const registriesArrayString = arrayMatch[1];
  const registries = eval(`(${registriesArrayString})`);

  console.log(`Found ${registries.length} registries to process...`);

  const successfulRegistries = [];
  const failedRegistries = [];

  // Process each registry
  for (let i = 0; i < registries.length; i++) {
    const registry = registries[i];
    const registryUrl = `${registry.homepage.replace(
      /\/$/,
      ""
    )}/r/registry.json`;

    console.log(
      `[${i + 1}/${registries.length}] Fetching ${
        registry.name
      } from ${registryUrl}...`
    );

    try {
      const response = await fetch(registryUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RegistryFetcher/1.0)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const registryData = await response.json();

      // Add the registry data to successful registries
      successfulRegistries.push({
        name: registry.name,
        homepage: registry.homepage,
        url: registry.url,
        description: registry.description,
        data: registryData,
      });

      console.log(`✓ Successfully fetched ${registry.name}`);
    } catch (error) {
      console.log(`✗ Failed to fetch ${registry.name}: ${error.message}`);
      failedRegistries.push({
        name: registry.name,
        error: error.message,
      });
    }

    // Add a small delay to avoid overwhelming servers
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Write successful registries to a JSON file
  const outputPath = join(
    __dirname,
    "../src/__tests__/fixtures/registries-fixtures.json"
  );
  writeFileSync(
    outputPath,
    JSON.stringify(successfulRegistries, null, 2),
    "utf-8"
  );

  console.log(`\n=== Summary ===`);
  console.log(`✓ Successfully fetched: ${successfulRegistries.length}`);
  console.log(`✗ Failed: ${failedRegistries.length}`);
  console.log(`\nResults saved to: ${outputPath}`);

  if (failedRegistries.length > 0) {
    console.log(`\nFailed registries:`);
    failedRegistries.forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
};

// Run the function if this script is executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  fillRegistriesFixtures().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}
