// app/api/zoom/caption/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Initialize sequence number
let seqNumber = 0;

// Function to send captions to Zoom API
async function sendZoomCaption(captionText: string, zoomTokenUrl: string, lang: string) {
  try {
    // Increment the sequence number with each POST request
    seqNumber++;

    // Append the sequence number and language to the Zoom token URL
    const fullZoomUrl = `${zoomTokenUrl}&seq=${seqNumber}&lang=${lang}`;

    // Send POST request to the Zoom Closed Caption API
    const response = await fetch(fullZoomUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: captionText, // Send the caption text as plain text
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Error sending caption: ${errorMessage}`);
    }

    return response;
  } catch (error) {
    console.error('Error sending caption to Zoom:', error);
    throw error;
  }
}

// API Route handler
export async function POST(request: NextRequest) {
  try {
    // Extract captionText, zoomTokenUrl, and lang from the request body
    const { captionText, zoomTokenUrl, lang } = await request.json();

    // Validate request data
    if (!captionText || !zoomTokenUrl || !lang) {
      return NextResponse.json({ error: 'Missing caption text, Zoom token URL, or language code' }, { status: 400 });
    }

    // Send the caption to Zoom API
    const response = await sendZoomCaption(captionText, zoomTokenUrl, lang);

    // Return success response
    return NextResponse.json({ message: 'Caption sent successfully', seq: seqNumber }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send caption' }, { status: 500 });
  }
}
