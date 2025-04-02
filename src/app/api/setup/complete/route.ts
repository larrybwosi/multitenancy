import { type NextRequest, NextResponse } from "next/server"
import { createCategory } from "@/lib/categories"
import { Organization, Category } from "@prisma/client"
import { logAuditEvent } from "@/lib/audit-logger"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { AuditAction, AuditResource } from "@/lib/audit-types"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      businessType, 
      businessDetails, 
      categories: categoryList, 
      customizations, 
      locations = [], 
      activeModules = []
    } = await request.json()

    if (!businessType || !businessDetails) {
      return NextResponse.json({ error: "Business type and details are required" }, { status: 400 })
    }

    // Create organization with business details and customizations
    const org = await db.organization.create({
      data: {
        id: session.user.id, // Use user ID as organization ID
        name: businessDetails.name,
        slug: businessDetails.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date(),
        // Business details
        address: businessDetails.address,
        city: businessDetails.city,
        state: businessDetails.state,
        zipCode: businessDetails.zipCode,
        country: businessDetails.country,
        phone: businessDetails.phone,
        email: businessDetails.email,
        website: businessDetails.website,
        taxId: businessDetails.taxId,
        taxRate: businessDetails.taxRate || 8,
        type: businessType.value,
        currency: "KES",
        timeZone: "Africa/Nairobi",
        defaultLanguage: "en",
        activeModules: activeModules,
        // Customization fields
        primaryColor: customizations?.primaryColor || "#4f46e5",
        secondaryColor: customizations?.secondaryColor || "#f97316",
        receiptHeader: customizations?.receiptHeader,
        receiptFooter: customizations?.receiptFooter,
        invoiceTemplate: customizations?.invoiceTemplate || "DEFAULT",
        tableLayout: customizations?.tableLayout,
        theme: customizations?.theme || "DEFAULT",
        customFields: customizations?.customFields,
      }
    })

    // Create default location
    await db.location.create({
      data: {
        orgId: org.id,
        name: "Main Location",
        address: businessDetails.address,
        city: businessDetails.city,
        state: businessDetails.state,
        zipCode: businessDetails.zipCode,
        country: businessDetails.country,
        isDefault: true
      }
    })

    // Create additional locations if provided
    if (locations.length > 0) {
      interface LocationData {
        name: string;
        address: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        phone?: string;
        email?: string;
        isDefault?: boolean;
      }

      const locationPromises = locations.map(async (location: LocationData) => {
        return db.location.create({
          data: {
            orgId: org.id,
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            zipCode: location.zipCode,
            country: location.country,
            phone: location.phone,
            email: location.email,
            isDefault: location.isDefault || false
          }
        })
      })
      
      await Promise.all(locationPromises)
    }

    // Log the organization setup event
    logAuditEvent({
      action: AuditAction.CREATE,
      resource: AuditResource.ORGANIZATION,
      resourceId: org.id,
      details: {
        name: org.name,
        type: businessType.value,
        categories: categoryList?.length || 0,
        locations: locations.length || 1,
        modules: activeModules.length
      },
    })

    // Insert categories into the database if provided
    let insertedCategories = []
    if (categoryList && categoryList.length > 0) {
      insertedCategories = await Promise.all(
        categoryList.map(async (category: Category) => {
          return await createCategory({
            ...category,
            orgId: org.id
          });
        })
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
      categories: insertedCategories,
      organization: org
    })
  } catch (error) {
    console.error("Error completing setup:", error)
    return NextResponse.json({ error: "An error occurred while completing setup" }, { status: 500 })
  }
}

