<?php
require_once __DIR__ . '/phpmailer/mailer.php';

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['ok'=>false]); exit; }

// ── Empfänger Praxis-Benachrichtigung (für Kunden-Demo ändern) ──────────────
$praxis_empfaenger = 'studio@maeding.design';

function p($k) { return trim(strip_tags($_POST[$k] ?? '')); }

$vorname      = p('vorname');
$nachname     = p('nachname');
$email        = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$telefon      = p('telefon');
$gebdatum     = p('gebdatum');
$versicherung = p('versicherung');
$kasse        = p('kasse');
$datum        = p('termin_datum');
$uhrzeit      = p('termin_uhrzeit');
$standort     = p('standort');
$anliegen     = p('anliegen');
$patienttyp   = p('patienttyp');

$allergien       = p('allergien');
$medikamente     = p('medikamente');
$anliegen_neu    = p('anliegen_neu');
$raucher         = p('raucher');
$vorerkrankungen = p('vorerkrankungen');

$name       = $vorname . ' ' . $nachname;
$termin_str = $datum . ', ' . $uhrzeit . ' Uhr – ' . $standort;

$mailer = new Mailer();

// ── Adresszeile je Standort ──────────────────────────────────────────────────
$adresse = stripos($standort, 'Wernigerode') !== false
    ? 'Oberhof 9, 38855 Wernigerode (Benzingerode)'
    : 'Am Tiergarten 11, 38871 Ilsenburg';

// ── 1. E-Mail an Praxis (studio@maeding.design) ──────────────────────────────
$anamnese_rows = '';
if ($patienttyp === 'Neupatient') {
    $anamnese_rows = '
    <tr><td colspan="2" style="padding:12px 0 4px;font-weight:700;color:#4a5a3a;font-size:13px;border-top:2px solid #e8ede0;">ANAMNESEBOGEN</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666;white-space:nowrap;">Allergien</td><td style="padding:4px 0;">' . htmlspecialchars($allergien ?: '—') . '</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666;white-space:nowrap;">Vorerkrankungen</td><td style="padding:4px 0;">' . htmlspecialchars($vorerkrankungen ?: '—') . '</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666;white-space:nowrap;">Medikation</td><td style="padding:4px 0;">' . htmlspecialchars($medikamente ?: '—') . '</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666;white-space:nowrap;">Raucherstatus</td><td style="padding:4px 0;">' . htmlspecialchars($raucher ?: '—') . '</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#666;white-space:nowrap;">Anliegen</td><td style="padding:4px 0;">' . htmlspecialchars($anliegen_neu ?: '—') . '</td></tr>';
}

$praxis_html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;line-height:1.6;">
<p style="font-size:16px;font-weight:700;color:#4a5a3a;">Neuer Termin – Land-Harz-Praxis</p>
<table style="width:100%;border-collapse:collapse;">
  <tr><td style="padding:5px 16px 5px 0;color:#666;white-space:nowrap;">Name</td><td style="padding:5px 0;font-weight:600;">' . htmlspecialchars($name) . '</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;">Geburtsdatum</td><td style="padding:5px 0;">' . htmlspecialchars($gebdatum ?: '—') . '</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;">Versicherung</td><td style="padding:5px 0;">' . htmlspecialchars($versicherung ?: '—') . '</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;">Krankenkasse</td><td style="padding:5px 0;">' . htmlspecialchars($kasse ?: '—') . '</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;">E-Mail</td><td style="padding:5px 0;"><a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;">Telefon</td><td style="padding:5px 0;">' . htmlspecialchars($telefon ?: '—') . '</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;border-top:1px solid #eee;">Termin</td><td style="padding:5px 0;font-weight:700;border-top:1px solid #eee;">' . htmlspecialchars($termin_str) . '</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;">Anliegen</td><td style="padding:5px 0;">' . htmlspecialchars($anliegen ?: '—') . '</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#666;">Patientenart</td><td style="padding:5px 0;">' . htmlspecialchars($patienttyp) . '</td></tr>
  ' . $anamnese_rows . '
</table>
<p style="margin-top:20px;font-size:11px;color:#999;">Automatisch generiert – landharzpraxis.de · ' . date('d.m.Y H:i') . '</p>
</body></html>';

$ok1 = $mailer->send([
    'from_name'  => 'Land-Harz-Praxis Buchungssystem',
    'from_email' => 'studio@maeding.design',
    'to'         => $praxis_empfaenger,
    'reply_to'   => $email,
    'subject'    => 'Neuer Termin: ' . $name . ' – ' . $datum . ' ' . $uhrzeit . ' Uhr',
    'html'       => $praxis_html,
]);
if (!$ok1) { error_log('[sende-termin] Praxis-Mail fehlgeschlagen: ' . date('H:i:s')); }

// ── 2. Bestätigungsmail an Patienten ─────────────────────────────────────────
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $patient_html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;max-width:560px;margin:0 auto;padding:32px 24px;line-height:1.6;">
<p>Guten Tag ' . htmlspecialchars($vorname) . ',</p>
<p>Ihr Termin bei Dr. med. Christian Müller ist <strong>verbindlich bestätigt</strong>.</p>
<div style="background:#f3f7ee;border-left:4px solid #5f7053;border-radius:8px;padding:16px 20px;margin:20px 0;">
  <p style="margin:0 0 6px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:.06em;">Ihr Termin</p>
  <p style="margin:0;font-size:18px;font-weight:700;color:#4a5a3a;">' . htmlspecialchars($datum . ', ' . $uhrzeit . ' Uhr') . '</p>
  <p style="margin:4px 0 0;color:#555;">Land-Harz-Praxis ' . htmlspecialchars($standort) . '<br>' . htmlspecialchars($adresse) . '</p>
</div>
<p>Bitte erscheinen Sie pünktlich. Bei Verhinderung bitten wir Sie, den Termin mindestens <strong>24 Stunden vorher</strong> telefonisch abzusagen:</p>
<p style="font-size:16px;font-weight:700;">☎ 03943 / 48 13 3</p>
<p style="margin-top:28px;font-size:12px;color:#999;">Land-Harz-Praxis – Dr. med. Christian Müller<br>
Innere Medizin · Ernährungsmedizin · Notfallmedizin<br>
www.landharzpraxis.de<br><br>
Diese E-Mail wurde automatisch generiert.</p>
</body></html>';

    $ok2 = $mailer->send([
        'from_name'  => 'Land-Harz-Praxis Dr. Müller',
        'from_email' => 'studio@maeding.design',
        'to'         => $email,
        'subject'    => 'Terminbestätigung – ' . $datum . ', ' . $uhrzeit . ' Uhr – Dr. Müller',
        'html'       => $patient_html,
    ]);
    if (!$ok2) { error_log('[sende-termin] Patienten-Mail fehlgeschlagen: ' . date('H:i:s')); }
}

echo json_encode(['ok' => true, 'praxis' => isset($ok1) ? $ok1 : null, 'patient' => isset($ok2) ? $ok2 : null]);
