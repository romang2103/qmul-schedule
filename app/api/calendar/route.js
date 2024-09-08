import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const cookieStore = cookies();
  const token = cookieStore.get('google_token');

  if (!token) {
    return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set the credentials from the token stored in the cookie
  oAuth2Client.setCredentials(JSON.parse(token.value));

  const body = await req.json(); // Assuming events are passed in the request body
  const events = body.events; // Access the events array inside the object
  console.log('Events:', events);

  if (!Array.isArray(events)) {
    return NextResponse.json({ message: 'Events data is not an array' }, { status: 400 });
  }

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  // Insert events into Google Calendar
  for (const event of events) {
    await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
  }

  return NextResponse.json({ message: 'Events added successfully' });
}
