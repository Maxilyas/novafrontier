/**
 * Empreinte d'un etat (research R7) : FNV-1a sur deux voies de 32 bits, aux bases de depart
 * differentes, sur une suite de mots entiers signes de 32 bits. Synchrone et identique partout
 * (`Math.imul`). Elle detecte un ecart de deroulement ; ce n'est pas une signature de securite.
 */

const PREMIER_FNV = 0x01000193;
const BASE_A = 0x811c9dc5;
const BASE_B = 0x050c5d1f;

const MIN32 = -2147483648;
const MAX32 = 2147483647;

const hex = (h: number) => (h >>> 0).toString(16).padStart(8, '0');

export function fingerprint(words: Iterable<number>): string {
  let a = BASE_A;
  let b = BASE_B;
  for (const mot of words) {
    if (!Number.isInteger(mot) || mot < MIN32 || mot > MAX32) {
      throw new Error(`Empreinte : mot invalide ${mot} (entier signe sur 32 bits attendu)`);
    }
    for (let decalage = 0; decalage < 32; decalage += 8) {
      const octet = (mot >>> decalage) & 0xff;
      a = Math.imul(a ^ octet, PREMIER_FNV);
      b = Math.imul(b ^ octet, PREMIER_FNV);
    }
    // La seconde voie melange aussi le mot entier : un echange de mots ne la laisse pas intacte.
    b = Math.imul(b ^ (mot >>> 16), PREMIER_FNV);
  }
  return hex(a) + hex(b);
}
