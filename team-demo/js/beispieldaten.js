// BEISPIELDATEN – erfundene Namen, für die Demo
var TEAM = [
  { id: 'kb', name: 'Katrin Bergmann', rolle: 'MFA, Empfang', bekommt: 'Termine, AU' },
  { id: 'sl', name: 'Sandra Lorenz', rolle: 'MFA', bekommt: 'Rezepte' },
  { id: 'jh', name: 'Jana Hoffmann', rolle: 'MFA, Abrechnung', bekommt: 'Überweisungen' },
  { id: 'cm', name: 'Dr. Christian Müller', rolle: 'Arzt', bekommt: 'Rückfragen' }
];

var BOEGEN = [
  { id: 'a5', name: 'Ralf Brettschneider', geb: '17.01.1970', termin: 'Di 03.11., 15:20', datum: '2026-11-03', zeit: '15:20', eingang: '31.10. 15:02',
    kasse: 'DAK', grund: 'Neuaufnahme, Vorsorge', medikamente: 'keine', allergien: 'keine bekannt', vorerkrankungen: 'keine',
    hausarzt: 'keiner', gelesen: false },
  { id: 'a1', name: 'Tobias Rehbein', geb: '14.03.1988', termin: 'heute, 08:20', datum: 'heute', zeit: '08:20', eingang: '29.10. 19:42',
    kasse: 'AOK Sachsen-Anhalt', grund: 'Wiederkehrende Rückenschmerzen seit ca. 6 Wochen',
    medikamente: 'Ibuprofen 400 bei Bedarf', allergien: 'keine bekannt', vorerkrankungen: 'keine',
    hausarzt: 'bisher keiner (zugezogen aus Halle)', gelesen: false },
  { id: 'a2', name: 'Henrike Vogt', geb: '02.11.1975', termin: 'heute, 09:30', datum: 'heute', zeit: '09:30', eingang: '30.10. 08:15',
    kasse: 'TK', grund: 'Beratung Gewichtsreduktion, erhöhte Blutzuckerwerte beim Betriebsarzt',
    medikamente: 'L-Thyroxin 50', allergien: 'Penicillin', vorerkrankungen: 'Hashimoto',
    hausarzt: 'Praxis Ilsenburg (Ruhestand)', gelesen: true },
  { id: 'a3', name: 'Frank Wöhler', geb: '21.07.1961', termin: 'heute, 11:20', datum: 'heute', zeit: '11:20', eingang: '31.10. 06:58',
    kasse: 'Barmer', grund: 'Bluthochdruck, Medikation überprüfen',
    medikamente: 'Ramipril 5, ASS 100', allergien: 'Pflaster', vorerkrankungen: 'Hypertonie, Z. n. Knie-OP 2019',
    hausarzt: 'Dr. Albrecht, Blankenburg', gelesen: false },
  { id: 'a4', name: 'Mia Grünwald', geb: '09.05.1999', termin: 'morgen, 10:00', datum: 'morgen', zeit: '10:00', eingang: '28.10. 21:10',
    kasse: 'IKK gesund plus', grund: 'Müdigkeit, Blutbild gewünscht',
    medikamente: 'keine', allergien: 'Heuschnupfen', vorerkrankungen: 'keine',
    hausarzt: 'keiner', gelesen: true }
];

var ANFRAGEN = [
  { id: 1, typ: 'Rezept', name: 'Gerda Pfeiffer', eingang: '31.10. 07:12', status: 'neu', an: 'sl',
    text: 'Bitte Folgerezept Metformin 1000, 180 Stück. Abholung Montag.' },
  { id: 2, typ: 'AU', name: 'Kevin Rabe', eingang: '31.10. 06:40', status: 'neu', an: 'kb',
    text: 'Seit gestern Fieber 38,9 und Halsschmerzen. Bitte Rückruf wegen AU (Arbeitgeber braucht sie ab heute).' },
  { id: 3, typ: 'Überweisung', name: 'Ursula Dahms', eingang: '30.10. 16:05', status: 'bearbeitung', an: 'jh',
    text: 'Überweisung zum Augenarzt (Kontrolle Diabetes) für Termin am 12.11.' },
  { id: 4, typ: 'Termin', name: 'Paul Seidler', eingang: '30.10. 12:30', status: 'bearbeitung', an: 'kb',
    text: 'Online kein Termin frei für Gesundheits-Check. Gern vormittags, Dienstag oder Donnerstag.' },
  { id: 5, typ: 'Rezept', name: 'Marlies Kunze', eingang: '29.10. 18:20', status: 'erledigt', an: 'sl',
    text: 'Ramipril 2,5 und Simvastatin 20, je 100 Stück.' },
  { id: 6, typ: 'Überweisung', name: 'Jonas Engel', eingang: '29.10. 09:44', status: 'neu', an: 'cm',
    text: 'Anforderung Laborbefund vom 20.10. für den Orthopäden, bitte per Fax an Praxis Dr. Krämer.' }
];

var TEXTE = [
  { bereich: 'Startseite – Begrüßung', titel: 'Ihre Hausarztpraxis in Wernigerode',
    text: 'Wir sind für Sie da – mit Zeit für Ihre Fragen und einer Medizin, die den ganzen Menschen sieht.' },
  { bereich: 'Aktuelles / Hinweis', titel: 'Praxis am 20.11. geschlossen',
    text: 'Am Freitag, 20.11., bleibt die Praxis wegen Fortbildung geschlossen.\nVertretung: Praxis am Markt, Tel. 03943 000000.' },
  { bereich: 'Sprechzeiten', titel: 'Sprechzeiten',
    text: 'Mo, Di, Do: 8–12 und 15–18 Uhr\nMi, Fr: 8–12 Uhr\nTermine bitte online oder telefonisch.' }
];

// Abgleich: von Hand aus T2med übernommen (heute = Datum heute)
var ABGLEICH = [
  { name: 'Ole Schwanitz', datum: 'heute', zeit: '09:00', kontakt: '0170 0000001', gesendet: false },
  { name: 'Lea Thiemann', datum: 'heute', zeit: '10:40', kontakt: 'l.thiemann@example.de', gesendet: true },
  { name: 'Frank Wöhler', datum: 'heute', zeit: '11:20', kontakt: 'f.woehler@example.de', gesendet: false },
  { name: 'Ralf Brettschneider', datum: '2026-11-03', zeit: '15:20', kontakt: 'r.brett@example.de', gesendet: false },
  { name: 'Svenja Kroll', datum: '2026-11-04', zeit: '08:40', kontakt: '0151 0000002', gesendet: false }
];

// Demo: Änderungen aus dem Browser-Speicher laden
(function () {
  try {
    var d = JSON.parse(localStorage.getItem('lhDemo') || 'null');
    if (d) { BOEGEN = d.b; ANFRAGEN = d.a; TEXTE = d.t; ABGLEICH = d.g; }
  } catch (e) {}
})();
