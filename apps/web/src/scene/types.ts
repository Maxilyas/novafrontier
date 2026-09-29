import type { Application } from 'pixi.js';

/** Types de la zone de scene et de son moteur (contracts/scene-host.md). */

export type SceneId = 'carte' | 'deploiement' | 'combat';

export type RenderMode =
  | 'initialisation'
  | 'webgpu'
  | 'webgl2'
  | 'webgl1'
  | 'perdu'
  | 'indisponible';

export interface SceneHandle {
  readonly mode: RenderMode;
  /** Renvoie la desinscription. */
  onModeChange(listener: (mode: RenderMode) => void): () => void;
}

/** Contenu d'une scene, que les scenes des phases P1 et P2 de la feuille de route reutiliseront. */
export interface SceneModule {
  create(app: Application): SceneInstance;
}

export interface SceneInstance {
  /** Reprend l'animation. */
  start(): void;
  /** La met en pause. */
  stop(): void;
  /** Taille CSS de la zone. */
  resize(width: number, height: number): void;
  destroy(): void;
}
