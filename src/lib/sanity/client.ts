// lib/sanityClient.ts
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiToken = process.env.SANITY_API_TOKEN; // Use the server-side token for writes

if (!projectId || !dataset || !apiToken) {
  console.warn("Sanity client configuration missing in environment variables.");
}

export const sanityClient = createClient({
  projectId: projectId || "dummy_id", // Provide fallback or throw error
  dataset: dataset || "production",
  apiVersion: "2024-04-07", // Use current date or desired API version
  token: apiToken, // Token with write permissions needed for asset uploads
  useCdn: false, // `false` ensures fresh data & necessary for writes
});

// Function to upload a file buffer
export const uploadSanityAsset = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
) => {
  if (!projectId || !dataset || !apiToken) {
    throw new Error("Sanity client is not configured for uploads.");
  }
  try {
    const asset = await sanityClient.assets.upload("file", fileBuffer, {
      filename: fileName,
      contentType: contentType, // e.g., 'application/pdf'
    });
    return asset.url; // Returns the URL of the uploaded asset
  } catch (error) {
    console.error("Sanity upload failed:", error);
    throw new Error("Failed to upload asset to Sanity.");
  }
};
