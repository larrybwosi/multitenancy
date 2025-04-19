// actions/organization.ts
"use server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";


import { revalidatePath } from "next/cache";
import slugify from "slugify";
import prisma from "@/lib/db";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "./validation";
import { Organization } from "@prisma/client";
import { ZodError } from "zod";
import { getServerAuthContext } from "@/actions/auth";

// --- Helper Functions ---

// Placeholder for file upload logic. Replace with your actual storage solution (S3, Cloudinary, etc.)
async function uploadLogo(file: File): Promise<string | null> {
  console.log(`Simulating upload for: ${file.name}, size: ${file.size}`);
  // In a real app:
  // 1. Upload file to cloud storage (S3, Cloudinary, GCS, etc.)
  // 2. Get the public URL
  // 3. Return the URL
  // Example: return `https://your-cdn.com/logos/${Date.now()}-${file.name}`;

  // For demo purposes, we'll just return a placeholder path (NOT suitable for production)
  // You might save locally in development, but this won't work well in serverless environments.
  // const filePath = `/uploads/logos/${Date.now()}-${slugify(file.name, { lower: true })}`;
  // await fs.promises.writeFile(`public${filePath}`, Buffer.from(await file.arrayBuffer()));
  // return filePath;

  // Returning a placeholder URL
  return `/images/placeholder-logo.png`; // Or return null if upload fails
}

async function generateUniqueSlug(name: string, attempt = 0): Promise<string> {
  let potentialSlug = slugify(name, { lower: true, strict: true });
  if (attempt > 0) {
    potentialSlug = `${potentialSlug}-${attempt}`;
  }

  const existing = await prisma.organization.findUnique({
    where: { slug: potentialSlug },
    select: { id: true },
  });

  if (existing) {
    return generateUniqueSlug(name, attempt + 1);
  }
  return potentialSlug;
}

// --- Action Types ---

type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>; // Field-specific errors
  organizationId?: string;
};

// --- Server Actions ---

export async function createOrganization(
  formData: FormData
): Promise<ActionResponse> {
  
  const { userId, organizationId } = await getServerAuthContext();

  const rawData = Object.fromEntries(formData.entries());
  const logoFile =
    formData.get("logo") instanceof File
      ? (formData.get("logo") as File)
      : null;

  try {
    // Validate base data (excluding file initially)
    const validatedData = createOrganizationSchema
      .omit({ logo: true })
      .parse(rawData);

    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      // Validate logo separately if needed (size, type) before uploading
      // const logoValidation = organizationSchema.shape.logo.safeParse(logoFile);
      // if (!logoValidation.success) {
      //     return { success: false, message: 'Invalid logo file.', errors: { logo: logoValidation.error.flatten().formErrors } };
      // }
      logoUrl = await uploadLogo(logoFile);
      if (!logoUrl) {
        return { success: false, message: "Logo upload failed." };
      }
    } else {
      // Handle case where logo is required but not provided (if schema enforces it)
      // return { success: false, message: 'Logo is required.', errors: { logo: ['Logo is required.'] } };
    }

    // Generate slug if not provided or ensure uniqueness
    let slug = validatedData.slug;
    if (!slug) {
      slug = await generateUniqueSlug(validatedData.name);
    } else {
      slug = slugify(slug, { lower: true, strict: true }); // Ensure format
      const existing = await prisma.organization.findUnique({
        where: { slug },
      });
      if (existing) {
        return {
          success: false,
          message: "Slug is already taken.",
          errors: { slug: ["This slug is already in use."] },
        };
      }
    }

    // Create Organization and initial Member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: validatedData.name,
          slug: slug,
          logo: logoUrl,
        },
      });

      // Add the creator as the initial member (e.g., Admin)
      await tx.member.create({
        data: {
          userId,
          organizationId: newOrg.id,
          role: "OWNER",
          createdAt: new Date(),
        },
      });

      // Update the user's active organization (optional)
      await tx.user.update({
        where: { id: userId },
        data: { activeOrganizationId: newOrg.id },
      });

      return newOrg;
    });

    revalidatePath("/organizations"); // Revalidate list page
    revalidatePath(`/dashboard/${result.slug}`); // Revalidate potential dashboard page

    return {
      success: true,
      message: "Organization created successfully!",
      organizationId: result.id,
    };
  } catch (error: unknown) {
    console.error("Error creating organization:", error);
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Validation failed.",
        errors: error.flatten().fieldErrors,
      };
    }
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed on the fields: (`slug`)")
    ) {
      return {
        success: false,
        message: "Slug is already taken.",
        errors: { slug: ["This slug is already in use."] },
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
  // No redirect here, let the client handle redirection or UI update based on response
}

export async function updateOrganization(
  organizationId: string,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Authentication required." };
  }

  // Authorization check
  const isAdmin = await isOrgAdmin(user.id, organizationId);
  if (!isAdmin) {
    return {
      success: false,
      message: "You do not have permission to update this organization.",
    };
  }

  const rawData = Object.fromEntries(formData.entries());
  const logoFile =
    formData.get("logo") instanceof File
      ? (formData.get("logo") as File)
      : null;

  try {
    // Find existing organization first
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true, logo: true, name: true }, // Select fields needed for checks/updates
    });

    if (!existingOrg) {
      return { success: false, message: "Organization not found." };
    }

    // Validate subset of fields being updated
    const validatedData = updateOrganizationSchema
      .omit({ logo: true })
      .parse(rawData);

    let logoUrl: string | null = existingOrg.logo; // Keep existing logo by default

    if (logoFile && logoFile.size > 0) {
      // Optional: Delete old logo from storage here if desired
      // if (existingOrg.logo) { await deleteLogo(existingOrg.logo); }

      logoUrl = await uploadLogo(logoFile);
      if (!logoUrl) {
        return { success: false, message: "Logo upload failed." };
      }
    }

    // Handle slug update carefully (if allowed)
    let slug = validatedData.slug
      ? slugify(validatedData.slug, { lower: true, strict: true })
      : existingOrg.slug;
    if (validatedData.slug && slug !== existingOrg.slug) {
      const existingSlug = await prisma.organization.findFirst({
        where: { slug: slug, NOT: { id: organizationId } },
        select: { id: true },
      });
      if (existingSlug) {
        return {
          success: false,
          message: "Slug is already taken.",
          errors: { slug: ["This slug is already in use."] },
        };
      }
    } else if (
      validatedData.name &&
      !validatedData.slug &&
      validatedData.name !== existingOrg.name
    ) {
      // Optional: Re-generate slug if name changes and slug wasn't explicitly provided
      // slug = await generateUniqueSlug(validatedData.name);
      // Or keep the old slug unless explicitly changed
      slug = existingOrg.slug;
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: validatedData.name ?? undefined, // Use validated name or keep existing
        slug: slug ?? undefined, // Use new/validated slug or keep existing
        logo: logoUrl, // Use new URL or keep existing
        metadata: validatedData.metadata, // Update metadata (null if cleared)
        // updatedAt is handled by Prisma
      },
    });

    revalidatePath(`/organizations/${organizationId}/settings`); // Revalidate settings page
    revalidatePath(`/organizations`); // Revalidate list page if needed
    if (slug !== existingOrg.slug) {
      revalidatePath(`/dashboard/${existingOrg.slug}`); // Revalidate old dashboard path
      revalidatePath(`/dashboard/${slug}`); // Revalidate new dashboard path
    }

    return {
      success: true,
      message: "Organization updated successfully!",
      organizationId: updatedOrg.id,
    };
  } catch (error: unknown) {
    console.error(`Error updating organization ${organizationId}:`, error);
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Validation failed.",
        errors: error.flatten().fieldErrors,
      };
    }
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed on the fields: (`slug`)")
    ) {
      return {
        success: false,
        message: "Slug is already taken.",
        errors: { slug: ["This slug is already in use."] },
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

// Optional: Action to fetch organization data for the settings page
export async function getOrganizationSettings(
  organizationId: string
): Promise<Organization | null> {
  const user = await getCurrentUser();
  if (!user) {
    // Handle not authenticated
    return null;
  }

  // Optional: Add permission check here too
  const isAdmin = await isOrgAdmin(user.id, organizationId);
  if (!isAdmin) {
    // Handle unauthorized
    return null;
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    return organization;
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    return null;
  }
}

// Helper to check if a user is an admin of a specific organization
export async function isOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
    if (!userId || !organizationId) return false;
    try {
        const member = await prisma.member.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: organizationId,
                    userId: userId,
                },
            },
            select: { role: true }
        });
        // Adjust the role check based on your requirements (e.g., 'ADMIN', 'OWNER')
        return member?.role === 'ADMIN'; // Assuming 'ADMIN' role grants management rights
    } catch (error) {
        console.error("Error checking org admin status:", error);
        return false;
    }
}


const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!); // Add '!' if you're sure it's set via env

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest", // Or another suitable model
});

const generationConfig = {
  temperature: 0.7, // Adjust creativity
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 100, // Limit output size
  responseMimeType: "text/plain", // Expect plain text list
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GeminiResponse {
  success: boolean;
  categories?: string[];
  error?: string;
}

export async function getBusinessCategoriesFromDescription(
  description: string
): Promise<GeminiResponse> {
  if (!apiKey) {
    console.error("Google Gemini API Key is not configured.");
    return { success: false, error: "API key not configured." };
  }
  if (!description || description.trim().length < 10) {
      return { success: false, error: "Please provide a more detailed description." };
  }

  const prompt = `Based on the following business description, suggest 5-10 relevant business categories. List them as comma-separated plain text. Do not include numbering or bullet points. Description: "${description}"`;

  try {
    const result = await model.generateContent(prompt, {
        safetySettings: safetySettings,
        generationConfig: generationConfig,
    });
    const responseText = result.response.text();

    if (!responseText) {
      return { success: false, error: "Could not generate categories from description." };
    }

    // Clean up the response: split by comma, trim whitespace, remove empty strings
    const categories = responseText
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    if (categories.length === 0) {
        return { success: false, error: "No relevant categories found." };
    }

    return { success: true, categories };

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    // Check for specific Gemini API error details if available
    const errorMessage = error.message || "An unexpected error occurred while generating categories.";
    return { success: false, error: errorMessage };
  }
}