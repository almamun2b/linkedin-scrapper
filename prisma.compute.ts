import { defineComputeConfig } from "@prisma/compute-sdk/config";

export default defineComputeConfig({
  app: {
    name: "linkedin-scrapper",
    framework: "nextjs",
    env: ".env",
  },
});
