import { readdirSync, readFileSync } from 'node:fs';
import { buildings, planets, researchTrees, units } from '@nova/data';
import { describe, expect, it } from 'vitest';

/**
 * SC-011 et FR-012 : les donnees de jeu ont une source unique, @nova/data. Aucun nom d'unite, de
 * batiment, de planete ni de noeud de recherche n'est ecrit en dur dans apps/web/src.
 */

/**
 * Libelles d'interface de la maquette qui portent le meme nom qu'un noeud de recherche : ce sont
 * des mots du jeu (commande, rubrique), pas une copie de la donnee.
 */
const VOCABULAIRE_D_INTERFACE = new Set([
  'Déploiement automatique', // interrupteur du Briefing et bouton du Deploiement
  'Slot légendaire', // rubrique du plateau d'Escouades et des caracteristiques de l'Atlas
  'Porte-nefs', // titre de la note du porte-nefs dans l'Atlas
]);

const SRC = new URL('../../src/', import.meta.url);

const fichiers = (readdirSync(SRC, { recursive: true }) as string[]).filter((f) =>
  /\.(svelte|ts)$/.test(f),
);

const noms = [
  ...units.map((u) => u.name),
  ...buildings.map((b) => b.name),
  ...planets.map((p) => p.name),
  ...researchTrees.flatMap((t) => t.nodes.map((n) => n.name)),
].filter((nom) => !VOCABULAIRE_D_INTERFACE.has(nom));

describe('SC-011 : aucune donnee de jeu en dur dans apps/web/src', () => {
  it('trouve les sources a verifier', () => {
    expect(fichiers.length).toBeGreaterThan(10);
    expect(noms.length).toBeGreaterThan(50);
  });

  it('aucun nom d unite, de batiment, de planete ni de noeud', () => {
    const trouves: string[] = [];
    for (const fichier of fichiers) {
      const contenu = readFileSync(new URL(fichier, SRC), 'utf8').toLowerCase();
      for (const nom of noms) {
        if (contenu.includes(nom.toLowerCase())) trouves.push(`${fichier} : ${nom}`);
      }
    }
    expect(trouves).toEqual([]);
  });
});
