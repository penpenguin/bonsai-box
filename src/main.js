import "./styles.css";
import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createBonsaiSpec, generateRandomSeed, listPresets } from "./bonsaiGenerator.js";
import { createUI } from "./ui.js";

const MATERIAL_COLORS = {
  pot: 0x47535f,
  soil: 0x52443d,
  moss: 0x627b58,
  stone: 0x8c8478,
  trunk: 0x6c4d39,
  leaf: 0x5f7d59,
};

const canvas = document.querySelector("#viewer-canvas");
const stage = document.querySelector("#viewer-stage");
const controlsRoot = document.querySelector("#controls");

const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = SRGBColorSpace;

const scene = new Scene();
scene.fog = new Fog(0x0f1318, 17, 32);

const camera = new PerspectiveCamera(38, 1, 0.1, 100);
const initialCameraPosition = new Vector3(13.2, 9.6, 15.6);
camera.position.copy(initialCameraPosition);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enablePan = false;
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.06;
orbitControls.minDistance = 8;
orbitControls.maxDistance = 23;
orbitControls.minPolarAngle = 0.45;
orbitControls.maxPolarAngle = Math.PI / 2.05;
orbitControls.autoRotateSpeed = 0.8;

const ambientLight = new AmbientLight(0xf1efe6, 1.8);
scene.add(ambientLight);

const keyLight = new DirectionalLight(0xfff0df, 2.4);
keyLight.position.set(7, 13, 9);
scene.add(keyLight);

const rimLight = new DirectionalLight(0xb5cad7, 0.7);
rimLight.position.set(-9, 8, -8);
scene.add(rimLight);

const floorShadow = new Mesh(
  new PlaneGeometry(30, 30),
  new MeshBasicMaterial({
    color: 0x081016,
    transparent: true,
    opacity: 0.18,
  }),
);
floorShadow.rotation.x = -Math.PI / 2;
floorShadow.position.y = -1.86;
scene.add(floorShadow);

const boxGeometry = new BoxGeometry(1, 1, 1);
const bonsaiRoot = new Group();
scene.add(bonsaiRoot);

const presetByKey = new Map(listPresets().map((preset) => [preset.key, preset]));
const storedState = createUI.loadStoredState?.() ?? null;

const appState = {
  preset: storedState?.preset && presetByKey.has(storedState.preset) ? storedState.preset : "straight",
  seed: storedState?.seed || generateRandomSeed(),
  autoRotate: Boolean(storedState?.autoRotate),
};

let currentSpec = null;

const ui = createUI({
  root: controlsRoot,
  state: {
    preset: appState.preset,
    presetLabel: presetByKey.get(appState.preset)?.label || "直幹",
    seed: appState.seed,
    autoRotate: appState.autoRotate,
  },
  actions: {
    onPresetChange(nextPreset) {
      if (!presetByKey.has(nextPreset)) {
        return;
      }
      appState.preset = nextPreset;
      renderBonsai();
    },
    onRandomize() {
      appState.seed = generateRandomSeed();
      renderBonsai();
    },
    onResetView() {
      resetView(true);
    },
    onToggleAutoRotate() {
      appState.autoRotate = !appState.autoRotate;
      orbitControls.autoRotate = appState.autoRotate;
      syncUi();
      ui.persistState();
    },
    onSavePng() {
      savePng();
    },
    onApplySeed(inputSeed) {
      appState.seed = inputSeed || generateRandomSeed();
      renderBonsai();
    },
  },
});

orbitControls.autoRotate = appState.autoRotate;
renderBonsai();
resizeRenderer();
window.addEventListener("resize", resizeRenderer);
renderer.setAnimationLoop(animate);

function renderBonsai() {
  currentSpec = createBonsaiSpec({
    preset: appState.preset,
    seed: appState.seed,
  });

  disposeChildren(bonsaiRoot);
  const blocksByMaterial = groupBlocksByMaterial(currentSpec.blocks);
  for (const [materialKey, blocks] of blocksByMaterial) {
    const material = new MeshStandardMaterial({
      color: MATERIAL_COLORS[materialKey],
      flatShading: true,
      roughness: 1,
      metalness: 0.02,
    });
    const mesh = new InstancedMesh(boxGeometry, material, blocks.length);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);

    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();

    blocks.forEach((block, index) => {
      position.set(block.x + block.sx / 2, block.y + block.sy / 2, block.z + block.sz / 2);
      scale.set(block.sx, block.sy, block.sz);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    bonsaiRoot.add(mesh);
  }

  bonsaiRoot.position.y = 0;
  resetView(false);
  syncUi();
  ui.persistState();
}

function groupBlocksByMaterial(blocks) {
  const map = new Map();
  blocks.forEach((block) => {
    if (!map.has(block.material)) {
      map.set(block.material, []);
    }
    map.get(block.material).push(block);
  });
  return map;
}

function resetView(updateUi) {
  camera.position.copy(initialCameraPosition);
  if (currentSpec?.cameraTarget) {
    orbitControls.target.set(
      currentSpec.cameraTarget.x,
      currentSpec.cameraTarget.y,
      currentSpec.cameraTarget.z,
    );
  } else {
    orbitControls.target.set(0, 3.1, 0);
  }
  orbitControls.update();

  if (updateUi) {
    syncUi();
  }
}

function syncUi() {
  const preset = presetByKey.get(appState.preset);
  ui.updateState({
    preset: appState.preset,
    presetLabel: preset?.label || "直幹",
    seed: appState.seed,
    autoRotate: appState.autoRotate,
  });
}

function resizeRenderer() {
  const width = stage.clientWidth || window.innerWidth;
  const height = stage.clientHeight || Math.max(window.innerHeight * 0.6, 360);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(time) {
  orbitControls.update();
  bonsaiRoot.position.y = Math.sin(time * 0.0011) * 0.06;
  renderer.render(scene, camera);
}

function savePng() {
  renderer.render(scene, camera);
  const link = document.createElement("a");
  link.href = renderer.domElement.toDataURL("image/png");
  link.download = `bonsai-box-${appState.preset}-${appState.seed}.png`;
  link.click();
}

function disposeChildren(group) {
  while (group.children.length > 0) {
    const child = group.children[group.children.length - 1];
    if (!child) {
      continue;
    }

    group.remove(child);
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  }
}
