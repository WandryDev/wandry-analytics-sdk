export const getEnv = () => {
  // const apiUrl = "/api/v1/registry/install"; //process.env.API_URL;
  const apiUrl = "https://analytics.wandry.com.ua/api/v1/registry/install"; //process.env.API_URL;

  if (!apiUrl) throw new Error("Api url is not provided");

  const sdkHeader = "X-Wandry-Analytics-SDK";
  const registryPegexp = /^\/r(?:\/[A-Za-z0-9_.-]+)*\/?$/;

  return {
    apiUrl,
    sdkHeader,
    registryPegexp,
  };
};
