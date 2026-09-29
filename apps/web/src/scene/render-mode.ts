import { readParams } from '../state/routes';
import type { RenderMode } from './types';

/**
 * Choix et identification du rendu (contracts/scene-host.md, research R10 et R11). Aucun import de
 * pixi.js ici : ce module est charge avec l'application, Pixi seulement a la premiere scene.
 */

export type RendererPreference = ('webgpu' | 'webgl')[];

/**
 * WebGPU puis WebGL, sous forme de tableau : une preference en simple chaine ajouterait le rendu
 * Canvas 2D de Pixi. `?rendu=webgl` force le rendu de repli ; toute autre valeur est ignoree.
 */
export function rendererPreference(search: string): RendererPreference {
  return readParams(search).forceWebgl ? ['webgl'] : ['webgpu', 'webgl'];
}

/** Mode publie dans `data-render-mode`, d'apres `renderer.name` et la version du contexte WebGL. */
export function renderModeOf(rendererName: string, webGLVersion?: number): RenderMode {
  if (rendererName === 'webgpu') return 'webgpu';
  if (rendererName === 'webgl') return webGLVersion === 1 ? 'webgl1' : 'webgl2';
  return 'indisponible';
}
