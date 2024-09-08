import * as cheerio from 'cheerio';

export default function processHTML(htmlString) {
    const $ = cheerio.load(htmlString);
    let timetableEvents = [];

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayOffsets = {
        'Mon': 0,
        'Tue': 1,
        'Wed': 2,
        'Thu': 3,
        'Fri': 4
    };

    // Loop through all timetable tables (grid-border-args)
    $('table.grid-border-args').each((tableIndex, table) => {
        const headerTable = $(table).prevAll('table.header-border-args').first();
        const weeksText = headerTable.find('span.header-1-2-3').text().trim();

        const weekRange = weeksText.match(/(\d{1,2})\s(\w+)\s(\d{4})-(\d{1,2})\s(\w+)\s(\d{4})/);

        if (weekRange) {
            const [_, startDay, startMonth, startYear, endDay, endMonth, endYear] = weekRange;

            const startWeekDate = new Date(`${startMonth} ${startDay}, ${startYear}`);
            const endWeekDate = new Date(`${endMonth} ${endDay}, ${endYear}`);

            $(table).find('tr').each((i, row) => {
                const day = $(row).find('td.row-label-one').text().trim();

                if (daysOfWeek.includes(day)) {
                    const dayOffset = dayOffsets[day];

                    let timeSlotIndex = 0; // Keep track of time slots (30-minute intervals)

                    $(row).find('td').each((j, cell) => {
                        if ($(cell).hasClass('cell-border')) {
                            // Empty cell, move to the next time slot
                            timeSlotIndex += 1;
                        } else if ($(cell).find('table.object-cell-args').length > 0) {
                            // Extract course information
                            const courseCode = $(cell).find('td').first().text().trim();
                            const eventType = $(cell).find('td').last().text().trim();
                            const location = $(cell).find('td[align="center"]').text().trim();
                            const courseTitle = $(cell).find('td').eq(3).text().trim();

                            // Each time slot starts from 8:00 AM, so calculate the start time based on the timeSlotIndex
                            const baseHour = 8; // 8:00 AM
                            const timeStart = baseHour + (timeSlotIndex * 0.5);  // Each slot is 30 minutes
                            const startHours = Math.floor(timeStart);
                            const startMinutes = (timeStart % 1) === 0.5 ? 30 : 0;

                            // Calculate the end time based on the colspan (which represents the event duration)
                            const colspan = parseInt($(cell).attr('colspan')) || 1;
                            const timeEnd = timeStart + (colspan * 0.5); // Event duration
                            const endHours = Math.floor(timeEnd);
                            const endMinutes = (timeEnd % 1) === 0.5 ? 30 : 0;

                            // Adjust the start and end times based on the day and time slot
                            const startDateTime = new Date(startWeekDate);
                            startDateTime.setDate(startDateTime.getDate() + dayOffset);
                            startDateTime.setHours(startHours, startMinutes);

                            const endDateTime = new Date(startDateTime);
                            endDateTime.setHours(endHours, endMinutes);

                            // Determine the recurrence (weekly repetition)
                            const totalWeeks = Math.ceil((endWeekDate - startWeekDate) / (1000 * 60 * 60 * 24 * 7));
                            const recurrenceRule = `RRULE:FREQ=WEEKLY;COUNT=${totalWeeks}`;

                            // Create event object
                            const event = {
                                'summary': courseTitle,
                                'location': location,
                                'description': `${courseCode} - ${eventType}`,
                                'start': {
                                    'dateTime': startDateTime.toISOString(),
                                    'timeZone': 'Europe/London'
                                },
                                'end': {
                                    'dateTime': endDateTime.toISOString(),
                                    'timeZone': 'Europe/London'
                                },
                                'recurrence': [recurrenceRule],
                                'attendees': [],
                                'timeSlotIndex': timeSlotIndex,
                                'colspan': colspan,
                                'timeStart': timeStart,
                                'startHours': startHours,
                                'startMinutes': startMinutes,
                            };

                            timetableEvents.push(event);

                            // Increment timeSlotIndex by colspan to account for event duration
                            timeSlotIndex += colspan;
                        }
                    });
                }
            });
        }
    });

    console.log(timetableEvents);
    return timetableEvents;
}
