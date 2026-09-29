import type { Application, WebGLRenderer, WebGPURenderer } from 'pixi.js';
import { rendererPreference, renderModeOf } from './render-mode';
import type { RenderMode, SceneHandle, SceneId, SceneInstance } from './types';

/**
 * Moteur des zones de scene (contracts/scene-host.md, research R10). Une application Pixi par
 * scene, creee a la premiere demande et gardee pour toute la vie de la page : quitter l'ecran
 * arrete l'animation et detache le canvas, y revenir le rattache (FR-027, SC-009). Pixi est
 * importe dynamiquement : il ne pese pas sur le premier chargement (SC-003).
 */

/** Delai laisse a Pixi pour retablir un contexte perdu avant d'afficher le message (FR-024). */
const DELAI_PERTE_MS = 3000;

interface Scene {
  readonly id: SceneId;
  mode: RenderMode;
  modeAvantPerte: RenderMode;
  app: Application | undefined;
  instance: SceneInstance | undefined;
  creation: Promise<void> | undefined;
  hote: HTMLElement | undefined;
  observateur: ResizeObserver | undefined;
  readonly ecouteurs: Set<(mode: RenderMode) => void>;
  minuteurPerte: ReturnType<typeof setTimeout> | undefined;
  /** Perdue sans retablissement : l'application sera recreee a la prochaine ouverture. */
  perdue: boolean;
  /** Images rendues, pour la cadence du badge de diagnostic. */
  images: number;
}

const scenes = new Map<SceneId, Scene>();

/** Densite de l'ecran, plafonnee a 2 (plan.md §5, FR-025). */
const resolution = () => Math.min(window.devicePixelRatio || 1, 2);

const animationsReduites = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function changerMode(scene: Scene, mode: RenderMode): void {
  scene.mode = mode;
  for (const ecouteur of scene.ecouteurs) ecouteur(mode);
}

function modeDe(app: Application): RenderMode {
  const rendu = app.renderer;
  const version =
    rendu.name === 'webgl' ? (rendu as WebGLRenderer).context.webGLVersion : undefined;
  return renderModeOf(rendu.name, version);
}

/** La scene occupe toute sa zone, a la densite de l'ecran, et une image est rendue aussitot. */
function redimensionner(scene: Scene): void {
  const { app, hote, instance } = scene;
  if (!app || !hote || scene.mode === 'perdu') return;
  const { width, height } = hote.getBoundingClientRect();
  if (width === 0 || height === 0) return;
  app.renderer.resize(width, height, resolution());
  instance?.resize(width, height);
  app.render();
}

/** Anime seulement si la scene est affichee, l'onglet visible et les animations permises. */
function animer(scene: Scene): void {
  const { app, instance, hote } = scene;
  if (!app || !instance) return;
  const actif =
    hote !== undefined &&
    scene.mode !== 'perdu' &&
    document.visibilityState === 'visible' &&
    !animationsReduites();
  if (actif) {
    instance.start();
    app.start();
  } else {
    instance.stop();
    app.stop();
    // Une image fixe quand les animations sont reduites (FR-035).
    if (hote !== undefined && scene.mode !== 'perdu') app.render();
  }
}

function attacher(scene: Scene): void {
  const { app, hote } = scene;
  if (!app || !hote || scene.perdue) return;
  if (app.canvas.parentElement !== hote) hote.prepend(app.canvas);
  scene.observateur?.disconnect();
  scene.observateur = new ResizeObserver(() => redimensionner(scene));
  scene.observateur.observe(hote);
  redimensionner(scene);
  animer(scene);
}

function perte(scene: Scene): void {
  if (scene.mode === 'perdu' || scene.mode === 'indisponible') return;
  scene.modeAvantPerte = scene.mode;
  changerMode(scene, 'perdu');
  animer(scene);
  clearTimeout(scene.minuteurPerte);
  scene.minuteurPerte = setTimeout(() => {
    if (scene.mode !== 'perdu') return;
    scene.perdue = true;
    scene.app?.canvas.remove();
    changerMode(scene, 'indisponible');
  }, DELAI_PERTE_MS);
}

function retablissement(scene: Scene): void {
  if (scene.mode !== 'perdu') return;
  clearTimeout(scene.minuteurPerte);
  changerMode(scene, scene.modeAvantPerte);
  attacher(scene);
}

/** Pertes du contexte : WebGL par les evenements du canvas, WebGPU par `device.lost`. */
function surveillerPertes(scene: Scene, app: Application): void {
  if (app.renderer.name === 'webgl') {
    app.canvas.addEventListener('webglcontextlost', () => perte(scene));
    app.canvas.addEventListener('webglcontextrestored', () => retablissement(scene));
    return;
  }
  const rendu = app.renderer as WebGPURenderer;
  const suivre = () => {
    const peripherique = rendu.gpu?.device;
    void peripherique?.lost.then(() => {
      if (scene.app === app) perte(scene);
    });
  };
  suivre();
  // Pixi recree le peripherique perdu, puis previent par contextChange.
  rendu.runners.contextChange.add({
    contextChange: () => {
      retablissement(scene);
      suivre();
    },
  });
}

async function creer(scene: Scene): Promise<void> {
  try {
    await document.fonts.ready;
    const [{ Application }, { placeholder }] = await Promise.all([
      import('pixi.js'),
      import('./scenes/placeholder'),
    ]);
    const app = new Application();
    await app.init({
      preference: rendererPreference(window.location.search),
      resolution: resolution(),
      autoDensity: true,
      // Sans multi-echantillonnage : le fond provisoire n'a aucun bord a lisser, et le MSAA
      // multiplie le cout du rendu logiciel (navigateurs sans acceleration, CI). Les scenes des
      // phases P1 et P2 de la feuille de route reconsidereront ce choix.
      antialias: false,
      roundPixels: true,
      autoStart: false,
      background: '#020405',
      width: 1,
      height: 1,
    });
    app.ticker.add(() => {
      scene.images += 1;
    });
    scene.app = app;
    scene.instance = placeholder.create(app);
    surveillerPertes(scene, app);
    changerMode(scene, modeDe(app));
  } catch {
    // "No available renderer" : ni WebGPU ni WebGL (FR-024).
    changerMode(scene, 'indisponible');
  }
}

function detruire(scene: Scene): void {
  scene.observateur?.disconnect();
  try {
    scene.instance?.destroy();
    scene.app?.destroy(true);
  } catch {
    // Contexte deja perdu : il n'y a plus rien a liberer cote carte graphique.
  }
  scene.app = undefined;
  scene.instance = undefined;
  scene.creation = undefined;
  scene.perdue = false;
}

function poignee(scene: Scene): SceneHandle {
  return {
    get mode() {
      return scene.mode;
    },
    onModeChange(ecouteur) {
      scene.ecouteurs.add(ecouteur);
      return () => scene.ecouteurs.delete(ecouteur);
    },
  };
}

let ecoutesGlobales = false;

/** Onglet masque, changement de densite (fenetre deplacee, zoom), animations reduites. */
function ecouterLeNavigateur(): void {
  if (ecoutesGlobales) return;
  ecoutesGlobales = true;
  const toutes = (action: (scene: Scene) => void) => () => {
    for (const scene of scenes.values()) action(scene);
  };
  document.addEventListener('visibilitychange', toutes(animer));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', toutes(animer));
  const suivreDensite = () => {
    matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => {
        toutes(redimensionner)();
        suivreDensite();
      },
      { once: true },
    );
  };
  suivreDensite();
}

/** Rattache la scene a `host` et la demarre. Cree l'application a la premiere demande. */
export async function acquireScene(id: SceneId, host: HTMLElement): Promise<SceneHandle> {
  ecouterLeNavigateur();
  let scene = scenes.get(id);
  if (!scene) {
    scene = {
      id,
      mode: 'initialisation',
      modeAvantPerte: 'initialisation',
      app: undefined,
      instance: undefined,
      creation: undefined,
      hote: undefined,
      observateur: undefined,
      ecouteurs: new Set(),
      minuteurPerte: undefined,
      perdue: false,
      images: 0,
    };
    scenes.set(id, scene);
  }
  if (scene.perdue) {
    detruire(scene);
    changerMode(scene, 'initialisation');
  }
  scene.hote = host;
  scene.creation ??= creer(scene);
  await scene.creation;
  if (scene.hote === host) attacher(scene);
  return poignee(scene);
}

/** Arrete l'animation et detache le canvas ; l'application est conservee. */
export function releaseScene(id: SceneId): void {
  const scene = scenes.get(id);
  if (!scene) return;
  scene.observateur?.disconnect();
  scene.observateur = undefined;
  scene.hote = undefined;
  animer(scene);
  scene.app?.canvas.remove();
}

/** Etat des scenes pour le badge de diagnostic (contracts/scene-host.md). */
export function diagnostic(): {
  scenes: { id: SceneId; mode: RenderMode }[];
  applications: number;
  visible: { id: SceneId; images: number } | undefined;
} {
  const liste = [...scenes.values()];
  const visible = liste.find((s) => s.hote !== undefined && s.app !== undefined);
  return {
    scenes: liste.map((s) => ({ id: s.id, mode: s.mode })),
    applications: liste.filter((s) => s.app !== undefined).length,
    visible: visible ? { id: visible.id, images: visible.images } : undefined,
  };
}
