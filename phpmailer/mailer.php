<?php
/**
 * Minimaler SMTP-Mailer für maeding.design
 * SSL/Port 465, AUTH LOGIN, HTML + optionaler ICS-Anhang
 */

class Mailer {
    private $host = 'w0202489.kasserver.com';
    private $port = 465;
    private $user = 'studio@maeding.design';
    private $pass = 'Axle1014@@@@';
    private $sock;

    private function read() {
        $out = '';
        while ($line = fgets($this->sock, 512)) {
            $out .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return $out;
    }

    private function cmd($c) {
        fputs($this->sock, $c . "\r\n");
        return $this->read();
    }

    public function send(array $m) {
        // Verbinden
        $ctx = stream_context_create([
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]
        ]);
        $this->sock = stream_socket_client(
            "ssl://{$this->host}:{$this->port}", $errno, $errstr, 15,
            STREAM_CLIENT_CONNECT, $ctx
        );
        if (!$this->sock) return false;

        $this->read(); // Greeting
        $this->cmd('EHLO localhost');
        $this->cmd('AUTH LOGIN');
        $this->cmd(base64_encode($this->user));
        $r = $this->cmd(base64_encode($this->pass));
        if (strpos($r, '235') === false) { fclose($this->sock); return false; }

        $from  = $m['from_email'];
        $toArr = is_array($m['to']) ? $m['to'] : [$m['to']];

        $this->cmd("MAIL FROM:<{$from}>");
        foreach ($toArr as $addr) {
            $this->cmd("RCPT TO:<{$addr}>");
        }
        $this->cmd('DATA');

        // Header
        $toStr   = implode(', ', $toArr);
        $subjB64 = '=?UTF-8?B?' . base64_encode($m['subject']) . '?=';
        // From-Name: Umlaute ersetzen damit kein Encoding nötig ist
        $fromName = str_replace(['ä','ö','ü','Ä','Ö','Ü','ß'], ['ae','oe','ue','Ae','Oe','Ue','ss'], $m['from_name']);
        $boundary = '----=_Boundary_' . md5(uniqid('', true));

        $msg  = "From: {$fromName} <{$from}>\r\n";
        $msg .= "To: {$toStr}\r\n";
        if (!empty($m['reply_to'])) $msg .= "Reply-To: {$m['reply_to']}\r\n";
        $msg .= "Subject: {$subjB64}\r\n";
        $msg .= "MIME-Version: 1.0\r\n";
        $msg .= "X-Mailer: maeding.design\r\n";

        if (!empty($m['attachment'])) {
            $msg .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n\r\n";
            $msg .= "--{$boundary}\r\n";
            $msg .= "Content-Type: text/html; charset=utf-8\r\n";
            $msg .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $msg .= chunk_split(base64_encode($m['html'])) . "\r\n";
            foreach ((array)$m['attachment'] as $att) {
                $nameB64 = '=?UTF-8?B?' . base64_encode($att['name']) . '?=';
                $msg .= "--{$boundary}\r\n";
                $msg .= "Content-Type: {$att['type']}; name=\"{$nameB64}\"\r\n";
                $msg .= "Content-Transfer-Encoding: base64\r\n";
                $msg .= "Content-Disposition: attachment; filename=\"{$nameB64}\"\r\n\r\n";
                $msg .= chunk_split(base64_encode($att['data'])) . "\r\n";
            }
            $msg .= "--{$boundary}--\r\n";
        } else {
            $msg .= "Content-Type: text/html; charset=utf-8\r\n";
            $msg .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $msg .= chunk_split(base64_encode($m['html'])) . "\r\n";
        }

        fputs($this->sock, $msg . "\r\n.\r\n");
        $r = $this->read();
        $this->cmd('QUIT');
        fclose($this->sock);
        return strpos($r, '250') !== false;
    }
}
