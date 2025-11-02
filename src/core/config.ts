import dotenv from "dotenv";

// dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const getEnv = () => {
  const apiUrl = "http://wandry-analytics.test/api/v1/registry/install"; //process.env.API_URL;

  if (!apiUrl) throw new Error("Api url is not provided");

  return {
    apiUrl,
  };
};
