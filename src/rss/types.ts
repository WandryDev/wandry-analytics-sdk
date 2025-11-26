export type RegistryItemType =
  | "block"
  | "component"
  | "lib"
  | "hook"
  | "file"
  | "style"
  | "theme"
  | "item"
  | "unknown";
export type PubDateStrategyFn = (item: RegistryItem) => Date | Promise<Date>;

export type PubDateStrategy =
  | "githubLastEdit"
  | "fileMtime"
  | "dateNow"
  | PubDateStrategyFn;

export interface RegistryItem {
  name: string;
  title: string;
  description: string;
  files: Array<{
    path: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface Registry {
  name?: string;
  items: RegistryItem[];
  [key: string]: any;
}

export type RssOptions = {
  title?: string;
  link?: string;
  description?: string;
  endpoint?: string;
  pubDateStrategy?: PubDateStrategy;
};

/**
 * Function that resolves a URL from just the item name.
 * @example
 * const resolver: UrlResolverByName = (name) => `components/${name}`;
 */
export type UrlResolverByName = (itemName: string) => string;

/**
 * Function that resolves a URL from the full registry item.
 * Useful when you need access to item properties like title, description, files, etc.
 * @example
 * const resolver: UrlResolverByItem = (item) => `${item.type}/${item.name}`;
 */
export type UrlResolverByItem = (item: RegistryItem) => string;

/**
 * URL resolver that can be:
 * - A static string path
 * - A function that receives the item name and returns a URL
 * - A function that receives the full RegistryItem and returns a URL
 */
export type UrlResolver = string | UrlResolverByName | UrlResolverByItem;

export type GenerateRssOptions = {
  /**
   * RSS feed configuration
   *
   * */
  rss?: RssOptions;
  baseUrl?: string;
  componentsUrl?: UrlResolver;
  blocksUrl?: UrlResolver;
  libsUrl?: UrlResolver;
  hooksUrl?: UrlResolver;
  filesUrl?: UrlResolver;
  stylesUrl?: UrlResolver;
  themesUrl?: UrlResolver;
  itemsUrl?: UrlResolver;
  excludeItemTypes?: string[];
  registry?: {
    path?: string;
  };
  /**
   * Github API configuration
   *
   * */
  github?: GetGithubLastCommitOptions;
};

export interface GetGithubLastCommitOptions {
  /**
   * Repository name, like "fumadocs"
   */
  repo: string;

  /** Owner of repository */
  owner: string;

  /**
   * Path to file
   */
  path?: string;

  /**
   * GitHub access token
   */
  token?: string;

  /**
   * SHA or ref (branch or tag) name.
   */
  sha?: string;

  /**
   * Base URL for GitHub API
   * @default "https://api.github.com"
   * @link https://docs.github.com/en/get-started/using-github-docs/about-versions-of-github-docs#determining-which-github-product-you-use
   */
  baseUrl?: string;

  /**
   * Custom query parameters
   */
  params?: Record<string, string>;

  options?: RequestInit;
}
