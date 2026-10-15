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

/** Contenu d'une scene (contracts/scenes.md de la feature simulation-combat). */
export interface SceneModule {
  create(app: Application): SceneInstance;
  /**
   * Reste animee quand le systeme demande de reduire les animations : la scene fige elle-meme ses
   * decorations, mais continue de montrer ce qui porte l'information (deplacements du combat).
   */
  readonly animateWhenReducedMotion?: boolean;
  /** Options d'initialisation propres a la scene ; par defaut, celles de la phase P0. */
  readonly init?: { readonly antialias?: boolean };
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
