"use server";
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiToken = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !apiToken) {
  console.warn("Sanity client configuration missing in environment variables.");
}

const client = createClient({
  projectId: projectId || "dummy_id",
  dataset: dataset || "production",
  apiVersion: "1", // Use current date or desired API version
  token: apiToken, // Token with write permissions needed for asset uploads
  useCdn: false, // `false` ensures fresh data & necessary for writes
});

export const uploadSanityAsset = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
) => {
  if (!projectId || !dataset || !apiToken) {
    throw new Error("Sanity client is not configured for uploads.");
  }
  try {
    const asset = await client.assets.upload("file", fileBuffer, {
      filename: fileName,
      contentType: contentType, // e.g., 'application/pdf'
    });
    console.log("Asset uploaded:", asset.url);
    return asset.url; // Returns the URL of the uploaded asset
  } catch (error) {
    console.error("Sanity upload failed:", error);
    throw new Error("Failed to upload asset to Sanity.");
  }
};
