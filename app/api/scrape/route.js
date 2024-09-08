import puppeteer from 'puppeteer';
import chromium from 'chrome-aws-lambda';
import { setTimeout } from "node:timers/promises";
import { NextResponse } from 'next/server';  // Import NextResponse

export async function POST(req) {
    const { studentID } = await req.json();
    console.log(studentID);

    if (!studentID) {
        return NextResponse.json({ message: 'Student ID is required' }, { status: 400 });
    }

    try {
        // Launch Puppeteer in headless mode
        // const browser = await puppeteer.launch({
        //     headless: true,  // Set to false if you want to see the browser window for debugging
        //     args: ['--no-sandbox', '--disable-setuid-sandbox']
        // });

        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true,
        });

        

        const page = await browser.newPage();

        // Navigate to the website (replace with the actual URL)
        await page.goto('https://timetables.qmul.ac.uk/default.aspx');

        // Click the student button to proceed
        await page.locator('#LinkBtn_studentsetstaff').click();

        // Wait for some time to allow the page to load or process the request
        await setTimeout(3000);

        // Type the student ID into the input field
        await page.locator('#tObjectInput').fill(studentID);
        
        const input = await page.$eval('#tObjectInput', input => input.value);
        console.log('Student ID Inputted:', input);

        // Click the submit button to proceed
        await page.locator('#bGetTimetable').click();
        console.log('Getting timetable...');

        // Wait for some time to allow the page to load or process the request
        await setTimeout(3000);

        while (await page.$('#bGetTimetable')) {
            console.log('Clicking again...');
            await page.locator('#bGetTimetable').click();
            console.log('Getting timetable...');
            await setTimeout(3000);
        }

        // Get the entire content of the body element
        const bodyHTML = await page.evaluate(() => {
            return document.body.innerHTML;  // This returns the HTML inside the <body> tag
        });

        console.log(bodyHTML);

        // Close the browser
        await browser.close();

        // Return a success response using NextResponse
        return NextResponse.json({ message: bodyHTML }, { status: 200 });

    } catch (error) {
        console.error('Error with Puppeteer:', error);
        return NextResponse.json({ message: 'An error occurred while processing the request' }, { status: 500 });
    }
}
