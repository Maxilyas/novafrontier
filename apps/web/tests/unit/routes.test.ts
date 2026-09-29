import { describe, expect, it } from 'vitest';
import { NAV_SECTION, parseHash, readParams, SCREENS, toHash } from '../../src/state/routes';

const connues = new Set(['s1', 'c1', 'm2']);
const existe = (id: string) => connues.has(id);

describe('parseHash (contracts/routes.md)', () => {
  it.each(SCREENS.filter((s) => s !== 'atlas'))('reconnait #/%s', (ecran) => {
    expect(parseHash(`#/${ecran}`, existe)).toEqual({
      route: { screen: ecran },
      canonical: `#/${ecran}`,
    });
  });

  it.each(['', '#', '#/', '#/inconnu', '#/escouadesX', 'nimporte'])(
    'redirige %j vers #/escouades',
    (hash) => {
      expect(parseHash(hash, existe)).toEqual({
        route: { screen: 'escouades' },
        canonical: '#/escouades',
      });
    },
  );

  it("ouvre l'Atlas sur l'unite de l'adresse", () => {
    expect(parseHash('#/atlas/c1', existe)).toEqual({
      route: { screen: 'atlas', unit: 'c1' },
      canonical: '#/atlas/c1',
    });
  });

  it.each(['#/atlas', '#/atlas/', '#/atlas/zz'])("remplace %j par l'Atlas sur s1", (hash) => {
    expect(parseHash(hash, existe)).toEqual({
      route: { screen: 'atlas', unit: 's1' },
      canonical: '#/atlas/s1',
    });
  });

  it('ignore un parametre sur un autre ecran', () => {
    expect(parseHash('#/base/12', existe).canonical).toBe('#/base');
  });
});

describe('toHash', () => {
  it('produit les adresses du contrat', () => {
    expect(toHash({ screen: 'carte' })).toBe('#/carte');
    expect(toHash({ screen: 'atlas', unit: 'm2' })).toBe('#/atlas/m2');
    expect(toHash({ screen: 'atlas' })).toBe('#/atlas/s1');
  });
});

describe('sections de la navigation principale (FR-003)', () => {
  it('rattache Atlas a Escouades, et le parcours de mission a la Carte', () => {
    expect(NAV_SECTION.atlas).toBe('escouades');
    for (const e of ['carte', 'briefing', 'deploiement', 'combat'] as const) {
      expect(NAV_SECTION[e]).toBe('carte');
    }
    expect(NAV_SECTION.base).toBe('base');
    expect(NAV_SECTION.recherche).toBe('recherche');
    expect(NAV_SECTION.butin).toBe('butin');
  });
});

describe('readParams', () => {
  it('lit diag et rendu', () => {
    expect(readParams('')).toEqual({ diag: false, forceWebgl: false });
    expect(readParams('?diag=1')).toEqual({ diag: true, forceWebgl: false });
    expect(readParams('?rendu=webgl&diag=1')).toEqual({ diag: true, forceWebgl: true });
    expect(readParams('?rendu=webgpu')).toEqual({ diag: false, forceWebgl: false });
  });
});
