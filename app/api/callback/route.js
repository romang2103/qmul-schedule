import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    console.error('No authorization code found');
    return NextResponse.json({ message: 'No authorization code provided' }, { status: 400 });
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    // Exchange the authorization code for access token
    const { tokens } = await oAuth2Client.getToken(code);
    
    if (!tokens) {
      console.error('Failed to get tokens');
      return NextResponse.json({ message: 'Failed to get tokens' }, { status: 400 });
    }

    // Store the token in an HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set({
      name: 'google_token',
      value: JSON.stringify(tokens),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    // Redirect back to the homepage
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error during token exchange:', error);
    return NextResponse.json({ message: 'Error during token exchange', error }, { status: 500 });
  }
}
