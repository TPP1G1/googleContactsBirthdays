# googleContactsBirthdays

## Background
![image](https://github.com/user-attachments/assets/36f34c9a-a3e1-41de-8fb7-828ede4ba419)[1]

[1] https://support.google.com/calendar/answer/13748346?sjid=15756351240136282946-EU

In Germany sometimes the birthdays of Google Contacts are not shown in the calender "Geburtstage" anymore. This script protects the Google User from forgetting important birthdays by restoring this functionality.

## Use of the script
- Create new project on: https://script.google.com/
- Add Services: People, Contacts
- Create Script File
- Copy Code from `Code2.gs` to this file
- Save
- Run `main()` for test
- Set Trigger to run `main()` time-controlled, daily between **2 and 3 am**

## Features
- Extract Birthdays from Google Contacts
- Create Googel Calendear "Geburtstage Skript" if not already existing
- Compares contacts birthdays with calendar events
- Creates recurring birthday events in the Calendar for not existing contact birthdays
- If year is included, it is added to the event title


## ToDo
- Activate reminders for the events
 
## Known Issues
- When creating a new calendar, you might need to activate the sync for this calandar in the google calendars app before you can see the events
