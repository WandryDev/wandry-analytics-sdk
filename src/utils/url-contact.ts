/**
 * Joins URL parts properly, avoiding duplicate slashes
 * Uses URL constructor for proper normalization
 * Handles query parameters and hash fragments
 * If a part is an absolute URL, it overrides previous parts (becomes the new base)
 */
export function concatUrlParts(...parts: (string | undefined)[]): string {
  const validParts = parts.filter((part): part is string => Boolean(part));
  if (validParts.length === 0) return "";

  // 1. Find start index (last absolute URL wins)
  let startIndex = 0;
  for (let i = validParts.length - 1; i >= 0; i--) {
    if (/^https?:\/\//i.test(validParts[i])) {
      startIndex = i;
      break;
    }
  }

  const activeParts = validParts.slice(startIndex);

  // Helper to parse part into path, query, hash
  const parsePart = (part: string) => {
    const match = part.match(/^([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/);
    return {
      path: match?.[1] || "",
      query: match?.[2] || "",
      hash: match?.[3] || "",
    };
  };

  let finalPath = "";
  const finalSearchParams = new URLSearchParams();
  let finalHash = "";

  // Initialize with first part
  if (activeParts.length > 0) {
    const baseParsed = parsePart(activeParts[0]);
    finalPath = baseParsed.path;
    if (baseParsed.query) {
      new URLSearchParams(baseParsed.query).forEach((v, k) =>
        finalSearchParams.append(k, v)
      );
    }
    finalHash = baseParsed.hash;
  }

  // Process rest
  for (let i = 1; i < activeParts.length; i++) {
    const parsed = parsePart(activeParts[i]);

    // Join paths
    // remove trailing slash from finalPath
    finalPath = finalPath.replace(/\/+$/, "");
    // remove leading slash from current path
    const currentPath = parsed.path.replace(/^\/+/, "");

    if (finalPath && currentPath) {
      finalPath += "/" + currentPath;
    } else if (currentPath) {
      finalPath += currentPath;
    }

    // Merge params
    if (parsed.query) {
      new URLSearchParams(parsed.query).forEach((v, k) =>
        finalSearchParams.append(k, v)
      );
    }

    // Override hash if present in current part
    if (parsed.hash) {
      finalHash = parsed.hash;
    }
  }

  // Reconstruct URL
  let result = finalPath;
  const searchString = finalSearchParams.toString();
  if (searchString) {
    result += "?" + searchString;
  }
  if (finalHash) {
    result += "#" + finalHash;
  }

  return result;
}
