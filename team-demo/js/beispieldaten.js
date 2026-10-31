// Beispieldaten für die Demo – alle Namen sind erfunden
var TEAM = [
  { id: 'kb', name: 'Katrin Bergmann', kurz: 'Katrin', rolle: 'Empfang' },
  { id: 'sl', name: 'Sandra Lorenz', kurz: 'Sandra', rolle: 'Rezepte' },
  { id: 'jh', name: 'Jana Hoffmann', kurz: 'Jana', rolle: 'Überweisungen' },
  { id: 'cm', name: 'Dr. Christian Müller', kurz: 'Dr. Müller', rolle: 'Arzt' }
];

// Bögen: Datum und Uhrzeit trägt der Patient selbst ein
var BOEGEN = [
  { id: 'a1', name: 'Tobias Rehbein', geb: '14.03.1988', datum: 'heute', zeit: '08:20', eingang: '29.10. 19:42',
    kasse: 'AOK Sachsen-Anhalt', grund: 'Rückenschmerzen seit 6 Wochen', medikamente: 'Ibuprofen 400 bei Bedarf',
    allergien: 'keine', vorerkrankungen: 'keine', gelesen: false },
  { id: 'a2', name: 'Henrike Vogt', geb: '02.11.1975', datum: 'heute', zeit: '09:30', eingang: '30.10. 08:15',
    kasse: 'TK', grund: 'Beratung Gewicht, erhöhter Blutzucker', medikamente: 'L-Thyroxin 50',
    allergien: 'Penicillin', vorerkrankungen: 'Hashimoto', gelesen: true },
  { id: 'a3', name: 'Frank Wöhler', geb: '21.07.1961', datum: 'heute', zeit: '11:20', eingang: '31.10. 06:58',
    kasse: 'Barmer', grund: 'Bluthochdruck, Tabletten prüfen', medikamente: 'Ramipril 5, ASS 100',
    allergien: 'Pflaster', vorerkrankungen: 'Bluthochdruck, Knie-OP 2019', gelesen: false },
  { id: 'a4', name: 'Mia Grünwald', geb: '09.05.1999', datum: 'morgen', zeit: '10:00', eingang: '28.10. 21:10',
    kasse: 'IKK gesund plus', grund: 'Müdigkeit, Blutbild gewünscht', medikamente: 'keine',
    allergien: 'Heuschnupfen', vorerkrankungen: 'keine', gelesen: true },
  { id: 'a5', name: 'Ralf Brettschneider', geb: '17.01.1970', datum: '2026-11-03', zeit: '15:20', eingang: '31.10. 15:02',
    kasse: 'DAK', grund: 'Erstbesuch, Vorsorge', medikamente: 'keine',
    allergien: 'keine', vorerkrankungen: 'keine', gelesen: false }
];

// Neupatienten aus T2med, vom Team eingetragen
// gesendet / geoeffnet: Uhrzeit oder null; Bogen ausgefüllt = Online-Bogen ist eingegangen
var OHNE_BOGEN = [
  { id: 'o1', name: 'Ole Schwanitz', datum: 'heute', zeit: '09:00', kontakt: '0170 0000001', gesendet: null, geoeffnet: null },
  { id: 'o2', name: 'Lea Thiemann', datum: 'heute', zeit: '10:40', kontakt: 'l.thiemann@example.de', gesendet: '07:45', geoeffnet: '08:12' },
  { id: 'o3', name: 'Frank Wöhler', datum: 'heute', zeit: '11:20', kontakt: 'f.woehler@example.de', gesendet: '30.10. 17:02', geoeffnet: '30.10. 18:40' },
  { id: 'o4', name: 'Svenja Kroll', datum: '2026-11-04', zeit: '08:40', kontakt: '0151 0000002', gesendet: '31.10. 14:10', geoeffnet: null }
];

var ANFRAGEN = [
  { id: 1, typ: 'Rezept', name: 'Gerda Pfeiffer', eingang: '31.10. 07:12', status: 'neu', an: 'sl',
    text: 'Folgerezept Metformin 1000, 180 Stück. Abholung Montag.' },
  { id: 2, typ: 'AU', name: 'Kevin Rabe', eingang: '31.10. 06:40', status: 'neu', an: 'kb',
    text: 'Seit gestern Fieber und Halsschmerzen. Bitte Rückruf wegen AU.' },
  { id: 3, typ: 'Überweisung', name: 'Ursula Dahms', eingang: '30.10. 16:05', status: 'arbeit', an: 'jh',
    text: 'Überweisung zum Augenarzt (Diabetes-Kontrolle) für den 12.11.' },
  { id: 4, typ: 'Termin', name: 'Paul Seidler', eingang: '30.10. 12:30', status: 'arbeit', an: 'kb',
    text: 'Online kein Termin frei für den Check-up. Gern vormittags, Di oder Do.' },
  { id: 5, typ: 'Rezept', name: 'Marlies Kunze', eingang: '29.10. 18:20', status: 'erledigt', an: 'sl',
    text: 'Ramipril 2,5 und Simvastatin 20, je 100 Stück.' },
  { id: 6, typ: 'Befund', name: 'Jonas Engel', eingang: '29.10. 09:44', status: 'neu', an: 'cm',
    text: 'Bitte Kopie meiner Laborwerte vom 20.10. für meinen Orthopäden.' },
  { id: 7, typ: 'Impfung', name: 'Helga Sauer', eingang: '31.10. 08:05', status: 'neu', an: 'kb',
    text: 'Grippeimpfung, gern nächste Woche am Vormittag.' }
];

var TEXTE = [
  { bereich: 'Begrüßung', vorher: null, titel: 'Ihre Hausarztpraxis in Wernigerode',
    text: 'Wir sind für Sie da – mit Zeit für Ihre Fragen und einer Medizin, die den ganzen Menschen sieht.' },
  { bereich: 'Hinweis', vorher: null, titel: 'Praxis am 20.11. geschlossen',
    text: 'Am Freitag, 20.11., bleibt die Praxis wegen Fortbildung geschlossen. Vertretung: Praxis am Markt.' },
  { bereich: 'Sprechzeiten', vorher: null, titel: 'Sprechzeiten',
    text: 'Mo, Di, Do: 8–12 und 15–18 Uhr\nMi, Fr: 8–12 Uhr' }
];

// Demo: gespeicherte Klicks aus diesem Browser laden
(function () {
  try {
    var d = JSON.parse(localStorage.getItem('lhDemo3') || 'null');
    if (d) { BOEGEN = d.b; ANFRAGEN = d.a; TEXTE = d.t; OHNE_BOGEN = d.o; }
  } catch (e) {}
})();
