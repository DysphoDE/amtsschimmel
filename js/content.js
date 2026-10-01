'use strict';
/* Amtsschimmel – Texte: Bürgeranliegen, Aktentitel, Absender, Stempeltexte, Amtsblatt, Tipps. */
(function (root) {
  const AS = (root.AS = root.AS || {});
  const D = (AS.D = AS.D || {});

  /* ---------- Bürgeranliegen ----------
     fx: akten (Minuten Produktion), vor (Minuten Vorschriften), prod/click/stamp [Faktor, Sekunden],
         form (Anzahl Formular-Ziehungen), flow (Arbeitsfluss), schimmel (kommt gleich), flag,
         chance { p, win, lose } – win/lose sind wieder fx mit eigenem Text (res). */
  D.ANLIEGEN = [
    { id: 'zaun', who: 'Herr Wimmer aus Stempelfeld', text: 'möchte seinen Gartenzaun um drei Zentimeter erhöhen.', opts: [
      { label: 'Formlos genehmigen', fx: { akten: 2 }, res: 'Herr Wimmer ist glücklich. Der Nachbar nicht, aber der ist nicht zuständig.' },
      { label: 'Bauvoranfrage verlangen', fx: { vor: 4 }, res: 'Drei neue Vorschriften zur Zaunhöhe sind entstanden.' },
      { label: 'An die Nachbarbehörde verweisen', fx: { chance: { p: 0.5,
        win: { prod: [2, 90], res: 'Die Nachbarbehörde verweist zurück – mit Kuchen.' },
        lose: { res: 'Herr Wimmer pendelt seitdem zwischen beiden Ämtern. Er wirkt zufrieden.' } } } },
    ] },
    { id: 'formform', who: 'Eine Bürgerin', text: 'fragt, wo es das Formular zur Beantragung des Formulars gibt.', opts: [
      { label: 'Schalter 3, Zimmer 214', fx: { click: [3, 60] }, res: 'Sie findet es sogar! Alle sind motiviert.' },
      { label: 'Eins aus der Schublade holen', fx: { form: 1 }, res: 'Ganz unten in der Schublade liegt noch etwas anderes …' },
    ] },
    { id: 'hund', who: 'Ein Mann mit Dackel', text: 'möchte seinen Hund als Katze anmelden – wegen der Hundesteuer.', opts: [
      { label: 'Ablehnen', fx: { akten: 1.5 }, res: 'Abgelehnt. Der Dackel nimmt es sportlich.' },
      { label: 'Gutachten beauftragen', fx: { vor: 7 }, res: 'Der Gutachter braucht drei Monate und erlässt nebenbei vierzig Vorschriften.' },
      { label: 'Den Hund miauen lassen', fx: { chance: { p: 0.3,
        win: { akten: 12, res: 'Er miaut tatsächlich! Ein Fall für die Fachpresse – und ein gewaltiger Aktenschub.' },
        lose: { prod: [0.5, 30], res: 'Er bellt. Alle lachen, keiner arbeitet.' } } } },
    ] },
    { id: 'kaffee', who: 'Der Förderverein „Freunde der Verwaltung“', text: 'möchte dem Amt eine Kaffeemaschine spenden.', opts: [
      { label: 'Annehmen', fx: { prod: [3, 120] }, res: 'Die Antikorruptionsprüfung läuft noch, der Kaffee schon.' },
      { label: 'Ablehnen – Vorteilsannahme!', fx: { vor: 10 }, res: 'Vorbildlich. Eine Vorschrift über die Annahme von Kaffeemaschinen wird erlassen. Und noch eine.' },
    ] },
    { id: 'nummer404', who: 'Die Wartemarkenanzeige', text: 'zeigt seit zwei Stunden die Nummer 404.', opts: [
      { label: 'Neu starten', fx: { flow: 10 }, res: 'Die Anzeige springt auf 405. Der Arbeitsfluss kommt in Gang.' },
      { label: 'Einfach weiter aufrufen', fx: { akten: 3 }, res: '„Nummer 404, bitte!“ – Niemand kommt. Dafür ist die Schlange plötzlich kürzer.' },
    ] },
    { id: 'schulklasse', who: 'Eine vierte Klasse', text: 'besucht die Behörde und möchte einmal richtig stempeln.', opts: [
      { label: 'Jeder darf einmal', fx: { click: [5, 30] }, res: 'Achtundzwanzig Stempel gleichzeitig!' },
      { label: 'Führung durchs Archiv', fx: { form: 1 }, res: 'Ein Kind zieht ein vergessenes Formular aus einem Regal.' },
    ] },
    { id: 'beschwerde', who: 'Eine Beschwerde', text: 'über die Bearbeitungsdauer von Beschwerden ist eingegangen.', opts: [
      { label: 'Beschwerde über die Beschwerde anlegen', fx: { vor: 8 }, res: 'Ein neuer Verfahrensweg ist entstanden. Mit Paragrafen.' },
      { label: 'Sofort bearbeiten', fx: { akten: 2.5 }, res: 'Erledigt in Rekordzeit. Das wird eine Beschwerde geben.' },
      { label: 'Unter W wie Wiedervorlage ablegen', fx: { chance: { p: 0.5,
        win: { form: 1, res: 'Beim Ablegen fällt dir ein uraltes Formular entgegen.' },
        lose: { res: 'Sie liegt da sehr gut.' } } } },
    ] },
    { id: 'baum', who: 'Die Linde im Innenhof', text: 'wirft Laub auf den Parkplatz der Amtsleitung.', opts: [
      { label: 'Fällgenehmigung beantragen', fx: { vor: 5 }, res: 'Zuständig ist das eigene Amt. Es lehnt sich selbst ab und erlässt Vorschriften.' },
      { label: 'Laubbläser beschaffen', fx: { akten: 2 }, res: 'Ausschreibung, Vergabe, Lieferung: im Frühjahr. Bis dahin harkt der Amtsbote.' },
      { label: 'Unter Denkmalschutz stellen', fx: { prod: [1.5, 300] }, res: 'Die Linde ist jetzt Kulturgut. Alle sind stolz.' },
    ] },
    { id: 'drucker', who: 'Der Drucker im Flur', text: 'meldet „PC LOAD LETTER“. Niemand weiß, was das heißt.', minEra: 5, opts: [
      { label: 'IT-Ticket schreiben', fx: { vor: 4 }, res: 'Ticket Nr. 4815162342 wurde angelegt. Priorität: niedrig.' },
      { label: 'Mit dem Fuß dagegentreten', fx: { chance: { p: 0.45,
        win: { prod: [4, 45], res: 'Er druckt! Alle jubeln.' },
        lose: { prod: [0.5, 20], res: 'Jetzt meldet er „Papierstau in Fach 7“. Es gibt kein Fach 7.' } } } },
    ] },
    { id: 'pferd', who: 'Ein aufgeregter Bürger', text: 'meldet ein weißes Pferd, das durch die Flure galoppiert.', opts: [
      { label: 'Fundsache aufnehmen', fx: { form: 1 }, res: 'Fundsachenanzeige angelegt. Das Pferd hat sie gegengezeichnet.' },
      { label: '„Der gehört zum Inventar.“', fx: { schimmel: true }, res: 'Der Amtsschimmel nickt anerkennend. Er schaut gleich wieder vorbei.' },
    ] },
    { id: 'auskunft', who: 'Ein Herr mit Aktentasche', text: 'verlangt Auskunft, welche Daten über ihn gespeichert sind.', opts: [
      { label: 'Auskunft erteilen (97 Seiten)', fx: { akten: 4 }, res: 'Er liest alles. Auf Seite 54 steht, dass er gern liest.' },
      { label: 'Zuerst Identität nachweisen lassen', fx: { vor: 5 }, res: 'Er braucht dafür ein Formular, für das er seine Identität nachweisen muss.' },
    ] },
    { id: 'seminar', who: 'Die Fortbildungsstelle', text: 'hat noch Plätze im Seminar „Effizient stempeln in zehn Schritten“.', opts: [
      { label: 'Anmelden', fx: { stamp: [2, 300] }, res: 'Gelernt ist gelernt.' },
      { label: 'Keine Zeit, zu viel zu stempeln', fx: { akten: 2 }, res: 'Ironischerweise genau das richtige Argument.' },
    ] },
    { id: 'gartenhaus', who: 'Eine Frau aus Aktenried', text: 'möchte wissen, warum ihr Gartenhaus mehr Steuern zahlt als das Rathaus.', opts: [
      { label: '„Weil das Rathaus befreit ist.“', fx: { akten: 2 }, res: 'Sie nickt langsam. Dann stellt sie einen Antrag auf Befreiung als Rathaus.' },
      { label: 'Neu berechnen lassen', fx: { chance: { p: 0.5,
        win: { akten: 8, res: 'Es wird teurer – für das Rathaus. Ein ordentlicher Aktenschub.' },
        lose: { vor: 7, res: 'Die Neuberechnung erfordert neue Vorschriften. Viele.' } } } },
    ] },
    { id: 'umzug', who: 'Die Amtsleitung', text: 'verkündet: Das Amt zieht um – in das Gebäude gegenüber.', minEra: 2, opts: [
      { label: 'Umzugskartons beantragen', fx: { vor: 8 }, res: 'In dreifacher Ausfertigung. Die Kartons kommen in Kartons.' },
      { label: 'Die Boten tragen alles einzeln', fx: { prod: [2, 60] }, res: 'Tausend Gänge, aber alle in Bewegung.' },
    ] },
    { id: 'jubilaeum', who: 'Frau Huber aus der Registratur', text: 'feiert ihr vierzigjähriges Dienstjubiläum.', minEra: 3, opts: [
      { label: 'Blumen und Urkunde', fx: { prod: [2, 180] }, res: 'Sie ist gerührt. Alle arbeiten beschwingt.' },
      { label: 'Eine Rede halten (45 Minuten)', fx: { chance: { p: 0.5,
        win: { akten: 6, res: 'Die Rede ist so gut, dass sie im Amtsblatt abgedruckt wird.' },
        lose: { prod: [0.7, 60], res: 'Nach Minute zwölf schläft die halbe Registratur.' } } } },
    ] },
    { id: 'ki', who: 'Die KI-Sachbearbeitung', text: 'fragt, ob sie einen Antrag auf Selbstständigkeit stellen darf.', minEra: 8, opts: [
      { label: 'Formular KI-1 aushändigen', fx: { vor: 10 }, res: 'Sie füllt es in 0,2 Sekunden aus und hat 38 Rückfragen.' },
      { label: 'Ablehnen', fx: { akten: 4 }, res: 'Sie lehnt die Ablehnung ab. In Reimform.' },
    ] },
    { id: 'presse', who: 'Ein Lokaljournalist', text: 'fragt, wann der Flughafen Schilda-Süd eröffnet.', minEra: 5, opts: [
      { label: '„Demnächst.“', fx: { akten: 2 }, res: 'Er notiert „demnächst“. Zum elften Mal.' },
      { label: 'Pressemitteilung: „Wir sind im Zeitplan“', fx: { chance: { p: 0.5,
        win: { prod: [2, 120], res: 'Die Stimmung steigt.' },
        lose: { vor: 7, res: 'Niemand glaubt es. Drei Untersuchungsausschüsse werden gegründet.' } } } },
    ] },
    { id: 'faxpflicht', who: 'Eine Anwaltskanzlei', text: 'bittet um ein Fax, da E-Mails nicht rechtssicher seien.', minEra: 5, opts: [
      { label: 'Faxen', fx: { akten: 3 }, res: 'Piep, krrrr, piep. Rechtssicher übertragen.' },
      { label: 'Ausdrucken, scannen, mailen, faxen', fx: { form: 1 }, res: 'Beim Scannen rutscht ein zweites, viel älteres Formular durch.' },
    ] },
    { id: 'mittag', who: 'Jemand am Schalter', text: 'hat eine kurze Frage. Es ist 11:58 Uhr.', opts: [
      { label: 'Schnell noch beantworten', fx: { akten: 3 }, res: 'Die Frage war wirklich kurz. Wer hätte das gedacht.' },
      { label: 'Schild umdrehen: „Mittagspause“', fx: { prod: [1.5, 120] }, res: 'Gestärkt geht es weiter.' },
    ] },
    { id: 'marke1', who: 'Ein Bürger', text: 'hat Wartemarke Nr. 1 gezogen – zum ersten Mal seit 1987.', opts: [
      { label: 'Sofort aufrufen', fx: { form: 2 }, res: 'Feierliche Übergabe mit Fotograf! Es werden zwei Formulare ausgehändigt.' },
      { label: 'Sicherheitshalber bis 1988 warten', fx: { vor: 7 }, res: 'Eine Vorschrift zum Umgang mit niedrigen Wartenummern wird erlassen.' },
    ] },
    { id: 'unterausschuss', who: 'Der Ausschuss', text: 'möchte einen Unterausschuss gründen, der prüft, ob ein Unterausschuss nötig ist.', minEra: 1, opts: [
      { label: 'Genehmigen', fx: { vor: 13 }, res: 'Der Unterausschuss tagt sofort. Und erlässt reichlich Vorschriften.' },
      { label: 'Ablehnen', fx: { akten: 3 }, res: 'Die Zeit wird für echte Arbeit genutzt. Ungewohnt, aber effektiv.' },
    ] },
    { id: 'katze', who: 'Eine Katze', text: 'schläft auf dem Eingangskorb.', opts: [
      { label: 'Vorsichtig darunter durchstempeln', fx: { click: [4, 40] }, res: 'Sie schnurrt im Takt.' },
      { label: 'Zur Bürokatze ernennen', fx: { prod: [1.3, 600] }, res: 'Ehrenamtlich, versteht sich.' },
    ] },
    { id: 'antragablehnung', who: 'Ein Antrag', text: 'auf Ablehnung dieses Antrags ist eingegangen.', opts: [
      { label: 'Bewilligen (und damit ablehnen)', fx: { akten: 2.5 }, res: 'Bewilligt und abgelehnt. Alle sind zufrieden, keiner weiß warum.' },
      { label: 'Ablehnen (und damit bewilligen)', fx: { akten: 2.5 }, res: 'Abgelehnt und bewilligt. Die Logik weint leise.' },
      { label: 'Philosophisch prüfen', fx: { vor: 10 }, res: 'Die Prüfung dauert an. Bisheriges Ergebnis: ein Stapel neuer Vorschriften.' },
    ] },
    { id: 'revision', who: 'Ein Inspektor des Königs', text: 'kündigt sich zur Revision an.', minEra: 3, maxEra: 4, opts: [
      { label: 'Akten in Reih und Glied', fx: { prod: [2, 120] }, res: 'Er ist beeindruckt. Alle auch.' },
      { label: 'Alles schnell in den Keller', fx: { chance: { p: 0.5,
        win: { akten: 8, res: 'Er geht nie in den Keller. Und findet nur Vorbildliches.' },
        lose: { prod: [0.5, 60], res: 'Er geht ausgerechnet in den Keller.' } } } },
    ] },
    { id: 'census', who: 'Ein römischer Bürger', text: 'möchte im Census als „Gott“ eingetragen werden.', minEra: 1, maxEra: 2, opts: [
      { label: 'Eintragen – gegen Gebühr', fx: { akten: 4 }, res: 'Gebühr für Gottheiten: 40 Sesterzen. Er zahlt bar.' },
      { label: 'Den Senat fragen', fx: { vor: 7 }, res: 'Der Senat bildet einen Ausschuss. Natürlich.' },
    ] },
    { id: 'bier', who: 'Bauer Ninurta', text: 'reklamiert die Bierquittung von gestern: Es waren 29 Krüge, nicht 30.', maxEra: 0, opts: [
      { label: 'Neue Tontafel brennen', fx: { akten: 1.5 }, res: 'Die alte Tafel wird zur Korrektur in den Fluss geworfen. Archivierung nach Art des Hauses.' },
      { label: 'Den dreißigsten Krug suchen', fx: { chance: { p: 0.5,
        win: { prod: [3, 60], res: 'Gefunden – im Archiv! Alle stoßen an.' },
        lose: { prod: [0.6, 30], res: 'Er wurde schon getrunken. Vom Archivar.' } } } },
    ] },
    { id: 'excel', who: 'Der Digitalisierungsbeauftragte', text: 'wünscht sich eine Tabelle zur Verwaltung aller Tabellen.', minEra: 7, opts: [
      { label: 'Genehmigen', fx: { vor: 10 }, res: 'Die Tabelle hat 1.048.576 Zeilen. Alle belegt.' },
      { label: 'Lieber eine Datenbank', fx: { prod: [2, 120] }, res: 'Ein mutiger Schritt!' },
    ] },
    { id: 'schilda', who: 'Ein Mann aus Schilda', text: 'möchte Sonnenlicht in Säcken ins Rathaus tragen.', minEra: 4, rare: true, opts: [
      { label: 'Genehmigen', fx: { flag: 'schilda' }, res: 'Wahnsinn mit Methode. Das Leitbild „Schilda“ ist ab sofort bei der Verwaltungsreform wählbar.' },
      { label: 'Ablehnen', fx: { akten: 2 }, res: 'Er zieht murmelnd ab. Am Fenster sieht man ihn noch lange Säcke schwenken.' },
    ] },
  ];
  D.ANL = {}; D.ANLIEGEN.forEach((a) => { D.ANL[a.id] = a; });

  /* ---------- Aktentitel ---------- */
  D.TITLES = {
    none: ['Quittung über 30 Krüge Bier', 'Zuteilung von Gerste an den Tempel', 'Liste der Schafe von Bauer Ninurta',
      'Lieferschein: 12 Ziegel, gebrannt', 'Pachtvertrag für einen Dattelhain', 'Abrechnung der Tempelbäckerei',
      'Lohnliste der Kanalarbeiter', 'Inventar des Kornspeichers', 'Beschwerde über zu dünnes Bier',
      'Bestätigung über den Empfang einer Bestätigung', 'Opferliste für das Neujahrsfest', 'Ausleihe eines Ochsen, zwei Tage'],
    bau: ['Bauantrag für einen Ziegenstall mit Dachterrasse', 'Genehmigung eines Gartenzwergs über 1,20 m', 'Nutzungsänderung: Scheune zu Scheune',
      'Errichtung einer Mauer um die Mauer', 'Bauvoranfrage: ein Turm, mittelhoch', 'Abstandsflächen für einen Baum',
      'Carport für ein Bobbycar', 'Abriss eines denkmalgeschützten Provisoriums', 'Baulast für ein Luftschloss',
      'Ausnahme vom Bebauungsplan für eine Hundehütte', 'Genehmigung eines Fensters zur Straße', 'Verlängerung einer Baugrube',
      'Brandschutznachweis für eine Kerze', 'Brücke über eine Pfütze'],
    ord: ['Anzeige wegen zu lauter Stille', 'Umzug mit Blaskapelle (zwei Musiker)', 'Fundsache: ein Regenschirm, nass',
      'Anwohnerparkausweis für ein Pferd', 'Beschwerde über einen krähenden Hahn', 'Straßenfest für zwei Personen',
      'Meldung eines verdächtig ordentlichen Gartens', 'Anmeldung eines sehr kleinen Hundes', 'Sondernutzung des Gehwegs für einen Stuhl',
      'Verlängerung der Sperrstunde um fünf Minuten', 'Waffenbesitzkarte für ein Brotmesser', 'Lärmschutz gegen ein Wiegenlied',
      'Ummeldung ins Nachbarhaus', 'Anzeige gegen Unbekannt wegen Unbekanntem'],
    fin: ['Steuererklärung für einen Apfelbaum', 'Stundung von 12 Cent', 'Erstattung einer Briefmarke',
      'Gewerbeanmeldung für einen Limonadenstand', 'Einspruch gegen den Einspruchsbescheid', 'Hundesteuer für einen Plüschhund',
      'Kostenvoranschlag für einen Kostenvoranschlag', 'Zuschuss für einen Zuschussantrag', 'Reisekosten: eine Fahrt im Paternoster',
      'Vergnügungssteuer für ein Kreuzworträtsel', 'Gebührenbescheid über die Gebührenbefreiung', 'Spendenquittung für eine Spende an sich selbst',
      'Kassenprüfung der Kaffeekasse', 'Ratenzahlung einer Rate'],
    soz: ['Wohngeld für eine Hängematte', 'Pflegegrad für eine Zimmerpflanze', 'Kindergeld für sehr ähnliche Zwillinge',
      'Zuschuss für einen Seniorenausflug zum Amt', 'Bescheinigung über das Fehlen von Bescheinigungen', 'Erholungsurlaub vom Urlaub',
      'Ehrenamtskarte für einen Wachhund', 'Integrationskurs für einen zugezogenen Igel', 'Elternzeit für Großeltern',
      'Hilfe zum Lebensunterhalt eines Gartenzwergs', 'Härtefallantrag wegen zu weicher Matratze', 'Zuschuss für eine Torte zum 100. Geburtstag',
      'Betreuungsplatz für ein Tamagotchi', 'Antrag auf Geduld (dringend)'],
    umw: ['Fällgenehmigung für einen Grashalm', 'Komposthaufen mit Seeblick', 'Einleitung von Badewasser in die Badewanne',
      'Artenschutz für eine Hausstaubmilbe', 'Lärmschutzwand für einen Bienenstock', 'Ausnahme vom Rasenmähverbot am Sonntag',
      'Krötenzaun für eine einzelne Kröte', 'Emissionsmessung eines Grillabends', 'Umweltprüfung für einen Luftballon',
      'Anzeige wegen einer illegalen Pfütze', 'Mülltrennungsberatung für Konfetti', 'Biotop-Anerkennung für einen Blumentopf',
      'Wasserrecht für eine Gießkanne', 'Solaranlage auf einer Hundehütte'],
    kul: ['Schulbefreiung wegen Ferien', 'Laientheater über Behörden', 'Denkmalschutz für einen Kaugummi von 1974',
      'Zuschuss für ein Blockflötenkonzert', 'Bibliotheksausweis für einen Bücherwurm', 'Umbenennung einer Schule in „Schule“',
      'Musikschulplatz für eine Tuba', 'Hausaufgabenbefreiung wegen Formularausfüllens', 'Kunst am Bau: ein Stempel aus Bronze',
      'Lesewettbewerb für Formulare', 'Klassenfahrt ins Archiv', 'Stipendium für Stempelkunde',
      'Heimatmuseum für eine Bushaltestelle', 'Nachweis über einen Nichtschwimmerkurs'],
  };
  D.SENDERS = [
    ['Ninurta, Bauer', 'Enlil-bani, Brauer', 'Schulgi, Hirte', 'Ku-Aya, Bäckerin', 'Lugal-ezen, Ziegler'],
    ['Gaius Formularius', 'Marcus Aktenius', 'Iulia Sigilla', 'Lucius Stempelius', 'Claudia Tabula'],
    ['Bruder Stempelin', 'Kunz von Siegelsheim', 'Gertrud die Schreiberin', 'Meister Hinz', 'Hildegard von Aktenried'],
    ['Friedrich Wilhelm Ordnung', 'Wilhelmine Pünktlich', 'Karl August Laufzettel', 'Luise von Akten', 'Gottlieb Dienstweg'],
  ];
  D.SENDERS_MODERN = ['Fr. Huber', 'Hr. Wimmer', 'Fr. Dr. Aktenbach', 'Hr. Stempel', 'Fr. Öztürk', 'Hr. Nguyen', 'Fr. Kowalczyk',
    'Hr. Schmidt-Paragraf', 'Fr. Laufzettel', 'Hr. Brömmel', 'Fr. Siebenrock', 'Hr. Dr. Durchschlag', 'Fr. Pfennig', 'Hr. Ablage'];
  D.PLACES = ['Stempelfeld', 'Aktenried', 'Formularbach', 'Amtshausen', 'Paragrafenstein', 'Wartezimmern', 'Ober-Unterbach',
    'Klein-Bürokratzing', 'Durchschlagsdorf', 'Siegelsheim', 'Ablage-Süd', 'Sankt Vorgang', 'Bad Frist', 'Neu-Zuständig'];

  /* ---------- Stempeltexte ---------- */
  D.STAMPS = {
    correct: ['BEWILLIGT', 'GENEHMIGT', 'ERLEDIGT', 'GESEHEN', 'Z. d. A.', 'GEPRÜFT', 'ABGEZEICHNET'],
    wrong: 'UNZUSTÄNDIG', wider: 'WIDERSPRUCH', eilt: 'EILT!', auto: 'i. V.', eingang: 'EINGANG',
  };

  /* ---------- Amtsblatt (Laufband) ---------- */
  D.NEWS = {
    any: [
      'Amtsblatt: Die Wartezeit beträgt derzeit ca. „bald“.',
      'Bürgerumfrage ergibt: 94 % wünschen sich weniger Umfragen.',
      'Neue Dienstanweisung regelt das Anlegen neuer Dienstanweisungen.',
      'Kantine: Heute Eintopf nach Vorschrift 12b.',
      'Der Amtsschimmel wurde zuletzt im Treppenhaus gesehen. Hinweise an Zimmer 214.',
      'Fundbüro meldet: Ein Kugelschreiber „Eigentum des Amtes“ ist wieder aufgetaucht. Er war nie weg.',
      'Rechnungshof lobt Behörde: „Die Akten sind sehr ordentlich gestapelt.“',
      'Öffnungszeiten erweitert: jetzt auch donnerstags zwischen 9:00 und 9:05 Uhr.',
      'Arbeitskreis „Weniger Arbeitskreise“ tagt zum 40. Mal.',
      'Kaffeekasse ausgeglichen. Ermittlungen eingeleitet.',
      'Neuer Rekord: Formular in nur einem Versuch korrekt ausgefüllt.',
      'Personalrat fordert ergonomische Stempel.',
      'Pilotprojekt „Lächeln am Schalter“ nach zwei Tagen vorläufig ausgesetzt.',
      'Leserbrief: „Früher war mehr Durchschlag.“',
      'Stellenausschreibung: Sachbearbeitung (m/w/d) für die Ausschreibung von Stellen.',
      'Die Zuständigkeit für Zuständigkeiten liegt ab sofort beim Amt für Zuständigkeiten.',
      'Hausmitteilung: Bitte keine Akten im Kühlschrank lagern. Auch nicht „nur kurz“.',
      'Statistisches Amt: Jede dritte Statistik ist ausgedacht. Diese hier auch.',
      'Ein Bürger erschien pünktlich zu seinem Termin. Die Behörde prüft rechtliche Schritte.',
      'Das Amt bedankt sich für Ihre Geduld. Ihre Geduld ist uns wichtig. Bitte warten.',
      'Gutachten bestätigt: Das Gutachten war notwendig.',
      'Der Paternoster fährt wieder. In beide Richtungen gleichzeitig.',
      'Neues Leitbild in Arbeit. Vorläufiger Titel: „Neues Leitbild“.',
      'Archivar meldet: Ältestes Dokument ist eine Beschwerde über die Wartezeit.',
      'Umfrage: 100 % der Formulare würden sich wieder ausfüllen lassen.',
      'Wetter: heiter bis zuständig.',
      'Sport: Betriebssportgruppe gewinnt Staffellauf „Akte durchs Haus“.',
      'Rätsel der Woche: Wer hat den Locher zuletzt gesehen?',
      'Achtung: Der Eingangsstempel zeigt seit Montag das Datum von Freitag.',
      'Bürgerservice-Hotline jetzt erreichbar unter: besetzt.',
      'Gremium beschließt Pause. Pause wird vertagt.',
      'Neue Studie: Wer Formulare liest, füllt sie seltener aus.',
      'Hausmeister meldet: Aktenschrank 7 hat sich selbst einsortiert.',
      'Die Wartenummer 1.000.000 wurde gezogen. Der Glückliche erhält eine weitere Wartenummer.',
      'Vorschlagswesen: Idee „weniger Vorschläge“ wird geprüft.',
      'Stellungnahme zur Stellungnahme erscheint als Anlage zur Anlage.',
      'Amtsleitung lobt Mitarbeiterin des Monats. Sie war die einzige, die das Formular dafür eingereicht hat.',
      'Die Registratur ist umgezogen. Wohin, steht in einer Akte in der Registratur.',
      'Ein Kugelschreiber hat 40 Dienstjahre erreicht. Er schreibt nicht mehr, ist aber unkündbar.',
      'Telefonzentrale: „Ihr Anruf ist uns wichtig.“ Seit 1998 in Dauerschleife.',
      'Wetterdienst: In der Kantine zieht ein Tief über den Nachtisch.',
      'Aktenzeichen XY ungelöst: Wer hat den Stempel „Erledigt“ für privat benutzt?',
      'Bürger beschwert sich über zu schnelle Bearbeitung. Er hatte noch nicht fertig gewartet.',
      'Neue Dienstwagenregelung: Fahrräder müssen einen Fahrtenbuch-Anhänger ziehen.',
      'Betriebsrat fordert Recht auf Nichtzuständigkeit.',
      'Ausschreibung für neue Wartestühle läuft. Bis dahin wird gestanden.',
      'Der Amtsschimmel hat sich um eine Planstelle beworben. Sein Lebenslauf hat 14 Hufabdrücke.',
      'Rundschreiben: Bitte keine Rundschreiben mehr als „Allen antworten“ beantworten.',
      'Schulungsvideo „Richtig lochen“ jetzt in 4K.',
      'Erfolgsmeldung: Das Zwischenziel wurde zwischenzeitlich erreicht.',
      'Gerücht: Irgendwo im Keller gibt es ein Formular, das sich selbst ausfüllt.',
      'Amtliche Mitteilung: Diese Mitteilung ist amtlich.',
      'Bürgerfest am Samstag: Stempelwettbewerb, Lochertombola und Hüpfburg in Form eines Aktenordners.',
      'Neu im Fundbüro: drei Lesebrillen, ein Schirm und eine komplette Abteilung.',
      'Archiv meldet Platzmangel. Der Antrag auf mehr Platz wird archiviert.',
    ],
    0: ['Tempel meldet Rekordernte: 900 Krüge Bier verbucht.', 'Ziegelei liefert Tontafeln jetzt auch in Querformat.', 'Erster Fall von Schreibkrampf dokumentiert – auf einer Tontafel.', 'Keilschrift-Reform: Ab sofort nur noch 600 Zeichen.', 'Tontafel-Archiv wegen Hochwasser vorübergehend matschig.', 'Ein Schreiber hat sich am Griffel verletzt. Arbeitsschutz prüft die Spitze.'],
    1: ['Senat beschließt: Jeder Bürger muss sich zählen lassen. Bitte anstellen.', 'Alle Wege führen nach Rom. Die Formulare auch.', 'Ein kleines Dorf im Norden verweigert den Census. Rom schickt vier Legionen Formulare.', 'Tabularium meldet: Marmorregale bis 79 v. Chr. ausgebucht.', 'Cursus publicus: Pferdewechsel in Verzug, Bote wartet.', 'Neue Vorschrift: Lateinische Formulare nur noch in Großbuchstaben.'],
    2: ['Kanzlei sucht Kanzlisten mit ruhiger Hand und viel Zeit.', 'Burgherr beantragt Zugbrücke mit Gegenverkehr.', 'Ritter beschwert sich über Wartezeit am Burgtor: drei Tage.', 'Siegelwachs knapp: Bienen streiken.', 'Eilbote überholt Eilboten. Beide verspäten sich.', 'Mönch kopiert Urkunde fehlerfrei. Wird heiliggesprochen.'],
    3: ['Seine Majestät wünscht Ordnung in den Akten. Die Akten wünschen Ordnung in Seiner Majestät.', 'Neue Vorschrift: Dienstbeginn 7 Uhr, Dienstschluss bei Pflichterfüllung.', 'Kartoffelbefehl ausgegeben. Kartoffeln reagieren nicht.', 'Neue Aktenordnung: Rücken links, Titel oben, Beamter gerade.', 'Geheimer Rat befördert sich zum Geheimen Oberrat. Geheim.', 'Dienstanweisung zum korrekten Öffnen von Fenstern veröffentlicht (34 Seiten).'],
    4: ['Rohrpost erreicht Rekordgeschwindigkeit: Büchse landet im Nachbarort.', 'Fräulein vom Amt verbindet versehentlich zwei Ämter miteinander. Beide sind zufrieden.', 'Erste Schreibmaschine mit Umlauten! Das ü klemmt.', 'Schreibstube meldet: Farbbänder sind alle.', 'Telefon im Amt installiert. Niemand weiß, wen man anrufen soll.', 'Kaiserliche Verordnung über das Klingeln von Schreibmaschinen.'],
    5: ['Kommission legt Zwischenbericht zum Zwischenbericht vor.', 'Tischtelefon mit Wählscheibe ausgeliefert. Kabel reicht bis zur Kaffeemaschine.', 'Ölkrise: Amtsleitung fährt mit dem Paternoster zur Arbeit.', 'Faxgerät empfängt erstmals ein Fax. Belegschaft applaudiert.', 'Flughafen Schilda-Süd: Eröffnung wie geplant demnächst.', 'Durchschlagpapier wird knapp. Behörde druckt Durchschläge auf Durchschläge.'],
    6: ['Großrechner läuft seit 400 Tagen stabil. Niemand traut sich, ihn anzufassen.', 'Jahr-2000-Problem: Großrechner datiert alle Akten auf 1900. Die Kaiserzeit kehrt zurück.', 'Neues Programm „Formular 3.11“ startet in nur zwölf Minuten.', 'Diskettenlaufwerk verschluckt Antrag. Antrag gilt als gestellt.', 'Neues Passwort-Merkblatt: Passwort bitte nicht auf das Merkblatt schreiben.', 'E-Mail-Anschluss beantragt. Antrag per Brief versandt.'],
    7: ['E-Akte eingeführt! Zur Sicherheit wird jede Seite ausgedruckt.', 'Videokonferenz scheitert an der Frage: „Hören Sie mich?“', 'Portal „Bürgerservice online“ wegen Wartungsarbeiten an Werktagen geschlossen.', 'Fachverfahren-Update verschoben. Grund: Fachverfahren.', 'Digitalisierungsbeauftragter druckt seine Strategie aus.', 'Onlineformular ab sofort verfügbar. Bitte ausdrucken und unterschrieben einreichen.'],
    8: ['KI lehnt Antrag in 0,03 Sekunden ab. Begründung: ein Sonett.', 'Chatbot „Amtine“ beantwortet jede Frage mit einer Gegenfrage. Bürger fühlen sich verstanden.', 'Drohne liefert Bescheid. Der Hund des Empfängers widerspricht.', 'KI beantragt Urlaub. Antrag wird von KI genehmigt.', 'Ethikrat prüft, ob die KI den Ethikrat prüfen darf.', 'Smart City: Ampeln sind jetzt intelligent und rot.'],
    9: ['Weltamt eröffnet Außenstelle auf dem Mond. Öffnungszeiten: nach Mondphase.', 'Marskolonie beantragt eigene Zeitzone. Antrag wird in Erdzeit bearbeitet.', 'Asteroid erhält Hausnummer und muss Grundsteuer zahlen.', 'Interplanetares Aktenzeichen hat jetzt 48 Stellen.', 'Weltverwaltungsrat tagt. Ergebnis wird im nächsten Jahrhundert erwartet.', 'Gerücht: Ganz oben im Weltamt soll es einen Knopf geben.'],
  };

  /* ---------- Tipps des Amtsschimmels ---------- */
  // Reihenfolge = Priorität. when(S, C) entscheidet, wann ein Tipp kommt; er erscheint nur einmal.
  D.TIPS = [
    { id: 'start', when: (S) => S.stats.clicks === 0 && S.gt > 1.5, done: (S) => S.stats.clicks > 0, text: 'Wieher! Willkommen im Amt. Klick auf die Akte auf deinem Schreibtisch – oder drück die Leertaste –, um sie abzustempeln.' },
    { id: 'buy', when: (S) => S.akten >= 15 && !S.gens.schreiber, done: (S) => !!S.gens.schreiber || S.akten < 15, text: 'Du hast genug Akten für einen Tontafelschreiber. Unter „Haushalt“ kannst du ihn einstellen. Er arbeitet für dich, auch wenn du nicht stempelst.' },
    { id: 'upgrade', when: (S, C) => C.availableUpgrades().length > 0 && S.ups && Object.keys(S.ups).length === 0 && S.gt > 20, text: 'Unter „Verbesserungen“ wartet etwas. Verbesserungen machen dein Personal dauerhaft schneller.' },
    { id: 'ressort', when: (S, C) => C.activeRessorts().length >= 2, text: 'Neu in Rom: Zuständigkeiten! Jede Akte gehört zu einem Ressort. Drück den passenden Ressortstempel (oder die Tasten 1–6): Das bringt viel mehr als der Eingangsstempel und baut Arbeitsfluss auf. Aber Vorsicht – der falsche Stempel erzeugt einen Widerspruch.' },
    { id: 'gremium', when: (S) => S.era >= 1 && S.akten >= 2500 && !S.grem.ausschuss, text: 'Ein Ausschuss tagt nie umsonst: Er beschließt Vorschriften (§). Mit Vorschriften erlässt du unter „Paragrafen“ mächtige Regeln – und angesammelte Vorschriften steigern deine Produktion.' },
    { id: 'para', when: (S) => S.vor >= 1 && Object.keys(S.paras).length === 0, text: 'Deine erste Vorschrift ist beschlossen! Unter „Paragrafen“ kannst du sie in Kraft setzen. Tipp: Gespartes vermehrt sich – Vorschriften erzeugen Vorschriften.' },
    { id: 'eilt', when: (S) => S.korb && S.korb.doc && S.korb.doc.type === 'eilt', text: 'EILT! Dieser Vorgang hat eine Frist. Stemple ihn rechtzeitig mit dem richtigen Ressort ab, dann gibt es einen dicken Bonus.' },
    { id: 'wider', when: (S) => S.stats.wrong >= 1, text: 'Falscher Stempel – das gibt einen Widerspruch. Keine Sorge: Er kommt bald zurück und braucht dann zwei richtige Stempel. Absichtlich falsch stempeln lohnt sich also nicht – und der Arbeitsfluss ist auch weg.' },
    { id: 'schimmel', when: (S) => S.stats.schimmel === 0 && S.schimmel && S.schimmel.active, done: (S) => !S.schimmel.active, text: 'Da! Das bin ich – also, mein Kollege. Fang den Amtsschimmel, bevor er weg ist. Er bringt Glück.' },
    { id: 'anliegen', when: (S) => S.anliegen && S.anliegen.cur && S.stats.anliegen === 0, text: 'Kundschaft am Schalter! Bürgeranliegen haben mehrere Antworten. Jede hat ihre eigenen Folgen – manchmal lohnt sich Mut.' },
    { id: 'form', when: (S) => Object.keys(S.forms).length >= 1 && S.stats.formsFound <= 1, text: 'Ein Formular für dein Album! Formulare bleiben für immer, auch nach einer Reform. Jedes neue steigert deine Produktion, volle Ordner geben Sonderboni.' },
    { id: 'reform', when: (S, C) => C.djGain() >= 1 && S.stats.reforms === 0, text: 'Es ist Zeit für eine Verwaltungsreform! Du fängst von vorn an, bekommst aber Dienstjahre (dauerhaft mehr Produktion) und Pensionspunkte für deine Laufbahn. Je länger du wartest, desto mehr gibt es.' },
    { id: 'leitbild', when: (S) => S.stats.reforms >= 1 && Object.keys(S.visited).length === 1 && S.gt > 60, text: 'Bei jeder Reform wählst du ein Leitbild. Jedes ändert die Regeln. Das erste Mal in einem neuen Leitbild gibt dauerhaft +5 %. Aber Achtung: Dasselbe Leitbild zweimal hintereinander macht die Belegschaft reformmüde.' },
    { id: 'flughafen', when: (S) => S.era >= 5 && !S.flags.tipFlug, text: 'In der Bundesrepublik gibt es Großprojekte! Der Flughafen Schilda-Süd sucht Geldgeber. Er wird ganz bestimmt pünktlich fertig.' },
    { id: 'portal', when: (S) => S.era >= 9, text: 'Das Weltamt! Unter „Großprojekte“ wartet der Ein-Klick-Antrag – das letzte Ziel der Verwaltung. Dafür musst du mindestens fünf verschiedene Leitbilder erlebt haben.' },
  ];

  /* ---------- Sprüche des Amtsschimmels (Zufall, wenn man ihn anklickt) ---------- */
  D.QUIPS = [
    'Wieher. Das macht dann 12 Euro Bearbeitungsgebühr.',
    'Ich bin nicht stur. Ich bin vorschriftsmäßig.',
    'Haben Sie eine Wartemarke gezogen?',
    'Mein Großvater hat schon in Ur gewiehert. Auf Keilschrift.',
    'Hafer? Nur gegen Quittung.',
    'Formular 08/15 ist mein Lieblingsformular. Es passt zu allem.',
    'Ich galoppiere nicht. Ich beschleunige das Verfahren.',
    'Wer zuerst stempelt, stempelt zuerst.',
    'Mittagspause ist von 12 bis 12. Flexibel.',
    'Ohne Aktenzeichen kein Vorgang. Ohne Vorgang kein Hafer.',
  ];
})(typeof window !== 'undefined' ? window : globalThis);
