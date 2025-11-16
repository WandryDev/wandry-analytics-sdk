import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { RegistryItem, GenerateRssOptions } from "../rss/types";
import { determinateRegistyItemType, getRegistryItemPath } from "../rss/urls";
import { generateRegistryRssFeed } from "../rss/index";
import { extractRssItems, validateRssFeed } from "./helpers/xml.helper";

// Mock the core/http module
vi.mock("../core/http", () => ({
  readRegistry: vi.fn(),
}));

// Import after mocking
import { readRegistry } from "../core/http";

// Load real registries fixtures using relative path from test file
// Using process.cwd() as base since tests run from project root
const fixturesPath = join(
  process.cwd(),
  "src/__tests__/fixtures/registries-fixtures.json"
);
const registriesFixtures = JSON.parse(
  readFileSync(fixturesPath, "utf-8")
) as Array<{
  name: string;
  homepage: string;
  url: string;
  description: string;
  data: {
    items: RegistryItem[];
    [key: string]: any;
  };
}>;

describe("RSS Integration Tests with Real Registries", () => {
  const incorrectTypeItemsReport: Array<{
    registry: string;
    itemName: string;
    itemIndex: number;
    itemType: string | undefined;
    determinedType: string;
    expectedType: string;
    reason: string;
    filePaths: string[];
    fileTypes: string[];
  }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    // Write report to file after all tests complete
    const reportPath = join(
      process.cwd(),
      "src/__tests__/fixtures/incorrect-type-items-report.txt"
    );

    if (incorrectTypeItemsReport.length > 0) {
      let reportContent = `=== Report: Incorrect Type Determinations ===\n\n`;
      reportContent += `Total items with incorrect type: ${incorrectTypeItemsReport.length}\n\n`;

      // Group by registry
      const byRegistry = incorrectTypeItemsReport.reduce((acc, item) => {
        if (!acc[item.registry]) {
          acc[item.registry] = [];
        }
        acc[item.registry].push(item);
        return acc;
      }, {} as Record<string, typeof incorrectTypeItemsReport>);

      Object.keys(byRegistry).forEach((registry) => {
        const items = byRegistry[registry];
        reportContent += `\n⚠️  Registry "${registry}": ${items.length} item(s) with incorrect type determination\n`;
        reportContent += "─".repeat(80) + "\n";
        items.forEach((incorrect) => {
          reportContent += `  ❌ Item: "${incorrect.itemName}"\n`;
          reportContent += `     Expected: ${incorrect.expectedType}, Got: ${incorrect.determinedType}\n`;
          reportContent += `     Reason: ${incorrect.reason}\n`;
          reportContent += `     Item type: ${
            incorrect.itemType || "(not set)"
          }\n`;
          reportContent += `     File paths: ${incorrect.filePaths.join(
            ", "
          )}\n`;
          if (incorrect.fileTypes.length > 0) {
            reportContent += `     File types: ${incorrect.fileTypes.join(
              ", "
            )}\n`;
          }
          reportContent += "\n";
        });
      });

      writeFileSync(reportPath, reportContent, "utf-8");
      console.log(
        `\n📄 Report written to: ${reportPath} (${incorrectTypeItemsReport.length} items)`
      );
    } else {
      // If no incorrect items, write success message
      const reportContent = `=== Report: Incorrect Type Determinations ===\n\n✅ All items have correct type determination!\n\nTotal items checked: All registries processed successfully.\n`;
      writeFileSync(reportPath, reportContent, "utf-8");
    }
  });

  describe("Type determination for all registry items", () => {
    // Test type determination for all items in all registries
    registriesFixtures.forEach((registryFixture) => {
      describe(`Registry: ${registryFixture.name}`, () => {
        it(`should correctly determine types for all items in ${registryFixture.name}`, () => {
          const { items } = registryFixture.data;

          if (!items || items.length === 0) {
            console.warn(
              `Registry ${registryFixture.name} has no items, skipping...`
            );
            return;
          }

          const incorrectTypeItems: Array<{
            itemName: string;
            itemIndex: number;
            itemType: string | undefined;
            determinedType: string;
            expectedType: string;
            reason: string;
            filePaths: string[];
            fileTypes: string[];
          }> = [];

          items.forEach((item, index) => {
            const determinedType = determinateRegistyItemType(item);

            // Verify that the type is one of the expected values
            expect(["component", "block", "unknown"]).toContain(determinedType);

            // Analyze expected type based on rules
            // IMPORTANT: Logic matches determinateRegistyItemType - /blocks/ in path has priority
            let expectedType: string | null = null;
            let reason = "";

            // Test file path patterns first (they have priority over item.type)
            const hasBlocksInPath = item.files?.some((f) =>
              f.path.includes("/blocks/")
            );
            const hasUiInPath = item.files?.some((f) =>
              f.path.includes("/ui/")
            );
            const hasComponentsInPath = item.files?.some((f) =>
              f.path.includes("/components/")
            );

            // Test file types
            const hasBlockFileType = item.files?.some(
              (f) => f.type === "registry:block" || f.type === "registry:page"
            );
            const hasComponentFileType = item.files?.some(
              (f) => f.type === "registry:component"
            );

            // Priority 1: Check for block indicators first (matches urls.ts logic)
            if (
              item.type === "registry:block" ||
              item.type === "registry:page" ||
              hasBlocksInPath ||
              hasBlockFileType
            ) {
              expectedType = "block";
              if (
                item.type === "registry:block" ||
                item.type === "registry:page"
              ) {
                reason = `item.type is "${item.type}"`;
              } else if (hasBlocksInPath) {
                reason =
                  'path contains "/blocks/" (has priority over item.type)';
              } else if (hasBlockFileType) {
                reason = "file.type is registry:block or registry:page";
              }
            }
            // Priority 2: Check for component indicators (only if not block)
            else if (
              item.type === "registry:ui" ||
              item.type === "registry:component" ||
              hasUiInPath ||
              hasComponentsInPath ||
              hasComponentFileType
            ) {
              expectedType = "component";
              if (
                item.type === "registry:ui" ||
                item.type === "registry:component"
              ) {
                reason = `item.type is "${item.type}"`;
              } else if (hasUiInPath || hasComponentsInPath) {
                reason = `path contains "${
                  hasUiInPath ? "/ui/" : "/components/"
                }"`;
              } else if (hasComponentFileType) {
                reason = "file.type is registry:component";
              }
            }

            // If expected type is set and doesn't match determined type, collect info
            if (expectedType && expectedType !== determinedType) {
              const incorrectItem = {
                itemName: item.name,
                itemIndex: index,
                itemType: item.type,
                determinedType,
                expectedType,
                reason,
                filePaths: item.files?.map((f) => f.path) || [],
                fileTypes: item.files?.map((f) => f.type).filter(Boolean) || [],
              };
              incorrectTypeItems.push(incorrectItem);
              // Add to global report for file output
              incorrectTypeItemsReport.push({
                registry: registryFixture.name,
                ...incorrectItem,
              });
            }

            // Run assertions - match the actual logic from determinateRegistyItemType
            // Priority: block indicators (item.type, /blocks/ path, file.type) > component indicators

            // If item.type is explicitly block/page, must be block
            if (
              item.type === "registry:block" ||
              item.type === "registry:page"
            ) {
              expect(determinedType).toBe("block");
            }
            // If path contains /blocks/, must be block (has priority over item.type)
            else if (hasBlocksInPath) {
              expect(determinedType).toBe("block");
            }
            // If file.type is block/page, must be block
            else if (hasBlockFileType) {
              expect(determinedType).toBe("block");
            }
            // If item.type is component/ui and no block indicators, must be component
            else if (
              item.type === "registry:ui" ||
              item.type === "registry:component"
            ) {
              expect(determinedType).toBe("component");
            }
            // If path contains /ui/ or /components/ and no block indicators, must be component
            else if (hasUiInPath || hasComponentsInPath) {
              expect(determinedType).toBe("component");
            }
            // If file.type is component and no block indicators, must be component
            else if (hasComponentFileType) {
              expect(determinedType).toBe("component");
            }
          });

          // Note: incorrect items are collected in global report and will be written to file in afterAll
        });

        it(`should generate correct URLs based on determined types for ${registryFixture.name}`, () => {
          const { items } = registryFixture.data;

          if (!items || items.length === 0) {
            return;
          }

          const config: GenerateRssOptions = {
            baseUrl: "https://example.com",
            componentsUrl: "components",
            blocksUrl: "blocks",
          };

          items.forEach((item) => {
            const determinedType = determinateRegistyItemType(item);
            const path = getRegistryItemPath(item, config);

            if (determinedType === "component") {
              expect(path).toBe("components");
            } else if (determinedType === "block") {
              expect(path).toBe("blocks");
            } else {
              expect(path).toBe("");
            }
          });
        });
      });
    });
  });

  describe("RSS feed generation for real registries", () => {
    registriesFixtures.forEach((registryFixture) => {
      describe(`Registry: ${registryFixture.name}`, () => {
        it(`should generate valid RSS feed for ${registryFixture.name}`, async () => {
          const registryData = registryFixture.data;

          if (!registryData.items || registryData.items.length === 0) {
            console.warn(
              `Registry ${registryFixture.name} has no items, skipping...`
            );
            return;
          }

          const options: GenerateRssOptions = {
            baseUrl: registryFixture.homepage,
            componentsUrl: "components",
            blocksUrl: "blocks",
            rss: {
              title: `${registryFixture.name} Registry`,
              description: registryFixture.description,
              link: registryFixture.homepage,
              endpoint: "/rss.xml",
              pubDateStrategy: "dateNow",
            },
          };

          (readRegistry as any).mockResolvedValue(registryData);

          const rssXml = await generateRegistryRssFeed(options);

          expect(rssXml).not.toBeNull();
          expect(validateRssFeed(rssXml!)).toBe(true);

          // Verify RSS contains all items
          const items = extractRssItems(rssXml!);
          expect(items.length).toBe(registryData.items.length);

          // Verify that URLs are correctly formed based on item types
          items.forEach((rssItem, index) => {
            const registryItem = registryData.items[index];
            const determinedType = determinateRegistyItemType(registryItem);
            const expectedPath =
              determinedType === "component"
                ? "components"
                : determinedType === "block"
                ? "blocks"
                : "";

            if (expectedPath) {
              expect(rssItem.link).toContain(`/${expectedPath}/`);
            }

            // Verify item data is correct
            // Handle undefined values - RSS generator converts undefined to empty string
            expect(rssItem.title).toBe(registryItem.title ?? "");
            expect(rssItem.description).toBe(registryItem.description ?? "");
          });
        });

        it(`should use correct paths (components/blocks) in RSS links for ${registryFixture.name}`, async () => {
          const registryData = registryFixture.data;

          if (!registryData.items || registryData.items.length === 0) {
            return;
          }

          const options: GenerateRssOptions = {
            baseUrl: registryFixture.homepage,
            componentsUrl: "components",
            blocksUrl: "blocks",
            rss: {
              title: `${registryFixture.name} Registry`,
              description: registryFixture.description,
              link: registryFixture.homepage,
              endpoint: "/rss.xml",
              pubDateStrategy: "dateNow",
            },
          };

          (readRegistry as any).mockResolvedValue(registryData);

          const rssXml = await generateRegistryRssFeed(options);

          expect(rssXml).not.toBeNull();

          const items = extractRssItems(rssXml!);

          // Verify each item's link uses the correct path
          items.forEach((rssItem, index) => {
            const registryItem = registryData.items[index];
            const determinedType = determinateRegistyItemType(registryItem);

            if (determinedType === "component") {
              expect(rssItem.link).toContain("/components/");
              expect(rssItem.link).not.toContain("/blocks/");
            } else if (determinedType === "block") {
              expect(rssItem.link).toContain("/blocks/");
              expect(rssItem.link).not.toContain("/components/");
            } else {
              // For unknown types, the path should be empty
              // So the link should be baseUrl/itemName without components/blocks
              expect(rssItem.link).not.toContain("/components/");
              expect(rssItem.link).not.toContain("/blocks/");
            }

            // Verify guid matches link
            expect(rssItem.guid).toBe(rssItem.link);
          });
        });
      });
    });
  });

  describe("Type determination edge cases from real data", () => {
    it("should handle items with mixed file path patterns", () => {
      registriesFixtures.forEach((registryFixture) => {
        const { items } = registryFixture.data;

        if (!items || items.length === 0) {
          return;
        }

        items.forEach((item) => {
          const type = determinateRegistyItemType(item);

          // If item has both /blocks/ and /components/ or /ui/,
          // the /blocks/ check should take precedence
          const hasBlocks = item.files?.some((f) =>
            f.path.includes("/blocks/")
          );
          const hasComponents = item.files?.some((f) =>
            f.path.includes("/components/")
          );

          if (
            hasBlocks &&
            item.type !== "registry:component" &&
            item.type !== "registry:ui"
          ) {
            expect(type).toBe("block");
          }
        });
      });
    });

    it("should handle items without explicit type", () => {
      registriesFixtures.forEach((registryFixture) => {
        const { items } = registryFixture.data;

        if (!items || items.length === 0) {
          return;
        }

        items.forEach((item) => {
          if (!item.type) {
            // Type should be determined from file paths or file types
            const type = determinateRegistyItemType(item);

            const hasBlocksInPath = item.files?.some((f) =>
              f.path.includes("/blocks/")
            );
            const hasUiInPath = item.files?.some((f) =>
              f.path.includes("/ui/")
            );
            const hasComponentsInPath = item.files?.some((f) =>
              f.path.includes("/components/")
            );

            if (hasBlocksInPath) {
              expect(type).toBe("block");
            } else if (hasUiInPath || hasComponentsInPath) {
              expect(type).toBe("component");
            }
          }
        });
      });
    });

    it("should correctly identify block vs component based on item type field", () => {
      registriesFixtures.forEach((registryFixture) => {
        const { items } = registryFixture.data;

        if (!items || items.length === 0) {
          return;
        }

        items.forEach((item) => {
          const determinedType = determinateRegistyItemType(item);

          // Check block indicators first (they have priority)
          const hasBlocksInPath = item.files?.some((f) =>
            f.path.includes("/blocks/")
          );
          const hasBlockFileType = item.files?.some(
            (f) => f.type === "registry:block" || f.type === "registry:page"
          );

          // If item.type is explicitly block/page, must be block
          if (item.type === "registry:block" || item.type === "registry:page") {
            expect(determinedType).toBe("block");
          }
          // If path contains /blocks/ or file.type is block, must be block (has priority over item.type)
          else if (hasBlocksInPath || hasBlockFileType) {
            expect(determinedType).toBe("block");
          }
          // Only if no block indicators, then check component indicators
          else if (
            item.type === "registry:component" ||
            item.type === "registry:ui"
          ) {
            expect(determinedType).toBe("component");
          }
        });
      });
    });
  });
});
