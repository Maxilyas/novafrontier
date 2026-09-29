import { describe, expect, it } from 'vitest';
import { rendererPreference, renderModeOf } from '../../src/scene/render-mode';

/** FR-023, FR-028 et contracts/scene-host.md : mode de rendu publie et preference de Pixi. */

describe('renderModeOf', () => {
  it('WebGPU', () => {
    expect(renderModeOf('webgpu')).toBe('webgpu');
  });

  it('WebGL, selon la version du contexte', () => {
    expect(renderModeOf('webgl', 2)).toBe('webgl2');
    expect(renderModeOf('webgl', 1)).toBe('webgl1');
  });

  it('aucun autre rendu : le rendu Canvas 2D n est jamais retenu', () => {
    expect(renderModeOf('canvas')).toBe('indisponible');
    expect(renderModeOf('')).toBe('indisponible');
  });
});

describe('rendererPreference', () => {
  it('WebGPU puis WebGL par defaut, sous forme de tableau', () => {
    expect(rendererPreference('')).toEqual(['webgpu', 'webgl']);
    expect(rendererPreference('?diag=1')).toEqual(['webgpu', 'webgl']);
  });

  it('?rendu=webgl force le rendu de repli', () => {
    expect(rendererPreference('?rendu=webgl')).toEqual(['webgl']);
    expect(rendererPreference('?diag=1&rendu=webgl')).toEqual(['webgl']);
  });

  it('toute autre valeur est ignoree', () => {
    for (const recherche of ['?rendu=webgpu', '?rendu=canvas', '?rendu=', '?rendu=WEBGL']) {
      expect(rendererPreference(recherche)).toEqual(['webgpu', 'webgl']);
    }
  });
});
