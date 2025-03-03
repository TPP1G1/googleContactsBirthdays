function main() {
  //clearBirthdayCalendar()
  //deleteBirthdayCalendar()
  var missingBirthdayContacts = compareCalendarWithContacts();
  addContactsAsRecurringBirthdays(missingBirthdayContacts);
}

/**
 * Vergleicht die Geburtstagsereignisse im Kalender mit den Kontakten aus den Google-Kontakten.
 */
function compareCalendarWithContacts() {

  // Abrufen der Einträge aus dem Kalender
  var events = getBirthdayEvents();

  // Abrufen der Geburtstagsdaten aus den Google-Kontakten
  var contacts = listAllConnectionNames();

  // Durchlaufen der Kontakte und Vergleich mit den Kalenderereignissen
  for (var i = 0; i < contacts.length; i++) {
    var contact = contacts[i];
    var contactName = contact.name;  // Name des Kontakts

    // Suche nach dem Kontaktnamen in den Kalenderereignissen
    var matchFound = false;
    var missingBirthdays = [];

    events.forEach(function (event) {
      var eventName = event.getTitle();  // Name des Kalenderereignisses

      // Entfernen der Jahreszahl in Klammern aus dem Ereignisnamen (z.B. "Max Mustermann (1990)" -> "Max Mustermann")
      var cleanedEventName = eventName.replace(/\s?\(\d{4}\)$/, '').trim();

      // Vergleiche den bereinigten Kontaktname mit dem bereinigten Ereignisnamen
      if (contactName.toLowerCase() === cleanedEventName.toLowerCase()) {
        matchFound = true;
        // Wenn eine Übereinstimmung gefunden wird, wird das Flag auf true gesetzt
      }
    });

    // Wenn keine Übereinstimmung gefunden wurde, füge den Kontakt zur Liste der fehlenden Geburtstagsereignisse hinzu
    if (!matchFound) {
      missingBirthdays.push(contact);  // Hier fügen wir den Kontakt hinzu
      Logger.log('Kein übereinstimmendes Kalenderereignis gefunden für: ' + contactName);
    }
  }

  return missingBirthdays;

}

/**
 * Erstellt Kalendereinträge für Geburtstage von Kontakten, welche noch nicht vorhanden sind.
 */
async function addContactsAsRecurringBirthdays(connections) {
  try {

    if (!connections || connections.length === 0) {
      console.log('Keine Kontakte gefunden, keine Ereignisse können hinzugefügt werden.');
      return;
    }
    // Kalender abrufen, bzw. Erstellen
    const calendar = createBirthdayCalendar();
    console.log(`Kalender ${calendar.getName()} wurde abgerufen.`);

    // Jährlich wiederkehrende Ereignisse hinzufügen
    connections.forEach(contact => {
      const { name, day, month, year } = contact;

      if (day && month) {

        // Titel des Ereignisses mit Geburtsjahr nur, wenn das Jahr nicht undefined ist
        const eventTitle = year && !isNaN(year) ? `${name} (${year})` : `${name}`;

        // Formatieren des Geburtsdatums als neues Datum (mit Jahr, Monat und Tag)
        const birthDate = year && !isNaN(year) ? new Date(year, month - 1, day) : new Date(2025, month - 1, day);  // Monat ist nullbasiert (0 = Januar, 11 = Dezember), 2025 dummy Jahr, damit year definiert bleibt

        // Geburtsdatum ohne Jahr für die wiederkehrenden Ereignisse (dieser Tag jedes Jahr)
        const recurringDate = new Date(birthDate);
        recurringDate.setFullYear(new Date().getFullYear());  // Setze das Jahr auf das aktuelle Jahr

        // Erstelle ein wiederkehrendes Ereignis mit einer jährlichen Wiederholung
        const recurrence = CalendarApp.newRecurrence().addYearlyRule();
        calendar.createAllDayEventSeries(eventTitle, recurringDate, recurrence);

        console.log(`Erstelle jährlich wiederkehrendes Ereignis: ${eventTitle} am ${recurringDate.toLocaleDateString()}`);
      } else {
        console.log(`Kein Geburtstag für ${name} vorhanden.`);
      }
    });

  } catch (err) {
    console.log('Fehler beim Hinzufügen der Ereignisse: ', err.message);
  }
}

/**
 * Listet alle Kontakte mit Geburtsdaten im Kalender "Geburtstage Skript" auf und gibt sie als Array zurück.
 */
function getBirthdayEvents() {
  // Kalender mit dem Namen "Geburtstage Skript" abrufen
  var calendarName = "Geburtstage Skript";
  var calendars = CalendarApp.getCalendarsByName(calendarName);

  if (calendars.length === 0) {
    Logger.log("Kalender mit dem Namen '" + calendarName + "' wurde nicht gefunden.");
    return;
  }
  var calendar = calendars[0];

  // Zeitraum, aktuelles Jahr, komplett
  // Aktuelles Jahr ermitteln
  var currentYear = new Date().getFullYear();

  // Start- und Enddatum für das aktuelle Jahr festlegen
  var startDate = new Date(currentYear, 0, 1);  // 1. Januar des aktuellen Jahres
  var endDate = new Date(currentYear + 1, 0, 1);  // 1. Januar des nächsten Jahres (Ende des aktuellen Jahres)


  // Abrufen der Ereignisse aus dem Kalender
  var events = calendar.getEvents(startDate, endDate);

  // Ausgabe der Ereignisse in der Konsole
  if (events.length > 0) {
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      //Logger.log('Ereignis: ' + event.getTitle() + ', Start: ' + event.getStartTime() + ', Ende: ' + event.getEndTime());
    }
  } else {
    Logger.log("Keine Ereignisse gefunden.");
  }

  return events;
}

/**
 * Listet alle Kontakte mit Geburtsdaten auf und gibt sie als Array zurück.
 */
function listAllConnectionNames() {
  try {
    let connectionsList = [];
    let nextPageToken = null;

    // Schleife durch alle Seiten der Kontakte
    do {
      const response = People.People.Connections.list('people/me', {
        pageSize: 100, // Maximale Anzahl von Kontakten pro Seite
        personFields: 'names,birthdays', // Namen und Geburtstagsdaten abfragen
        pageToken: nextPageToken, // Token für die nächste Seite
      });

      if (response.connections && response.connections.length > 0) {
        response.connections.forEach((person) => {
          const name = person.names && person.names.length > 0 ? person.names[0].displayName : 'Unbekannt';
          const birthday = person.birthdays && person.birthdays.length > 0 ? person.birthdays[0].date : null;

          if (birthday) {
            // Destrukturierung des Geburtsdatums in Jahr, Monat und Tag
            const { year, month, day } = birthday;

            // Füge Jahr, Monat und Tag als separate Variablen in die Liste ein
            connectionsList.push({ name, year, month, day });
          }
        });
      }

      nextPageToken = response.nextPageToken;  // Wenn eine nächste Seite vorhanden ist, sie abrufen

    } while (nextPageToken);

    return connectionsList;

  } catch (err) {
    console.log('Fehler beim Abrufen der Kontakte: ', err.message);
    return [];
  }
}

/**
 * Erstellt einen Kalender "Geburtstage Skript", wenn dieser noch nicht existiert.
 * Gibt das Kalenderobjekt zurück.
 */
function createBirthdayCalendar() {
  const calendarName = 'Geburtstage Skript';

  const calendars = CalendarApp.getCalendarsByName(calendarName);

  if (calendars.length === 0) {
    console.log(`Erstelle den Kalender: ${calendarName}`);
    const calendar = CalendarApp.createCalendar(calendarName);
    console.log(`Kalender '${calendarName}' wurde erstellt.`);
    return calendar;
  } else {
    console.log(`Kalender '${calendarName}' existiert bereits.`);
    return calendars[0];
  }
}

/**
 * Leert den Kalender "Geburtstage Skript" von allen Ereignissen.
 * Dauert lange...
 */
function clearBirthdayCalendar() {
  try {
    const calendarName = 'Geburtstage Skript';
    const calendars = CalendarApp.getCalendarsByName(calendarName);

    if (calendars.length === 0) {
      console.log(`Kalender '${calendarName}' existiert nicht.`);
      return;
    }

    const calendar = calendars[0];

    // Holen Sie sich alle Ereignisse für den Kalender
    let events = calendar.getEvents(new Date(0), new Date(9999, 11, 31)); // Alle Ereignisse von Anfang der Zeit bis Ende der Zeit
    console.log(`Anzahl gefundener Ereignisse: ${events.length}`);

    // Map zum Nachverfolgen der Serien-IDs
    const recurringEventIds = new Set();

    // Liste bereinigen: Wiederkehrende Ereignisse nur einmal aufnehmen
    events = events.filter((event) => {
      if (event.isRecurringEvent()) {
        const seriesId = event.getId(); // Serien-ID für wiederkehrende Ereignisse
        if (recurringEventIds.has(seriesId)) {
          return false; // Bereits verarbeitet, nicht in die Liste aufnehmen
        }
        recurringEventIds.add(seriesId); // Serien-ID markieren
        return true; // Das erste Exemplar bleibt in der Liste
      }
      return true; // Einmalige Ereignisse bleiben immer in der Liste
    });
    console.log(`Anzahl gefundener Ereignisse bereinigt: ${events.length}`);

    // Löschen Sie alle Ereignisse
    //events.forEach((event) => {
    //  console.log(`Lösche Ereignis: ${event.getTitle()} am ${event.getStartTime().toLocaleString()}`);
    //  event.deleteEvent();
    //});

    // Löschen Sie alle Ereignisse
    events.forEach((event) => {

      if (event.isRecurringEvent()) {
        // Lösche die gesamte Serie für wiederkehrende Ereignisse
        console.log(`Lösche wiederkehrendes Ereignis: ${event.getTitle()}`);
        event.getEventSeries().deleteEventSeries();
      } else {
        // Lösche das einzelne Ereignis
        console.log(`Lösche Ereignis: ${event.getTitle()} am ${event.getStartTime().toLocaleString()}`);
        event.deleteEvent();
      }
    });

    console.log('Alle Ereignisse im Kalender "Geburtstage Skript" wurden gelöscht.');

  } catch (err) {
    console.log('Fehler beim Löschen der Ereignisse: ', err.message);
  }
}

/**
 * Loescht den Kalender "Geburtstage Skript"
 */
function deleteBirthdayCalendar() {
  try {
    const calendarName = 'Geburtstage Skript';
    const calendars = CalendarApp.getCalendarsByName(calendarName);

    if (calendars.length === 0) {
      console.log(`Kalender '${calendarName}' existiert nicht.`);
      return;
    }

    const calendar = calendars[0];
    calendar.deleteCalendar();
    console.log(`Kalender '${calendarName}' geloescht.`);

  } catch (err) {
    console.log('Fehler beim Löschen des Kalenders: ', err.message);
  }

}

