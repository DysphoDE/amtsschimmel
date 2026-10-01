'use strict';
/* Amtsschimmel – Systeme: Paragrafen (§), Leitbilder (Reform), Laufbahn (Dauer-Perks), Formulare, Amtsschimmel-Effekte. */
(function (root) {
  const AS = (root.AS = root.AS || {});
  const D = (AS.D = AS.D || {});

  /* ---------- Paragrafen: werden mit Vorschriften (§) erlassen, gelten pro Durchgang ---------- */
  D.TEILE = [
    { id: 'I', name: 'Teil I – Allgemeiner Teil', short: 'Allgemeines' },
    { id: 'II', name: 'Teil II – Dienstrecht', short: 'Dienstrecht' },
    { id: 'III', name: 'Teil III – Verfahrensrecht', short: 'Verfahren' },
    { id: 'IV', name: 'Teil IV – Organisationsrecht', short: 'Organisation' },
  ];
  const P = (no, teil, name, cost, desc, fx) => ({ id: 'p' + no, no, teil, name, cost, desc, fx });
  D.PARAS = [
    P(1, 'I', 'Geltungsbereich', 1, 'Gesamtproduktion +5 %.', [{ t: 'prod', x: 1.05 }]),
    P(2, 'I', 'Begriffsbestimmungen', 4, 'Ressortstempel ×1,15.', [{ t: 'stamp', x: 1.15 }]),
    P(3, 'I', 'Zuständigkeit', 12, 'Der zuständige Stempel wird hervorgehoben. Ressortstempel ×1,05.', [{ t: 'assist' }, { t: 'stamp', x: 1.05 }]),
    P(4, 'I', 'Amtshilfe', 40, 'Gesamtproduktion +1 % je Gremium (mit abnehmendem Ertrag).', [{ t: 'perGrem', a: 0.01 }]),
    P(5, 'I', 'Verwaltungsvorschrift', 150, 'Gesamtproduktion +10 %.', [{ t: 'prod', x: 1.1 }]),
    P(6, 'I', 'Ermessen', 600, 'Amtsschimmel-Effekte halten 25 % länger.', [{ t: 'schimDur', x: 1.25 }]),
    P(7, 'I', 'Rechtsgrundlage', 2500, 'Der Bonus aus angesammelten Vorschriften wirkt doppelt.', [{ t: 'rechts', x: 2 }]),
    P(8, 'I', 'Generalklausel', 12000, 'Gesamtproduktion +15 %.', [{ t: 'prod', x: 1.15 }]),
    P(9, 'I', 'Rechtsstaatsprinzip', 80000, 'Gesamtproduktion ×2.', [{ t: 'prod', x: 2 }]),

    P(10, 'II', 'Dienstpostenplan', 2, 'Personal arbeitet 25 % schneller.', [{ t: 'cat', cat: 'person', x: 1.25 }]),
    P(11, 'II', 'Arbeitszeitverordnung', 8, 'Generatoren und Gremien kosten 5 % weniger.', [{ t: 'cost', x: 0.95 }]),
    P(12, 'II', 'Laufbahnverordnung', 30, 'Personal ×1,5.', [{ t: 'cat', cat: 'person', x: 1.5 }]),
    P(13, 'II', 'Sachmittelausstattung', 120, 'Sachmittel (Archive, Stuben, Registraturen) ×2.', [{ t: 'cat', cat: 'sache', x: 2 }]),
    P(14, 'II', 'Besoldungsordnung', 500, 'Personal ×2.', [{ t: 'cat', cat: 'person', x: 2 }]),
    P(15, 'II', 'Technikklausel', 2000, 'Technik ×1,5.', [{ t: 'cat', cat: 'technik', x: 1.5 }]),
    P(16, 'II', 'Beschaffungsordnung', 9000, 'Generatoren und Gremien kosten 10 % weniger.', [{ t: 'cost', x: 0.9 }]),
    P(17, 'II', 'Digitalpakt', 50000, 'Technik ×2.', [{ t: 'cat', cat: 'technik', x: 2 }]),
    P(18, 'II', 'Alimentationsprinzip', 350000, 'Alle Generatoren ×2.', [{ t: 'cat', cat: 'all', x: 2 }]),

    P(19, 'III', 'Formvorschrift', 2, 'Alle Stempel ×1,25.', [{ t: 'click', x: 1.25 }]),
    P(20, 'III', 'Fristenregelung', 10, 'EILT-Fristen +3 Sekunden, EILT-Ertrag +25 %.', [{ t: 'eiltTime', a: 3 }, { t: 'eilt', x: 1.25 }]),
    P(21, 'III', 'Vertretungsregel', 25, 'Wenn du 3 Sekunden nicht stempelst, stempelt die Vertretung (1 Vorgang alle 2 Sekunden).', [{ t: 'auto', a: 0.5 }]),
    P(22, 'III', 'Rechtsbehelfsbelehrung', 100, 'Widersprüche bringen 25 % mehr.', [{ t: 'wider', x: 1.25 }]),
    P(23, 'III', 'Beschleunigungsgebot', 400, 'Arbeitsfluss-Maximum +10.', [{ t: 'flowMax', a: 10 }]),
    P(24, 'III', 'Aktenführungspflicht', 1600, 'Formulare werden 25 % häufiger gefunden.', [{ t: 'formRate', x: 1.25 }]),
    P(25, 'III', 'Stempelordnung', 7000, 'Jeder Stempel bringt zusätzlich 0,2 % der Produktion.', [{ t: 'clickPct', a: 0.002 }]),
    P(26, 'III', 'Verfahrensbeschleunigung', 35000, 'Die Vertretung stempelt einen Vorgang mehr pro Sekunde.', [{ t: 'auto', a: 1 }]),
    P(27, 'III', 'Genehmigungsfiktion', 200000, 'Ressortstempel ×1,25.', [{ t: 'stamp', x: 1.25 }]),

    P(28, 'IV', 'Geschäftsordnung', 3, 'Gremien beschließen 50 % mehr Vorschriften.', [{ t: 'v', x: 1.5 }]),
    P(29, 'IV', 'Tagesordnung', 15, 'Parkinson-Faktor +0,25: Vorschriften vermehren sich schneller.', [{ t: 'parkinson', a: 0.25 }]),
    P(30, 'IV', 'Beschlussfähigkeit', 70, 'Gremien beschließen doppelt so viele Vorschriften.', [{ t: 'v', x: 2 }]),
    P(31, 'IV', 'Bürgerbeteiligung', 300, 'Bürgeranliegen kommen 30 % häufiger und bringen 50 % mehr.', [{ t: 'anlFreq', x: 1.3 }, { t: 'anlRew', x: 1.5 }]),
    P(32, 'IV', 'Schimmelverordnung', 1200, 'Der Amtsschimmel kommt 20 % häufiger vorbei.', [{ t: 'schimFreq', x: 1.2 }]),
    P(33, 'IV', 'Unterausschuss', 5000, 'Parkinson-Faktor +0,25.', [{ t: 'parkinson', a: 0.25 }]),
    P(34, 'IV', 'Normenkontrolle', 25000, 'Die restlichen Paragrafen kosten 25 % weniger Vorschriften.', [{ t: 'paraCost', x: 0.75 }]),
    P(35, 'IV', 'Experimentierklausel', 120000, 'Gremien beschließen dreimal so viele Vorschriften.', [{ t: 'v', x: 3 }]),
    P(36, 'IV', 'Ewigkeitsklausel', 800000, 'Der Vorschriften-Bonus wirkt doppelt, Gesamtproduktion ×1,5.', [{ t: 'rechts', x: 2 }, { t: 'prod', x: 1.5 }]),
  ];
  D.PARA = {};
  D.PARAS.forEach((p, i) => {
    D.PARA[p.id] = p;
    const prev = D.PARAS[i - 1];
    p.req = prev && prev.teil === p.teil ? prev.id : null;
  });

  /* ---------- Leitbilder: bestimmen die Regeln eines Durchgangs ---------- */
  D.LEITBILDER = [
    { id: 'kameral', name: 'Kameralistik', motto: '„Das haben wir schon immer so gemacht.“',
      desc: 'Der bewährte Verwaltungsalltag. Solide, ohne Nebenwirkungen – und als einziges Leitbild immun gegen Reformmüdigkeit.',
      pro: ['Gesamtproduktion ×1,5', 'Keine Reformmüdigkeit, auch mehrmals hintereinander'], con: [],
      fx: [{ t: 'prod', x: 1.5 }, { t: 'flag', f: 'noMuede' }], unlock: () => true },
    { id: 'zentral', name: 'Zentralismus', motto: '„Alles aus einer Hand.“',
      desc: 'Eine Zentrale entscheidet alles. Wenige Zuständigkeiten, hohe Produktion, aber Gremien haben nichts zu sagen.',
      pro: ['Gesamtproduktion ×1,9', 'Höchstens 3 Ressorts – Sortieren wird leichter'], con: ['Vorschriften −50 %'],
      fx: [{ t: 'prod', x: 1.9 }, { t: 'ressortMax', n: 3 }, { t: 'v', x: 0.5 }], unlock: () => true },
    { id: 'foederal', name: 'Föderalismus', motto: '„Viele Köche verderben den Brei nicht, sie verwalten ihn.“',
      desc: 'Jede Ebene macht ihr eigenes Ding. Vielfalt wird belohnt, kostet aber.',
      pro: ['+7 % Produktion je Generatorart mit mindestens 10 Stück', 'Vorschriften +50 %'], con: ['Generatoren und Gremien kosten 12 % mehr'],
      fx: [{ t: 'divers', a: 0.07, min: 10 }, { t: 'v', x: 1.5 }, { t: 'cost', x: 1.12 }], unlock: () => true },
    { id: 'buerger', name: 'Bürgernähe', motto: '„Der Mensch im Mittelpunkt.“',
      desc: 'Die Behörde öffnet sich. Mehr Anliegen, mehr Eilsachen, mehr Schimmel – weniger Ruhe.',
      pro: ['Bürgeranliegen doppelt so häufig, Belohnungen ×1,5', 'EILT-Vorgänge doppelt so häufig', 'Amtsschimmel 50 % häufiger'],
      con: ['Generatoren ×0,8'],
      fx: [{ t: 'anlFreq', x: 2 }, { t: 'anlRew', x: 1.5 }, { t: 'eiltFreq', x: 2 }, { t: 'schimFreq', x: 1.5 }, { t: 'cat', cat: 'all', x: 0.8 }],
      unlock: (S) => S.maxEra >= 3 },
    { id: 'npm', name: 'New Public Management', motto: '„Kennzahlen, Kennzahlen, Kennzahlen.“',
      desc: 'Die Verwaltung als Dienstleistungsunternehmen. Wer schnell und richtig stempelt, wird belohnt – wer nur wartet, nicht.',
      pro: ['Alle Stempel ×2, Ressortstempel zusätzlich ×1,5', 'Arbeitsfluss-Maximum +20'], con: ['Generatoren ×0,85'],
      fx: [{ t: 'click', x: 2 }, { t: 'stamp', x: 1.5 }, { t: 'flowMax', a: 20 }, { t: 'cat', cat: 'all', x: 0.85 }],
      unlock: (S) => S.maxEra >= 4 },
    { id: 'entbuer', name: 'Entbürokratisierung', motto: '„Für jede neue Vorschrift fallen zwei weg.“',
      desc: 'Schlanker Staat. Vorschriften vermehren sich nicht mehr von selbst, dafür arbeitet alles schneller und billiger.',
      pro: ['Generatoren ×2', 'Generatoren, Gremien und Verbesserungen kosten 25 % weniger', 'Paragrafen kosten die Hälfte'],
      con: ['Kein Parkinson-Wachstum', 'Vorschriften −25 %'],
      fx: [{ t: 'cat', cat: 'all', x: 2 }, { t: 'cost', x: 0.75 }, { t: 'paraCost', x: 0.5 }, { t: 'upCost', x: 0.75 }, { t: 'noParkinson' }, { t: 'v', x: 0.75 }],
      unlock: (S) => S.maxEra >= 5 },
    { id: 'digital', name: 'Digitalisierung zuerst', motto: '„Erst mal ein Pilotprojekt.“',
      desc: 'Alles wird digital. Technik glänzt, das Personal fremdelt. Bonus auch für Abwesende.',
      pro: ['Technik ×2', 'Offline-Ertrag +25 Prozentpunkte'], con: ['Personal ×0,6'],
      fx: [{ t: 'cat', cat: 'technik', x: 2 }, { t: 'cat', cat: 'person', x: 0.6 }, { t: 'offEff', a: 0.25 }],
      unlock: (S) => S.maxEra >= 6 },
    { id: 'parkinson', name: 'Parkinson pur', motto: '„Die Arbeit dehnt sich in dem Maß aus, wie Zeit für sie zur Verfügung steht.“',
      desc: 'Die Bürokratie darf wuchern. Vorschriften explodieren – und mit ihnen der Vorschriften-Bonus.',
      pro: ['Vorschriften ×2,5', 'Parkinson-Faktor +1', 'Vorschriften-Bonus ×1,5'], con: ['Generatoren und Gremien kosten 10 % mehr'],
      fx: [{ t: 'v', x: 2.5 }, { t: 'parkinson', a: 1 }, { t: 'rechts', x: 1.5 }, { t: 'cost', x: 1.1 }],
      unlock: (S) => S.maxEra >= 7 },
    { id: 'schilda', name: 'Schilda', motto: '„Licht trägt man am besten in Säcken ins Rathaus.“', secret: true,
      desc: 'Die Schildbürger regieren. Jede Minute wird ausgewürfelt, wie gut die Verwaltung gerade funktioniert – und wer absichtlich falsch stempelt, wird für die Widersprüche belohnt.',
      pro: ['Widersprüche ×4', 'Jede Minute ein zufälliger Faktor zwischen ×0,25 und ×4'], con: ['Unberechenbar'],
      fx: [{ t: 'wider', x: 4 }, { t: 'chaos' }],
      unlock: (S) => !!(S.flags && S.flags.schilda) },
  ];
  D.LB = {}; D.LEITBILDER.forEach((l) => { D.LB[l.id] = l; });

  /* ---------- Laufbahn: dauerhafte Verbesserungen, bezahlt mit Pensionspunkten ---------- */
  D.LAUFBAHNEN = [
    { id: 'e', name: 'Einfacher Dienst' }, { id: 'm', name: 'Mittlerer Dienst' },
    { id: 'g', name: 'Gehobener Dienst' }, { id: 'h', name: 'Höherer Dienst' },
  ];
  const K = (id, lb, name, cost, desc, fx, req) => ({ id, lb, name, cost, desc, fx, req: req || null });
  D.PERKS = [
    K('stempelfest', 'e', 'Stempelfest', 1, 'Alle Stempel ×1,25, Ressortstempel zusätzlich ×1,25.', [{ t: 'click', x: 1.25 }, { t: 'stamp', x: 1.25 }]),
    K('fristgerecht', 'e', 'Fristgerecht', 2, 'EILT-Fristen +3 Sekunden, EILT-Ertrag +25 %.', [{ t: 'eiltTime', a: 3 }, { t: 'eilt', x: 1.25 }]),
    K('kaffeemaschine', 'e', 'Eigene Kaffeemaschine', 3, 'Amtsschimmel-Effekte halten 25 % länger.', [{ t: 'schimDur', x: 1.25 }]),
    K('vertretungsplan', 'e', 'Vertretungsplan', 4, 'Die Vertretung stempelt von Anfang an (1 Vorgang alle 2 Sekunden), auch ohne § 21.', [{ t: 'auto', a: 0.5 }]),
    K('uebergangsgeld', 'e', 'Übergangsgeld', 6, 'Jeder Durchgang startet mit 5 Minuten deiner besten Produktion.', [{ t: 'flag', f: 'startgeld' }]),
    K('dienstjubilaeum', 'e', 'Dienstjubiläum', 8, 'Dienstjahre wirken 25 % stärker.', [{ t: 'dj', x: 1.25 }]),

    K('haushaltsautomatik', 'm', 'Haushaltsautomatik', 15, 'Kauft bezahlbare Verbesserungen automatisch (abschaltbar).', [{ t: 'flag', f: 'autoUp' }], 'uebergangsgeld'),
    K('bestandsschutz1', 'm', 'Bestandsschutz I', 25, 'Teil I der Paragrafen bleibt bei der Reform in Kraft.', [{ t: 'flag', f: 'keepI' }]),
    K('urlaubsvertretung', 'm', 'Urlaubsvertretung', 30, 'Offline-Ertrag 60 → 80 %, Obergrenze 8 → 24 Stunden.', [{ t: 'offEff', a: 0.2 }, { t: 'offCap', a: 16 }]),
    K('formularkunde', 'm', 'Formularkunde', 40, 'Formulare werden 25 % häufiger gefunden.', [{ t: 'formRate', x: 1.25 }]),
    K('pferdefluesterer', 'm', 'Pferdeflüsterer', 50, 'Der Amtsschimmel kommt 30 % häufiger.', [{ t: 'schimFreq', x: 1.3 }]),
    K('routine', 'm', 'Routine', 70, 'Arbeitsfluss-Maximum +10, der Fluss verfällt nur halb so schnell.', [{ t: 'flowMax', a: 10 }, { t: 'flowDecay', x: 0.5 }]),

    K('personalautomatik', 'g', 'Personalautomatik', 150, 'Kauft automatisch Generatoren und Gremien mit dem besten Preis-Leistungs-Verhältnis (abschaltbar).', [{ t: 'flag', f: 'autoGen' }], 'haushaltsautomatik'),
    K('personaluebernahme', 'g', 'Personalübernahme', 120, 'Jeder Durchgang beginnt in der Kanzlei (Epoche 3) mit je 10 Generatoren der ersten beiden Epochen.', [{ t: 'flag', f: 'startEra' }]),
    K('dauervertretung', 'g', 'Vertretung auf Dauer', 400, 'Die Vertretung stempelt einen Vorgang mehr pro Sekunde.', [{ t: 'auto', a: 1 }], 'vertretungsplan'),
    K('sitzungserfahrung', 'g', 'Sitzungserfahrung', 600, 'Vorschriften ×2.', [{ t: 'v', x: 2 }]),
    K('sabbatjahr', 'g', 'Sabbatjahr', 900, 'Offline-Ertrag 100 %, Obergrenze 72 Stunden.', [{ t: 'offEff', a: 0.2 }, { t: 'offCap', a: 48 }], 'urlaubsvertretung'),
    K('bestandsschutz2', 'g', 'Bestandsschutz II', 2000, 'Alle Paragrafen bleiben bei der Reform in Kraft.', [{ t: 'flag', f: 'keepAll' }], 'bestandsschutz1'),

    K('ministerialrat', 'h', 'Ministerialrat', 5000, 'Dienstjahre wirken 50 % stärker.', [{ t: 'dj', x: 1.5 }], 'dienstjubilaeum'),
    K('reformeifer', 'h', 'Reformeifer', 12000, 'Reformen bringen 25 % mehr Dienstjahre.', [{ t: 'djGain', x: 1.25 }]),
    K('schimmelreiter', 'h', 'Schimmelreiter', 30000, 'Der Amtsschimmel bleibt doppelt so lange, seine Effekte halten 50 % länger.', [{ t: 'schimLife', a: 13 }, { t: 'schimDur', x: 1.5 }], 'pferdefluesterer'),
    K('spatenstich', 'h', 'Spatenstich', 60000, 'Großprojekte kosten 30 % weniger.', [{ t: 'projCost', x: 0.7 }]),
    K('staatssekretaer', 'h', 'Staatssekretär', 150000, 'Gesamtproduktion ×3.', [{ t: 'prod', x: 3 }], 'ministerialrat'),
  ];
  D.PERK = {}; D.PERKS.forEach((p) => { D.PERK[p.id] = p; });
  // Endlose Erfahrungsstufen: +10 % Produktion je Stufe
  D.STUFE = { base: 100, growth: 2, bonus: 0.1 };

  /* ---------- Formulare: Sammelobjekte, dauerhaft ---------- */
  D.RARITY = {
    g: { name: 'gewöhnlich', w: 62, bonus: 0.005, cls: 'r-g' },
    s: { name: 'selten', w: 27, bonus: 0.01, cls: 'r-s' },
    a: { name: 'amtlich', w: 9, bonus: 0.02, cls: 'r-a' },
    l: { name: 'legendär', w: 2, bonus: 0.05, cls: 'r-l' },
  };
  D.ORDNER = [
    { id: 'allg', name: 'Allgemeine Verwaltung', set: 'Alle Stempel ×1,25', fx: [{ t: 'click', x: 1.25 }] },
    { id: 'bau', name: 'Bauwesen', set: 'Generatoren und Gremien kosten 5 % weniger', fx: [{ t: 'cost', x: 0.95 }] },
    { id: 'ord', name: 'Ordnung & Sicherheit', set: 'Widersprüche bringen 25 % mehr', fx: [{ t: 'wider', x: 1.25 }] },
    { id: 'fin', name: 'Finanzen', set: 'Haushaltsreste vom Amtsschimmel ×2', fx: [{ t: 'lucky', x: 2 }] },
    { id: 'soz', name: 'Soziales', set: 'Bürgeranliegen bringen 50 % mehr', fx: [{ t: 'anlRew', x: 1.5 }] },
    { id: 'umw', name: 'Umwelt', set: 'Vorschriften ×1,5', fx: [{ t: 'v', x: 1.5 }] },
    { id: 'kul', name: 'Kultur & Schule', set: 'Formulare 50 % häufiger', fx: [{ t: 'formRate', x: 1.5 }] },
    { id: 'hist', name: 'Historische Archivalien', set: 'Gesamtproduktion ×1,25', fx: [{ t: 'prod', x: 1.25 }] },
  ];
  const F = (ordner, r, name, extra) => Object.assign({ ordner, r, name, era: 0 }, extra || {});
  D.FORMS = [
    F('allg', 'g', 'Antrag auf Aushändigung eines Antragsformulars'),
    F('allg', 'g', 'Formblatt 08/15'),
    F('allg', 'g', 'Laufzettel mit vierzehn Kürzeln'),
    F('allg', 'g', 'Umlaufmappe (leer)'),
    F('allg', 's', 'Erklärung über die Richtigkeit dieser Erklärung'),
    F('allg', 's', 'Bescheinigung über die Nichtvorlage einer Bescheinigung'),
    F('allg', 'a', 'Antrag auf Verlängerung der Fristverlängerung'),
    F('allg', 'l', 'Der Passierschein'),

    F('bau', 'g', 'Bauvoranfrage für einen Gartenzwerg'),
    F('bau', 'g', 'Dachneigungsnachweis für eine Hundehütte'),
    F('bau', 'g', 'Nutzungsänderung: Garage zu Garage'),
    F('bau', 'g', 'Stellplatznachweis für ein Fahrrad'),
    F('bau', 's', 'Abrissgenehmigung für ein nie gebautes Haus'),
    F('bau', 's', 'Baugenehmigung für einen Hochsitz für Beamte'),
    F('bau', 'a', 'Statik-Gutachten für einen Aktenstapel'),
    F('bau', 'l', 'Bauabnahme der Pyramide von Gizeh (verspätet)'),

    F('ord', 'g', 'Hundesteuerbescheid für eine Katze'),
    F('ord', 'g', 'Ruhestörungsanzeige gegen eine Kirchturmuhr'),
    F('ord', 'g', 'Parkausweis für eine Pferdekutsche'),
    F('ord', 'g', 'Waffenschein für einen Kugelschreiber'),
    F('ord', 's', 'Fundsachenanzeige: ein weißes Pferd'),
    F('ord', 's', 'Sondernutzungserlaubnis für einen Schatten'),
    F('ord', 'a', 'Führungszeugnis eines Gartenzwergs'),
    F('ord', 'l', 'Haftbefehl gegen den Amtsschimmel (aufgehoben)'),

    F('fin', 'g', 'Steuererklärung einer Gartenlaube'),
    F('fin', 'g', 'Kassenbuch mit einem Eintrag: Kaffee'),
    F('fin', 'g', 'Reisekostenabrechnung über 30 Cent'),
    F('fin', 'g', 'Haushaltssperre für Bleistifte'),
    F('fin', 's', 'Antrag auf Erstattung der Antragsgebühr'),
    F('fin', 's', 'Prüfvermerk des Rechnungshofs: „Bitte Rücksprache“'),
    F('fin', 'a', 'Mahnung über 0,00 €'),
    F('fin', 'l', 'Der ausgeglichene Haushalt'),

    F('soz', 'g', 'Wohngeldantrag für ein Vogelhaus'),
    F('soz', 'g', 'Elterngeldantrag für ein Tamagotchi'),
    F('soz', 'g', 'Bescheinigung über die Teilnahme an einer Wartezeit'),
    F('soz', 'g', 'Bedürftigkeitsnachweis eines Bürostuhls'),
    F('soz', 's', 'Kurantrag wegen Formularmüdigkeit'),
    F('soz', 's', 'Härtefallantrag (mit Kaffeefleck)'),
    F('soz', 'a', 'Wartemarke Nr. 1'),
    F('soz', 'l', 'Ein freundliches Wort vom Amt'),

    F('umw', 'g', 'Fällgenehmigung für einen Bonsai'),
    F('umw', 'g', 'Umweltverträglichkeitsprüfung für einen Komposthaufen'),
    F('umw', 'g', 'Lärmschutzgutachten für eine Hummel'),
    F('umw', 'g', 'Abwassersatzung für Pfützen'),
    F('umw', 's', 'Planfeststellung einer Krötenquerungshilfe'),
    F('umw', 's', 'Ausnahmegenehmigung für Löwenzahn'),
    F('umw', 'a', 'Artenschutzgutachten für den Amtsschimmel'),
    F('umw', 'l', 'Die papierlose Akte (Original)'),

    F('kul', 'g', 'Befreiung vom Sportunterricht für ein Schulpferd'),
    F('kul', 'g', 'Ausleihschein für ein ausgeliehenes Buch'),
    F('kul', 'g', 'Antrag auf Denkmalschutz für einen Kopierer'),
    F('kul', 'g', 'Zeugnis: „Er war stets bemüht“'),
    F('kul', 's', 'Genehmigung eines Laternenumzugs (mit Auflagen)'),
    F('kul', 's', 'Lehrplan für das Fach Formularkunde'),
    F('kul', 'a', 'Urheberrechtsnachweis für einen Stempelabdruck'),
    F('kul', 'l', 'Ehrenurkunde für hervorragendes Warten'),

    F('hist', 's', 'Tontafel: 30 Krüge Bier, quittiert', { era: 0 }),
    F('hist', 's', 'Census-Rolle des Tabulariums', { era: 1 }),
    F('hist', 's', 'Urkunde mit Siegel und Kerzenwachs', { era: 2 }),
    F('hist', 'a', 'Preußische Dienstanweisung zum Öffnen von Fenstern', { era: 3 }),
    F('hist', 'a', 'Rohrpostbüchse mit falsch zugestelltem Liebesbrief', { era: 4 }),
    F('hist', 'a', 'Durchschlag des Durchschlags', { era: 5 }),
    F('hist', 'a', 'Diskette „ANTRAG_FINAL_neu2.DOC“', { era: 6 }),
    F('hist', 'a', 'Ausgedruckte E-Mail mit Anhang „Scan0001.pdf“', { era: 7 }),
    F('hist', 'l', 'Ablehnungsbescheid in Gedichtform, verfasst von einer KI', { era: 8 }),
    F('hist', 'l', 'Formular Ω', { era: 9 }),
    F('hist', 'l', 'Eröffnungsurkunde Flughafen Schilda-Süd', { era: 5, special: 'flughafen' }),
  ];
  D.FORMS.forEach((f, i) => { f.id = 'f' + i; });
  D.FORM = {}; D.FORMS.forEach((f) => { D.FORM[f.id] = f; });

  /* ---------- Der Amtsschimmel: Glücksereignis ---------- */
  D.SCHIMMEL = [
    { id: 'kaffee', name: 'Kaffeepause!', w: 44, text: 'Frisch gebrüht!', buff: { k: 'prod', x: 6, s: 66 } },
    { id: 'rest', name: 'Haushaltsrest', w: 38, text: 'Im Dezember noch Geld übrig! Sofortiger Aktenschub.', lucky: true },
    { id: 'dienstweg', name: 'Dienstweg verkürzt', w: 8, minEra: 1, text: 'Jetzt stempeln, was das Zeug hält!', buff: { k: 'click', x: 30, s: 13 } },
    { id: 'befoerderung', name: 'Beförderungswelle', w: 6, minGens: 1, text: 'Eine Generatorart wird befördert.', buff: { k: 'gen', x: 10, s: 40 } },
    { id: 'schwemme', name: 'Vorschriftenschwemme', w: 6, minVps: true, text: 'Ein Gremium tagt durch. Sofort Vorschriften für 15 Minuten.', vor: 900 },
    { id: 'dezember', name: 'Dezemberfieber', w: 4, minEra: 2, text: 'Das Budget muss raus!', buff: { k: 'cost', x: 0.5, s: 25 } },
    { id: 'reiter', name: 'Der Schimmelreiter', w: 1, minEra: 3, text: 'Eine Legende reitet vorbei.', buff: { k: 'prod', x: 2, s: 300 } },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
