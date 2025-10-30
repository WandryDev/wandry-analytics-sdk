import dotenv from "dotenv";

// dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const getEnv = () => {
  const apiUrl = "http://localhost:3000"; //process.env.API_URL;
  const endpoint = "/events";

  if (!apiUrl) throw new Error("Api url is not provided");

  return {
    apiUrl,
    endpoint,
  };
};
