import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
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

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  try {
    // Retrieve a list of events (you may need to filter or specify a date range)
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
    });

    const events = eventsResponse.data.items;

    // Loop through and delete each event
    for (const event of events) {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: event.id,
      });
    }

    return NextResponse.json({ message: 'All events cleared successfully' });
  } catch (error) {
    console.error('Error deleting events:', error);
    return NextResponse.json({ message: 'Failed to clear events' }, { status: 500 });
  }
}