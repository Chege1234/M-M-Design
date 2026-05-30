import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

class HeroCanvasBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <HeroCanvasFallback />;
    return this.props.children;
  }
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false })
    );
  } catch {
    return false;
  }
}

function HeroCanvasFallback() {
  return (
    <div
      className="absolute inset-0 w-full h-full bg-gradient-to-br from-sand via-mauve/80 to-sand"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

const TOTAL = 12;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── Building Definition ──────────────────────────────────────────────────────
// Contemporary stepped composition inspired by BIG / Ando
// Three stacked volumes with parapets + punched windows

const VOLUMES = [
  // [w, h, d, px, py, pz]  — py = center Y
  { w: 11, h: 2.0, d: 7.5, x:  0.0, y: 1.0,  z:  0.0 }, // wide podium
  { w:  7, h: 3.5, d: 5.5, x:  0.5, y: 3.75,  z: -1.0 }, // mid volume (stepped back)
  { w:  4, h: 2.5, d: 3.5, x: -1.0, y: 6.5,  z: -2.0 }, // top volume (further back)
];

const PARAPETS = VOLUMES.map(v => ({
  w: v.w + 0.4, h: 0.35, d: v.d + 0.4,
  x: v.x, y: v.y + v.h / 2 + 0.175, z: v.z,
}));

// Floor slabs: thin overhanging horizontal bands expressed on mid and top volumes
const SLABS = [
  { w: 7.4, h: 0.12, d: 5.9, x:  0.5, y: 2.04, z: -1.0 }, // 1st slab mid
  { w: 7.4, h: 0.12, d: 5.9, x:  0.5, y: 3.68, z: -1.0 }, // 2nd slab mid
  { w: 4.4, h: 0.12, d: 3.9, x: -1.0, y: 5.28, z: -2.0 }, // 1st slab top
  { w: 4.4, h: 0.12, d: 3.9, x: -1.0, y: 6.78, z: -2.0 }, // 2nd slab top
];

// Window panels: dark punched rectangles on front faces (z = front face z + tiny offset)
function buildWindowLayout(vol, cols, rows, winW, winH, gapX, gapY, zFront) {
  const wins = [];
  const startX = vol.x - (cols - 1) * (winW + gapX) / 2;
  const startY = vol.y - vol.h / 2 + 0.6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      wins.push({
        x: startX + c * (winW + gapX),
        y: startY + r * (winH + gapY) + winH / 2,
        z: zFront,
        w: winW, h: winH, d: 0.07,
      });
    }
  }
  return wins;
}

// Mid volume front face z = vol.z + vol.d/2 = -1 + 2.75 = 1.75
// Top volume front face z = -2 + 1.75 = -0.25
const WINDOWS = [
  ...buildWindowLayout(VOLUMES[0], 8, 1, 0.8, 0.7, 0.6, 0, 2.0 + 0.04),  // podium strip windows
  ...buildWindowLayout(VOLUMES[1], 3, 2, 1.1, 1.1, 0.55, 0.5, 1.75 + 0.04), // mid facade
  ...buildWindowLayout(VOLUMES[2], 2, 2, 0.9, 0.9, 0.5, 0.4, -0.25 + 0.04), // top facade
];

// ─── Component ────────────────────────────────────────────────────────────────

function HeroCanvasInner() {
  const mountRef = useRef(null);
  const [useFallback, setUseFallback] = useState(() => !canUseWebGL());

  useEffect(() => {
    if (useFallback) return;

    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'low-power',
      });
      if (!renderer.getContext()) {
        throw new Error('WebGL context unavailable');
      }
    } catch {
      setUseFallback(true);
      return;
    }

    // Renderer configured
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(0, 12, 24);
    camera.lookAt(0, 3, 0);

    // ── PHASE 1: Blueprint Grid ───────────────────────────────
    const GRID_SIZE = 24;
    const DIVS = 24;
    const step = GRID_SIZE / DIVS;
    const gridPts = [];
    for (let i = 0; i <= DIVS; i++) {
      const p = -GRID_SIZE / 2 + i * step;
      gridPts.push(-GRID_SIZE / 2, 0, p, GRID_SIZE / 2, 0, p);
      gridPts.push(p, 0, -GRID_SIZE / 2, p, 0, GRID_SIZE / 2);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
    const gridMat = new THREE.LineBasicMaterial({ color: 0x1a3a5c, transparent: true, opacity: 0 });
    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    scene.add(gridLines);

    // ── PHASE 1: Floor Plan Lines ─────────────────────────────
    // Outline the three volumes from above + some dimension lines
    const planVerts = [
      // Podium outline
      -5.5, 0, -3.75,  5.5, 0, -3.75,
       5.5, 0, -3.75,  5.5, 0,  3.75,
       5.5, 0,  3.75, -5.5, 0,  3.75,
      -5.5, 0,  3.75, -5.5, 0, -3.75,
      // Mid volume offset
      -3.0, 0.01, -3.75,  4.0, 0.01, -3.75,
       4.0, 0.01, -3.75,  4.0, 0.01,  1.0,
       4.0, 0.01,  1.0,  -3.0, 0.01,  1.0,
      -3.0, 0.01,  1.0,  -3.0, 0.01, -3.75,
      // Top volume
      -3.0, 0.02, -3.75,  1.0, 0.02, -3.75,
       1.0, 0.02, -3.75,  1.0, 0.02, -0.25,
       1.0, 0.02, -0.25, -3.0, 0.02, -0.25,
      -3.0, 0.02, -0.25, -3.0, 0.02, -3.75,
      // Dimension markers
      -5.5, 0, -4.4,  5.5, 0, -4.4,
      -5.5, 0, -4.2, -5.5, 0, -4.6,
       5.5, 0, -4.2,  5.5, 0, -4.6,
      // Interior circulation
       0, 0, -3.75,  0, 0,  3.75,
    ];
    const planGeo = new THREE.BufferGeometry();
    planGeo.setAttribute('position', new THREE.Float32BufferAttribute(planVerts, 3));
    planGeo.setDrawRange(0, 0);
    const planMat = new THREE.LineBasicMaterial({ color: 0x7cc8f8, transparent: true, opacity: 0 });
    const planLines = new THREE.LineSegments(planGeo, planMat);
    scene.add(planLines);
    const totalPlanVerts = planVerts.length / 3;

    // Annotation dots
    const dotPositions = [
      [-5.5, 0, -3.75], [5.5, 0, -3.75], [5.5, 0, 3.75], [-5.5, 0, 3.75],
      [-3.0, 0, -3.75], [4.0, 0, 1.0], [-3.0, 0, -0.25], [1.0, 0, -0.25],
    ];
    const dotGeo = new THREE.SphereGeometry(0.06, 7, 7);
    const dots = dotPositions.map(([x, y, z]) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(dotGeo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    });

    // ── PHASE 2: Wireframe Building ───────────────────────────
    const wireGroup = new THREE.Group();
    const wireMat = () => new THREE.LineBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0 });

    const addWireBox = (w, h, d, x, y, z) => {
      const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), wireMat());
      m.position.set(x, y, z);
      wireGroup.add(m);
    };

    // Main volumes
    VOLUMES.forEach(v => addWireBox(v.w, v.h, v.d, v.x, v.y, v.z));
    // Parapets
    PARAPETS.forEach(p => addWireBox(p.w, p.h, p.d, p.x, p.y, p.z));
    // Floor slabs
    SLABS.forEach(s => addWireBox(s.w, s.h, s.d, s.x, s.y, s.z));
    // Vertical columns / fins on podium facade
    for (let i = 0; i < 5; i++) {
      addWireBox(0.18, 2.0, 0.18, -4 + i * 2, 1.0, 3.75);
    }

    wireGroup.scale.y = 0;
    scene.add(wireGroup);

    // ── PHASE 3: Solid Building ───────────────────────────────
    const solidGroup = new THREE.Group();

    // Concrete material — warm Ando grey
    const concreteMat = () => new THREE.MeshStandardMaterial({
      color: 0xd2cbbf, roughness: 0.88, metalness: 0.03,
      transparent: true, opacity: 0,
    });
    // Darker underside / slab material
    const slabMat = () => new THREE.MeshStandardMaterial({
      color: 0xb8b0a4, roughness: 0.9, metalness: 0.02,
      transparent: true, opacity: 0,
    });
    // Window glass — very dark tinted
    const glassMat = () => new THREE.MeshStandardMaterial({
      color: 0x0d1520, roughness: 0.05, metalness: 0.6,
      transparent: true, opacity: 0,
    });

    const addSolidBox = (w, h, d, x, y, z, matFn) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matFn());
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      solidGroup.add(mesh);
      return mesh;
    };

    // Main volumes
    VOLUMES.forEach(v => addSolidBox(v.w, v.h, v.d, v.x, v.y, v.z, concreteMat));
    // Parapets
    PARAPETS.forEach(p => addSolidBox(p.w, p.h, p.d, p.x, p.y, p.z, concreteMat));
    // Slabs (slightly darker)
    SLABS.forEach(s => addSolidBox(s.w, s.h, s.d, s.x, s.y, s.z, slabMat));
    // Columns
    for (let i = 0; i < 5; i++) {
      addSolidBox(0.22, 2.0, 0.22, -4 + i * 2, 1.0, 3.77, concreteMat);
    }
    // Window panels
    WINDOWS.forEach(w => addSolidBox(w.w, w.h, w.d, w.x, w.y, w.z, glassMat));

    // Ground plane
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1, transparent: true, opacity: 0 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    solidGroup.add(groundMesh);

    scene.add(solidGroup);

    // ── Lighting ──────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xfff8f0, 0.45);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
    sun.position.set(8, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8aaec8, 0.6);
    fill.position.set(-10, 6, -8);
    scene.add(fill);

    const sky = new THREE.HemisphereLight(0xd0e8f0, 0x302820, 0.4);
    scene.add(sky);

    // ── Helpers ───────────────────────────────────────────────
    function setWireOpacity(op) {
      wireGroup.children.forEach(c => { c.material.opacity = op; });
    }
    function setSolidOpacity(op, glassOp) {
      solidGroup.children.forEach(c => {
        const isGlass = c.material.color && c.material.color.getHex() === 0x0d1520;
        c.material.opacity = isGlass ? glassOp : op;
      });
    }
    function setPlanDraw(progress) {
      const count = Math.floor((progress * totalPlanVerts) / 2) * 2;
      planGeo.setDrawRange(0, count);
    }

    // ── Animation ─────────────────────────────────────────────
    const clock = new THREE.Clock();
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime() % TOTAL;
      const loopT = elapsed / TOTAL;

      // Camera path
      const orbitAngle = loopT * Math.PI * 0.4;
      const radius = 24 + Math.sin(loopT * Math.PI) * 2;

      // Phase 1: Blueprint (0–4s)
      if (elapsed < 4) {
        const p = elapsed / 4;

        wireGroup.scale.y = 0;
        setWireOpacity(0);
        setSolidOpacity(0, 0);

        gridMat.opacity = Math.min(p / 0.22, 1) * 0.6;

        const planP = Math.max(0, Math.min((p - 0.22) / 0.52, 1));
        planMat.opacity = easeInOut(planP) * 0.9;
        setPlanDraw(planP);

        const dotP = Math.max(0, (p - 0.76) / 0.24);
        dots.forEach((dot, i) => {
          dot.material.opacity = Math.max(0, Math.min((dotP - i / dots.length) * dots.length, 1));
        });

        // Top-down camera drifting slightly
        camera.position.set(
          Math.sin(p * 0.3) * 3,
          22 - p * 5,
          20 - p * 4
        );
        camera.lookAt(0, 0, 0);

      // Phase 2: Extrusion (4–8s)
      } else if (elapsed < 8) {
        const p = (elapsed - 4) / 4;
        const extP = easeInOut(Math.min(p * 1.3, 1));

        gridMat.opacity = 0.6 * (1 - p * 0.65);
        planMat.opacity = 0.9 * (1 - p * 0.72);
        setPlanDraw(1);
        dots.forEach(d => { d.material.opacity = Math.max(1 - p * 2.5, 0); });

        wireGroup.scale.y = extP;
        setWireOpacity(Math.min(p * 1.8, 0.92));
        setSolidOpacity(0, 0);

        // Pull back, begin orbit
        const angle = p * 0.25;
        camera.position.set(
          Math.sin(angle) * (20 + p * 4),
          8 + p * 3,
          Math.cos(angle) * (20 + p * 4)
        );
        camera.lookAt(0, 3.5, 0);

      // Phase 3: Solidification (8–12s)
      } else {
        const p = (elapsed - 8) / 4;
        const fadeEnd = p > 0.87 ? (p - 0.87) / 0.13 : 0;

        gridMat.opacity = 0.22 * (1 - p) * (1 - fadeEnd);
        planMat.opacity = 0.22 * (1 - p) * (1 - fadeEnd);

        wireGroup.scale.y = 1;
        setWireOpacity(Math.max(0.92 - p * 2.3, 0) * (1 - fadeEnd));

        const solidP = easeInOut(Math.min(p * 2.0, 1)) * (1 - fadeEnd);
        setSolidOpacity(solidP, solidP * 0.85);

        // Slow cinematic orbit
        const angle = 0.25 + p * 0.55;
        camera.position.set(
          Math.sin(angle) * (radius + 2),
          9 - p * 1.5,
          Math.cos(angle) * (radius + 2)
        );
        camera.lookAt(0, 3.5, 0);
      }

      renderer.render(scene, camera);
    }

    animate();

    const ro = new ResizeObserver(() => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [useFallback]);

  if (useFallback) return <HeroCanvasFallback />;

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}

export default function HeroCanvas() {
  return (
    <HeroCanvasBoundary>
      <HeroCanvasInner />
    </HeroCanvasBoundary>
  );
}