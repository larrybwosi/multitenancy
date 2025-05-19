import { client } from '@/lib/sanity/client';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadAsFile = searchParams.get('file') === 'true'; // Get from URL search params

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate a unique filename
    const fileName = `Dealio-files-${uuidv4()}`;

    // Determine asset type - simplified logic
    const assetType = uploadAsFile ? 'file' : 'image';

    // Upload to Sanity
    const result = await client.assets.upload(assetType, buffer, {
      filename: fileName,
      contentType: fileType,
    });

    return NextResponse.json({
      url: assetType === 'file' ? result.url : `${result.url}?fm=webp&q=75&auto=format`,
      id: result._id,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
