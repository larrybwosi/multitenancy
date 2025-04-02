import { client } from "@/lib/sanity"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get file type and create a buffer
    const fileType = file.type
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`

    // Determine asset type based on file type
    let assetType = "image"
    if (fileType.startsWith("application/")) {
      assetType = "file"
    }

    // Upload to Sanity
    //@ts-ignore
    const result = await client.assets.upload(assetType, buffer, {
      filename: fileName,
      contentType: fileType,
    });

    return NextResponse.json({
      url: result.url,
      id: result._id,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

