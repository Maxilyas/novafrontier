/**
 * Mise a l'echelle commune des scenes (contracts/scenes.md) : un espace logique (arene 1600 x 816,
 * plateau 988 x 752) tient entier dans la zone, a l'echelle uniforme et centre. La scene s'en sert
 * pour dessiner, le DOM pour placer les boutons d'emplacements, la designation pour convertir le
 * pointeur.
 */

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Fit {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export function fitInto(logical: Size, zone: Size): Fit {
  const scale = Math.min(zone.width / logical.width, zone.height / logical.height);
  return {
    scale,
    offsetX: (zone.width - logical.width * scale) / 2,
    offsetY: (zone.height - logical.height * scale) / 2,
  };
}

/** Point logique vers pixels CSS de la zone. */
export const toZone = (fit: Fit, x: number, y: number) => ({
  x: fit.offsetX + x * fit.scale,
  y: fit.offsetY + y * fit.scale,
});

/** Pixels CSS de la zone vers point logique. */
export const toLogical = (fit: Fit, x: number, y: number) => ({
  x: (x - fit.offsetX) / fit.scale,
  y: (y - fit.offsetY) / fit.scale,
});
