// Vorbereiteter Anschluss an T2med.
// Solange PRAXIS.t2med.aktiv aus ist oder keine API-Adresse steht,
// geht nichts nach außen. Die Angaben landen nur in der Dashboard-Demo.
// Später: api eintragen (https, im Praxisnetz), aktiv auf true.

(function () {
  function einstellung() {
    return (window.PRAXIS && PRAXIS.t2med) ? PRAXIS.t2med : { aktiv: false, api: '', link: '' };
  }

  function bereit() {
    var t = einstellung();
    return !!(t.aktiv && t.api && /^https:\/\//.test(t.api));
  }

  function ruf(pfad, koerper) {
    var t = einstellung();
    return fetch(t.api.replace(/\/$/, '') + pfad, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(koerper)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  // Patient in T2med suchen (FHIR). Nur wenn der Schalter an ist.
  function patientSuchen(daten) {
    if (!bereit()) return Promise.resolve({ ok: true, vorschau: true, treffer: [] });
    return ruf('/patient/suchen', daten);
  }

  // Neuen Patienten anlegen, falls keiner gefunden wurde
  function patientAnlegen(daten) {
    if (!bereit()) return Promise.resolve({ ok: true, vorschau: true, id: '' });
    return ruf('/patient/anlegen', daten);
  }

  // Gebuchten Termin an T2med übergeben.
  // Hinweis: Echte Termin-Endpunkte sind bei T2med noch nicht da (geplant 2027).
  // Die Funktion steht schon, damit sie später nur noch an die API gehängt wird.
  function terminAnT2med(termin) {
    if (!bereit()) return Promise.resolve({ ok: true, vorschau: true });
    return ruf('/termin/anlegen', termin);
  }

  // Ausgefüllten Anamnesebogen in die eAkte schreiben (Observation / PDF)
  function anamneseInAkte(patient, bogen) {
    if (!bereit()) return Promise.resolve({ ok: true, vorschau: true });
    return ruf('/akte/anamnese', { patient: patient, bogen: bogen });
  }

  window.t2medAnbindung = {
    bereit: bereit,
    patientSuchen: patientSuchen,
    patientAnlegen: patientAnlegen,
    terminAnT2med: terminAnT2med,
    anamneseInAkte: anamneseInAkte
  };
})();
