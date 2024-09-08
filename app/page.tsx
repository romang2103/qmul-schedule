'use client';

import { useEffect, useState } from 'react';
import processHTML from './backend/process';
import { useRouter } from 'next/navigation';

const HomePage = () => {
  const [studentID, setStudentID] = useState<string>("");
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch('/api/check-auth');
        const auth = await response.json();
        setAuthenticated(auth.authenticated);
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };
    checkAuthentication();
  }, []);

  const authenticateWithGoogle = async () => {
    try {
      router.push('/api/auth');
    } catch (error) {
      setError("Failed to authenticate with Google");
      console.error('Google Auth error:', error);
    }
  };

  const handleTimetable = async (deleteEvents = false) => {
    if (!studentID) {
      setError("Please enter your Student ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentID }),
      });

      const res = await response.json();
      if (response.ok) {
        const timetableEvents = processHTML(res.message);
        setData(timetableEvents);

        if (deleteEvents) {
          await handleEventDelete(timetableEvents);
        } else {
          await handleEventAdd(timetableEvents);
        }
      } else {
        setError('Error retrieving timetable');
        console.error('Timetable retrieval error:', res.message);
      }
    } catch (error) {
      setError("Failed to process timetable");
      console.error('Timetable processing error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAdd = async (events: any[]) => {
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      const res = await response.json();
      if (response.ok) {
        setSuccessMessage('Events successfully added to Google Calendar!');
      } else {
        setError('Error adding events to Google Calendar');
        console.error('Add event error:', res.message);
      }
    } catch (error) {
      setError("Error adding events to Google Calendar");
      console.error('Event add error:', error);
    }
  };

  const handleEventDelete = async (events: any[]) => {
    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      const res = await response.json();
      if (response.ok) {
        setSuccessMessage('Events successfully deleted from Google Calendar!');
      } else {
        setError('Error deleting events from Google Calendar');
        console.error('Delete event error:', res.message);
      }
    } catch (error) {
      setError("Error deleting events from Google Calendar");
      console.error('Event delete error:', error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen bg-blue-500 text-white">
      <div className="flex flex-col justify-center items-center sm:w-screen md:w-2/3  h-screen bg-white text-black p-8">
        <h1 className="text-4xl font-bold mb-4">QMUL Schedule Exporter</h1>
        <p className="text-lg mb-6">Easily export your QMUL timetable to your Google Calendar.</p>

        <div className="w-full mb-6">
          <h2 className="text-2xl font-semibold">Step 1: Enter your Student ID</h2>
          <input
            onChange={(e) => setStudentID(e.target.value)}
            value={studentID}
            className="w-full mt-4 p-3 border border-gray-300 rounded-md text-center text-lg"
            type="text"
            placeholder="Enter your Student ID"
          />
        </div>

        <div className="w-full mb-6">
          <h2 className="text-2xl font-semibold">
            {authenticated ? 'Step 2: Authenticate with Google (Authenticated)' : 'Step 2: Authenticate with Google'}
          </h2>
          <button
            onClick={authenticateWithGoogle}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 rounded mt-4 transition duration-200"
          >
            Authenticate with Google
          </button>
        </div>

        <div className="w-full mb-6">
          <h2 className="text-2xl font-semibold">Step 3: Export Your Timetable</h2>
          <button
            onClick={() => handleTimetable()}
            className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 rounded mt-4 transition duration-200 ${loading ? 'cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Export to Google Calendar'}
          </button>
        </div>

        <div className="w-full">
          <h2 className="text-2xl font-semibold">Delete Events from Calendar</h2>
          <button
            onClick={() => handleTimetable(true)}
            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-3 rounded mt-4 transition duration-200"
          >
            Delete Events
          </button>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
      </div>
    </div>
  );
};

export default HomePage;
