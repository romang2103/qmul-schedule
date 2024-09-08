import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export async function GET() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Generate OAuth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Ensure fresh token every time
  });

  // Redirect user to Google for authentication
  return NextResponse.redirect(authUrl);
}
