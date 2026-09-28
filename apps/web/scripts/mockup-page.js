/*
 * Extraction des valeurs derivees, executee DANS la page de la maquette (nova-frontier-v2.html).
 * Injecte comme script classique par mockup-oracle.mjs : il lit les globales de la maquette
 * (SQUADS, PLANETS, CB, DEP, curSquad, theatre...) et appelle ses fonctions et ses rendus, pour
 * chaque escouade deverrouillee et chaque theatre (research R9). Aucune formule n'est recopiee :
 * les nombres viennent des fonctions de la maquette ou du texte qu'elle affiche.
 */
globalThis.extraireValeursDerivees = () => {
  const ESCOUADES = ['alpha', 'bravo', 'charlie'];
  const THEATRES = ['orbital', 'sol'];

  const texte = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const entier = (t) => Number(t.replace(/\D/g, ''));
  const slug = (s) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const exiger = (condition, message) => {
    if (!condition) throw new Error(`extraction de la maquette : ${message}`);
  };
  /** Lignes .kv d'un bloc, par libelle. */
  const valeursKv = (racine) =>
    new Map(
      [...racine.querySelectorAll('.kv')].map((ligne) => [
        texte(ligne.querySelector('.k')),
        ligne.querySelector('.v'),
      ]),
    );

  const depart = { curSquad, theatre };
  const cible = PLANETS.find((p) => p.n === target) || PLANETS[3];

  /* ---------- Carte : hologramme de la planete visee ---------- */
  renderHolo();
  const holo = document.querySelector('#holo');
  const kvHolo = valeursKv(holo);
  const [carburantRequis, carburantDispo] = texte(kvHolo.get('Carburant requis')).split('/');
  const difficulte = [...kvHolo.get('Difficulté').querySelectorAll('i')].filter(
    (i) => i.style.opacity === '1',
  ).length;
  const route = {
    target: slug(PLANETS[selP].n),
    distance: entier(texte(kvHolo.get('Distance'))),
    fuelRequired: entier(carburantRequis),
    fuelAvailable: entier(carburantDispo),
    travelTime: texte(kvHolo.get('Temps de trajet')),
    squadSpeed: entier(texte(kvHolo.get("Vitesse d'escouade"))),
    difficulty: difficulte,
    loot: entier(texte(kvHolo.get('Butin estimé'))),
    inRange: texte(holo.querySelector('.hd .rt')) === 'À PORTÉE',
    reach: reachUA,
  };
  exiger(PLANETS[selP] === cible, 'la planete de la Carte doit etre celle du Briefing');

  const squads = {};
  const briefing = {};
  const deployment = {};
  const combatStart = {};
  let mission;
  const combat = { titles: {} };

  ESCOUADES.forEach((id, i) => {
    curSquad = i;
    const s = SQUADS[i];
    exiger(!s.lock, `${s.n} doit etre deverrouillee`);

    /* ---------- Escouades : onglet et synthese ---------- */
    renderEsc();
    const onglet = texte(document.querySelector(`#squadtabs .stab[data-i="${i}"] .sp`));
    const sumry = document.querySelector('#sumry');
    const lignes = new Map(
      [...sumry.querySelectorAll('.sline')].map((l) => [
        texte(l.querySelector('.lb')),
        entier(texte(l.querySelector('.vv'))),
      ]),
    );
    const effectifs = squadWeapons(s);
    squads[id] = {
      filled: Number(onglet.split('/')[0]),
      unitCount: entier(texte(sumry.querySelector('.hd .rt'))),
      power: power(s),
      dominantWeapon: dominantWeapon(s),
      weaponMix: [...sumry.querySelectorAll('.trin')].map((ligne) => {
        const arme = [...ligne.querySelector('.ic').classList]
          .find((c) => c.startsWith('w-'))
          .slice(2);
        return {
          weapon: arme,
          count: effectifs[arme],
          percent: entier(texte(ligne.querySelector('.nb'))),
        };
      }),
      totalHp: lignes.get('PV totaux'),
      totalAttack: lignes.get('Attaque'),
      averageDefense: lignes.get('Défense moy.'),
    };

    /* ---------- Briefing : simulation et contrainte ---------- */
    renderBrief();
    const bc2 = document.querySelector('#bc2');
    const contrainte = texte(bc2.querySelector('.constraint .ct'));
    const blindes = contrainte.match(/conforme \((\d+)\)|n'en compte que (\d+)/);
    exiger(blindes, `contrainte illisible : ${contrainte}`);
    const chances = winChance();
    briefing[id] = {
      sentPower: chances.p,
      enemyPower: chances.ep,
      advantage: chances.mod,
      // Sans unite, la maquette divise 0 par 0 et affiche "NaN%" : on note l'absence de valeur.
      winChance: Number.isNaN(chances.pct) ? null : chances.pct,
      armoredUnits: Number(blindes[1] ?? blindes[2]),
      constraintMet: contrainte.includes('Composition conforme'),
    };
    mission ??= {
      waves: wavesFor(diffOf(cible)).map((v) => ({
        index: v.i,
        boss: v.boss,
        composition: v.c,
        weapon: v.w,
        threat: v.t,
      })),
      territoryGain: entier(texte(valeursKv(bc2).get('Gain de territoire'))),
    };

    /* ---------- Deploiement et Combat, par theatre ---------- */
    deployment[id] = {};
    combatStart[id] = {};
    for (const th of THEATRES) {
      theatre = th;
      buildSlots();
      autoPlace();
      const engagees = squadUnits();
      exiger(
        Object.keys(DEP.placed).length === engagees.length,
        `${s.n} (${th}) : toutes les unites doivent etre placees`,
      );
      deployment[id][th] = {
        units: engagees.map((u) => {
          const emplacement = Object.keys(DEP.placed).find((k) => DEP.placed[k] === u.id);
          return { unit: u.id, line: DEP.slots[emplacement].line };
        }),
      };

      startCombat();
      CB.run = false;
      combatStart[id][th] = { units: CB.units.map((u) => ({ unit: u.u.id, maxHp: u.max })) };
      combat.titles[th] = texte(document.querySelector('#combatname'));
      if (combat.nextWaveIn === undefined && CB.units.length > 0) {
        // Premier instant du combat : startCombat a deja joue une image de la boucle.
        combat.nextWaveIn = texte(document.querySelector('#wtimer'));
        const ultime = document.querySelector('#actbar .act.ult');
        combat.ultimate = {
          ready: !ultime.classList.contains('locked'),
          level: entier(texte(ultime.querySelector('.ac'))),
          progress: Number.parseFloat(ultime.querySelector('.ub i').style.width) / 100,
        };
      }
    }
  });

  /* ---------- Retour a l'etat d'ouverture de la maquette ---------- */
  curSquad = depart.curSquad;
  theatre = depart.theatre;
  CB.run = false;
  buildSlots();
  autoPlace();
  go('esc');

  return { squads, route, briefing, mission, deployment, combatStart, combat };
};
