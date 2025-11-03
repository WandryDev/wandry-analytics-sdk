import dotenv from "dotenv";

// dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const getEnv = () => {
  const apiUrl = "http://analytics.wandry.com.ua/api/v1/registry/install"; //process.env.API_URL;

  if (!apiUrl) throw new Error("Api url is not provided");

  return {
    apiUrl,
  };
};
