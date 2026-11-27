// Eingänge von der Webseite ins Dashboard holen (Online-Termin, Rezept, Rückruf)
// Format: siehe js/termin.js der Webseite (Patient > Standort > Besuchsgrund > Hinweis > Datenschutz > Termin > Anamnesebogen)
// Jetzt (Vorschau): aus dem Browser-Speicher der Webseite, gleiche Adresse, gleicher Browser.
// Später: QUELLE.endpunkt eintragen (Server, der die Eingänge verschlüsselt speichert). Termin und Uhrzeit kommen dann aus T2med.
var QUELLE = { endpunkt: '' };
var STANDORTE = { wn: 'Wernigerode', hd: 'Heudeber' };
var WEB = [];

function webLaden() {
  try { WEB = JSON.parse(localStorage.getItem('lhpEingang') || '[]'); } catch (e) { WEB = []; }
}
function webSpeichern() {
  try { localStorage.setItem('lhpEingang', JSON.stringify(WEB)); } catch (e) {}
}
function webZeit(isoStr) {
  var d = new Date(isoStr);
  return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '. ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

webLaden();
// Rezept und Rückruf landen bei den Anfragen
WEB.forEach(function (e) {
  if (e.art !== 'rezept' && e.art !== 'rueckruf') return;
  if (ANFRAGEN.some(function (a) { return a.id === e.id; })) return;
  var k = e.kontakt || {};
  ANFRAGEN.push({
    id: e.id, web: true, standort: e.standort, status: 'neu', eingang: webZeit(e.eingang),
    typ: e.art === 'rezept' ? 'Rezept' : 'Rückruf', an: e.art === 'rezept' ? 'sl' : 'kb',
    name: k.name || ((k.vorname || '') + ' ' + (k.nachname || '')).trim(),
    text: e.art === 'rezept' ? (e.medikamente || []).join('; ') + (k.telefon ? ' · Tel. ' + k.telefon : '')
      : (e.anliegen ? e.anliegen + ' · ' : '') + 'Tel. ' + (k.telefon || '–')
  });
});
