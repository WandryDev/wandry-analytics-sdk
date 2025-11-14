import fs from "fs/promises";

import {
  GenerateRssOptions,
  GetGithubLastCommitOptions,
  PubDateStatagy,
  PubDateStatagyFn,
} from "./types";
import path from "path";

const isDateNowStrategy = (strategy: PubDateStatagy): strategy is "dateNow" => {
  return strategy === "dateNow";
};

const isGithubLastEditStrategy = (
  strategy: PubDateStatagy
): strategy is "githubLastEdit" => {
  return strategy === "githubLastEdit";
};

const isFileMtimeStrategy = (
  strategy: PubDateStatagy
): strategy is "fileMtime" => {
  return strategy === "fileMtime";
};

const isFunctionStrategy = (
  strategy: PubDateStatagy
): strategy is PubDateStatagyFn => {
  return typeof strategy === "function";
};

async function getGithubLastEdit({
  repo,
  token,
  owner,
  path = "",
  sha,
  baseUrl = "https://api.github.com",
  options = {},
  params: customParams = {},
}: GetGithubLastCommitOptions): Promise<Date | null> {
  const headers = new Headers(options.headers);
  const params = new URLSearchParams();

  params.set("path", path);
  params.set("page", "1");
  params.set("per_page", "1");

  if (sha) params.set("sha", sha);

  for (const [key, value] of Object.entries(customParams)) {
    params.set(key, value);
  }

  if (token) {
    headers.append("authorization", token);
  }

  const res = await fetch(
    `${baseUrl}/repos/${owner}/${repo}/commits?${params.toString()}`,
    {
      cache: "force-cache",
      ...options,
      headers,
    }
  );

  if (!res.ok)
    throw new Error(
      `Failed to fetch last edit time from Git ${await res.text()}`
    );
  const data = await res.json();

  if (data.length === 0) return null;

  return new Date(data[0].commit.committer.date);
}

const getFileMtime = async (component: any) => {
  const stat = await fs.stat(
    path.resolve(process.cwd(), component.files[0].path)
  );
  return stat.mtime;
};

const getDateNow = async () => {
  return new Date();
};

export const getPubDate = async (
  component: any,
  options: GenerateRssOptions
) => {
  if (!options.rss?.pubDateStatagy) return getDateNow();

  if (isGithubLastEditStrategy(options.rss.pubDateStatagy) && options.github) {
    try {
      return (
        (await getGithubLastEdit({
          ...options.github,
          path: component.files[0].path,
        })) ?? "Invalid Date"
      );
    } catch (error) {
      return (await getDateNow()).toUTCString();
    }
  }

  if (isDateNowStrategy(options.rss.pubDateStatagy)) {
    return (await getDateNow()).toUTCString();
  }

  if (isFileMtimeStrategy(options.rss.pubDateStatagy)) {
    return (await getFileMtime(component)).toUTCString();
  }

  if (isFunctionStrategy(options.rss.pubDateStatagy)) {
    return (await options.rss.pubDateStatagy(component)).toUTCString();
  }

  return "Invalid Date";
};
