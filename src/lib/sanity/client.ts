'use server'
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiToken = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !apiToken) {
  console.warn("Sanity client configuration missing in environment variables.");
}

export const client = createClient({
  projectId: projectId || "dummy_id",
  dataset: dataset || "production",
  apiVersion: "1", // Use current date or desired API version
  token: apiToken, // Token with write permissions needed for asset uploads
  useCdn: false, // `false` ensures fresh data & necessary for writes
});

// Function to upload a file buffer