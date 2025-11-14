import { describe, expect } from "vitest";

/**
 * Parse XML string into a simple object structure
 * Note: This is a simplified parser for testing purposes
 */
export const parseXml = (xmlString: string): Document | null => {
  if (typeof DOMParser === "undefined") {
    // For Node.js environment
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  // Check for parsing errors
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`);
  }

  return doc;
};

/**
 * Validate RSS feed structure
 */
export const validateRssFeed = (xmlString: string): boolean => {
  try {
    // Basic validation without DOM parser (for Node.js)
    const hasXmlDeclaration = xmlString.includes(
      '<?xml version="1.0" encoding="UTF-8"'
    );
    const hasRssTag = xmlString.includes('<rss version="2.0"');
    const hasChannel = xmlString.includes("<channel>");
    const hasTitle = xmlString.includes("<title>");
    const hasLink = xmlString.includes("<link>");
    const hasDescription = xmlString.includes("<description>");

    return (
      hasXmlDeclaration &&
      hasRssTag &&
      hasChannel &&
      hasTitle &&
      hasLink &&
      hasDescription
    );
  } catch (error) {
    return false;
  }
};

/**
 * Extract text content from XML tag
 */
export const extractTagContent = (
  xmlString: string,
  tagName: string
): string[] => {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`, "g");
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(xmlString)) !== null) {
    matches.push(match[1]);
  }

  return matches;
};

/**
 * Count occurrences of a tag in XML
 */
export const countTags = (xmlString: string, tagName: string): number => {
  const regex = new RegExp(`<${tagName}>`, "g");
  const matches = xmlString.match(regex);
  return matches ? matches.length : 0;
};

/**
 * Check if XML contains specific attribute
 */
export const hasAttribute = (
  xmlString: string,
  tagName: string,
  attrName: string,
  attrValue?: string
): boolean => {
  if (attrValue) {
    const regex = new RegExp(
      `<${tagName}[^>]*${attrName}="${attrValue}"[^>]*>`
    );
    return regex.test(xmlString);
  } else {
    const regex = new RegExp(`<${tagName}[^>]*${attrName}=`);
    return regex.test(xmlString);
  }
};

/**
 * Validate RSS item structure
 */
export const validateRssItem = (
  xmlString: string,
  itemIndex: number = 0
): boolean => {
  const items = extractTagContent(xmlString, "item");

  if (items.length === 0 || !items[itemIndex]) {
    return false;
  }

  const item = items[itemIndex];
  const hasTitle = item.includes("<title>");
  const hasLink = item.includes("<link>");
  const hasGuid = item.includes("<guid>");
  const hasDescription = item.includes("<description>");
  const hasPubDate = item.includes("<pubDate>");

  return hasTitle && hasLink && hasGuid && hasDescription && hasPubDate;
};

/**
 * Extract all items from RSS feed
 */
export const extractRssItems = (
  xmlString: string
): Array<{
  title: string;
  link: string;
  guid: string;
  description: string;
  pubDate: string;
}> => {
  const items = extractTagContent(xmlString, "item");

  return items.map((item) => ({
    title: extractTagContent(item, "title")[0] || "",
    link: extractTagContent(item, "link")[0] || "",
    guid: extractTagContent(item, "guid")[0] || "",
    description: extractTagContent(item, "description")[0] || "",
    pubDate: extractTagContent(item, "pubDate")[0] || "",
  }));
};

/**
 * Validate pubDate format (RFC 822)
 */
export const validatePubDateFormat = (pubDate: string): boolean => {
  try {
    const date = new Date(pubDate);
    return !isNaN(date.getTime()) && pubDate.includes("GMT");
  } catch {
    return false;
  }
};

/**
 * Check if XML is well-formed (basic check)
 */
export const isWellFormedXml = (xmlString: string): boolean => {
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-zA-Z0-9:-]+)[^>]*>/g;
  let match;

  while ((match = tagRegex.exec(xmlString)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];

    // Skip self-closing tags and XML declaration
    if (fullTag.startsWith("<?") || fullTag.endsWith("/>")) {
      continue;
    }

    // Opening tag
    if (!fullTag.startsWith("</")) {
      openTags.push(tagName);
    }
    // Closing tag
    else {
      const lastOpen = openTags.pop();
      if (lastOpen !== tagName) {
        return false; // Mismatched tags
      }
    }
  }

  // All tags should be closed
  return openTags.length === 0;
};

/**
 * Test helper to assert RSS structure
 */
export const assertRssStructure = (xmlString: string) => {
  expect(validateRssFeed(xmlString)).toBe(true);
  expect(isWellFormedXml(xmlString)).toBe(true);
  expect(countTags(xmlString, "channel")).toBe(1);
  expect(hasAttribute(xmlString, "rss", "version", "2.0")).toBe(true);
};
