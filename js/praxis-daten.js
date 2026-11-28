// Praxisdaten an einer Stelle (wird auf allen Seiten zuerst geladen)
// Zeiten in Minuten ab 0 Uhr, z. B. 450 = 7:30, 750 = 12:30. Tage: 1 = Mo ... 5 = Fr

var PRAXIS_DATEN = {
  standorte: {
    wn: { name: 'Wernigerode', art: 'Hauptstandort', adresse: 'Oberhof 9, 38855 Wernigerode',
          tel: '03943 48133', telLink: 'tel:+49394348133' },
    hd: { name: 'Heudeber', art: 'Zweigstandort am Bahnhof', adresse: 'Bahnhofstraße 18, 38855 Heudeber',
          tel: '039458 223', telLink: 'tel:+4939458223' }
  },

  // Sprechzeiten laut Dr. Müller
  sprechzeiten: {
    wn: { 1: [[450, 750]], 2: [[780, 1080]], 3: [[420, 720]], 4: [[450, 780]], 5: [[480, 720]] },
    hd: { 1: [[480, 780]], 2: [[480, 780]], 3: [[420, 720]], 4: [[780, 1080]], 5: [[480, 780]] }
  },

  // Telefonsprechstunde: Zeiten fehlen noch. Gleiches Format wie oben eintragen,
  // z. B. wn: { 1: [[480, 540]] } – dann erscheint der Anruf-Knopf nur in dieser Zeit.
  // Leer = nur Rückruf-Bitte.
  telefonsprechstunde: {
    wn: {},
    hd: {}
  },

  // Nur am Hauptstandort (Dr. Müller)
  nurHauptstandort: ['ernaehrung', 'ultraschall']
};
window.PRAXIS_DATEN = PRAXIS_DATEN;
