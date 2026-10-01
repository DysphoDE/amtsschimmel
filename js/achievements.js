'use strict';
/* Amtsschimmel – Urkunden. Jede Urkunde: +1 % Gesamtproduktion. check(S, C) wird regelmäßig geprüft. */
(function (root) {
  const AS = (root.AS = root.AS || {});
  const D = (AS.D = AS.D || {});
  const A = (D.ACH = []);
  const add = (id, name, desc, check, secret) => A.push({ id, name, desc, check, secret: !!secret });
  const f = (n) => AS.U.fmt(n);

  // Akten insgesamt
  [[1e2, 'Die erste Ablage'], [1e3, 'Aktenkundig'], [1e4, 'Papierberg'], [1e5, 'Stapel bis zur Decke'], [1e6, 'Eine Million Vorgänge'],
    [1e7, 'Archiv im Keller'], [1e8, 'Archiv im Nachbarhaus'], [1e9, 'Aktenlawine'], [1e10, 'Papierkontinent'], [1e11, 'Die Akte, die alles war'],
    [1e12, 'Billion Bescheide'], [1e14, 'Bürokratische Masse'], [1e16, 'Aktenschwerkraft'], [1e18, 'Ereignishorizont der Ablage'],
    [1e20, 'Die Galaxis in dreifacher Ausfertigung'], [1e22, 'Akten bis zum Rand des Universums'], [1e24, 'Kosmische Hintergrundablage'],
    [1e26, 'Mehr Akten als Atome im Amt'], [1e28, 'Die Ewige Registratur']].forEach(([n, name], i) =>
    add('tot' + i, name, 'Erledige insgesamt ' + f(n) + ' Akten.', (S) => S.totalAkten >= n));

  // Produktion pro Sekunde
  [[1, 'Es läuft'], [10, 'Dienstbetrieb'], [100, 'Hochbetrieb'], [1e3, 'Fließbandverwaltung'], [1e4, 'Aktenstrom'],
    [1e5, 'Reißender Aktenfluss'], [1e6, 'Verwaltungsmaschine'], [1e8, 'Behördenkraftwerk'], [1e10, 'Akten in Lichtgeschwindigkeit'],
    [1e12, 'Stempelsturm'], [1e14, 'Bürokratischer Urknall'], [1e16, 'Aktenquasar'], [1e18, 'Verwaltungssupernova'], [1e20, 'Allzuständigkeit']].forEach(([n, name], i) =>
    add('sps' + i, name, 'Erreiche ' + f(n) + ' Akten pro Sekunde.', (S, C) => C.M.spsBase >= n));

  // Generatoren
  D.GENS.forEach((g) => {
    add('g1_' + g.id, g.name + ' im Dienst', 'Stelle deinen ersten ' + g.name + ' ein.', (S) => (S.gens[g.id] || 0) >= 1);
    add('g50_' + g.id, '50 × ' + g.name, 'Besitze 50 ' + g.plural + '.', (S) => (S.gens[g.id] || 0) >= 50);
    add('g100_' + g.id, 'Hundertschaft: ' + g.plural, 'Besitze 100 ' + g.plural + '.', (S) => (S.gens[g.id] || 0) >= 100);
  });
  D.GREMIEN.forEach((g) => add('gr_' + g.id, 'Konstituierende Sitzung: ' + g.name, 'Gründe ' + (g.id === 'kommission' ? 'eine ' : 'einen ') + g.name + '.', (S) => (S.grem[g.id] || 0) >= 1));
  add('grem50', 'Gremiendschungel', 'Besitze insgesamt 50 Gremien.', (S, C) => C.totalGrem() >= 50);
  add('grem150', 'Mehr Gremien als Mitarbeiter', 'Besitze insgesamt 150 Gremien.', (S, C) => C.totalGrem() >= 150);

  // Stempeln
  [[1, 'Am Anfang war der Stempel'], [100, 'Stempelfreund'], [1000, 'Sehnenscheide in Gefahr'], [10000, 'Stempelmeister'], [50000, 'Der goldene Stempel']].forEach(([n, name], i) =>
    add('cl' + i, name, 'Stemple ' + f(n) + '-mal mit dem Eingangsstempel.', (S) => S.stats.clicks >= n));
  [[10, 'Zuständig!'], [100, 'Geschäftsverteilung verstanden'], [1000, 'Ressortleitung'], [10000, 'Staatssekretariat']].forEach(([n, name], i) =>
    add('co' + i, name, 'Stemple ' + f(n) + ' Akten mit dem richtigen Ressortstempel ab.', (S) => S.stats.correct >= n));
  [[10, 'Im Fluss'], [25, 'Arbeitsrausch'], [50, 'Flow nach Dienstvorschrift']].forEach(([n, name], i) =>
    add('flow' + i, name, 'Erreiche einen Arbeitsfluss von ' + n + '.', (S) => S.stats.maxFlow >= n));
  [[100, 'Vorgang um Vorgang'], [1000, 'Tausend Bescheide'], [10000, 'Bescheidflut'], [100000, 'Die Aktenmühle']].forEach(([n, name], i) =>
    add('docs' + i, name, 'Schließe ' + f(n) + ' Vorgänge ab.', (S) => S.stats.docs >= n));
  [[1, 'Fristgerecht'], [25, 'Eilig, eiliger, am eiligsten'], [100, 'Feuerwehr der Verwaltung']].forEach(([n, name], i) =>
    add('eilt' + i, name, 'Erledige ' + n + ' EILT-Vorgänge rechtzeitig.', (S) => S.stats.eilt >= n));
  add('eiltmiss', 'Frist versäumt', 'Lass 10 EILT-Vorgänge verstreichen.', (S) => S.stats.eiltMissed >= 10);
  [[1, 'Einspruch!'], [25, 'Widerspruchsbehörde'], [100, 'Rechtsweg ausgeschöpft']].forEach(([n, name], i) =>
    add('wid' + i, name, 'Erledige ' + n + ' Widersprüche.', (S) => S.stats.wider >= n));
  [[1, 'Mitzeichnung'], [25, 'Querschnittsaufgabe']].forEach(([n, name], i) =>
    add('gross' + i, name, 'Erledige ' + n + ' ressortübergreifende Vorgänge.', (S) => S.stats.gross >= n));

  // Formulare
  [[1, 'Erstes Formular'], [10, 'Formularsammler'], [25, 'Vordruckkenner'], [50, 'Formularexperte']].forEach(([n, name], i) =>
    add('fo' + i, name, 'Finde ' + n + ' verschiedene Formulare.', (S) => Object.keys(S.forms).length >= n));
  add('foall', 'Das vollständige Formularverzeichnis', 'Finde alle Formulare.', (S) => Object.keys(S.forms).length >= D.FORMS.length);
  [[1, 'Ein Ordner ist voll'], [4, 'Regalmeter'], [8, 'Die Registratur ist komplett']].forEach(([n, name], i) =>
    add('ord' + i, name, 'Vervollständige ' + n + (n === 1 ? ' Ordner.' : ' Ordner.'), (S, C) => C.ordnerComplete() >= n));
  add('altp', 'Ab ins Altpapier', 'Gib doppelte Formulare ins Altpapier.', (S) => S.stats.altpapier >= 1);

  // Schimmel und Anliegen
  [[1, 'Gefangen!'], [10, 'Pferdekenner'], [50, 'Stallmeister'], [200, 'Der Schimmelflüsterer']].forEach(([n, name], i) =>
    add('sc' + i, name, 'Fange den Amtsschimmel ' + n + '-mal.', (S) => S.stats.schimmel >= n));
  add('scmiss', 'Durchgegangen', 'Lass den Amtsschimmel 10-mal entwischen.', (S) => S.stats.schimmelMissed >= 10);
  [[1, 'Bürgernah'], [25, 'Sprechstunde'], [100, 'Ombudsstelle']].forEach(([n, name], i) =>
    add('an' + i, name, 'Bearbeite ' + n + ' Bürgeranliegen.', (S) => S.stats.anliegen >= n));

  // Vorschriften und Paragrafen
  [[100, 'Erste Satzung'], [1e4, 'Gesetzblatt'], [1e6, 'Paragrafendschungel'], [1e9, 'Normenflut']].forEach(([n, name], i) =>
    add('vor' + i, name, 'Beschließe in einem Durchgang ' + f(n) + ' Vorschriften.', (S) => S.runVor >= n));
  [[9, 'Allgemeiner Teil'], [18, 'Halbes Gesetzbuch'], [36, 'Das vollständige Verwaltungsgesetzbuch']].forEach(([n, name], i) =>
    add('par' + i, name, 'Setze ' + n + ' Paragrafen gleichzeitig in Kraft.', (S) => Object.keys(S.paras).length >= n));

  // Epochen
  D.ERAS.forEach((e, i) => { if (i > 0) add('era' + i, e.name, 'Erreiche die Epoche „' + e.name + '“.', (S) => S.maxEra >= i); });

  // Reformen, Leitbilder, Laufbahn
  [[1, 'Reformiert'], [5, 'Reformfreudig'], [10, 'Dauerbaustelle'], [25, 'Reform der Reform'], [50, 'Ewige Reform']].forEach(([n, name], i) =>
    add('re' + i, name, 'Führe ' + n + ' Verwaltungsreform' + (n === 1 ? '' : 'en') + ' durch.', (S) => S.stats.reforms >= n));
  [[3, 'Leitbildwechsel'], [5, 'Leitbild-Tourist'], [8, 'Alle Leitbilder durch']].forEach(([n, name], i) =>
    add('lb' + i, name, 'Erlebe ' + n + ' verschiedene Leitbilder.', (S) => Object.keys(S.visited).filter((k) => k !== 'schilda').length >= n));
  [[10, 'Zehn Dienstjahre'], [100, 'Dienstalter'], [1000, 'Lebenswerk'], [10000, 'Dynastie im Amt'], [1e5, 'Verwaltung seit Ur']].forEach(([n, name], i) =>
    add('dj' + i, name, 'Sammle ' + f(n) + ' Dienstjahre.', (S) => S.dj >= n));
  [[5, 'Laufbahn begonnen'], [12, 'Karriere'], [D.PERKS.length, 'Ganz oben']].forEach(([n, name], i) =>
    add('pk' + i, name, n === D.PERKS.length ? 'Erwirb alle Laufbahn-Stufen.' : 'Erwirb ' + n + ' Laufbahn-Stufen.', (S) => Object.keys(S.perks).length >= n));
  [[5, 'Erfahren'], [20, 'Altgedient']].forEach(([n, name], i) =>
    add('st' + i, name, 'Erreiche Erfahrungsstufe ' + n + '.', (S) => S.stufe >= n));

  // Großprojekte und Finale
  add('flug1', 'Eröffnung verschoben', 'Erlebe die erste Verschiebung des Flughafens Schilda-Süd.', (S) => (S.projects.flughafen || {}).delays >= 1);
  add('flug2', 'Er ist offen!', 'Eröffne den Flughafen Schilda-Süd.', (S) => !!(S.projects.flughafen || {}).done);
  add('finale', 'Der Ein-Klick-Antrag', 'Stelle den einen Antrag, der alle anderen überflüssig macht.', (S) => S.finale.done);

  // Geheime Urkunden
  add('x_nacht', 'Nachtschicht', 'Stemple zwischen 0 und 4 Uhr nachts.', (S) => !!S.flags.nacht, true);
  add('x_mittag', 'Verbotene Mittagspause', 'Stemple zwischen 12:00 und 12:05 Uhr.', (S) => !!S.flags.mittag, true);
  add('x_montag', 'Montagmorgen', 'Stemple montags vor 8 Uhr.', (S) => !!S.flags.montag, true);
  add('x_sprint', 'Schimmel-Sprint', 'Fange den Amtsschimmel in der ersten Sekunde nach seinem Erscheinen.', (S) => !!S.flags.sprint, true);
  add('x_querulant', 'Querulant', 'Benutze 10-mal hintereinander den falschen Stempel.', (S) => !!S.flags.querulant, true);
  add('x_reinverwaltung', 'Reine Verwaltung', 'Erledige 1 Million Akten in einem Durchgang, ohne selbst zu stempeln.', (S) => !!S.flags.reinverwaltung, true);
  add('x_doppelt', 'Doppelt hält besser', 'Besitze 10 doppelte Formulare gleichzeitig.', (S, C) => C.duplicateForms() >= 10, true);
  add('x_wieher', 'Wiehernde Zustimmung', 'Sprich den Amtsschimmel 20-mal an.', (S) => (S.flags.wieher || 0) >= 20, true);
  add('x_schilda', 'Schildbürgerstreich', 'Wähle das Leitbild Schilda.', (S) => !!S.visited.schilda, true);
  add('x_muede', 'Reformmüde', 'Wähle zweimal hintereinander dasselbe Leitbild.', (S) => S.streak >= 1, true);
  add('x_sparer', 'Wer spart, hat in der Not', 'Habe 1 Million unverbrauchte Vorschriften.', (S) => S.vor >= 1e6, true);
  add('x_langzeit', 'Ewiger Praktikant', 'Spiele insgesamt 100 Stunden.', (S) => S.stats.playTime >= 360000, true);
  add('x_pyramide', 'Antike Altlast', 'Finde die Bauabnahme der Pyramide von Gizeh.', (S) => !!S.forms.f15, true);
  add('x_flowmax', 'Aus einem Guss', 'Halte den Arbeitsfluss bei 60.', (S) => S.stats.maxFlow >= 60, true);

  D.ACHS = {}; A.forEach((a) => { D.ACHS[a.id] = a; });
})(typeof window !== 'undefined' ? window : globalThis);
