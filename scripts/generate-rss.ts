#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import { generateRegistryRssFeed } from "../src/rss/index";
import type { GenerateRssOptions } from "../src/rss/types";

// Get __dirname equivalent for ES modules
const __dirname = process.cwd();

interface RegistryConfig {
  name: string;
  homepage: string;
  url: string;
  description?: string;
}

async function loadRegistries(): Promise<RegistryConfig[]> {
  const registriesFilePath = join(
    __dirname,
    "src/__tests__/fixtures/real-registries.ts"
  );
  const registriesFileContent = readFileSync(registriesFilePath, "utf-8");

  // Extract the array from the TypeScript file
  const arrayMatch = registriesFileContent.match(
    /export default\s+(\[[\s\S]*\]);?/
  );
  if (!arrayMatch) {
    throw new Error("Could not find registries array in file");
  }

  // Evaluate the array to get the JavaScript object
  const registriesArrayString = arrayMatch[1];
  const registries = eval(`(${registriesArrayString})`) as RegistryConfig[];

  return registries;
}

function findRegistry(
  registries: RegistryConfig[],
  registryName: string
): RegistryConfig | null {
  // Try exact match first
  let registry = registries.find((r) => r.name === registryName);

  // Try case-insensitive match
  if (!registry) {
    registry = registries.find(
      (r) => r.name.toLowerCase() === registryName.toLowerCase()
    );
  }

  // Try match with @ prefix if not already present
  if (!registry && !registryName.startsWith("@")) {
    registry = registries.find((r) => r.name === `@${registryName}`);
  }

  return registry || null;
}

function loadConfigFromFile(configPath: string): Partial<GenerateRssOptions> {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const configContent = readFileSync(configPath, "utf-8");
  try {
    return JSON.parse(configContent);
  } catch (error) {
    throw new Error(
      `Failed to parse config file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function generateRssForRegistry(
  registryName: string,
  outputPath: string | undefined,
  customOptions: Partial<GenerateRssOptions>
) {
  try {
    console.log(`Loading registries configuration...`);
    const registries = await loadRegistries();

    console.log(`Looking for registry: ${registryName}`);
    const registry = findRegistry(registries, registryName);

    if (!registry) {
      console.error(`\n❌ Registry "${registryName}" not found.`);
      console.log(`\nAvailable registries:`);
      registries.slice(0, 10).forEach((r) => {
        console.log(`  - ${r.name}`);
      });
      if (registries.length > 10) {
        console.log(`  ... and ${registries.length - 10} more`);
      }
      process.exit(1);
    }

    console.log(`✓ Found registry: ${registry.name}`);
    console.log(`  Homepage: ${registry.homepage}`);
    console.log(`  Description: ${registry.description || "N/A"}`);

    // Build default options from registry
    const defaultOptions: GenerateRssOptions = {
      baseUrl: registry.homepage,
      componentsUrl: "components",
      blocksUrl: "blocks",
      libsUrl: "libs",
      hooksUrl: "hooks",
      filesUrl: "files",
      stylesUrl: "styles",
      themesUrl: "themes",
      itemsUrl: "items",
      rss: {
        title: `${registry.name} Registry`,
        description:
          registry.description ||
          `RSS feed for ${registry.name} shadcn registry`,
        link: registry.homepage,
        endpoint: "/rss.xml",
        pubDateStrategy: "dateNow",
      },
      registry: {
        path: "r/registry.json",
      },
    };

    // Merge with custom options (custom takes precedence)
    const options: GenerateRssOptions = {
      ...defaultOptions,
      ...customOptions,
      rss: {
        ...defaultOptions.rss,
        ...customOptions?.rss,
      },
      registry: {
        ...defaultOptions.registry,
        ...customOptions?.registry,
      },
    };

    console.log(`\nGenerating RSS feed...`);

    const rssXml = await generateRegistryRssFeed(options);

    if (!rssXml) {
      console.error(`\n❌ Failed to generate RSS feed.`);
      console.error(`   The registry might be empty or inaccessible.`);
      process.exit(1);
    }

    if (outputPath) {
      writeFileSync(outputPath, rssXml, "utf-8");
      console.log(`\n✓ RSS feed generated successfully!`);
      console.log(`  Saved to: ${outputPath}`);
    } else {
      console.log(`\n✓ RSS feed generated successfully!\n`);
      console.log(rssXml);
    }
  } catch (error) {
    console.error(
      `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Setup Commander
const program = new Command();

program
  .name("generate-rss")
  .description("Generate RSS feed for a shadcn registry")
  .argument("<registry-name>", "Registry name (e.g., @aceternity)")
  .argument(
    "[output-file]",
    "Output file path (optional, prints to stdout if not provided)"
  )
  .option("-c, --config <file>", "Path to JSON config file")
  .option("--baseUrl <url>", "Override base URL")
  .option("--componentsUrl <path>", "Override components URL path")
  .option("--blocksUrl <path>", "Override blocks URL path")
  .option("--libsUrl <path>", "Override libs URL path")
  .option("--hooksUrl <path>", "Override hooks URL path")
  .option("--filesUrl <path>", "Override files URL path")
  .option("--stylesUrl <path>", "Override styles URL path")
  .option("--themesUrl <path>", "Override themes URL path")
  .option("--itemsUrl <path>", "Override items URL path")
  .option(
    "--registry.path <path>",
    "Override registry path (default: r/registry.json)"
  )
  .option("--rss.title <title>", "Override RSS title")
  .option("--rss.description <desc>", "Override RSS description")
  .option("--rss.link <url>", "Override RSS link")
  .option("--rss.endpoint <path>", "Override RSS endpoint (default: /rss.xml)")
  .option(
    "--rss.pubDateStrategy <strategy>",
    "Override pubDate strategy (dateNow|fileMtime|githubLastEdit)"
  )
  .addHelpText(
    "after",
    `
Examples:
  npm run generate-rss @aceternity
  npm run generate-rss @aceternity ./rss.xml
  npm run generate-rss @aceternity --baseUrl https://custom.com
  npm run generate-rss @aceternity --rss.title "Custom Title"
  npm run generate-rss @aceternity --config ./config.json
  `
  )
  .parse(process.argv);

const options = program.opts();
const [registryName, outputPath] = program.args;

// Build custom options from CLI arguments
const customOptions: Partial<GenerateRssOptions> = {};

// Load config from file if provided
if (options.config) {
  console.log(`Loading config from: ${options.config}`);
  const fileConfig = loadConfigFromFile(options.config);
  Object.assign(customOptions, fileConfig);
}

// Apply CLI options (they take precedence over config file)
if (options.baseUrl) customOptions.baseUrl = options.baseUrl;
if (options.componentsUrl) customOptions.componentsUrl = options.componentsUrl;
if (options.blocksUrl) customOptions.blocksUrl = options.blocksUrl;
if (options.libsUrl) customOptions.libsUrl = options.libsUrl;
if (options.hooksUrl) customOptions.hooksUrl = options.hooksUrl;
if (options.filesUrl) customOptions.filesUrl = options.filesUrl;
if (options.stylesUrl) customOptions.stylesUrl = options.stylesUrl;
if (options.themesUrl) customOptions.themesUrl = options.themesUrl;
if (options.itemsUrl) customOptions.itemsUrl = options.itemsUrl;

// Handle dotted options - commander parses them as properties with dots in name
const allOptions = program.opts();
for (const [key, value] of Object.entries(allOptions)) {
  if (key.startsWith("rss.") && value) {
    if (!customOptions.rss) customOptions.rss = {};
    const rssKey = key.replace("rss.", "") as keyof typeof customOptions.rss;
    (customOptions.rss as any)[rssKey] = value;
  } else if (key === "registry.path" && value) {
    customOptions.registry = { path: value as string };
  }
}

generateRssForRegistry(registryName, outputPath, customOptions);
