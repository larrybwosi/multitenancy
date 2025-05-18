// File: app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/utils/pusher';
import { v4 as uuidv4 } from 'uuid';
import { client } from '@/lib/sanity/client';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileType = file.type;
    const fileExtension = file.name.split('.').pop();
    const fileName = `Dealio-images-${uuidv4()}.${fileExtension}`;
    const result = await client.assets.upload('image', buffer, {
      filename: fileName,
      contentType: fileType,
    });
    

    // Trigger Pusher event
    await pusherServer.trigger(`session-${sessionId}`, 'image-uploaded', {
      imageUrl: result.url,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.url,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
