export type PubDateStatagyFn = (item: any) => Date | Promise<Date>;

export type PubDateStatagy =
  | "githubLastEdit"
  | "fileMtime"
  | "dateNow"
  | PubDateStatagyFn;

export type RssOptions = {
  title?: string;
  link?: string;
  description?: string;
  endpoint?: string;
  pubDateStatagy?: PubDateStatagy;
};

export type GenerateRssOptions = {
  /**
   * RSS feed configuration
   *
   * */
  rss?: RssOptions;
  baseUrl?: string;
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
