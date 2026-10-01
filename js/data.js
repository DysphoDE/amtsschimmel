'use strict';
/* Amtsschimmel – Spielinhalte: Epochen, Ressorts, Generatoren, Gremien, Verbesserungen, Großprojekte.
   Effekte (fx) werden in core.js ausgewertet. */
(function (root) {
  const AS = (root.AS = root.AS || {});
  const D = (AS.D = AS.D || {});

  /* ---------- Epochen ---------- */
  // at = im laufenden Durchgang erarbeitete Akten, ab denen die Epoche beginnt
  D.ERAS = [
    { id: 'ur', name: 'Tontafel-Registratur', place: 'Ur', year: '2100 v. Chr.', date: '2100 v. Chr.', at: 0, ressorts: 0,
      text: 'In der Tempelverwaltung von Ur ritzt ein Schreiber die erste Quittung der Menschheit in feuchten Ton: dreißig Krüge Bier, ordnungsgemäß verbucht. Die Verwaltung ist geboren – und sie hat Durst.' },
    { id: 'rom', name: 'Tabularium', place: 'Rom', year: '78 v. Chr.', date: 'Id. Mart. DCLXXVI', at: 500, ressorts: 2,
      text: 'Rom baut ein Staatsarchiv aus Marmor. Wer Bürger ist, steht im Census; wer nicht drinsteht, existiert nicht. Zum ersten Mal gibt es Zuständigkeiten – und damit die Frage, wer nicht zuständig ist.' },
    { id: 'mittelalter', name: 'Kanzlei', place: 'Mittelalter', year: '1250', date: 'Anno Domini 1250', at: 6e4, ressorts: 3,
      text: 'Kanzlisten führen Urkundenbücher, das Siegel ersetzt die Unterschrift. Eilboten reiten durchs Land – mit Fristen, die man im Kerzenschein verpasst.' },
    { id: 'preussen', name: 'Preußische Aktenordnung', place: 'Preußen', year: '1800', date: '1. October 1800', at: 8e6, ressorts: 3,
      text: 'Alles hat seine Ordnung, und die Ordnung hat Akten. Der preußische Beamte ist pünktlich, unbestechlich und vollkommen unzuständig für alles, was nicht in seiner Akte steht.' },
    { id: 'kaiserzeit', name: 'Rohrpost & Schreibmaschine', place: 'Kaiserzeit', year: '1900', date: '1. Okt. 1900', at: 1.5e9, ressorts: 4,
      text: 'Durch die Wände zischen Rohrpostbüchsen, in den Schreibstuben klappern Maschinen. Formulare werden gedruckt – zum ersten Mal kann man sie falsch ausfüllen.' },
    { id: 'brd', name: 'Durchschlag & Fax', place: 'Bundesrepublik', year: '1975', date: '01.10.1975', at: 8e11, ressorts: 4,
      text: 'Alles in dreifacher Ausfertigung, Durchschlag an die Registratur. Das Faxgerät piept, die Kommission tagt, und irgendwo am Stadtrand wird ein Flughafen geplant.' },
    { id: 'edv', name: 'Behörden-EDV', place: 'Rechenzentrum', year: '1995', date: '01.10.95', at: 8e14, ressorts: 5,
      text: 'Der Großrechner im Keller verwaltet alles – sofern man das Formular zur Beantragung von Rechenzeit korrekt ausgefüllt hat. Auf den Schreibtischen leuchten grüne Buchstaben.' },
    { id: 'egov', name: 'E-Government', place: 'Digitalamt', year: '2015', date: '2015-10-01', at: 1.5e18, ressorts: 5,
      text: 'Die E-Akte kommt! Sie wird ausgedruckt, unterschrieben, eingescannt und als PDF per Post verschickt. Das Fachverfahren läuft stabil – im Kompatibilitätsmodus.' },
    { id: 'ki', name: 'KI-Verwaltung', place: 'Smart City', year: '2035', date: '2035-10-01T09:00', at: 3e23, ressorts: 6,
      text: 'Künstliche Intelligenz bearbeitet Anträge in Millisekunden. Leider verlangt sie für jede Entscheidung einen Antrag auf Erläuterung der Entscheidung.' },
    { id: 'weltamt', name: 'Das Weltamt', place: 'Orbit', year: '2200', date: 'Sternzeit 2200.10', at: 3e26, ressorts: 6,
      text: 'Die Verwaltung hat den Planeten verlassen. Im Weltamt laufen die Akten der Menschheit zusammen – und ganz oben wartet der eine Antrag, der alle anderen überflüssig macht.' },
  ];

  /* ---------- Ressorts (Zuständigkeiten) ---------- */
  D.RESSORTS = [
    { id: 'bau', name: 'Bauwesen', short: 'Bau', color: '#b03a2e', key: '1' },
    { id: 'ord', name: 'Ordnung', short: 'Ordnung', color: '#2a62a8', key: '2' },
    { id: 'fin', name: 'Finanzen', short: 'Finanzen', color: '#a8780a', key: '3' },
    { id: 'soz', name: 'Soziales', short: 'Soziales', color: '#2c8549', key: '4' },
    { id: 'umw', name: 'Umwelt', short: 'Umwelt', color: '#11806e', key: '5' },
    { id: 'kul', name: 'Kultur & Schule', short: 'Kultur', color: '#76399a', key: '6' },
  ];

  /* ---------- Generatoren: Personal, Sachmittel, Technik ---------- */
  // cat: person | sache | technik
  D.GENS = [
    { id: 'schreiber', name: 'Tontafelschreiber', plural: 'Tontafelschreiber', era: 0, cat: 'person', cost: 15, prod: 0.1,
      desc: 'Ritzt Keilschrift in feuchten Ton. Langsam, aber das Archiv hält 4000 Jahre.' },
    { id: 'siegel', name: 'Siegelbewahrer', plural: 'Siegelbewahrer', era: 0, cat: 'person', cost: 120, prod: 0.9,
      desc: 'Rollt das Rollsiegel ab. Ohne Siegel kein Vorgang, ohne Vorgang kein Siegel.' },
    { id: 'tabularium', name: 'Tabularium', plural: 'Tabularien', era: 1, cat: 'sache', cost: 1300, prod: 7,
      desc: 'Ein Staatsarchiv aus Marmor. Akten hinein, nie wieder heraus.' },
    { id: 'bote', name: 'Amtsbote', plural: 'Amtsboten', era: 1, cat: 'person', cost: 14000, prod: 45,
      desc: 'Trägt Akten von A nach B. Und zurück, weil B nicht zuständig ist.' },
    { id: 'kanzlist', name: 'Kanzlist', plural: 'Kanzlisten', era: 2, cat: 'person', cost: 150000, prod: 280,
      desc: 'Schönschrift, Gänsekiel, Engelsgeduld. Kopiert Urkunden im Akkord.' },
    { id: 'amtsstube', name: 'Amtsstube', plural: 'Amtsstuben', era: 2, cat: 'sache', cost: 1.7e6, prod: 1700,
      desc: 'Ein Raum mit Schalter, Wartebank und einem Schild: „Komme gleich“.' },
    { id: 'registratur', name: 'Hängeregistratur', plural: 'Hängeregistraturen', era: 3, cat: 'sache', cost: 2.2e7, prod: 10000,
      desc: 'Preußische Ordnung in Eiche. Jede Akte hat ihren Platz, nur weiß keiner, welchen.' },
    { id: 'sekretaer', name: 'Geheimer Sekretär', plural: 'Geheime Sekretäre', era: 3, cat: 'person', cost: 3e8, prod: 60000,
      desc: 'Pünktlich, gründlich, unbestechlich – und seit 1803 nicht aus dem Urlaub zurück.' },
    { id: 'rohrpost', name: 'Rohrpostanlage', plural: 'Rohrpostanlagen', era: 4, cat: 'technik', cost: 5e9, prod: 360000,
      desc: 'Zisch – plopp – Akte da. Manchmal auch: Zisch – plopp – Akte im Keller der Nachbarbehörde.' },
    { id: 'schreibstube', name: 'Schreibstube', plural: 'Schreibstuben', era: 4, cat: 'technik', cost: 1e11, prod: 2.2e6,
      desc: 'Zehn Schreibmaschinen, ein Klingeln am Zeilenende und Tipp-Ex in Literflaschen.' },
    { id: 'fax', name: 'Faxgerät', plural: 'Faxgeräte', era: 5, cat: 'technik', cost: 2.5e12, prod: 1.4e7,
      desc: 'Piept, kreischt, druckt. Die Behörde liebt es, denn ein Fax ist rechtssicher.' },
    { id: 'kopierer', name: 'Kopierer', plural: 'Kopierer', era: 5, cat: 'technik', cost: 7e13, prod: 9e7,
      desc: 'Macht aus einer Akte drei: Ausfertigung, Durchschlag, Durchschlag vom Durchschlag.' },
    { id: 'grossrechner', name: 'Großrechner', plural: 'Großrechner', era: 6, cat: 'technik', cost: 2.5e15, prod: 6e8,
      desc: 'Füllt den Keller, kühlt mit Flusswasser und rechnet nachts die Hundesteuer.' },
    { id: 'terminal', name: 'Bildschirmarbeitsplatz', plural: 'Bildschirmarbeitsplätze', era: 6, cat: 'technik', cost: 1e17, prod: 4e9,
      desc: 'Grüne Schrift auf Schwarz, Tastatur aus Gusseisen, Rückenschmerzen inklusive.' },
    { id: 'fachverfahren', name: 'Fachverfahren', plural: 'Fachverfahren', era: 7, cat: 'technik', cost: 5e18, prod: 2.8e10,
      desc: 'Läuft nur im Kompatibilitätsmodus, aber dafür seit 2004 ohne ein einziges Update.' },
    { id: 'eakte', name: 'E-Akte', plural: 'E-Akten', era: 7, cat: 'technik', cost: 3e20, prod: 2e11,
      desc: 'Die papierlose Akte. Wird zur Sicherheit ausgedruckt und abgeheftet.' },
    { id: 'ki', name: 'KI-Sachbearbeiter', plural: 'KI-Sachbearbeiter', era: 8, cat: 'technik', cost: 1e24, prod: 2e12,
      desc: 'Bearbeitet zehntausend Anträge pro Sekunde und begründet jede Ablehnung mit einem Gedicht.' },
    { id: 'weltamt', name: 'Weltamt', plural: 'Weltämter', era: 9, cat: 'technik', cost: 1e27, prod: 3e13,
      desc: 'Eine Behörde von der Größe eines Mondes. Hat eine eigene Postleitzahl und eigenes Wetter.' },
  ];

  /* ---------- Gremien: erzeugen Vorschriften (§) ---------- */
  D.GREMIEN = [
    { id: 'ausschuss', name: 'Ausschuss', plural: 'Ausschüsse', era: 1, cost: 4000, vps: 0.02,
      desc: 'Tagt dienstags. Beschließt, nächsten Dienstag weiterzutagen.' },
    { id: 'arbeitskreis', name: 'Arbeitskreis', plural: 'Arbeitskreise', era: 3, cost: 3e7, vps: 0.16,
      desc: 'Bildet zur Klärung jeder Frage einen Unterarbeitskreis.' },
    { id: 'kommission', name: 'Kommission', plural: 'Kommissionen', era: 5, cost: 1e12, vps: 1.2,
      desc: 'Legt nach drei Jahren einen 900-seitigen Zwischenbericht vor. Fortsetzung folgt.' },
    { id: 'beirat', name: 'Beirat', plural: 'Beiräte', era: 7, cost: 5e18, vps: 9,
      desc: 'Berät die Kommission bei der Frage, wer den Ausschuss berät.' },
    { id: 'weltrat', name: 'Weltverwaltungsrat', plural: 'Weltverwaltungsräte', era: 9, cost: 1e27, vps: 70,
      desc: 'Tagt in 190 Sprachen gleichzeitig. Protokoll folgt in 190 Jahren.' },
  ];

  // Grammatisches Geschlecht für Texte wie „dein erster Kopierer“ / „deine erste Amtsstube“ / „dein erstes Faxgerät“
  const GENUS = { tabularium: 'n', amtsstube: 'f', registratur: 'f', rohrpost: 'f', schreibstube: 'f', fax: 'n', fachverfahren: 'n', eakte: 'f', weltamt: 'n' };
  D.GENS.forEach((g) => { g.genus = GENUS[g.id] || 'm'; });
  D.erste = (g, cap) => { const w = { m: 'erster', f: 'erste', n: 'erstes' }[g.genus || 'm']; return (cap ? w[0].toUpperCase() + w.slice(1) : w) + ' ' + g.name; };
  D.GEN = {}; D.GENS.forEach((g, i) => { g.idx = i; D.GEN[g.id] = g; });
  D.GREM = {}; D.GREMIEN.forEach((g, i) => { g.idx = i; D.GREM[g.id] = g; });

  /* ---------- Verbesserungen ---------- */
  // Stufen-Verbesserungen je Generator: ab Anzahl at, Kosten = Grundpreis × c
  D.TIERS = [{ at: 1, c: 10, x: 2 }, { at: 10, c: 60, x: 2 }, { at: 25, c: 700, x: 2 }, { at: 50, c: 9000, x: 2 }, { at: 100, c: 4e5, x: 3 }];
  const TIER_NAMES = {
    schreiber: ['Feuchter Ton', 'Spitzer Griffel', 'Keilschrift-Kurzform', 'Brennofen für Tafeln', 'Schreiberschule von Nippur'],
    siegel: ['Rollsiegel aus Lapislazuli', 'Siegelkissen aus Lehm', 'Doppelsiegel', 'Siegelrecht des Tempels', 'Großsiegelbewahrer'],
    tabularium: ['Marmorregal', 'Inventarnummern', 'Zweites Stockwerk', 'Tabularium-Index', 'Archiv für die Ewigkeit'],
    bote: ['Bequeme Sandalen', 'Cursus publicus', 'Pferdewechselstation', 'Botentasche mit Siegel', 'Eilbote mit Fackel'],
    kanzlist: ['Spitzerer Gänsekiel', 'Nachfüllbares Tintenfass', 'Kanzleischrift', 'Lesestein aus Beryll', 'Kanzleiordnung'],
    amtsstube: ['Wartebank', 'Schalterfenster', 'Schild „Komme gleich“', 'Öffnungszeiten (Di 9–11 Uhr)', 'Zweiter Schalter (geschlossen)'],
    registratur: ['Aktendeckel', 'Hängemappen', 'Registraturplan', 'Aktenzeichen nach Schema F', 'Rollregalanlage'],
    sekretaer: ['Ärmelschoner', 'Stehpult', 'Dienstsiegel am Revers', 'Pensionsanspruch', 'Geheimer Oberregierungsrat'],
    rohrpost: ['Gepolsterte Büchsen', 'Weichenstation', 'Druckluftkompressor', 'Anschluss zum Bahnhof', 'Rohrpost mit Rückschein'],
    schreibstube: ['Neues Farbband', 'Tipp-Ex', 'Durchschlagpapier', 'Elektrische Schreibmaschine', 'Kugelkopf'],
    fax: ['Thermopapier', 'Sendebericht', 'Faxabruf', 'Faxweiche', 'Rechtssicheres Fax'],
    kopierer: ['Toner nachfüllen', 'Papierstau-Handbuch', 'Sortierfunktion', 'Beidseitiger Druck', 'Kopierer mit Hefter'],
    grossrechner: ['Lochkarten', 'Magnetband', 'Klimaanlage', 'Nachtlauf', 'Zweiter Großrechner (Reserve)'],
    terminal: ['Blendschutzfilter', 'Ergonomische Tastatur', 'Zweiter Monitor', 'Bildschirmschoner „Aquarium“', 'Bildschirmarbeitsverordnung'],
    fachverfahren: ['Kompatibilitätsmodus', 'Hotfix vom Freitagnachmittag', 'Schnittstelle zur Schnittstelle', 'Release 2.0 (Beta)', 'Migration (geplant seit 2009)'],
    eakte: ['Scanstraße', 'Elektronische Signatur', 'PDF/A', 'Medienbruchfreiheit (Pilotprojekt)', 'Vollständig papierlos (mit Ausdruck)'],
    ki: ['Trainingsdaten aus 4000 Jahren', 'Halluzinationsfilter', 'Erklärbarkeitsmodul', 'KI prüft KI', 'Superintelligenz (Besoldungsgruppe A 13)'],
    weltamt: ['Orbitale Registratur', 'Zeitzonen-Stempel', 'Mondpost', 'Interplanetares Aktenzeichen', 'Die Ewige Behörde'],
  };
  const TIER_FLAVOR = [
    'Ein Anfang ist gemacht.',
    'Hat sich im Pilotprojekt bewährt.',
    'Laut Dienstanweisung jetzt verpflichtend.',
    'Wurde von drei Gremien einstimmig empfohlen.',
    'Gilt fortan als „haben wir schon immer so gemacht“.',
  ];

  D.UPGRADES = [];
  D.GENS.forEach((g) => {
    D.TIERS.forEach((t, k) => {
      D.UPGRADES.push({
        id: 't_' + g.id + '_' + k, kind: 'tier', gen: g.id, tier: k, era: g.era,
        name: TIER_NAMES[g.id][k], cost: g.cost * t.c,
        desc: g.plural + ' arbeiten ' + (t.x === 3 ? 'dreimal' : 'doppelt') + ' so schnell.',
        flavor: TIER_FLAVOR[k],
        req: { gen: g.id, n: t.at },
        fx: [{ t: 'gen', id: g.id, x: t.x }],
      });
    });
  });

  // Synergien: Ziel-Generator +a je Stück des Quell-Generators
  const SYN = [
    ['syn_bote', 'Botengang zum Tabularium', 'tabularium', 'bote', 0.02, 1, 'Wer Akten bringt, braucht Regale.'],
    ['syn_siegel', 'Siegelpflicht', 'kanzlist', 'siegel', 0.01, 2, 'Keine Urkunde ohne Siegel – und Siegel gibt es reichlich.'],
    ['syn_stube', 'Schalterstunden', 'amtsstube', 'bote', 0.01, 2, 'Die Boten bringen die Kundschaft gleich mit.'],
    ['syn_reg', 'Ablageordnung', 'registratur', 'kanzlist', 0.01, 3, 'Jeder Kanzlist bekommt eine eigene Hängemappe.'],
    ['syn_dienstweg', 'Dienstweg', 'sekretaer', 'amtsstube', 0.01, 3, 'Alles muss über den Tisch des Sekretärs.'],
    ['syn_rohr', 'Rohrpostanschluss', 'rohrpost', 'registratur', 0.01, 4, 'Jede Registratur bekommt ihr eigenes Rohr.'],
    ['syn_diktat', 'Diktat', 'schreibstube', 'sekretaer', 0.01, 4, '„Fräulein, zum Diktat!“ – „Ich bin Oberinspektorin.“'],
    ['syn_faxabruf', 'Fax an alle', 'fax', 'schreibstube', 0.01, 5, 'Was getippt ist, muss gefaxt werden.'],
    ['syn_durchschlag', 'Durchschlag per Fax', 'kopierer', 'fax', 0.01, 5, 'Jedes Fax wird zur Sicherheit kopiert.'],
    ['syn_stapel', 'Stapelverarbeitung', 'grossrechner', 'kopierer', 0.01, 6, 'Lochkarten werden jetzt kopiert, nicht gestanzt.'],
    ['syn_terminal', 'Terminalanschluss', 'terminal', 'grossrechner', 0.01, 6, 'Jedes Terminal darf jetzt auch rechnen. Ein bisschen.'],
    ['syn_schnitt', 'Schnittstelle', 'fachverfahren', 'terminal', 0.01, 7, 'Die Schnittstelle zur Schnittstelle läuft.'],
    ['syn_scan', 'Scan-Offensive', 'eakte', 'kopierer', 0.01, 7, 'Kopierer scannen jetzt – nach dem Kopieren.'],
    ['syn_training', 'Trainingsdaten', 'ki', 'eakte', 0.01, 8, 'Jede E-Akte ist ein Lehrbuch für die KI.'],
    ['syn_planet', 'Planetare Ablage', 'weltamt', 'ki', 0.01, 9, 'Die KI sortiert, das Weltamt archiviert.'],
  ];
  SYN.forEach(([id, name, target, src, a, era, flavor]) => {
    D.UPGRADES.push({
      id, kind: 'syn', name, era, flavor,
      cost: D.GEN[target].cost * 25,
      desc: D.GEN[target].plural + ' +' + Math.round(a * 100) + ' % je ' + D.GEN[src].name + '.',
      req: { gen: target, n: 5, gen2: src, n2: 5 },
      fx: [{ t: 'syn', id: target, src, a }],
    });
  });

  // Traditionspflege: Tontafelschreiber profitieren von allen anderen Generatoren
  [[0.1, 1, 1e4], [0.5, 2, 2e6], [5, 4, 3e10], [50, 5, 4e13], [500, 7, 2e19]].forEach(([a, era, cost], k) => {
    D.UPGRADES.push({
      id: 'trad_' + k, kind: 'trad', era, cost,
      name: ['Traditionspflege', 'Altgedienter Schreiber', 'Ehrenamtliche Keilschrift', 'Museum der Verwaltung', 'Weltkulturerbe Tontafel'][k],
      desc: 'Jeder Tontafelschreiber erledigt +' + U_fmt(a) + ' Akten/s je anderem Generator.',
      flavor: 'Die Alten zeigen den Jungen, wie man es schon immer gemacht hat.',
      req: { gen: 'schreiber', n: [1, 25, 50, 100, 150][k] },
      fx: [{ t: 'flatPer', id: 'schreiber', a }],
    });
  });

  // Stempel, Zuständigkeit, Arbeitsfluss, Fristen, Formulare, Schimmel, Gremien
  // Kosten unter 1000 sind Faktoren auf die Epochenschwelle (bzw. 50 Akten in Epoche 0), größere Werte absolut
  const ec = (era, c) => (c >= 1000 ? c : Math.max(50, D.ERAS[era].at) * c);
  const S = (id, name, era, cost, desc, fx, flavor, req) => D.UPGRADES.push({ id, kind: 'misc', name, era, cost: ec(era, cost), desc, fx, flavor, req });
  S('st1', 'Stempelkissen', 0, 60, 'Alle Stempel ×1,5.', [{ t: 'click', x: 1.5 }], 'Rotes Stempelkissen, frisch getränkt.', { clicks: 20 });
  S('st2', 'Holzgriff', 0, 600, 'Alle Stempel ×1,5.', [{ t: 'click', x: 1.5 }], 'Liegt gut in der Hand. Sehr gut.', { clicks: 150 });
  S('st3', 'Siegelring', 2, 7, 'Jeder Stempel bringt zusätzlich 0,1 % deiner Produktion.', [{ t: 'clickPct', a: 0.001 }], 'Der Ring der Macht, Kanzleiausführung.', { clicks: 500 });
  S('st4', 'Gummistempel', 4, 6, 'Stempel +0,1 % der Produktion.', [{ t: 'clickPct', a: 0.001 }], 'Erfunden 1866. Die Verwaltung war nie wieder dieselbe.', { clicks: 1500 });
  S('st5', 'Selbstfärbender Stempel', 5, 5, 'Stempel +0,1 % der Produktion.', [{ t: 'clickPct', a: 0.001 }], 'Färbt sich selbst. Und den Schreibtisch.', { clicks: 3000 });
  S('st6', 'Datumsstempel', 6, 5, 'Stempel +0,1 % der Produktion.', [{ t: 'clickPct', a: 0.001 }], 'Zeigt zuverlässig das Datum von gestern.', { clicks: 5000 });
  S('st7', 'Digitaler Stempel', 7, 5, 'Stempel +0,1 % der Produktion.', [{ t: 'clickPct', a: 0.001 }], 'Ein Stempel-Icon. Rechtlich umstritten, optisch überzeugend.', { clicks: 8000 });
  S('st8', 'Qualifizierte Signatur', 8, 5, 'Stempel +0,15 % der Produktion.', [{ t: 'clickPct', a: 0.0015 }], 'Benötigt Kartenleser, PIN, PUK und einen ruhigen Puls.', { clicks: 12000 });
  S('st9', 'Quantenstempel', 9, 5, 'Stempel +0,15 % der Produktion.', [{ t: 'clickPct', a: 0.0015 }], 'Stempelt alle Akten gleichzeitig – solange keiner hinsieht.', { clicks: 18000 });

  S('zs1', 'Zuständigkeitsverzeichnis', 1, 5, 'Ressortstempel ×1,25.', [{ t: 'stamp', x: 1.25 }], 'Eine Wachstafel mit allen Zuständigkeiten. Fast allen.', { correct: 25 });
  S('zs2', 'Geschäftsverteilungsplan', 3, 6, 'Ressortstempel ×1,25.', [{ t: 'stamp', x: 1.25 }], 'Achtzig Seiten, drei Anlagen, ein Organigramm in Farbe.', { correct: 300 });
  S('zs3', 'Organigramm an der Wand', 5, 5, 'Ressortstempel ×1,25.', [{ t: 'stamp', x: 1.25 }], 'Mit Pfeilen. Viele Pfeile.', { correct: 1200 });
  S('zs4', 'Zuständigkeitsfinder', 7, 5, 'Ressortstempel ×1,25.', [{ t: 'stamp', x: 1.25 }], 'Online! Antwortet auf alles mit „Bitte wenden Sie sich an Ihre zuständige Stelle“.', { correct: 4000 });

  S('fl1', 'Bürostuhl mit Armlehne', 1, 12, 'Arbeitsfluss-Maximum +10.', [{ t: 'flowMax', a: 10 }], 'Endlich Halt beim Stempeln.', { flow: 10 });
  S('fl2', 'Ergonomische Stempelhaltung', 3, 25, 'Arbeitsfluss-Maximum +10.', [{ t: 'flowMax', a: 10 }], 'Seminar „Rückengerecht stempeln“, zwei Tage, mit Zertifikat.', { flow: 20 });
  S('fl3', 'Doppelmonitor', 6, 4, 'Arbeitsfluss-Maximum +10.', [{ t: 'flowMax', a: 10 }], 'Links die Akte, rechts das Formular, dazwischen der Kaffee.', { flow: 30 });
  S('fl4', 'Flow-Zustand (dienstlich anerkannt)', 8, 4, 'Arbeitsfluss-Maximum +10.', [{ t: 'flowMax', a: 10 }], 'Darf nur während der Kernarbeitszeit eintreten.', { flow: 40 });

  S('ei1', 'Eilbote', 2, 5, 'EILT-Vorgänge bringen 25 % mehr.', [{ t: 'eilt', x: 1.25 }], 'Reitet schneller als die Frist.', { eilt: 3 });
  S('ei2', 'Rote Wiedervorlagemappe', 4, 20, 'EILT-Fristen +4 Sekunden.', [{ t: 'eiltTime', a: 4 }], 'Rot heißt dringend. Dunkelrot heißt sehr dringend.', { eilt: 15 });
  S('ei3', 'Fristenkalender', 6, 2, 'EILT-Vorgänge erscheinen 50 % häufiger und bringen 25 % mehr.', [{ t: 'eiltFreq', x: 1.5 }, { t: 'eilt', x: 1.25 }], 'Mit Wochenenden, Feiertagen und Brückentagen.', { eilt: 40 });

  S('wi1', 'Widerspruchsstelle', 2, 13, 'Widersprüche bringen 25 % mehr.', [{ t: 'wider', x: 1.25 }], 'Wer widerspricht, hat zwei Formulare mehr gewonnen.', { wider: 5 });
  S('wi2', 'Abhilfebescheid', 5, 6, 'Widersprüche bringen 25 % mehr.', [{ t: 'wider', x: 1.25 }], 'Dem Widerspruch wird abgeholfen. Irgendwann.', { wider: 25 });

  S('fo1', 'Formularschrank', 2, 16, 'Formulare werden 25 % häufiger gefunden.', [{ t: 'formRate', x: 1.25 }], 'Drei Türen, siebzehn Fächer, ein Schlüssel (verloren).', { forms: 3 });
  S('fo2', 'Vordruckverlag', 4, 13, 'Formulare werden 25 % häufiger gefunden.', [{ t: 'formRate', x: 1.25 }], 'Druckt Vordrucke für Vordrucke.', { forms: 12 });

  S('sc1', 'Hafer am Fenstersims', 1, 16, 'Der Amtsschimmel kommt 15 % häufiger vorbei.', [{ t: 'schimFreq', x: 1.15 }], 'Ein Pferd kommt selten allein – meistens wegen Hafer.', { schimmel: 1 });
  S('sc2', 'Striegel und Bürste', 3, 50, 'Amtsschimmel-Effekte halten 30 % länger.', [{ t: 'schimDur', x: 1.3 }], 'Ein gepflegter Schimmel bleibt länger gut gelaunt.', { schimmel: 5 });
  S('sc3', 'Zaumzeug mit Dienstsiegel', 5, 10, 'Der Amtsschimmel bleibt 5 Sekunden länger und kommt 15 % häufiger.', [{ t: 'schimLife', a: 5 }, { t: 'schimFreq', x: 1.15 }], 'Ordnungsgemäß gesiegelt, damit er nicht durchgeht.', { schimmel: 15 });
  S('sc4', 'Stall im Innenhof', 7, 3, 'Amtsschimmel-Effekte halten 30 % länger.', [{ t: 'schimDur', x: 1.3 }], 'Baugenehmigung liegt vor (vorläufig).', { schimmel: 40 });

  S('gr1', 'Sitzungskalender', 2, 3, 'Gremien beschließen 50 % mehr Vorschriften.', [{ t: 'v', x: 1.5 }], 'Jeden Dienstag, außer an Dienstagen.', { grem: 5 });
  S('gr2', 'Sitzungsgeld', 4, 7, 'Gremien beschließen doppelt so viele Vorschriften.', [{ t: 'v', x: 2 }], 'Plötzlich sind alle Mitglieder pünktlich.', { grem: 20 });
  S('gr3', 'Protokollführung', 6, 3, 'Gremien beschließen doppelt so viele Vorschriften.', [{ t: 'v', x: 2 }], 'Was nicht im Protokoll steht, wurde nicht beschlossen. Was drinsteht, auch nicht unbedingt.', { grem: 40 });
  S('gr4', 'Videokonferenz', 7, 2, 'Gremien beschließen doppelt so viele Vorschriften.', [{ t: 'v', x: 2 }], '„Sie sind stummgeschaltet.“ – „Ich weiß.“', { grem: 60 });
  S('gr5', 'Hologremium', 9, 3, 'Gremien beschließen dreimal so viele Vorschriften.', [{ t: 'v', x: 3 }], 'Alle Mitglieder gleichzeitig anwesend – als Projektion.', { grem: 90 });

  S('gl1', 'Amtsblatt', 1, 6, 'Gesamtproduktion +3 %.', [{ t: 'prod', x: 1.03 }], 'Erscheint wöchentlich, gelesen von dreizehn Menschen.', null);
  S('gl2', 'Kaffeeküche', 3, 4, 'Gesamtproduktion +4 %.', [{ t: 'prod', x: 1.04 }], 'Mit Kaffeekasse und Zettel „Wer hat meinen Joghurt gegessen?“', null);
  S('gl3', 'Betriebsausflug', 5, 2, 'Gesamtproduktion +5 %.', [{ t: 'prod', x: 1.05 }], 'Ins Aktenmuseum. Mit Busfahrt und Kartoffelsalat.', null);
  S('gl4', 'Gleitzeit', 7, 2, 'Gesamtproduktion +6 %.', [{ t: 'prod', x: 1.06 }], 'Kernarbeitszeit 9:30 bis 9:45 Uhr.', null);
  S('gl5', 'Homeoffice-Regelung', 8, 2, 'Gesamtproduktion +8 %.', [{ t: 'prod', x: 1.08 }], 'Drei Tage Homeoffice, zwei Tage Präsenz, ein Tag für den Antrag auf Homeoffice.', null);

  S('am1', 'Behördenkooperation', 2, 8, 'Gesamtproduktion +0,5 % je Gremium (mit abnehmendem Ertrag).', [{ t: 'perGrem', a: 0.005 }], 'Ein Amt hilft dem anderen. Gegen Rechnung.', { grem: 3 });
  S('am2', 'Ressortübergreifende Arbeitsgruppe', 6, 1, 'Gesamtproduktion +0,5 % je Gremium (mit abnehmendem Ertrag).', [{ t: 'perGrem', a: 0.005 }], 'Alle Ressorts sitzen an einem Tisch. Niemand ist zuständig.', { grem: 30 });

  function U_fmt(a) { return String(a).replace('.', ','); }

  D.UP = {}; D.UPGRADES.forEach((u) => { D.UP[u.id] = u; });

  /* ---------- Großprojekte ---------- */
  D.PROJECTS = [
    {
      id: 'flughafen', name: 'Flughafen Schilda-Süd', era: 5,
      desc: 'Ein Flughafen für die Region. Bauzeit: drei Jahre. Geschätzt.',
      stages: [
        { name: 'Machbarkeitsstudie', cost: 5e12 },
        { name: 'Planfeststellung', cost: 3e13 },
        { name: 'Spatenstich', cost: 2e14 },
        { name: 'Rohbau', cost: 1.5e15 },
        { name: 'Brandschutzanlage', cost: 1e16 },
        { name: 'Eröffnung', cost: 5e16 },
      ],
      delays: 7, delayX: 1.7,
      delayNames: ['Brandschutz-Nachbesserung', 'Rolltreppen zu kurz', 'Entrauchungsanlage entraucht nicht', 'Kabel falsch verlegt', 'Gutachten zum Gutachten', 'Eröffnungsfeier abgesagt', 'Fluglärm-Klage der Bürokrötenkolonie'],
      reward: 'Produktion ×1,5 in diesem Durchgang, eine Urkunde und ein legendäres Formular.',
      fx: [{ t: 'prod', x: 1.5 }],
    },
    {
      id: 'portal', name: 'Der Ein-Klick-Antrag', era: 9, finale: true,
      desc: 'Das letzte Großprojekt der Verwaltung: ein Antrag, der mit einem einzigen Klick gestellt und sofort bewilligt wird.',
      stages: [
        { name: 'Bedarfsanalyse', cost: 3e26 },
        { name: 'Ausschreibung', cost: 3e27 },
        { name: 'Lastenheft (9.000 Seiten)', cost: 3e28 },
        { name: 'Barrierefreiheit & Datenschutz', cost: 3e29 },
        { name: 'Der eine Knopf', cost: 2e30 },
      ],
      reward: 'Das Ende der Verwaltung, wie wir sie kennen.',
      fx: [],
    },
  ];
  D.PROJ = {}; D.PROJECTS.forEach((p) => { D.PROJ[p.id] = p; });
})(typeof window !== 'undefined' ? window : globalThis);
