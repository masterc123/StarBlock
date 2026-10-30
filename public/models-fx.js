// ============================================================================
// 4. HIGH-DETAIL STARCRAFT II TERRAN STRUCTURES, SIEGE TANKS & UNITS
// ============================================================================

// --- SCULPTED 3D GEOMETRY GENERATORS (Extrude, Lathe, CatmullRom Splines & Ribbed Bio-Mesh) ---
// Zero basic primitive shapes: all hulls, barrels, domes, spires, crystals, collars, and bio-carapaces
// are procedurally sculpted with full UV coordinates and smooth/faceted normals.
function createExtrudedArmorHullGeo(width, height, length, bevelSize, chamfer) {
    const minDim = Math.max(0.01, Math.min(width, height, length));
    const bSize = (typeof bevelSize === 'number') ? bevelSize : Math.min(0.06, minDim * 0.16);
    const cSize = (typeof chamfer === 'number') ? chamfer : Math.min(width, height) * 0.24;
    const hw = width * 0.5;
    const hh = height * 0.5;
    const cw = Math.min(hw * 0.45, cSize);
    const ch = Math.min(hh * 0.45, cSize);
    const shape = new THREE.Shape();
    shape.moveTo(-hw + cw, -hh);
    shape.lineTo(hw - cw, -hh);
    shape.lineTo(hw, -hh + ch);
    shape.lineTo(hw, hh - ch);
    shape.lineTo(hw - cw, hh);
    shape.lineTo(-hw + cw, hh);
    shape.lineTo(-hw, hh - ch);
    shape.lineTo(-hw, -hh + ch);
    shape.closePath();

    const safeBevel = Math.min(bSize, length * 0.28, hw * 0.35, hh * 0.35);
    const depth = Math.max(0.008, length - safeBevel * 2);
    const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: safeBevel,
        bevelSize: safeBevel * 0.85,
        bevelSegments: 2,
        curveSegments: 4
    });
    geo.translate(0, 0, -depth * 0.5);
    geo.computeVertexNormals();
    const uvAttr = geo.attributes.uv;
    if (uvAttr) {
        const span = Math.max(width, height, length, 0.25);
        for (let i = 0; i < uvAttr.count; i++) {
            const u = uvAttr.getX(i);
            const v = uvAttr.getY(i);
            uvAttr.setXY(
                i,
                0.5 + THREE.MathUtils.clamp(u / (span * 1.35), -0.28, 0.28),
                0.5 + THREE.MathUtils.clamp(v / (span * 1.35), -0.28, 0.28)
            );
        }
        uvAttr.needsUpdate = true;
    }
    return geo;
}

function createSculptedEggSacGeo(rx = 0.16, ry = 0.22, segs = 10) {
    const pts = [];
    const steps = Math.max(6, segs);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const phi = t * Math.PI;
        const bulge = 1.0 + 0.16 * Math.sin(phi * 2.0);
        const r = Math.max(0.002, Math.sin(phi) * rx * bulge);
        const y = -Math.cos(phi) * ry;
        pts.push(new THREE.Vector2(r, y));
    }
    const geo = new THREE.LatheGeometry(pts, Math.max(8, segs + 2));
    geo.computeVertexNormals();
    return geo;
}
window.createSculptedEggSacGeo = createSculptedEggSacGeo;

function createSculptedLatheBarrelGeo(rTop = 0.2, rBot = 0.2, height = 1.0, segs = 12, heightSegs = 1, openEnded = false) {
    const rt = Math.max(0.004, rTop);
    const rb = Math.max(0.004, rBot);
    const rm = (rt + rb) * 0.5;
    const hh = height * 0.5;
    const pts = [];
    if (!openEnded) {
        pts.push(new THREE.Vector2(0.0, -hh));
    }
    pts.push(
        new THREE.Vector2(rb * 0.86, -hh),
        new THREE.Vector2(rb * 1.03, -hh + height * 0.08),
        new THREE.Vector2(THREE.MathUtils.lerp(rb, rt, 0.26) * 0.96, -hh + height * 0.26),
        new THREE.Vector2(rm * 1.045, -hh + height * 0.44),
        new THREE.Vector2(rm * 1.045, -hh + height * 0.56),
        new THREE.Vector2(THREE.MathUtils.lerp(rb, rt, 0.74) * 0.96, -hh + height * 0.74),
        new THREE.Vector2(rt * 1.03, hh - height * 0.08),
        new THREE.Vector2(rt * 0.86, hh)
    );
    if (!openEnded) {
        pts.push(new THREE.Vector2(0.0, hh));
    }
    const geo = new THREE.LatheGeometry(pts, Math.max(6, segs));
    geo.computeVertexNormals();
    return geo;
}

function createSculptedArmorDomeGeo(radius = 0.25, widthSegments = 10, heightSegments = 8, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
    const wSegs = Math.max(6, Math.min(12, widthSegments));
    const hSegs = Math.max(5, Math.min(10, heightSegments));
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let iy = 0; iy <= hSegs; iy++) {
        const v = iy / hSegs;
        const theta = thetaStart + v * thetaLength;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        // Sculpted compound armor plate contour: subtle equatorial collar & dorsal crest
        const bandBevel = 1.0 + Math.sin(theta * 3.0) * 0.035;
        for (let ix = 0; ix <= wSegs; ix++) {
            const u = ix / wSegs;
            const phi = phiStart + u * phiLength;
            const facetMod = 1.0 + Math.cos(phi * 4.0) * 0.028 * sinTheta;
            const r = radius * bandBevel * facetMod;
            const x = -r * Math.cos(phi) * sinTheta;
            const y = radius * cosTheta * (cosTheta > 0 ? 1.04 : 0.96);
            const z = r * Math.sin(phi) * sinTheta;
            positions.push(x, y, z);
            uvs.push(u, 1 - v);
        }
    }

    for (let iy = 0; iy < hSegs; iy++) {
        for (let ix = 0; ix < wSegs; ix++) {
            const a = iy * (wSegs + 1) + (ix + 1);
            const b = iy * (wSegs + 1) + ix;
            const c = (iy + 1) * (wSegs + 1) + ix;
            const d = (iy + 1) * (wSegs + 1) + (ix + 1);
            if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
            if (iy !== hSegs - 1 || thetaStart + thetaLength < Math.PI) indices.push(b, c, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function createSculptedOgiveSpireGeo(radius = 0.2, height = 0.6, radialSegments = 10) {
    const r = Math.max(0.005, radius);
    const hh = height * 0.5;
    const pts = [
        new THREE.Vector2(0.0, -hh),
        new THREE.Vector2(r * 0.90, -hh),
        new THREE.Vector2(r * 1.04, -hh + height * 0.10),
        new THREE.Vector2(r * 0.88, -hh + height * 0.24),
        new THREE.Vector2(r * 0.72, -hh + height * 0.50),
        new THREE.Vector2(r * 0.44, -hh + height * 0.76),
        new THREE.Vector2(r * 0.16, -hh + height * 0.93),
        new THREE.Vector2(0.0, hh)
    ];
    const geo = new THREE.LatheGeometry(pts, Math.max(5, radialSegments));
    geo.computeVertexNormals();
    return geo;
}

function createSculptedFacetedCrystalGeo(radius = 0.3, detail = 0) {
    const r = Math.max(0.01, radius);
    const pts = [
        new THREE.Vector2(0.0, -r * 1.08),
        new THREE.Vector2(r * 0.48, -r * 0.62),
        new THREE.Vector2(r * 0.96, -r * 0.14),
        new THREE.Vector2(r * 1.04, 0.0),
        new THREE.Vector2(r * 0.96, r * 0.14),
        new THREE.Vector2(r * 0.48, r * 0.62),
        new THREE.Vector2(0.0, r * 1.08)
    ];
    const segs = detail > 1 ? 10 : (detail > 0 ? 8 : 6);
    const geo = new THREE.LatheGeometry(pts, segs);
    geo.computeVertexNormals();
    return geo;
}

function createSculptedTorusCollarGeo(radius = 0.4, tube = 0.05, radialSegments = 8, tubularSegments = 20, arc = Math.PI * 2) {
    const rSegs = Math.max(6, radialSegments);
    const tSegs = Math.max(8, tubularSegments);
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let j = 0; j <= rSegs; j++) {
        const v = (j / rSegs) * Math.PI * 2;
        // Chamfered armored collar cross-section
        const bevelMod = 1.0 + Math.cos(v * 4.0) * 0.08;
        const cosV = Math.cos(v) * bevelMod;
        const sinV = Math.sin(v) * bevelMod;
        for (let i = 0; i <= tSegs; i++) {
            const u = (i / tSegs) * arc;
            const x = (radius + tube * cosV) * Math.cos(u);
            const y = (radius + tube * cosV) * Math.sin(u);
            const z = tube * sinV;
            positions.push(x, y, z);
            uvs.push(i / tSegs, j / rSegs);
        }
    }

    for (let j = 1; j <= rSegs; j++) {
        for (let i = 1; i <= tSegs; i++) {
            const a = (tSegs + 1) * j + i - 1;
            const b = (tSegs + 1) * (j - 1) + i - 1;
            const c = (tSegs + 1) * (j - 1) + i;
            const d = (tSegs + 1) * j + i;
            indices.push(a, b, d, b, c, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function createCurvedScytheBladeGeo(length = 0.65, baseRadius = 0.08, curveBend = 0.22) {
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, curveBend * 0.35, length * 0.36),
        new THREE.Vector3(0, curveBend, length * 0.74),
        new THREE.Vector3(0, curveBend * 0.45, length)
    ]);
    const tubularSegments = 10;
    const radialSegments = 7;
    const frames = curve.computeFrenetFrames(tubularSegments, false);
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= tubularSegments; i++) {
        const u = i / tubularSegments;
        const pt = curve.getPointAt(u);
        const N = frames.normals[i];
        const B = frames.binormals[i];
        const r = baseRadius * Math.pow(1 - u, 0.72) * (1 + Math.sin(u * Math.PI) * 0.28);
        for (let j = 0; j <= radialSegments; j++) {
            const vFrac = j / radialSegments;
            const v = vFrac * Math.PI * 2;
            const sin = Math.sin(v);
            const cos = Math.cos(v);
            const vx = pt.x + (cos * N.x * 0.52 + sin * B.x * 1.25) * r;
            const vy = pt.y + (cos * N.y * 0.52 + sin * B.y * 1.25) * r;
            const vz = pt.z + (cos * N.z * 0.52 + sin * B.z * 1.25) * r;
            positions.push(vx, vy, vz);
            uvs.push(u, vFrac);
        }
    }
    for (let i = 0; i < tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j;
            const b = (i + 1) * (radialSegments + 1) + j;
            const c = (i + 1) * (radialSegments + 1) + (j + 1);
            const d = i * (radialSegments + 1) + (j + 1);
            indices.push(a, b, d, b, c, d);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function createOrganicBioCarapaceGeo(rx = 0.3, ry = 0.26, rz = 0.44, ribCount = 6, ribDepth = 0.08) {
    const wSegs = 14;
    const hSegs = 10;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let iy = 0; iy <= hSegs; iy++) {
        const v = iy / hSegs;
        const theta = v * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let ix = 0; ix <= wSegs; ix++) {
            const u = ix / wSegs;
            const phi = u * Math.PI * 2;
            let x = -Math.cos(phi) * sinTheta;
            let y = cosTheta;
            let z = Math.sin(phi) * sinTheta;
            const dorsalFactor = Math.max(0, y);
            const ventralFactor = Math.max(0, -y);
            const ribWave = Math.sin(z * Math.PI * ribCount) * ribDepth * dorsalFactor;
            const spineCrest = Math.exp(-Math.abs(x) * 4.8) * 0.125 * dorsalFactor;
            const lateralFlange = Math.exp(-Math.pow(Math.abs(y) - 0.15, 2) * 14.0) * 0.06;
            const taper = 1.0 - Math.max(0, -z) * 0.18;
            x *= rx * taper * (1 + ribWave * 0.55 + lateralFlange);
            y = y * ry + spineCrest + ribWave - ventralFactor * 0.04;
            z *= rz;
            positions.push(x, y, z);
            uvs.push(u, 1 - v);
        }
    }

    for (let iy = 0; iy < hSegs; iy++) {
        for (let ix = 0; ix < wSegs; ix++) {
            const a = iy * (wSegs + 1) + (ix + 1);
            const b = iy * (wSegs + 1) + ix;
            const c = (iy + 1) * (wSegs + 1) + ix;
            const d = (iy + 1) * (wSegs + 1) + (ix + 1);
            if (iy !== 0) indices.push(a, b, d);
            if (iy !== hSegs - 1) indices.push(b, c, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function createBatWingMembraneGeo(span = 1.25, chord = 0.78) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(span * 0.42, chord * 0.55, span, chord * 0.32);
    shape.quadraticCurveTo(span * 0.82, -chord * 0.08, span * 0.68, -chord * 0.42);
    shape.quadraticCurveTo(span * 0.48, -chord * 0.18, span * 0.34, -chord * 0.52);
    shape.quadraticCurveTo(span * 0.16, -chord * 0.25, 0, -chord * 0.35);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.024,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.015,
        bevelSegments: 2,
        curveSegments: 12
    });
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
}

// Procedural Ribbed Steel Tank Track Texture + Bump Map
let _treadHeightCanvas = null;
const treadTex = makeProceduralTexture((ctx, w, h) => {
    const hCanvas = document.createElement('canvas');
    hCanvas.width = w; hCanvas.height = h;
    const hCtx = hCanvas.getContext('2d');
    hCtx.fillStyle = '#202020';
    hCtx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#15191f';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
        // Raised steel track link cleats
        ctx.fillStyle = '#2b323c';
        ctx.fillRect(10, y + 4, w - 20, 18);
        hCtx.fillStyle = '#b8b8b8';
        hCtx.fillRect(10, y + 4, w - 20, 18);

        ctx.fillStyle = '#434d5c';
        ctx.fillRect(18, y + 6, w - 36, 7);
        hCtx.fillStyle = '#efefef';
        hCtx.fillRect(18, y + 6, w - 36, 7);

        // Center guide teeth
        ctx.fillStyle = '#0d1014';
        ctx.fillRect(w / 2 - 14, y, 28, 32);
        hCtx.fillStyle = '#0a0a0a';
        hCtx.fillRect(w / 2 - 14, y, 28, 32);

        // Track pin bolts
        ctx.fillStyle = '#6c788a';
        ctx.fillRect(4, y + 8, 6, 10);
        ctx.fillRect(w - 10, y + 8, 6, 10);
        hCtx.fillStyle = '#ffffff';
        hCtx.fillRect(4, y + 8, 6, 10);
        hCtx.fillRect(w - 10, y + 8, 6, 10);
    }
    _treadHeightCanvas = hCanvas;
}, 1, 6);

// Procedural Panelled Military Armor Camo Texture
const camoArmorTex = makeProceduralTexture((ctx, w, h) => {
    ctx.fillStyle = '#3b4a36';
    ctx.fillRect(0, 0, w, h);
    // Digital / Polygonal armor camo patches
    ctx.fillStyle = '#2b3727';
    [[20, 20, 180, 110], [260, 140, 210, 150], [60, 310, 220, 140]].forEach(([x, y, pw, ph]) => {
        ctx.fillRect(x, y, pw, ph);
    });
    ctx.fillStyle = '#4e5f48';
    [[220, 30, 160, 90], [40, 180, 150, 110], [310, 320, 170, 120]].forEach(([x, y, pw, ph]) => {
        ctx.fillRect(x, y, pw, ph);
    });
    // Brushed metallic micro-grain
    for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 14 + Math.random() * 24, 2);
    }
    // Welded armor seam grid & rivets
    ctx.strokeStyle = 'rgba(12, 16, 12, 0.65)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.stroke();
}, 2, 2);

MAT.treadMat = new THREE.MeshStandardMaterial({
    map: treadTex,
    roughnessMap: typeof metalRoughnessTex !== 'undefined' ? metalRoughnessTex : null,
    roughness: 0.68,
    metalness: 0.36
});
MAT.camoArmor = new THREE.MeshStandardMaterial({
    map: camoArmorTex,
    roughnessMap: typeof metalRoughnessTex !== 'undefined' ? metalRoughnessTex : null,
    roughness: 0.48,
    metalness: 0.30
});
MAT.canopyGlass = new THREE.MeshStandardMaterial({
    color: 0x0e2d42,
    roughness: 0.18,
    metalness: 0.45,
    emissive: 0x052236,
    emissiveIntensity: 0.25
});
MAT.solarisGold = new THREE.MeshStandardMaterial({
    color: 0xe8b238,
    roughness: 0.30,
    metalness: 0.42,
    emissive: 0x2e1c02,
    emissiveIntensity: 0.14
});
MAT.solarisIvory = new THREE.MeshStandardMaterial({
    color: 0xe6e1d3,
    roughness: 0.38,
    metalness: 0.24
});
MAT.solarisObsidian = new THREE.MeshStandardMaterial({
    color: 0x182234,
    roughnessMap: typeof metalRoughnessTex !== 'undefined' ? metalRoughnessTex : null,
    roughness: 0.36,
    metalness: 0.38
});
MAT.solarisCrystal = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.18,
    metalness: 0.38,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.78
});
MAT.solarisPrismGlow = new THREE.MeshStandardMaterial({
    color: 0xffe484,
    roughness: 0.20,
    metalness: 0.42,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.92,
    envMapIntensity: 0.45
});
if (typeof SHADER_ENGINE !== 'undefined' && typeof SHADER_ENGINE.applyBuildingShader === 'function') {
    SHADER_ENGINE.applyBuildingShader(MAT.treadMat);
    SHADER_ENGINE.applyBuildingShader(MAT.camoArmor);
    SHADER_ENGINE.applyBuildingShader(MAT.canopyGlass);
    SHADER_ENGINE.applyBuildingShader(MAT.solarisGold);
    SHADER_ENGINE.applyBuildingShader(MAT.solarisIvory);
    SHADER_ENGINE.applyBuildingShader(MAT.solarisObsidian);
    SHADER_ENGINE.applyBuildingShader(MAT.solarisCrystal);
    SHADER_ENGINE.applyBuildingShader(MAT.solarisPrismGlow);
}

function applyBuildingShadowsAndFowToGroup(group, isMainBase = false) {
    if (!group) return group;
    const sunDir = new THREE.Vector3(58, 96, 48).normalize();
    group.traverse(child => {
        if (child.isMesh && child.material) {
            // Ensure Main Base and all buildings properly cast and receive shadow maps
            child.castShadow = true;
            child.receiveShadow = true;
            const mat = child.material;
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                if (typeof SHADER_ENGINE !== 'undefined' && typeof SHADER_ENGINE.applyBuildingShader === 'function') {
                    SHADER_ENGINE.applyBuildingShader(mat);
                }
            }
            // Apply baked directional + AO vertex lighting norms on Main Base geometry
            if (isMainBase && child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                child.geometry.computeVertexNormals();
            }
        }
    });
    return group;
}

// ============================================================================
// 4. FIXED 3D FLOATING EMBLEMS + REDESIGNED SC2 BARRACKS & WAR FACTORY
// ============================================================================

// Creates BOTH a flat rotating ground emblem ring AND an upright 3D floating holographic icon above the base!
function createFloatingEmblem(tex, radius = 3.2, isEnemy = false) {
    const emblemGroup = new THREE.Group();

    // 1. Flat Ground Emblem Ring under the Base (hidden on enemy side per user request)
    const ringGeo = new THREE.RingGeometry(0.2, radius, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = isEnemy ? MAT.enemyHoloMat : MAT.humanHoloMat;
    const groundDisc = new THREE.Mesh(ringGeo, ringMat);
    groundDisc.position.y = 0.08;
    groundDisc.visible = !isEnemy;
    emblemGroup.add(groundDisc);

    // 2. Upright Floating 3D Hologram Icon Banner above the Base (hidden on enemy side)
    const holoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), ringMat);
    holoPlane.position.y = isEnemy ? 6.6 : 2.85;
    holoPlane.visible = !isEnemy;
    emblemGroup.add(holoPlane);

    emblemGroup.traverse(c => { c.raycast = () => {}; });
    emblemGroup.userData = { groundDisc, holoPlane };
    return emblemGroup;
}

// Helper to safely free GPU memory when removing temporary meshes (Prevents WebGL Context Crash)
function disposeHierarchy(node) {
    if (!node) return;
    scene.remove(node);
    // Unit meshes are built from per-spawn unique geometries (never shared pools),
    // so geometry disposal is safe here. Materials are ALWAYS shared MAT.* entries
    // and must never be disposed.
    node.traverse(child => {
        if (child.geometry) child.geometry.dispose();
    });
}

function createEngineeredBuilding(type, includeEmblem = true) {
    const root = new THREE.Group();
    const mainStructure = new THREE.Group();
    root.add(mainStructure);
    const damageableParts = [];

    if (type === 'base') {
        // ====================================================================
        // REMODELED TERRAN ORBITAL COMMAND CENTER FORTRESS (COMPLETE ENCLOSED CITADEL)
        // Heavy Octagonal Armored Foundation Plinth + 4 Hydraulic Landing Outriggers +
        // Fully Enclosed Chobham-Armored Command Citadel Superstructure +
        // Pressurized Front Command Airlock & Blast Gate + Port Telemetry Wing +
        // Starboard Twin Fusion Cooling Towers + 4 Corner VTOL Bastions +
        // Multi-Tiered Panoramic Command Bridge + Twin Auto-Turret + Orbital Dish!
        // ====================================================================
        if (includeEmblem) {
            const emblem = createFloatingEmblem(humanEmblemTex, 4.1, false);
            root.add(emblem);
            root.userData.emblem = emblem;
        }

        // 1. Heavy Octagonal Armored Citadel Foundation Deck + 4 Cardinal Blast Ramps
        const baseApron = new THREE.Mesh(createExtrudedArmorHullGeo(4.48, 0.30, 4.48, 0.12, 0.72), MAT.darkSteel);
        baseApron.position.y = 0.15;
        baseApron.receiveShadow = true;
        const hazardTrim = new THREE.Mesh(createExtrudedArmorHullGeo(4.12, 0.08, 4.12, 0.06, 0.62), MAT.hazard);
        hazardTrim.position.y = 0.31;
        const innerDeck = new THREE.Mesh(createExtrudedArmorHullGeo(3.82, 0.14, 3.82, 0.06, 0.54), MAT.gunmetal);
        innerDeck.position.y = 0.38;
        mainStructure.add(baseApron, hazardTrim, innerDeck);

        // 4 Cardinal Approach Blast Ramps + 4 Diagonal Articulated Hydraulic Outrigger Stabilizer Legs
        for (let i = 0; i < 4; i++) {
            const cardA = (i / 4) * Math.PI * 2;
            const rampGroup = new THREE.Group();
            rampGroup.position.set(Math.cos(cardA) * 2.22, 0.15, Math.sin(cardA) * 2.22);
            rampGroup.rotation.y = -cardA + Math.PI / 2;
            const rampMesh = new THREE.Mesh(createExtrudedArmorHullGeo(1.42, 0.14, 0.72, 0.03, 0.14), i === 0 ? MAT.hazard : MAT.darkSteel);
            rampMesh.rotation.x = 0.22;
            const guideL = new THREE.Mesh(createExtrudedArmorHullGeo(0.10, 0.16, 0.68), MAT.cyanGlow);
            guideL.position.set(-0.65, 0.09, 0);
            const guideR = guideL.clone();
            guideR.position.x = 0.65;
            rampGroup.add(rampMesh, guideL, guideR);
            mainStructure.add(rampGroup);

            // Diagonal Hydraulic Outrigger Leg with Glowing Plasma Shock Absorber
            const diagA = cardA + Math.PI / 4;
            const legGroup = new THREE.Group();
            legGroup.position.set(Math.cos(diagA) * 2.28, 0.18, Math.sin(diagA) * 2.28);
            legGroup.rotation.y = -diagA + Math.PI / 2;

            const footPad = new THREE.Mesh(createSculptedLatheBarrelGeo(0.44, 0.54, 0.18, 8), MAT.darkSteel);
            footPad.position.set(0, -0.08, 0.34);
            const upperStrut = new THREE.Mesh(createExtrudedArmorHullGeo(0.44, 0.90, 0.58, 0.04, 0.12), MAT.terranPlating);
            upperStrut.rotation.x = -0.42;
            upperStrut.position.set(0, 0.38, 0.06);
            const plasmaPiston = new THREE.Mesh(createSculptedLatheBarrelGeo(0.10, 0.10, 0.82, 12), MAT.cyanGlow);
            plasmaPiston.rotation.x = -0.42;
            plasmaPiston.position.set(0, 0.40, 0.22);
            const clawToe = new THREE.Mesh(createExtrudedArmorHullGeo(0.52, 0.14, 0.36, 0.02, 0.06), MAT.hazard);
            clawToe.position.set(0, -0.05, 0.56);
            legGroup.add(footPad, upperStrut, plasmaPiston, clawToe);
            mainStructure.add(legGroup);
        }

        // 2. Fully Enclosed Central Armored Citadel Fortress Hull (Solid, Heavily Plated Terran Command Center!)
        const primaryCitadelHull = new THREE.Mesh(createExtrudedArmorHullGeo(3.16, 1.28, 3.08, 0.12, 0.48), MAT.terranPlating);
        primaryCitadelHull.position.set(0, 1.02, -0.04);
        primaryCitadelHull.castShadow = true;
        primaryCitadelHull.receiveShadow = true;

        // Sloped Chobham Armor Casemate Glacis Plates on All 4 Cardinal Faces
        const glacisBelt = new THREE.Mesh(createExtrudedArmorHullGeo(3.34, 0.54, 3.26, 0.08, 0.52), MAT.gunmetal);
        glacisBelt.position.set(0, 0.68, -0.04);
        const teamArmorBand = new THREE.Mesh(createExtrudedArmorHullGeo(3.26, 0.34, 3.18, 0.06, 0.48), MAT.terranBlue);
        teamArmorBand.position.set(0, 1.24, -0.04);
        mainStructure.add(primaryCitadelHull, glacisBelt, teamArmorBand);
        damageableParts.push(primaryCitadelHull, glacisBelt, teamArmorBand);

        // 3. Front Armored Command Airlock, Blast Gate & Illuminated Tactical Deployment Portal
        const frontPortalFrame = new THREE.Mesh(createExtrudedArmorHullGeo(1.96, 1.12, 0.38, 0.06, 0.18), MAT.darkSteel);
        frontPortalFrame.position.set(0, 0.94, 1.48);
        const portalHeader = new THREE.Mesh(createExtrudedArmorHullGeo(2.12, 0.28, 0.48, 0.05, 0.14), MAT.copper);
        portalHeader.position.set(0, 1.54, 1.50);
        const bayDoor = new THREE.Mesh(createExtrudedArmorHullGeo(1.48, 0.88, 0.18, 0.03, 0.10), MAT.gunmetal);
        bayDoor.position.set(0, 0.86, 1.58);
        root.userData.bayDoor = bayDoor;

        const doorHazardStripe = new THREE.Mesh(createExtrudedArmorHullGeo(1.36, 0.16, 0.20), MAT.hazard);
        doorHazardStripe.position.set(0, 0.56, 1.59);
        const doorVisorSlit = new THREE.Mesh(createExtrudedArmorHullGeo(1.18, 0.12, 0.21), MAT.cyanGlow);
        doorVisorSlit.position.set(0, 1.08, 1.59);

        [-0.82, 0.82].forEach(px => {
            const buttress = new THREE.Mesh(createExtrudedArmorHullGeo(0.28, 1.18, 0.46, 0.04, 0.08), MAT.terranBlue);
            buttress.position.set(px, 0.96, 1.52);
            const chevronLight = new THREE.Mesh(createExtrudedArmorHullGeo(0.08, 0.68, 0.48), MAT.amberGlow);
            chevronLight.position.set(px, 0.96, 1.53);
            mainStructure.add(buttress, chevronLight);
        });
        mainStructure.add(frontPortalFrame, portalHeader, bayDoor, doorHazardStripe, doorVisorSlit);

        // 4. Port & Starboard Integrated Command Wings (Telemetry Bunker & Twin Fusion Cooling Towers)
        // Port (-X) Orbital Telemetry & Logistics Annex
        const portWing = new THREE.Mesh(createExtrudedArmorHullGeo(0.62, 1.04, 2.18, 0.06, 0.22), MAT.gunmetal);
        portWing.position.set(-1.68, 0.90, -0.06);
        const portBlueCap = new THREE.Mesh(createExtrudedArmorHullGeo(0.56, 0.22, 1.96, 0.04, 0.16), MAT.terranBlue);
        portBlueCap.position.set(-1.68, 1.48, -0.06);
        const portSensorStrip = new THREE.Mesh(createExtrudedArmorHullGeo(0.66, 0.14, 1.56), MAT.cyanGlow);
        portSensorStrip.position.set(-1.69, 1.04, -0.06);
        mainStructure.add(portWing, portBlueCap, portSensorStrip);
        damageableParts.push(portWing);

        // Starboard (+X) Twin Fusion Reactor Cooling Towers & Plasma Manifold
        const starboardBase = new THREE.Mesh(createExtrudedArmorHullGeo(0.62, 0.68, 2.18, 0.06, 0.22), MAT.darkSteel);
        starboardBase.position.set(1.68, 0.72, -0.06);
        mainStructure.add(starboardBase);
        [-0.56, 0.48].forEach(zTower => {
            const coolingTower = new THREE.Mesh(createSculptedLatheBarrelGeo(0.28, 0.34, 1.12, 14), MAT.gunmetal);
            coolingTower.position.set(1.68, 1.32, zTower);
            const plasmaRing = new THREE.Mesh(createSculptedLatheBarrelGeo(0.30, 0.30, 0.22, 14), MAT.plasmaShader);
            plasmaRing.position.set(1.68, 1.38, zTower);
            const towerCap = new THREE.Mesh(createSculptedLatheBarrelGeo(0.22, 0.30, 0.16, 14), MAT.copper);
            towerCap.position.set(1.68, 1.94, zTower);
            mainStructure.add(coolingTower, plasmaRing, towerCap);
        });

        // Rear (-Z) Armored Auxiliary Hangar Bulkhead & Exhaust Vents
        const rearBulkhead = new THREE.Mesh(createExtrudedArmorHullGeo(2.24, 1.08, 0.44, 0.06, 0.20), MAT.darkSteel);
        rearBulkhead.position.set(0, 0.92, -1.58);
        const rearGlowGrille = new THREE.Mesh(createExtrudedArmorHullGeo(1.64, 0.24, 0.46), MAT.amberGlow);
        rearGlowGrille.position.set(0, 0.88, -1.59);
        mainStructure.add(rearBulkhead, rearGlowGrille);

        // 5. Four Corner Armored Bastion Sponsons + VTOL Orbital Lift Engine Nacelles + Plasma Conduits
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const bastion = new THREE.Group();
            bastion.position.set(Math.cos(a) * 1.62, 0.38, Math.sin(a) * 1.62);
            bastion.rotation.y = -a + Math.PI / 4;

            const bastionHull = new THREE.Mesh(createExtrudedArmorHullGeo(0.92, 1.18, 0.96, 0.07, 0.22), MAT.gunmetal);
            bastionHull.position.y = 0.59;
            bastionHull.castShadow = true;

            const slopedCrown = new THREE.Mesh(createExtrudedArmorHullGeo(0.82, 0.30, 0.86, 0.05, 0.18), MAT.terranBlue);
            slopedCrown.position.y = 1.28;

            // Lathe-Sculpted VTOL Orbital Thruster Pod mounted on outer bastion face
            const nozzlePts = [
                new THREE.Vector2(0.14, 0.0),
                new THREE.Vector2(0.26, 0.16),
                new THREE.Vector2(0.22, 0.58),
                new THREE.Vector2(0.28, 0.72)
            ];
            const vtolPod = new THREE.Mesh(new THREE.LatheGeometry(nozzlePts, 14), MAT.darkSteel);
            vtolPod.position.set(0, 0.22, 0.48);
            const vtolGlow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), MAT.cyanGlow);
            vtolGlow.rotation.x = Math.PI / 2;
            vtolGlow.position.set(0, 0.20, 0.48);

            const shieldFin = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.76, 0.12), MAT.plasmaShader);
            shieldFin.position.set(0, 0.62, 0.50);

            const pipeCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 1.32, 0),
                new THREE.Vector3(0, 1.68, -0.35),
                new THREE.Vector3(0, 1.78, -0.82)
            ]);
            const conduitTube = new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 12, 0.065, 8, false), MAT.copper);

            bastion.add(bastionHull, slopedCrown, vtolPod, vtolGlow, shieldFin, conduitTube);
            mainStructure.add(bastion);
            damageableParts.push(bastionHull);
        }

        // 6. Multi-Tiered Upper Command Bridge Citadel Superstructure & Panoramic Armored Viewports
        const upperCitadelDeck = new THREE.Mesh(createExtrudedArmorHullGeo(2.68, 0.52, 2.62, 0.09, 0.34), MAT.gunmetal);
        upperCitadelDeck.position.set(0, 1.84, -0.06);
        upperCitadelDeck.castShadow = true;

        const upperDeckTrim = new THREE.Mesh(createExtrudedArmorHullGeo(2.74, 0.10, 2.68, 0.04, 0.34), MAT.hazard);
        upperDeckTrim.position.set(0, 1.62, -0.06);

        const bridgeTower = new THREE.Mesh(createExtrudedArmorHullGeo(1.96, 0.58, 1.88, 0.08, 0.28), MAT.terranPlating);
        bridgeTower.position.set(0, 2.34, -0.10);
        bridgeTower.castShadow = true;

        const bridgeCanopy = new THREE.Mesh(createExtrudedArmorHullGeo(2.02, 0.22, 1.94, 0.04, 0.24), MAT.canopyGlass);
        bridgeCanopy.position.set(0, 2.38, -0.10);

        const bridgeGlowBand = new THREE.Mesh(createExtrudedArmorHullGeo(2.04, 0.07, 1.96, 0.02, 0.24), MAT.cyanGlow);
        bridgeGlowBand.position.set(0, 2.38, -0.10);

        const commandCrown = new THREE.Mesh(createExtrudedArmorHullGeo(1.62, 0.28, 1.56, 0.06, 0.22), MAT.terranBlue);
        commandCrown.position.set(0, 2.72, -0.10);

        const crownCap = new THREE.Mesh(createExtrudedArmorHullGeo(1.24, 0.14, 1.18, 0.04, 0.16), MAT.darkSteel);
        crownCap.position.set(0, 2.90, -0.10);

        // Dorsal Holographic Tactical Projector Dome on Upper Terrace
        const baseHoloGlobe = new THREE.Group();
        baseHoloGlobe.position.set(0.62, 2.98, 0.22);
        const holoBase = new THREE.Mesh(createSculptedLatheBarrelGeo(0.22, 0.28, 0.12, 12), MAT.copper);
        holoBase.position.y = -0.08;
        const globeSphere = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.18, 1), MAT.scaffoldWire);
        const globeOrbit1 = new THREE.Mesh(createSculptedTorusCollarGeo(0.25, 0.018, 6, 20), MAT.cyanGlow);
        globeOrbit1.rotation.x = Math.PI / 3;
        const globeOrbit2 = new THREE.Mesh(createSculptedTorusCollarGeo(0.21, 0.015, 6, 20), MAT.amberGlow);
        globeOrbit2.rotation.y = Math.PI / 3;
        baseHoloGlobe.add(holoBase, globeSphere, globeOrbit1, globeOrbit2);
        root.userData.baseHoloGlobe = baseHoloGlobe;

        mainStructure.add(
            upperCitadelDeck, upperDeckTrim, bridgeTower, bridgeCanopy,
            bridgeGlowBand, commandCrown, crownCap, baseHoloGlobe
        );
        damageableParts.push(upperCitadelDeck, bridgeTower, commandCrown);

        // 7. Forward Automated Twin-Barrel Point-Defense Sentinel Turret on Upper Deck Prow
        const baseDefenseTurret = new THREE.Group();
        baseDefenseTurret.position.set(0, 2.12, 0.94);
        const pdMount = new THREE.Mesh(createSculptedLatheBarrelGeo(0.26, 0.32, 0.16, 12), MAT.darkSteel);
        const pdHead = new THREE.Mesh(createExtrudedArmorHullGeo(0.46, 0.24, 0.50, 0.03, 0.08), MAT.copper);
        pdHead.position.y = 0.15;
        [-0.12, 0.12].forEach(bx => {
            const pdBarrel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.034, 0.042, 0.56, 8), MAT.darkSteel);
            pdBarrel.rotation.x = Math.PI / 2;
            pdBarrel.position.set(bx, 0.15, 0.36);
            const pdMuzzle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.046, 0.046, 0.09, 8), MAT.cyanGlow);
            pdMuzzle.rotation.x = Math.PI / 2;
            pdMuzzle.position.set(bx, 0.15, 0.62);
            baseDefenseTurret.add(pdBarrel, pdMuzzle);
        });
        baseDefenseTurret.add(pdMount, pdHead);
        mainStructure.add(baseDefenseTurret);
        root.userData.baseDefenseTurret = baseDefenseTurret;

        // 8. Dorsal Gyroscopic Fusion Core Reactor + Counter-Rotating Containment Rings
        const baseReactorGroup = new THREE.Group();
        baseReactorGroup.position.set(0, 3.28, -0.14);
        const reactorPedestal = new THREE.Mesh(createSculptedLatheBarrelGeo(0.44, 0.58, 0.24, 12), MAT.darkSteel);
        reactorPedestal.position.y = -0.24;
        const reactorCore = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.32, 2), MAT.plasmaShader);
        const outerGyroRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.52, 0.048, 10, 28), MAT.copper);
        outerGyroRing.rotation.x = Math.PI / 3;
        const innerGyroRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.42, 0.036, 10, 24), MAT.cyanGlow);
        innerGyroRing.rotation.y = Math.PI / 3;
        baseReactorGroup.add(reactorPedestal, reactorCore, outerGyroRing, innerGyroRing);
        mainStructure.add(baseReactorGroup);
        root.userData.baseReactorCore = reactorCore;
        root.userData.outerGyroRing = outerGyroRing;
        root.userData.innerGyroRing = innerGyroRing;

        // 9. High-Gain Orbital Uplink Phased-Array Radar Dish & Comms Spire
        const radarAssembly = new THREE.Group();
        radarAssembly.position.set(-0.62, 2.86, -0.52);
        const mast = new THREE.Mesh(createSculptedLatheBarrelGeo(0.12, 0.18, 0.54, 10), MAT.darkSteel);
        mast.position.y = 0.24;
        const dish = new THREE.Mesh(createSculptedArmorDomeGeo(0.58, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), MAT.gunmetal);
        dish.material.side = THREE.DoubleSide;
        dish.rotation.x = Math.PI * 0.65;
        dish.position.set(0, 0.54, 0.16);
        const feedHorn = new THREE.Mesh(createSculptedLatheBarrelGeo(0.03, 0.07, 0.36, 8), MAT.copper);
        feedHorn.rotation.x = -Math.PI * 0.35;
        feedHorn.position.set(0, 0.64, 0.32);
        const crossAntenna = new THREE.Mesh(createExtrudedArmorHullGeo(1.08, 0.05, 0.05), MAT.amberGlow);
        crossAntenna.position.set(0, 0.60, -0.16);
        const beaconTip = new THREE.Mesh(createSculptedArmorDomeGeo(0.085, 10, 10), MAT.cyanGlow);
        beaconTip.position.set(0, 0.86, -0.14);
        radarAssembly.add(mast, dish, feedHorn, crossAntenna, beaconTip);
        mainStructure.add(radarAssembly);
        root.userData.rotor = radarAssembly;
    }
    else if (type === 'barracks') {
        // RECREATED FROM SCRATCH: SC2 TERRAN INFANTRY BARRACKS CITADEL
        // Sculpted Beveled Octagonal Foundation + Sloped Chobham Garrison + Vaulted Lathe Roof Dome +
        // 4 Lathe-Turned VTOL Lift Nacelles + Twin Armored Sponson Bunkers + Illuminated Weapon Rack Bay
        const foundation = new THREE.Mesh(createExtrudedArmorHullGeo(2.96, 0.24, 2.86, 0.08, 0.42), MAT.darkSteel);
        foundation.position.y = 0.12; foundation.receiveShadow = true;
        const hazardTrim = new THREE.Mesh(createExtrudedArmorHullGeo(2.68, 0.06, 2.58, 0.03, 0.36), MAT.hazard);
        hazardTrim.position.y = 0.25;
        mainStructure.add(foundation, hazardTrim);

        // Hollow U-Frame Garrison Citadel Hull (Leaves Front Deployment Bay 100% Open & Uncovered so Interior Hole is Clearly Visible!)
        const rearCitadel = new THREE.Mesh(createExtrudedArmorHullGeo(1.88, 0.92, 0.96, 0.08, 0.24), MAT.camoArmor);
        rearCitadel.position.set(0, 0.68, -0.66); rearCitadel.castShadow = true;
        const leftBayWall = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 0.92, 1.32, 0.04, 0.10), MAT.camoArmor);
        leftBayWall.position.set(-0.78, 0.68, 0.42); leftBayWall.castShadow = true;
        const rightBayWall = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 0.92, 1.32, 0.04, 0.10), MAT.camoArmor);
        rightBayWall.position.set(0.78, 0.68, 0.42); rightBayWall.castShadow = true;

        const upperDeck = new THREE.Mesh(createExtrudedArmorHullGeo(1.68, 0.44, 1.94, 0.07, 0.24), MAT.gunmetal);
        upperDeck.position.set(0, 1.34, -0.02); upperDeck.castShadow = true;

        // Lathe-Sculpted Armored Blast Dome Crown with Plasma Core Reactor Skylight
        const domePts = [
            new THREE.Vector2(0.0, 0.32),
            new THREE.Vector2(0.38, 0.30),
            new THREE.Vector2(0.62, 0.18),
            new THREE.Vector2(0.72, 0.0)
        ];
        const roofDome = new THREE.Mesh(new THREE.LatheGeometry(domePts, 16), MAT.darkSteel);
        roofDome.position.set(0, 1.56, -0.12);
        const plasmaSkylight = new THREE.Mesh(createSculptedLatheBarrelGeo(0.34, 0.38, 0.08, 16), MAT.plasmaShader);
        plasmaSkylight.position.set(0, 1.84, -0.12);
        mainStructure.add(rearCitadel, leftBayWall, rightBayWall, upperDeck, roofDome, plasmaSkylight);
        damageableParts.push(rearCitadel, leftBayWall, rightBayWall, upperDeck, roofDome);

        // Twin Lateral Armored Pillbox Sponsons + 4 Corner VTOL Lift-Engine Nacelles
        [-1.16, 1.16].forEach(xOff => {
            const sponson = new THREE.Group();
            sponson.position.set(xOff, 0.26, -0.06);

            const hull = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 0.86, 1.92, 0.06, 0.22), MAT.gunmetal);
            hull.position.y = 0.43; hull.castShadow = true;
            const glacisCap = new THREE.Mesh(createExtrudedArmorHullGeo(0.58, 0.24, 1.68, 0.05, 0.18), MAT.camoArmor);
            glacisCap.rotation.z = xOff > 0 ? -0.32 : 0.32;
            glacisCap.position.set(xOff > 0 ? -0.06 : 0.06, 0.94, 0);

            // Glowing Plasma Optic Firing Slit
            const visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.14, 1.38, 0.02, 0.04), MAT.plasmaShader);
            visor.position.set(xOff > 0 ? 0.31 : -0.31, 0.58, 0);

            // Front & Rear Lathe-Sculpted VTOL Thruster Pods
            [-0.78, 0.72].forEach(zPod => {
                const nozzlePts = [
                    new THREE.Vector2(0.12, 0.0),
                    new THREE.Vector2(0.22, 0.14),
                    new THREE.Vector2(0.19, 0.48),
                    new THREE.Vector2(0.24, 0.56)
                ];
                const thrusterPod = new THREE.Mesh(new THREE.LatheGeometry(nozzlePts, 14), MAT.darkSteel);
                thrusterPod.position.set(xOff > 0 ? 0.22 : -0.22, 0.12, zPod);
                const jetGlow = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), MAT.cyanGlow);
                jetGlow.rotation.x = Math.PI / 2;
                jetGlow.position.set(xOff > 0 ? 0.22 : -0.22, 0.11, zPod);
                sponson.add(thrusterPod, jetGlow);
            });

            // Curved High-Pressure Plasma Conduit Tube connecting Sponson to Roof Dome
            const pipeCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0.85, -0.35),
                new THREE.Vector3(xOff > 0 ? -0.22 : 0.22, 1.25, -0.35),
                new THREE.Vector3(xOff > 0 ? -0.52 : 0.52, 1.38, -0.25)
            ]);
            const conduit = new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 12, 0.055, 8, false), MAT.copper);

            sponson.add(hull, glacisCap, visor, conduit);
            mainStructure.add(sponson);
            damageableParts.push(hull);
        });

        // Open Portal Frame (Left/Right Jamb Pillars + Top Lintel — leaves center hole 100% open!)
        [-0.68, 0.68].forEach(xJamb => {
            const jamb = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.96, 0.28, 0.03, 0.06), MAT.hazard);
            jamb.position.set(xJamb, 0.70, 1.06);
            mainStructure.add(jamb);
        });
        const portalLintel = new THREE.Mesh(createExtrudedArmorHullGeo(1.62, 0.22, 0.34, 0.03, 0.08), MAT.copper);
        portalLintel.position.set(0, 1.18, 1.06);
        mainStructure.add(portalLintel);

        // --- BARRACKS OPEN 3D HOLE INTERIOR (Deep Recessed Armory Bay, Holo Tactical Map, Weapon Racks & 2 Mini CMC Troopers!) ---
        const interiorGroup = new THREE.Group();
        interiorGroup.position.set(0, 0.25, 0.48);

        // Dark Recessed Interior Cavity Shell (Back Wall, Floor Grate, Inner Side Bulkheads & Bright Ceiling Light)
        const intBackWall = new THREE.Mesh(createExtrudedArmorHullGeo(1.24, 0.88, 0.08), MAT.charredSteel);
        intBackWall.position.set(0, 0.44, -0.56);
        const intFloor = new THREE.Mesh(createExtrudedArmorHullGeo(1.24, 0.06, 1.28), MAT.darkSteel);
        intFloor.position.set(0, 0.03, 0.08);
        const intCeilingLight = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.92), MAT.cyanGlow);
        intCeilingLight.rotation.x = Math.PI / 2;
        intCeilingLight.position.set(0, 0.86, 0.08);

        // Rear Glowing Tactical Briefing Hologram Screen inside the Open Barracks Hole
        const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.48), MAT.plasmaShader);
        holoScreen.position.set(0, 0.48, -0.49);
        const holoFrame = new THREE.Mesh(createExtrudedArmorHullGeo(0.92, 0.54, 0.03), MAT.copper);
        holoFrame.position.set(0, 0.48, -0.51);

        // Left & Right Interior Weapon Racks (Holding Miniature C-14 Rifles & Plasma Blades)
        [-0.50, 0.50].forEach(xRack => {
            const rackFrame = new THREE.Mesh(createExtrudedArmorHullGeo(0.10, 0.68, 0.92), MAT.gunmetal);
            rackFrame.position.set(xRack, 0.36, 0.06);
            interiorGroup.add(rackFrame);
            for (let g = -1; g <= 1; g++) {
                const miniGun = new THREE.Mesh(createSculptedLatheBarrelGeo(0.022, 0.026, 0.42, 6), g === 0 ? MAT.cyanGlow : MAT.copper);
                miniGun.rotation.z = xRack > 0 ? 0.25 : -0.25;
                miniGun.position.set(xRack > 0 ? xRack - 0.07 : xRack + 0.07, 0.30, g * 0.24 + 0.06);
                interiorGroup.add(miniGun);
            }
        });

        // 2 Illuminated Bio-Diagnostic Pads + Miniature CMC Power-Armor Troopers Prepping Inside the Open Bay!
        const miniTroopers = [];
        [-0.25, 0.25].forEach((xPad, idx) => {
            const diagPad = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.19, 16), idx === 0 ? MAT.healGlow : MAT.cyanGlow);
            diagPad.rotation.x = -Math.PI / 2;
            diagPad.position.set(xPad, 0.07, 0.26);
            interiorGroup.add(diagPad);

            const miniSuit = new THREE.Group();
            miniSuit.position.set(xPad, 0.07, 0.26);
            const legs = new THREE.Mesh(createSculptedLatheBarrelGeo(0.06, 0.07, 0.20, 8), MAT.gunmetal);
            legs.position.y = 0.10;
            const torso = new THREE.Mesh(createSculptedLatheBarrelGeo(0.095, 0.075, 0.22, 10), idx === 0 ? MAT.terranBlue : MAT.oliveArmor);
            torso.position.y = 0.26;
            const helm = new THREE.Mesh(createSculptedArmorDomeGeo(0.07, 10, 10), idx === 0 ? MAT.terranBlue : MAT.oliveArmor);
            helm.position.y = 0.41;
            const visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.085, 0.04, 0.065), MAT.amberGlow);
            visor.position.set(0, 0.41, 0.045);
            const miniRifle = new THREE.Mesh(createExtrudedArmorHullGeo(0.035, 0.055, 0.24), MAT.darkSteel);
            miniRifle.position.set(0.075, 0.26, 0.07);
            miniSuit.add(legs, torso, helm, visor, miniRifle);
            interiorGroup.add(miniSuit);
            miniTroopers.push(miniSuit);
        });

        interiorGroup.add(intBackWall, intFloor, intCeilingLight, holoFrame, holoScreen);
        mainStructure.add(interiorGroup);
        root.userData.miniTroopers = miniTroopers;

        const ramp = new THREE.Mesh(createExtrudedArmorHullGeo(1.28, 0.12, 0.82, 0.03, 0.12), MAT.hazard);
        ramp.rotation.x = 0.18;
        ramp.position.set(0, 0.15, 1.38);

        // Retracted Upper Blast Shutter Valance (Docked high at y=1.18 so the Open 3D Interior Hole is NEVER covered!)
        const bayDoor = new THREE.Mesh(createExtrudedArmorHullGeo(1.12, 0.18, 0.12, 0.02, 0.05), MAT.hazard);
        bayDoor.position.set(0, 1.18, 1.08);
        mainStructure.add(ramp, bayDoor);
        root.userData.bayDoor = bayDoor;

        // Articulated Robotic Exoskeleton Armory Welder Arm
        const welderArm = new THREE.Group();
        welderArm.position.set(0.36, 0.84, 0.88);
        const upperBoom = new THREE.Mesh(createSculptedLatheBarrelGeo(0.04, 0.05, 0.42, 10), MAT.copper);
        const welderTip = new THREE.Mesh(createSculptedArmorDomeGeo(0.07, 10, 10), MAT.cyanGlow);
        welderTip.position.y = -0.21;
        welderArm.add(upperBoom, welderTip);
        mainStructure.add(welderArm);
        root.userData.welderArm = welderArm;
        root.userData.welderTip = welderTip;

        // Roof Comms Mast & Rotating Phalanx Radar Dish Assembly
        const commsMast = new THREE.Mesh(createSculptedLatheBarrelGeo(0.18, 0.26, 0.44, 12), MAT.darkSteel);
        commsMast.position.set(-0.42, 1.76, -0.42);
        mainStructure.add(commsMast);

        const turbine = new THREE.Group();
        turbine.position.set(-0.42, 2.06, -0.42);
        const radarDish = new THREE.Mesh(createExtrudedArmorHullGeo(0.92, 0.14, 0.18, 0.02, 0.05), MAT.amberGlow);
        const DishSensor = new THREE.Mesh(createSculptedArmorDomeGeo(0.12, 10, 10), MAT.cyanGlow);
        DishSensor.position.set(0, 0.1, 0);
        turbine.add(radarDish, DishSensor);
        mainStructure.add(turbine);
        root.userData.rotor = turbine;
    }
    else if (type === 'factory') {
        // RECREATED FROM SCRATCH: SC2 TERRAN HEAVY WAR FACTORY FOUNDRY
        // Beveled Foundry Apron + Twin Rib-Vaulted Assembly Hangars + 4 Plasma Clerestory Skylights +
        // Twin Lathe Smelting Blast Furnaces with Tube Manifolds + Triple Cryo-Deuterium Spheres + Animated Bridge Crane
        const foundation = new THREE.Mesh(createExtrudedArmorHullGeo(3.48, 0.28, 3.28, 0.09, 0.44), MAT.darkSteel);
        foundation.position.y = 0.14; foundation.receiveShadow = true;
        const apronTrim = new THREE.Mesh(createExtrudedArmorHullGeo(3.18, 0.07, 2.98, 0.03, 0.36), MAT.hazard);
        apronTrim.position.y = 0.29;
        mainStructure.add(foundation, apronTrim);

        // Hollow U-Frame Foundry Superstructure (Leaves Front Vehicle Assembly Bay 100% Open & Uncovered!)
        const rearFoundryHall = new THREE.Mesh(createExtrudedArmorHullGeo(2.44, 1.18, 0.96, 0.08, 0.24), MAT.gunmetal);
        rearFoundryHall.position.set(0.14, 0.76, -0.82);
        rearFoundryHall.castShadow = true;
        const leftFoundryWall = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 1.18, 1.56, 0.04, 0.12), MAT.gunmetal);
        leftFoundryWall.position.set(-0.92, 0.76, 0.38);
        leftFoundryWall.castShadow = true;
        const rightFoundryWall = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 1.18, 1.56, 0.04, 0.12), MAT.gunmetal);
        rightFoundryWall.position.set(1.20, 0.76, 0.38);
        rightFoundryWall.castShadow = true;
        const foundryRoofDeck = new THREE.Mesh(createExtrudedArmorHullGeo(2.48, 0.22, 2.42, 0.06, 0.22), MAT.gunmetal);
        foundryRoofDeck.position.set(0.14, 1.38, -0.10);
        foundryRoofDeck.castShadow = true;
        mainStructure.add(rearFoundryHall, leftFoundryWall, rightFoundryWall, foundryRoofDeck);
        damageableParts.push(rearFoundryHall, leftFoundryWall, rightFoundryWall, foundryRoofDeck);

        // 4 Sculpted Arched Structural Rib Trusses + Glowing Plasma Foundry Skylights
        [-0.78, -0.26, 0.26, 0.78].forEach(zRib => {
            const archRib = new THREE.Mesh(createExtrudedArmorHullGeo(2.56, 0.28, 0.28, 0.05, 0.18), MAT.camoArmor);
            archRib.position.set(0.14, 1.52, zRib - 0.10);
            archRib.castShadow = true;
            const skylight = new THREE.Mesh(createExtrudedArmorHullGeo(2.12, 0.12, 0.18, 0.02, 0.05), MAT.plasmaShader);
            skylight.position.set(0.14, 1.62, zRib + 0.08);
            mainStructure.add(archRib, skylight);
            damageableParts.push(archRib);
        });

        // Right Wing: Triple Pressurized Cryo-Deuterium Spherical Vessels + TubeGeometry Fuel Manifolds
        [-0.72, 0.0, 0.72].forEach(zTank => {
            const tankPts = [
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(0.28, 0.08),
                new THREE.Vector2(0.32, 0.55),
                new THREE.Vector2(0.28, 1.05),
                new THREE.Vector2(0.0, 1.18)
            ];
            const vessel = new THREE.Mesh(new THREE.LatheGeometry(tankPts, 16), MAT.copper);
            vessel.position.set(1.52, 0.28, zTank);
            vessel.castShadow = true;
            const plasmaGauge = new THREE.Mesh(createExtrudedArmorHullGeo(0.08, 0.58, 0.12), MAT.plasmaShader);
            plasmaGauge.position.set(1.82, 0.82, zTank);

            const pipeCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(1.52, 1.38, zTank),
                new THREE.Vector3(1.32, 1.52, zTank),
                new THREE.Vector3(1.05, 1.32, zTank)
            ]);
            const pipe = new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 10, 0.05, 8, false), MAT.darkSteel);
            mainStructure.add(vessel, plasmaGauge, pipe);
            damageableParts.push(vessel);
        });

        // Left Wing: Twin Lathe-Sculpted Smelting Blast Furnaces & Molten Exhaust Stacks
        [-0.74, 0.18].forEach(zStack => {
            const furnaceHull = new THREE.Mesh(createExtrudedArmorHullGeo(0.64, 0.96, 0.68, 0.05, 0.14), MAT.darkSteel);
            furnaceHull.position.set(-1.26, 0.64, zStack);

            const stackPts = [
                new THREE.Vector2(0.28, 0.0),
                new THREE.Vector2(0.24, 0.65),
                new THREE.Vector2(0.18, 1.45),
                new THREE.Vector2(0.25, 1.68),
                new THREE.Vector2(0.20, 1.82)
            ];
            const smokestack = new THREE.Mesh(new THREE.LatheGeometry(stackPts, 16), MAT.darkSteel);
            smokestack.position.set(-1.26, 0.68, zStack);
            smokestack.castShadow = true;

            const hazardCollar = new THREE.Mesh(createSculptedTorusCollarGeo(0.23, 0.045, 8, 16), MAT.hazard);
            hazardCollar.rotation.x = Math.PI / 2;
            hazardCollar.position.set(-1.26, 2.12, zStack);

            const fireCore = new THREE.Mesh(createSculptedLatheBarrelGeo(0.16, 0.16, 0.12, 12), MAT.volatileGlow);
            fireCore.position.set(-1.26, 2.48, zStack);

            mainStructure.add(furnaceHull, smokestack, hazardCollar, fireCore);
            damageableParts.push(smokestack);
        });

        // Front Heavy Vehicle Rollout Portal Gantry, Open 3D Foundry Hangar Hole & Dual-Track Steel Ramp
        [-1.06, 1.34].forEach(xPillar => {
            const pillar = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 1.72, 0.34, 0.04, 0.08), MAT.hazard);
            pillar.position.set(xPillar, 0.98, 1.14);
            mainStructure.add(pillar);
        });
        const gantryHeader = new THREE.Mesh(createExtrudedArmorHullGeo(2.76, 0.32, 0.42, 0.05, 0.12), MAT.copper);
        gantryHeader.position.set(0.14, 1.78, 1.14);

        // --- WAR FACTORY OPEN 3D HOLE INTERIOR (Deep Recessed Vehicle Assembly Hangar, Molten Smelting Core & Rotating Tank Chassis on Lift!) ---
        const factoryInterior = new THREE.Group();
        factoryInterior.position.set(0.14, 0.28, 0.42);

        const hangarBackWall = new THREE.Mesh(createExtrudedArmorHullGeo(1.88, 1.08, 0.08), MAT.charredSteel);
        hangarBackWall.position.set(0, 0.54, -0.68);
        const hangarFloor = new THREE.Mesh(createExtrudedArmorHullGeo(1.88, 0.06, 1.48), MAT.darkSteel);
        hangarFloor.position.set(0, 0.03, 0.06);
        const furnaceGlowCore = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.62), MAT.volatileGlow);
        furnaceGlowCore.position.set(0, 0.54, -0.62);
        const furnaceBars = new THREE.Mesh(createExtrudedArmorHullGeo(1.48, 0.08, 0.06), MAT.hazard);
        furnaceBars.position.set(0, 0.28, -0.60);
        const hangarCeilingLight = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 1.12), MAT.amberGlow);
        hangarCeilingLight.rotation.x = Math.PI / 2;
        hangarCeilingLight.position.set(0, 0.98, 0.08);

        // Side Spare Tank Road-Wheel Racks & Tool Cabinets inside the Open Factory Bay
        [-0.78, 0.78].forEach(xWall => {
            const toolRack = new THREE.Mesh(createExtrudedArmorHullGeo(0.16, 0.78, 1.12), MAT.gunmetal);
            toolRack.position.set(xWall, 0.42, 0.06);
            factoryInterior.add(toolRack);
            [-0.28, 0.06, 0.40].forEach(zWh => {
                const spareWheel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.12, 0.12, 0.09, 10), MAT.copper);
                spareWheel.rotation.z = Math.PI / 2;
                spareWheel.position.set(xWall > 0 ? xWall - 0.11 : xWall + 0.11, 0.24, zWh);
                factoryInterior.add(spareWheel);
            });
        });

        // Central Hydraulic Lift Turntable with Half-Assembled Siege Tank Prototype Clearly Visible in the Open Bay!
        const interiorTurntable = new THREE.Group();
        interiorTurntable.position.set(0, 0.07, 0.24);
        const liftDisc = new THREE.Mesh(createSculptedLatheBarrelGeo(0.62, 0.68, 0.06, 16), MAT.hazard);
        const liftRing = new THREE.Mesh(new THREE.RingGeometry(0.50, 0.60, 20), MAT.cyanGlow);
        liftRing.rotation.x = -Math.PI / 2;
        liftRing.position.y = 0.04;

        // Miniature Tank Hull, Treads & Turret Being Assembled Inside the War Factory
        const miniTankHull = new THREE.Mesh(createExtrudedArmorHullGeo(0.56, 0.18, 0.78, 0.02, 0.06), MAT.terranBlue);
        miniTankHull.position.y = 0.15;
        [-0.30, 0.30].forEach(xt => {
            const miniTread = new THREE.Mesh(createExtrudedArmorHullGeo(0.15, 0.15, 0.84), MAT.treadMat);
            miniTread.position.set(xt, 0.11, 0);
            interiorTurntable.add(miniTread);
        });
        const miniTurret = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 0.15, 0.48, 0.02, 0.05), MAT.gunmetal);
        miniTurret.position.set(0, 0.29, -0.04);
        const miniBarrel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.04, 0.05, 0.62, 10), MAT.copper);
        miniBarrel.rotation.x = Math.PI / 2;
        miniBarrel.position.set(0, 0.29, 0.36);

        interiorTurntable.add(liftDisc, liftRing, miniTankHull, miniTurret, miniBarrel);
        factoryInterior.add(hangarBackWall, hangarFloor, furnaceGlowCore, furnaceBars, hangarCeilingLight, interiorTurntable);
        mainStructure.add(factoryInterior);
        root.userData.interiorTurntable = interiorTurntable;

        const vehicleRamp = new THREE.Mesh(createExtrudedArmorHullGeo(1.94, 0.14, 0.88, 0.03, 0.14), MAT.darkSteel);
        vehicleRamp.rotation.x = 0.15;
        vehicleRamp.position.set(0.14, 0.17, 1.44);

        // Retracted Upper Blast Shutter Valance (Docked high at y=1.44 so the 3D Factory Hole Interior is ALWAYS wide open!)
        const bayDoor = new THREE.Mesh(createExtrudedArmorHullGeo(1.82, 0.20, 0.14, 0.02, 0.06), MAT.hazard);
        bayDoor.position.set(0.14, 1.44, 1.12);
        mainStructure.add(gantryHeader, vehicleRamp, bayDoor);
        root.userData.bayDoor = bayDoor;

        // Animated Overhead Bridge Crane Trolley + Dual Robotic Welder Assembly over the Interior Tank
        const welderArm = new THREE.Group();
        welderArm.position.set(0.14, 1.32, 0.78);
        const craneTrolley = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 0.20, 0.32, 0.03, 0.06), MAT.gunmetal);
        craneTrolley.position.y = 0.24;
        const boomShaft = new THREE.Mesh(createSculptedLatheBarrelGeo(0.065, 0.08, 0.68, 10), MAT.copper);
        const welderTip = new THREE.Mesh(createSculptedArmorDomeGeo(0.10, 10, 10), MAT.amberGlow);
        welderTip.position.y = -0.36;
        welderArm.add(craneTrolley, boomShaft, welderTip);
        mainStructure.add(welderArm);
        root.userData.welderArm = welderArm;
        root.userData.welderTip = welderTip;

        // Rotating Roof Telemetry Radar & Twin Beacon Array
        const beacon = new THREE.Group();
        beacon.position.set(0.96, 1.74, -0.78);
        const radarCross = new THREE.Mesh(createExtrudedArmorHullGeo(1.06, 0.12, 0.16, 0.02, 0.04), MAT.amberGlow);
        const centerOrb = new THREE.Mesh(createSculptedArmorDomeGeo(0.14, 12, 12), MAT.plasmaShader);
        beacon.add(radarCross, centerOrb);
        mainStructure.add(beacon);
        root.userData.rotor = beacon;
    }
    else if (type === 'hero') {
        const ringBase = new THREE.Mesh(createSculptedLatheBarrelGeo(1.3, 1.48, 0.26, 8), MAT.gunmetal);
        ringBase.position.y = 0.13;
        const hazardCollar = new THREE.Mesh(createSculptedTorusCollarGeo(1.12, 0.1, 8, 24), MAT.hazard);
        hazardCollar.rotation.x = Math.PI / 2; hazardCollar.position.y = 0.26;
        mainStructure.add(ringBase, hazardCollar);
        damageableParts.push(ringBase);

        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            const coilGroup = new THREE.Group();
            coilGroup.position.set(Math.cos(a) * 0.95, 0.25, Math.sin(a) * 0.95);
            coilGroup.lookAt(0, 0.9, 0);
            const rod = new THREE.Mesh(createSculptedLatheBarrelGeo(0.09, 0.15, 0.9, 10), MAT.copper);
            rod.rotation.x = Math.PI / 2;
            coilGroup.add(rod);
            mainStructure.add(coilGroup);
            damageableParts.push(rod);
        }

        const gyro = new THREE.Group();
        gyro.position.y = 0.9;
        const sphere = new THREE.Mesh(createSculptedArmorDomeGeo(0.28, 16, 16), MAT.plasmaShader);
        const gimbal = new THREE.Mesh(createSculptedTorusCollarGeo(0.44, 0.04, 8, 24), MAT.cyanGlow);
        gimbal.rotation.x = Math.PI / 4;
        gyro.add(sphere, gimbal);
        mainStructure.add(gyro);
        root.userData.rotor = gyro;
    }
    else if (type === 'turret') {
        const bunkerBase = new THREE.Mesh(createExtrudedArmorHullGeo(1.52, 0.42, 1.52, 0.07, 0.36), MAT.darkSteel);
        bunkerBase.position.y = 0.21; bunkerBase.castShadow = true;
        mainStructure.add(bunkerBase);

        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const strut = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.65, 0.22, 0.03, 0.05), MAT.gunmetal);
            strut.position.set(Math.cos(a) * 0.65, 0.25, Math.sin(a) * 0.65);
            strut.rotation.z = Math.cos(a) * 0.55;
            strut.rotation.x = -Math.sin(a) * 0.55;
            mainStructure.add(strut);
        }

        const collar = new THREE.Mesh(createSculptedLatheBarrelGeo(0.46, 0.52, 0.28, 16), MAT.hazard);
        collar.position.y = 0.5;
        mainStructure.add(collar);

        // --- UPGRADE TIER 2 GEOMETRY (Reinforced Chobham Skirt + Twin Plasma Capacitor Coils) ---
        const lvl2Group = new THREE.Group();
        lvl2Group.visible = false;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const plate = new THREE.Mesh(createExtrudedArmorHullGeo(0.58, 0.38, 0.18, 0.03, 0.06), MAT.camoArmor);
            plate.position.set(Math.cos(a) * 0.82, 0.24, Math.sin(a) * 0.82);
            plate.rotation.y = -a + Math.PI / 2;
            plate.castShadow = true;
            const coil = new THREE.Mesh(createSculptedLatheBarrelGeo(0.095, 0.095, 0.44, 12), MAT.plasmaShader);
            coil.position.set(Math.cos(a) * 0.6, 0.52, Math.sin(a) * 0.6);
            lvl2Group.add(plate, coil);
        }
        mainStructure.add(lvl2Group);

        // --- UPGRADE TIER 3 GEOMETRY (Heavy Overcharged Reactor Ring + Golden Armor Crown) ---
        const lvl3Group = new THREE.Group();
        lvl3Group.visible = false;
        const reactorRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.94, 0.08, 10, 28), MAT.amberGlow);
        reactorRing.rotation.x = Math.PI / 2;
        reactorRing.position.y = 0.34;
        lvl3Group.add(reactorRing);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const pylon = new THREE.Mesh(createSculptedOgiveSpireGeo(0.15, 0.68, 8), MAT.copper);
            pylon.position.set(Math.cos(a) * 0.94, 0.42, Math.sin(a) * 0.94);
            lvl3Group.add(pylon);
        }
        mainStructure.add(lvl3Group);

        const head = new THREE.Group();
        head.position.y = 0.86;
        const dome = new THREE.Mesh(createExtrudedArmorHullGeo(0.82, 0.50, 0.96, 0.06, 0.20), MAT.gunmetal);
        dome.castShadow = true;
        damageableParts.push(dome);

        const topCap = new THREE.Mesh(createExtrudedArmorHullGeo(0.66, 0.15, 0.76, 0.04, 0.14), MAT.camoArmor);
        topCap.position.y = 0.3;
        const lens = new THREE.Mesh(createSculptedLatheBarrelGeo(0.16, 0.16, 0.14, 16), MAT.plasmaShader);
        lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.04, 0.48);

        // Forward Tactical Aiming Laser Sight Line (Shows exact direction turret head is aiming!)
        const aimBeamGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.04, 0.55),
            new THREE.Vector3(0, 0.04, 14.0)
        ]);
        const aimLaserLine = new THREE.Line(
            aimBeamGeo,
            new THREE.LineBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.85 })
        );
        aimLaserLine.visible = false;
        head.add(aimLaserLine);

        // Head Upgrade Armor Cheeks & Dorsal Fins
        const headLvl2 = new THREE.Group();
        headLvl2.visible = false;
        [-0.44, 0.44].forEach(xSide => {
            const cheekShield = new THREE.Mesh(createExtrudedArmorHullGeo(0.12, 0.44, 0.88, 0.02, 0.06), MAT.copper);
            cheekShield.position.set(xSide, 0.04, 0.04);
            headLvl2.add(cheekShield);
        });
        head.add(headLvl2);

        const headLvl3 = new THREE.Group();
        headLvl3.visible = false;
        [-0.24, 0.24].forEach(xFin => {
            const fin = new THREE.Mesh(createExtrudedArmorHullGeo(0.08, 0.30, 0.64, 0.02, 0.05), MAT.amberGlow);
            fin.rotation.x = -0.25;
            fin.position.set(xFin, 0.42, -0.12);
            headLvl3.add(fin);
        });
        const radarDish = new THREE.Mesh(createSculptedLatheBarrelGeo(0.22, 0.06, 0.12, 12), MAT.cyanGlow);
        radarDish.rotation.x = -0.5;
        radarDish.position.set(0, 0.46, -0.28);
        headLvl3.add(radarDish);
        head.add(headLvl3);

        const armL = new THREE.Mesh(createSculptedLatheBarrelGeo(0.13, 0.15, 0.24, 12), MAT.darkSteel);
        armL.rotation.z = Math.PI / 2; armL.position.set(-0.44, 0.02, 0.02);
        const collarL = new THREE.Mesh(createSculptedTorusCollarGeo(0.14, 0.028, 8, 16), MAT.copper);
        collarL.rotation.y = Math.PI / 2; collarL.position.set(-0.54, 0.02, 0.02);

        const armR = new THREE.Mesh(createSculptedLatheBarrelGeo(0.13, 0.15, 0.24, 12), MAT.darkSteel);
        armR.rotation.z = -Math.PI / 2; armR.position.set(0.44, 0.02, 0.02);
        const collarR = new THREE.Mesh(createSculptedTorusCollarGeo(0.14, 0.028, 8, 16), MAT.copper);
        collarR.rotation.y = Math.PI / 2; collarR.position.set(0.54, 0.02, 0.02);

        const armT = new THREE.Mesh(createSculptedLatheBarrelGeo(0.14, 0.16, 0.20, 12), MAT.darkSteel);
        armT.position.set(0, 0.40, 0.02);
        const collarT = new THREE.Mesh(createSculptedTorusCollarGeo(0.15, 0.028, 8, 16), MAT.copper);
        collarT.rotation.x = Math.PI / 2; collarT.position.set(0, 0.48, 0.02);

        head.add(dome, topCap, lens, armL, collarL, armR, collarR, armT, collarT);
        mainStructure.add(head);

        // 3D Ground Weapon Range Indicator Group (Hidden by default; shown ONLY when selecting this turret!)
        const rangeGroup = new THREE.Group();
        rangeGroup.position.y = 0.16;
        rangeGroup.visible = false;
        rangeGroup.raycast = () => {};
        root.add(rangeGroup);

        // Procedural Hardpoint Socket Metadata aligned to the new high-detail ExtrudedArmorHull dome & upgrade plates
        root.userData.hardpointSockets = {
            left: {
                baseOffset: new THREE.Vector3(-0.56, 0.02, 0.02),
                lvl2Offset: new THREE.Vector3(-0.63, 0.03, 0.04),
                lvl3Offset: new THREE.Vector3(-0.65, 0.03, 0.04),
                normal: new THREE.Vector3(-1, 0, 0),
                euler: new THREE.Euler(0, 0, 0),
                armMesh: armL,
                collarMesh: collarL
            },
            right: {
                baseOffset: new THREE.Vector3(0.56, 0.02, 0.02),
                lvl2Offset: new THREE.Vector3(0.63, 0.03, 0.04),
                lvl3Offset: new THREE.Vector3(0.65, 0.03, 0.04),
                normal: new THREE.Vector3(1, 0, 0),
                euler: new THREE.Euler(0, 0, 0),
                armMesh: armR,
                collarMesh: collarR
            },
            top: {
                baseOffset: new THREE.Vector3(0, 0.50, 0.02),
                lvl2Offset: new THREE.Vector3(0, 0.52, 0.02),
                lvl3Offset: new THREE.Vector3(0, 0.56, 0.04),
                normal: new THREE.Vector3(0, 1, 0),
                euler: new THREE.Euler(0, 0, 0),
                armMesh: armT,
                collarMesh: collarT
            }
        };

        root.userData.head = head;
        root.userData.dome = dome;
        root.userData.topCap = topCap;
        root.userData.lens = lens;
        root.userData.aimLaserLine = aimLaserLine;
        root.userData.rangeGroup = rangeGroup;
        root.userData.lvl2Group = lvl2Group;
        root.userData.lvl3Group = lvl3Group;
        root.userData.headLvl2 = headLvl2;
        root.userData.headLvl3 = headLvl3;
        root.userData.mounts = { left: null, right: null, top: null };
    }
    else if (type === 'barrier') {
        // Engineered Terran Blast Barrier / Fortification Wall (Sloped Chobham Armor + Hydraulic Struts + Plasma Force Strip)
        const basePlinth = new THREE.Mesh(createExtrudedArmorHullGeo(2.85, 0.24, 1.15, 0.05, 0.14), MAT.darkSteel);
        basePlinth.position.y = 0.12;
        basePlinth.castShadow = true;
        basePlinth.receiveShadow = true;
        mainStructure.add(basePlinth);

        const wallCore = new THREE.Mesh(createExtrudedArmorHullGeo(2.65, 1.18, 0.72, 0.06, 0.16), MAT.gunmetal);
        wallCore.position.y = 0.68;
        wallCore.castShadow = true;
        wallCore.receiveShadow = true;
        mainStructure.add(wallCore);
        damageableParts.push(wallCore);

        // Front & Rear Sloped Chobham Blast Shields
        [-0.36, 0.36].forEach((zSide, idx) => {
            const shieldPlate = new THREE.Mesh(createExtrudedArmorHullGeo(2.42, 0.92, 0.18, 0.04, 0.10), MAT.terranBlue);
            shieldPlate.position.set(0, 0.62, zSide);
            shieldPlate.rotation.x = idx === 0 ? 0.18 : -0.18;
            shieldPlate.castShadow = true;
            mainStructure.add(shieldPlate);
            damageableParts.push(shieldPlate);
        });

        // Hazard Top Crest & Glowing Plasma Energy Conduit
        const topHazard = new THREE.Mesh(createExtrudedArmorHullGeo(2.58, 0.14, 0.56), MAT.hazard);
        topHazard.position.y = 1.30;
        const plasmaStrip = new THREE.Mesh(createExtrudedArmorHullGeo(2.25, 0.08, 0.62), MAT.cyanGlow);
        plasmaStrip.position.y = 1.02;
        mainStructure.add(topHazard, plasmaStrip);

        // End Buttress Pylons with Amber Warning Beacons
        [-1.18, 1.18].forEach(xPost => {
            const pylon = new THREE.Mesh(createExtrudedArmorHullGeo(0.36, 1.44, 0.92, 0.04, 0.10), MAT.darkSteel);
            pylon.position.set(xPost, 0.72, 0);
            pylon.castShadow = true;
            const beacon = new THREE.Mesh(createSculptedArmorDomeGeo(0.11, 10, 10), MAT.amberGlow);
            beacon.position.set(xPost, 1.50, 0);
            mainStructure.add(pylon, beacon);
        });
    }
    else if (type === 'solaris_gate' || type === 'solaris_nexus') {
        // 3RD FACTION: THE SOLARIS CHRONO-SYNOD — HIGH-TEMPELAR ASTRAL WARP GATE / GRAND CHRONO-NEXUS
        // Multi-Tiered Aurelian Gold & Astral Ivory Ziggurat + 4 Sweeping Khaydarin Warp-Arches + 4 Corner Obelisks + Levitating Astral Chrono-Core!
        const isGrandNexus = (type === 'solaris_nexus');
        const scaleMult = isGrandNexus ? 1.26 : 1.04;

        // Tier 1: Octagonal Obsidian Foundation & Golden Filigree Plinth
        const baseOct = new THREE.Mesh(createSculptedLatheBarrelGeo(2.28 * scaleMult, 2.62 * scaleMult, 0.30, 8), MAT.solarisObsidian);
        baseOct.position.y = 0.15;
        baseOct.castShadow = true; baseOct.receiveShadow = true;
        const goldRim = new THREE.Mesh(createSculptedLatheBarrelGeo(2.36 * scaleMult, 2.46 * scaleMult, 0.14, 8), MAT.solarisGold);
        goldRim.position.y = 0.25;
        const ivoryTier = new THREE.Mesh(createSculptedLatheBarrelGeo(1.68 * scaleMult, 2.08 * scaleMult, 0.46, 8), MAT.solarisIvory);
        ivoryTier.position.y = 0.50;
        ivoryTier.castShadow = true;
        const upperGoldCrown = new THREE.Mesh(createSculptedLatheBarrelGeo(1.74 * scaleMult, 1.82 * scaleMult, 0.12, 8), MAT.solarisGold);
        upperGoldCrown.position.y = 0.72;
        mainStructure.add(baseOct, goldRim, ivoryTier, upperGoldCrown);
        damageableParts.push(ivoryTier, upperGoldCrown);

        // Glowing Khaydarin Warp-Matrix Floor Pad + Concentric Runic Conduit Rings
        const warpPad = new THREE.Mesh(createSculptedLatheBarrelGeo(1.26 * scaleMult, 1.28 * scaleMult, 0.04, 32), MAT.solarisCrystal);
        warpPad.position.y = 0.79;
        const warpRuneRingOuter = new THREE.Mesh(createSculptedTorusCollarGeo(1.01 * scaleMult, 0.08 * scaleMult, 8, 24), MAT.solarisPrismGlow);
        warpRuneRingOuter.rotation.x = Math.PI / 2;
        warpRuneRingOuter.position.y = 0.805;
        const warpRuneRingInner = new THREE.Mesh(createSculptedTorusCollarGeo(0.48 * scaleMult, 0.06 * scaleMult, 8, 18), MAT.solarisGold);
        warpRuneRingInner.rotation.x = Math.PI / 2;
        warpRuneRingInner.position.y = 0.81;
        mainStructure.add(warpPad, warpRuneRingOuter, warpRuneRingInner);

        // 8 Radial Golden Buttress Ribs & Khaydarin Power Conduits around the Ziggurat
        for (let r = 0; r < 8; r++) {
            const ra = (r / 8) * Math.PI * 2;
            const rib = new THREE.Mesh(createExtrudedArmorHullGeo(0.22 * scaleMult, 0.52, 0.62 * scaleMult, 0.03, 0.08), MAT.solarisGold);
            rib.position.set(Math.cos(ra) * 1.92 * scaleMult, 0.42, Math.sin(ra) * 1.92 * scaleMult);
            rib.rotation.y = -ra + Math.PI / 2;
            rib.rotation.x = 0.32;
            const conduitStrip = new THREE.Mesh(createExtrudedArmorHullGeo(0.09 * scaleMult, 0.54, 0.64 * scaleMult), MAT.solarisCrystal);
            conduitStrip.position.copy(rib.position);
            conduitStrip.rotation.copy(rib.rotation);
            mainStructure.add(rib, conduitStrip);
        }

        // 4 Sweeping Aurelian Golden Warp-Pylon Arches + Levitating Corner Khaydarin Obelisks
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const archPivot = new THREE.Group();
            archPivot.rotation.y = a;

            const lowerPillar = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 1.58 * scaleMult, 0.62, 0.04, 0.14), MAT.solarisIvory);
            lowerPillar.position.set(0, 1.18 * scaleMult, 1.62 * scaleMult);
            lowerPillar.rotation.x = -0.28;
            lowerPillar.castShadow = true;

            const goldCrest = new THREE.Mesh(createCurvedScytheBladeGeo(1.98 * scaleMult, 0.16, 0.38), MAT.solarisGold);
            goldCrest.position.set(0, 1.05 * scaleMult, 1.72 * scaleMult);
            goldCrest.rotation.x = -0.44;
            goldCrest.castShadow = true;

            const upperBladeFin = new THREE.Mesh(createCurvedScytheBladeGeo(1.42 * scaleMult, 0.10, 0.24), MAT.solarisGold);
            upperBladeFin.position.set(0, 1.72 * scaleMult, 1.18 * scaleMult);
            upperBladeFin.rotation.x = -0.78;

            const crystalInlay = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.22 * scaleMult, 1), MAT.solarisCrystal);
            crystalInlay.scale.set(0.62, 2.45, 0.62);
            crystalInlay.position.set(0, 1.42 * scaleMult, 1.40 * scaleMult);
            crystalInlay.rotation.x = -0.32;

            // Focused Energy Beam Emitter Node at the tip of each Warp Arch
            const emitterTip = new THREE.Mesh(createSculptedArmorDomeGeo(0.11 * scaleMult, 12, 12), MAT.solarisPrismGlow);
            emitterTip.position.set(0, 2.15 * scaleMult, 0.78 * scaleMult);

            archPivot.add(lowerPillar, goldCrest, upperBladeFin, crystalInlay, emitterTip);
            mainStructure.add(archPivot);
            damageableParts.push(lowerPillar, goldCrest);
        }

        // Grand Nexus Exclusive: 4 Cardinal Astral Wing Buttresses & Levitating Sentinel Crystals
        if (isGrandNexus) {
            for (let c = 0; c < 4; c++) {
                const ca = (c / 4) * Math.PI * 2;
                const wingGroup = new THREE.Group();
                wingGroup.rotation.y = ca;
                const wingBase = new THREE.Mesh(createExtrudedArmorHullGeo(0.56, 0.85, 1.15, 0.04, 0.12), MAT.solarisObsidian);
                wingBase.position.set(0, 0.48, 2.38 * scaleMult);
                const wingTrim = new THREE.Mesh(createCurvedScytheBladeGeo(1.35, 0.14, 0.30), MAT.solarisGold);
                wingTrim.position.set(0, 0.85, 2.45 * scaleMult);
                wingTrim.rotation.x = -0.35;
                const floatingCrystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.24, 0), MAT.solarisCrystal);
                floatingCrystal.scale.set(0.7, 1.8, 0.7);
                floatingCrystal.position.set(0, 1.55, 2.25 * scaleMult);
                wingGroup.add(wingBase, wingTrim, floatingCrystal);
                mainStructure.add(wingGroup);
            }
        }

        // Levitating Central Multi-Faceted Khaydarin Chrono-Crystal & Triple Counter-Rotating Astrolabe Gyro Rings
        const solarisCore = new THREE.Group();
        solarisCore.position.set(0, 2.18 * scaleMult, 0);
        const crystalMonolith = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.56 * scaleMult, 1), MAT.solarisCrystal);
        crystalMonolith.scale.set(0.76, 1.68, 0.76);
        const innerStar = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.36 * scaleMult, 0), MAT.solarisPrismGlow);
        innerStar.scale.set(0.9, 1.85, 0.9);
        const outerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(1.04 * scaleMult, 0.06, 12, 32), MAT.solarisGold);
        outerSolarRing.rotation.x = Math.PI / 3;
        const innerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.74 * scaleMult, 0.046, 10, 28), MAT.solarisPrismGlow);
        innerSolarRing.rotation.y = Math.PI / 3;
        const zenithCrownRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.48 * scaleMult, 0.035, 8, 24), MAT.solarisGold);
        zenithCrownRing.rotation.x = Math.PI / 2;
        zenithCrownRing.position.y = 0.65 * scaleMult;
        solarisCore.add(crystalMonolith, innerStar, outerSolarRing, innerSolarRing, zenithCrownRing);
        mainStructure.add(solarisCore);

        root.userData.solarisCore = solarisCore;
        root.userData.outerSolarRing = outerSolarRing;
        root.userData.innerSolarRing = innerSolarRing;
    }
    else if (type === 'solaris_spire') {
        // 3RD FACTION DEFENSE: SOLARIS KHAYDARIN PHOTON PRISM CANNON SPIRE
        // Hexagonal Stepped Obsidian-Gold Pedestal + 6 Sweeping Ivory/Gold Focusing Blades + Levitating Multi-Ring Prism Emitter
        const plinth = new THREE.Mesh(createSculptedLatheBarrelGeo(1.18, 1.46, 0.34, 8), MAT.solarisObsidian);
        plinth.position.y = 0.17;
        plinth.castShadow = true;
        const goldCollar = new THREE.Mesh(createSculptedLatheBarrelGeo(0.92, 1.18, 0.38, 8), MAT.solarisGold);
        goldCollar.position.y = 0.46;
        const ivoryStem = new THREE.Mesh(createSculptedLatheBarrelGeo(0.56, 0.84, 0.58, 8), MAT.solarisIvory);
        ivoryStem.position.y = 0.88;
        const crystalCoreColumn = new THREE.Mesh(createSculptedLatheBarrelGeo(0.32, 0.38, 1.15, 8), MAT.solarisCrystal);
        crystalCoreColumn.position.y = 1.25;
        mainStructure.add(plinth, goldCollar, ivoryStem, crystalCoreColumn);
        damageableParts.push(goldCollar, ivoryStem);

        // 6 Curved Ivory & Gold Focusing Pylon Claws cradling the levitating Prism Core
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const fin = new THREE.Mesh(createCurvedScytheBladeGeo(1.78, 0.13, 0.30), i % 2 === 0 ? MAT.solarisGold : MAT.solarisIvory);
            fin.position.set(Math.cos(a) * 0.84, 0.56, Math.sin(a) * 0.84);
            fin.rotation.y = -a + Math.PI / 2;
            fin.rotation.x = -0.24;
            fin.castShadow = true;
            const runeNode = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.11, 0), MAT.solarisPrismGlow);
            runeNode.position.set(Math.cos(a) * 0.68, 1.48, Math.sin(a) * 0.68);
            mainStructure.add(fin, runeNode);
            damageableParts.push(fin);
        }

        // Levitating Prismatic Emitter Head with Dual Focusing Halo Rings
        const solarisCore = new THREE.Group();
        solarisCore.position.set(0, 2.04, 0);
        const prismCrystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.46, 1), MAT.solarisCrystal);
        prismCrystal.scale.set(0.88, 1.38, 0.88);
        const innerEmitterOrb = new THREE.Mesh(createSculptedArmorDomeGeo(0.26, 14, 14), MAT.solarisPrismGlow);
        const haloRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.68, 0.05, 10, 26), MAT.solarisGold);
        haloRing.rotation.x = Math.PI / 2;
        const verticalHalo = new THREE.Mesh(createSculptedTorusCollarGeo(0.52, 0.038, 8, 22), MAT.solarisPrismGlow);
        verticalHalo.rotation.y = Math.PI / 4;
        solarisCore.add(prismCrystal, innerEmitterOrb, haloRing, verticalHalo);
        mainStructure.add(solarisCore);

        root.userData.solarisCore = solarisCore;
        root.userData.outerSolarRing = haloRing;
        root.userData.innerSolarRing = verticalHalo;
    }
    else if (type === 'solaris_pylon') {
        // SOLARIS PROTOSS KHAYDARIN POWER PYLON (Psionic Energy Matrix Node — Powers Nearby Protoss Structures)
        const baseOctagon = new THREE.Mesh(createSculptedLatheBarrelGeo(1.18, 1.38, 0.28, 8), MAT.solarisObsidian);
        baseOctagon.position.y = 0.14;
        baseOctagon.castShadow = true; baseOctagon.receiveShadow = true;
        const goldCollar = new THREE.Mesh(createSculptedLatheBarrelGeo(0.96, 1.12, 0.16, 8), MAT.solarisGold);
        goldCollar.position.y = 0.30;
        const runeRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.84, 0.055, 8, 24), MAT.solarisPrismGlow);
        runeRing.rotation.x = Math.PI / 2;
        runeRing.position.y = 0.36;
        mainStructure.add(baseOctagon, goldCollar, runeRing);
        damageableParts.push(baseOctagon, goldCollar);

        // 4 Curved Golden-Ivory Conductor Pylon Fins cradling the suspended Khaydarin Crystal
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const pylonArch = new THREE.Mesh(createCurvedScytheBladeGeo(2.05, 0.16, 0.34), i % 2 === 0 ? MAT.solarisGold : MAT.solarisIvory);
            pylonArch.position.set(Math.cos(a) * 0.78, 0.92, Math.sin(a) * 0.78);
            pylonArch.rotation.y = -a + Math.PI / 2;
            pylonArch.rotation.x = -0.22;
            pylonArch.castShadow = true;
            const nodeCrystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.13, 0), MAT.solarisPrismGlow);
            nodeCrystal.position.set(Math.cos(a) * 0.62, 1.68, Math.sin(a) * 0.62);
            mainStructure.add(pylonArch, nodeCrystal);
            damageableParts.push(pylonArch);
        }

        // Levitating Faceted Khaydarin Crystal Prism Core + Dual Counter-Rotating Psionic Rings
        const solarisCore = new THREE.Group();
        solarisCore.position.set(0, 1.56, 0);
        const khaydarinPrism = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.56, 1), MAT.solarisCrystal);
        khaydarinPrism.scale.set(0.82, 1.65, 0.82);
        const innerCoreGlow = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.34, 0), MAT.solarisPrismGlow);
        innerCoreGlow.scale.set(0.75, 1.45, 0.75);
        const outerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.76, 0.048, 10, 28), MAT.solarisGold);
        outerSolarRing.rotation.x = Math.PI / 2.4;
        const innerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.58, 0.036, 8, 24), MAT.solarisPrismGlow);
        innerSolarRing.rotation.y = Math.PI / 3;
        solarisCore.add(khaydarinPrism, innerCoreGlow, outerSolarRing, innerSolarRing);
        mainStructure.add(solarisCore);

        // Ground Psionic Power Matrix Field Ring (18m radius visual indicator of Protoss Pylon Power)
        const pylonPowerRing = new THREE.Group();
        pylonPowerRing.position.y = 0.08;
        const fieldMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const outerFieldRing = new THREE.Mesh(new THREE.RingGeometry(17.65, 18.0, 64), fieldMat);
        outerFieldRing.rotation.x = -Math.PI / 2;
        const innerFieldFill = new THREE.Mesh(
            new THREE.RingGeometry(1.4, 17.65, 48),
            new THREE.MeshBasicMaterial({
                color: 0x0ea5e9,
                transparent: true,
                opacity: 0.045,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            })
        );
        innerFieldFill.rotation.x = -Math.PI / 2;
        pylonPowerRing.add(outerFieldRing, innerFieldFill);
        pylonPowerRing.traverse(c => { c.raycast = () => {}; });
        mainStructure.add(pylonPowerRing);

        root.userData.solarisCore = solarisCore;
        root.userData.outerSolarRing = outerSolarRing;
        root.userData.innerSolarRing = innerSolarRing;
        root.userData.pylonPowerRing = pylonPowerRing;
    }
    else if (type === 'solaris_robotics') {
        // SOLARIS PROTOSS ROBOTICS & FLEET BAY (Warps Heavy Immortal Colossi, Hover Armor & Starships)
        const baseDais = new THREE.Mesh(createSculptedLatheBarrelGeo(2.35, 2.62, 0.32, 8), MAT.solarisObsidian);
        baseDais.position.y = 0.16;
        baseDais.castShadow = true; baseDais.receiveShadow = true;
        const goldTrim = new THREE.Mesh(createSculptedLatheBarrelGeo(2.12, 2.32, 0.16, 8), MAT.solarisGold);
        goldTrim.position.y = 0.34;
        const warpRunway = new THREE.Mesh(createExtrudedArmorHullGeo(1.65, 0.12, 2.85, 0.03, 0.08), MAT.solarisIvory);
        warpRunway.position.set(0, 0.38, 0.35);
        mainStructure.add(baseDais, goldTrim, warpRunway);
        damageableParts.push(baseDais, goldTrim);

        // Twin Grand Curved Golden-Ivory Robotics Gantry Wings
        [-1, 1].forEach(side => {
            const wingHull = new THREE.Mesh(createExtrudedArmorHullGeo(0.72, 1.95, 2.35, 0.08, 0.22), MAT.solarisIvory);
            wingHull.position.set(side * 1.56, 1.18, -0.10);
            wingHull.rotation.z = -side * 0.18;
            wingHull.castShadow = true;
            const goldCantilever = new THREE.Mesh(createCurvedScytheBladeGeo(2.45, 0.24, 0.48), MAT.solarisGold);
            goldCantilever.position.set(side * 1.38, 1.65, -0.15);
            goldCantilever.rotation.z = side * 0.42;
            goldCantilever.castShadow = true;
            const prismStrip = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 1.45, 1.85, 0.02, 0.04), MAT.solarisPrismGlow);
            prismStrip.position.set(side * 1.18, 1.15, 0.05);
            mainStructure.add(wingHull, goldCantilever, prismStrip);
            damageableParts.push(wingHull, goldCantilever);
        });

        // Rear Obsidian Warp-Sanctum Arch & Holographic Walker Assembly Turntable
        const rearArch = new THREE.Mesh(createExtrudedArmorHullGeo(2.45, 1.85, 0.82, 0.08, 0.24), MAT.solarisObsidian);
        rearArch.position.set(0, 1.18, -1.25);
        rearArch.castShadow = true;
        mainStructure.add(rearArch);
        damageableParts.push(rearArch);

        const interiorTurntable = new THREE.Group();
        interiorTurntable.position.set(0, 0.46, 0.15);
        const padRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.88, 0.06, 8, 24), MAT.solarisPrismGlow);
        padRing.rotation.x = Math.PI / 2;
        const holoChassis = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 0.42, 0.86, 0.05, 0.14), MAT.solarisGold);
        holoChassis.position.y = 0.36;
        const holoCore = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.28, 0), MAT.solarisPrismGlow);
        holoCore.position.y = 0.65;
        interiorTurntable.add(padRing, holoChassis, holoCore);
        mainStructure.add(interiorTurntable);

        // Overhead Suspended Golden Warp-Beacon Core
        const solarisCore = new THREE.Group();
        solarisCore.position.set(0, 2.38, -0.15);
        const beaconCrystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.52, 1), MAT.solarisCrystal);
        beaconCrystal.scale.set(0.95, 1.35, 0.95);
        const outerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.96, 0.055, 10, 28), MAT.solarisGold);
        outerSolarRing.rotation.x = Math.PI / 2;
        const innerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.74, 0.042, 8, 24), MAT.solarisPrismGlow);
        innerSolarRing.rotation.y = Math.PI / 4;
        solarisCore.add(beaconCrystal, outerSolarRing, innerSolarRing);
        mainStructure.add(solarisCore);

        root.userData.solarisCore = solarisCore;
        root.userData.outerSolarRing = outerSolarRing;
        root.userData.innerSolarRing = innerSolarRing;
        root.userData.interiorTurntable = interiorTurntable;
    }
    else if (type === 'mine_drill') {
        // REDESIGNED TERRAN DOMINION "TITAN-IX" DEEP-CORE LASER & TWIN-GANTRY PLASMA EXCAVATOR RIG
        // Features: Heavy Octagonal Armored Pad + Illuminated Subterranean Borehole Well + 4 Articulated Hydraulic Stabilizer Claws +
        // Twin A-Frame Industrial Gantry Towers + Dual Ore-Sorting Hoppers & Conveyors + Counter-Rotating Plasma Containment Rings +
        // Multi-Stage Helical Tungsten-Carbide Borehead with Triple Laser Cutter Beams + Orbital Resonance Telemetry Dish
        const chromeMat = MAT.chrome || new THREE.MeshStandardMaterial({ color: 0xd8e2ec, roughness: 0.18, metalness: 0.92 });
        const boreGlowMat = MAT.amberGlow || MAT.cyanGlow;

        // 1. Heavy Octagonal Armored Foundation Deck & Illuminated Subterranean Borehole Well
        const basePad = new THREE.Mesh(createSculptedLatheBarrelGeo(1.78, 2.04, 0.26, 8), MAT.darkSteel);
        basePad.position.y = 0.13;
        basePad.castShadow = true;
        basePad.receiveShadow = true;

        const upperDeckRing = new THREE.Mesh(createSculptedLatheBarrelGeo(1.52, 1.68, 0.16, 8), MAT.terranWall);
        upperDeckRing.position.y = 0.28;
        upperDeckRing.castShadow = true;

        const boreWellRim = new THREE.Mesh(createSculptedTorusCollarGeo(0.76, 0.14, 10, 24), MAT.gunmetal);
        boreWellRim.rotation.x = Math.PI / 2;
        boreWellRim.position.y = 0.34;

        const boreHazardCollar = new THREE.Mesh(createSculptedTorusCollarGeo(0.92, 0.065, 8, 24), MAT.hazard);
        boreHazardCollar.rotation.x = Math.PI / 2;
        boreHazardCollar.position.y = 0.35;

        const boreMagmaCore = new THREE.Mesh(new THREE.CircleGeometry(0.68, 20), boreGlowMat);
        boreMagmaCore.rotation.x = -Math.PI / 2;
        boreMagmaCore.position.y = 0.18;

        mainStructure.add(basePad, upperDeckRing, boreWellRim, boreHazardCollar, boreMagmaCore);
        damageableParts.push(basePad, upperDeckRing, boreWellRim);

        // 2. 4 Articulated Hydraulic Outrigger Stabilizer Legs with Ground-Anchor Claws & Dual Chrome Pistons
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const legGroup = new THREE.Group();
            legGroup.rotation.y = a;

            const shoulderHousing = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 0.38, 0.44, 0.04, 0.08), MAT.terranBlue);
            shoulderHousing.position.set(0, 0.56, 1.26);

            const upperBoom = new THREE.Mesh(createExtrudedArmorHullGeo(0.30, 1.28, 0.34, 0.04, 0.09), MAT.gunmetal);
            upperBoom.position.set(0, 0.92, 1.48);
            upperBoom.rotation.x = -0.42;
            upperBoom.castShadow = true;

            const hydraulicCylinder = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.095, 0.72, 10), MAT.copper);
            hydraulicCylinder.position.set(0, 0.78, 1.66);
            hydraulicCylinder.rotation.x = -0.38;

            const hydraulicRod = new THREE.Mesh(createSculptedLatheBarrelGeo(0.052, 0.052, 0.65, 10), chromeMat);
            hydraulicRod.position.set(0, 0.48, 1.80);
            hydraulicRod.rotation.x = -0.38;

            const anchorPad = new THREE.Mesh(createExtrudedArmorHullGeo(0.56, 0.22, 0.64, 0.04, 0.10), MAT.hazard);
            anchorPad.position.set(0, 0.11, 1.94);

            const anchorClawL = new THREE.Mesh(createSculptedOgiveSpireGeo(0.08, 0.34, 6), MAT.darkSteel);
            anchorClawL.position.set(-0.18, 0.10, 2.22);
            anchorClawL.rotation.x = 0.45;
            const anchorClawR = anchorClawL.clone();
            anchorClawR.position.x = 0.18;

            legGroup.add(shoulderHousing, upperBoom, hydraulicCylinder, hydraulicRod, anchorPad, anchorClawL, anchorClawR);
            mainStructure.add(legGroup);
            damageableParts.push(shoulderHousing, upperBoom, anchorPad);
        }

        // 3. Twin Heavy Industrial A-Frame Derrick Gantries & Overhead Crown Platform
        [-0.96, 0.96].forEach(sideX => {
            const pillarA = new THREE.Mesh(createExtrudedArmorHullGeo(0.26, 2.25, 0.28, 0.03, 0.07), MAT.terranWall);
            pillarA.position.set(sideX, 1.32, 0.36);
            pillarA.rotation.x = -0.14;
            pillarA.castShadow = true;

            const pillarB = new THREE.Mesh(createExtrudedArmorHullGeo(0.26, 2.25, 0.28, 0.03, 0.07), MAT.terranWall);
            pillarB.position.set(sideX, 1.32, -0.36);
            pillarB.rotation.x = 0.14;
            pillarB.castShadow = true;

            const crossBrace = new THREE.Mesh(createExtrudedArmorHullGeo(0.18, 0.18, 0.82, 0.02, 0.04), MAT.hazard);
            crossBrace.position.set(sideX, 1.38, 0);

            // Pressurized Cryo-Coolant Tank on each gantry flank
            const coolantTank = new THREE.Mesh(createSculptedLatheBarrelGeo(0.20, 0.20, 1.05, 12), MAT.copper);
            coolantTank.position.set(sideX * 1.24, 0.96, 0);
            const coolantGauge = new THREE.Mesh(createExtrudedArmorHullGeo(0.06, 0.68, 0.12, 0.01, 0.02), MAT.cyanGlow);
            coolantGauge.position.set(sideX * 1.42, 0.96, 0);

            mainStructure.add(pillarA, pillarB, crossBrace, coolantTank, coolantGauge);
            damageableParts.push(pillarA, pillarB, coolantTank);
        });

        // Overhead Derrick Crown Housing & Laser Power Capacitor Head
        const crownDeck = new THREE.Mesh(createExtrudedArmorHullGeo(2.26, 0.44, 1.38, 0.06, 0.14), MAT.terranBlue);
        crownDeck.position.set(0, 2.38, 0);
        crownDeck.castShadow = true;

        const crownTrim = new THREE.Mesh(createExtrudedArmorHullGeo(1.88, 0.24, 1.06, 0.04, 0.10), MAT.darkSteel);
        crownTrim.position.set(0, 2.66, 0);

        const frontCommandPod = new THREE.Mesh(createExtrudedArmorHullGeo(0.86, 0.34, 0.36, 0.04, 0.08), MAT.gunmetal);
        frontCommandPod.position.set(0, 2.36, 0.74);
        const podVisor = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 0.14, 0.08, 0.01, 0.02), MAT.cyanGlow);
        podVisor.position.set(0, 2.38, 0.92);

        mainStructure.add(crownDeck, crownTrim, frontCommandPod, podVisor);
        damageableParts.push(crownDeck, crownTrim, frontCommandPod);

        // 4. Rear & Side Ore-Refining Hopper Bins with Mineral/Gem Conveyor Chute & Raw Crystal Load
        const hopperBay = new THREE.Mesh(createExtrudedArmorHullGeo(1.56, 0.72, 0.94, 0.05, 0.12), MAT.gunmetal);
        hopperBay.position.set(0, 0.66, -1.24);
        hopperBay.castShadow = true;

        const conveyorChute = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 0.20, 0.96, 0.03, 0.06), MAT.darkSteel);
        conveyorChute.position.set(0, 0.88, -0.68);
        conveyorChute.rotation.x = -0.28;

        const crystalOffsets = [
            [-0.42, 1.08, -1.22, 0.24, MAT.cyanGlow],
            [-0.12, 1.14, -1.30, 0.28, MAT.solarisPrismGlow || MAT.amberGlow],
            [0.22, 1.10, -1.18, 0.25, MAT.cyanGlow],
            [0.46, 1.04, -1.28, 0.20, MAT.amberGlow]
        ];
        crystalOffsets.forEach(([cx, cy, cz, cr, cmat]) => {
            const gem = new THREE.Mesh(createSculptedFacetedCrystalGeo(cr, 0), cmat);
            gem.position.set(cx, cy, cz);
            gem.rotation.set(cx * 0.6, cy, cz * 0.4);
            mainStructure.add(gem);
        });

        mainStructure.add(hopperBay, conveyorChute);
        damageableParts.push(hopperBay, conveyorChute);

        // 5. Animated Reciprocating & Rotating Deep-Core Plasma Auger Assembly (`root.userData.drillAuger`)
        const drillAuger = new THREE.Group();
        drillAuger.position.set(0, 1.12, 0);

        const driveSpindle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.28, 0.36, 1.65, 14), MAT.darkSteel);
        const tungstenBit = new THREE.Mesh(createSculptedOgiveSpireGeo(0.46, 0.88, 12), MAT.copper);
        tungstenBit.rotation.x = Math.PI;
        tungstenBit.position.y = -0.86;
        drillAuger.add(driveSpindle, tungstenBit);

        // 6 Helical Tungsten-Carbide Cutting Flutes & Plasma Nodes
        for (let f = 0; f < 6; f++) {
            const r = 0.42 - f * 0.038;
            const flute = new THREE.Mesh(createSculptedTorusCollarGeo(r, 0.058, 8, 18), f % 2 === 0 ? MAT.hazard : chromeMat);
            flute.rotation.x = Math.PI / 2 + 0.26;
            flute.rotation.y = f * 0.55;
            flute.position.y = 0.52 - f * 0.24;
            drillAuger.add(flute);
        }

        // Triple High-Energy Deep-Core Plasma Cutting Beams + Central Core Lance
        const centerLaser = new THREE.Mesh(createSculptedLatheBarrelGeo(0.11, 0.14, 2.05, 12), MAT.cyanGlow);
        centerLaser.position.y = -0.18;
        drillAuger.add(centerLaser);

        for (let lb = 0; lb < 3; lb++) {
            const la = (lb / 3) * Math.PI * 2;
            const emitterNozzle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.06, 0.09, 0.28, 8), MAT.gunmetal);
            emitterNozzle.position.set(Math.cos(la) * 0.44, 0.58, Math.sin(la) * 0.44);
            const plasmaLance = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.048, 1.68, 8), lb % 2 === 0 ? MAT.cyanGlow : boreGlowMat);
            plasmaLance.position.set(Math.cos(la) * 0.34, -0.22, Math.sin(la) * 0.34);
            plasmaLance.rotation.z = Math.cos(la) * 0.11;
            plasmaLance.rotation.x = -Math.sin(la) * 0.11;
            drillAuger.add(emitterNozzle, plasmaLance);
        }

        mainStructure.add(drillAuger);
        root.userData.drillAuger = drillAuger;

        // 6. Roof Orbital Resonance Telemetry Dish & Rotating Beacon Array (`root.userData.rotor`)
        const scannerRotor = new THREE.Group();
        scannerRotor.position.set(0, 2.86, 0);
        const mast = new THREE.Mesh(createSculptedLatheBarrelGeo(0.14, 0.18, 0.26, 10), MAT.gunmetal);
        const crossArm = new THREE.Mesh(createExtrudedArmorHullGeo(1.42, 0.12, 0.20, 0.02, 0.04), MAT.hazard);
        crossArm.position.y = 0.12;
        const dishL = new THREE.Mesh(createSculptedArmorDomeGeo(0.22, 10, 8), chromeMat);
        dishL.scale.set(1.0, 0.45, 1.0);
        dishL.rotation.z = Math.PI / 3;
        dishL.position.set(-0.68, 0.22, 0);
        const dishR = dishL.clone();
        dishR.rotation.z = -Math.PI / 3;
        dishR.position.x = 0.68;
        const scannerGem = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.24, 0), MAT.cyanGlow);
        scannerGem.position.y = 0.28;
        scannerRotor.add(mast, crossArm, dishL, dishR, scannerGem);
        mainStructure.add(scannerRotor);
        root.userData.rotor = scannerRotor;
    }
    else if (type === 'tech_lab') {
        // TERRAN DOMINION ENGINEERING & WEAPONS RESEARCH LAB (Upgrades Unit Arms & Reactive Armor)
        const baseOct = new THREE.Mesh(createSculptedLatheBarrelGeo(1.92, 2.18, 0.28, 8), MAT.darkSteel);
        baseOct.position.y = 0.14;
        baseOct.castShadow = true; baseOct.receiveShadow = true;
        const hazardPlinth = new THREE.Mesh(createSculptedLatheBarrelGeo(1.74, 1.88, 0.14, 8), MAT.hazard);
        hazardPlinth.position.y = 0.30;
        const labCoreHull = new THREE.Mesh(createExtrudedArmorHullGeo(2.35, 1.28, 2.15, 0.08, 0.24), MAT.terranPlating);
        labCoreHull.position.set(0, 0.88, -0.10);
        labCoreHull.castShadow = true; labCoreHull.receiveShadow = true;
        const blueBand = new THREE.Mesh(createExtrudedArmorHullGeo(2.44, 0.28, 1.92, 0.04, 0.14), MAT.terranBlue);
        blueBand.position.set(0, 1.04, -0.10);
        mainStructure.add(baseOct, hazardPlinth, labCoreHull, blueBand);
        damageableParts.push(baseOct, labCoreHull, blueBand);

        // Twin Lateral Plasma Cyclotron Coils & Armor Forge Presses
        [-1, 1].forEach(side => {
            const wingPod = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 1.12, 1.48, 0.05, 0.14), MAT.gunmetal);
            wingPod.position.set(side * 1.42, 0.78, 0.05);
            wingPod.castShadow = true;
            const coilShaft = new THREE.Mesh(createSculptedLatheBarrelGeo(0.22, 0.26, 1.25, 12), MAT.copper);
            coilShaft.position.set(side * 1.48, 1.18, -0.15);
            const coilGlow = new THREE.Mesh(createSculptedTorusCollarGeo(0.28, 0.055, 8, 20), side < 0 ? MAT.cyanGlow : MAT.amberGlow);
            coilGlow.rotation.x = Math.PI / 2;
            coilGlow.position.set(side * 1.48, 1.48, -0.15);
            mainStructure.add(wingPod, coilShaft, coilGlow);
            damageableParts.push(wingPod);
        });

        // Roof Holographic Weapons & Armor Schematic Observatory Dome
        const domeCollar = new THREE.Mesh(createSculptedTorusCollarGeo(0.86, 0.10, 10, 26), MAT.copper);
        domeCollar.rotation.x = Math.PI / 2;
        domeCollar.position.set(0, 1.56, -0.10);
        const glassDome = new THREE.Mesh(createSculptedArmorDomeGeo(0.82, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), MAT.canopyGlass);
        glassDome.position.set(0, 1.56, -0.10);
        mainStructure.add(domeCollar, glassDome);

        // Rotating Holographic Weapon & Armor Blueprint Projector Rotor
        const labHoloRotor = new THREE.Group();
        labHoloRotor.position.set(0, 2.08, -0.10);
        const holoRingA = new THREE.Mesh(createSculptedTorusCollarGeo(0.64, 0.04, 8, 24), MAT.cyanGlow);
        holoRingA.rotation.x = Math.PI / 3;
        const holoRingB = new THREE.Mesh(createSculptedTorusCollarGeo(0.48, 0.035, 8, 20), MAT.amberGlow);
        holoRingB.rotation.y = Math.PI / 3;
        const holoSword = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.56, 0.14, 0.02, 0.04), MAT.cyanGlow);
        const holoShield = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.26, 0), MAT.amberGlow);
        labHoloRotor.add(holoRingA, holoRingB, holoSword, holoShield);
        mainStructure.add(labHoloRotor);
        root.userData.rotor = labHoloRotor;
    }
    else if (type === 'solaris_cyber_lab') {
        // SOLARIS PROTOSS CYBERNETICS & FORGE CORE (Upgrades Solaris Psionic Arms & Phase-Shield Plating)
        const baseDais = new THREE.Mesh(createSculptedLatheBarrelGeo(1.88, 2.15, 0.30, 8), MAT.solarisObsidian);
        baseDais.position.y = 0.15;
        baseDais.castShadow = true; baseDais.receiveShadow = true;
        const goldCollar = new THREE.Mesh(createSculptedLatheBarrelGeo(1.58, 1.82, 0.22, 8), MAT.solarisGold);
        goldCollar.position.y = 0.36;
        const ivorySanctum = new THREE.Mesh(createSculptedLatheBarrelGeo(1.18, 1.46, 0.72, 8), MAT.solarisIvory);
        ivorySanctum.position.y = 0.78;
        ivorySanctum.castShadow = true;
        mainStructure.add(baseDais, goldCollar, ivorySanctum);
        damageableParts.push(baseDais, goldCollar, ivorySanctum);

        // 4 Sweeping Aurelian Forge Pylon Blades & Khaydarin Resonator Conduits
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const forgeBlade = new THREE.Mesh(createCurvedScytheBladeGeo(2.05, 0.18, 0.38), i % 2 === 0 ? MAT.solarisGold : MAT.solarisIvory);
            forgeBlade.position.set(Math.cos(a) * 1.18, 1.05, Math.sin(a) * 1.18);
            forgeBlade.rotation.y = -a + Math.PI / 2;
            forgeBlade.rotation.x = -0.26;
            forgeBlade.castShadow = true;
            const crystalNode = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.18, 0), MAT.solarisPrismGlow);
            crystalNode.position.set(Math.cos(a) * 0.92, 1.85, Math.sin(a) * 0.92);
            mainStructure.add(forgeBlade, crystalNode);
            damageableParts.push(forgeBlade);
        }

        // Levitating Cybernetics Hyper-Core & Dual Counter-Rotating Forge Rings
        const solarisCore = new THREE.Group();
        solarisCore.position.set(0, 1.96, 0);
        const coreCrystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.50, 1), MAT.solarisCrystal);
        coreCrystal.scale.set(0.92, 1.42, 0.92);
        const outerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.86, 0.055, 10, 28), MAT.solarisGold);
        outerSolarRing.rotation.x = Math.PI / 2.6;
        const innerSolarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.64, 0.042, 8, 24), MAT.solarisPrismGlow);
        innerSolarRing.rotation.y = Math.PI / 3;
        solarisCore.add(coreCrystal, outerSolarRing, innerSolarRing);
        mainStructure.add(solarisCore);

        root.userData.solarisCore = solarisCore;
        root.userData.outerSolarRing = outerSolarRing;
        root.userData.innerSolarRing = innerSolarRing;
    }

    // FACTION-UNIQUE 3D CONSTRUCTION RIG:
    // - Solaris Protoss ('solaris_*'): Golden-Cyan Dimensional Warp-In Rift (Spinning Khaydarin Astrolabe Rings, Swirling Psionic Vortex Sphere & Starlight Pillars)
    // - Terran Dominion (all other engineered structures): Articulated 3D Tower Crane + Covered Wall Barrier Shroud + Dual Plasma Welding Beams + Sparks
    const scaffoldGroup = new THREE.Group();
    const isSolarisWarp = String(type).startsWith('solaris_');
    const scafRadius = (type === 'base' || type === 'solaris_nexus') ? 2.45 : ((type === 'factory' || type === 'solaris_robotics' || type === 'solaris_gate') ? 1.98 : 1.65);
    const scafHeight = (type === 'base' || type === 'solaris_nexus') ? 2.85 : ((type === 'factory' || type === 'solaris_robotics' || type === 'solaris_gate') ? 2.15 : 1.85);
    const sSpan = scafRadius * 0.88;

    let barrierGroup = null;
    let craneJibPivot = null;
    let craneTrolley = null;
    let primaryBeam = null;
    let sparkCluster = null;
    let sparkStreaks = [];
    let craneBaseX = -sSpan - 0.32;
    let craneBaseZ = -sSpan - 0.32;
    let jibLength = sSpan * 2.55;
    let laserRing = null;
    let laserRing2 = null;

    if (isSolarisWarp) {
        // PROTOSS DIMENSIONAL WARP-IN RIFT ANIMATION RIG
        const warpCyanMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const warpGoldMat = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.78,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const warpCoreMat = new THREE.MeshBasicMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // 1. Ground Khaydarin Dimensional Sigil + 4 Floating Corner Obelisk Anchors
        const groundSigil = new THREE.Mesh(new THREE.RingGeometry(scafRadius * 0.52, scafRadius * 1.15, 32), warpCyanMat);
        groundSigil.rotation.x = -Math.PI / 2;
        groundSigil.position.y = 0.08;
        scaffoldGroup.add(groundSigil);

        const warpPillars = [];
        for (let p = 0; p < 4; p++) {
            const pa = (p / 4) * Math.PI * 2 + Math.PI / 4;
            const cx = Math.cos(pa) * (scafRadius * 0.96);
            const cz = Math.sin(pa) * (scafRadius * 0.96);
            const obelisk = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.22, 0), MAT.solarisGold);
            obelisk.scale.set(0.8, 2.2, 0.8);
            obelisk.position.set(cx, 0.55, cz);
            const starlightBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, scafHeight * 1.45, 8), warpCyanMat);
            starlightBeam.position.set(cx, scafHeight * 0.72, cz);
            scaffoldGroup.add(obelisk, starlightBeam);
            warpPillars.push(starlightBeam);
        }

        // 2. Swirling Translucent Psionic Warp-Rift Vortex Sphere + Central Starlight Conduit
        const warpVortexSphere = new THREE.Mesh(new THREE.SphereGeometry(scafRadius * 0.78, 18, 14), warpCyanMat);
        warpVortexSphere.position.y = scafHeight * 0.52;
        const centralWarpBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.42, scafHeight * 1.65, 12), warpCoreMat);
        centralWarpBeam.position.y = scafHeight * 0.82;
        scaffoldGroup.add(warpVortexSphere, centralWarpBeam);

        // 3. Three Counter-Rotating Golden Khaydarin Astrolabe Rings
        const warpGyroA = new THREE.Mesh(createSculptedTorusCollarGeo(scafRadius * 0.92, 0.055, 8, 28), MAT.solarisGold);
        warpGyroA.position.y = scafHeight * 0.52;
        const warpGyroB = new THREE.Mesh(createSculptedTorusCollarGeo(scafRadius * 0.76, 0.045, 8, 24), MAT.solarisPrismGlow);
        warpGyroB.position.y = scafHeight * 0.52;
        warpGyroB.rotation.x = Math.PI / 3;
        const warpGyroC = new THREE.Mesh(createSculptedTorusCollarGeo(scafRadius * 0.62, 0.04, 8, 22), warpGoldMat);
        warpGyroC.position.y = scafHeight * 0.52;
        warpGyroC.rotation.y = Math.PI / 4;
        scaffoldGroup.add(warpGyroA, warpGyroB, warpGyroC);

        // 4. Ascending Psionic Phase-Crystallization Rings
        laserRing = new THREE.Mesh(createSculptedTorusCollarGeo(scafRadius + 0.06, 0.06, 8, 28), MAT.solarisPrismGlow);
        laserRing.rotation.x = Math.PI / 2;
        laserRing.position.y = 0.8;
        laserRing2 = new THREE.Mesh(createSculptedTorusCollarGeo(scafRadius * 0.84, 0.045, 8, 24), MAT.solarisGold);
        laserRing2.rotation.x = Math.PI / 2;
        laserRing2.position.y = 0.4;
        scaffoldGroup.add(laserRing, laserRing2);

        root.userData.isSolarisWarp = true;
        root.userData.warpVortexSphere = warpVortexSphere;
        root.userData.centralWarpBeam = centralWarpBeam;
        root.userData.warpGyroA = warpGyroA;
        root.userData.warpGyroB = warpGyroB;
        root.userData.warpGyroC = warpGyroC;
        root.userData.warpPillars = warpPillars;
        root.userData.groundSigil = groundSigil;
    } else {
        // TERRAN MECHANICAL TOWER CRANE + HAZARD BARRIER + DUAL LASER RINGS
        // 1. 4 Corner Heavy Lattice Support Columns + Hazard Beacons
        for (let p = 0; p < 4; p++) {
            const pa = (p / 4) * Math.PI * 2 + Math.PI / 4;
            const cx = Math.cos(pa) * (scafRadius + 0.05);
            const cz = Math.sin(pa) * (scafRadius + 0.05);
            const gantryPillar = new THREE.Mesh(createSculptedLatheBarrelGeo(0.065, 0.085, scafHeight + 0.25, 8), MAT.hazard);
            gantryPillar.position.set(cx, scafHeight * 0.5, cz);
            const emitter = new THREE.Mesh(createSculptedArmorDomeGeo(0.11, 8, 8), MAT.cyanGlow);
            emitter.position.set(cx, scafHeight + 0.14, cz);
            scaffoldGroup.add(gantryPillar, emitter);
        }

        // 2. Covered Wall Barrier (Segmented protective construction tarpaulin curtain + hazard rails around perimeter)
        barrierGroup = new THREE.Group();
        const barrierHeight = scafHeight * 0.86;
        const barrierTarpMat = new THREE.MeshStandardMaterial({
            color: 0x1a2838,
            roughness: 0.62,
            metalness: 0.28,
            transparent: true,
            opacity: 0.78,
            side: THREE.DoubleSide
        });
        const wallSides = [
            { x: 0, z: sSpan, rotY: 0, len: sSpan * 2 },
            { x: 0, z: -sSpan, rotY: Math.PI, len: sSpan * 2 },
            { x: sSpan, z: 0, rotY: Math.PI * 0.5, len: sSpan * 2 },
            { x: -sSpan, z: 0, rotY: -Math.PI * 0.5, len: sSpan * 2 }
        ];
        wallSides.forEach(ws => {
            const sideWall = new THREE.Group();
            sideWall.position.set(ws.x, 0, ws.z);
            sideWall.rotation.y = ws.rotY;

            const panel = new THREE.Mesh(new THREE.BoxGeometry(ws.len - 0.12, barrierHeight, 0.05), barrierTarpMat);
            panel.position.y = barrierHeight * 0.5;
            sideWall.add(panel);

            const topHazardRail = new THREE.Mesh(new THREE.BoxGeometry(ws.len, 0.13, 0.08), MAT.hazard);
            topHazardRail.position.y = barrierHeight - 0.04;
            const midHazardRail = new THREE.Mesh(new THREE.BoxGeometry(ws.len, 0.10, 0.07), MAT.hazard);
            midHazardRail.position.y = barrierHeight * 0.46;
            sideWall.add(topHazardRail, midHazardRail);

            for (let r = 1; r <= 3; r++) {
                const rx = -ws.len * 0.5 + (r / 4) * ws.len;
                const rib = new THREE.Mesh(new THREE.BoxGeometry(0.08, barrierHeight, 0.09), MAT.darkSteel);
                rib.position.set(rx, barrierHeight * 0.5, 0);
                sideWall.add(rib);
            }
            barrierGroup.add(sideWall);
        });
        scaffoldGroup.add(barrierGroup);

        // 3. Articulated 3D Tower Crane (Mast + Slewing Cab + Rotating Jib Boom + Sliding Trolley + Dual Plasma Welding Beams)
        const craneHeight = scafHeight + 1.45;
        const craneMast = new THREE.Mesh(new THREE.BoxGeometry(0.24, craneHeight, 0.24), MAT.hazard);
        craneMast.position.set(craneBaseX, craneHeight * 0.5, craneBaseZ);
        const craneBasePad = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.54), MAT.darkSteel);
        craneBasePad.position.set(craneBaseX, 0.11, craneBaseZ);
        scaffoldGroup.add(craneMast, craneBasePad);

        craneJibPivot = new THREE.Group();
        craneJibPivot.position.set(craneBaseX, craneHeight, craneBaseZ);

        const slewingCab = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.32, 0.40), MAT.gunmetal);
        slewingCab.position.set(0, 0.14, 0);
        const jibBoom = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, jibLength), MAT.hazard);
        jibBoom.position.set(0, 0.18, jibLength * 0.36);
        const counterJib = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.48), MAT.darkSteel);
        counterJib.position.set(0, 0.14, -jibLength * 0.14);
        const apexSpire = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.52, 4), MAT.hazard);
        apexSpire.position.set(0, 0.50, 0);
        craneJibPivot.add(slewingCab, jibBoom, counterJib, apexSpire);

        craneTrolley = new THREE.Group();
        craneTrolley.position.set(0, 0.05, jibLength * 0.50);
        const trolleyCar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.34), MAT.darkSteel);
        const hoistCable = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.72, 6), MAT.gunmetal);
        hoistCable.position.y = -0.36;
        const hookBlock = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.32), MAT.hazard);
        hookBlock.position.y = -0.72;
        craneTrolley.add(trolleyCar, hoistCable, hookBlock);

        // Primary & Secondary Plasma Welding Beams projecting from the crane hook into the structure
        const beamMatCyan = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.80,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const beamMatCore = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.94,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const beamLen = scafHeight * 0.92;
        primaryBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.14, beamLen, 8), beamMatCyan);
        primaryBeam.position.y = -0.72 - beamLen * 0.5;
        const primaryBeamCore = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, beamLen, 6), beamMatCore);
        primaryBeamCore.position.y = -0.72 - beamLen * 0.5;
        craneTrolley.add(primaryBeam, primaryBeamCore);

        craneJibPivot.add(craneTrolley);
        scaffoldGroup.add(craneJibPivot);

        // 4. Dual Counter-Rotating 3D Printer Laser Rings + Cross Laser Beams
        laserRing = new THREE.Mesh(createSculptedTorusCollarGeo(scafRadius + 0.08, 0.055, 8, 28), MAT.cyanGlow);
        laserRing.rotation.x = Math.PI / 2;
        laserRing.position.y = 0.9;
        const crossBeamA = new THREE.Mesh(new THREE.BoxGeometry(scafRadius * 2.0, 0.04, 0.04), beamMatCyan);
        const crossBeamB = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, scafRadius * 2.0), beamMatCyan);
        laserRing.add(crossBeamA, crossBeamB);

        laserRing2 = new THREE.Mesh(createSculptedTorusCollarGeo(scafRadius * 0.86, 0.042, 8, 24), MAT.amberGlow);
        laserRing2.rotation.x = Math.PI / 2;
        laserRing2.position.y = 0.5;
        scaffoldGroup.add(laserRing, laserRing2);

        // 5. 3D Welding Spark Burst Cluster at the Crane Beam Contact Point
        sparkCluster = new THREE.Group();
        for (let sp = 0; sp < 12; sp++) {
            const streak = new THREE.Mesh(
                new THREE.BoxGeometry(0.045, 0.22, 0.045),
                sp % 3 === 0 ? MAT.cyanGlow : MAT.amberGlow
            );
            streak.userData = {
                angle: (sp / 12) * Math.PI * 2,
                speed: 2.4 + (sp % 4) * 0.65,
                phase: sp * 0.45
            };
            sparkCluster.add(streak);
            sparkStreaks.push(streak);
        }
        scaffoldGroup.add(sparkCluster);
    }

    scaffoldGroup.visible = false;
    scaffoldGroup.traverse(c => { c.raycast = () => {}; });
    root.add(scaffoldGroup);

    const dmgOverlay = new THREE.Group();
    dmgOverlay.visible = false;
    const flameCore = new THREE.Mesh(createSculptedOgiveSpireGeo(0.32, 0.85, 7), MAT.volatileGlow);
    flameCore.position.set(0.25, 0.9, 0.2);
    const charDebris = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.35, 0), MAT.charredSteel);
    charDebris.position.set(-0.35, 0.45, 0.35);
    dmgOverlay.add(flameCore, charDebris);
    dmgOverlay.traverse(c => { c.raycast = () => {}; });
    root.add(dmgOverlay);

    root.userData.mainStructure = mainStructure;
    root.userData.scaffoldGroup = scaffoldGroup;
    root.userData.barrierGroup = barrierGroup;
    root.userData.craneJibPivot = craneJibPivot;
    root.userData.craneTrolley = craneTrolley;
    root.userData.primaryBeam = primaryBeam;
    root.userData.sparkCluster = sparkCluster;
    root.userData.sparkStreaks = sparkStreaks;
    root.userData.craneBaseX = craneBaseX;
    root.userData.craneBaseZ = craneBaseZ;
    root.userData.jibLength = jibLength;
    root.userData.laserRing = laserRing;
    root.userData.laserRing2 = laserRing2;
    root.userData.scafHeight = scafHeight;
    root.userData.damageableParts = damageableParts;
    root.userData.dmgOverlay = dmgOverlay;
    root.userData.flameCore = flameCore;
    applyBuildingShadowsAndFowToGroup(root, type === 'base' || type === 'solaris_nexus');
    return root;
}

// Memory-safe Building Mechanics: Faction-Specific Construction (Terran Crane vs Protoss Dimensional Warp Rift) & Damage Visuals
function updateBuildingMechanicsAndDamage(b, dt) {
    const ud = b.mesh.userData;
    if (!ud) return;

    const t = performance.now() * 0.004;

    if (b.buildProgress < 1.0) {
        // NOTE: b.buildProgress is advanced in game.js animate() over the full realistic build time (~10-14s).
        // Keep root b.mesh.scale at 1.0 so the construction rig renders at full size while mainStructure rises!
        if (b.mesh.scale.x !== 1.0 || b.mesh.scale.y !== 1.0 || b.mesh.scale.z !== 1.0) {
            b.mesh.scale.set(1.0, 1.0, 1.0);
        }
        ud.scaffoldGroup.visible = true;
        const p = Math.max(0.02, Math.min(1.0, b.buildProgress));
        const maxH = ud.scafHeight || 1.85;

        if (ud.isSolarisWarp) {
            // PROTOSS DIMENSIONAL WARP-IN RIFT ANIMATION
            const crystalScaleXZ = 0.25 + 0.75 * Math.sin(p * Math.PI * 0.5);
            const crystalScaleY = Math.max(0.08, p);
            ud.mainStructure.scale.set(crystalScaleXZ, crystalScaleY, crystalScaleXZ);
            ud.mainStructure.rotation.y = (1.0 - p) * Math.PI * 0.65;

            if (ud.warpVortexSphere) {
                const vortexScale = p < 0.85 ? (0.55 + p * 0.65 + Math.sin(t * 6.0) * 0.08) : Math.max(0.05, (1.0 - p) * 6.5);
                ud.warpVortexSphere.scale.setScalar(vortexScale);
                ud.warpVortexSphere.rotation.y -= dt * 3.8;
            }
            if (ud.centralWarpBeam) {
                const beamWidth = (1.0 - p * 0.55) * (0.75 + 0.25 * Math.sin(t * 14.0));
                ud.centralWarpBeam.scale.set(beamWidth, 1.0, beamWidth);
            }
            if (ud.warpGyroA) {
                ud.warpGyroA.rotation.x += dt * 3.6;
                ud.warpGyroA.rotation.y += dt * 2.4;
            }
            if (ud.warpGyroB) {
                ud.warpGyroB.rotation.y -= dt * 4.2;
                ud.warpGyroB.rotation.z += dt * 3.1;
            }
            if (ud.warpGyroC) {
                ud.warpGyroC.rotation.x -= dt * 2.9;
                ud.warpGyroC.rotation.z -= dt * 4.5;
            }
            if (ud.groundSigil) {
                ud.groundSigil.rotation.z += dt * 2.2;
            }
            if (ud.laserRing) {
                ud.laserRing.position.y = p * maxH;
                ud.laserRing.rotation.z += dt * 5.2;
            }
            if (ud.laserRing2) {
                ud.laserRing2.position.y = (1.0 - p) * maxH;
                ud.laserRing2.rotation.z -= dt * 6.4;
            }
            // Ascending cyan-gold psionic warp motes
            if (Math.random() > 0.42 && particles.length < 130) {
                const ang = Math.random() * Math.PI * 2;
                const rad = (0.4 + Math.random() * 0.8) * (maxH * 0.75);
                const sp = new THREE.Mesh(SHARED_FX_GEO.spark, Math.random() > 0.45 ? MAT.cyanGlow : MAT.amberGlow);
                sp.position.set(
                    b.pos.x + Math.cos(ang) * rad,
                    b.pos.y + Math.random() * maxH,
                    b.pos.z + Math.sin(ang) * rad
                );
                scene.add(sp);
                particles.push({
                    mesh: sp,
                    vel: new THREE.Vector3(-Math.sin(ang) * 2.5, 3.2 + Math.random() * 2.8, Math.cos(ang) * 2.5),
                    gravity: -2.0,
                    life: 0.32
                });
            }
        } else {
            // TERRAN MECHANICAL CRANE + LASER NANO-FABRICATION ANIMATION
            const unfoldXZ = 0.68 + 0.32 * Math.sin(p * Math.PI * 0.5);
            const unfoldY = Math.max(0.08, p < 0.85 ? (p / 0.85) * 1.04 : 1.04 - ((p - 0.85) / 0.15) * 0.04);
            ud.mainStructure.scale.set(unfoldXZ, unfoldY, unfoldXZ);

            // 1. Covered Wall Barrier rises to shroud construction, then retracts cleanly in final 20%
            if (ud.barrierGroup) {
                const bScale = p < 0.80 ? Math.min(1.0, 0.35 + p * 0.85) : Math.max(0.05, (1.0 - p) * 5.0);
                ud.barrierGroup.scale.y = bScale;
            }

            // 2. Articulated Tower Crane Jib sweeps across the building & Trolley slides along boom
            let weldLocalX = 0;
            let weldLocalZ = 0;
            const weldLocalY = Math.max(0.25, p * maxH);
            if (ud.craneJibPivot && ud.craneTrolley) {
                const baseAng = Math.PI * 0.25;
                const sweepAng = baseAng + Math.sin(t * 1.45 + b.pos.x * 0.3) * 0.55;
                ud.craneJibPivot.rotation.y = sweepAng;

                const jibLen = ud.jibLength || 4.0;
                const trolleyZ = jibLen * (0.36 + 0.22 * Math.sin(t * 2.6 + b.pos.z * 0.4));
                ud.craneTrolley.position.z = trolleyZ;

                weldLocalX = (ud.craneBaseX || -1.8) + Math.sin(sweepAng) * trolleyZ;
                weldLocalZ = (ud.craneBaseZ || -1.8) + Math.cos(sweepAng) * trolleyZ;

                if (ud.primaryBeam) {
                    const beamPulse = 0.72 + 0.28 * Math.sin(t * 18.0);
                    ud.primaryBeam.scale.set(beamPulse, 1.0, beamPulse);
                }

                // Animate 3D Spark Burst Cluster at the crane's plasma beam contact point
                if (ud.sparkCluster && ud.sparkStreaks) {
                    ud.sparkCluster.position.set(weldLocalX, weldLocalY, weldLocalZ);
                    for (let si = 0; si < ud.sparkStreaks.length; si++) {
                        const st = ud.sparkStreaks[si];
                        const sd = st.userData;
                        const cyc = (t * sd.speed + sd.phase) % 1.0;
                        const rad = cyc * 0.68;
                        const arcY = Math.sin(cyc * Math.PI) * 0.36 - cyc * cyc * 0.30;
                        st.position.set(Math.cos(sd.angle + t * 1.8) * rad, arcY, Math.sin(sd.angle + t * 1.8) * rad);
                        st.rotation.set(0.4 + cyc * 2.4, sd.angle, cyc * 3.0);
                        st.scale.setScalar(1.0 - cyc * 0.65);
                    }
                }
            }

            // 3. Dual Laser Rings
            if (ud.laserRing) {
                ud.laserRing.position.y = p * maxH;
                ud.laserRing.rotation.z += dt * 4.5;
            }
            if (ud.laserRing2) {
                ud.laserRing2.position.y = (1.0 - Math.abs(Math.sin(t * 3.2))) * (p * maxH);
                ud.laserRing2.rotation.z -= dt * 6.0;
            }

            // 4. World-space flying welding sparks from the crane's active weld point
            if (Math.random() > 0.36 && particles.length < 130) {
                const sp = new THREE.Mesh(SHARED_FX_GEO.spark, Math.random() > 0.35 ? MAT.amberGlow : MAT.cyanGlow);
                sp.position.set(
                    b.pos.x + weldLocalX + (Math.random() - 0.5) * 0.35,
                    b.pos.y + weldLocalY,
                    b.pos.z + weldLocalZ + (Math.random() - 0.5) * 0.35
                );
                scene.add(sp);
                particles.push({
                    mesh: sp,
                    vel: new THREE.Vector3((Math.random() - 0.5) * 6.2, 2.4 + Math.random() * 3.5, (Math.random() - 0.5) * 6.2),
                    gravity: 14, life: 0.26
                });
            }
        }
        return;
    }

    // Ensure construction crane / warp rift is hidden and mainStructure is at 1:1 scale once building is finished!
    if (ud.scaffoldGroup && ud.scaffoldGroup.visible) {
        ud.scaffoldGroup.visible = false;
    }
    if (ud.mainStructure) {
        if (ud.mainStructure.scale.x !== 1.0 || ud.mainStructure.scale.y !== 1.0 || ud.mainStructure.scale.z !== 1.0) {
            ud.mainStructure.scale.set(1.0, 1.0, 1.0);
        }
        if (ud.mainStructure.rotation.y !== 0) {
            ud.mainStructure.rotation.y = 0;
        }
    }
    if (ud.pylonPowerRing) {
        ud.pylonPowerRing.rotation.y += dt * 0.25;
    }

    // Active Mechanical & Holographic Animations for Main Base, Barracks, Factory & Hero Shrine
    if (b.type === 'base') {
        if (ud.baseHoloGlobe) {
            ud.baseHoloGlobe.rotation.y += dt * 1.35;
            ud.baseHoloGlobe.position.y = 2.98 + Math.sin(t * 1.6) * 0.035;
        }
        if (ud.baseReactorCore) {
            ud.baseReactorCore.rotation.y -= dt * 2.2;
            ud.baseReactorCore.rotation.x += dt * 1.1;
            const pulse = 1.0 + Math.sin(t * 2.8) * 0.12;
            ud.baseReactorCore.scale.setScalar(pulse);
        }
        if (ud.outerGyroRing) {
            ud.outerGyroRing.rotation.z += dt * 1.8;
            ud.outerGyroRing.rotation.x = Math.PI / 3 + Math.sin(t * 1.1) * 0.35;
        }
        if (ud.innerGyroRing) {
            ud.innerGyroRing.rotation.y -= dt * 2.6;
            ud.innerGyroRing.rotation.z = Math.cos(t * 1.4) * 0.45;
        }
        if (ud.baseDefenseTurret) {
            ud.baseDefenseTurret.rotation.y = Math.sin(t * 0.75) * 0.85;
        }
        if (ud.miniTroopers) {
            ud.miniTroopers.forEach((mt, idx) => {
                mt.rotation.y = (idx === 0 ? Math.PI / 2.2 : -Math.PI / 2.2) + Math.sin(t * 1.4 + idx) * 0.28;
                mt.position.y = 0.05 + Math.abs(Math.sin(t * 2.0 + idx)) * 0.018;
            });
        }
    }
    else if (b.type === 'barracks' || b.type === 'factory') {
        // Subtle hydraulic breathing/vibration when actively producing units
        const isProducing = (typeof b.spawnTimer === 'number' && b.spawnTimer < 3.0);
        if (isProducing) {
            const vib = Math.sin(t * 8.0) * 0.008;
            ud.mainStructure.scale.set(1.0 + vib, 1.0 - vib, 1.0 + vib);
        } else {
            ud.mainStructure.scale.set(1.0, 1.0, 1.0);
        }

        if (ud.miniTroopers) {
            ud.miniTroopers.forEach((mt, idx) => {
                mt.rotation.y = Math.sin(t * 1.5 + idx * Math.PI) * 0.52;
                mt.position.y = 0.07 + Math.abs(Math.sin(t * 3.0 + idx)) * 0.032;
            });
        }
        if (ud.interiorTurntable) {
            ud.interiorTurntable.rotation.y += dt * 1.15;
            ud.interiorTurntable.position.y = 0.07 + Math.sin(t * 2.2) * 0.025;
        }
        if (ud.welderArm) {
            ud.welderArm.rotation.z = Math.sin(t * 2.6) * 0.38;
            ud.welderArm.rotation.x = Math.cos(t * 1.9) * 0.18;
            if (b.type === 'factory') {
                // Slide overhead gantry crane across the War Factory mini-interior bay!
                ud.welderArm.position.x = 0.14 + Math.sin(t * 1.3) * 0.58;
                ud.welderArm.position.z = 0.72 + Math.cos(t * 0.9) * 0.18;
            }
            if (Math.random() < 0.12 && particles.length < 120) {
                const tipPos = ud.welderTip.getWorldPosition(new THREE.Vector3());
                const sp = new THREE.Mesh(SHARED_FX_GEO.spark, Math.random() > 0.4 ? MAT.amberGlow : MAT.cyanGlow);
                sp.position.copy(tipPos);
                scene.add(sp);
                particles.push({
                    mesh: sp,
                    vel: new THREE.Vector3((Math.random() - 0.5) * 4.2, 1.6 + Math.random() * 2.2, (Math.random() - 0.5) * 4.2),
                    gravity: 15, life: 0.22
                });
            }
        }
        if (ud.bayDoor) {
            const isDoorOpen = (b.spawnTimer < 1.3 || b.doorHoldTimer > 0);
            if (b.doorHoldTimer > 0) b.doorHoldTimer -= dt;
            const closedY = b.type === 'factory' ? 1.38 : 1.14;
            const openY = b.type === 'factory' ? 1.60 : 1.32;
            const targetY = isDoorOpen ? openY : closedY;
            ud.bayDoor.position.y = THREE.MathUtils.lerp(ud.bayDoor.position.y, targetY, dt * 8);
        }
    }
    else if ((b.type === 'hero' || b.type === 'tech_lab' || b.type === 'mine_drill') && ud.rotor) {
        ud.rotor.rotation.y += dt * (b.type === 'tech_lab' ? 2.1 : 1.6);
        if (b.type === 'hero') {
            ud.rotor.position.y = 0.92 + Math.sin(t * 2.2) * 0.08;
            ud.rotor.rotation.x = Math.sin(t * 1.5) * 0.35;
        } else if (b.type === 'tech_lab') {
            ud.rotor.position.y = 2.08 + Math.sin(t * 2.4) * 0.07;
        }
        if (ud.drillAuger) {
            ud.drillAuger.rotation.y -= dt * 5.5;
        }
    }
    else if (ud.solarisCore) {
        ud.solarisCore.rotation.y += dt * 1.65;
        ud.solarisCore.position.y = (b.type === 'solaris_nexus' ? 2.48 : (b.type === 'solaris_spire' || b.type === 'solaris_cyber_lab' ? 1.92 : 2.05)) + Math.sin(t * 2.2) * 0.11;
        if (ud.outerSolarRing) ud.outerSolarRing.rotation.z += dt * 2.4;
        if (ud.innerSolarRing) ud.innerSolarRing.rotation.x -= dt * 3.1;
    }

    const ratio = b.hp / b.maxHp;
    if (ratio < 0.65) {
        if (ud.damageableParts) {
            ud.damageableParts.forEach((part, idx) => {
                if (ratio < 0.35) {
                    part.material = MAT.charredSteel;
                    part.rotation.z = Math.sin(idx + 1) * 0.14;
                }
            });
        }
        b.dmgFxTimer = (b.dmgFxTimer || 0) - dt;
        if (b.dmgFxTimer <= 0 && smokeClouds.length < 60) {
            const sm = new THREE.Mesh(
                SHARED_FX_GEO.smoke,
                ratio < 0.35 ? SHARED_FX_MAT.smokeDark : SHARED_FX_MAT.smokeGrey
            );
            sm.scale.setScalar(0.8);
            sm.position.copy(b.pos).add(new THREE.Vector3((Math.random()-0.5)*0.9, 0.9, (Math.random()-0.5)*0.9));
            scene.add(sm);
            smokeClouds.push({
                mesh: sm,
                vel: new THREE.Vector3((Math.random()-0.5)*0.8, 1.6 + Math.random(), (Math.random()-0.5)*0.8),
                life: 0.8
            });
            b.dmgFxTimer = ratio < 0.35 ? 0.28 : 0.55;
        }
    }

    if (ud.dmgOverlay) {
        ud.dmgOverlay.visible = ratio < 0.45;
        if (ud.dmgOverlay.visible && ud.flameCore) {
            ud.flameCore.scale.y = 0.8 + Math.random() * 0.5;
            ud.flameCore.rotation.y += dt * 8;
        }
    }
}

// Helper: Naturally Generated 3D Zerg Goo Webbing, Arterial Slime Veins & Oozing Biomass Cysts on Infested Buildings
function addNaturalZergGooInfestationToBuilding(group, sacsArray, radius = 2.4, height = 2.2, veinCount = 7) {
    for (let v = 0; v < veinCount; v++) {
        const a0 = (v / veinCount) * Math.PI * 2 + 0.18;
        // Leave front +Z entrance clear for interior visibility
        if (Math.sin(a0) > 0.58 && Math.abs(Math.cos(a0)) < 0.72) continue;
        const aMid = a0 + (v % 2 === 0 ? 0.24 : -0.24);
        const aTop = a0 + (v % 2 === 0 ? -0.18 : 0.18);

        const slimeCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(a0) * (radius * 1.18), 0.05, Math.sin(a0) * (radius * 1.18)),
            new THREE.Vector3(Math.cos(aMid) * (radius * 0.92), height * 0.42, Math.sin(aMid) * (radius * 0.92)),
            new THREE.Vector3(Math.cos(aTop) * (radius * 0.68), height * 0.86, Math.sin(aTop) * (radius * 0.68)),
            new THREE.Vector3(Math.cos(aTop) * (radius * 0.36), height * 1.04, Math.sin(aTop) * (radius * 0.36))
        ]);
        const gooVein = new THREE.Mesh(
            new THREE.TubeGeometry(slimeCurve, 12, 0.11 + (v % 3) * 0.03, 7, false),
            v % 2 === 0 ? MAT.zergBioShader : MAT.zergFlesh
        );
        gooVein.castShadow = true;
        group.add(gooVein);

        // Oozing Goo Node & Bioluminescent Cyst at Mid-Wall & Crown
        const cystMat = v % 3 === 0 ? MAT.acidGlow : (v % 3 === 1 ? MAT.hiveVeinGlow : MAT.volatileGlow);
        const cyst = new THREE.Mesh(createOrganicBioCarapaceGeo(0.24, 0.20, 0.24, 6, 0.05), cystMat);
        cyst.position.set(
            Math.cos(aMid) * (radius * 0.94),
            height * (0.36 + (v % 3) * 0.16),
            Math.sin(aMid) * (radius * 0.94)
        );
        group.add(cyst);
        if (sacsArray) sacsArray.push(cyst);
    }

    // Hanging Viscous Goo Stalactite Drips & Calcified Infestation Ribs around Upper Rim
    for (let d = 0; d < 5; d++) {
        const da = (d / 5) * Math.PI * 2 + 0.42;
        if (Math.sin(da) > 0.65) continue;
        const drip = new THREE.Mesh(createSculptedOgiveSpireGeo(0.11, 0.58, 7), MAT.zergBioShader);
        drip.rotation.x = Math.PI;
        drip.position.set(Math.cos(da) * (radius * 0.76), height * 0.78, Math.sin(da) * (radius * 0.76));
        group.add(drip);
    }
}

function createLeviathanCitadel() {
    const group = new THREE.Group();
    const emblem = createFloatingEmblem(enemyEmblemTex, 6.2, true);
    group.add(emblem);

    const damageableParts = [];

    // 1. Sprawling Multi-Lobed Viscoelastic Creep Basal Mat & Arterial Root Tendrils
    const basalCreepMat = new THREE.Mesh(createOrganicBioCarapaceGeo(4.65, 0.28, 4.65, 14, 0.16), MAT.chitinDark);
    basalCreepMat.position.y = 0.14;
    basalCreepMat.receiveShadow = true;
    group.add(basalCreepMat);

    const craterBase = new THREE.Mesh(createOrganicBioCarapaceGeo(3.95, 0.82, 3.95, 12, 0.15), MAT.chitinArmor);
    craterBase.position.y = 0.42;
    craterBase.castShadow = true;
    craterBase.receiveShadow = true;
    group.add(craterBase);
    damageableParts.push(craterBase);

    // 10 Radiating Arterial Root Buttresses gripping the soil
    for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 + 0.15;
        const rootGroup = new THREE.Group();
        rootGroup.position.set(Math.cos(ang) * 3.35, 0.28, Math.sin(ang) * 3.35);
        rootGroup.rotation.y = -ang + Math.PI / 2;

        const rootCarapace = new THREE.Mesh(createCurvedScytheBladeGeo(1.75, 0.34, 0.44), MAT.chitinDark);
        rootCarapace.rotation.x = Math.PI * 0.42;
        rootCarapace.castShadow = true;
        const rootVein = new THREE.Mesh(createSculptedLatheBarrelGeo(0.07, 0.13, 1.35, 6), MAT.hiveVeinGlow);
        rootVein.rotation.x = Math.PI * 0.44;
        rootVein.position.y = 0.12;

        rootGroup.add(rootCarapace, rootVein);
        group.add(rootGroup);
        damageableParts.push(rootCarapace);
    }

    // Bubbling Bio-Luminescent Nutrient Spawning Moat
    const bioPool = new THREE.Mesh(createOrganicBioCarapaceGeo(3.38, 0.12, 3.38, 12, 0.04), MAT.zergBioShader);
    bioPool.position.y = 0.78;
    group.add(bioPool);

    // 2. Sculpted Multi-Tiered Organic Carapace Fortress Body (Replacing flat boxy walls)
    const centralTower = new THREE.Group();

    // Lower bulbous thorax tier (shifted slightly back to frame the front brood-maw cavity)
    const lowerThorax = new THREE.Mesh(createOrganicBioCarapaceGeo(3.05, 1.55, 2.85, 12, 0.18), MAT.chitinRed);
    lowerThorax.position.set(0, 1.45, -0.35);
    lowerThorax.castShadow = true;
    lowerThorax.receiveShadow = true;

    // Mid-tier overlapping dorsal chitinous shell plates
    const midCarapace = new THREE.Mesh(createOrganicBioCarapaceGeo(2.55, 1.50, 2.45, 11, 0.16), MAT.chitinArmor);
    midCarapace.position.set(0, 2.55, -0.32);
    midCarapace.castShadow = true;
    midCarapace.receiveShadow = true;

    // Upper Overmind Spire Crown
    const upperCrown = new THREE.Mesh(createOrganicBioCarapaceGeo(1.95, 1.65, 1.95, 10, 0.15), MAT.chitinDark);
    upperCrown.position.set(0, 3.78, -0.22);
    upperCrown.castShadow = true;

    // Towering Central & Flanking Horn Spires atop the Hive Crown
    const mainApexHorn = new THREE.Mesh(createCurvedScytheBladeGeo(2.35, 0.42, 0.56), MAT.chitinRed);
    mainApexHorn.position.set(0, 4.45, -0.35);
    mainApexHorn.rotation.x = -0.22;
    mainApexHorn.castShadow = true;
    centralTower.add(lowerThorax, midCarapace, upperCrown, mainApexHorn);
    damageableParts.push(lowerThorax, midCarapace, upperCrown, mainApexHorn);

    for (let s = -1; s <= 1; s += 2) {
        // Flanking mandible cheek plates framing the front (+Z) brood-maw sanctum
        const cheekCarapace = new THREE.Mesh(createOrganicBioCarapaceGeo(1.05, 1.65, 1.55, 8, 0.14), MAT.chitinArmor);
        cheekCarapace.position.set(s * 1.55, 1.65, 0.48);
        cheekCarapace.rotation.y = s * -0.28;
        cheekCarapace.castShadow = true;

        // Flanking front mandible tusks curving around the spawning maw
        const mawTusk = new THREE.Mesh(createCurvedScytheBladeGeo(1.85, 0.28, 0.38), MAT.chitinDark);
        mawTusk.position.set(s * 1.48, 0.95, 1.55);
        mawTusk.rotation.set(0.55, s * -0.45, s * 0.35);
        mawTusk.castShadow = true;

        // Crown side horn spires
        const crownHorn = new THREE.Mesh(createCurvedScytheBladeGeo(1.75, 0.28, 0.36), MAT.chitinArmor);
        crownHorn.position.set(s * 1.15, 4.15, -0.15);
        crownHorn.rotation.set(-0.12, 0, s * -0.38);
        crownHorn.castShadow = true;

        centralTower.add(cheekCarapace, mawTusk, crownHorn);
        damageableParts.push(cheekCarapace, mawTusk, crownHorn);
    }

    // 7 Segmented Dorsal Spine Plates ascending the rear (-Z) of the Hive Citadel
    for (let d = 0; d < 6; d++) {
        const t = d / 5;
        const dorsalPlate = new THREE.Mesh(
            createOrganicBioCarapaceGeo(1.45 - t * 0.55, 0.42, 0.85 - t * 0.25, 7, 0.08),
            d % 2 === 0 ? MAT.chitinDark : MAT.chitinRed
        );
        dorsalPlate.position.set(0, 1.05 + d * 0.56, -2.05 + d * 0.16);
        dorsalPlate.rotation.x = 0.32;
        dorsalPlate.castShadow = true;
        centralTower.add(dorsalPlate);
    }

    group.add(centralTower);

    // 3. OPEN 3D CITADEL INTERIOR: Recessed Hive Heart Chamber, Rotating Overmind Embryo & Neural Feeder Tendrils
    const citadelInterior = new THREE.Group();
    citadelInterior.position.set(0, 0.78, 0.52);

    const chamberCavity = new THREE.Mesh(createOrganicBioCarapaceGeo(1.65, 1.55, 0.55, 8, 0.08), MAT.charredSteel);
    chamberCavity.position.set(0, 1.05, -0.58);
    const chamberVeinWall = new THREE.Mesh(createOrganicBioCarapaceGeo(1.22, 1.18, 0.14, 8, 0.05), MAT.zergBioShader);
    chamberVeinWall.position.set(0, 1.05, -0.35);

    // Animated Suspended Hive Heart Core & Orbiting Feeder Arms inside the Citadel Chamber
    const interiorHeart = new THREE.Group();
    interiorHeart.position.set(0, 1.15, 0.12);
    const heartCore = new THREE.Mesh(createOrganicBioCarapaceGeo(0.58, 0.74, 0.58, 8, 0.11), MAT.volatileGlow);
    const heartCage = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.72, 1), MAT.scaffoldWire);
    interiorHeart.add(heartCore, heartCage);

    const feederArms = [];
    [-0.78, 0.78].forEach((fx) => {
        const armPivot = new THREE.Group();
        armPivot.position.set(fx, 1.12, 0.32);
        const claw = new THREE.Mesh(createCurvedScytheBladeGeo(0.85, 0.10, 0.20), MAT.copper);
        claw.rotation.y = fx < 0 ? 0.82 : -0.82;
        const tipOrb = new THREE.Mesh(createOrganicBioCarapaceGeo(0.13, 0.13, 0.13, 5, 0.03), MAT.acidGlow);
        tipOrb.position.set(fx < 0 ? 0.32 : -0.32, 0, -0.16);
        armPivot.add(claw, tipOrb);
        citadelInterior.add(armPivot);
        feederArms.push(armPivot);
    });

    citadelInterior.add(chamberCavity, chamberVeinWall, interiorHeart);
    group.add(citadelInterior);

    // 4. 8 Articulated Outer Leviathan Scythe-Rib Buttresses & 6 Volatile Bio-Plasma Gestation Sacs
    const claws = [];
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.39;
        // Keep the very front (+Z) slightly wider so the brood-maw sanctum is clearly visible
        const ribRadius = 3.05;
        const ribPivot = new THREE.Group();
        ribPivot.position.set(Math.cos(a) * ribRadius, 0.58, Math.sin(a) * ribRadius);
        ribPivot.lookAt(0, 3.25, 0);

        const lowerRib = new THREE.Mesh(createCurvedScytheBladeGeo(3.15, 0.38, 0.56), MAT.chitinArmor);
        lowerRib.rotation.x = Math.PI / 2.35;
        lowerRib.position.z = 0.58;
        lowerRib.castShadow = true;

        const upperTalon = new THREE.Mesh(createCurvedScytheBladeGeo(2.45, 0.24, 0.42), MAT.chitinRed);
        upperTalon.rotation.x = Math.PI / 1.58;
        upperTalon.position.set(0, 1.48, 1.25);
        upperTalon.castShadow = true;

        const dorsalSpike = new THREE.Mesh(createCurvedScytheBladeGeo(1.15, 0.14, 0.22), MAT.chitinDark);
        dorsalSpike.rotation.x = -Math.PI / 3.2;
        dorsalSpike.position.set(0, 0.65, 0.25);

        const vein = new THREE.Mesh(createSculptedLatheBarrelGeo(0.09, 0.09, 2.05, 6), MAT.hiveVeinGlow);
        vein.rotation.x = Math.PI / 2.35;
        vein.position.set(0, 0.22, 0.58);

        ribPivot.add(lowerRib, upperTalon, dorsalSpike, vein);
        group.add(ribPivot);
        claws.push({ pivot: ribPivot, baseRotX: ribPivot.rotation.x, idx: i });
        damageableParts.push(lowerRib, upperTalon);
    }

    const sacs = [];
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const sac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.76, 0.92, 0.76, 8, 0.14), MAT.volatileGlow);
        sac.position.set(Math.cos(a) * 2.68, 0.95 + (i % 2) * 0.55, Math.sin(a) * 2.68);
        const sacCap = new THREE.Mesh(createOrganicBioCarapaceGeo(0.58, 0.32, 0.58, 6, 0.08), MAT.chitinDark);
        sacCap.position.y = 0.48;
        sac.add(sacCap);
        group.add(sac);
        sacs.push(sac);
    }

    // Drape naturally generated Zerg goo webbing & cysts across the Citadel exterior
    addNaturalZergGooInfestationToBuilding(group, sacs, 3.15, 3.9, 10);

    const psionicRing = new THREE.Group();
    psionicRing.position.y = 5.85;
    const coreGem = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.84, 1), MAT.hiveVeinGlow);
    const orbitHalo = new THREE.Mesh(createSculptedTorusCollarGeo(1.28, 0.07, 8, 24), MAT.acidGlow);
    orbitHalo.rotation.x = Math.PI / 3;
    const innerHalo = new THREE.Mesh(createSculptedTorusCollarGeo(0.95, 0.04, 8, 20), MAT.volatileGlow);
    innerHalo.rotation.y = Math.PI / 3;
    psionicRing.add(coreGem, orbitHalo, innerHalo);
    group.add(psionicRing);

    group.userData = {
        role: 'citadel',
        emblem, claws, sacs, psionicRing, coreGem,
        interiorHeart, feederArms, damageableParts,
        pulsePhase: 0
    };
    return applyBuildingShadowsAndFowToGroup(group);
}

// REMODELED ENEMY BARRACKS (STARCRAFT II ZERG SPAWNING POOL & VISCERAL LEVIATHAN BROOD-CAVERN)
function createEnemySpawningPool() {
    const group = new THREE.Group();
    const damageableParts = [];

    // 1. Sprawling Multi-Lobe Viscoelastic Creep Basal Mat & Pulsing Arterial Tendrils gripping the ground
    const creepBase = new THREE.Mesh(createOrganicBioCarapaceGeo(2.55, 0.26, 2.45, 12, 0.11), MAT.zergFlesh);
    creepBase.position.y = 0.11;
    creepBase.castShadow = true;
    creepBase.receiveShadow = true;
    group.add(creepBase);
    damageableParts.push(creepBase);

    for (let lobeIdx = 0; lobeIdx < 6; lobeIdx++) {
        const la = (lobeIdx / 6) * Math.PI * 2 + 0.35;
        const bioApron = new THREE.Mesh(createOrganicBioCarapaceGeo(1.15, 0.20, 0.95, 7, 0.08), lobeIdx % 2 === 0 ? MAT.zergBioShader : MAT.chitinDark);
        bioApron.position.set(Math.cos(la) * 1.85, 0.12, Math.sin(la) * 1.85);
        bioApron.rotation.y = -la;
        bioApron.castShadow = true;
        bioApron.receiveShadow = true;
        group.add(bioApron);
    }

    for (let t = 0; t < 10; t++) {
        const ang = (t / 10) * Math.PI * 2 + 0.18;
        const tendrilCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(ang) * 1.25, 0.36, Math.sin(ang) * 1.25),
            new THREE.Vector3(Math.cos(ang + 0.12) * 2.05, 0.18, Math.sin(ang + 0.12) * 2.05),
            new THREE.Vector3(Math.cos(ang - 0.08) * 2.85, 0.02, Math.sin(ang - 0.08) * 2.85)
        ]);
        const rootTendril = new THREE.Mesh(
            new THREE.TubeGeometry(tendrilCurve, 12, 0.13 - (t % 2) * 0.025, 8, false),
            t % 3 === 0 ? MAT.zergBioShader : MAT.chitinDark
        );
        rootTendril.castShadow = true;
        group.add(rootTendril);
    }

    // 2. Sculpted Multi-Tier Chitinous Crater Wall & Luminous Bubbling Green Nutrient Spawning Pool
    const outerCraterWall = new THREE.Mesh(createSculptedTorusCollarGeo(1.86, 0.48, 16, 32), MAT.chitinArmor);
    outerCraterWall.rotation.x = Math.PI / 2;
    outerCraterWall.scale.set(1.08, 1.02, 0.96);
    outerCraterWall.position.y = 0.36;
    outerCraterWall.castShadow = true;
    outerCraterWall.receiveShadow = true;

    const poolRim = new THREE.Mesh(createSculptedTorusCollarGeo(1.52, 0.34, 14, 28), MAT.chitinRed);
    poolRim.rotation.x = Math.PI / 2;
    poolRim.position.y = 0.48;
    poolRim.castShadow = true;
    poolRim.receiveShadow = true;

    const acidPool = new THREE.Mesh(createOrganicBioCarapaceGeo(1.62, 0.07, 1.62, 12, 0.025), MAT.acidGlow);
    acidPool.position.y = 0.44;
    const innerVeinPool = new THREE.Mesh(createSculptedTorusCollarGeo(0.98, 0.32, 10, 24), MAT.zergBioShader);
    innerVeinPool.rotation.x = Math.PI / 2;
    innerVeinPool.scale.set(1, 1, 0.22);
    innerVeinPool.position.y = 0.46;
    group.add(outerCraterWall, poolRim, acidPool, innerVeinPool);
    damageableParts.push(outerCraterWall, poolRim);

    // 3. Towering Ribbed Leviathan Brood-Hood Carapace & Asymmetrical Bio-Chitin Plates (Open at +Z)
    const rearBroodDomedSac = new THREE.Mesh(createOrganicBioCarapaceGeo(2.05, 1.82, 1.58, 10, 0.16), MAT.chitinArmor);
    rearBroodDomedSac.position.set(0, 1.18, -0.82);
    rearBroodDomedSac.castShadow = true;

    const dorsalCrestPlate = new THREE.Mesh(createOrganicBioCarapaceGeo(1.42, 0.65, 1.52, 8, 0.14), MAT.chitinDark);
    dorsalCrestPlate.position.set(0, 1.98, -0.52);
    dorsalCrestPlate.rotation.x = 0.28;
    dorsalCrestPlate.castShadow = true;

    const leftFleshLobe = new THREE.Mesh(createOrganicBioCarapaceGeo(0.74, 1.42, 1.62, 8, 0.14), MAT.chitinRed);
    leftFleshLobe.position.set(-1.54, 0.92, 0.08);
    leftFleshLobe.rotation.z = -0.26;
    leftFleshLobe.castShadow = true;
    const rightFleshLobe = new THREE.Mesh(createOrganicBioCarapaceGeo(0.74, 1.42, 1.62, 8, 0.14), MAT.chitinRed);
    rightFleshLobe.position.set(1.54, 0.92, 0.08);
    rightFleshLobe.rotation.z = 0.26;
    rightFleshLobe.castShadow = true;
    group.add(rearBroodDomedSac, dorsalCrestPlate, leftFleshLobe, rightFleshLobe);
    damageableParts.push(rearBroodDomedSac, dorsalCrestPlate, leftFleshLobe, rightFleshLobe);

    // 5 Towering Calcified Kaiser-Rib Arches & Dorsal Scythe Spines overarching the Spawning Vat
    [-0.88, -0.42, 0.04, 0.48, 0.92].forEach((zRib, rIdx) => {
        const boneArch = new THREE.Mesh(createSculptedTorusCollarGeo(1.62 - rIdx * 0.06, 0.15, 10, 22, Math.PI), MAT.copper);
        boneArch.position.set(0, 0.44, zRib);
        boneArch.rotation.x = -0.16 + rIdx * 0.06;
        boneArch.castShadow = true;
        group.add(boneArch);
        damageableParts.push(boneArch);

        const spine = new THREE.Mesh(createCurvedScytheBladeGeo(0.95, 0.13, 0.26), MAT.chitinDark);
        spine.position.set(0, 2.06 - rIdx * 0.05, zRib);
        spine.rotation.x = -0.48;
        group.add(spine);

        [-1, 1].forEach(side => {
            const latHorn = new THREE.Mesh(createCurvedScytheBladeGeo(0.82, 0.12, 0.22), MAT.chitinArmor);
            latHorn.position.set(side * (1.52 - rIdx * 0.04), 1.18, zRib);
            latHorn.rotation.z = -side * 0.58;
            latHorn.rotation.y = side * 0.22;
            group.add(latHorn);
        });
    });

    // Twin Peristaltic Acid-Vent Chimneys rising behind the Spawning Pool
    [[-1.18, -0.95], [1.18, -0.95]].forEach(([vx, vz], vIdx) => {
        const ventCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(vx * 0.82, 0.95, vz),
            new THREE.Vector3(vx * 1.05, 1.85, vz - 0.16),
            new THREE.Vector3(vx * 1.18, 2.65, vz - 0.28)
        ]);
        const chimney = new THREE.Mesh(new THREE.TubeGeometry(ventCurve, 12, 0.22, 9, false), MAT.chitinDark);
        chimney.castShadow = true;
        const orifice = new THREE.Mesh(createSculptedTorusCollarGeo(0.22, 0.07, 8, 14), vIdx === 0 ? MAT.acidGlow : MAT.volatileGlow);
        orifice.rotation.x = Math.PI / 2;
        orifice.position.set(vx * 1.18, 2.68, vz - 0.28);
        group.add(chimney, orifice);
        damageableParts.push(chimney);
    });

    // 4. OPEN 3D ZERG SPAWNING CAVERN INTERIOR: Gestating Larvae, Pulsing Ovum Clusters & Umbilical Feeders
    const barracksInterior = new THREE.Group();
    barracksInterior.position.set(0, 0.44, 0.10);

    const wombBackMembrane = new THREE.Mesh(createOrganicBioCarapaceGeo(1.42, 1.05, 0.36, 7, 0.09), MAT.zergBioShader);
    wombBackMembrane.position.set(0, 0.60, -0.84);
    barracksInterior.add(wombBackMembrane);

    const interiorLarvae = [];
    [-0.56, 0.0, 0.56].forEach((lx, idx) => {
        const specimen = new THREE.Group();
        specimen.position.set(lx, 0.32, idx === 1 ? -0.18 : 0.12);
        const eggCradle = new THREE.Mesh(createOrganicBioCarapaceGeo(0.32, 0.16, 0.34, 6, 0.05), MAT.zergFlesh);
        eggCradle.position.y = -0.20;
        const thorax = new THREE.Mesh(createOrganicBioCarapaceGeo(0.25, 0.21, 0.38, 6, 0.06), idx % 2 === 0 ? MAT.chitinRed : MAT.chitinGreen);
        const sac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.21, 0.19, 0.24, 6, 0.04), idx === 1 ? MAT.hiveVeinGlow : (idx === 0 ? MAT.volatileGlow : MAT.acidGlow));
        sac.position.set(0, 0.06, -0.24);
        const clawL = new THREE.Mesh(createCurvedScytheBladeGeo(0.38, 0.055, 0.12), MAT.copper);
        clawL.position.set(-0.16, 0, 0.18);
        const clawR = clawL.clone();
        clawR.position.set(0.16, 0, 0.18);
        specimen.add(eggCradle, thorax, sac, clawL, clawR);
        barracksInterior.add(specimen);
        interiorLarvae.push(specimen);
    });

    const bioArms = [];
    [-0.48, 0.48].forEach(ax => {
        const injector = new THREE.Group();
        injector.position.set(ax, 1.24, 0.16);
        const umbilicalCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(ax * 0.20, -0.26, 0.08),
            new THREE.Vector3(0, -0.52, 0)
        ]);
        const stalk = new THREE.Mesh(new THREE.TubeGeometry(umbilicalCurve, 8, 0.07, 8, false), MAT.zergFlesh);
        const nozzle = new THREE.Mesh(createOrganicBioCarapaceGeo(0.11, 0.11, 0.11, 5, 0.03), MAT.acidGlow);
        nozzle.position.y = -0.52;
        injector.add(stalk, nozzle);
        barracksInterior.add(injector);
        bioArms.push(injector);
    });
    group.add(barracksInterior);

    // 5. Outer Perimeter Grasping Chitin Talons & Pulsing Bioluminescent Egg Sacs
    const sacs = [];
    const claws = [];
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.22;
        if (Math.sin(a) > 0.62 && Math.abs(Math.cos(a)) < 0.78) continue;
        const toothPivot = new THREE.Group();
        toothPivot.position.set(Math.cos(a) * 2.02, 0.38, Math.sin(a) * 2.02);
        const tooth = new THREE.Mesh(createCurvedScytheBladeGeo(1.78, 0.26, 0.40), MAT.chitinArmor);
        tooth.rotation.z = -Math.cos(a) * 0.44;
        tooth.rotation.x = Math.sin(a) * 0.44;
        toothPivot.add(tooth);
        group.add(toothPivot);
        claws.push({ pivot: toothPivot, baseRotX: toothPivot.rotation.x, idx: i });

        const bubble = new THREE.Mesh(createOrganicBioCarapaceGeo(0.34, 0.30, 0.34, 7, 0.06), i % 3 === 0 ? MAT.hiveVeinGlow : (i % 2 === 0 ? MAT.acidGlow : MAT.volatileGlow));
        bubble.position.set(Math.cos(a) * 1.56, 0.48, Math.sin(a) * 1.56);
        group.add(bubble);
        sacs.push(bubble);
    }

    addNaturalZergGooInfestationToBuilding(group, sacs, 1.98, 1.88, 8);

    group.userData = {
        role: 'spawning_pool',
        sacs, claws,
        interiorLarvae, bioArms, damageableParts,
        pulsePhase: 0
    };
    return applyBuildingShadowsAndFowToGroup(group);
}

// REMODELED ENEMY BIO-FACTORY (COLOSSAL STARCRAFT II ULTRALISK CAVERN & TWIN-CHAMBER LEVIATHAN BIO-WARREN)
function createEnemyBioFactory() {
    const group = new THREE.Group();
    const damageableParts = [];

    // 1. Massive Multi-Lobe Organic Creep Foundation Mound, Muscular Arterial Roots & Ribbed Birth Canal
    const foundationMound = new THREE.Mesh(createOrganicBioCarapaceGeo(2.85, 0.36, 2.92, 12, 0.11), MAT.chitinDark);
    foundationMound.position.y = 0.16;
    foundationMound.castShadow = true;
    foundationMound.receiveShadow = true;
    const birthCanalRamp = new THREE.Mesh(createOrganicBioCarapaceGeo(1.38, 0.18, 1.12, 8, 0.06), MAT.zergFlesh);
    birthCanalRamp.rotation.x = 0.10;
    birthCanalRamp.position.set(0, 0.15, 2.32);
    group.add(foundationMound, birthCanalRamp);
    damageableParts.push(foundationMound);

    for (let r = 0; r < 10; r++) {
        const ang = (r / 10) * Math.PI * 2 + 0.30;
        if (Math.sin(ang) > 0.72) continue;
        const rootCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(ang) * 1.65, 0.42, Math.sin(ang) * 1.65),
            new THREE.Vector3(Math.cos(ang + 0.10) * 2.48, 0.20, Math.sin(ang + 0.10) * 2.48),
            new THREE.Vector3(Math.cos(ang - 0.06) * 3.25, 0.02, Math.sin(ang - 0.06) * 3.25)
        ]);
        const rootMesh = new THREE.Mesh(
            new THREE.TubeGeometry(rootCurve, 12, 0.18 - (r % 2) * 0.03, 8, false),
            r % 2 === 0 ? MAT.zergFlesh : MAT.zergBioShader
        );
        rootMesh.castShadow = true;
        group.add(rootMesh);
    }

    // 2. Sculpted Twin-Womb Leviathan Carapace Fortress & Tiered Chitin Exoskeleton Plates
    const rearCavernWall = new THREE.Mesh(createOrganicBioCarapaceGeo(2.52, 2.15, 1.78, 10, 0.18), MAT.chitinDark);
    rearCavernWall.position.set(0, 1.32, -1.02);
    rearCavernWall.castShadow = true;

    const leftCarapaceFlank = new THREE.Mesh(createOrganicBioCarapaceGeo(0.92, 1.82, 2.02, 9, 0.16), MAT.chitinRed);
    leftCarapaceFlank.position.set(-1.74, 1.12, 0.16);
    leftCarapaceFlank.rotation.z = -0.24;
    leftCarapaceFlank.castShadow = true;
    const rightCarapaceFlank = new THREE.Mesh(createOrganicBioCarapaceGeo(0.92, 1.82, 2.02, 9, 0.16), MAT.chitinRed);
    rightCarapaceFlank.position.set(1.74, 1.12, 0.16);
    rightCarapaceFlank.rotation.z = 0.24;
    rightCarapaceFlank.castShadow = true;

    const dorsalCrownCarapace = new THREE.Mesh(createOrganicBioCarapaceGeo(2.04, 0.68, 1.92, 10, 0.14), MAT.chitinArmor);
    dorsalCrownCarapace.position.set(0, 2.24, -0.14);
    dorsalCrownCarapace.castShadow = true;

    // Glowing Neural Cortex Crown Dome atop the Bio-Factory
    const neuralCortexCrown = new THREE.Mesh(createOrganicBioCarapaceGeo(1.18, 0.48, 1.12, 8, 0.10), MAT.hiveVeinGlow);
    neuralCortexCrown.position.set(0, 2.68, -0.28);
    group.add(rearCavernWall, leftCarapaceFlank, rightCarapaceFlank, dorsalCrownCarapace, neuralCortexCrown);
    damageableParts.push(rearCavernWall, leftCarapaceFlank, rightCarapaceFlank, dorsalCrownCarapace);

    // 3. Colossal Ultralisk Kaiser-Blades Flanking the Cavern Entrance + 5 Rib Arches
    [-1, 1].forEach(side => {
        const kaiserBlade = new THREE.Mesh(createCurvedScytheBladeGeo(2.35, 0.34, 0.56), MAT.copper);
        kaiserBlade.position.set(side * 2.08, 1.15, 1.35);
        kaiserBlade.rotation.z = -side * 0.38;
        kaiserBlade.rotation.x = 0.42;
        kaiserBlade.rotation.y = -side * 0.35;
        kaiserBlade.castShadow = true;
        group.add(kaiserBlade);
        damageableParts.push(kaiserBlade);
    });

    [-1.08, -0.45, 0.18, 0.78, 1.34].forEach((zPos, idx) => {
        const rib = new THREE.Mesh(createSculptedTorusCollarGeo(2.12 - idx * 0.06, 0.22, 12, 24, Math.PI), MAT.copper);
        rib.position.set(0, 0.44, zPos);
        rib.castShadow = true;
        group.add(rib);
        damageableParts.push(rib);

        [-1, 1].forEach(side => {
            const horn = new THREE.Mesh(createCurvedScytheBladeGeo(1.32, 0.18, 0.32), MAT.chitinArmor);
            horn.position.set(side * (1.62 - idx * 0.03), 1.76, zPos);
            horn.rotation.z = -side * 0.52;
            horn.rotation.x = -0.24;
            group.add(horn);
        });
    });

    // 4 Towering Peristaltic Bio-Chimney Spore Stacks & Lateral Gestation Sacs
    const sacs = [neuralCortexCrown];
    [[-1.68, -0.62], [1.68, -0.62], [-1.45, 0.58], [1.45, 0.58]].forEach(([xStack, zStack], idx) => {
        const ventCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(xStack * 0.85, 1.52, zStack),
            new THREE.Vector3(xStack * 1.08, 2.38, zStack - 0.14),
            new THREE.Vector3(xStack * 1.22, 3.18, zStack - 0.26)
        ]);
        const chimney = new THREE.Mesh(new THREE.TubeGeometry(ventCurve, 12, 0.28, 10, false), MAT.chitinDark);
        chimney.castShadow = true;
        const ventCore = new THREE.Mesh(createOrganicBioCarapaceGeo(0.34, 0.28, 0.34, 7, 0.06), idx % 2 === 0 ? MAT.volatileGlow : MAT.acidGlow);
        ventCore.position.set(xStack * 1.22, 3.24, zStack - 0.26);
        group.add(chimney, ventCore);
        sacs.push(ventCore);
        damageableParts.push(chimney);
    });

    // Lateral Translucent Bio-Pods Along Both Flanks
    for (let p = 0; p < 6; p++) {
        const side = p % 2 === 0 ? -1 : 1;
        const pz = -0.65 + Math.floor(p / 2) * 0.72;
        const pod = new THREE.Mesh(createOrganicBioCarapaceGeo(0.42, 0.36, 0.42, 7, 0.06), p % 3 === 0 ? MAT.acidGlow : MAT.hiveVeinGlow);
        pod.position.set(side * 2.15, 0.64, pz);
        group.add(pod);
        sacs.push(pod);
    }

    // 4. WIDE-OPEN 3D ZERG BIO-WARREN INTERIOR: Pulsing Neural Womb, Incubating Behemoth & Umbilical Splicer Tentacle!
    const factoryInterior = new THREE.Group();
    factoryInterior.position.set(0, 0.36, 0.22);

    const wombWall = new THREE.Mesh(createOrganicBioCarapaceGeo(1.58, 1.15, 0.38, 8, 0.09), MAT.zergBioShader);
    wombWall.position.set(0, 0.86, -1.12);
    const nutrientPool = new THREE.Mesh(createOrganicBioCarapaceGeo(1.56, 0.07, 1.56, 12, 0.025), MAT.hiveVeinGlow);
    nutrientPool.position.set(0, 0.06, 0.15);
    factoryInterior.add(wombWall, nutrientPool);

    const interiorBehemoth = new THREE.Group();
    interiorBehemoth.position.set(0, 0.10, 0.25);

    const placentaDisc = new THREE.Mesh(createOrganicBioCarapaceGeo(0.94, 0.11, 0.94, 8, 0.04), MAT.zergFlesh);
    const altarRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.82, 0.09, 8, 20), MAT.acidGlow);
    altarRing.rotation.x = Math.PI / 2;
    altarRing.position.y = 0.06;

    const miniThorax = new THREE.Mesh(createOrganicBioCarapaceGeo(0.50, 0.38, 0.68, 8, 0.08), MAT.chitinArmor);
    miniThorax.position.set(0, 0.40, 0.06);
    const miniAbdomen = new THREE.Mesh(createOrganicBioCarapaceGeo(0.58, 0.45, 0.64, 8, 0.08), MAT.acidGlow);
    miniAbdomen.position.set(0, 0.46, -0.46);
    const gorgonTailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.50, -0.74),
        new THREE.Vector3(0, 1.02, -0.88),
        new THREE.Vector3(0, 1.38, -0.36),
        new THREE.Vector3(0, 1.44, 0.26)
    ]);
    const gorgonTail = new THREE.Mesh(new THREE.TubeGeometry(gorgonTailCurve, 10, 0.12, 7, false), MAT.chitinRed);
    const gorgonMortarBulb = new THREE.Mesh(createOrganicBioCarapaceGeo(0.24, 0.22, 0.30, 6, 0.05), MAT.acidGlow);
    gorgonMortarBulb.position.set(0, 1.44, 0.32);
    [-0.36, 0.36].forEach(xTusk => {
        const pincerOuter = new THREE.Mesh(createCurvedScytheBladeGeo(0.84, 0.12, 0.26), MAT.chitinRed);
        pincerOuter.rotation.z = xTusk > 0 ? -0.42 : 0.42;
        pincerOuter.position.set(xTusk, 0.38, 0.44);
        const pincerInner = new THREE.Mesh(createCurvedScytheBladeGeo(0.60, 0.09, 0.20), MAT.copper);
        pincerInner.rotation.z = xTusk > 0 ? 0.35 : -0.35;
        pincerInner.position.set(xTusk * 0.72, 0.36, 0.50);
        interiorBehemoth.add(pincerOuter, pincerInner);
    });
    interiorBehemoth.add(placentaDisc, altarRing, miniThorax, miniAbdomen, gorgonTail, gorgonMortarBulb);
    factoryInterior.add(interiorBehemoth);

    // Overhead Writhing Umbilical Splicer Tentacle
    const bioGantry = new THREE.Group();
    bioGantry.position.set(0, 1.56, 0.35);
    const gantrySac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.35, 0.20, 0.30, 6, 0.05), MAT.chitinRed);
    const splicerShaft = new THREE.Mesh(createSculptedLatheBarrelGeo(0.065, 0.13, 0.66, 10), MAT.zergFlesh);
    splicerShaft.position.y = -0.30;
    const splicerTip = new THREE.Mesh(createOrganicBioCarapaceGeo(0.14, 0.14, 0.14, 6, 0.03), MAT.volatileGlow);
    splicerTip.position.y = -0.62;
    bioGantry.add(gantrySac, splicerShaft, splicerTip);
    factoryInterior.add(bioGantry);

    // Upper Fleshy Jaw Fang Arch over the Birth Canal Entrance
    const gateHeader = new THREE.Group();
    gateHeader.position.set(0, 1.76, 1.48);
    [-0.84, -0.42, 0.0, 0.42, 0.84].forEach(fx => {
        const fang = new THREE.Mesh(createCurvedScytheBladeGeo(0.52, 0.09, 0.16), MAT.copper);
        fang.rotation.x = Math.PI;
        fang.position.set(fx, 0, 0);
        gateHeader.add(fang);
    });
    group.add(factoryInterior, gateHeader);
    addNaturalZergGooInfestationToBuilding(group, sacs, 2.42, 2.32, 9);

    group.userData = {
        role: 'bio_factory',
        sacs,
        interiorBehemoth,
        bioGantry,
        splicerTip,
        gateHeader,
        damageableParts,
        pulsePhase: 0
    };
    return applyBuildingShadowsAndFowToGroup(group);
}

// ZERG EVOLUTION & CARAPACE CHAMBER (Mutagenic Bio-Research Pit — Upgrades Zerg Claws/Spines & Chitin Carapace)
function createEnemyEvolutionChamber() {
    const group = new THREE.Group();
    const damageableParts = [];
    const sacs = [];
    const claws = [];

    // 1. Basal Creep Mound & Nutrient Vat Rim
    const basalMat = new THREE.Mesh(createOrganicBioCarapaceGeo(2.05, 0.28, 2.05, 10, 0.09), MAT.zergFlesh);
    basalMat.position.y = 0.12;
    basalMat.castShadow = true; basalMat.receiveShadow = true;
    const vatRim = new THREE.Mesh(createSculptedTorusCollarGeo(1.42, 0.36, 12, 24), MAT.chitinArmor);
    vatRim.rotation.x = Math.PI / 2;
    vatRim.position.y = 0.34;
    const mutagenPool = new THREE.Mesh(createOrganicBioCarapaceGeo(1.32, 0.08, 1.32, 10, 0.03), MAT.hiveVeinGlow);
    mutagenPool.position.y = 0.38;
    group.add(basalMat, vatRim, mutagenPool);
    damageableParts.push(basalMat, vatRim);

    // 2. Central Pulsating Mutagenesis Brain-Sac & Double-Helix DNA Bio-Strands
    const evolutionCore = new THREE.Group();
    evolutionCore.position.set(0, 1.18, 0);
    const brainSac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.76, 0.92, 0.76, 9, 0.12), MAT.acidGlow);
    const dorsalShell = new THREE.Mesh(createOrganicBioCarapaceGeo(0.88, 0.52, 0.88, 8, 0.08), MAT.chitinRed);
    dorsalShell.position.y = 0.42;
    const helixRingA = new THREE.Mesh(createSculptedTorusCollarGeo(0.96, 0.065, 8, 20), MAT.hiveVeinGlow);
    helixRingA.rotation.x = Math.PI / 3;
    const helixRingB = new THREE.Mesh(createSculptedTorusCollarGeo(0.82, 0.055, 8, 20), MAT.volatileGlow);
    helixRingB.rotation.y = Math.PI / 3;
    evolutionCore.add(brainSac, dorsalShell, helixRingA, helixRingB);
    group.add(evolutionCore);
    sacs.push(brainSac);
    damageableParts.push(dorsalShell);

    // 3. 6 Surrounding Chitin Carapace-Hardening Talons & Mutagenic Blister Pods
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.25;
        const clawPivot = new THREE.Group();
        clawPivot.position.set(Math.cos(a) * 1.56, 0.32, Math.sin(a) * 1.56);
        clawPivot.lookAt(0, 1.85, 0);
        const talon = new THREE.Mesh(createCurvedScytheBladeGeo(1.85, 0.24, 0.38), i % 2 === 0 ? MAT.chitinRed : MAT.chitinArmor);
        talon.rotation.x = Math.PI / 2.3;
        clawPivot.add(talon);
        group.add(clawPivot);
        claws.push({ pivot: clawPivot, baseRotX: clawPivot.rotation.x, idx: i });

        const blister = new THREE.Mesh(createOrganicBioCarapaceGeo(0.32, 0.28, 0.32, 6, 0.05), i % 2 === 0 ? MAT.acidGlow : MAT.volatileGlow);
        blister.position.set(Math.cos(a) * 1.24, 0.52, Math.sin(a) * 1.24);
        group.add(blister);
        sacs.push(blister);
    }

    addNaturalZergGooInfestationToBuilding(group, sacs, 1.65, 1.75, 6);
    group.userData = {
        role: 'evolution_chamber',
        sacs,
        claws,
        interiorHeart: evolutionCore,
        damageableParts,
        pulsePhase: 0
    };
    return applyBuildingShadowsAndFowToGroup(group);
}
window.createEnemyEvolutionChamber = createEnemyEvolutionChamber;

// Helper: Creates a Unique Zerg Organic Biomass Metamorphosis Cocoon for Zerg Buildings Under Construction
function createZergGestationCocoon(radius = 2.0, height = 2.1) {
    const cocoon = new THREE.Group();

    // 1. Basal Viscoelastic Creep Ring & Grasping Arterial Roots
    const basalCreep = new THREE.Mesh(createOrganicBioCarapaceGeo(radius * 1.18, 0.22, radius * 1.18, 10, 0.08), MAT.zergFlesh);
    basalCreep.position.y = 0.10;
    cocoon.add(basalCreep);

    // 2. Throbbing Translucent Biomass Gestation Sac
    const gestationSac = new THREE.Mesh(
        createOrganicBioCarapaceGeo(radius * 0.88, height * 0.62, radius * 0.88, 12, 0.14),
        MAT.zergBioShader
    );
    gestationSac.position.y = height * 0.48;
    cocoon.add(gestationSac);

    // 3. 6 Pulsing Bioluminescent Acid & Hive-Vein Nutrient Blisters
    const cocoonBlisters = [];
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const blister = new THREE.Mesh(
            createOrganicBioCarapaceGeo(radius * 0.28, height * 0.22, radius * 0.28, 7, 0.05),
            i % 2 === 0 ? MAT.acidGlow : MAT.hiveVeinGlow
        );
        blister.position.set(Math.cos(a) * radius * 0.72, height * (0.32 + (i % 3) * 0.18), Math.sin(a) * radius * 0.72);
        cocoon.add(blister);
        cocoonBlisters.push(blister);
    }

    // 4. 4 Articulated Chitin Shell Husks that peel open as the Zerg structure matures
    const shellHusks = [];
    for (let h = 0; h < 4; h++) {
        const ha = (h / 4) * Math.PI * 2 + Math.PI / 4;
        const huskPivot = new THREE.Group();
        huskPivot.position.set(Math.cos(ha) * radius * 0.82, 0.18, Math.sin(ha) * radius * 0.82);
        huskPivot.rotation.y = -ha + Math.PI / 2;
        const huskBlade = new THREE.Mesh(createCurvedScytheBladeGeo(height * 0.96, 0.24, 0.44), h % 2 === 0 ? MAT.chitinRed : MAT.chitinArmor);
        huskBlade.rotation.x = -0.28;
        huskPivot.add(huskBlade);
        cocoon.add(huskPivot);
        shellHusks.push({ pivot: huskPivot, idx: h });
    }

    cocoon.traverse(c => { c.raycast = () => {}; });
    cocoon.userData = { gestationSac, cocoonBlisters, shellHusks, radius, height };
    return cocoon;
}

// --- ENEMY BUILDING INTERIOR ANIMATION, ZERG METAMORPHOSIS COCOON & PROGRESSIVE STRUCTURAL BREAK SYSTEM ---
function updateEnemyBuildingAnimationAndBreak(eb, dt, timeSec) {
    if (!eb || !eb.mesh || eb.hp <= 0) return;
    const ud = eb.mesh.userData || {};
    const ratio = Math.max(0, eb.hp / (eb.maxHp || 1));

    // 0. ZERG ORGANIC BIOMASS METAMORPHOSIS COCOON CONSTRUCTION ANIMATION
    if (typeof eb.buildProgress === 'number' && eb.buildProgress < 1.0) {
        if (eb.mesh.scale.x !== 1.0 || eb.mesh.scale.y !== 1.0 || eb.mesh.scale.z !== 1.0) {
            eb.mesh.scale.set(1.0, 1.0, 1.0);
        }
        if (!ud.zergCocoonGroup) {
            const cRad = (eb.role === 'factory' || eb.role === 'citadel') ? 2.45 : (eb.role === 'barracks' ? 2.05 : 1.45);
            const cH = (eb.role === 'factory' || eb.role === 'citadel') ? 2.35 : (eb.role === 'barracks' ? 1.95 : 1.55);
            ud.zergCocoonGroup = createZergGestationCocoon(cRad, cH);
            eb.mesh.add(ud.zergCocoonGroup);
        }
        ud.zergCocoonGroup.visible = true;
        const p = Math.max(0.02, Math.min(1.0, eb.buildProgress));
        const cud = ud.zergCocoonGroup.userData;

        // Scale the underlying Zerg building children up inside the cocoon while keeping the cocoon at 1:1 scale
        const innerScaleXZ = 0.30 + 0.70 * p;
        const innerScaleY = 0.14 + 0.86 * p;
        for (let ci = 0; ci < eb.mesh.children.length; ci++) {
            const ch = eb.mesh.children[ci];
            if (ch === ud.zergCocoonGroup || ch === ud.emblem) continue;
            ch.scale.set(innerScaleXZ, innerScaleY, innerScaleXZ);
        }

        // Throb the gestation sac & peel open the chitin shell husks as p approaches 1.0
        if (cud && cud.gestationSac) {
            const pulse = (p < 0.82 ? (0.85 + p * 0.25) : Math.max(0.08, (1.0 - p) * 5.8)) * (1.0 + Math.sin(timeSec * 6.5) * 0.09);
            cud.gestationSac.scale.set(pulse, pulse * (1.0 - Math.sin(timeSec * 6.5) * 0.06), pulse);
        }
        if (cud && cud.cocoonBlisters) {
            for (let bi = 0; bi < cud.cocoonBlisters.length; bi++) {
                const bl = cud.cocoonBlisters[bi];
                const bScale = (p < 0.85 ? 1.0 : (1.0 - p) * 6.5) * (1.0 + Math.sin(timeSec * 8.0 + bi) * 0.18);
                bl.scale.setScalar(Math.max(0.05, bScale));
            }
        }
        if (cud && cud.shellHusks) {
            for (let hi = 0; hi < cud.shellHusks.length; hi++) {
                const hk = cud.shellHusks[hi];
                // Peel outward as metamorphosis nears completion
                hk.pivot.rotation.x = 0.15 + p * 0.85 + Math.sin(timeSec * 4.5 + hi) * 0.08;
            }
        }
        // Emit green bio-acid metamorphosis spores
        if (Math.random() < 0.28 && particles.length < 130) {
            const ang = Math.random() * Math.PI * 2;
            const sp = new THREE.Mesh(SHARED_FX_GEO.spark, Math.random() > 0.4 ? MAT.acidGlow : MAT.hiveVeinGlow);
            sp.position.set(
                eb.pos.x + Math.cos(ang) * 1.1,
                eb.pos.y + 0.6 + Math.random() * 1.2,
                eb.pos.z + Math.sin(ang) * 1.1
            );
            scene.add(sp);
            particles.push({
                mesh: sp,
                vel: new THREE.Vector3(Math.cos(ang) * 2.8, 2.2 + Math.random() * 2.4, Math.sin(ang) * 2.8),
                gravity: 9.0,
                life: 0.28
            });
        }
        return;
    } else if (ud.zergCocoonGroup && ud.zergCocoonGroup.visible) {
        ud.zergCocoonGroup.visible = false;
        for (let ci = 0; ci < eb.mesh.children.length; ci++) {
            const ch = eb.mesh.children[ci];
            if (ch === ud.zergCocoonGroup || ch === ud.emblem) continue;
            ch.scale.set(1.0, 1.0, 1.0);
        }
    }

    // 1. Pulse Bio-Sacs & Psionic Citadel Rings
    if (ud.sacs) {
        ud.sacs.forEach((sac, i) => {
            sac.scale.setScalar(1 + Math.sin(timeSec * 4.2 + i) * 0.14);
        });
    }
    if (ud.psionicRing) {
        ud.psionicRing.rotation.y += dt * 1.4;
        ud.psionicRing.rotation.z = Math.sin(timeSec * 2) * 0.22;
    }
    if (ud.claws) {
        ud.claws.forEach(c => {
            // As building takes heavy damage, outer chitin claws splay & fracture outward!
            const breakSpread = ratio < 0.5 ? (0.5 - ratio) * 0.65 : 0;
            c.pivot.rotation.x = c.baseRotX + Math.sin(timeSec * 2.5 + c.idx) * 0.08 + breakSpread;
        });
    }

    // 2. Citadel Open-Interior Heart & Feeder Tendrils Animation
    if (ud.interiorHeart) {
        ud.interiorHeart.rotation.y += dt * 1.15;
        const beat = 1.0 + Math.pow(Math.sin(timeSec * 3.8), 4) * 0.22;
        ud.interiorHeart.scale.setScalar(beat);
    }
    if (ud.feederArms) {
        ud.feederArms.forEach((arm, idx) => {
            arm.rotation.z = Math.sin(timeSec * 3.2 + idx * Math.PI) * 0.28;
            arm.rotation.y = Math.cos(timeSec * 2.4 + idx) * 0.22;
        });
    }

    // 3. Enemy Barracks (Spawning Pool) Open-Interior Specimen & Injector Animation
    if (ud.interiorLarvae) {
        ud.interiorLarvae.forEach((larva, idx) => {
            larva.rotation.y = Math.sin(timeSec * 1.8 + idx * Math.PI) * 0.55;
            larva.position.y = 0.36 + Math.sin(timeSec * 3.4 + idx) * 0.05;
        });
    }
    if (ud.bioArms) {
        ud.bioArms.forEach((arm, idx) => {
            arm.rotation.z = Math.sin(timeSec * 4.0 + idx) * 0.32;
            arm.position.y = 1.12 + Math.sin(timeSec * 5.0 + idx) * 0.06;
        });
    }

    // 4. Enemy War Factory (Bio-Factory) Open-Interior Behemoth Turntable & Splicing Gantry Animation
    if (ud.interiorBehemoth) {
        ud.interiorBehemoth.rotation.y += dt * 0.95;
        const breathe = 1.0 + Math.sin(timeSec * 3.5) * 0.06;
        ud.interiorBehemoth.scale.set(breathe, 1.0, breathe);
    }
    if (ud.bioGantry) {
        ud.bioGantry.position.x = Math.sin(timeSec * 2.2) * 0.62;
        ud.bioGantry.rotation.z = Math.cos(timeSec * 3.6) * 0.28;
        if (ud.splicerTip && Math.random() < 0.08 && particles.length < 125) {
            const tipWorld = ud.splicerTip.getWorldPosition(new THREE.Vector3());
            const sp = new THREE.Mesh(SHARED_FX_GEO.spark, MAT.acidGlow);
            sp.position.copy(tipWorld);
            scene.add(sp);
            particles.push({
                mesh: sp,
                vel: new THREE.Vector3((Math.random() - 0.5) * 3.8, 1.2 + Math.random() * 2.2, (Math.random() - 0.5) * 3.8),
                gravity: 14,
                life: 0.22
            });
        }
    }

    // 5. Progressive Organic Bruising & Bleeding Viscoelastic Bio-Goo when Zerg Base is Damaged (NEVER burns with fire/smoke!)
    if (ratio < 0.82) {
        if (ud.damageableParts) {
            ud.damageableParts.forEach((part, idx) => {
                if (!part) return;
                if (ratio < 0.65 && idx % 2 === 0 && MAT.bruisedZergChitin) {
                    part.material = MAT.bruisedZergChitin;
                } else if (ratio < 0.38 && idx % 2 === 1 && (MAT.bruisedZergHemolymph || MAT.goreMeat)) {
                    part.material = MAT.bruisedZergHemolymph || MAT.goreMeat;
                }
                if (ratio < 0.55) {
                    part.rotation.z = Math.sin(idx * 1.7 + timeSec * 4.2) * 0.14 * (1 - ratio);
                }
            });
        }

        // Spurting & Bleeding Organic Bio-Goo / Hemolymph Droplets (replaces fire/smoke completely!)
        eb.bleedGooTimer = (eb.bleedGooTimer || 0) - dt;
        if (eb.bleedGooTimer <= 0 && bloodDrops.length < 95) {
            eb.bleedGooTimer = ratio < 0.40 ? 0.16 : 0.34;
            const dropCount = ratio < 0.40 ? 3 : 2;
            const gooGeo = (SHARED_FX_GEO.gooDroplet && SHARED_FX_GEO.gooDroplet[0]) || SHARED_FX_GEO.goreChunk;
            for (let g = 0; g < dropCount; g++) {
                const ang = Math.random() * Math.PI * 2;
                const rad = 0.65 + Math.random() * 1.35;
                const gooMat = (g % 3 === 0)
                    ? (MAT.acidGlow || MAT.hiveVeinGlow)
                    : ((g % 3 === 1) ? (MAT.hiveVeinGlow || MAT.zergFlesh) : (MAT.goreMeat || MAT.zergFlesh));
                const dropMesh = new THREE.Mesh(gooGeo, gooMat);
                const s = 0.65 + Math.random() * 0.55;
                dropMesh.scale.set(s, s * 1.35, s);
                dropMesh.position.set(
                    eb.pos.x + Math.cos(ang) * rad,
                    eb.pos.y + 0.85 + Math.random() * 1.45,
                    eb.pos.z + Math.sin(ang) * rad
                );
                scene.add(dropMesh);
                const outSpd = 1.8 + Math.random() * 3.4;
                bloodDrops.push({
                    mesh: dropMesh,
                    vel: new THREE.Vector3(Math.cos(ang) * outSpd, 2.2 + Math.random() * 2.8, Math.sin(ang) * outSpd),
                    isZerg: true,
                    spawnPuddle: (g === 0 && Math.random() < 0.55),
                    life: 1.05
                });
            }
        }
    }
}

// Spawns Catastrophic Organic Zerg Corpse Rupture & Bleeding Biomass Carcass when a Zerg Base/Structure is Destroyed (NO fire, NO charred steel!)
function spawnEnemyBuildingBreakAnimation(ebPos, role = 'spawning_pool') {
    if (window.SFX) window.SFX.playExplosion(true);
    const isCitadel = role === 'citadel';

    // 1. Massive Organic Bio-Ichor & Acid Pool Splatters across the ground
    const poolCount = isCitadel ? 5 : 3;
    for (let p = 0; p < poolCount; p++) {
        const pa = (p / poolCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const pr = p === 0 ? 0 : (1.1 + Math.random() * (isCitadel ? 1.8 : 1.1));
        spawnDynamicLiquidGoreDecal(
            ebPos.x + Math.cos(pa) * pr,
            ebPos.z + Math.sin(pa) * pr,
            true,
            (isCitadel ? 2.4 : 1.7) - p * 0.22
        );
    }
    if (typeof spawnEnemyGooSplashFX === 'function') {
        spawnEnemyGooSplashFX(ebPos, isCitadel ? 'behemoth' : 'gorgon');
    }

    // 2. High-Velocity Burst of Viscoelastic Bio-Goo & Hemolymph Droplets
    const gooDropsCount = isCitadel ? 22 : 14;
    for (let d = 0; d < gooDropsCount; d++) {
        if (bloodDrops.length >= 105) {
            const oldD = bloodDrops.shift();
            if (oldD && oldD.mesh) scene.remove(oldD.mesh);
        }
        const gooGeo = (SHARED_FX_GEO.gooDroplet && SHARED_FX_GEO.gooDroplet[d % SHARED_FX_GEO.gooDroplet.length]) || SHARED_FX_GEO.goreChunk;
        const gooMat = (d % 3 === 0)
            ? (MAT.acidGlow || MAT.hiveVeinGlow)
            : ((d % 3 === 1) ? (MAT.goreMeat || MAT.zergFlesh) : (MAT.hiveVeinGlow || MAT.chitinRed));
        const drop = new THREE.Mesh(gooGeo, gooMat);
        const sc = (isCitadel ? 1.05 : 0.82) + Math.random() * 0.65;
        drop.scale.set(sc, sc * 1.3, sc);
        const a = (d / gooDropsCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        drop.position.copy(ebPos).add(new THREE.Vector3(Math.cos(a) * 0.8, 0.7 + Math.random() * 1.5, Math.sin(a) * 0.8));
        scene.add(drop);
        const spd = (isCitadel ? 5.5 : 4.2) + Math.random() * 5.8;
        bloodDrops.push({
            mesh: drop,
            vel: new THREE.Vector3(Math.cos(a) * spd, 4.5 + Math.random() * 5.5, Math.sin(a) * spd),
            isZerg: true,
            spawnPuddle: (d % 4 === 0),
            life: 1.35
        });
    }

    // 3. Flying Severed Chitin Limbs, Ruptured Organs & Fleshy Corpse Chunks (Strictly hasFire: false!)
    const pieceCount = isCitadel ? 16 : 11;
    for (let i = 0; i < pieceCount; i++) {
        if (wreckageParts.length >= 44) {
            const old = wreckageParts.shift();
            scene.remove(old.mesh);
        }
        const partKind = i % 3;
        const geo = partKind === 0
            ? createCurvedScytheBladeGeo(1.15 + Math.random() * 0.65, 0.18, 0.30)
            : (partKind === 1
                ? createOrganicBioCarapaceGeo(0.46, 0.34, 0.52, 5, 0.06)
                : SHARED_FX_GEO.goreChunk);
        const mat = i % 4 === 0
            ? (MAT.zergFlesh || MAT.goreMeat)
            : (i % 4 === 1
                ? (MAT.bruisedZergChitin || MAT.chitinRed)
                : (i % 4 === 2 ? (MAT.goreMeat || MAT.chitinArmor) : (MAT.acidGlow || MAT.hiveVeinGlow)));
        const chunk = new THREE.Mesh(geo, mat);
        if (partKind === 2) chunk.scale.set(2.1, 1.3, 1.8);

        const ang = (i / pieceCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        chunk.position.copy(ebPos).add(new THREE.Vector3(Math.cos(ang) * 0.9, 0.75 + Math.random() * 1.25, Math.sin(ang) * 0.9));
        scene.add(chunk);

        const outSpeed = (isCitadel ? 8.2 : 6.4) + Math.random() * 4.8;
        wreckageParts.push({
            mesh: chunk,
            hasFire: false,
            vel: new THREE.Vector3(Math.cos(ang) * outSpeed, 4.8 + Math.random() * 5.8, Math.sin(ang) * outSpeed),
            rotVel: new THREE.Vector3((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 11),
            smokeTimer: 999,
            life: 9.5
        });
    }

    // 4. Persistent Decaying Zerg Biological Corpse Carcass Mound on the Ground (Split Carapace + Collapsed Ribs + Oozing Bio-Organs)
    const corpseCarcass = new THREE.Group();
    const hy = getTerrainHeight(ebPos.x, ebPos.z);
    corpseCarcass.position.set(ebPos.x, hy + 0.04, ebPos.z);
    const carcassScale = isCitadel ? 1.35 : 0.95;

    // Ruptured fleshy torso/cavity mound
    const fleshMound = new THREE.Mesh(
        createOrganicBioCarapaceGeo(1.35 * carcassScale, 0.42 * carcassScale, 1.25 * carcassScale, 6, 0.08),
        MAT.goreMeat || MAT.zergFlesh
    );
    fleshMound.scale.set(1.2, 0.48, 1.15);
    fleshMound.position.y = 0.16 * carcassScale;
    corpseCarcass.add(fleshMound);

    // Split dorsal chitin shell halves splayed open
    [-1, 1].forEach(side => {
        const shellHalf = new THREE.Mesh(
            createOrganicBioCarapaceGeo(0.85 * carcassScale, 0.36 * carcassScale, 1.05 * carcassScale, 5, 0.06),
            MAT.bruisedZergChitin || MAT.chitinRed
        );
        shellHalf.position.set(side * 0.72 * carcassScale, 0.24 * carcassScale, (Math.random() - 0.5) * 0.25);
        shellHalf.rotation.z = -side * 0.48;
        corpseCarcass.add(shellHalf);
    });

    // Collapsed rib-cage arches & ruptured glowing bio-goo sacs
    for (let r = 0; r < 6; r++) {
        const ra = (r / 6) * Math.PI * 2 + 0.2;
        const rib = new THREE.Mesh(
            createCurvedScytheBladeGeo(1.18 * carcassScale, 0.16 * carcassScale, 0.26 * carcassScale),
            r % 2 === 0 ? (MAT.chitinDark || MAT.chitinRed) : (MAT.bruisedZergChitin || MAT.zergFlesh)
        );
        rib.position.set(Math.cos(ra) * 1.15 * carcassScale, 0.28 * carcassScale, Math.sin(ra) * 1.15 * carcassScale);
        rib.rotation.z = -Math.cos(ra) * 0.82;
        rib.rotation.x = Math.sin(ra) * 0.82;
        corpseCarcass.add(rib);

        if (r % 2 === 0) {
            const oozingSac = new THREE.Mesh(
                createOrganicBioCarapaceGeo(0.28 * carcassScale, 0.22 * carcassScale, 0.28 * carcassScale, 4, 0.04),
                r === 0 ? (MAT.acidGlow || MAT.hiveVeinGlow) : (MAT.hiveVeinGlow || MAT.goreMeat)
            );
            oozingSac.position.set(Math.cos(ra) * 0.55 * carcassScale, 0.26 * carcassScale, Math.sin(ra) * 0.55 * carcassScale);
            corpseCarcass.add(oozingSac);
        }
    }

    scene.add(corpseCarcass);
    wreckageParts.push({
        mesh: corpseCarcass,
        hasFire: false,
        vel: new THREE.Vector3(0, 0, 0),
        rotVel: new THREE.Vector3(0, 0, 0),
        smokeTimer: 999,
        life: 16.0
    });
}
window.updateEnemyBuildingAnimationAndBreak = updateEnemyBuildingAnimationAndBreak;
window.spawnEnemyBuildingBreakAnimation = spawnEnemyBuildingBreakAnimation;

function createEnemySpineTurret() {
    // ZERG SUBTERRANEAN SPINE-WHIP SYMBIOTE (NO mechanical/rotating "head turret"!):
    // Rooted Fleshy Maw-Crater + 6 Articulated Digging Bone-Roots + Pulsing Venom Glands +
    // 6-Segment Hierarchical Coiling Muscular Tentacle-Spine + Tri-Petal Bio-Impaler Stinger Tip
    const group = new THREE.Group();

    // 1. Subterranean Rooted Flesh-Mound & Peristaltic Muscular Basal Bulb
    const creepMound = new THREE.Mesh(createOrganicBioCarapaceGeo(1.26, 0.38, 1.26, 9, 0.08), MAT.zergFlesh);
    creepMound.position.y = 0.18;
    creepMound.castShadow = true;
    creepMound.receiveShadow = true;

    const basalSphincter = new THREE.Mesh(createOrganicBioCarapaceGeo(0.84, 0.42, 0.84, 8, 0.07), MAT.chitinDark);
    basalSphincter.position.y = 0.34;
    group.add(creepMound, basalSphincter);

    const sacs = [];
    const claws = [];
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.25;
        const clawPivot = new THREE.Group();
        clawPivot.position.set(Math.cos(a) * 0.92, 0.26, Math.sin(a) * 0.92);
        clawPivot.rotation.y = -a + Math.PI * 0.5;
        const baseRotX = 0.45;
        clawPivot.rotation.x = baseRotX;

        const rootTalon = new THREE.Mesh(createCurvedScytheBladeGeo(1.18, 0.16, 0.30), MAT.chitinArmor);
        rootTalon.castShadow = true;
        const innerTendon = new THREE.Mesh(createCurvedScytheBladeGeo(0.76, 0.10, 0.18), MAT.chitinRed);
        innerTendon.position.set(0, 0.08, -0.10);
        clawPivot.add(rootTalon, innerTendon);
        group.add(clawPivot);
        claws.push({ pivot: clawPivot, baseRotX, idx: i });

        const sac = new THREE.Mesh(
            createOrganicBioCarapaceGeo(0.26, 0.24, 0.26, 6, 0.06),
            i % 2 === 0 ? MAT.acidGlow : MAT.hiveVeinGlow
        );
        sac.position.set(Math.cos(a) * 0.68, 0.40, Math.sin(a) * 0.68);
        group.add(sac);
        sacs.push(sac);
    }

    // 2. Yaw-Twisting Root Socket + 6-Segment Hierarchical Coiling Bio-Tentacle Spine
    const yawRoot = new THREE.Group();
    yawRoot.position.set(0, 0.32, 0);
    group.add(yawRoot);

    const spineSegments = [];
    let parentNode = yawRoot;
    const segCount = 6;

    for (let s = 0; s < segCount; s++) {
        const frac = s / (segCount - 1);
        const segPivot = new THREE.Group();
        segPivot.position.set(0, s === 0 ? 0.05 : 0.34 - s * 0.015, 0);

        const segRad = THREE.MathUtils.lerp(0.42, 0.18, frac);
        const segHeight = 0.40 - s * 0.015;

        // Muscular Fleshy Core Segment
        const muscleCore = new THREE.Mesh(
            createOrganicBioCarapaceGeo(segRad * 0.92, segHeight * 0.72, segRad * 0.98, 7, 0.05),
            MAT.zergFlesh
        );
        muscleCore.position.y = segHeight * 0.45;
        muscleCore.castShadow = true;
        segPivot.add(muscleCore);

        // Interlocking Dorsal & Lateral Chitin Vertebrae Plates (No turret head!)
        const dorsalShield = new THREE.Mesh(
            createOrganicBioCarapaceGeo(segRad * 1.12, segHeight * 0.48, segRad * 0.85, 6, 0.04),
            s % 2 === 0 ? MAT.chitinRed : MAT.chitinArmor
        );
        dorsalShield.position.set(0, segHeight * 0.50, -segRad * 0.28);
        dorsalShield.rotation.x = 0.22;
        segPivot.add(dorsalShield);

        // Dorsal Serrated Bone Fin & Bioluminescent Acid Node
        const dorsalFin = new THREE.Mesh(
            createCurvedScytheBladeGeo(0.52 - s * 0.04, 0.075, 0.16),
            MAT.chitinArmor
        );
        dorsalFin.position.set(0, segHeight * 0.55, -segRad * 0.65);
        dorsalFin.rotation.x = -Math.PI * 0.62;
        segPivot.add(dorsalFin);

        const veinNode = new THREE.Mesh(
            createOrganicBioCarapaceGeo(segRad * 0.42, segHeight * 0.32, segRad * 0.35, 5, 0.03),
            s % 2 === 0 ? MAT.acidGlow : MAT.hiveVeinGlow
        );
        veinNode.position.set(0, segHeight * 0.48, segRad * 0.55);
        segPivot.add(veinNode);

        // Paired Lateral Rib-Barbs along the coiling trunk
        [-1, 1].forEach(side => {
            const ribBarb = new THREE.Mesh(
                createCurvedScytheBladeGeo(0.38 - s * 0.03, 0.055, 0.12),
                MAT.copper
            );
            ribBarb.position.set(side * segRad * 0.88, segHeight * 0.46, 0);
            ribBarb.rotation.z = -side * 0.72;
            ribBarb.rotation.y = side * 0.35;
            segPivot.add(ribBarb);
        });

        // Natural S-curve resting coil angles
        const basePitch = s < 2 ? -0.26 : (s < 4 ? 0.22 : 0.32);
        segPivot.rotation.x = basePitch;

        parentNode.add(segPivot);
        spineSegments.push({ pivot: segPivot, basePitch, veinNode, idx: s });
        parentNode = segPivot;
    }

    // 3. Apex Tri-Petal Bio-Impaler Whip Tip (Mounts directly on final spine segment, zero turret box!)
    const cannonBarrel = new THREE.Group();
    cannonBarrel.position.set(0, 0.28, 0.08);
    parentNode.add(cannonBarrel);

    const stingerBulb = new THREE.Mesh(
        createOrganicBioCarapaceGeo(0.24, 0.22, 0.34, 7, 0.05),
        MAT.acidGlow
    );
    stingerBulb.position.set(0, 0, 0.16);
    cannonBarrel.add(stingerBulb);

    const impalerStinger = new THREE.Mesh(
        createCurvedScytheBladeGeo(0.82, 0.12, 0.20),
        MAT.chitinArmor
    );
    impalerStinger.rotation.x = Math.PI * 0.48;
    impalerStinger.position.set(0, 0.02, 0.56);
    cannonBarrel.add(impalerStinger);

    // 3 Articulated Petal-Scythe Jaws that flare open when whipping acid-spines
    const mawJaws = [];
    for (let j = 0; j < 3; j++) {
        const jawAngle = (j / 3) * Math.PI * 2;
        const jawPivot = new THREE.Group();
        jawPivot.position.set(Math.cos(jawAngle) * 0.16, Math.sin(jawAngle) * 0.16, 0.18);
        jawPivot.rotation.z = jawAngle - Math.PI * 0.5;
        const jawBlade = new THREE.Mesh(
            createCurvedScytheBladeGeo(0.64, 0.085, 0.16),
            j === 0 ? MAT.chitinRed : MAT.copper
        );
        jawBlade.rotation.x = Math.PI * 0.38;
        jawPivot.add(jawBlade);
        cannonBarrel.add(jawPivot);
        mawJaws.push({ pivot: jawPivot, baseRotX: 0.18, idx: j });
    }

    group.userData = {
        isSpineTurret: true,
        head: yawRoot,
        yawRoot,
        spineSegments,
        mawJaws,
        impalerStinger,
        cannonBarrel,
        sacs,
        claws,
        pulsePhase: Math.random() * 10,
        whipAnim: 0,
        recoil: 0
    };
    return applyBuildingShadowsAndFowToGroup(group);
}

// --- REDESIGNED ENEMY DEFENSE BUILDING: ZERG NYDUS / SUBTERRANEAN IMPALER TENTACLE COLONY ---
// Purely organic Zerg subterranean burrow pit with writhing barbed worm-auger plunging into the earth!
function createEnemySubterraneanDrillTower() {
    return createEnemyDrillDefenseBuilding();
}
function createEnemyDrillDefenseBuilding() {
    const group = new THREE.Group();

    // 1. Fleshy Sphincter Borehole Maw & Glowing Subterranean Bio-Magma Pit
    const creepApron = new THREE.Mesh(createOrganicBioCarapaceGeo(1.75, 0.24, 1.75, 8, 0.06), MAT.zergFlesh);
    creepApron.position.y = 0.12;
    const boreRim = new THREE.Mesh(createSculptedTorusCollarGeo(1.18, 0.38, 12, 24), MAT.chitinRed);
    boreRim.rotation.x = Math.PI / 2;
    boreRim.position.y = 0.26;
    const boreHoleDark = new THREE.Mesh(createOrganicBioCarapaceGeo(1.08, 0.06, 1.08, 8, 0.02), MAT.chitinDark);
    boreHoleDark.position.y = 0.09;
    const magmaRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.72, 0.24, 8, 20), MAT.volatileGlow);
    magmaRing.rotation.x = Math.PI / 2;
    magmaRing.scale.set(1, 1, 0.18);
    magmaRing.position.y = 0.13;
    group.add(creepApron, boreRim, boreHoleDark, magmaRing);

    // 8 Inward-Pointing Chitinous Maw Fangs around the Pit Rim
    for (let f = 0; f < 8; f++) {
        const fa = (f / 8) * Math.PI * 2;
        const fang = new THREE.Mesh(createCurvedScytheBladeGeo(0.55, 0.09, 0.16), MAT.copper);
        fang.position.set(Math.cos(fa) * 1.05, 0.36, Math.sin(fa) * 1.05);
        fang.lookAt(0, 0.55, 0);
        group.add(fang);
    }

    // 2. 6 Overarching Curved Bone Rib Talons & Pulsing Seismic Bio-Sacs (No Metal Box Girders!)
    const sacs = [];
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const ribCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(a) * 1.48, 0.18, Math.sin(a) * 1.48),
            new THREE.Vector3(Math.cos(a) * 1.15, 1.15, Math.sin(a) * 1.15),
            new THREE.Vector3(Math.cos(a) * 0.52, 1.98, Math.sin(a) * 0.52)
        ]);
        const boneRib = new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 12, 0.14, 8, false), MAT.chitinArmor);
        boneRib.castShadow = true;
        const outerSpur = new THREE.Mesh(createCurvedScytheBladeGeo(0.82, 0.12, 0.22), MAT.chitinRed);
        outerSpur.position.set(Math.cos(a) * 1.25, 0.95, Math.sin(a) * 1.25);
        outerSpur.rotation.z = -Math.cos(a) * 0.55;
        outerSpur.rotation.x = Math.sin(a) * 0.55;
        group.add(boneRib, outerSpur);

        const sac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.28, 0.25, 0.28, 6, 0.05), i % 2 === 0 ? MAT.volatileGlow : MAT.hiveVeinGlow);
        sac.position.set(Math.cos(a) * 1.12, 0.44, Math.sin(a) * 1.12);
        group.add(sac);
        sacs.push(sac);
    }

    // 3. Upper Sphincter Crown & Plunging Barbed Chitin Burrow-Worm Auger Assembly
    const crownRing = new THREE.Mesh(createOrganicBioCarapaceGeo(0.68, 0.34, 0.68, 7, 0.06), MAT.zergTeamPurple);
    crownRing.position.y = 1.98;
    group.add(crownRing);

    const drillAssembly = new THREE.Group();
    drillAssembly.position.y = 1.15;

    const wormShaft = new THREE.Mesh(createOrganicBioCarapaceGeo(0.36, 0.72, 0.36, 8, 0.07), MAT.zergFlesh);
    wormShaft.position.y = 0.45;
    const chitinAuger = new THREE.Mesh(createSculptedOgiveSpireGeo(0.58, 1.55, 10), MAT.chitinArmor);
    chitinAuger.rotation.x = Math.PI;
    chitinAuger.position.y = -0.36;

    // Helical Bone Barbs & Glowing Bio-Rings wrapped around the Burrow-Worm Auger
    for (let s = 0; s < 4; s++) {
        const spiral = new THREE.Mesh(createSculptedTorusCollarGeo(0.42 - s * 0.08, 0.065, 8, 16), s % 2 === 0 ? MAT.volatileGlow : MAT.copper);
        spiral.rotation.x = Math.PI / 2 + 0.32;
        spiral.position.y = 0.05 - s * 0.28;
        drillAssembly.add(spiral);
    }

    drillAssembly.add(wormShaft, chitinAuger);
    group.add(drillAssembly);

    group.userData = {
        isDrillTurret: true,
        drillAssembly,
        sacs,
        pulsePhase: Math.random() * 10
    };
    return applyBuildingShadowsAndFowToGroup(group);
}

// Spawns Subterranean Borehole Tremor Warning OR Upward Impaling Drill-Spike Eruption at Target's Feet!
function spawnSubterraneanDrillEruptionFX(pos, isEruption = true) {
    const hy = getTerrainHeight(pos.x, pos.z);
    const groundPos = new THREE.Vector3(pos.x, hy, pos.z);

    if (!isEruption) {
        // Phase 1: Seismic Borehole Warning Ring + Churning Earth Clods under target before spike erupts!
        const warnRing = new THREE.Mesh(SHARED_FX_GEO.shockRing, SHARED_FX_MAT.shockAmber.clone());
        warnRing.position.set(pos.x, hy + 0.14, pos.z);
        scene.add(warnRing);
        shockwaves.push({ mesh: warnRing, scale: 0.35, speed: 6.5, alpha: 0.9 });

        for (let i = 0; i < 4; i++) {
            if (particles.length >= 140) break;
            const dirt = new THREE.Mesh(SHARED_FX_GEO.shrapnel, MAT.chitinArmor);
            dirt.scale.setScalar(0.55);
            dirt.position.set(pos.x + (Math.random() - 0.5) * 0.9, hy + 0.1, pos.z + (Math.random() - 0.5) * 0.9);
            scene.add(dirt);
            particles.push({
                mesh: dirt,
                vel: new THREE.Vector3((Math.random() - 0.5) * 2.5, 2.2 + Math.random() * 2.0, (Math.random() - 0.5) * 2.5),
                gravity: 16,
                life: 0.32
            });
        }
        return;
    }

    // Phase 2: UPWARD SUBTERRANEAN DRILL SPIKE ERUPTION + GEOTHERMAL GEYSER BLAST!
    if (window.SFX) window.SFX.playExplosion(false);
    screenShake = Math.max(screenShake, 0.22);
    spawnBombCrater(groundPos, 0.68);

    // Create a 3D Drill Spike + Magma Cone shooting straight UP out of the ground hole!
    const spikeGroup = new THREE.Group();
    spikeGroup.position.set(pos.x, hy - 0.4, pos.z);
    const drillCone = new THREE.Mesh(createSculptedOgiveSpireGeo(0.52, 2.35, 10), MAT.copper);
    drillCone.position.y = 1.1;
    const spiralGlow = new THREE.Mesh(createSculptedOgiveSpireGeo(0.58, 1.65, 8), MAT.volatileGlow);
    spiralGlow.position.y = 0.75;
    spikeGroup.add(drillCone, spiralGlow);
    scene.add(spikeGroup);

    particles.push({
        mesh: spikeGroup,
        vel: new THREE.Vector3(0, 7.5, 0),
        gravity: 22,
        life: 0.48
    });

    const ring = new THREE.Mesh(SHARED_FX_GEO.shockRing, SHARED_FX_MAT.shockAmber.clone());
    ring.position.set(pos.x, hy + 0.16, pos.z);
    scene.add(ring);
    shockwaves.push({ mesh: ring, scale: 0.55, speed: 14, alpha: 0.95 });

    for (let i = 0; i < 10; i++) {
        if (particles.length >= 145) break;
        const rock = new THREE.Mesh(SHARED_FX_GEO.shrapnel, i % 2 === 0 ? MAT.volatileGlow : MAT.chitinDark);
        rock.scale.setScalar(0.85);
        rock.position.set(pos.x, hy + 0.25, pos.z);
        scene.add(rock);
        const ang = (i / 10) * Math.PI * 2;
        particles.push({
            mesh: rock,
            vel: new THREE.Vector3(Math.cos(ang) * 4.5, 5.5 + Math.random() * 4.5, Math.sin(ang) * 4.5),
            gravity: 18,
            life: 0.45
        });
    }
}

function applyTurretUpgradeModel(turretMesh, level) {
    const ud = turretMesh.userData;
    if (!ud) return;
    if (ud.lvl2Group) ud.lvl2Group.visible = level >= 2;
    if (ud.headLvl2) ud.headLvl2.visible = level >= 2;
    if (ud.lvl3Group) ud.lvl3Group.visible = level >= 3;
    if (ud.headLvl3) ud.headLvl3.visible = level >= 3;
    if (ud.head) {
        const s = 1 + (level - 1) * 0.11;
        ud.head.scale.setScalar(s);
    }
    if (ud.lens && level >= 3) {
        ud.lens.material = MAT.amberGlow;
    }
    // Re-align hardpoint socket collars and any mounted modular pods to match the upgraded armor geometry!
    if (ud.mounts && typeof window.snapModularTurretAttachment === 'function') {
        ['left', 'right', 'top'].forEach(slot => {
            if (ud.mounts[slot]) {
                window.snapModularTurretAttachment(turretMesh, ud.mounts[slot], slot, level, false);
            }
        });
    }
}

// ============================================================================
// PROCEDURAL MODULAR TURRET & UNIT HARDPOINT ATTACHMENT SYSTEM
// Visually 'snaps' modular turret pods & unit turret assemblies onto the new
// high-detail sculpted meshes using local coordinate socket offsets, surface
// normal alignment, and procedural magnetic clamp collars.
// ============================================================================
const MODULAR_WEAPON_LOCAL_OFFSETS = {
    mg:          { left: [0.02,  0.00, 0.04], right: [-0.02, 0.00, 0.04], top: [0.00,  0.02, 0.02] },
    flame:       { left: [0.00,  0.02, 0.02], right: [ 0.00, 0.02, 0.02], top: [0.00,  0.04, 0.02] },
    plasma:      { left: [-0.02, 0.00, 0.02], right: [ 0.02, 0.00, 0.02], top: [0.00,  0.03, 0.00] },
    sniper:      { left: [-0.01, 0.01, 0.00], right: [ 0.01, 0.01, 0.00], top: [0.00,  0.03, -0.02] },
    drone:       { left: [-0.04, 0.04, 0.00], right: [ 0.04, 0.04, 0.00], top: [0.00,  0.00, 0.00] },
    mortar:      { left: [-0.02, 0.02, -0.02],right: [ 0.02, 0.02, -0.02],top: [0.00,  0.02, -0.02] },
    rocket:      { left: [-0.04, 0.00, 0.02], right: [ 0.04, 0.00, 0.02], top: [0.00,  0.04, 0.02] },
    shield:      { left: [-0.02, 0.02, 0.00], right: [ 0.02, 0.02, 0.00], top: [0.00,  0.00, 0.00] },
    mindcontrol: { left: [-0.02, 0.02, 0.00], right: [ 0.02, 0.02, 0.00], top: [0.00,  0.00, 0.00] }
};

function createProceduralHardpointCoupler(slot, wType) {
    const coupler = new THREE.Group();
    coupler.name = 'modularHardpointCoupler';
    const isTop = (slot === 'top');
    const isLeft = (slot === 'left');

    // Magnetic Locking Flange & Hydraulic Strut Bracket bridging pod to host turret surface
    const flange = new THREE.Mesh(
        createSculptedLatheBarrelGeo(0.11, 0.135, 0.10, 10),
        MAT.darkSteel
    );
    const lockRing = new THREE.Mesh(
        createSculptedTorusCollarGeo(0.115, 0.022, 6, 14),
        (wType === 'plasma' || wType === 'shield') ? MAT.cyanGlow : MAT.copper
    );
    lockRing.rotation.x = Math.PI / 2;

    const clampStrutA = new THREE.Mesh(
        createExtrudedArmorHullGeo(0.06, 0.14, 0.18, 0.01, 0.03),
        MAT.gunmetal
    );
    const clampStrutB = clampStrutA.clone();

    if (isTop) {
        flange.position.set(0, -0.09, 0);
        lockRing.position.set(0, -0.05, 0);
        clampStrutA.position.set(-0.09, -0.07, 0);
        clampStrutB.position.set(0.09, -0.07, 0);
    } else {
        const dirSign = isLeft ? 1 : -1; // Points inward toward turret dome
        flange.rotation.z = Math.PI / 2;
        flange.position.set(dirSign * 0.11, 0, 0);
        lockRing.rotation.y = Math.PI / 2;
        lockRing.position.set(dirSign * 0.07, 0, 0);
        clampStrutA.position.set(dirSign * 0.09, 0.06, 0);
        clampStrutB.position.set(dirSign * 0.09, -0.06, 0);
    }

    coupler.add(flange, lockRing, clampStrutA, clampStrutB);
    return coupler;
}

function snapModularTurretAttachment(hostMesh, podMesh, slot = 'left', level = 1, animateSnap = true) {
    if (!hostMesh || !podMesh) return null;
    const ud = hostMesh.userData || {};
    const sockets = ud.hardpointSockets || {};
    const socket = sockets[slot] || {
        baseOffset: slot === 'left'
            ? new THREE.Vector3(-0.56, 0.02, 0.02)
            : (slot === 'right' ? new THREE.Vector3(0.56, 0.02, 0.02) : new THREE.Vector3(0, 0.50, 0.02)),
        lvl2Offset: slot === 'left'
            ? new THREE.Vector3(-0.63, 0.03, 0.04)
            : (slot === 'right' ? new THREE.Vector3(0.63, 0.03, 0.04) : new THREE.Vector3(0, 0.52, 0.02)),
        lvl3Offset: slot === 'left'
            ? new THREE.Vector3(-0.65, 0.03, 0.04)
            : (slot === 'right' ? new THREE.Vector3(0.65, 0.03, 0.04) : new THREE.Vector3(0, 0.56, 0.04)),
        normal: slot === 'left'
            ? new THREE.Vector3(-1, 0, 0)
            : (slot === 'right' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)),
        euler: new THREE.Euler(0, 0, 0)
    };

    const baseVec = level >= 3
        ? socket.lvl3Offset.clone()
        : (level >= 2 ? socket.lvl2Offset.clone() : socket.baseOffset.clone());

    // Apply per-weapon local geometry trim offset so every weapon silhouette sits flush on the socket
    const wType = podMesh.userData.wType || 'mg';
    const trim = (MODULAR_WEAPON_LOCAL_OFFSETS[wType] && MODULAR_WEAPON_LOCAL_OFFSETS[wType][slot])
        ? MODULAR_WEAPON_LOCAL_OFFSETS[wType][slot]
        : [0, 0, 0];
    baseVec.x += trim[0];
    baseVec.y += trim[1];
    baseVec.z += trim[2];

    // Update host socket arm & collar position so the mechanical mount meets the pod flush
    if (socket.armMesh && socket.collarMesh) {
        if (slot === 'left' || slot === 'right') {
            const sign = slot === 'left' ? -1 : 1;
            socket.armMesh.position.set(sign * (Math.abs(baseVec.x) - 0.11), baseVec.y, baseVec.z);
            socket.collarMesh.position.set(sign * (Math.abs(baseVec.x) - 0.02), baseVec.y, baseVec.z);
        } else {
            socket.armMesh.position.set(baseVec.x, baseVec.y - 0.09, baseVec.z);
            socket.collarMesh.position.set(baseVec.x, baseVec.y - 0.02, baseVec.z);
        }
    }

    // Attach or refresh the procedural hardpoint coupler bracket on the pod
    if (podMesh.userData.couplerAdapter) {
        podMesh.remove(podMesh.userData.couplerAdapter);
    }
    const coupler = createProceduralHardpointCoupler(slot, wType);
    podMesh.add(coupler);
    podMesh.userData.couplerAdapter = coupler;

    // Store canonical snapped local coordinates & normal for recoil recovery and snap-in animation
    podMesh.userData.slot = slot;
    podMesh.userData.snapBasePos = baseVec.clone();
    podMesh.userData.snapNormal = socket.normal.clone();
    if (socket.euler) {
        podMesh.rotation.copy(socket.euler);
    }

    if (animateSnap) {
        podMesh.userData.snapAnim = 1.0;
        podMesh.position.copy(baseVec).addScaledVector(socket.normal, 0.22);
    } else {
        podMesh.userData.snapAnim = 0.0;
        podMesh.position.copy(baseVec);
    }
    return baseVec;
}
window.snapModularTurretAttachment = snapModularTurretAttachment;

// Unit-Level Hardpoint Socket Registry (For Tank Siege Turret, Gunship Belly Turret, and Valkyrie Weapon Pods)
const UNIT_HARDPOINT_SOCKETS = {
    tank_turret:       { offset: new THREE.Vector3(0, 0.63, 0.04),   euler: new THREE.Euler(0, 0, 0) },
    tank_cannon:       { offset: new THREE.Vector3(0, 0.14, 0.44),   euler: new THREE.Euler(0, 0, 0) },
    heli_belly_turret: { offset: new THREE.Vector3(0, -0.38, 0.48),  euler: new THREE.Euler(0, 0, 0) },
    valk_halo_left:    { offset: new THREE.Vector3(-0.16, 0.30, -0.04), euler: new THREE.Euler(0, 0, 0) },
    valk_halo_right:   { offset: new THREE.Vector3(0.16, 0.30, -0.04),  euler: new THREE.Euler(0, 0, 0) },
    valk_cannon:       { offset: new THREE.Vector3(0, -0.02, 0.40),  euler: new THREE.Euler(0, 0, 0) }
};

function snapUnitTurretToHardpoint(moduleMesh, socketKey) {
    if (!moduleMesh) return;
    const spec = UNIT_HARDPOINT_SOCKETS[socketKey];
    if (!spec) return;
    moduleMesh.position.copy(spec.offset);
    if (spec.euler) moduleMesh.rotation.copy(spec.euler);
    moduleMesh.userData.hardpointSocketKey = socketKey;
    moduleMesh.userData.snapBasePos = spec.offset.clone();
}
window.snapUnitTurretToHardpoint = snapUnitTurretToHardpoint;

// Builds & Updates 3D Ground Weapon Range Rings on a Turret based on its Equipped Guns!
const TURRET_WEAPON_RANGE_META = {
    flame:       { range: 7.5,  color: 0xff4500, label: 'NAPALM (7.5m)' },
    shield:      { range: 10.5, color: 0x38bdf8, label: 'FORCE SHIELD (10.5m)' },
    mg:          { range: 14.0, color: 0xffaa00, label: 'GATLING (14m)' },
    plasma:      { range: 16.5, color: 0x00e5ff, label: 'PLASMA (16.5m)' },
    mindcontrol: { range: 17.5, color: 0xe879f9, label: 'MIND CONTROL (17.5m)' },
    mortar:      { range: 18.0, color: 0xff7700, label: 'HOWITZER (18m)' },
    drone:       { range: 18.0, color: 0x00ffaa, label: 'NANO DRONE (18m)' },
    rocket:      { range: 20.0, color: 0xff2a4b, label: 'ROCKET POD (20m)' },
    sniper:      { range: 22.0, color: 0x00ff66, label: 'SNIPER RAIL (22m)' }
};

// Supports both (bObj, isSelected) AND (turretMesh, weaponsMap, isSelected) signatures.
// Range rings and aiming laser are ONLY shown when the turret is actively selected!
function updateTurretRangeVisuals(arg1, arg2 = null, arg3 = false) {
    if (!arg1) return;
    const mesh = arg1.isObject3D ? arg1 : arg1.mesh;
    const weapons = (arg2 && typeof arg2 === 'object' && ('left' in arg2)) ? arg2 : (arg1.weapons || { left: 'mg', right: 'none', top: 'none' });
    const isSelected = typeof arg2 === 'boolean' ? arg2 : !!arg3;
    const worldPos = arg1.pos ? arg1.pos : (mesh ? mesh.position : new THREE.Vector3());

    if (!mesh || !mesh.userData || !mesh.userData.rangeGroup) return;
    const rg = mesh.userData.rangeGroup;
    while (rg.children.length > 0) {
        const child = rg.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
        rg.remove(child);
    }

    // Hide range ring group & aiming laser unless this turret is currently selected!
    rg.visible = !!isSelected;
    if (mesh.userData.aimLaserLine) {
        mesh.userData.aimLaserLine.visible = !!isSelected;
    }
    if (!isSelected) return;

    // Collect unique equipped weapon types
    const equippedTypes = [];
    let maxRange = 14.0;
    let maxColor = 0xffaa00;
    ['left', 'top', 'right'].forEach(slot => {
        const w = weapons[slot];
        if (w && w !== 'none' && TURRET_WEAPON_RANGE_META[w]) {
            if (!equippedTypes.includes(w)) equippedTypes.push(w);
            if (TURRET_WEAPON_RANGE_META[w].range >= maxRange) {
                maxRange = TURRET_WEAPON_RANGE_META[w].range;
                maxColor = TURRET_WEAPON_RANGE_META[w].color;
            }
        }
    });

    // Update aiming laser line length & color on turret head when selected
    if (mesh.userData.aimLaserLine) {
        const laser = mesh.userData.aimLaserLine;
        laser.geometry.setFromPoints([
            new THREE.Vector3(0, 0.04, 0.55),
            new THREE.Vector3(0, 0.04, maxRange)
        ]);
        laser.material.color.setHex(maxColor);
        laser.material.opacity = 0.90;
    }

    // Build terrain-conforming 3D visual radius rings + perimeter bands for each installed gun when selected!
    equippedTypes.forEach(wType => {
        const meta = TURRET_WEAPON_RANGE_META[wType];
        const r = meta.range;
        const segments = 80;
        const pts = [];
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            const wx = worldPos.x + Math.cos(a) * r;
            const wz = worldPos.z + Math.sin(a) * r;
            const wy = Math.max(-0.35, getTerrainHeight(wx, wz)) - worldPos.y + 0.20;
            pts.push(new THREE.Vector3(Math.cos(a) * r, wy, Math.sin(a) * r));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({
            color: meta.color,
            transparent: true,
            opacity: 0.96
        });
        const ringLine = new THREE.Line(lineGeo, lineMat);
        rg.add(ringLine);

        const bandWidth = 0.30;
        const bandGeo = new THREE.RingGeometry(r - bandWidth, r, 64);
        bandGeo.rotateX(-Math.PI / 2);
        const bandMat = new THREE.MeshBasicMaterial({
            color: meta.color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.38,
            depthWrite: false
        });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.position.y = 0.06;
        rg.add(bandMesh);
    });
}

function createOrdnancePod(wType) {
    const pod = new THREE.Group();
    pod.userData.wType = wType;
    if (wType === 'mg') {
        const housing = new THREE.Mesh(createSculptedLatheBarrelGeo(0.18, 0.2, 0.45, 12), MAT.oliveArmor);
        housing.rotation.x = Math.PI / 2;
        pod.add(housing);

        const cluster = new THREE.Group();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const barrel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.025, 0.025, 0.65, 6), MAT.darkSteel);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0.38);
            cluster.add(barrel);
        }
        const clamp = new THREE.Mesh(createSculptedLatheBarrelGeo(0.13, 0.13, 0.06, 12), MAT.copper);
        clamp.rotation.x = Math.PI / 2; clamp.position.z = 0.58;
        cluster.add(clamp);
        pod.add(cluster);
        pod.userData.barrelCluster = cluster;
    }
    else if (wType === 'flame') {
        const manifold = new THREE.Mesh(createSculptedLatheBarrelGeo(0.16, 0.18, 0.42, 12), MAT.darkSteel);
        manifold.rotation.x = Math.PI / 2;
        pod.add(manifold);

        [-0.14, 0.14].forEach(xOff => {
            const tank = new THREE.Mesh(createSculptedLatheBarrelGeo(0.1, 0.1, 0.46, 12), MAT.crimsonTank);
            tank.rotation.x = Math.PI / 2; tank.position.set(xOff, -0.06, -0.05);
            const cap = new THREE.Mesh(createSculptedArmorDomeGeo(0.1, 10, 10), MAT.crimsonTank);
            cap.position.set(xOff, -0.06, -0.28);
            pod.add(tank, cap);
        });

        const nozzle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.08, 0.13, 0.45, 10), MAT.copper);
        nozzle.rotation.x = Math.PI / 2; nozzle.position.z = 0.36;
        const igniter = new THREE.Mesh(createSculptedArmorDomeGeo(0.06, 8, 8), MAT.amberGlow);
        igniter.position.z = 0.6;
        pod.add(nozzle, igniter);
    }
    else if (wType === 'plasma') {
        const chamber = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 0.28, 0.50, 0.04, 0.08), MAT.gunmetal);
        pod.add(chamber);

        const plasmaCore = new THREE.Mesh(createSculptedLatheBarrelGeo(0.11, 0.11, 0.72, 14), MAT.plasmaShader);
        plasmaCore.rotation.x = Math.PI / 2;
        plasmaCore.position.set(0, 0, 0.36);
        pod.add(plasmaCore);

        [-0.13, 0.13].forEach(xRail => {
            const rail = new THREE.Mesh(createExtrudedArmorHullGeo(0.06, 0.15, 0.82, 0.015, 0.04), MAT.copper);
            rail.position.set(xRail, 0, 0.42);
            pod.add(rail);
        });

        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(createSculptedTorusCollarGeo(0.15, 0.028, 8, 16), MAT.cyanGlow);
            ring.position.set(0, 0, 0.3 + i * 0.2);
            pod.add(ring);
        }
        const muzzle = new THREE.Mesh(createSculptedArmorDomeGeo(0.10, 12, 12), MAT.plasmaShader);
        muzzle.position.set(0, 0, 0.84);
        pod.add(muzzle);
        pod.userData.plasmaCore = plasmaCore;
    }
    else if (wType === 'sniper') {
        const receiver = new THREE.Mesh(createExtrudedArmorHullGeo(0.30, 0.28, 0.58, 0.04, 0.08), MAT.camoArmor);
        pod.add(receiver);

        const shroud = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.115, 0.68, 12), MAT.gunmetal);
        shroud.rotation.x = Math.PI / 2;
        shroud.position.set(0, 0, 0.48);

        const longBarrel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.045, 0.058, 1.42, 14), MAT.darkSteel);
        longBarrel.rotation.x = Math.PI / 2;
        longBarrel.position.set(0, 0, 0.96);

        const muzzleBrake = new THREE.Mesh(createExtrudedArmorHullGeo(0.18, 0.13, 0.24, 0.02, 0.04), MAT.copper);
        muzzleBrake.position.set(0, 0, 1.65);

        const scopeBody = new THREE.Mesh(createSculptedLatheBarrelGeo(0.052, 0.052, 0.46, 12), MAT.darkSteel);
        scopeBody.rotation.x = Math.PI / 2;
        scopeBody.position.set(0, 0.20, 0.18);
        const scopeLens = new THREE.Mesh(createSculptedArmorDomeGeo(0.052, 10, 10), MAT.healGlow);
        scopeLens.position.set(0, 0.20, 0.42);

        pod.add(shroud, longBarrel, muzzleBrake, scopeBody, scopeLens);
    }
    else if (wType === 'drone') {
        const dockPad = new THREE.Mesh(createSculptedLatheBarrelGeo(0.24, 0.28, 0.14, 10), MAT.darkSteel);
        const beaconRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.22, 0.03, 6, 16), MAT.healGlow);
        beaconRing.rotation.x = Math.PI / 2;
        beaconRing.position.y = 0.08;
        pod.add(dockPad, beaconRing);

        const droneMesh = new THREE.Group();
        droneMesh.position.set(0, 0.65, 0);

        const hull = new THREE.Mesh(createSculptedArmorDomeGeo(0.2, 12, 10), MAT.medicArmor);
        hull.scale.set(1.1, 0.72, 1.25);
        const crossStrip = new THREE.Mesh(createExtrudedArmorHullGeo(0.26, 0.06, 0.26), MAT.healGlow);
        crossStrip.position.y = 0.12;
        const eyeLens = new THREE.Mesh(createSculptedArmorDomeGeo(0.08, 8, 8), MAT.healGlow);
        eyeLens.position.set(0, -0.02, 0.22);

        const droneRotors = [];
        [-0.26, 0.26].forEach(xArm => {
            const strut = new THREE.Mesh(createExtrudedArmorHullGeo(0.18, 0.04, 0.06), MAT.gunmetal);
            strut.position.set(xArm * 0.6, 0.04, 0);
            const duct = new THREE.Mesh(createSculptedTorusCollarGeo(0.13, 0.025, 6, 12), MAT.darkSteel);
            duct.rotation.x = Math.PI / 2;
            duct.position.set(xArm, 0.06, 0);
            const blade = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.015, 0.04), MAT.healGlow);
            blade.position.set(xArm, 0.07, 0);
            droneRotors.push(blade);
            droneMesh.add(strut, duct, blade);
        });

        droneMesh.add(hull, crossStrip, eyeLens);
        pod.add(droneMesh);
        pod.userData.droneMesh = droneMesh;
        pod.userData.droneRotors = droneRotors;
        pod.userData.dronePhase = Math.random() * 10;
    }
    else if (wType === 'mortar') {
        const breech = new THREE.Mesh(createSculptedArmorDomeGeo(0.24, 12, 12), MAT.darkSteel);
        pod.add(breech);

        const cannon = new THREE.Group();
        cannon.rotation.x = -Math.PI / 5;
        const tube = new THREE.Mesh(createSculptedLatheBarrelGeo(0.18, 0.23, 0.78, 16), MAT.oliveArmor);
        tube.position.set(0, 0.25, 0.18);
        const recoilRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.2, 0.04, 8, 16), MAT.hazard);
        recoilRing.rotation.x = Math.PI / 2; recoilRing.position.set(0, 0.45, 0.18);
        cannon.add(tube, recoilRing);
        pod.add(cannon);
    }
    else if (wType === 'rocket') {
        // 6-TUBE ARMORED SAM / ATGM ROCKET MISSILE POD (Targets Ground & Air up to 20m!)
        const launcherBox = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 0.34, 0.62, 0.03, 0.08), MAT.terranPlating);
        launcherBox.position.set(0, 0.04, 0.14);
        const hazardTrim = new THREE.Mesh(createExtrudedArmorHullGeo(0.44, 0.06, 0.56), MAT.hazard);
        hazardTrim.position.set(0, 0.22, 0.14);
        pod.add(launcherBox, hazardTrim);

        // 6 Launch Tubes with Red Missile Nose Cones peeking out
        [-0.11, 0, 0.11].forEach(rx => {
            [-0.02, 0.10].forEach(ry => {
                const tube = new THREE.Mesh(createSculptedLatheBarrelGeo(0.042, 0.042, 0.66, 10), MAT.darkSteel);
                tube.rotation.x = Math.PI / 2;
                tube.position.set(rx, ry, 0.16);
                const warhead = new THREE.Mesh(createSculptedOgiveSpireGeo(0.038, 0.14, 10), MAT.crimsonTank);
                warhead.rotation.x = Math.PI / 2;
                warhead.position.set(rx, ry, 0.52);
                pod.add(tube, warhead);
            });
        });

        const sensorOptic = new THREE.Mesh(createSculptedArmorDomeGeo(0.065, 10, 10), MAT.amberGlow);
        sensorOptic.position.set(0, 0.26, 0.36);
        pod.add(sensorOptic);
    }
    else if (wType === 'shield') {
        // AEGIS FORCEFIELD SHIELD GENERATOR POD (Projects 10.5m Protective Energy Dome!)
        const pedestal = new THREE.Mesh(createSculptedLatheBarrelGeo(0.22, 0.28, 0.24, 12), MAT.terranCobalt);
        pedestal.position.y = 0.08;
        pod.add(pedestal);

        const shieldCore = new THREE.Group();
        shieldCore.position.set(0, 0.36, 0);
        const orb = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.18, 1), MAT.plasmaShader);
        const ring1 = new THREE.Mesh(createSculptedTorusCollarGeo(0.26, 0.028, 8, 20), MAT.cyanGlow);
        const ring2 = new THREE.Mesh(createSculptedTorusCollarGeo(0.26, 0.028, 8, 20), MAT.terranTrim);
        ring2.rotation.x = Math.PI / 2;
        shieldCore.add(orb, ring1, ring2);
        pod.add(shieldCore);
        pod.userData.shieldCore = shieldCore;
    }
    else if (wType === 'mindcontrol') {
        // PSIONIC NEURAL MIND-CONTROL SPIRE POD (Converts Enemy Zerg Units within 17.5m!)
        const baseCrown = new THREE.Mesh(createSculptedLatheBarrelGeo(0.20, 0.26, 0.22, 8), MAT.zergTeamPurple);
        baseCrown.position.y = 0.08;
        pod.add(baseCrown);

        const psiSpire = new THREE.Group();
        psiSpire.position.set(0, 0.42, 0);
        const crystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.19, 0), MAT.hiveVeinGlow);
        crystal.scale.set(0.75, 1.65, 0.75);
        const psiRingA = new THREE.Mesh(createSculptedTorusCollarGeo(0.28, 0.025, 8, 20), MAT.xenoIchorViolet);
        psiRingA.rotation.x = Math.PI / 3;
        const psiRingB = new THREE.Mesh(createSculptedTorusCollarGeo(0.22, 0.022, 8, 20), MAT.cyanGlow);
        psiRingB.rotation.y = Math.PI / 3;
        psiSpire.add(crystal, psiRingA, psiRingB);
        pod.add(psiSpire);
        pod.userData.psiSpire = psiSpire;
    }
    return pod;
}

// ============================================================================
// ============================================================================
// 5. UPGRADED SIEGE TANK, GUNSHIP, CMC MARINE ARMOR & ZERG MODELS
// ============================================================================
function createDetailedAssaultRifle(isHero = false) {
    const gun = new THREE.Group();
    const bodyMat = isHero ? MAT.copper : MAT.terranBlue;

    const stock = new THREE.Mesh(createSculptedLatheBarrelGeo(0.03, 0.045, 0.22, 8), MAT.darkSteel);
    stock.rotation.x = Math.PI / 2; stock.position.set(0, -0.02, -0.18);
    const receiver = new THREE.Mesh(createExtrudedArmorHullGeo(0.075, 0.085, 0.30, 0.012, 0.03), bodyMat);
    const mag = new THREE.Mesh(createExtrudedArmorHullGeo(0.038, 0.17, 0.055, 0.008, 0.015), MAT.terranPlating);
    mag.position.set(0, -0.1, 0.05); mag.rotation.x = 0.25;
    const scope = new THREE.Mesh(createSculptedLatheBarrelGeo(0.026, 0.026, 0.15, 8), MAT.gunmetal);
    scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.058, 0.02);
    const shroud = new THREE.Mesh(createSculptedLatheBarrelGeo(0.036, 0.038, 0.28, 8), MAT.terranPlating);
    shroud.rotation.x = Math.PI / 2; shroud.position.set(0, 0, 0.22);
    const barrel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.018, 0.018, 0.28, 8), MAT.darkSteel);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0, 0.42);
    const muzzleTip = new THREE.Mesh(createSculptedLatheBarrelGeo(0.03, 0.03, 0.07, 8), isHero ? MAT.amberGlow : MAT.cyanGlow);
    muzzleTip.rotation.x = Math.PI / 2; muzzleTip.position.set(0, 0, 0.56);

    gun.add(stock, receiver, mag, scope, shroud, barrel, muzzleTip);
    return gun;
}

function createCaduceusMedicalGauntlet() {
    const group = new THREE.Group();
    // Arm-mounted nano-restoration canister with bio-fluid glow
    const can = new THREE.Mesh(createSculptedLatheBarrelGeo(0.04, 0.04, 0.22, 10), MAT.healGlow);
    can.rotation.x = Math.PI / 2;
    can.position.set(0, 0.03, 0.08);
    // Ceramic medical housing
    const housing = new THREE.Mesh(createSculptedLatheBarrelGeo(0.055, 0.055, 0.16, 8), MAT.medicArmor);
    housing.rotation.x = Math.PI / 2;
    housing.position.set(0, 0.03, -0.02);
    const emitterNozzle = new THREE.Mesh(createSculptedOgiveSpireGeo(0.03, 0.12, 8), MAT.cyanGlow);
    emitterNozzle.rotation.x = Math.PI / 2;
    emitterNozzle.position.set(0, 0.03, 0.24);
    // Twin Caduceus injector prongs
    [-0.035, 0.035].forEach(px => {
        const prong = new THREE.Mesh(createSculptedLatheBarrelGeo(0.008, 0.012, 0.14, 6), MAT.darkSteel);
        prong.rotation.x = Math.PI / 2;
        prong.position.set(px, 0.02, 0.26);
        group.add(prong);
    });
    group.add(can, housing, emitterNozzle);
    return group;
}

function createBiometricScannerPad() {
    const group = new THREE.Group();
    const pad = new THREE.Mesh(createExtrudedArmorHullGeo(0.12, 0.03, 0.18), MAT.medicArmor);
    const screen = new THREE.Mesh(createExtrudedArmorHullGeo(0.09, 0.01, 0.14), MAT.cyanGlow);
    screen.position.y = 0.018;
    const pulseRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.04, 0.008, 6, 12), MAT.healGlow);
    pulseRing.rotation.x = Math.PI / 2;
    pulseRing.position.y = 0.022;
    group.add(pad, screen, pulseRing);
    return group;
}

function createPlasmaBroadsword() {
    const sword = new THREE.Group();
    const hilt = new THREE.Mesh(createSculptedLatheBarrelGeo(0.025, 0.025, 0.22, 8), MAT.copper);
    const guard = new THREE.Mesh(createSculptedLatheBarrelGeo(0.04, 0.04, 0.22, 6), MAT.gunmetal);
    guard.rotation.z = Math.PI / 2; guard.position.y = 0.1;
    const blade = new THREE.Mesh(createSculptedOgiveSpireGeo(0.055, 0.72, 6), MAT.cyanGlow);
    blade.scale.set(0.35, 1, 1.2); blade.position.y = 0.48;
    sword.add(hilt, guard, blade);
    sword.rotation.x = Math.PI / 2.4;
    return sword;
}

function createVehicleModel(vType) {
    const group = new THREE.Group();

    if (vType === 'tank') {
        // REDESIGNED M80 GRIZZLY SIEGE TANK:
        // Clean non-overlapping geometry (No Z-fighting/flicker) + StarCraft II Terran Dominion Blue Team Livery
        const trackWidth = 0.32;
        const trackTrackDist = 0.68;

        [-trackTrackDist, trackTrackDist].forEach(xOff => {
            const podGroup = new THREE.Group();
            podGroup.position.set(xOff, 0, 0);

            // Main Ribbed Steel Track Belt (width 0.32, extending from xOff-0.16 to xOff+0.16)
            const trackBelt = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth, 0.32, 2.02, 0.025, 0.08), MAT.treadMat);
            trackBelt.position.y = 0.17;
            trackBelt.castShadow = true;
            podGroup.add(trackBelt);

            // Front & Rear Toothed Drive Sprockets
            [-0.96, 0.96].forEach(zEnd => {
                const sprocket = new THREE.Mesh(createSculptedLatheBarrelGeo(0.17, 0.17, trackWidth + 0.02, 14), MAT.treadMat);
                sprocket.rotation.z = Math.PI / 2;
                sprocket.position.set(0, 0.19, zEnd);
                const hub = new THREE.Mesh(createSculptedLatheBarrelGeo(0.08, 0.08, trackWidth + 0.05, 8), MAT.copper);
                hub.rotation.z = Math.PI / 2;
                hub.position.set(0, 0.19, zEnd);
                podGroup.add(sprocket, hub);
            });

            // 5 Suspension Road Wheels along outer track face
            [-0.72, -0.36, 0, 0.36, 0.72].forEach(zWheel => {
                const wheel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.125, 0.125, trackWidth + 0.03, 10), MAT.darkSteel);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(0, 0.14, zWheel);
                const rim = new THREE.Mesh(createSculptedLatheBarrelGeo(0.055, 0.055, trackWidth + 0.04, 8), MAT.terranCobalt);
                rim.rotation.z = Math.PI / 2;
                rim.position.set(0, 0.14, zWheel);
                podGroup.add(wheel, rim);
            });

            // Heavy Chobham Side-Skirt Armor with Dominion Blue Accent Stripe
            const sideSkirt = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth + 0.04, 0.14, 2.08, 0.02, 0.06), MAT.terranPlating);
            sideSkirt.position.set(0, 0.35, 0);
            sideSkirt.castShadow = true;

            const blueTrim = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth + 0.045, 0.04, 1.7), MAT.terranBlue);
            blueTrim.position.set(0, 0.37, 0);

            const frontMudguard = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth + 0.04, 0.11, 0.26), MAT.hazard);
            frontMudguard.rotation.x = 0.44;
            frontMudguard.position.set(0, 0.29, 1.08);

            podGroup.add(sideSkirt, blueTrim, frontMudguard);
            group.add(podGroup);
        });

        // Lower Hull: width 0.90 (from -0.45 to +0.45), leaving 0.07 clearance to tracks (inner edge 0.52). ZERO penetration!
        const lowerHull = new THREE.Mesh(createExtrudedArmorHullGeo(0.90, 0.32, 1.94, 0.05, 0.16), MAT.terranPlating);
        lowerHull.position.y = 0.28;
        lowerHull.castShadow = true;

        // Upper Deck: cleanly stacked above lower hull at y=0.46 (height 0.18, width 0.94, length 1.62)
        const upperDeck = new THREE.Mesh(createExtrudedArmorHullGeo(0.94, 0.18, 1.62, 0.04, 0.14), MAT.terranPlating);
        upperDeck.position.set(0, 0.46, -0.06);
        upperDeck.castShadow = true;

        // Terran Dominion Blue Racing Plate along upper deck
        const deckPlate = new THREE.Mesh(createExtrudedArmorHullGeo(0.82, 0.04, 1.48, 0.015, 0.08), MAT.terranBlue);
        deckPlate.position.set(0, 0.56, -0.06);

        // Angled Sloped Glacis Armor (Seated seamlessly onto front hull)
        const glacisPlate = new THREE.Mesh(createExtrudedArmorHullGeo(0.90, 0.19, 0.52, 0.03, 0.12), MAT.terranBlue);
        glacisPlate.rotation.x = 0.42;
        glacisPlate.position.set(0, 0.40, 0.78);

        const dozerLip = new THREE.Mesh(createExtrudedArmorHullGeo(0.94, 0.14, 0.18, 0.02, 0.06), MAT.hazard);
        dozerLip.position.set(0, 0.20, 1.02);

        // Front Headlights with Terran Cyan Glow
        [-0.32, 0.32].forEach(lx => {
            const lamp = new THREE.Mesh(createSculptedLatheBarrelGeo(0.06, 0.07, 0.08, 14), MAT.terranTrim);
            lamp.rotation.x = Math.PI / 2;
            lamp.position.set(lx, 0.43, 0.96);
            group.add(lamp);
        });

        // Rear Engine Louver Grille & Twin Exhaust Pipes
        const engineGrille = new THREE.Mesh(createExtrudedArmorHullGeo(0.78, 0.07, 0.48, 0.02, 0.08), MAT.darkSteel);
        engineGrille.position.set(0, 0.54, -0.56);
        [-0.32, 0.32].forEach(ex => {
            const pipe = new THREE.Mesh(createSculptedLatheBarrelGeo(0.065, 0.075, 0.44, 12), MAT.copper);
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(ex, 0.41, -0.95);
            group.add(pipe);
        });

        group.add(lowerHull, upperDeck, deckPlate, glacisPlate, dozerLip, engineGrille);

        // Turret Turntable Ring (Prevents coplanar Z-fighting between hull and turret)
        const turntable = new THREE.Mesh(createSculptedLatheBarrelGeo(0.48, 0.50, 0.08, 20), MAT.darkSteel);
        turntable.position.set(0, 0.58, 0.04);
        group.add(turntable);

        // Sculpted Composite Siege Turret (Independent 360° Yaw) with Terran Dominion Blue Cheeks
        const turret = new THREE.Group();
        snapUnitTurretToHardpoint(turret, 'tank_turret');

        const turretBustle = new THREE.Mesh(createExtrudedArmorHullGeo(0.88, 0.30, 1.16, 0.05, 0.18), MAT.terranPlating);
        turretBustle.position.set(0, 0.13, -0.1);
        turretBustle.castShadow = true;

        // Angled Cheek Armor Wedges with Team Blue Finish
        [-0.41, 0.41].forEach(cx => {
            const cheek = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.25, 0.64, 0.03, 0.07), MAT.terranBlue);
            cheek.rotation.y = cx > 0 ? -0.32 : 0.32;
            cheek.position.set(cx, 0.13, 0.26);
            cheek.castShadow = true;
            turret.add(cheek);
        });

        // Commander Cupola Hatch, CITV Thermal Sight & Antenna
        const cupola = new THREE.Mesh(createSculptedLatheBarrelGeo(0.18, 0.21, 0.14, 16), MAT.darkSteel);
        cupola.position.set(-0.20, 0.32, -0.14);
        const citv = new THREE.Mesh(createSculptedLatheBarrelGeo(0.09, 0.11, 0.15, 14), MAT.terranCobalt);
        citv.position.set(0.22, 0.33, 0.11);
        const citvLens = new THREE.Mesh(createSculptedArmorDomeGeo(0.07, 14, 12), MAT.terranTrim);
        citvLens.position.set(0.22, 0.35, 0.18);
        const whipAntenna = new THREE.Mesh(createSculptedLatheBarrelGeo(0.015, 0.022, 0.72, 8), MAT.darkSteel);
        whipAntenna.position.set(-0.31, 0.52, -0.52);
        turret.add(turretBustle, cupola, citv, citvLens, whipAntenna);

        // Pitching 120mm Rifled Siege Cannon Assembly with Hydraulic Recoil Cylinder
        const cannonPivot = new THREE.Group();
        snapUnitTurretToHardpoint(cannonPivot, 'tank_cannon');

        const mantlet = new THREE.Mesh(createExtrudedArmorHullGeo(0.40, 0.26, 0.32, 0.035, 0.07), MAT.terranPlating);
        mantlet.position.set(0, 0, 0);

        // Subgroup for the Recoiling Barrel (Slides into mantlet during shoot animation!)
        const recoilBarrel = new THREE.Group();
        recoilBarrel.position.set(0, 0, 0.14);

        const barrelLathePts = [
            new THREE.Vector2(0.0, 0.0),
            new THREE.Vector2(0.13, 0.0),
            new THREE.Vector2(0.12, 0.44),
            new THREE.Vector2(0.088, 0.48),
            new THREE.Vector2(0.088, 0.62),
            new THREE.Vector2(0.12, 0.66),
            new THREE.Vector2(0.12, 0.92),
            new THREE.Vector2(0.078, 0.96),
            new THREE.Vector2(0.075, 1.40),
            new THREE.Vector2(0.115, 1.44),
            new THREE.Vector2(0.115, 1.58),
            new THREE.Vector2(0.045, 1.58)
        ];
        const latheBarrel = new THREE.Mesh(new THREE.LatheGeometry(barrelLathePts, 18), MAT.darkSteel);
        latheBarrel.rotation.x = Math.PI / 2;
        latheBarrel.castShadow = true;

        const muzzleBrake = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.18, 0.24, 0.025, 0.05), MAT.terranCobalt);
        muzzleBrake.position.set(0, 0, 1.50);

        // Realistic Multi-Chamber 120mm Cannon Muzzle-Brake Volumetric Blast Plume & Mach Shock Core
        const tankMuzzleFlash = new THREE.Group();
        tankMuzzleFlash.position.set(0, 0, 1.72);
        tankMuzzleFlash.visible = false;

        // Muzzle locator node at barrel tip (all muzzle flash visuals are generated dynamically via 3D particle bursts!)
        recoilBarrel.add(latheBarrel, muzzleBrake, tankMuzzleFlash);
        cannonPivot.add(mantlet, recoilBarrel);
        turret.add(cannonPivot);
        group.add(turret);

        group.userData = {
            isVehicle: true, isAir: false, vType: 'tank',
            turret, cannonPivot, recoilBarrel, tankMuzzleFlash, turretYaw: 0, phase: 0, attackAnim: 0
        };
    }
    else if (vType === 'siege_tank') {
        // ====================================================================
        // STARCRAFT CRUCIO TRANSFORMER-MECH SIEGE TANK
        // 4 Independent Track Pods on Expanding Hydraulic Swing-Arms +
        // Ground-Locking Anchor Claws + Elevating Chassis & Unfolding 180mm Artillery
        // ====================================================================
        const chassisBody = new THREE.Group();
        group.add(chassisBody);

        // Central Armored Core Hull & Hydraulic Jack Belly
        const bellyJack = new THREE.Mesh(createSculptedLatheBarrelGeo(0.42, 0.48, 0.24, 12), MAT.darkSteel);
        bellyJack.position.set(0, 0.16, 0);
        group.add(bellyJack);

        const lowerHull = new THREE.Mesh(createExtrudedArmorHullGeo(0.92, 0.34, 1.88, 0.05, 0.16), MAT.terranPlating);
        lowerHull.position.y = 0.32;
        lowerHull.castShadow = true;
        const upperDeck = new THREE.Mesh(createExtrudedArmorHullGeo(0.98, 0.22, 1.62, 0.04, 0.14), MAT.gunmetal);
        upperDeck.position.set(0, 0.50, -0.04);
        upperDeck.castShadow = true;
        const deckAccent = new THREE.Mesh(createExtrudedArmorHullGeo(0.84, 0.05, 1.44, 0.015, 0.08), MAT.terranBlue);
        deckAccent.position.set(0, 0.62, -0.04);
        const frontDozer = new THREE.Mesh(createExtrudedArmorHullGeo(0.88, 0.18, 0.24, 0.02, 0.06), MAT.hazard);
        frontDozer.position.set(0, 0.24, 1.02);
        const rearExhaust = new THREE.Mesh(createExtrudedArmorHullGeo(0.76, 0.24, 0.26, 0.02, 0.05), MAT.copper);
        rearExhaust.position.set(0, 0.36, -0.96);
        chassisBody.add(lowerHull, upperDeck, deckAccent, frontDozer, rearExhaust);

        // 4 Independent StarCraft Transformer Track Pods Mounted on Expanding Hydraulic Swing-Arms!
        const trackPods = [];
        [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
            // Shoulder Swing-Arm Pivot attached to Central Hull
            const armPivot = new THREE.Group();
            const baseArmX = sx * 0.44;
            const baseArmZ = sz * 0.58;
            armPivot.position.set(baseArmX, 0.28, baseArmZ);

            // Articulated Hydraulic Expansion Arm linking Hull to Track Pod
            const swingArm = new THREE.Mesh(createExtrudedArmorHullGeo(0.46, 0.18, 0.32, 0.02, 0.05), MAT.darkSteel);
            swingArm.position.set(sx * 0.18, 0.02, 0);
            const chromePiston = new THREE.Mesh(createSculptedLatheBarrelGeo(0.055, 0.055, 0.52, 8), MAT.titanium);
            chromePiston.rotation.z = Math.PI / 2;
            chromePiston.position.set(sx * 0.22, 0.08, sz * 0.06);
            const armJoint = new THREE.Mesh(createSculptedLatheBarrelGeo(0.11, 0.11, 0.24, 10), MAT.copper);
            armJoint.position.set(0, 0.02, 0);
            armPivot.add(swingArm, chromePiston, armJoint);

            // Independent Armored Caterpillar Track Pod at end of Hydraulic Arm
            const podGroup = new THREE.Group();
            const basePodX = sx * 0.34;
            podGroup.position.set(basePodX, -0.28, 0);

            const trackWidth = 0.38;
            const trackLen = 1.06;
            const trackBelt = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth, 0.34, trackLen, 0.025, 0.08), MAT.treadMat);
            trackBelt.position.y = 0.18;
            trackBelt.castShadow = true;
            podGroup.add(trackBelt);

            [-0.44, 0.44].forEach(zEnd => {
                const sprocket = new THREE.Mesh(createSculptedLatheBarrelGeo(0.17, 0.17, trackWidth + 0.03, 12), MAT.treadMat);
                sprocket.rotation.z = Math.PI / 2;
                sprocket.position.set(0, 0.19, zEnd);
                const hub = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.085, trackWidth + 0.06, 8), MAT.copper);
                hub.rotation.z = Math.PI / 2;
                hub.position.set(0, 0.19, zEnd);
                podGroup.add(sprocket, hub);
            });

            const podArmorFender = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth + 0.06, 0.18, trackLen + 0.06, 0.02, 0.06), MAT.terranPlating);
            podArmorFender.position.set(0, 0.38, 0);
            podArmorFender.castShadow = true;
            const podBlueStripe = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth + 0.07, 0.06, trackLen * 0.78), MAT.terranBlue);
            podBlueStripe.position.set(0, 0.42, 0);
            const podHazard = new THREE.Mesh(createExtrudedArmorHullGeo(trackWidth + 0.07, 0.05, 0.28), MAT.hazard);
            podHazard.position.set(0, 0.36, sz * 0.38);
            podGroup.add(podArmorFender, podBlueStripe, podHazard);

            // Outer Ground-Locking Siege Anchor Claw & Stabilizer Foot on each Track Pod!
            const anchorClaw = new THREE.Group();
            anchorClaw.position.set(sx * 0.22, 0.32, sz * 0.18);
            const clawStrut = new THREE.Mesh(createExtrudedArmorHullGeo(0.28, 0.14, 0.30, 0.02, 0.04), MAT.darkSteel);
            clawStrut.position.set(sx * 0.10, -0.04, 0);
            const clawSpade = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 0.10, 0.38, 0.02, 0.05), MAT.hazard);
            clawSpade.position.set(sx * 0.20, -0.18, 0);
            const clawSpike = new THREE.Mesh(createSculptedLatheBarrelGeo(0.05, 0.11, 0.22, 8), MAT.gunmetal);
            clawSpike.position.set(sx * 0.20, -0.28, 0);
            const lockBeacon = new THREE.Mesh(createSculptedArmorDomeGeo(0.055, 8, 8), MAT.cyanGlow);
            lockBeacon.position.set(sx * 0.18, -0.10, 0);
            anchorClaw.add(clawStrut, clawSpade, clawSpike, lockBeacon);
            podGroup.add(anchorClaw);

            armPivot.add(podGroup);
            group.add(armPivot);
            trackPods.push({ armPivot, podGroup, chromePiston, anchorClaw, sx, sz, baseArmX, baseArmZ, basePodX });
        });

        // Heavy Elevating Turret Pedestal & Rotating StarCraft Crucio Turret Head
        const turretLiftRig = new THREE.Group();
        turretLiftRig.position.set(0, 0.64, 0);
        chassisBody.add(turretLiftRig);

        const turntable = new THREE.Mesh(createSculptedLatheBarrelGeo(0.54, 0.58, 0.14, 18), MAT.darkSteel);
        turntable.position.set(0, -0.02, 0.0);
        turretLiftRig.add(turntable);

        const turret = new THREE.Group();
        turret.position.set(0, 0.04, 0.0);
        turretLiftRig.add(turret);

        const turretBustle = new THREE.Mesh(createExtrudedArmorHullGeo(1.08, 0.38, 1.42, 0.05, 0.18), MAT.terranPlating);
        turretBustle.position.set(0, 0.18, -0.16);
        turretBustle.castShadow = true;
        turret.add(turretBustle);

        // Unfolding Transformer Shoulder Armor Wings on Turret Sides
        const shoulderWings = [];
        [-1, 1].forEach(sx => {
            const wingPivot = new THREE.Group();
            wingPivot.position.set(sx * 0.52, 0.20, 0.08);
            const wingPlate = new THREE.Mesh(createExtrudedArmorHullGeo(0.28, 0.32, 0.92, 0.03, 0.08), MAT.terranBlue);
            wingPlate.position.set(sx * 0.10, 0, 0);
            const wingTrim = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.10, 0.76), MAT.hazard);
            wingTrim.position.set(sx * 0.20, 0.12, 0);
            wingPivot.add(wingPlate, wingTrim);
            turret.add(wingPivot);
            shoulderWings.push({ wingPivot, sx });
        });

        // Artillery Fire-Control Radar & Rear Counterweight Ammo Pack
        const radarPod = new THREE.Mesh(createSculptedLatheBarrelGeo(0.18, 0.22, 0.18, 12), MAT.copper);
        radarPod.position.set(0, 0.44, -0.38);
        const radarDish = new THREE.Mesh(createExtrudedArmorHullGeo(0.48, 0.18, 0.08, 0.015, 0.04), MAT.cyanGlow);
        radarDish.position.set(0, 0.56, -0.34);
        turret.add(radarPod, radarDish);

        // Elevating Twin 180mm Crucio Shock-Cannon / Mjolnir Artillery Breech & Telescoping Barrels
        const cannonPivot = new THREE.Group();
        cannonPivot.position.set(0, 0.22, 0.26);

        const mantlet = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 0.34, 0.46, 0.035, 0.07), MAT.darkSteel);
        const breechUpperCowl = new THREE.Mesh(createExtrudedArmorHullGeo(0.62, 0.24, 0.88, 0.03, 0.06), MAT.hazard);
        breechUpperCowl.position.set(0, 0.14, -0.16);
        cannonPivot.add(mantlet, breechUpperCowl);

        const recoilBarrel = new THREE.Group();
        recoilBarrel.position.set(0, 0, 0.16);

        const siegeBarrelExt = new THREE.Group();
        recoilBarrel.add(siegeBarrelExt);

        [-0.17, 0.17].forEach(bx => {
            const outerJacket = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.24, 1.05, 0.02, 0.04), MAT.terranPlating);
            outerJacket.position.set(bx, 0.02, 0.48);
            recoilBarrel.add(outerJacket);

            const mainTube = new THREE.Mesh(createSculptedLatheBarrelGeo(0.09, 0.11, 1.95, 12), MAT.darkSteel);
            mainTube.rotation.x = Math.PI / 2;
            mainTube.position.set(bx, 0.02, 0.96);
            mainTube.castShadow = true;

            const siegeRail = new THREE.Mesh(createExtrudedArmorHullGeo(0.065, 0.15, 1.48, 0.01, 0.03), MAT.copper);
            siegeRail.position.set(bx, 0.09, 0.82);

            const plasmaCoil = new THREE.Mesh(createExtrudedArmorHullGeo(0.08, 0.07, 0.92), MAT.cyanGlow);
            plasmaCoil.position.set(bx, 0.13, 0.92);

            const muzzleBrake = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.20, 0.28, 0.02, 0.04), MAT.terranCobalt);
            muzzleBrake.position.set(bx, 0.02, 1.90);
            siegeBarrelExt.add(mainTube, siegeRail, plasmaCoil, muzzleBrake);
        });

        // Muzzle locator node at barrel tip (all muzzle flash visuals are generated dynamically via 3D particle bursts!)
        const tankMuzzleFlash = new THREE.Group();
        tankMuzzleFlash.position.set(0, 0.02, 2.10);

        siegeBarrelExt.add(tankMuzzleFlash);
        cannonPivot.add(recoilBarrel);
        turret.add(cannonPivot);

        group.userData = {
            isVehicle: true, isAir: false, vType: 'siege_tank',
            chassisBody, turretLiftRig, turret, cannonPivot, recoilBarrel, siegeBarrelExt,
            breechUpperCowl, shoulderWings, trackPods, tankMuzzleFlash, radarDish,
            siegeMode: false, siegeTransition: 0, turretYaw: 0, phase: 0, attackAnim: 0
        };
    }
    else if (vType === 'heli') {
        // SCULPTED AH-99 VALKYRIE GUNSHIP HELICOPTER (With Articulated Under-Belly Rotary Minigun Turret & Muzzle Flash!)
        const airframe = new THREE.Group();
        group.add(airframe);

        const fuselage = new THREE.Mesh(createExtrudedArmorHullGeo(0.82, 0.66, 2.12, 0.08, 0.24), MAT.terranPlating);
        fuselage.castShadow = true;

        const noseLathePts = [
            new THREE.Vector2(0.0, 0.82),
            new THREE.Vector2(0.16, 0.72),
            new THREE.Vector2(0.28, 0.42),
            new THREE.Vector2(0.36, 0.0)
        ];
        const noseCone = new THREE.Mesh(new THREE.LatheGeometry(noseLathePts, 18), MAT.terranBlue);
        noseCone.rotation.x = Math.PI / 2;
        noseCone.scale.set(1.05, 0.78, 1.0);
        noseCone.position.set(0, -0.06, 0.98);

        // Compound Curved Bubble Armored Glass Canopies (Pilot + Gunner)
        const gunnerCanopy = new THREE.Mesh(createExtrudedArmorHullGeo(0.58, 0.34, 0.76, 0.06, 0.18), MAT.canopyGlass);
        gunnerCanopy.rotation.x = 0.22;
        gunnerCanopy.position.set(0, 0.24, 0.68);
        const pilotCanopy = new THREE.Mesh(createExtrudedArmorHullGeo(0.64, 0.36, 0.84, 0.06, 0.2), MAT.canopyGlass);
        pilotCanopy.position.set(0, 0.38, 0.05);

        // FLIR Optical Target Sensor Ball under Nose
        const flirBall = new THREE.Mesh(createSculptedArmorDomeGeo(0.14, 16, 14), MAT.copper);
        flirBall.position.set(0, -0.14, 1.65);
        const flirEye = new THREE.Mesh(createSculptedArmorDomeGeo(0.075, 12, 12), MAT.cyanGlow);
        flirEye.position.set(0, -0.14, 1.75);

        // --- ARTICULATED UNDER-BELLY 6-BARREL ROTARY MINIGUN TURRET + 3D MUZZLE FLASH ---
        const bellyTurret = new THREE.Group();
        snapUnitTurretToHardpoint(bellyTurret, 'heli_belly_turret');

        const gimbalYoke = new THREE.Mesh(createSculptedLatheBarrelGeo(0.20, 0.24, 0.22, 12), MAT.darkSteel);
        const ammoDrum = new THREE.Mesh(createExtrudedArmorHullGeo(0.36, 0.22, 0.34, 0.02, 0.06), MAT.terranBlue);
        ammoDrum.position.set(0, -0.12, -0.06);
        bellyTurret.add(gimbalYoke, ammoDrum);

        const bellyPitchPivot = new THREE.Group();
        bellyPitchPivot.position.set(0, -0.14, 0.06);

        const bellyMinigunCluster = new THREE.Group();
        for (let b = 0; b < 6; b++) {
            const a = (b / 6) * Math.PI * 2;
            const bTube = new THREE.Mesh(createSculptedLatheBarrelGeo(0.022, 0.022, 0.72, 6), MAT.darkSteel);
            bTube.rotation.x = Math.PI / 2;
            bTube.position.set(Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0.38);
            bellyMinigunCluster.add(bTube);
        }
        const barrelClamp = new THREE.Mesh(createSculptedLatheBarrelGeo(0.11, 0.11, 0.06, 12), MAT.copper);
        barrelClamp.rotation.x = Math.PI / 2;
        barrelClamp.position.z = 0.62;
        bellyMinigunCluster.add(barrelClamp);

        // Belly Minigun Muzzle Locator (muzzle flash uses dynamic 3D particle bursts instead of basic shapes!)
        const bellyMuzzleFlash = new THREE.Group();
        bellyMuzzleFlash.position.set(0, 0, 0.82);
        bellyMuzzleFlash.visible = false;

        const bellyMuzzle = new THREE.Object3D();
        bellyMuzzle.position.set(0, 0, 0.85);

        bellyPitchPivot.add(bellyMinigunCluster, bellyMuzzleFlash, bellyMuzzle);
        bellyTurret.add(bellyPitchPivot);
        airframe.add(bellyTurret);

        // Twin Side Turbo-Shaft Engine Nacelles & Thruster Particle Nozzles
        const thrusterNozzles = [];
        [-0.48, 0.48].forEach(ex => {
            const nacelle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.21, 0.23, 1.08, 16), MAT.gunmetal);
            nacelle.rotation.x = Math.PI / 2;
            nacelle.position.set(ex, 0.16, -0.18);
            const intake = new THREE.Mesh(createSculptedTorusCollarGeo(0.17, 0.035, 10, 16), MAT.copper);
            intake.position.set(ex, 0.16, 0.36);
            const exhaustNozzle = new THREE.Object3D();
            exhaustNozzle.position.set(ex, 0.16, -0.76);
            thrusterNozzles.push({ node: exhaustNozzle, dir: new THREE.Vector3(0, -0.12, -1).normalize(), color: 'amber', scale: 0.72 });
            airframe.add(nacelle, intake, exhaustNozzle);

            const skid = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.032, 1.58, 12), MAT.darkSteel);
            skid.rotation.x = Math.PI / 2;
            skid.position.set(ex * 1.15, -0.48, 0.1);
            airframe.add(skid);
        });

        // Swept Aerodynamic Weapon Pylons + Hydra Rocket Pods
        const stubWing = new THREE.Mesh(createExtrudedArmorHullGeo(2.18, 0.11, 0.44, 0.03, 0.12), MAT.terranBlue);
        stubWing.position.set(0, -0.06, 0.08);
        [-0.75, 0.75].forEach(wx => {
            const rocketPod = new THREE.Mesh(createSculptedLatheBarrelGeo(0.155, 0.155, 0.64, 16), MAT.darkSteel);
            rocketPod.rotation.x = Math.PI / 2;
            rocketPod.position.set(wx, -0.22, 0.12);
            const podFace = new THREE.Mesh(createSculptedLatheBarrelGeo(0.145, 0.145, 0.03, 16), MAT.hazard);
            podFace.rotation.x = Math.PI / 2;
            podFace.position.set(wx, -0.22, 0.45);
            const wingtipLight = new THREE.Mesh(createSculptedArmorDomeGeo(0.055, 12, 12), wx < 0 ? MAT.medicCross : MAT.healGlow);
            wingtipLight.position.set(wx * 1.42, -0.06, 0.08);
            airframe.add(rocketPod, podFace, wingtipLight);
        });

        // Tapered Tail Boom, Swept Vertical Fin, Horizontal Stabilizer & Spinning Tail Rotor
        const tailBoom = new THREE.Mesh(createSculptedLatheBarrelGeo(0.12, 0.29, 1.78, 16), MAT.terranPlating);
        tailBoom.rotation.x = Math.PI / 2;
        tailBoom.position.set(0, 0.05, -1.65);
        const vFin = new THREE.Mesh(createExtrudedArmorHullGeo(0.1, 0.68, 0.44, 0.025, 0.1), MAT.terranBlue);
        vFin.rotation.x = -0.35;
        vFin.position.set(0, 0.34, -2.42);
        const hStab = new THREE.Mesh(createExtrudedArmorHullGeo(0.76, 0.06, 0.26, 0.015, 0.06), MAT.hazard);
        hStab.position.set(0, 0.58, -2.52);

        const tailRotor = new THREE.Group();
        tailRotor.position.set(0.12, 0.38, -2.48);
        const tr1 = new THREE.Mesh(createExtrudedArmorHullGeo(0.03, 0.68, 0.07), MAT.darkSteel);
        const tr2 = new THREE.Mesh(createExtrudedArmorHullGeo(0.03, 0.07, 0.68), MAT.darkSteel);
        tailRotor.add(tr1, tr2);

        // 4-Blade Main Rotor Mast & Hub
        const rotor = new THREE.Group();
        rotor.position.set(0, 0.64, -0.05);
        const hub = new THREE.Mesh(createSculptedLatheBarrelGeo(0.16, 0.21, 0.18, 16), MAT.darkSteel);
        rotor.add(hub);
        for (let b = 0; b < 2; b++) {
            const blade = new THREE.Mesh(createExtrudedArmorHullGeo(2.95, 0.03, 0.16), MAT.darkSteel);
            blade.rotation.y = (b * Math.PI) / 2;
            const tipA = new THREE.Mesh(createExtrudedArmorHullGeo(0.18, 0.035, 0.165), MAT.hazard);
            tipA.position.x = 1.4;
            const tipB = tipA.clone(); tipB.position.x = -1.4;
            blade.add(tipA, tipB);
            rotor.add(blade);
        }

        airframe.add(fuselage, noseCone, gunnerCanopy, pilotCanopy, flirBall, flirEye, stubWing, tailBoom, vFin, hStab, tailRotor, rotor);
        group.userData = {
            isVehicle: true, isAir: true, vType: 'heli',
            airframe, rotor, tailRotor, tailBoom, vFin, hStab,
            bellyTurret, bellyPitchPivot, bellyMinigunCluster, bellyMuzzleFlash, bellyMuzzle,
            thrusterNozzles,
            phase: Math.random() * 10, attackAnim: 0
        };
    }
    else if (vType === 'transport') {
        // STARCRAFT II MEDIVAC / HERCULES ARMORED TACTICAL DROPSHIP (Sculpted Beveled Airframe)
        const airframe = new THREE.Group();
        group.add(airframe);

        // Main Sculpted Beveled Troop-Bay Fuselage & Upper Avionics Spine
        const hull = new THREE.Mesh(createExtrudedArmorHullGeo(1.54, 0.78, 2.72, 0.09, 0.28), MAT.sandArmor);
        hull.castShadow = true;
        const upperSpine = new THREE.Mesh(createExtrudedArmorHullGeo(1.08, 0.3, 2.28, 0.06, 0.22), MAT.gunmetal);
        upperSpine.position.set(0, 0.48, -0.08);
        const bellyPod = new THREE.Mesh(createExtrudedArmorHullGeo(1.36, 0.24, 2.18, 0.05, 0.2), MAT.darkSteel);
        bellyPod.position.set(0, -0.44, -0.05);
        airframe.add(hull, upperSpine, bellyPod);

        // Armored Side Troop Doors & Terran Caduceus / Drop Stripes
        [-0.77, 0.77].forEach(sx => {
            const bayDoor = new THREE.Mesh(createExtrudedArmorHullGeo(0.1, 0.52, 1.18, 0.02, 0.08), MAT.gunmetal);
            bayDoor.position.set(sx, -0.04, -0.1);
            const hazardStripe = new THREE.Mesh(createExtrudedArmorHullGeo(0.11, 0.14, 1.46, 0.015, 0.04), MAT.hazard);
            hazardStripe.position.set(sx, -0.26, -0.05);
            const beaconLight = new THREE.Mesh(createSculptedArmorDomeGeo(0.06, 12, 12), MAT.cyanGlow);
            beaconLight.position.set(sx, 0.26, 0.55);
            airframe.add(bayDoor, hazardStripe, beaconLight);
        });

        // Forward Aerodynamic Nose Cone, Twin-Pane Armored Glass Cockpit & Landing Searchlight
        const nose = new THREE.Mesh(createExtrudedArmorHullGeo(1.24, 0.56, 0.82, 0.07, 0.22), MAT.gunmetal);
        nose.position.set(0, -0.08, 1.56);
        const radome = new THREE.Mesh(createSculptedArmorDomeGeo(0.3, 18, 14), MAT.darkSteel);
        radome.scale.set(1.3, 0.75, 1.15);
        radome.position.set(0, -0.14, 1.94);
        const cockpit = new THREE.Mesh(createExtrudedArmorHullGeo(1.08, 0.38, 0.84, 0.06, 0.2), MAT.canopyGlass);
        cockpit.rotation.x = 0.28;
        cockpit.position.set(0, 0.22, 1.34);
        const searchlight = new THREE.Mesh(createSculptedLatheBarrelGeo(0.09, 0.12, 0.12, 14), MAT.cyanGlow);
        searchlight.rotation.x = Math.PI / 2.3;
        searchlight.position.set(0, -0.32, 1.88);
        airframe.add(nose, radome, cockpit, searchlight);

        // Articulated Hydraulic Rear Troop Deployment Ramp & Aft Thruster Exhausts
        const cargoRamp = new THREE.Group();
        cargoRamp.position.set(0, -0.36, -1.34);
        const rampPlate = new THREE.Mesh(createExtrudedArmorHullGeo(1.16, 0.11, 0.8, 0.025, 0.1), MAT.hazard);
        rampPlate.position.set(0, 0.22, -0.28);
        rampPlate.rotation.x = 0.65;
        cargoRamp.add(rampPlate);
        airframe.add(cargoRamp);

        const thrusterNozzles = [];
        [-0.42, 0.42].forEach(tx => {
            const aftNozzle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.16, 0.23, 0.38, 16), MAT.darkSteel);
            aftNozzle.rotation.x = Math.PI / 2;
            aftNozzle.position.set(tx, 0.16, -1.46);
            const aftEmitter = new THREE.Object3D();
            aftEmitter.position.set(tx, 0.16, -1.68);
            thrusterNozzles.push({ node: aftEmitter, dir: new THREE.Vector3(0, -0.08, -1).normalize(), color: 'cyan', scale: 0.85 });
            const vTail = new THREE.Mesh(createExtrudedArmorHullGeo(0.09, 0.64, 0.5, 0.02, 0.1), MAT.sandArmor);
            vTail.rotation.z = tx > 0 ? -0.32 : 0.32;
            vTail.position.set(tx * 1.35, 0.56, -1.15);
            airframe.add(aftNozzle, aftEmitter, vTail);
        });

        // Heavy Shock-Absorbing Landing Skids
        [-0.58, 0.58].forEach(lx => {
            const skid = new THREE.Mesh(createSculptedLatheBarrelGeo(0.042, 0.042, 2.12, 12), MAT.darkSteel);
            skid.rotation.x = Math.PI / 2;
            skid.position.set(lx, -0.62, 0.05);
            airframe.add(skid);
        });

        // Twin Articulated VTOL Tilt-Jet Nacelles + Vector Thrusters + 4-Blade Lift Rotors
        const rotors = [];
        const nacelles = [];
        [-1.24, 1.24].forEach(xOff => {
            const wingArm = new THREE.Mesh(createExtrudedArmorHullGeo(0.84, 0.19, 0.54, 0.035, 0.12), MAT.gunmetal);
            wingArm.position.set(xOff * 0.72, 0.14, 0.12);
            airframe.add(wingArm);

            const nacellePivot = new THREE.Group();
            nacellePivot.position.set(xOff, 0.18, 0.12);

            const nacelleBody = new THREE.Mesh(createSculptedLatheBarrelGeo(0.25, 0.29, 0.84, 18), MAT.darkSteel);
            const intakeRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.24, 0.042, 12, 18), MAT.copper);
            intakeRing.rotation.x = Math.PI / 2;
            intakeRing.position.y = 0.4;

            const vtolNozzle = new THREE.Object3D();
            vtolNozzle.position.set(0, -0.45, 0);
            thrusterNozzles.push({ node: vtolNozzle, dir: new THREE.Vector3(0, -1, -0.25).normalize(), color: 'cyan', scale: 0.78 });

            const prop = new THREE.Group();
            prop.position.y = 0.46;
            const b1 = new THREE.Mesh(createExtrudedArmorHullGeo(1.68, 0.035, 0.14), MAT.darkSteel);
            const b2 = b1.clone(); b2.rotation.y = Math.PI / 2;
            prop.add(b1, b2);

            const navLight = new THREE.Mesh(createSculptedArmorDomeGeo(0.06, 12, 12), xOff < 0 ? MAT.medicCross : MAT.healGlow);
            navLight.position.set(xOff > 0 ? 0.28 : -0.28, 0, 0);

            nacellePivot.add(nacelleBody, intakeRing, vtolNozzle, prop, navLight);
            airframe.add(nacellePivot);
            rotors.push(prop);
            nacelles.push(nacellePivot);
        });

        group.userData = {
            isVehicle: true, isAir: true, vType: 'transport',
            airframe, rotors, nacelles, cargoRamp, thrusterNozzles,
            dropAnim: 0, phase: Math.random() * 10
        };
    }
    else if (vType === 'valkyrie') {
        // ====================================================================
        // TRANSFORMABLE VALKYRIE VF-9 VARIABLE-FIGHTER & ASSAULT MECH
        // ====================================================================
        const airframe = new THREE.Group();
        group.add(airframe);

        // 1. Central Armored Pelvis & Ventral VTOL Lift Thruster Block
        const pelvisGroup = new THREE.Group();
        pelvisGroup.position.set(0, -0.05, 0.0);
        airframe.add(pelvisGroup);

        const pelvisHull = new THREE.Mesh(createExtrudedArmorHullGeo(0.84, 0.32, 0.82, 0.05, 0.16), MAT.gunmetal);
        pelvisHull.castShadow = true;
        pelvisHull.receiveShadow = true;
        const frontCrotchGuard = new THREE.Mesh(createExtrudedArmorHullGeo(0.36, 0.38, 0.34, 0.04, 0.10), MAT.terranBlue);
        frontCrotchGuard.position.set(0, -0.02, 0.32);
        frontCrotchGuard.rotation.x = 0.22;
        const waistRing = new THREE.Mesh(createSculptedLatheBarrelGeo(0.32, 0.36, 0.22, 12), MAT.darkSteel);
        waistRing.position.set(0, 0.20, 0.02);
        // Ventral VTOL hover nozzle under pelvis (glows brightly during takeoff & landing!)
        const vtolBellyGlow = new THREE.Mesh(createSculptedLatheBarrelGeo(0.22, 0.22, 0.04, 16), MAT.cyanGlow);
        vtolBellyGlow.position.set(0, -0.18, 0.0);
        pelvisGroup.add(pelvisHull, frontCrotchGuard, waistRing, vtolBellyGlow);

        // 2. Articulated Upper Mech Torso / Central Fighter Fuselage Spine
        const upperTorso = new THREE.Group();
        upperTorso.position.set(0, 0.20, 0.04);
        airframe.add(upperTorso);

        const chestHull = new THREE.Mesh(createExtrudedArmorHullGeo(1.18, 0.56, 1.32, 0.08, 0.26), MAT.terranPlating);
        chestHull.position.set(0, 0.18, 0.04);
        chestHull.castShadow = true;
        chestHull.receiveShadow = true;

        const sternumPlate = new THREE.Mesh(createExtrudedArmorHullGeo(0.82, 0.48, 0.46, 0.05, 0.16), MAT.terranBlue);
        sternumPlate.position.set(0, 0.20, 0.54);

        // Glowing Arc-Reactor Chest Core (Revealed when Nose Prow folds down in Mech Mode)
        const chestReactorRim = new THREE.Mesh(createSculptedLatheBarrelGeo(0.18, 0.21, 0.12, 14), MAT.copper);
        chestReactorRim.rotation.x = Math.PI / 2;
        chestReactorRim.position.set(0, 0.22, 0.72);
        const chestReactorCore = new THREE.Mesh(createSculptedArmorDomeGeo(0.14, 12, 10), MAT.cyanGlow);
        chestReactorCore.scale.set(1, 1, 0.25);
        chestReactorCore.position.set(0, 0.22, 0.785);

        // Sleek Supersonic Fighter Nose-Cone Prow (Extends straight forward in Flight Mode; folds down over chest in Mech Mode!)
        const noseProw = new THREE.Group();
        noseProw.position.set(0, 0.16, 0.62);

        const prowFuselage = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 0.34, 1.18, 0.06, 0.28), MAT.terranPlating);
        prowFuselage.position.set(0, 0.0, 0.48);
        prowFuselage.castShadow = true;

        // Tapered Supersonic Radome Needle Cone
        const radomeCone = new THREE.Mesh(createSculptedOgiveSpireGeo(0.28, 0.92, 12), MAT.gunmetal);
        radomeCone.rotation.x = Math.PI / 2;
        radomeCone.scale.set(1.05, 0.68, 1.0);
        radomeCone.position.set(0, -0.02, 1.46);

        const pitotSpike = new THREE.Mesh(createSculptedLatheBarrelGeo(0.012, 0.028, 0.38, 8), MAT.copper);
        pitotSpike.rotation.x = Math.PI / 2;
        pitotSpike.position.set(0, -0.02, 2.02);

        // Fighter Teardrop Bubble Canopy on the Nose Prow
        const fighterCanopy = new THREE.Mesh(createExtrudedArmorHullGeo(0.44, 0.24, 0.88, 0.05, 0.26), MAT.canopyGlass);
        fighterCanopy.position.set(0, 0.20, 0.44);
        fighterCanopy.rotation.x = 0.08;

        const prowStripe = new THREE.Mesh(createExtrudedArmorHullGeo(0.48, 0.12, 0.96, 0.03, 0.18), MAT.terranBlue);
        prowStripe.position.set(0, 0.06, 0.56);

        // Forward Swept Canard Foreplanes & Chin Laser Barrels on Nose Prow
        [-1, 1].forEach(side => {
            const canard = new THREE.Mesh(createExtrudedArmorHullGeo(0.46, 0.04, 0.28, 0.01, 0.08), MAT.terranCobalt);
            canard.rotation.y = -side * 0.32;
            canard.position.set(side * 0.42, 0.02, 0.72);
            const chinLaser = new THREE.Mesh(createSculptedLatheBarrelGeo(0.025, 0.03, 0.52, 8), MAT.darkSteel);
            chinLaser.rotation.x = Math.PI / 2;
            chinLaser.position.set(side * 0.16, -0.14, 0.88);
            noseProw.add(canard, chinLaser);
        });
        noseProw.add(prowFuselage, radomeCone, pitotSpike, fighterCanopy, prowStripe);

        // 3. Retractable Armored Mech Head & Visor Turret (Fully retracted inside spine in Flight Mode; rises in Mech Mode)
        const mechHead = new THREE.Group();
        mechHead.position.set(0, 0.62, 0.10);
        const headHelm = new THREE.Mesh(createExtrudedArmorHullGeo(0.46, 0.34, 0.48, 0.05, 0.12), MAT.terranPlating);
        const headCrest = new THREE.Mesh(createExtrudedArmorHullGeo(0.16, 0.22, 0.52, 0.02, 0.06), MAT.terranBlue);
        headCrest.position.set(0, 0.16, -0.02);
        const headVisor = new THREE.Mesh(createExtrudedArmorHullGeo(0.38, 0.11, 0.14), MAT.cyanGlow);
        headVisor.position.set(0, 0.02, 0.22);
        const chinGuard = new THREE.Mesh(createExtrudedArmorHullGeo(0.24, 0.10, 0.14), MAT.hazard);
        chinGuard.position.set(0, -0.10, 0.21);
        mechHead.add(headHelm, headCrest, headVisor, chinGuard);

        [-1, 1].forEach(side => {
            const vAntenna = new THREE.Mesh(createExtrudedArmorHullGeo(0.04, 0.28, 0.06), MAT.amberGlow);
            vAntenna.position.set(side * 0.16, 0.22, 0.16);
            vAntenna.rotation.z = -side * 0.48;
            vAntenna.rotation.x = -0.22;
            mechHead.add(vAntenna);
        });

        upperTorso.add(chestHull, sternumPlate, chestReactorRim, chestReactorCore, noseProw, mechHead);

        const wingPivots = [];
        const afterburners = [];
        const mechArms = [];
        const mechLegs = [];
        const mechCannons = [];

        // 4. Dorsal Supersonic Airframe Spine, Twin Vector-Thrust Turbines & Variable-Sweep Delta Wings
        const boosterPack = new THREE.Group();
        boosterPack.position.set(0, 0.24, -0.48);
        upperTorso.add(boosterPack);

        const packCore = new THREE.Mesh(createExtrudedArmorHullGeo(0.98, 0.44, 0.94, 0.06, 0.20), MAT.darkSteel);
        boosterPack.add(packCore);

        [-1, 1].forEach(side => {
            // Twin Supersonic Turbofan Engine Nacelles & Vector Nozzles
            const nacelle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.22, 0.26, 1.24, 14), MAT.gunmetal);
            nacelle.rotation.x = Math.PI / 2;
            nacelle.position.set(side * 0.36, 0.04, -0.42);

            const intakeHood = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 0.36, 0.48, 0.04, 0.12), MAT.terranBlue);
            intakeHood.position.set(side * 0.44, 0.04, 0.28);

            const nozzleRim = new THREE.Mesh(createSculptedLatheBarrelGeo(0.24, 0.19, 0.26, 14), MAT.copper);
            nozzleRim.rotation.x = Math.PI / 2;
            nozzleRim.position.set(side * 0.36, 0.04, -1.08);

            // Dynamic Thrust Particle Emitter Node (No basic cone shape!)
            const afterburner = new THREE.Object3D();
            afterburner.position.set(side * 0.36, 0.04, -1.24);
            afterburners.push({ node: afterburner, dir: new THREE.Vector3(0, 0, -1), color: 'cyan', scale: 0.95 });

            // Canted Twin F-22/VF-1 Style Vertical Tail Stabilizers
            const vFin = new THREE.Mesh(createExtrudedArmorHullGeo(0.07, 0.68, 0.66, 0.02, 0.12), MAT.terranPlating);
            vFin.rotation.z = -side * 0.32;
            vFin.rotation.x = -0.18;
            vFin.position.set(side * 0.48, 0.44, -0.58);
            const vFinStripe = new THREE.Mesh(createExtrudedArmorHullGeo(0.08, 0.52, 0.22, 0.015, 0.05), MAT.terranBlue);
            vFinStripe.rotation.z = -side * 0.32;
            vFinStripe.rotation.x = -0.18;
            vFinStripe.position.set(side * 0.48, 0.44, -0.52);

            boosterPack.add(nacelle, intakeHood, nozzleRim, afterburner, vFin, vFinStripe);

            // Variable-Sweep Supersonic Delta Wings (Wide horizontal strike-fighter span in Flight Mode; folded jump-pack fins in Mech Mode)
            const wingPivot = new THREE.Group();
            wingPivot.position.set(side * 0.46, 0.10, -0.04);

            const mainWing = new THREE.Mesh(createExtrudedArmorHullGeo(1.58, 0.07, 0.74, 0.025, 0.18), MAT.terranPlating);
            mainWing.rotation.y = -side * 0.28;
            mainWing.position.set(side * 0.74, 0, -0.08);
            mainWing.castShadow = true;

            const wingStripe = new THREE.Mesh(createExtrudedArmorHullGeo(1.28, 0.08, 0.24, 0.015, 0.06), MAT.terranBlue);
            wingStripe.rotation.y = -side * 0.28;
            wingStripe.position.set(side * 0.76, 0.005, 0.04);

            const leadingEdgeGlow = new THREE.Mesh(createExtrudedArmorHullGeo(1.18, 0.035, 0.05), MAT.cyanGlow);
            leadingEdgeGlow.rotation.y = -side * 0.28;
            leadingEdgeGlow.position.set(side * 0.74, 0, 0.24);

            // Under-Wing Hardpoint Pylons + Dual Intercept Missiles
            [-0.48, -0.92].forEach(mOff => {
                const missileBody = new THREE.Mesh(createSculptedLatheBarrelGeo(0.04, 0.04, 0.56, 8), MAT.titanium);
                missileBody.rotation.x = Math.PI / 2;
                missileBody.position.set(side * Math.abs(mOff), -0.08, 0.06);
                const missileTip = new THREE.Mesh(createSculptedOgiveSpireGeo(0.042, 0.14, 8), MAT.medicCross);
                missileTip.rotation.x = Math.PI / 2;
                missileTip.position.set(side * Math.abs(mOff), -0.08, 0.38);
                wingPivot.add(missileBody, missileTip);
            });

            const wingtipStrobe = new THREE.Mesh(createSculptedArmorDomeGeo(0.06, 8, 8), side < 0 ? MAT.medicCross : MAT.healGlow);
            wingtipStrobe.position.set(side * 1.48, 0, -0.22);

            wingPivot.add(mainWing, wingStripe, leadingEdgeGlow, wingtipStrobe);
            boosterPack.add(wingPivot);
            wingPivots.push({ pivot: wingPivot, side });

            // 5. Twin Articulated Heavy Mech Arms (Streamlined ventral gun-sponsons in Flight Mode; Wide Mech Arms in Walker Mode)
            const shoulderPivot = new THREE.Group();
            shoulderPivot.position.set(side * 0.78, 0.34, 0.08);
            upperTorso.add(shoulderPivot);

            const pauldron = new THREE.Mesh(createExtrudedArmorHullGeo(0.44, 0.38, 0.56, 0.05, 0.12), MAT.terranBlue);
            pauldron.position.set(side * 0.08, 0.06, 0);
            pauldron.rotation.z = -side * 0.16;
            const pauldronHazard = new THREE.Mesh(createExtrudedArmorHullGeo(0.44, 0.07, 0.50), MAT.hazard);
            pauldronHazard.position.set(side * 0.10, -0.10, 0);
            shoulderPivot.add(pauldron, pauldronHazard);

            // Shoulder-Mounted HALO 6-Tube Missile Pod
            const haloPod = new THREE.Group();
            snapUnitTurretToHardpoint(haloPod, side < 0 ? 'valk_halo_left' : 'valk_halo_right');
            const podCasing = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 0.24, 0.48, 0.03, 0.08), MAT.darkSteel);
            haloPod.add(podCasing);
            for (let t = 0; t < 6; t++) {
                const col = (t % 3) - 1;
                const row = Math.floor(t / 3) - 0.5;
                const warhead = new THREE.Mesh(createSculptedOgiveSpireGeo(0.035, 0.11, 8), MAT.medicCross);
                warhead.rotation.x = Math.PI / 2;
                warhead.position.set(col * 0.085, row * 0.08, 0.26);
                haloPod.add(warhead);
            }
            shoulderPivot.add(haloPod);

            const upperArm = new THREE.Mesh(createSculptedLatheBarrelGeo(0.10, 0.11, 0.36, 10), MAT.gunmetal);
            upperArm.position.set(side * 0.06, -0.22, 0);
            shoulderPivot.add(upperArm);

            const forearmPivot = new THREE.Group();
            forearmPivot.position.set(side * 0.06, -0.38, 0.04);
            shoulderPivot.add(forearmPivot);

            const forearmArmor = new THREE.Mesh(createExtrudedArmorHullGeo(0.26, 0.24, 0.60, 0.03, 0.08), MAT.terranPlating);
            forearmArmor.position.set(0, 0, 0.20);
            const forearmShield = new THREE.Mesh(createExtrudedArmorHullGeo(0.09, 0.28, 0.52, 0.02, 0.06), MAT.terranCobalt);
            forearmShield.position.set(side * 0.15, 0.02, 0.22);
            forearmPivot.add(forearmArmor, forearmShield);

            // Forearm-Mounted Twin-Linked 35mm Rotary Gatling / Rail Autocannon
            const groundCannon = new THREE.Group();
            snapUnitTurretToHardpoint(groundCannon, 'valk_cannon');
            const canHousing = new THREE.Mesh(createExtrudedArmorHullGeo(0.20, 0.20, 0.46, 0.025, 0.06), MAT.darkSteel);
            const barrelTop = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.036, 0.76, 8), MAT.gunmetal);
            barrelTop.rotation.x = Math.PI / 2;
            barrelTop.position.set(-0.042, 0.04, 0.40);
            const barrelBot = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.036, 0.76, 8), MAT.gunmetal);
            barrelBot.rotation.x = Math.PI / 2;
            barrelBot.position.set(0.042, 0.04, 0.40);
            const underRail = new THREE.Mesh(createSculptedLatheBarrelGeo(0.028, 0.032, 0.70, 8), MAT.copper);
            underRail.rotation.x = Math.PI / 2;
            underRail.position.set(0, -0.04, 0.36);
            const muzzleGlow = new THREE.Mesh(createSculptedLatheBarrelGeo(0.05, 0.05, 0.08, 10), MAT.amberGlow);
            muzzleGlow.rotation.x = Math.PI / 2;
            muzzleGlow.position.set(0, 0.01, 0.80);
            groundCannon.add(canHousing, barrelTop, barrelBot, underRail, muzzleGlow);
            forearmPivot.add(groundCannon);
            mechCannons.push(groundCannon);

            mechArms.push({ shoulder: shoulderPivot, forearm: forearmPivot, haloPod, side });

            // 6. IK ARTICULATED TWO-BONE REVERSE-JOINTED MECH LEGS / TWIN JET TAILBOOMS
            // Upper Thigh L1 = 0.65m, Lower Greave Thruster Shin L2 = 0.72m
            const hipPivot = new THREE.Group();
            hipPivot.position.set(side * 0.44, -0.06, 0.02);

            const hipDrum = new THREE.Mesh(createSculptedLatheBarrelGeo(0.16, 0.16, 0.24, 12), MAT.copper);
            hipDrum.rotation.z = Math.PI / 2;
            hipPivot.add(hipDrum);

            const thighGroup = new THREE.Group();
            const thighArmor = new THREE.Mesh(createExtrudedArmorHullGeo(0.28, 0.65, 0.36, 0.035, 0.08), MAT.terranPlating);
            thighArmor.position.set(0, -0.325, 0);
            const thighPiston = new THREE.Mesh(createSculptedLatheBarrelGeo(0.045, 0.045, 0.55, 8), MAT.cyanGlow);
            thighPiston.position.set(0, -0.325, 0.15);
            const thighStripe = new THREE.Mesh(createExtrudedArmorHullGeo(0.30, 0.36, 0.18), MAT.terranBlue);
            thighStripe.position.set(0, -0.30, 0.12);
            thighGroup.add(thighArmor, thighPiston, thighStripe);
            hipPivot.add(thighGroup);

            const kneePivot = new THREE.Group();
            kneePivot.position.set(0, -0.65, 0);
            const kneeJoint = new THREE.Mesh(createSculptedLatheBarrelGeo(0.14, 0.14, 0.26, 12), MAT.hazard);
            kneeJoint.rotation.z = Math.PI / 2;
            const kneeGuard = new THREE.Mesh(createExtrudedArmorHullGeo(0.26, 0.28, 0.18, 0.02, 0.05), MAT.terranCobalt);
            kneeGuard.position.set(0, 0.06, 0.14);
            kneePivot.add(kneeJoint, kneeGuard);

            const shinGroup = new THREE.Group();
            const lowerShin = new THREE.Mesh(createExtrudedArmorHullGeo(0.30, 0.72, 0.38, 0.035, 0.09), MAT.gunmetal);
            lowerShin.position.set(0, -0.36, 0);
            const shinCalfPlate = new THREE.Mesh(createExtrudedArmorHullGeo(0.24, 0.52, 0.22, 0.025, 0.06), MAT.terranBlue);
            shinCalfPlate.position.set(0, -0.34, -0.14);
            const shinPiston = new THREE.Mesh(createSculptedLatheBarrelGeo(0.045, 0.045, 0.58, 8), MAT.cyanGlow);
            shinPiston.position.set(0, -0.36, 0.14);

            // Integrated Leg Thruster Nozzle at ankle/heel (Emits dynamic 3D thrust particles instead of static cone shape!)
            const legNozzle = new THREE.Mesh(createSculptedLatheBarrelGeo(0.14, 0.18, 0.20, 12), MAT.darkSteel);
            legNozzle.position.set(0, -0.68, -0.04);
            const legJetFlame = new THREE.Object3D();
            legJetFlame.position.set(0, -0.78, -0.04);
            afterburners.push({ node: legJetFlame, dir: new THREE.Vector3(0, -1, 0), color: 'amber', scale: 0.78 });

            shinGroup.add(lowerShin, shinCalfPlate, shinPiston, legNozzle, legJetFlame);
            kneePivot.add(shinGroup);

            const anklePivot = new THREE.Group();
            anklePivot.position.set(0, -0.72, 0);
            const footBase = new THREE.Mesh(createExtrudedArmorHullGeo(0.38, 0.13, 0.58, 0.025, 0.06), MAT.darkSteel);
            footBase.position.set(0, -0.04, 0.08);

            [-0.12, 0.12].forEach(tx => {
                const claw = new THREE.Mesh(createExtrudedArmorHullGeo(0.12, 0.10, 0.32, 0.015, 0.04), MAT.hazard);
                claw.position.set(tx, -0.05, 0.36);
                anklePivot.add(claw);
            });
            const heelSpur = new THREE.Mesh(createExtrudedArmorHullGeo(0.18, 0.10, 0.28, 0.015, 0.04), MAT.copper);
            heelSpur.position.set(0, -0.05, -0.24);
            anklePivot.add(footBase, heelSpur);

            kneePivot.add(anklePivot);
            thighGroup.add(kneePivot);
            pelvisGroup.add(hipPivot);

            mechLegs.push({
                hip: hipPivot,
                thigh: thighGroup,
                knee: kneePivot,
                ankle: anklePivot,
                legJetFlame,
                side,
                L1: 0.65,
                L2: 0.72
            });
        });

        group.userData = {
            isVehicle: true, isAir: true, vType: 'valkyrie',
            mechMode: false, mechTransition: 0, prevMechMode: false, transformAnimTimer: 0,
            airframe, pelvisGroup, vtolBellyGlow, upperTorso, noseProw, mechHead, boosterPack,
            wingPivots, afterburners, mechArms, mechLegs, mechCannons,
            phase: Math.random() * 10, attackAnim: 0
        };
    }
    return group;
}

// ============================================================================
// BESPOKE HERO VANGUARD WEAPON: HYPERION TWIN-CORE PLASMA RAIL-GATLING & OMNI-GLAIVE
// ============================================================================
function createHeroHyperionRailbladeCannon() {
    const gun = new THREE.Group();

    // Heavy Sculpted Golden-Copper & Cobalt Command Receiver Chassis
    const receiver = new THREE.Mesh(createExtrudedArmorHullGeo(0.16, 0.20, 0.52, 0.025, 0.06), MAT.copper);
    receiver.position.set(0, 0.02, 0.08);
    const sideCowl = new THREE.Mesh(createExtrudedArmorHullGeo(0.19, 0.11, 0.38, 0.015, 0.04), MAT.terranBlue);
    sideCowl.position.set(0, 0.03, 0.06);
    const stock = new THREE.Mesh(createExtrudedArmorHullGeo(0.11, 0.14, 0.26, 0.015, 0.04), MAT.darkSteel);
    stock.position.set(0, -0.01, -0.24);

    // Spinning Under-Slung Fusion Drum Magazine with Glowing Plasma Core Windows
    const fusionDrum = new THREE.Group();
    fusionDrum.position.set(0, -0.13, 0.10);
    const drumBody = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.085, 0.22, 12), MAT.gunmetal);
    drumBody.rotation.z = Math.PI / 2;
    const drumCoreRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.088, 0.018, 8, 16), MAT.cyanGlow);
    drumCoreRing.rotation.y = Math.PI / 2;
    fusionDrum.add(drumBody, drumCoreRing);

    // Twin Magnetic Accelerator Rail Barrels + Glowing Plasma Helical Coils
    [-0.048, 0.048].forEach(rx => {
        const railBeam = new THREE.Mesh(createExtrudedArmorHullGeo(0.036, 0.075, 0.68, 0.008, 0.02), MAT.darkSteel);
        railBeam.position.set(rx, 0.04, 0.54);
        const copperJacket = new THREE.Mesh(createExtrudedArmorHullGeo(0.042, 0.032, 0.52), MAT.copper);
        copperJacket.position.set(rx, 0.08, 0.48);
        gun.add(railBeam, copperJacket);
    });

    // Central Superheated Plasma Core Conduit between the Twin Rails
    const coreConduit = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.038, 0.64, 12), MAT.plasmaShader);
    coreConduit.rotation.x = Math.PI / 2;
    coreConduit.position.set(0, 0.04, 0.52);

    // 4 Glowing Accelerator Rings along the Twin Rail Barrel
    for (let r = 0; r < 4; r++) {
        const ring = new THREE.Mesh(createSculptedTorusCollarGeo(0.078, 0.014, 8, 16), r % 2 === 0 ? MAT.cyanGlow : MAT.amberGlow);
        ring.position.set(0, 0.04, 0.36 + r * 0.14);
        gun.add(ring);
    }

    // Muzzle Crown & Under-Barrel Superheated Photon Glaive Bayonet Blade!
    const muzzleCrown = new THREE.Mesh(createSculptedLatheBarrelGeo(0.068, 0.055, 0.12, 10), MAT.amberGlow);
    muzzleCrown.rotation.x = Math.PI / 2;
    muzzleCrown.position.set(0, 0.04, 0.90);

    const bayonetBlade = new THREE.Mesh(createCurvedScytheBladeGeo(0.48, 0.055, 0.12), MAT.amberGlow);
    bayonetBlade.rotation.x = Math.PI / 2;
    bayonetBlade.position.set(0, -0.05, 0.62);

    // Holographic Tactical Reflex Sight on Top Rail
    const holoFrame = new THREE.Mesh(createExtrudedArmorHullGeo(0.075, 0.065, 0.12), MAT.darkSteel);
    holoFrame.position.set(0, 0.15, 0.12);
    const holoLens = new THREE.Mesh(createExtrudedArmorHullGeo(0.06, 0.05, 0.01), MAT.cyanGlow);
    holoLens.position.set(0, 0.16, 0.18);

    gun.add(receiver, sideCowl, stock, fusionDrum, coreConduit, muzzleCrown, bayonetBlade, holoFrame, holoLens);
    gun.userData = { fusionDrum, muzzleCrown };
    return gun;
}

function createShoulderRocketLauncher() {
    const launcher = new THREE.Group();
    const tubeL = new THREE.Mesh(createSculptedLatheBarrelGeo(0.068, 0.068, 0.78, 12), MAT.oliveArmor);
    tubeL.rotation.x = Math.PI / 2;
    tubeL.position.set(-0.065, 0.06, 0.08);
    const tubeR = new THREE.Mesh(createSculptedLatheBarrelGeo(0.068, 0.068, 0.78, 12), MAT.oliveArmor);
    tubeR.rotation.x = Math.PI / 2;
    tubeR.position.set(0.065, 0.06, 0.08);

    const shroud = new THREE.Mesh(createExtrudedArmorHullGeo(0.28, 0.18, 0.46, 0.02, 0.06), MAT.gunmetal);
    shroud.position.set(0, 0.06, 0.10);
    const blastShield = new THREE.Mesh(createExtrudedArmorHullGeo(0.26, 0.22, 0.05, 0.015, 0.04), MAT.hazard);
    blastShield.position.set(0, 0.05, 0.36);

    const optics = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.032, 0.14, 10), MAT.amberGlow);
    optics.rotation.x = Math.PI / 2;
    optics.position.set(0.14, 0.12, 0.28);

    const warheadL = new THREE.Mesh(createSculptedOgiveSpireGeo(0.052, 0.14, 10), MAT.medicCross);
    warheadL.rotation.x = Math.PI / 2;
    warheadL.position.set(-0.065, 0.06, 0.50);
    const warheadR = warheadL.clone();
    warheadR.position.x = 0.065;

    launcher.add(tubeL, tubeR, shroud, blastShield, optics, warheadL, warheadR);
    return launcher;
}

function createReaperGaussPistol() {
    const pistol = new THREE.Group();
    const receiver = new THREE.Mesh(createExtrudedArmorHullGeo(0.065, 0.11, 0.34, 0.015, 0.04), MAT.darkSteel);
    receiver.position.set(0, 0.02, 0.12);
    const barrel = new THREE.Mesh(createSculptedLatheBarrelGeo(0.022, 0.022, 0.38, 10), MAT.copper);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, 0.18);
    const plasmaCoil = new THREE.Mesh(createExtrudedArmorHullGeo(0.072, 0.045, 0.18), MAT.amberGlow);
    plasmaCoil.position.set(0, 0.05, 0.16);
    pistol.add(receiver, barrel, plasmaCoil);
    return pistol;
}

function createAnimatedUnitModel(role) {
    if (['tank', 'siege_tank', 'heli', 'transport', 'valkyrie'].includes(role)) {
        return createVehicleModel(role);
    }

    const group = new THREE.Group();

    // --- COMPLETELY REDESIGNED ZERG SKY-LEVIATHAN / BROOD-WYVERN ('mutalisk') ---
    // Multi-Articulated Dual-Jointed Wing Rig + Rib-Exoskeleton Thorax + Horned Cephalic Crown +
    // 5-Segment Prehensile Undulating Glaive-Wurm Tail & Tri-Mandible Acid-Spitter Ovipositor
    if (role === 'mutalisk') {
        const bodyGroup = new THREE.Group();
        group.add(bodyGroup);

        // 1. Arched Biomechanical Thorax & Rib-Exoskeleton
        const thorax = new THREE.Mesh(createOrganicBioCarapaceGeo(0.42, 0.34, 0.68, 10, 0.11), MAT.chitinArmor);
        thorax.position.set(0, 0.56, 0.14);
        thorax.castShadow = true;
        bodyGroup.add(thorax);

        // Pulsing Ventral Bio-Reactor Heart & Ribcage Exoskeleton
        const bioHeart = new THREE.Mesh(createOrganicBioCarapaceGeo(0.26, 0.22, 0.36, 7, 0.06), MAT.hiveVeinGlow);
        bioHeart.position.set(0, 0.44, 0.08);
        bodyGroup.add(bioHeart);

        for (let r = 0; r < 4; r++) {
            const zOff = 0.32 - r * 0.15;
            const dorsalPlate = new THREE.Mesh(
                createOrganicBioCarapaceGeo(0.34 - r * 0.04, 0.13, 0.24, 7, 0.05),
                r % 2 === 0 ? MAT.chitinRed : MAT.chitinDark
            );
            dorsalPlate.position.set(0, 0.76 - r * 0.035, zOff);
            dorsalPlate.rotation.x = -0.18;
            const dorsalSpine = new THREE.Mesh(
                createCurvedScytheBladeGeo(0.48 - r * 0.05, 0.075, 0.14),
                MAT.copper
            );
            dorsalSpine.position.set(0, 0.82 - r * 0.035, zOff - 0.04);
            dorsalSpine.rotation.x = -Math.PI * 0.66;
            bodyGroup.add(dorsalPlate, dorsalSpine);

            // External Rib-Claws wrapping the ventral bio-heart
            [-1, 1].forEach(side => {
                const rib = new THREE.Mesh(
                    createCurvedScytheBladeGeo(0.42 - r * 0.03, 0.055, 0.12),
                    MAT.chitinArmor
                );
                rib.position.set(side * (0.34 - r * 0.02), 0.48, zOff);
                rib.rotation.z = side * 0.85;
                rib.rotation.y = side * 0.25;
                bodyGroup.add(rib);
            });
        }

        // 2. Predatory Cephalic Crest, Swept Ram-Scythe Horns, 6 Compound Eyes & Splitting Fang-Maw
        const headCrest = new THREE.Mesh(createOrganicBioCarapaceGeo(0.32, 0.26, 0.44, 8, 0.08), MAT.chitinRed);
        headCrest.position.set(0, 0.62, 0.50);
        headCrest.rotation.x = 0.22;
        bodyGroup.add(headCrest);

        [-1, 1].forEach(side => {
            const majorHorn = new THREE.Mesh(createCurvedScytheBladeGeo(0.84, 0.10, 0.22), MAT.chitinArmor);
            majorHorn.position.set(side * 0.22, 0.72, 0.42);
            majorHorn.rotation.x = -0.46;
            majorHorn.rotation.z = -side * 0.48;
            majorHorn.rotation.y = -side * 0.24;
            const cheekCrest = new THREE.Mesh(createCurvedScytheBladeGeo(0.52, 0.075, 0.16), MAT.chitinRed);
            cheekCrest.position.set(side * 0.28, 0.54, 0.46);
            cheekCrest.rotation.z = -side * 0.78;
            cheekCrest.rotation.y = side * 0.32;
            bodyGroup.add(majorHorn, cheekCrest);
        });

        const mandL = new THREE.Group();
        mandL.position.set(-0.16, 0.46, 0.56);
        const mandBladeL = new THREE.Mesh(createCurvedScytheBladeGeo(0.54, 0.08, 0.16), MAT.copper);
        mandBladeL.rotation.x = Math.PI * 0.42;
        mandBladeL.rotation.z = -0.25;
        mandL.add(mandBladeL);

        const mandR = new THREE.Group();
        mandR.position.set(0.16, 0.46, 0.56);
        const mandBladeR = new THREE.Mesh(createCurvedScytheBladeGeo(0.54, 0.08, 0.16), MAT.copper);
        mandBladeR.rotation.x = Math.PI * 0.42;
        mandBladeR.rotation.z = 0.25;
        mandR.add(mandBladeR);

        const throatSac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.16, 0.14, 0.24, 6, 0.04), MAT.acidGlow);
        throatSac.position.set(0, 0.42, 0.52);
        bodyGroup.add(mandL, mandR, throatSac);

        [-0.20, -0.13, -0.06, 0.06, 0.13, 0.20].forEach((ex, idx) => {
            const eye = new THREE.Mesh(
                createSculptedArmorDomeGeo(idx === 2 || idx === 3 ? 0.065 : 0.048, 10, 10),
                idx % 2 === 0 ? MAT.acidGlow : MAT.amberGlow
            );
            eye.position.set(ex, 0.60 + Math.abs(ex) * 0.18, 0.64 - Math.abs(ex) * 0.35);
            bodyGroup.add(eye);
        });

        // 3. Bioluminescent Ventral Gas-Bladders & Multi-Segment Prehensile Glaive-Wurm Tail
        const abdomen = new THREE.Mesh(createOrganicBioCarapaceGeo(0.34, 0.32, 0.48, 8, 0.08), MAT.zergFlesh);
        abdomen.position.set(0, 0.44, -0.28);
        abdomen.castShadow = true;
        bodyGroup.add(abdomen);

        [-0.26, 0.26].forEach(sx => {
            const gasSac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.16, 0.18, 0.28, 6, 0.05), MAT.acidGlow);
            gasSac.position.set(sx, 0.42, -0.22);
            bodyGroup.add(gasSac);
        });

        // 5-Segment Articulated Prehensile Tail Chain (Coils under abdomen & whips forward on attack!)
        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.42, -0.44);
        bodyGroup.add(tailGroup);

        const tailSegments = [];
        let tailParent = tailGroup;
        const tailSegDefs = [
            { len: 0.28, rad: 0.22, basePitch: -0.38 },
            { len: 0.28, rad: 0.18, basePitch: -0.46 },
            { len: 0.26, rad: 0.15, basePitch: 0.28 },
            { len: 0.24, rad: 0.13, basePitch: 0.62 },
            { len: 0.22, rad: 0.11, basePitch: 0.54 }
        ];
        tailSegDefs.forEach((def, sIdx) => {
            const segPivot = new THREE.Group();
            segPivot.position.set(0, sIdx === 0 ? 0 : -0.04, sIdx === 0 ? 0 : -tailSegDefs[sIdx - 1].len);
            segPivot.rotation.x = def.basePitch;

            const segFlesh = new THREE.Mesh(
                createOrganicBioCarapaceGeo(def.rad, def.rad * 0.92, def.len * 0.85, 7, 0.04),
                sIdx % 2 === 0 ? MAT.zergFlesh : MAT.chitinDark
            );
            segFlesh.position.set(0, 0, -def.len * 0.5);
            segFlesh.castShadow = true;
            segPivot.add(segFlesh);

            const segPlate = new THREE.Mesh(
                createOrganicBioCarapaceGeo(def.rad * 1.15, def.rad * 0.55, def.len * 0.72, 6, 0.03),
                MAT.chitinRed
            );
            segPlate.position.set(0, def.rad * 0.55, -def.len * 0.48);
            segPivot.add(segPlate);

            [-1, 1].forEach(side => {
                const fin = new THREE.Mesh(
                    createCurvedScytheBladeGeo(0.28 - sIdx * 0.03, 0.045, 0.10),
                    sIdx >= 3 ? MAT.acidGlow : MAT.chitinArmor
                );
                fin.position.set(side * def.rad * 0.9, 0, -def.len * 0.5);
                fin.rotation.z = -side * 0.65;
                fin.rotation.y = -side * 0.45;
                segPivot.add(fin);
            });

            if (sIdx === tailSegDefs.length - 1) {
                // Terminal Glaive-Wurm Acid-Spitter Ovipositor & Twin Pincer Scythes
                const spitterBulb = new THREE.Mesh(
                    createOrganicBioCarapaceGeo(0.16, 0.16, 0.24, 6, 0.04),
                    MAT.acidGlow
                );
                spitterBulb.position.set(0, -0.02, -def.len - 0.06);
                segPivot.add(spitterBulb);

                [-1, 1].forEach(side => {
                    const pincer = new THREE.Mesh(
                        createCurvedScytheBladeGeo(0.52, 0.08, 0.16),
                        MAT.chitinArmor
                    );
                    pincer.position.set(side * 0.10, -0.04, -def.len - 0.12);
                    pincer.rotation.x = Math.PI * 0.88;
                    pincer.rotation.z = side * 0.36;
                    segPivot.add(pincer);
                });
            }

            tailParent.add(segPivot);
            tailSegments.push({ pivot: segPivot, basePitch: def.basePitch, idx: sIdx });
            tailParent = segPivot;
        });

        // 4. Dual-Jointed Articulated Dragon-Bat Wings (Inner Humerus Pivot + Outer Wrist Phalanges Pivot!)
        function buildMutaliskWing(side) {
            // Inner Shoulder -> Humerus Wing Group
            const wingPivot = new THREE.Group();
            wingPivot.position.set(side * 0.28, 0.68, 0.14);

            const shoulderMuscle = new THREE.Mesh(
                createOrganicBioCarapaceGeo(0.22, 0.16, 0.24, 6, 0.04),
                MAT.chitinRed
            );
            shoulderMuscle.position.set(side * 0.18, 0.02, 0.04);
            wingPivot.add(shoulderMuscle);

            const humerusBone = new THREE.Mesh(
                createCurvedScytheBladeGeo(0.86, 0.095, 0.20),
                MAT.chitinArmor
            );
            humerusBone.position.set(side * 0.42, 0.06, 0.14);
            humerusBone.rotation.y = side * (Math.PI * 0.38);
            humerusBone.rotation.z = -side * 0.18;
            wingPivot.add(humerusBone);

            const innerMembrane = new THREE.Mesh(createBatWingMembraneGeo(0.92, 0.86), MAT.chitinRed);
            if (side < 0) innerMembrane.scale.x = -1;
            innerMembrane.position.set(side * 0.04, 0, -0.04);
            innerMembrane.castShadow = true;
            wingPivot.add(innerMembrane);

            // Outer Elbow/Wrist Phalanges Pivot (Articulates independently during upstroke/downstroke!)
            const outerWing = new THREE.Group();
            outerWing.position.set(side * 0.78, 0.08, 0.22);
            wingPivot.add(outerWing);

            // Serrated Alula Thumb-Talon at the Wing Wrist
            const thumbTalon = new THREE.Mesh(createCurvedScytheBladeGeo(0.48, 0.07, 0.15), MAT.copper);
            thumbTalon.position.set(side * 0.06, 0.05, 0.18);
            thumbTalon.rotation.x = Math.PI * 0.36;
            thumbTalon.rotation.y = side * 0.32;
            const wristNode = new THREE.Mesh(createOrganicBioCarapaceGeo(0.12, 0.10, 0.14, 5, 0.03), MAT.acidGlow);
            outerWing.add(thumbTalon, wristNode);

            // Primary Outer Wing Membrane + Glowing Bioluminescent Vein Membrane Layer
            const outerMembrane = new THREE.Mesh(createBatWingMembraneGeo(1.42, 1.08), MAT.chitinRed);
            if (side < 0) outerMembrane.scale.x = -1;
            outerMembrane.position.set(0, 0, -0.18);
            outerMembrane.castShadow = true;
            outerWing.add(outerMembrane);

            // 5 Splayed Articulated Bone Wing-Fingers with Glowing Vein Ribs
            const fingerAngles = [0.38, 0.56, 0.74, 0.92, 1.10];
            const fingerLengths = [1.46, 1.32, 1.14, 0.92, 0.72];
            fingerAngles.forEach((angFrac, fIdx) => {
                const fingerBone = new THREE.Mesh(
                    createCurvedScytheBladeGeo(fingerLengths[fIdx], 0.068 - fIdx * 0.008, 0.16),
                    fIdx === 0 ? MAT.chitinArmor : MAT.copper
                );
                fingerBone.rotation.y = side * (Math.PI * angFrac);
                fingerBone.rotation.z = -side * (0.06 * fIdx);
                outerWing.add(fingerBone);

                if (fIdx < 4) {
                    const veinStrut = new THREE.Mesh(
                        createCurvedScytheBladeGeo(fingerLengths[fIdx] * 0.72, 0.032, 0.08),
                        fIdx % 2 === 0 ? MAT.acidGlow : MAT.hiveVeinGlow
                    );
                    veinStrut.rotation.y = side * (Math.PI * (angFrac + 0.08));
                    veinStrut.position.y = -0.015;
                    outerWing.add(veinStrut);
                }
            });

            return { wingPivot, outerWing };
        }

        const builtL = buildMutaliskWing(-1);
        const builtR = buildMutaliskWing(1);
        const wingL = builtL.wingPivot;
        const wingR = builtR.wingPivot;
        const outerWingL = builtL.outerWing;
        const outerWingR = builtR.outerWing;
        bodyGroup.add(wingL, wingR);

        // 5. Ventral Raptorial Mantis-Scythe Forelimbs
        const scytheL = new THREE.Group();
        scytheL.position.set(-0.24, 0.36, 0.28);
        const foreBladeL = new THREE.Mesh(createCurvedScytheBladeGeo(0.58, 0.075, 0.18), MAT.chitinRed);
        foreBladeL.rotation.x = Math.PI * 0.32;
        scytheL.add(foreBladeL);

        const scytheR = new THREE.Group();
        scytheR.position.set(0.24, 0.36, 0.28);
        const foreBladeR = new THREE.Mesh(createCurvedScytheBladeGeo(0.58, 0.075, 0.18), MAT.chitinRed);
        foreBladeR.rotation.x = Math.PI * 0.32;
        scytheR.add(foreBladeR);
        bodyGroup.add(scytheL, scytheR);

        group.userData = {
            isBug: true, isAir: true, variant: 'mutalisk',
            bodyGroup, abdomen, bioHeart,
            wingL, wingR, outerWingL, outerWingR,
            tailGroup, tailSegments,
            mandL, mandR, scytheL, scytheR,
            legs: [],
            phase: Math.random() * 10, attackAnim: 0
        };
        return group;
    }

    if (['skitterer', 'spitter', 'burster', 'crusher', 'behemoth', 'gorgon'].includes(role)) {
        const scale = role === 'behemoth' ? 1.92 : (role === 'gorgon' ? 1.68 : (role === 'crusher' ? 1.58 : (role === 'spitter' ? 1.18 : (role === 'burster' ? 1.06 : 0.96))));
        group.scale.setScalar(scale);

        const bodyGroup = new THREE.Group();
        group.add(bodyGroup);

        const thoraxMat = role === 'spitter' ? MAT.chitinGreen : (role === 'gorgon' ? MAT.chitinRed : (role === 'crusher' || role === 'behemoth' ? MAT.chitinArmor : MAT.chitinDark));
        const abdomenMat = role === 'behemoth' ? MAT.hiveVeinGlow : (role === 'gorgon' || role === 'spitter' ? MAT.acidGlow : (role === 'burster' ? MAT.volatileGlow : MAT.chitinRed));
        const crestMat = role === 'gorgon' || role === 'spitter' ? MAT.acidGlow : (role === 'burster' ? MAT.volatileGlow : MAT.chitinRed);

        // 100% Organic Ribbed Chitin Thorax & Overlapping Curved Carapace Plates (Zero Boxy Hulls!)
        const thorax = new THREE.Mesh(createOrganicBioCarapaceGeo(role === 'gorgon' ? 0.42 : 0.34, 0.27, 0.48, 9, 0.10), thoraxMat);
        thorax.position.y = 0.42;
        thorax.castShadow = true;
        bodyGroup.add(thorax);

        for (let p = 0; p < 4; p++) {
            const shellSegment = new THREE.Mesh(
                createOrganicBioCarapaceGeo(0.32 - p * 0.03, 0.12, 0.18, 6, 0.04),
                role === 'crusher' || role === 'behemoth' ? MAT.chitinRed : (role === 'gorgon' ? MAT.chitinArmor : thoraxMat)
            );
            shellSegment.rotation.x = 0.24;
            shellSegment.position.set(0, 0.54 - p * 0.015, 0.22 - p * 0.16);
            bodyGroup.add(shellSegment);
        }

        // 5 Curved Dorsal Razor Spines along the Back
        for (let s = 0; s < 5; s++) {
            const dorsalSpine = new THREE.Mesh(createCurvedScytheBladeGeo(0.50 - s * 0.05, 0.09 - s * 0.01, 0.18), MAT.chitinArmor);
            dorsalSpine.rotation.x = -Math.PI * 0.68;
            dorsalSpine.position.set(0, 0.58 - s * 0.02, 0.24 - s * 0.16);
            bodyGroup.add(dorsalSpine);
        }

        // Sculpted Segmented Bio-Abdomen + Lateral Chitin Gill Ribs
        const abRx = role === 'burster' ? 0.62 : (role === 'gorgon' ? 0.52 : (role === 'crusher' || role === 'behemoth' ? 0.46 : 0.39));
        const abRy = role === 'burster' ? 0.56 : (role === 'gorgon' ? 0.38 : (role === 'crusher' || role === 'behemoth' ? 0.40 : 0.34));
        const abdomen = new THREE.Mesh(createOrganicBioCarapaceGeo(abRx, abRy, 0.58, 10, 0.11), abdomenMat);
        abdomen.position.set(0, 0.52, -0.52);
        abdomen.castShadow = true;
        bodyGroup.add(abdomen);

        [-1, 1].forEach(side => {
            for (let g = 0; g < 3; g++) {
                const gillGuard = new THREE.Mesh(createCurvedScytheBladeGeo(0.36, 0.055, 0.12), crestMat);
                gillGuard.rotation.z = side * 0.85;
                gillGuard.rotation.y = -side * 0.45;
                gillGuard.position.set(side * (abRx * 0.75), 0.50, -0.34 - g * 0.15);
                bodyGroup.add(gillGuard);
            }
        });

        // Twin Curved Tail Stingers & Whip Barbs
        [-0.08, 0.08].forEach(tx => {
            const tailStinger = new THREE.Mesh(createCurvedScytheBladeGeo(0.58, 0.08, 0.22), crestMat);
            tailStinger.rotation.x = Math.PI * 0.88;
            tailStinger.rotation.z = tx > 0 ? 0.22 : -0.22;
            tailStinger.position.set(tx, 0.55, -0.88);
            bodyGroup.add(tailStinger);
        });

        // Role-Specific Organic Zerg Anatomy
        if (role === 'skitterer') {
            // Zergling-style Adrenal Metabolic Dorsal Winglets & Forward Raptor Crest
            [-0.22, 0.22].forEach(wx => {
                const winglet = new THREE.Mesh(createCurvedScytheBladeGeo(0.72, 0.085, 0.22), MAT.chitinRed);
                winglet.rotation.z = wx > 0 ? -0.52 : 0.52;
                winglet.rotation.x = -Math.PI * 0.58;
                winglet.position.set(wx, 0.64, -0.02);
                const subFin = new THREE.Mesh(createCurvedScytheBladeGeo(0.48, 0.06, 0.15), MAT.copper);
                subFin.rotation.z = wx > 0 ? -0.78 : 0.78;
                subFin.rotation.x = -Math.PI * 0.64;
                subFin.position.set(wx * 1.15, 0.56, -0.14);
                bodyGroup.add(winglet, subFin);
            });
        }
        if (role === 'spitter') {
            // Hydralisk-style Flared Cobra Hood Crest + Pressurized Venom Cheek Sacs & Shoulder Needle Ducts
            [-0.24, 0.24].forEach(xSac => {
                const venomSac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.17, 0.16, 0.25, 6, 0.05), MAT.acidGlow);
                venomSac.position.set(xSac, 0.42, 0.28);
                const crestFin = new THREE.Mesh(createCurvedScytheBladeGeo(0.74, 0.11, 0.24), MAT.chitinGreen);
                crestFin.rotation.z = xSac > 0 ? -0.62 : 0.62;
                crestFin.rotation.x = -Math.PI * 0.62;
                crestFin.position.set(xSac * 1.12, 0.62, 0.22);
                const upperFrill = new THREE.Mesh(createCurvedScytheBladeGeo(0.58, 0.085, 0.18), MAT.acidGlow);
                upperFrill.rotation.z = xSac > 0 ? -0.28 : 0.28;
                upperFrill.rotation.x = -Math.PI * 0.55;
                upperFrill.position.set(xSac * 0.68, 0.72, 0.16);
                bodyGroup.add(venomSac, crestFin, upperFrill);
            });
        }
        if (role === 'burster') {
            // Baneling-style Engorged Bioluminescent Acid Blisters & Strained Chitin Containment Ribs
            for (let b = 0; b < 8; b++) {
                const ba = (b / 8) * Math.PI * 2;
                const blister = new THREE.Mesh(createOrganicBioCarapaceGeo(0.22, 0.20, 0.22, 5, 0.05), b % 2 === 0 ? MAT.amberGlow : MAT.acidGlow);
                blister.position.set(Math.cos(ba) * 0.38, 0.68 + (b % 2) * 0.06, -0.50 + Math.sin(ba) * 0.38);
                const ribCage = new THREE.Mesh(createCurvedScytheBladeGeo(0.44, 0.06, 0.16), MAT.chitinDark);
                ribCage.rotation.y = ba;
                ribCage.position.set(Math.cos(ba) * 0.46, 0.56, -0.50 + Math.sin(ba) * 0.46);
                bodyGroup.add(blister, ribCage);
            }
        }
        if (role === 'crusher' || role === 'behemoth') {
            // Ultralisk / Ravager Four-Blade Kaiser Scythe Tusks & Armored Carapace Crown
            const headShield = new THREE.Mesh(createOrganicBioCarapaceGeo(0.46, 0.24, 0.38, 7, 0.08), MAT.chitinRed);
            headShield.rotation.x = Math.PI / 5;
            headShield.position.set(0, 0.68, 0.36);
            bodyGroup.add(headShield);

            [-0.28, 0.28].forEach(xHorn => {
                const kaiserTusk = new THREE.Mesh(createCurvedScytheBladeGeo(1.18, 0.145, 0.36), MAT.copper);
                kaiserTusk.rotation.z = xHorn > 0 ? -0.45 : 0.45;
                kaiserTusk.position.set(xHorn, 0.48, 0.36);
                const upperHorn = new THREE.Mesh(createCurvedScytheBladeGeo(0.84, 0.105, 0.25), MAT.chitinArmor);
                upperHorn.rotation.z = xHorn > 0 ? -0.25 : 0.25;
                upperHorn.rotation.x = 0.25;
                upperHorn.position.set(xHorn * 1.18, 0.66, 0.24);
                bodyGroup.add(kaiserTusk, upperHorn);
            });
        }

        // NEW UNIQUE ZERG BIO-FACTORY UNIT: 'gorgon' (Zerg Bile-Scorpion Gorgon Leviathan)
        // Features an overarching multi-segmented Scorpion Tail-Catapult launching Corrosive Bile-Web Meteors + Twin Crusher Pincer Claws!
        let tailCatapult = null;
        let bileSac = null;
        if (role === 'gorgon') {
            // Armored Scorpion Carapace Crown & Lateral Bioluminescent Bile-Boil Sacs
            const scorpionCrown = new THREE.Mesh(createOrganicBioCarapaceGeo(0.50, 0.22, 0.42, 7, 0.08), MAT.chitinArmor);
            scorpionCrown.rotation.x = 0.22;
            scorpionCrown.position.set(0, 0.64, 0.32);
            bodyGroup.add(scorpionCrown);

            [-0.36, 0.36].forEach(xSac => {
                const boilA = new THREE.Mesh(createOrganicBioCarapaceGeo(0.18, 0.16, 0.22, 5, 0.04), MAT.acidGlow);
                boilA.position.set(xSac, 0.56, -0.26);
                const boilB = new THREE.Mesh(createOrganicBioCarapaceGeo(0.15, 0.14, 0.18, 5, 0.04), MAT.hiveVeinGlow);
                boilB.position.set(xSac * 1.08, 0.52, -0.56);
                bodyGroup.add(boilA, boilB);
            });

            // Overarching Articulated Scorpion Tail-Catapult Pivot
            tailCatapult = new THREE.Group();
            tailCatapult.position.set(0, 0.58, -0.78);
            const tailCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0.55, -0.26),
                new THREE.Vector3(0, 1.05, 0.18),
                new THREE.Vector3(0, 1.16, 0.82)
            ]);
            const tailTube = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 12, 0.12, 8, false), MAT.chitinArmor);
            tailTube.castShadow = true;
            tailCatapult.add(tailTube);

            // Chitin Vertebral Armor Plates & Razor Spines along the Scorpion Tail Arch
            for (let t = 1; t <= 4; t++) {
                const pt = tailCurve.getPoint(t / 5);
                const segPlate = new THREE.Mesh(createOrganicBioCarapaceGeo(0.18 - t * 0.015, 0.12, 0.20, 5, 0.04), MAT.chitinRed);
                segPlate.position.copy(pt);
                const barb = new THREE.Mesh(createCurvedScytheBladeGeo(0.38, 0.06, 0.14), MAT.copper);
                barb.position.set(pt.x, pt.y + 0.08, pt.z - 0.06);
                barb.rotation.x = -Math.PI * 0.55;
                tailCatapult.add(segPlate, barb);
            }

            // Glowing Bile-Plasma Mortar Organ & Twin Stinger Mandibles at the Scorpion Tail Tip
            bileSac = new THREE.Mesh(createOrganicBioCarapaceGeo(0.24, 0.22, 0.30, 6, 0.05), MAT.acidGlow);
            bileSac.position.set(0, 1.16, 0.88);
            const nozzleCollar = new THREE.Mesh(createSculptedTorusCollarGeo(0.15, 0.045, 7, 12), MAT.hiveVeinGlow);
            nozzleCollar.position.set(0, 1.16, 1.12);
            [-0.14, 0.14].forEach(sx => {
                const stinger = new THREE.Mesh(createCurvedScytheBladeGeo(0.52, 0.075, 0.18), MAT.copper);
                stinger.position.set(sx, 1.18, 0.96);
                stinger.rotation.y = sx > 0 ? -0.28 : 0.28;
                tailCatapult.add(stinger);
            });
            tailCatapult.add(bileSac, nozzleCollar);
            bodyGroup.add(tailCatapult);
        }

        const dorsalCannons = [];
        if (role === 'behemoth') {
            [-0.26, 0.26].forEach(xCan => {
                const canPivot = new THREE.Group();
                canPivot.position.set(xCan, 0.90, -0.12);
                canPivot.userData = { baseX: xCan, baseY: 0.90, baseZ: -0.12, baseRotX: Math.PI / 3.4 };
                canPivot.rotation.x = Math.PI / 3.4;

                const bioCannon = new THREE.Mesh(createOrganicBioCarapaceGeo(0.20, 0.52, 0.22, 7, 0.06), MAT.zergTeamPurple);
                const cannonCowl = new THREE.Mesh(createCurvedScytheBladeGeo(0.72, 0.10, 0.18), MAT.chitinArmor);
                cannonCowl.position.set(0, 0.12, -0.12);
                const cannonTip = new THREE.Mesh(createOrganicBioCarapaceGeo(0.15, 0.15, 0.15, 6, 0.04), MAT.hiveVeinGlow);
                cannonTip.position.y = 0.50;
                canPivot.add(bioCannon, cannonCowl, cannonTip);
                bodyGroup.add(canPivot);
                dorsalCannons.push(canPivot);
            });
        }

        // Organic Raptorial Fore-Scythes (or Heavy Twin Crusher Pincer-Claws for Gorgon)
        const scytheL = new THREE.Group();
        scytheL.position.set(role === 'gorgon' ? -0.36 : -0.28, 0.48, 0.28);
        const upperArmL = new THREE.Mesh(createOrganicBioCarapaceGeo(role === 'gorgon' ? 0.12 : 0.08, 0.16, 0.16, 5, 0.03), thoraxMat);
        upperArmL.rotation.x = 0.55;
        const armBladeL = new THREE.Mesh(createCurvedScytheBladeGeo(role === 'gorgon' ? 0.96 : 0.82, role === 'gorgon' ? 0.12 : 0.095, 0.26), MAT.chitinRed);
        armBladeL.position.set(-0.04, -0.06, 0.08);
        scytheL.add(upperArmL, armBladeL);

        const scytheR = new THREE.Group();
        scytheR.position.set(role === 'gorgon' ? 0.36 : 0.28, 0.48, 0.28);
        const upperArmR = upperArmL.clone();
        const armBladeR = new THREE.Mesh(createCurvedScytheBladeGeo(role === 'gorgon' ? 0.96 : 0.82, role === 'gorgon' ? 0.12 : 0.095, 0.26), MAT.chitinRed);
        armBladeR.position.set(0.04, -0.06, 0.08);
        scytheR.add(upperArmR, armBladeR);
        if (role === 'gorgon') {
            // Inner opposing pincer thumb-blades so Gorgon has true crushing scorpion claws!
            const thumbL = new THREE.Mesh(createCurvedScytheBladeGeo(0.64, 0.085, -0.18), MAT.copper);
            thumbL.position.set(0.08, -0.05, 0.16);
            thumbL.rotation.y = -0.32;
            scytheL.add(thumbL);
            const thumbR = new THREE.Mesh(createCurvedScytheBladeGeo(0.64, 0.085, -0.18), MAT.copper);
            thumbR.position.set(-0.08, -0.05, 0.16);
            thumbR.rotation.y = 0.32;
            scytheR.add(thumbR);
        }
        bodyGroup.add(scytheL, scytheR);

        const mandL = new THREE.Mesh(createCurvedScytheBladeGeo(0.46, 0.072, 0.16), MAT.copper);
        mandL.rotation.z = -Math.PI * 0.42;
        mandL.position.set(-0.16, 0.36, 0.38);
        const mandR = new THREE.Mesh(createCurvedScytheBladeGeo(0.46, 0.072, 0.16), MAT.copper);
        mandR.rotation.z = Math.PI * 0.42;
        mandR.position.set(0.16, 0.36, 0.38);
        bodyGroup.add(mandL, mandR);

        // Organic Chitin Brow Crest & 4 Compound Glowing Bio-Eyes
        const browRidge = new THREE.Mesh(createOrganicBioCarapaceGeo(0.22, 0.07, 0.14, 5, 0.03), MAT.chitinArmor);
        browRidge.position.set(0, 0.56, 0.38);
        bodyGroup.add(browRidge);
        const eyeMat = (role === 'spitter' || role === 'gorgon') ? MAT.acidGlow : MAT.amberGlow;
        [-0.14, -0.07, 0.07, 0.14].forEach((ex, eIdx) => {
            const eye = new THREE.Mesh(createSculptedArmorDomeGeo(eIdx === 0 || eIdx === 3 ? 0.052 : 0.072, 8, 8), eyeMat);
            eye.position.set(ex, 0.49 + (eIdx === 0 || eIdx === 3 ? 0.05 : 0), 0.42);
            bodyGroup.add(eye);
        });

        // Articulated 2-Bone IK Organic Chitin Legs (8 arachnid legs for Gorgon, 6 for standard Zerg)
        const legs = [];
        const legZOffsets = role === 'gorgon' ? [-0.36, -0.12, 0.12, 0.36] : [-0.26, 0, 0.26];
        [-1, 1].forEach(side => {
            legZOffsets.forEach((zOff, idx) => {
                const hipPivot = new THREE.Group();
                hipPivot.position.set(side * (role === 'gorgon' ? 0.30 : 0.25), 0.36, zOff);

                const femurPivot = new THREE.Group();
                hipPivot.add(femurPivot);

                const L1 = 0.34;
                const L2 = 0.48;

                const coxaSocket = new THREE.Mesh(createOrganicBioCarapaceGeo(0.072, 0.072, 0.085, 4, 0.02), MAT.chitinDark);
                femurPivot.add(coxaSocket);

                const femur = new THREE.Mesh(createOrganicBioCarapaceGeo(0.075, L1 * 0.58, 0.085, 5, 0.025), thoraxMat);
                femur.position.set(side * (L1 * 0.46), L1 * 0.28, 0);
                femur.rotation.z = -side * 1.02;
                femurPivot.add(femur);

                const kneePivot = new THREE.Group();
                kneePivot.position.set(side * 0.29, 0.17, 0);
                femurPivot.add(kneePivot);

                const kneeJoint = new THREE.Mesh(createOrganicBioCarapaceGeo(0.078, 0.078, 0.09, 4, 0.02), MAT.chitinRed);
                kneePivot.add(kneeJoint);

                const kneeSpur = new THREE.Mesh(createCurvedScytheBladeGeo(0.28, 0.042, 0.09), MAT.copper);
                kneeSpur.position.set(side * 0.03, 0.06, 0);
                kneeSpur.rotation.z = -side * 0.55;
                kneePivot.add(kneeSpur);

                const tibia = new THREE.Mesh(createCurvedScytheBladeGeo(L2 + 0.10, 0.068, 0.16), MAT.chitinDark);
                tibia.position.set(0, 0, 0);
                tibia.rotation.x = Math.PI * 0.52;
                tibia.rotation.y = side * 0.22;
                kneePivot.add(tibia);

                group.add(hipPivot);
                const tripodGroup = ((side > 0 ? 0 : 1) + idx) % 2;
                const restYaw = (idx - 1) * -0.34 * side;
                legs.push({
                    pivot: hipPivot,
                    femurPivot,
                    kneePivot,
                    side,
                    idx,
                    zOff,
                    L1,
                    L2,
                    tripodGroup,
                    restYaw,
                    footWorldPos: null,
                    stepStartPos: null,
                    stepTargetPos: null,
                    stepProgress: 1.0
                });
            });
        });

        group.userData = {
            isBug: true, isAir: false, variant: role, bodyGroup, abdomen, mandL, mandR, scytheL, scytheR, legs, dorsalCannons,
            tailCatapult, bileSac,
            phase: Math.random() * 10, attackAnim: 0
        };
        return group;
    }

    // --- 3RD FACTION: THE SOLARIS CHRONO-SYNOD UNITS (ZEALOT / STALKER / ARCHON) — ENHANCED HIGH-POLY MESHES ---
    if (role === 'zealot' || role === 'stalker' || role === 'archon') {
        if (role === 'stalker') {
            // SOLARIS PRISM STALKER: Sculpted Quad-Legged Golden-Obsidian Void Walker with Dorsal Khaydarin Spine, Levitating Oracle Head & Twin Particle Disruptors
            const bodyGroup = new THREE.Group();
            bodyGroup.position.y = 0.58;
            group.add(bodyGroup);

            const hull = new THREE.Mesh(createExtrudedArmorHullGeo(0.74, 0.36, 1.06, 0.05, 0.18), MAT.solarisObsidian);
            hull.castShadow = true;
            const goldCarapace = new THREE.Mesh(createExtrudedArmorHullGeo(0.80, 0.18, 0.90, 0.04, 0.16), MAT.solarisGold);
            goldCarapace.position.y = 0.18;
            const ivoryWingL = new THREE.Mesh(createCurvedScytheBladeGeo(0.76, 0.09, 0.18), MAT.solarisIvory);
            ivoryWingL.position.set(-0.38, 0.22, -0.08);
            ivoryWingL.rotation.set(-0.35, -0.25, 0.55);
            const ivoryWingR = new THREE.Mesh(createCurvedScytheBladeGeo(0.76, 0.09, 0.18), MAT.solarisIvory);
            ivoryWingR.position.set(0.38, 0.22, -0.08);
            ivoryWingR.rotation.set(-0.35, 0.25, -0.55);

            // Dorsal Khaydarin Void Capacitor Core & Floating Containment Ring
            const coreCrystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.26, 1), MAT.solarisCrystal);
            coreCrystal.scale.set(0.85, 1.45, 1.25);
            coreCrystal.position.set(0, 0.34, 0.02);
            const coreHalo = new THREE.Mesh(createSculptedTorusCollarGeo(0.32, 0.032, 8, 22), MAT.solarisGold);
            coreHalo.rotation.x = Math.PI / 2;
            coreHalo.position.set(0, 0.32, 0.02);
            bodyGroup.add(hull, goldCarapace, ivoryWingL, ivoryWingR, coreCrystal, coreHalo);

            // Levitating Prismatic Sensor Crown & Twin Phase-Disruptor Rail Cannons
            const stalkerHead = new THREE.Group();
            stalkerHead.position.set(0, 0.24, 0.50);
            const headProw = new THREE.Mesh(createSculptedOgiveSpireGeo(0.26, 0.64, 6), MAT.solarisIvory);
            headProw.rotation.x = Math.PI / 2;
            const goldCrest = new THREE.Mesh(createCurvedScytheBladeGeo(0.52, 0.07, 0.14), MAT.solarisGold);
            goldCrest.position.set(0, 0.14, -0.05);
            goldCrest.rotation.x = -0.45;
            const opticEye = new THREE.Mesh(createSculptedArmorDomeGeo(0.12, 12, 12), MAT.solarisCrystal);
            opticEye.position.set(0, 0.04, 0.25);
            [-0.28, 0.28].forEach(bx => {
                const shroud = new THREE.Mesh(createExtrudedArmorHullGeo(0.12, 0.14, 0.48, 0.02, 0.06), MAT.solarisObsidian);
                shroud.position.set(bx, -0.05, 0.18);
                const disruptor = new THREE.Mesh(createSculptedLatheBarrelGeo(0.048, 0.068, 0.78, 10), MAT.solarisGold);
                disruptor.rotation.x = Math.PI / 2;
                disruptor.position.set(bx, -0.05, 0.30);
                const coilRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.068, 0.018, 8, 14), MAT.solarisCrystal);
                coilRing.position.set(bx, -0.05, 0.48);
                const tip = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.072, 0), MAT.solarisPrismGlow);
                tip.position.set(bx, -0.05, 0.70);
                stalkerHead.add(shroud, disruptor, coilRing, tip);
            });
            stalkerHead.add(headProw, goldCrest, opticEye);
            bodyGroup.add(stalkerHead);

            // 4 Articulated 3-Segment Reverse-Jointed Golden-Obsidian Arachnid Mech Legs
            const stalkerLegs = [];
            [[-1, 0.38], [1, 0.38], [-1, -0.38], [1, -0.38]].forEach(([side, zOff], idx) => {
                const legPivot = new THREE.Group();
                legPivot.position.set(side * 0.36, 0.54, zOff);
                const hipNode = new THREE.Mesh(createSculptedArmorDomeGeo(0.085, 10, 10), MAT.solarisCrystal);
                const femur = new THREE.Mesh(createExtrudedArmorHullGeo(0.13, 0.46, 0.15, 0.02, 0.04), MAT.solarisGold);
                femur.position.set(side * 0.19, 0.14, 0);
                femur.rotation.z = -side * 0.80;
                const kneeGem = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.075, 0), MAT.solarisPrismGlow);
                kneeGem.position.set(side * 0.34, 0.24, 0);
                const shin = new THREE.Mesh(createCurvedScytheBladeGeo(0.72, 0.08, 0.15), MAT.solarisObsidian);
                shin.position.set(side * 0.36, -0.18, 0);
                shin.rotation.x = Math.PI * 0.48;
                const goldGreave = new THREE.Mesh(createCurvedScytheBladeGeo(0.54, 0.055, 0.11), MAT.solarisGold);
                goldGreave.position.set(side * 0.38, -0.14, 0.02);
                goldGreave.rotation.x = Math.PI * 0.48;
                const footGlow = new THREE.Mesh(createSculptedArmorDomeGeo(0.072, 10, 10), MAT.solarisCrystal);
                footGlow.position.set(side * 0.40, -0.50, 0);
                legPivot.add(hipNode, femur, kneeGem, shin, goldGreave, footGlow);
                group.add(legPivot);
                stalkerLegs.push({ pivot: legPivot, side, zOff, idx });
            });

            group.userData = {
                isSolaris: true, role: 'stalker', bodyGroup, stalkerHead, coreCrystal, stalkerLegs,
                phase: Math.random() * 10, attackAnim: 0
            };
            return group;
        }

        if (role === 'archon') {
            // AETHER ARCHON SOVEREIGN: Levitating Psionic Star-Entity Clad in Golden High-Templar Battle Mantle & 3 Astrolabe Rings
            const bodyGroup = new THREE.Group();
            bodyGroup.position.y = 1.12;
            group.add(bodyGroup);

            const coreSphere = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.46, 2), MAT.solarisCrystal);
            const innerSun = new THREE.Mesh(createSculptedArmorDomeGeo(0.32, 16, 16), MAT.solarisPrismGlow);
            const torsoCrest = new THREE.Mesh(createExtrudedArmorHullGeo(0.68, 0.50, 0.40, 0.04, 0.14), MAT.solarisGold);
            torsoCrest.position.y = 0.12;
            const chestCrystal = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.14, 0), MAT.solarisPrismGlow);
            chestCrystal.position.set(0, 0.16, 0.24);
            const headCrown = new THREE.Mesh(createSculptedOgiveSpireGeo(0.20, 0.48, 6), MAT.solarisIvory);
            headCrown.position.y = 0.60;

            // Levitating Golden Pauldrons & Psionic Shockwave Gauntlets
            [-1, 1].forEach(side => {
                const pauldron = new THREE.Mesh(createCurvedScytheBladeGeo(0.58, 0.14, 0.22), MAT.solarisGold);
                pauldron.position.set(side * 0.48, 0.26, 0);
                pauldron.rotation.z = -side * 0.72;
                const wristOrb = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.13, 1), MAT.solarisPrismGlow);
                wristOrb.position.set(side * 0.56, -0.06, 0.22);
                bodyGroup.add(pauldron, wristOrb);
            });

            const ringOuter = new THREE.Mesh(createSculptedTorusCollarGeo(0.84, 0.06, 12, 32), MAT.solarisGold);
            const ringInner = new THREE.Mesh(createSculptedTorusCollarGeo(0.64, 0.045, 10, 28), MAT.solarisPrismGlow);
            ringInner.rotation.x = Math.PI / 2;
            const ringCorona = new THREE.Mesh(createSculptedTorusCollarGeo(0.50, 0.032, 8, 24), MAT.solarisCrystal);
            ringCorona.rotation.y = Math.PI / 3;

            bodyGroup.add(coreSphere, innerSun, torsoCrest, chestCrystal, headCrown, ringOuter, ringInner, ringCorona);
            group.userData = {
                isSolaris: true, role: 'archon', bodyGroup, coreSphere, ringOuter, ringInner,
                phase: Math.random() * 10, attackAnim: 0
            };
            return group;
        }

        // CHRONO-ZEALOT TEMPLAR: High-Poly Ornate Aurelian Gold & Ivory Cuirass + Dorsal Warp Fins + Solar Halo + Twin Psi-Blades
        const pelvis = new THREE.Mesh(createSculptedLatheBarrelGeo(0.17, 0.21, 0.22, 14), MAT.solarisObsidian);
        pelvis.position.y = 0.38;
        const beltSash = new THREE.Mesh(createExtrudedArmorHullGeo(0.22, 0.28, 0.08, 0.02, 0.04), MAT.solarisGold);
        beltSash.position.set(0, -0.08, 0.16);
        pelvis.add(beltSash);
        group.add(pelvis);

        const upperBody = new THREE.Group();
        upperBody.position.y = 0.52;
        group.add(upperBody);

        const chest = new THREE.Mesh(createExtrudedArmorHullGeo(0.48, 0.44, 0.32, 0.04, 0.12), MAT.solarisIvory);
        chest.position.y = 0.22;
        chest.castShadow = true;
        const goldCuirass = new THREE.Mesh(createExtrudedArmorHullGeo(0.52, 0.28, 0.34, 0.04, 0.12), MAT.solarisGold);
        goldCuirass.position.set(0, 0.26, 0.02);
        const chestGem = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.095, 1), MAT.solarisCrystal);
        chestGem.position.set(0, 0.26, 0.20);
        const solarHalo = new THREE.Mesh(createSculptedTorusCollarGeo(0.35, 0.036, 10, 24), MAT.solarisGold);
        solarHalo.position.set(0, 0.44, -0.18);
        [-1, 1].forEach(side => {
            const dorsalFin = new THREE.Mesh(createCurvedScytheBladeGeo(0.48, 0.06, 0.12), MAT.solarisCrystal);
            dorsalFin.position.set(side * 0.22, 0.42, -0.16);
            dorsalFin.rotation.z = -side * 0.48;
            upperBody.add(dorsalFin);
        });
        upperBody.add(chest, goldCuirass, chestGem, solarHalo);

        const headGroup = new THREE.Group();
        headGroup.position.y = 0.54;
        const helm = new THREE.Mesh(createSculptedOgiveSpireGeo(0.19, 0.42, 6), MAT.solarisGold);
        helm.position.y = 0.07;
        const crestBlade = new THREE.Mesh(createCurvedScytheBladeGeo(0.38, 0.05, 0.12), MAT.solarisIvory);
        crestBlade.position.set(0, 0.16, -0.04);
        crestBlade.rotation.x = -0.38;
        const visor = new THREE.Mesh(createSculptedArmorDomeGeo(0.135, 14, 14), MAT.solarisCrystal);
        visor.position.set(0, 0.02, 0.09);
        headGroup.add(helm, crestBlade, visor);
        upperBody.add(headGroup);

        function makeZealotArm(side) {
            const shoulder = new THREE.Group();
            shoulder.position.set(side * 0.33, 0.36, 0);
            const pauldron = new THREE.Mesh(createCurvedScytheBladeGeo(0.42, 0.12, 0.16), MAT.solarisGold);
            pauldron.rotation.z = -side * 0.85;
            const pauldronGem = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.055, 0), MAT.solarisCrystal);
            pauldronGem.position.set(side * 0.08, 0.06, 0.06);
            const elbow = new THREE.Group();
            elbow.position.set(0, -0.20, 0.06);
            const gauntlet = new THREE.Mesh(createSculptedLatheBarrelGeo(0.070, 0.058, 0.26, 12), MAT.solarisIvory);
            gauntlet.rotation.x = Math.PI / 2;
            const gauntletTrim = new THREE.Mesh(createSculptedTorusCollarGeo(0.068, 0.016, 8, 14), MAT.solarisGold);
            gauntletTrim.position.set(0, 0, 0.08);
            const psiBlade = new THREE.Mesh(createCurvedScytheBladeGeo(0.74, 0.072, 0.14), MAT.solarisCrystal);
            psiBlade.position.set(0, 0, 0.16);
            const psiCore = new THREE.Mesh(createCurvedScytheBladeGeo(0.62, 0.042, 0.11), MAT.solarisPrismGlow);
            psiCore.position.set(0, 0.01, 0.18);
            elbow.add(gauntlet, gauntletTrim, psiBlade, psiCore);
            shoulder.add(pauldron, pauldronGem, elbow);
            upperBody.add(shoulder);
            return { shoulder, elbow };
        }
        const armL = makeZealotArm(-1);
        const armR = makeZealotArm(1);

        function makeZealotLeg(xOff) {
            const hip = new THREE.Group();
            hip.position.set(xOff, 0.40, 0);
            const thigh = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.072, 0.22, 12), MAT.solarisObsidian);
            thigh.position.y = -0.10;
            const knee = new THREE.Group();
            knee.position.y = -0.20;
            const kneeGem = new THREE.Mesh(createSculptedFacetedCrystalGeo(0.055, 0), MAT.solarisCrystal);
            kneeGem.position.set(0, 0, 0.06);
            const greave = new THREE.Mesh(createSculptedLatheBarrelGeo(0.078, 0.064, 0.22, 12), MAT.solarisGold);
            greave.position.y = -0.11;
            knee.add(kneeGem, greave);
            hip.add(thigh, knee);
            group.add(hip);
            return { hip, knee };
        }
        const legL = makeZealotLeg(-0.12);
        const legR = makeZealotLeg(0.12);

        group.userData = {
            isSolaris: true, role: 'zealot', upperBody, headGroup, solarHalo,
            shoulderL: armL.shoulder, elbowL: armL.elbow,
            shoulderR: armR.shoulder, elbowR: armR.elbow,
            legL, legR, phase: Math.random() * 10, attackAnim: 0
        };
        return group;
    }

    // --- SCULPTED STARCRAFT II CMC POWERED COMBAT SUIT (MARINE / MEDIC / ROCKETMAN / REAPER / FIREBAT / MARAUDER / HERO) ---
    const isHero = role === 'hero';
    const isMelee = role === 'grunt';
    const isMedic = role === 'medic';
    const isRocket = role === 'rocketman';
    const isReaper = role === 'reaper';
    const isFirebat = role === 'firebat';
    const isMarauder = role === 'marauder';
    const scale = isHero ? 1.38 : (isMarauder ? 1.22 : (isFirebat ? 1.14 : (isRocket ? 1.10 : (isReaper ? 1.04 : 1.02))));
    group.scale.setScalar(scale);

    // Faction Team Coloring: distinct silhouette & livery per role
    const armorMat = isMedic ? MAT.medicArmor : (isHero ? MAT.copper : (isFirebat ? MAT.medicCross : (isMarauder ? MAT.darkSteel : (isRocket ? MAT.oliveArmor : (isReaper ? MAT.darkSteel : MAT.terranPlating)))));
    const pauldronMat = isMedic ? MAT.medicArmor : (isFirebat ? MAT.hazard : (isMarauder ? MAT.copper : (isRocket ? MAT.medicCross : (isReaper ? MAT.hazard : MAT.terranBlue))));

    // Lathe-Sculpted Armored Pelvis & Waist Girdle
    const pelvisPts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.17, 0.0),
        new THREE.Vector2(0.21, 0.09),
        new THREE.Vector2(0.18, 0.18),
        new THREE.Vector2(0.0, 0.18)
    ];
    const pelvis = new THREE.Mesh(new THREE.LatheGeometry(pelvisPts, 16), MAT.darkSteel);
    pelvis.position.y = 0.34;
    group.add(pelvis);

    const upperBody = new THREE.Group();
    upperBody.position.y = 0.5;
    group.add(upperBody);

    // Lathe-Sculpted Bulky SC2 CMC Chest Torso + Gorget Armor Collar + Twin Fusion Pack
    const chestLathePts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.19, 0.0),
        new THREE.Vector2(0.27, 0.18),
        new THREE.Vector2(0.29, 0.34),
        new THREE.Vector2(0.22, 0.44),
        new THREE.Vector2(0.15, 0.48),
        new THREE.Vector2(0.0, 0.48)
    ];
    const chest = new THREE.Mesh(new THREE.LatheGeometry(chestLathePts, 18), armorMat);
    chest.scale.set(isMarauder ? 1.22 : (isFirebat ? 1.15 : 1.08), 1.0, isMarauder ? 1.06 : 0.92);
    chest.castShadow = true;

    // Chest Plating with Team Color Insignia
    const chestPlate = new THREE.Mesh(
        createExtrudedArmorHullGeo(0.42, 0.26, 0.24, 0.04, 0.1),
        isMedic ? MAT.medicArmor : (isHero ? MAT.terranCobalt : (isFirebat ? MAT.hazard : (isMarauder ? MAT.copper : (isRocket ? MAT.hazard : (isReaper ? MAT.gunmetal : MAT.terranBlue)))))
    );
    chestPlate.position.set(0, 0.25, 0.14);

    let heroCoreRing = null;
    let heroWings = null;
    let heroWeapon = null;

    if (isMedic) {
        // Red Caduceus Cross on Medic Chest
        const c1 = new THREE.Mesh(createExtrudedArmorHullGeo(0.18, 0.05, 0.015), MAT.medicDecalCross);
        c1.position.set(0, 0.25, 0.27);
        const c2 = new THREE.Mesh(createExtrudedArmorHullGeo(0.05, 0.18, 0.015), MAT.medicDecalCross);
        c2.position.set(0, 0.25, 0.27);
        upperBody.add(c1, c2);
    } else if (isHero) {
        // HERO VANGUARD BESPOKE STERNUM ARC-REACTOR CORE & GOLDEN AEGIS TRIM!
        const coreBezel = new THREE.Mesh(createSculptedTorusCollarGeo(0.095, 0.022, 10, 20), MAT.copper);
        coreBezel.position.set(0, 0.26, 0.265);
        const coreOrb = new THREE.Mesh(createSculptedArmorDomeGeo(0.072, 12, 12), MAT.plasmaShader);
        coreOrb.scale.set(1, 1, 0.45);
        coreOrb.position.set(0, 0.26, 0.265);
        heroCoreRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.064, 0.018, 6, 12), MAT.amberGlow);
        heroCoreRing.position.set(0, 0.26, 0.285);
        upperBody.add(coreBezel, coreOrb, heroCoreRing);
    }

    const gorgetCollar = new THREE.Mesh(createSculptedTorusCollarGeo(0.18, 0.045, 12, 18), isHero || isMarauder ? MAT.copper : (isFirebat ? MAT.hazard : MAT.terranCobalt));
    gorgetCollar.rotation.x = Math.PI / 2;
    gorgetCollar.position.set(0, 0.44, 0.02);

    const backpack = new THREE.Mesh(createExtrudedArmorHullGeo(0.38, 0.38, 0.24, 0.05, 0.1), isMedic ? MAT.medicArmor : (isHero ? MAT.copper : (isFirebat ? MAT.medicCross : MAT.darkSteel)));
    backpack.position.set(0, 0.25, -0.22);
    const thrusterGlow = new THREE.Mesh(createSculptedLatheBarrelGeo(0.065, 0.065, 0.3, 14), isMedic ? MAT.healGlow : (isFirebat ? MAT.volatileGlow : (isReaper || isHero || isMarauder ? MAT.amberGlow : MAT.cyanGlow)));
    thrusterGlow.rotation.z = Math.PI / 2;
    thrusterGlow.position.set(0, 0.32, -0.34);
    upperBody.add(chest, chestPlate, gorgetCollar, backpack, thrusterGlow);

    if (isMedic) {
        // Twin Pressurized Nano-Serum Tanks on Medic Backpack
        [-0.14, 0.14].forEach(bx => {
            const tank = new THREE.Mesh(createSculptedLatheBarrelGeo(0.06, 0.06, 0.36, 12), MAT.healGlow);
            tank.position.set(bx, 0.32, -0.35);
            upperBody.add(tank);
        });
    } else if (isFirebat) {
        // Twin High-Pressure Volatile Napalm Cylinders + Thermal Blast Shielding on Firebat Backpack
        [-0.15, 0.15].forEach(fx => {
            const fuelTank = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.085, 0.46, 14), MAT.medicCross);
            fuelTank.position.set(fx, 0.34, -0.34);
            const tankCap = new THREE.Mesh(createSculptedArmorDomeGeo(0.085, 12, 10), MAT.hazard);
            tankCap.position.set(fx, 0.57, -0.34);
            const gaugeGlow = new THREE.Mesh(createSculptedLatheBarrelGeo(0.088, 0.088, 0.08, 12), MAT.volatileGlow);
            gaugeGlow.position.set(fx, 0.36, -0.34);
            upperBody.add(fuelTank, tankCap, gaugeGlow);
        });
    } else if (isMarauder) {
        // Heavy Dorsal Punisher Grenade Autoloader Drum & Armored Blast Cowl on Marauder
        const ammoDrum = new THREE.Mesh(createSculptedLatheBarrelGeo(0.16, 0.16, 0.44, 14), MAT.copper);
        ammoDrum.rotation.z = Math.PI / 2;
        ammoDrum.position.set(0, 0.44, -0.28);
        [-0.18, 0.18].forEach(mx => {
            const feedChute = new THREE.Mesh(createExtrudedArmorHullGeo(0.10, 0.28, 0.20, 0.02, 0.04), MAT.gunmetal);
            feedChute.position.set(mx, 0.48, -0.14);
            upperBody.add(feedChute);
        });
        upperBody.add(ammoDrum);
    } else if (isRocket) {
        // Dorsal Multi-Warhead Missile Reload Rack on Rocket Man Backpack
        [-0.12, -0.04, 0.04, 0.12].forEach(mx => {
            const spareMissile = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.032, 0.36, 8), MAT.oliveArmor);
            spareMissile.position.set(mx, 0.46, -0.24);
            const tip = new THREE.Mesh(createSculptedOgiveSpireGeo(0.034, 0.09, 8), MAT.medicCross);
            tip.position.set(mx, 0.68, -0.24);
            upperBody.add(spareMissile, tip);
        });
    }
    const reaperNozzles = [];
    if (isReaper) {
        // Dual Canted Jump-Jet Vector Thruster Turbines + Dynamic 3D Particle Exhaust Nozzles (Zero basic cone shapes!)
        [-0.18, 0.18].forEach(jx => {
            const jetPod = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.11, 0.48, 12), MAT.gunmetal);
            jetPod.rotation.z = jx > 0 ? -0.28 : 0.28;
            jetPod.rotation.x = 0.22;
            jetPod.position.set(jx, 0.34, -0.28);
            const nozzleRim = new THREE.Mesh(createSculptedTorusCollarGeo(0.082, 0.018, 8, 12), MAT.copper);
            nozzleRim.rotation.x = Math.PI / 2 + 0.22;
            nozzleRim.rotation.y = jx > 0 ? -0.28 : 0.28;
            nozzleRim.position.set(jx * 1.32, 0.12, -0.33);
            const jetNozzleNode = new THREE.Object3D();
            jetNozzleNode.position.set(jx * 1.38, 0.08, -0.35);
            reaperNozzles.push({
                node: jetNozzleNode,
                dir: new THREE.Vector3(jx * 0.45, -0.92, -0.38).normalize()
            });
            upperBody.add(jetPod, nozzleRim, jetNozzleNode);
        });
    } else if (isHero) {
        // HERO VANGUARD DORSAL HARD-LIGHT ENERGY WINGS & TACTICAL BANNER PYLONS!
        heroWings = new THREE.Group();
        heroWings.position.set(0, 0.36, -0.32);
        [-1, 1].forEach(side => {
            const pylon = new THREE.Mesh(createExtrudedArmorHullGeo(0.10, 0.44, 0.14, 0.015, 0.04), MAT.copper);
            pylon.position.set(side * 0.18, 0.12, 0);
            pylon.rotation.z = -side * 0.36;

            const wingBlade1 = new THREE.Mesh(createCurvedScytheBladeGeo(0.64, 0.06, 0.16), MAT.cyanGlow);
            wingBlade1.position.set(side * 0.24, 0.22, -0.04);
            wingBlade1.rotation.z = -side * 0.72;
            wingBlade1.rotation.y = -side * 0.28;

            const wingBlade2 = new THREE.Mesh(createCurvedScytheBladeGeo(0.48, 0.045, 0.12), MAT.amberGlow);
            wingBlade2.position.set(side * 0.22, 0.04, -0.05);
            wingBlade2.rotation.z = -side * 1.05;
            wingBlade2.rotation.y = -side * 0.28;

            heroWings.add(pylon, wingBlade1, wingBlade2);
        });
        upperBody.add(heroWings);
    }

    const headGroup = new THREE.Group();
    headGroup.position.y = 0.52;
    const helmet = new THREE.Mesh(createSculptedArmorDomeGeo(0.195, 18, 16), isMedic ? MAT.medicArmor : (isHero ? MAT.copper : (isFirebat ? MAT.medicCross : (isMarauder ? MAT.darkSteel : (isRocket ? MAT.oliveArmor : (isReaper ? MAT.darkSteel : MAT.terranPlating))))));
    const visor = new THREE.Mesh(createSculptedArmorDomeGeo(0.17, 16, 14), isMedic ? MAT.healGlow : (isFirebat ? MAT.volatileGlow : (isHero || isReaper || isRocket || isMarauder ? MAT.amberGlow : MAT.cyanGlow)));
    visor.scale.set(1.06, 0.52, 0.96);
    visor.position.set(0, 0, 0.06);
    headGroup.add(helmet, visor);

    if (isHero) {
        // Crowned Commander Crest & Dual Valkyrie Horn Antennas on Hero Helmet
        const crestFin = new THREE.Mesh(createExtrudedArmorHullGeo(0.05, 0.16, 0.28, 0.01, 0.04), MAT.amberGlow);
        crestFin.position.set(0, 0.18, 0.02);
        [-0.14, 0.14].forEach(hx => {
            const horn = new THREE.Mesh(createCurvedScytheBladeGeo(0.28, 0.035, 0.08), MAT.copper);
            horn.position.set(hx, 0.10, 0.02);
            horn.rotation.z = hx > 0 ? -0.38 : 0.38;
            horn.rotation.x = -0.35;
            headGroup.add(horn);
        });
        headGroup.add(crestFin);
    }
    upperBody.add(headGroup);

    // Oversized SC2 Domed Shoulder Pauldrons
    const shoulderR = new THREE.Group();
    shoulderR.position.set(0.31, 0.36, 0);
    const pauldronR = new THREE.Mesh(createSculptedArmorDomeGeo(0.165, 16, 14), isHero ? MAT.terranBlue : pauldronMat);
    pauldronR.scale.set(isHero || isMarauder ? 1.30 : (isFirebat ? 1.22 : 1.12), 0.92, isHero || isMarauder ? 1.28 : 1.16);
    const pauldronRimR = new THREE.Mesh(createSculptedTorusCollarGeo(0.155, 0.025, 10, 16), isHero ? MAT.copper : (isMedic ? MAT.medicDecalCross : MAT.terranCobalt));
    pauldronRimR.rotation.x = Math.PI / 2.2;
    const upperArmR = new THREE.Mesh(createSculptedLatheBarrelGeo(0.07, 0.06, 0.24, 14), armorMat);
    upperArmR.position.y = -0.11;
    shoulderR.add(pauldronR, pauldronRimR, upperArmR);

    if (isHero) {
        // Shoulder-Mounted Micro-Missile Pod on Hero Pauldrons
        const podR = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.12, 0.20, 0.015, 0.04), MAT.gunmetal);
        podR.position.set(0.06, 0.16, 0.02);
        const podTipR = new THREE.Mesh(createExtrudedArmorHullGeo(0.10, 0.08, 0.04), MAT.medicCross);
        podTipR.position.set(0.06, 0.16, 0.12);
        shoulderR.add(podR, podTipR);
    }

    const elbowR = new THREE.Group();
    elbowR.position.set(0, -0.22, 0);
    const forearmR = new THREE.Mesh(createSculptedLatheBarrelGeo(0.068, 0.058, 0.24, 14), isMedic ? MAT.medicArmor : (isHero ? MAT.copper : MAT.gunmetal));
    forearmR.position.y = -0.11;
    const handR = new THREE.Mesh(createSculptedArmorDomeGeo(0.058, 12, 12), MAT.darkSteel);
    handR.position.set(0, -0.23, 0);
    elbowR.add(forearmR, handR);
    shoulderR.add(elbowR);
    upperBody.add(shoulderR);

    const shoulderL = new THREE.Group();
    shoulderL.position.set(-0.31, 0.36, 0);
    const pauldronL = pauldronR.clone();
    const pauldronRimL = pauldronRimR.clone();
    const upperArmL = upperArmR.clone();
    shoulderL.add(pauldronL, pauldronRimL, upperArmL);

    if (isHero) {
        const podL = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.12, 0.20, 0.015, 0.04), MAT.gunmetal);
        podL.position.set(-0.06, 0.16, 0.02);
        const podTipL = new THREE.Mesh(createExtrudedArmorHullGeo(0.10, 0.08, 0.04), MAT.medicCross);
        podTipL.position.set(-0.06, 0.16, 0.12);
        shoulderL.add(podL, podTipL);
    }

    const elbowL = new THREE.Group();
    elbowL.position.set(0, -0.22, 0);
    const forearmL = forearmR.clone();
    const handL = handR.clone();
    elbowL.add(forearmL, handL);
    shoulderL.add(elbowL);
    upperBody.add(shoulderL);

    if (isMedic) {
        // Dedicated Medical Caduceus Gauntlet on right hand (NO assault rifle!)
        const medGauntlet = createCaduceusMedicalGauntlet();
        medGauntlet.position.set(-0.02, -0.14, 0.10);
        handR.add(medGauntlet);

        // Wrist-mounted Biometric Scanner on left forearm
        const scannerPad = createBiometricScannerPad();
        scannerPad.position.set(0.05, -0.08, 0.08);
        scannerPad.rotation.y = -Math.PI / 3;
        elbowL.add(scannerPad);

        shoulderR.rotation.set(-0.45, -0.15, 0);
        elbowR.rotation.set(-0.75, 0, 0);
        shoulderL.rotation.set(-0.52, 0.35, 0);
        elbowL.rotation.set(-0.82, 0.15, 0);
    } else if (isHero) {
        // BESPOKE HERO VANGUARD HYPERION TWIN-CORE PLASMA RAIL-CANNON + LEFT FOREARM AEGIS HOLO-SHIELD!
        heroWeapon = createHeroHyperionRailbladeCannon();
        heroWeapon.position.set(-0.05, -0.02, 0.16);
        heroWeapon.rotation.x = Math.PI / 2;
        handR.add(heroWeapon);

        // Left Forearm Projected Golden-Cyan Aegis Buckler Emitter
        const bucklerFrame = new THREE.Mesh(createSculptedLatheBarrelGeo(0.12, 0.12, 0.04, 8), MAT.copper);
        bucklerFrame.rotation.z = Math.PI / 2;
        bucklerFrame.position.set(-0.07, -0.10, 0.04);
        const bucklerRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.16, 0.018, 8, 18), MAT.cyanGlow);
        bucklerRing.rotation.y = Math.PI / 2;
        bucklerRing.position.set(-0.09, -0.10, 0.04);
        elbowL.add(bucklerFrame, bucklerRing);

        shoulderR.rotation.set(-0.62, -0.10, 0);
        elbowR.rotation.set(-1.02, 0, 0);
        shoulderL.rotation.set(-0.74, 0.58, 0);
        elbowL.rotation.set(-0.84, 0.22, 0);
    } else if (isFirebat) {
        // CMC-660 PYRO-FIREBAT: Twin Wrist-Mounted Perdition Plasma Flamethrower Gauntlets + Pilot Igniters!
        [handR, handL].forEach(handNode => {
            const gauntletGroup = new THREE.Group();
            const shroud = new THREE.Mesh(createExtrudedArmorHullGeo(0.15, 0.15, 0.38, 0.02, 0.06), MAT.medicCross);
            shroud.position.set(0, 0, 0.14);
            const hazardBand = new THREE.Mesh(createExtrudedArmorHullGeo(0.16, 0.16, 0.08), MAT.hazard);
            hazardBand.position.set(0, 0, 0.22);
            const nozzleL = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.042, 0.26, 10), MAT.gunmetal);
            nozzleL.rotation.x = Math.PI / 2;
            nozzleL.position.set(-0.035, 0, 0.34);
            const nozzleR = new THREE.Mesh(createSculptedLatheBarrelGeo(0.032, 0.042, 0.26, 10), MAT.gunmetal);
            nozzleR.rotation.x = Math.PI / 2;
            nozzleR.position.set(0.035, 0, 0.34);
            const pilotFlame = new THREE.Mesh(createSculptedArmorDomeGeo(0.042, 8, 8), MAT.volatileGlow);
            pilotFlame.position.set(0, -0.02, 0.48);
            gauntletGroup.add(shroud, hazardBand, nozzleL, nozzleR, pilotFlame);
            gauntletGroup.rotation.x = Math.PI / 2;
            handNode.add(gauntletGroup);
        });
        shoulderR.rotation.set(-0.64, -0.14, 0);
        elbowR.rotation.set(-0.88, 0, 0);
        shoulderL.rotation.set(-0.64, 0.14, 0);
        elbowL.rotation.set(-0.88, 0, 0);
    } else if (isMarauder) {
        // CMC-700 CONCUSSIVE MARAUDER: Dual Arm-Mounted Quad-Barrel Punisher Grenade Launchers!
        [handR, handL].forEach(handNode => {
            const cannonGroup = new THREE.Group();
            const housing = new THREE.Mesh(createExtrudedArmorHullGeo(0.18, 0.20, 0.48, 0.025, 0.08), MAT.darkSteel);
            housing.position.set(0, 0, 0.18);
            const copperTrim = new THREE.Mesh(createExtrudedArmorHullGeo(0.19, 0.08, 0.36), MAT.copper);
            copperTrim.position.set(0, 0.08, 0.18);
            const bore = new THREE.Mesh(createSculptedLatheBarrelGeo(0.062, 0.072, 0.34, 12), MAT.gunmetal);
            bore.rotation.x = Math.PI / 2;
            bore.position.set(0, 0, 0.38);
            const muzzleRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.065, 0.016, 8, 14), MAT.amberGlow);
            muzzleRing.position.set(0, 0, 0.54);
            cannonGroup.add(housing, copperTrim, bore, muzzleRing);
            cannonGroup.rotation.x = Math.PI / 2;
            handNode.add(cannonGroup);
        });
        shoulderR.rotation.set(-0.68, -0.10, 0);
        elbowR.rotation.set(-0.92, 0, 0);
        shoulderL.rotation.set(-0.68, 0.10, 0);
        elbowL.rotation.set(-0.92, 0, 0);
    } else if (isRocket) {
        // Heavy Shoulder-Mounted Twin-Tube Anti-Armor & Anti-Air Rocket Launcher
        const rocketLauncher = createShoulderRocketLauncher();
        rocketLauncher.position.set(-0.04, -0.02, 0.16);
        rocketLauncher.rotation.x = Math.PI / 2;
        handR.add(rocketLauncher);

        shoulderR.rotation.set(-0.72, -0.06, 0);
        elbowR.rotation.set(-1.12, 0, 0);
        shoulderL.rotation.set(-0.75, 0.55, 0);
        elbowL.rotation.set(-0.85, 0.25, 0);
    } else if (isReaper) {
        // Dual P-45 Gauss Pistols (One in each hand!)
        const pistolR = createReaperGaussPistol();
        pistolR.position.set(0, -0.02, 0.12);
        pistolR.rotation.x = Math.PI / 2;
        handR.add(pistolR);

        const pistolL = createReaperGaussPistol();
        pistolL.position.set(0, -0.02, 0.12);
        pistolL.rotation.x = Math.PI / 2;
        handL.add(pistolL);

        shoulderR.rotation.set(-0.62, -0.08, 0);
        elbowR.rotation.set(-0.92, 0, 0);
        shoulderL.rotation.set(-0.62, 0.08, 0);
        elbowL.rotation.set(-0.92, 0, 0);
    } else if (isMelee) {
        const sword = createPlasmaBroadsword();
        handR.add(sword);

        // Heavy Riot Blast Shield with Dominion Blue livery
        const shield = new THREE.Mesh(createExtrudedArmorHullGeo(0.12, 0.58, 0.40, 0.03, 0.1), MAT.terranBlue);
        shield.position.set(-0.08, -0.1, 0.08);
        const shieldBorder = new THREE.Mesh(createExtrudedArmorHullGeo(0.13, 0.60, 0.06), MAT.hazard);
        shieldBorder.position.set(-0.08, -0.1, 0.28);
        shield.add(shieldBorder);
        elbowL.add(shield);

        shoulderR.rotation.set(-0.45, 0, -0.15);
        elbowR.rotation.set(-0.85, 0, 0);
        shoulderL.rotation.set(-0.55, 0.35, 0);
        elbowL.rotation.set(-0.9, 0, 0);
    } else {
        const rifle = createDetailedAssaultRifle(false);
        rifle.position.set(-0.06, -0.02, 0.14);
        rifle.rotation.x = Math.PI / 2;
        handR.add(rifle);

        shoulderR.rotation.set(-0.55, -0.12, 0);
        elbowR.rotation.set(-1.05, 0, 0);
        shoulderL.rotation.set(-0.78, 0.62, 0);
        elbowL.rotation.set(-0.82, 0.25, 0);
    }

    // Articulated IK Pelvis Assembly + Lathe-Sculpted Contoured Thigh & Greave Leg Armor + Armored Combat Boots
    const pelvisGroup = new THREE.Group();
    pelvisGroup.position.set(0, 0.40, 0);
    const pelvisArmor = new THREE.Mesh(
        createExtrudedArmorHullGeo(0.26, 0.12, 0.20, 0.02, 0.05),
        isHero ? MAT.terranBlue : armorMat
    );
    pelvisArmor.position.set(0, 0.02, 0);
    pelvisGroup.add(pelvisArmor);
    group.add(pelvisGroup);

    const greavePts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.085, 0.0),
        new THREE.Vector2(0.072, 0.08),
        new THREE.Vector2(0.092, 0.16),
        new THREE.Vector2(0.08, 0.22),
        new THREE.Vector2(0.0, 0.22)
    ];
    const greaveGeo = new THREE.LatheGeometry(greavePts, 14);

    function makeLeg(xOff) {
        const hip = new THREE.Group();
        hip.position.set(xOff, 0, 0);
        const thigh = new THREE.Mesh(createSculptedLatheBarrelGeo(0.088, 0.078, 0.22, 14), armorMat);
        thigh.position.y = -0.10;
        const knee = new THREE.Group();
        knee.position.y = -0.20;
        const kneePad = new THREE.Mesh(createSculptedArmorDomeGeo(0.065, 12, 10), isMedic ? MAT.medicArmor : (isHero ? MAT.amberGlow : MAT.terranCobalt));
        kneePad.position.set(0, 0, 0.04);
        const shin = new THREE.Mesh(greaveGeo, isHero ? MAT.terranBlue : MAT.gunmetal);
        shin.position.y = -0.20;
        const ankle = new THREE.Group();
        ankle.position.set(0, -0.20, 0);
        const boot = new THREE.Mesh(createExtrudedArmorHullGeo(0.105, 0.075, 0.18, 0.015, 0.04), MAT.darkSteel);
        boot.position.set(0, -0.02, 0.045);
        ankle.add(boot);
        knee.add(kneePad, shin, ankle);
        hip.add(thigh, knee);
        pelvisGroup.add(hip);
        return { hip, knee, ankle };
    }
    const legL = makeLeg(-0.125);
    const legR = makeLeg(0.125);

    group.userData = {
        isBug: false, role, upperBody,
        head: headGroup, headGroup, pelvisGroup,
        shoulderL, elbowL, shoulderR, elbowR, handR, handL,
        legL, legR, heroCoreRing, heroWings, heroWeapon, reaperNozzles,
        phase: Math.random() * 10, attackAnim: 0
    };
    return group;
}

// ============================================================================
// DYNAMIC 3D THRUSTER EXHAUST PARTICLE GENERATOR (SLEEK ADDITIVE ION PLASMA & THERMAL JET STREAM)
// Emits high-velocity, laminar, additive-blended micro-particles that taper smoothly along the thrust vector
// ============================================================================
const _thrusterWorldPos = new THREE.Vector3();
const _thrusterWorldQuat = new THREE.Quaternion();
const _thrusterWorldDir = new THREE.Vector3();
let _thrusterMicroGeo = null;
let _thrusterMats = null;

function ensureThrusterParticleAssets() {
    if (!_thrusterMicroGeo) {
        // Sculpted 3D tapered mach-diamond plasma core geometry (zero basic spheres or flat planes!)
        const pts = [];
        for (let i = 0; i <= 8; i++) {
            const t = i / 8;
            const env = Math.sin(Math.pow(t, 0.62) * Math.PI);
            pts.push(new THREE.Vector2(Math.max(0.002, env * 0.028), (t - 0.5) * 0.11));
        }
        _thrusterMicroGeo = new THREE.LatheGeometry(pts, 8);
        _thrusterMicroGeo.rotateX(Math.PI / 2);
        _thrusterMicroGeo.computeVertexNormals();
    }
    if (!_thrusterMats) {
        const makeAddMat = (hex, op) => new THREE.MeshBasicMaterial({
            color: hex,
            transparent: true,
            opacity: op,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        _thrusterMats = {
            coreWhite:  makeAddMat(0xffffff, 0.96),
            cyanHot:    makeAddMat(0xbaf2ff, 0.92),
            cyanIon:    makeAddMat(0x00e5ff, 0.85),
            cyanTail:   makeAddMat(0x0284c7, 0.65),
            amberHot:   makeAddMat(0xfffbeb, 0.95),
            amberFlame: makeAddMat(0xff9e00, 0.88),
            amberTail:  makeAddMat(0xea580c, 0.72),
            psionicOrb: makeAddMat(0x38bdf8, 0.90)
        };
    }
}

function emitThrusterExhaustParticles(nozzleNode, localDir, colorMode = 'amber', scale = 1.0, isMoving = false) {
    if (!nozzleNode || typeof particles === 'undefined') return;
    const totalActors = (window.units ? window.units.length : 0) + (window.enemies ? window.enemies.length : 0);
    const maxAllowedParticles = totalActors > 42 ? 95 : 165;
    if (particles.length >= maxAllowedParticles) return;

    ensureThrusterParticleAssets();

    if (nozzleNode.isVector3) {
        _thrusterWorldPos.copy(nozzleNode);
        _thrusterWorldDir.copy(localDir || new THREE.Vector3(0, -1, 0)).normalize();
    } else if (typeof nozzleNode.getWorldPosition === 'function') {
        nozzleNode.getWorldPosition(_thrusterWorldPos);
        nozzleNode.getWorldQuaternion(_thrusterWorldQuat);
        _thrusterWorldDir.copy(localDir || new THREE.Vector3(0, -1, 0)).applyQuaternion(_thrusterWorldQuat).normalize();
    } else {
        return;
    }

    // Viewport Frustum Culling: skip emitting thruster particles for off-screen units!
    if (typeof window.isWorldPosInViewport === 'function' && !window.isWorldPosInViewport(_thrusterWorldPos.x, _thrusterWorldPos.y, _thrusterWorldPos.z, 6.0)) {
        return;
    }

    const isCyan = (colorMode === 'cyan' || colorMode === false || scale === 'cyan');
    const effScale = (typeof colorMode === 'number') ? colorMode : (typeof scale === 'number' ? scale : 1.0);
    const boost = isMoving ? 1.32 : 0.96;
    const count = (totalActors > 42) ? 2 : 3;

    for (let i = 0; i < count; i++) {
        const isCore = (i === 0);
        const isMidPlume = (i === 1);
        const mat = isCyan
            ? (isCore ? _thrusterMats.coreWhite : (isMidPlume ? _thrusterMats.cyanHot : (Math.random() > 0.4 ? _thrusterMats.cyanIon : _thrusterMats.cyanTail)))
            : (isCore ? _thrusterMats.coreWhite : (isMidPlume ? _thrusterMats.amberHot : (Math.random() > 0.4 ? _thrusterMats.amberFlame : _thrusterMats.amberTail)));

        const jet = new THREE.Mesh(_thrusterMicroGeo, mat);
        const s = (isCore ? 0.88 : (isMidPlume ? 1.05 : 0.78 + Math.random() * 0.35)) * effScale * boost;
        // Multi-stage Mach-Diamond Core + Supersonic Tapered Exhaust Plume
        jet.scale.set(s * (isCore ? 0.68 : 0.95), s * (isCore ? 0.68 : 0.95), s * (isCore ? 1.85 : 2.55));

        const jitter = isCore ? 0.008 : 0.022;
        jet.position.copy(_thrusterWorldPos)
            .addScaledVector(_thrusterWorldDir, isCore ? 0.02 : (0.06 + i * 0.045))
            .add(new THREE.Vector3(
                (Math.random() - 0.5) * jitter,
                (Math.random() - 0.5) * jitter,
                (Math.random() - 0.5) * jitter
            ));
        scene.add(jet);

        const speed = ((isMoving ? 7.8 : 5.2) + i * 1.8 + Math.random() * 1.4) * Math.max(0.65, effScale);
        const spread = isCore ? 0.14 : 0.42;
        const vel = new THREE.Vector3(
            _thrusterWorldDir.x * speed + (Math.random() - 0.5) * spread,
            _thrusterWorldDir.y * speed + (Math.random() - 0.5) * spread,
            _thrusterWorldDir.z * speed + (Math.random() - 0.5) * spread
        );
        jet.lookAt(jet.position.x + vel.x, jet.position.y + vel.y, jet.position.z + vel.z);

        const maxLife = isCore ? 0.055 : (0.085 + Math.random() * 0.045);
        particles.push({
            mesh: jet,
            vel,
            gravity: 0,
            drag: 7.2,
            isThrustParticle: true,
            maxLife,
            life: maxLife
        });
    }
}
window.emitThrusterExhaustParticles = emitThrusterExhaustParticles;

// Ambient & Combat Zerg Creep Viscoelastic Goo / Spore Bubble Particle Emitter
let _creepGooGeo = null;
function emitZergCreepGooParticles(worldPos, count = 2, isBurst = false) {
    if (!worldPos || typeof particles === 'undefined') return;
    if (typeof window.isWorldPosInViewport === 'function' && !window.isWorldPosInViewport(worldPos.x, worldPos.y || 0, worldPos.z, 8.0)) return;
    if (particles.length >= 145) return;
    if (!_creepGooGeo) {
        _creepGooGeo = createProceduralViscoelasticGooGeo(0.085, 0.075, 0.11, 2);
    }
    for (let i = 0; i < count; i++) {
        const isAcid = (i % 2 === 0);
        const gooMat = isAcid ? MAT.acidGlow : (MAT.hiveVeinGlow || MAT.zergBioShader);
        const droplet = new THREE.Mesh(_creepGooGeo, gooMat);
        const sc = (isBurst ? 0.95 : 0.65) + Math.random() * 0.45;
        droplet.scale.set(sc, sc * 0.85, sc * 1.25);
        const ox = (Math.random() - 0.5) * (isBurst ? 0.8 : 2.4);
        const oz = (Math.random() - 0.5) * (isBurst ? 0.8 : 2.4);
        const gy = typeof getTerrainHeight === 'function' ? getTerrainHeight(worldPos.x + ox, worldPos.z + oz) : (worldPos.y || 0);
        droplet.position.set(worldPos.x + ox, gy + 0.08, worldPos.z + oz);
        scene.add(droplet);
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * (isBurst ? 3.8 : 1.1),
            (isBurst ? 3.2 : 1.45) + Math.random() * 1.6,
            (Math.random() - 0.5) * (isBurst ? 3.8 : 1.1)
        );
        particles.push({
            mesh: droplet,
            vel,
            gravity: 6.8,
            drag: 2.2,
            isGooBlob: true,
            isBugGore: true,
            bounces: 1,
            life: 0.48 + Math.random() * 0.32
        });
    }
}
window.emitZergCreepGooParticles = emitZergCreepGooParticles;

function updateUnitAnimation(mesh, dt, isMoving, aimTargetPos = null) {
    if (!mesh || !mesh.visible) return;
    const ud = mesh.userData;
    if (!ud) return;

    if (ud.attackAnim > 0) ud.attackAnim = Math.max(0, ud.attackAnim - dt * 3.8);

    if (ud.isVehicle) {
        ud.phase += dt * 16;
        if (ud.rotor) ud.rotor.rotation.y += dt * 28;
        if (ud.tailRotor) ud.tailRotor.rotation.x += dt * 34;
        if (ud.rotors) ud.rotors.forEach((r, idx) => { r.rotation.y += dt * 30 * (idx % 2 === 0 ? 1 : -1); });

        // Dynamic 3D Thruster Particle Emission for Gunship & Dropship Nacelles
        if (ud.thrusterNozzles && ud.thrusterNozzles.length > 0) {
            ud.thrusterEmitTimer = (ud.thrusterEmitTimer || 0) - dt;
            if (ud.thrusterEmitTimer <= 0) {
                ud.thrusterEmitTimer = isMoving ? 0.016 : 0.028;
                for (let ti = 0; ti < ud.thrusterNozzles.length; ti++) {
                    const tn = ud.thrusterNozzles[ti];
                    if (tn && tn.node) {
                        emitThrusterExhaustParticles(tn.node, tn.dir, tn.color || 'cyan', tn.scale || 0.85, isMoving);
                    }
                }
            }
        }
        if (ud.vType === 'transport') {
            if (ud.dropAnim > 0) ud.dropAnim = Math.max(0, ud.dropAnim - dt * 1.4);
            if (ud.nacelles) {
                const tiltAngle = isMoving ? 0.28 : -0.06;
                ud.nacelles.forEach(n => { n.rotation.x = THREE.MathUtils.lerp(n.rotation.x, tiltAngle, dt * 6); });
            }
            if (ud.cargoRamp) {
                const targetRampRot = ud.dropAnim > 0 ? -0.65 : 0;
                ud.cargoRamp.rotation.x = THREE.MathUtils.lerp(ud.cargoRamp.rotation.x, targetRampRot, dt * 8);
            }
            if (ud.airframe) {
                ud.airframe.position.y = Math.sin(ud.phase * 0.45) * 0.08;
                ud.airframe.rotation.z = Math.cos(ud.phase * 0.35) * 0.04;
            }
        }
        // --- TRANSFORMABLE VALKYRIE VF-9 VARIABLE-FIGHTER & SEMI-MECH 3-SECOND LAND/FLY ANIMATION ---
        if (ud.vType === 'valkyrie' && ud.airframe) {
            const targetTrans = ud.mechMode ? 1.0 : 0.0;
            if (ud.prevMechMode !== !!ud.mechMode) {
                ud.prevMechMode = !!ud.mechMode;
                ud.transformAnimTimer = 3.0;
                ud.touchdownShockFired = false;
                const ring = new THREE.Mesh(SHARED_FX_GEO.shockRing, SHARED_FX_MAT.shockCyan.clone());
                const gy = typeof getSurfaceHeightWithBridges === 'function'
                    ? getSurfaceHeightWithBridges(mesh.position.x, mesh.position.z)
                    : getTerrainHeight(mesh.position.x, mesh.position.z);
                ring.position.set(mesh.position.x, gy + 0.18, mesh.position.z);
                scene.add(ring);
                shockwaves.push({ mesh: ring, scale: 0.35, speed: 6.5, alpha: 0.85 });
            }
            if (ud.transformAnimTimer > 0) {
                ud.transformAnimTimer = Math.max(0, ud.transformAnimTimer - dt);
            }

            const transRate = dt / 3.0;
            if (ud.mechTransition === undefined) ud.mechTransition = targetTrans;
            if (Math.abs(targetTrans - ud.mechTransition) <= transRate) {
                ud.mechTransition = targetTrans;
            } else {
                ud.mechTransition += Math.sign(targetTrans - ud.mechTransition) * transRate;
            }
            const mt = THREE.MathUtils.clamp(ud.mechTransition, 0, 1);

            const rawStage1 = THREE.MathUtils.clamp(mt / 0.42, 0, 1);
            const wingFoldT = rawStage1 * rawStage1 * (3.0 - 2.0 * rawStage1);
            const rawStage2 = THREE.MathUtils.clamp((mt - 0.24) / 0.58, 0, 1);
            const chassisDeployT = rawStage2 * rawStage2 * (3.0 - 2.0 * rawStage2);
            const smoothMt = mt * mt * (3.0 - 2.0 * mt);
            const midTransFlare = Math.sin(mt * Math.PI);
            const isLandingCrouch = ud.mechMode
                ? (mt > 0.72 && mt < 0.995 ? Math.sin(((mt - 0.72) / 0.275) * Math.PI) : 0.0)
                : (mt > 0.02 && mt < 0.30 ? Math.sin(((mt - 0.02) / 0.28) * Math.PI) * 0.75 : 0.0);

            if (ud.mechMode && mt >= 0.78 && !ud.touchdownShockFired) {
                ud.touchdownShockFired = true;
                const tdRing = new THREE.Mesh(SHARED_FX_GEO.shockRing, SHARED_FX_MAT.shockAmber.clone());
                const gy = typeof getSurfaceHeightWithBridges === 'function'
                    ? getSurfaceHeightWithBridges(mesh.position.x, mesh.position.z)
                    : getTerrainHeight(mesh.position.x, mesh.position.z);
                tdRing.position.set(mesh.position.x, gy + 0.15, mesh.position.z);
                scene.add(tdRing);
                shockwaves.push({ mesh: tdRing, scale: 0.45, speed: 7.5, alpha: 0.9 });
            }

            const flightHoverY = Math.sin(ud.phase * 0.55) * 0.08;
            const mechBobY = 1.48 - isLandingCrouch * 0.36 + (isMoving ? Math.abs(Math.sin(ud.phase * 0.75)) * 0.12 : Math.sin(ud.phase * 0.25) * 0.03);
            ud.airframe.position.y = THREE.MathUtils.lerp(flightHoverY, mechBobY, chassisDeployT) + midTransFlare * 0.28;

            ud.airframe.rotation.z = THREE.MathUtils.lerp(
                Math.cos(ud.phase * 0.4) * 0.05,
                (isMoving ? Math.sin(ud.phase * 0.75) * 0.065 : 0) + Math.sin(midTransFlare * Math.PI * 2.0) * 0.04,
                smoothMt
            );

            const flarePitch = ud.mechMode ? (-0.42 * midTransFlare + isLandingCrouch * 0.22) : (-0.32 * midTransFlare - isLandingCrouch * 0.14);
            ud.airframe.rotation.x = THREE.MathUtils.lerp(
                (isMoving ? 0.06 : 0.0) - ud.attackAnim * 0.08,
                (isMoving ? 0.06 : 0.0) - ud.attackAnim * 0.10,
                smoothMt
            ) + flarePitch;

            if (ud.vtolBellyGlow) {
                const vtolScale = 0.5 + midTransFlare * 1.35 + (1.0 - smoothMt) * 0.45;
                ud.vtolBellyGlow.scale.setScalar(vtolScale);
            }

            if (ud.upperTorso) {
                ud.upperTorso.rotation.x = THREE.MathUtils.lerp(0.0, -0.06 + isLandingCrouch * 0.22, chassisDeployT);
                ud.upperTorso.position.y = THREE.MathUtils.lerp(0.14, 0.28 - isLandingCrouch * 0.08, chassisDeployT);
                let torsoYaw = isMoving ? Math.sin(ud.phase * 0.75) * 0.10 * chassisDeployT : 0;
                if (aimTargetPos && smoothMt > 0.5) {
                    const localAim = mesh.worldToLocal(aimTargetPos.clone());
                    const desiredYaw = THREE.MathUtils.clamp(Math.atan2(localAim.x, Math.max(0.5, localAim.z)), -0.55, 0.55);
                    torsoYaw = THREE.MathUtils.lerp(torsoYaw, desiredYaw, smoothMt);
                }
                ud.upperTorso.rotation.y = torsoYaw;
            }

            if (ud.noseProw) {
                const noseT = THREE.MathUtils.clamp((mt - 0.10) / 0.55, 0, 1);
                const smoothNoseT = noseT * noseT * (3.0 - 2.0 * noseT);
                ud.noseProw.rotation.x = THREE.MathUtils.lerp(0.0, 1.48, smoothNoseT);
                ud.noseProw.position.y = THREE.MathUtils.lerp(0.16, -0.04, smoothNoseT);
                ud.noseProw.position.z = THREE.MathUtils.lerp(0.62, 0.48, smoothNoseT);
            }

            if (ud.mechHead) {
                const headT = THREE.MathUtils.clamp((mt - 0.45) / 0.45, 0, 1);
                const smoothHeadT = headT * headT * (3.0 - 2.0 * headT);
                ud.mechHead.visible = smoothHeadT > 0.05;
                ud.mechHead.position.y = THREE.MathUtils.lerp(0.16, 0.70, smoothHeadT);
                ud.mechHead.scale.setScalar(THREE.MathUtils.lerp(0.05, 1.05, smoothHeadT));
                ud.mechHead.rotation.y = Math.sin(ud.phase * 0.35) * 0.22 * smoothHeadT;
            }

            if (ud.mechArms) {
                ud.mechArms.forEach((arm, aIdx) => {
                    const armSwing = isMoving ? Math.sin(ud.phase * 0.75 + (aIdx === 0 ? Math.PI : 0)) * 0.20 * chassisDeployT : 0;
                    arm.shoulder.position.x = arm.side * THREE.MathUtils.lerp(0.50, 0.86, chassisDeployT);
                    arm.shoulder.position.y = THREE.MathUtils.lerp(0.04, 0.36 - isLandingCrouch * 0.06, chassisDeployT);
                    arm.shoulder.position.z = THREE.MathUtils.lerp(-0.08, 0.08, chassisDeployT);
                    arm.shoulder.rotation.x = THREE.MathUtils.lerp(0.0, 0.08 + armSwing + isLandingCrouch * 0.24 - ud.attackAnim * 0.14, chassisDeployT);
                    arm.shoulder.rotation.z = -arm.side * THREE.MathUtils.lerp(0.02, 0.18 + midTransFlare * 0.12, chassisDeployT);
                    arm.forearm.rotation.x = THREE.MathUtils.lerp(0.0, -0.22 - isLandingCrouch * 0.18 - ud.attackAnim * 0.12, chassisDeployT);
                    if (arm.haloPod) {
                        arm.haloPod.scale.setScalar(THREE.MathUtils.lerp(0.65, 1.0, chassisDeployT));
                    }
                });
            }

            if (ud.wingPivots) {
                ud.wingPivots.forEach(wp => {
                    wp.pivot.rotation.y = wp.side * wingFoldT * 0.56;
                    wp.pivot.rotation.z = wp.side * wingFoldT * 0.58;
                    wp.pivot.rotation.x = -wingFoldT * 0.24;
                });
            }
            if (ud.afterburners && ud.afterburners.length > 0) {
                ud.valkThrustTimer = (ud.valkThrustTimer || 0) - dt;
                const isAirborneOrTransforming = (smoothMt < 0.75 || midTransFlare > 0.15);
                if (isAirborneOrTransforming && ud.valkThrustTimer <= 0) {
                    ud.valkThrustTimer = isMoving ? 0.028 : 0.048;
                    const boostScale = 0.85 + (1.0 - smoothMt) * 0.45 + midTransFlare * 0.65;
                    for (let ai = 0; ai < ud.afterburners.length; ai++) {
                        const ab = ud.afterburners[ai];
                        if (ab && ab.node) {
                            emitThrusterExhaustParticles(ab.node, ab.dir, ab.color || 'cyan', (ab.scale || 0.9) * boostScale, isMoving);
                        }
                    }
                }
            }
            if (ud.mechCannons) {
                ud.mechCannons.forEach(mc => {
                    mc.position.z = 0.40 - ud.attackAnim * 0.22;
                });
            }

            function solveTwoBoneIK(targetY, targetZ, L1 = 0.65, L2 = 0.72) {
                const dist = Math.hypot(targetY, targetZ);
                const maxReach = L1 + L2 - 0.005;
                const minReach = Math.abs(L1 - L2) + 0.05;
                const D = Math.max(minReach, Math.min(maxReach, dist));

                const cosKnee = Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2)));
                const internalKnee = Math.acos(cosKnee);
                const kneeAngle = -(Math.PI - internalKnee);

                const baseAngle = Math.atan2(targetZ, -targetY);
                const cosHip = Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)));
                const internalHip = Math.acos(cosHip);
                const hipAngle = baseAngle + internalHip;

                const ankleAngle = -(hipAngle + kneeAngle);
                return { hipAngle, kneeAngle, ankleAngle };
            }

            if (ud.mechLegs) {
                ud.mechLegs.forEach((leg, idx) => {
                    leg.hip.visible = true;
                    leg.hip.position.x = leg.side * THREE.MathUtils.lerp(0.36, 0.46, chassisDeployT);
                    leg.hip.position.y = THREE.MathUtils.lerp(0.08, -0.10, chassisDeployT);
                    leg.hip.position.z = THREE.MathUtils.lerp(-0.28, 0.04, chassisDeployT);

                    const walkPhase = ud.phase * 0.75 + (idx === 0 ? 0 : Math.PI);
                    const strideZ = isMoving ? Math.sin(walkPhase) * 0.46 : 0;
                    const strideLift = isMoving ? Math.max(0, -Math.cos(walkPhase)) * 0.36 : 0;

                    const deployedGroundY = -1.24 + isLandingCrouch * 0.32 + strideLift;
                    const deployedGroundZ = 0.06 + strideZ + midTransFlare * 0.22;

                    const ik = solveTwoBoneIK(deployedGroundY, deployedGroundZ, leg.L1 || 0.65, leg.L2 || 0.72);

                    const flightHipRotX = -Math.PI * 0.5;
                    const flightKneeRotX = -0.04;
                    const flightAnkleRotX = Math.PI * 0.48;

                    if (leg.thigh) leg.thigh.rotation.x = THREE.MathUtils.lerp(flightHipRotX, ik.hipAngle, chassisDeployT);
                    if (leg.knee) leg.knee.rotation.x = THREE.MathUtils.lerp(flightKneeRotX, ik.kneeAngle, chassisDeployT);
                    if (leg.ankle) leg.ankle.rotation.x = THREE.MathUtils.lerp(flightAnkleRotX, ik.ankleAngle, chassisDeployT);
                    leg.hip.rotation.z = isMoving ? Math.cos(walkPhase) * 0.045 * chassisDeployT : 0;
                });
            }
        }
        if (isMoving && ud.vType === 'tank') {
            treadTex.offset.y -= dt * 1.8;
        }

        // GUNSHIP HELICOPTER 360° UNDER-BELLY MINIGUN TURRET HEAD AIMING, SPIN & MUZZLE FLASH
        if (ud.vType === 'heli' && ud.bellyTurret) {
            if (aimTargetPos) {
                const refObj = ud.airframe || mesh;
                const localTarget = refObj.worldToLocal(aimTargetPos.clone());
                const relX = localTarget.x - ud.bellyTurret.position.x;
                const relY = localTarget.y - ud.bellyTurret.position.y;
                const relZ = localTarget.z - ud.bellyTurret.position.z;
                const desiredYaw = Math.atan2(relX, relZ);
                let curYaw = ud.bellyTurret.rotation.y || 0;
                let diff = (desiredYaw - curYaw + Math.PI) % (Math.PI * 2) - Math.PI;
                if (diff < -Math.PI) diff += Math.PI * 2;
                const maxTurn = 14.0 * dt;
                ud.bellyTurret.rotation.y = curYaw + (Math.abs(diff) <= maxTurn ? diff : Math.sign(diff) * maxTurn);

                if (ud.bellyPitchPivot) {
                    const hDist = Math.max(0.5, Math.hypot(relX, relZ));
                    const desiredPitch = Math.atan2(-relY, hDist);
                    const clampedPitch = THREE.MathUtils.clamp(desiredPitch, -0.35, 1.25);
                    ud.bellyPitchPivot.rotation.x = THREE.MathUtils.lerp(ud.bellyPitchPivot.rotation.x, clampedPitch, Math.min(1, dt * 14));
                }
            } else {
                let curYaw = ud.bellyTurret.rotation.y || 0;
                let diff = (0 - curYaw + Math.PI) % (Math.PI * 2) - Math.PI;
                if (diff < -Math.PI) diff += Math.PI * 2;
                ud.bellyTurret.rotation.y = curYaw + diff * Math.min(1, dt * 5);
                if (ud.bellyPitchPivot) ud.bellyPitchPivot.rotation.x = THREE.MathUtils.lerp(ud.bellyPitchPivot.rotation.x, 0.15, Math.min(1, dt * 5));
            }
            if (ud.bellyMinigunCluster) {
                ud.bellyMinigunCluster.rotation.z += dt * (ud.attackAnim > 0.05 ? 48 : 4);
            }
            if (ud.bellyMuzzleFlash) {
                ud.bellyMuzzleFlash.visible = ud.attackAnim > 0.32;
                if (ud.bellyMuzzleFlash.visible) {
                    ud.bellyMuzzleFlash.rotation.z += dt * 42;
                    ud.bellyMuzzleFlash.scale.setScalar(0.88 + Math.random() * 0.48);
                }
            }
        }

        // TANK & STARCRAFT TRANSFORMER SIEGE TANK ANIMATION (EXPANDING TRACK ARMS, ANCHOR CLAWS & UNFOLDING ARTILLERY)
        if ((ud.vType === 'tank' || ud.vType === 'siege_tank') && ud.turret && ud.cannonPivot) {
            if (ud.vType === 'siege_tank') {
                const targetSiege = ud.siegeMode ? 1.0 : 0.0;
                ud.siegeTransition = THREE.MathUtils.lerp(ud.siegeTransition || 0, targetSiege, Math.min(1, dt * 3.8));
                const st = ud.siegeTransition;
                // 3-Stage Transformer Curves:
                // Stage 1 (0..0.5): Hydraulic Arms & 4 Track Pods swing out into an X-stance
                // Stage 2 (0.3..0.8): Outer Anchor Claws slam down into ground & Chassis elevates
                // Stage 3 (0.5..1.0): Turret shoulders open, breech cowl lifts & 180mm Twin Shock-Cannons telescope out
                const stageArm = THREE.MathUtils.smoothstep(st, 0.0, 0.55);
                const stageClaw = THREE.MathUtils.smoothstep(st, 0.30, 0.80);
                const stageCannon = THREE.MathUtils.smoothstep(st, 0.45, 1.0);

                if (ud.chassisBody) {
                    ud.chassisBody.position.y = stageClaw * 0.18;
                }
                if (ud.turretLiftRig) {
                    ud.turretLiftRig.position.y = 0.64 + stageCannon * 0.16;
                }
                if (ud.trackPods) {
                    for (let i = 0; i < ud.trackPods.length; i++) {
                        const tp = ud.trackPods[i];
                        // Swing hydraulic arm outward in an X-configuration & telescope track pod laterally
                        tp.armPivot.rotation.y = tp.sx * tp.sz * (-0.52 * stageArm);
                        tp.armPivot.position.x = tp.baseArmX + tp.sx * (0.26 * stageArm);
                        tp.armPivot.position.z = tp.baseArmZ + tp.sz * (0.18 * stageArm);
                        tp.podGroup.position.x = tp.basePodX + tp.sx * (0.28 * stageArm);
                        tp.podGroup.rotation.y = tp.sx * tp.sz * (0.18 * stageArm);
                        if (tp.chromePiston) {
                            tp.chromePiston.scale.y = 1.0 + stageArm * 0.75;
                        }
                        if (tp.anchorClaw) {
                            tp.anchorClaw.position.y = THREE.MathUtils.lerp(0.32, 0.04, stageClaw);
                            tp.anchorClaw.rotation.z = tp.sx * THREE.MathUtils.lerp(0.45, -0.12, stageClaw);
                        }
                    }
                }
                if (ud.shoulderWings) {
                    for (let i = 0; i < ud.shoulderWings.length; i++) {
                        const sw = ud.shoulderWings[i];
                        sw.wingPivot.position.x = sw.sx * (0.52 + stageCannon * 0.16);
                        sw.wingPivot.rotation.z = -sw.sx * stageCannon * 0.26;
                    }
                }
                if (ud.breechUpperCowl) {
                    ud.breechUpperCowl.position.y = 0.14 + stageCannon * 0.12;
                    ud.breechUpperCowl.rotation.x = -stageCannon * 0.18;
                }
                if (ud.siegeBarrelExt) {
                    ud.siegeBarrelExt.position.z = stageCannon * 0.42;
                }
                if (ud.radarDish) {
                    ud.radarDish.rotation.y += dt * (ud.siegeMode ? 4.8 : 1.5);
                }
            }

            const st = ud.vType === 'siege_tank' ? (ud.siegeTransition || 0) : 0;
            const siegePitchOffset = -0.36 * st;
            if (aimTargetPos) {
                const localTarget = mesh.worldToLocal(aimTargetPos.clone());
                const desiredYaw = Math.atan2(localTarget.x, localTarget.z);
                let diff = (desiredYaw - ud.turretYaw + Math.PI) % (Math.PI * 2) - Math.PI;
                if (diff < -Math.PI) diff += Math.PI * 2;
                const maxStep = (ud.siegeMode ? 3.4 : 4.6) * dt;
                ud.turretYaw += Math.abs(diff) <= maxStep ? diff : Math.sign(diff) * maxStep;
                ud.turret.rotation.y = ud.turretYaw;

                const horizDist = Math.max(1.0, Math.hypot(localTarget.x, localTarget.z));
                const desiredPitch = -Math.atan2(localTarget.y - 0.65, horizDist) + siegePitchOffset;
                const clampedPitch = THREE.MathUtils.clamp(desiredPitch, -0.65, 0.35);
                ud.cannonPivot.rotation.x = THREE.MathUtils.lerp(ud.cannonPivot.rotation.x, clampedPitch, dt * 8);
            } else {
                ud.turretYaw = THREE.MathUtils.lerp(ud.turretYaw, 0, dt * 3);
                ud.turret.rotation.y = ud.turretYaw;
                ud.cannonPivot.rotation.x = THREE.MathUtils.lerp(ud.cannonPivot.rotation.x, siegePitchOffset, dt * 5);
            }

            const baseBarrelZ = ud.vType === 'siege_tank' ? 0.16 : 0.14;
            if (ud.recoilBarrel) {
                ud.recoilBarrel.position.z = baseBarrelZ - ud.attackAnim * (ud.siegeMode ? 0.52 : 0.38);
            } else {
                ud.cannonPivot.position.z = 0.45 - ud.attackAnim * 0.22;
            }
            const baseTurretY = ud.vType === 'siege_tank' ? 0.04 : 0.63;
            if (ud.attackAnim > 0.05) {
                ud.turret.position.y = baseTurretY - ud.attackAnim * 0.045;
                ud.turret.rotation.x = -ud.attackAnim * 0.04;
            } else {
                ud.turret.position.y = baseTurretY;
                ud.turret.rotation.x = 0;
            }
        }
        return;
    }

    if (ud.isBug) {
        // ENEMY BEHEMOTH SHOOT ANIMATION WHILE MARCHING
        if (ud.variant === 'behemoth' && ud.dorsalCannons && ud.dorsalCannons.length > 0) {
            const rec = ud.attackAnim * 0.28;
            ud.dorsalCannons.forEach(c => {
                c.position.z = c.userData.baseZ - rec;
                c.rotation.x = c.userData.baseRotX - rec * 0.45;
            });
        }
        // --- FLYING MUTALISK SKY-LEVIATHAN ANIMATION (Dual-Jointed Wing Camber, 5-Segment Prehensile Tail Whip & Breathing Bio-Heart) ---
        if (ud.variant === 'mutalisk') {
            ud.phase += dt * (isMoving ? 14.5 : 9.8);
            const sinP = Math.sin(ud.phase);
            const cosP = Math.cos(ud.phase);
            const flapAmp = isMoving ? 0.62 : 0.44;
            const innerFlap = sinP * flapAmp;
            // Outer wing phalanges lag behind humerus by ~55 degrees for authentic dragon/bat figure-8 downstroke camber & upstroke fold!
            const outerFlap = Math.sin(ud.phase - 0.95) * (isMoving ? 0.74 : 0.52);
            const sweep = cosP * 0.20;

            if (ud.wingL && ud.wingR) {
                ud.wingL.rotation.z = -innerFlap;
                ud.wingL.rotation.y = sweep;
                ud.wingL.rotation.x = cosP * 0.14;
                ud.wingR.rotation.z = innerFlap;
                ud.wingR.rotation.y = -sweep;
                ud.wingR.rotation.x = cosP * 0.14;
            }
            if (ud.outerWingL && ud.outerWingR) {
                ud.outerWingL.rotation.z = -outerFlap;
                ud.outerWingL.rotation.y = Math.sin(ud.phase - 0.6) * 0.18;
                ud.outerWingR.rotation.z = outerFlap;
                ud.outerWingR.rotation.y = -Math.sin(ud.phase - 0.6) * 0.18;
            }
            // 5-Segment Prehensile Glaive-Wurm Tail: sinusoidal traveling wave + violent forward scorpion-whip when spitting!
            if (ud.tailSegments && ud.tailSegments.length > 0) {
                const whipStrike = Math.sin(ud.attackAnim * Math.PI);
                ud.tailSegments.forEach(seg => {
                    const wavePitch = Math.sin(ud.phase - seg.idx * 0.65) * (0.14 + seg.idx * 0.04);
                    const waveYaw = Math.cos(ud.phase * 0.55 - seg.idx * 0.5) * (0.08 + seg.idx * 0.03);
                    const attackBend = whipStrike * (0.28 + seg.idx * 0.14);
                    seg.pivot.rotation.x = seg.basePitch + wavePitch + attackBend;
                    seg.pivot.rotation.y = waveYaw;
                });
            } else if (ud.tailGroup) {
                ud.tailGroup.rotation.x = Math.sin(ud.phase - 1.1) * 0.28 + ud.attackAnim * 0.65;
                ud.tailGroup.rotation.y = Math.cos(ud.phase * 0.6) * 0.22;
            }
            if (ud.abdomen) {
                ud.abdomen.scale.setScalar(1.0 + Math.sin(ud.phase * 0.9) * 0.08 + ud.attackAnim * 0.14);
            }
            if (ud.bioHeart) {
                ud.bioHeart.scale.setScalar(1.0 + Math.sin(ud.phase * 1.8) * 0.15 + ud.attackAnim * 0.25);
            }
            if (ud.mandL && ud.mandR) {
                const snap = Math.sin(ud.phase * 1.4) * 0.18 + ud.attackAnim * 0.62;
                ud.mandL.rotation.y = 0.28 - snap;
                ud.mandR.rotation.y = -0.28 + snap;
            }
            if (ud.scytheL && ud.scytheR) {
                const clawFlex = Math.sin(ud.phase - 0.5) * 0.22 + ud.attackAnim * 0.55;
                ud.scytheL.rotation.x = clawFlex;
                ud.scytheR.rotation.x = clawFlex;
            }
            ud.bodyGroup.position.y = sinP * -0.15;
            ud.bodyGroup.rotation.x = (isMoving ? 0.18 : 0.05) + cosP * 0.06 + ud.attackAnim * 0.34;
            ud.bodyGroup.rotation.z = Math.sin(ud.phase * 0.5) * 0.05;
            return;
        }

        ud.phase += dt * (isMoving ? 15.5 : 3.6);
        const unitScale = mesh.scale.x || 1.0;
        const unitYaw = mesh.rotation.y || 0;
        const cosY = Math.cos(unitYaw), sinY = Math.sin(unitYaw);
        const fwdX = sinY, fwdZ = cosY;
        const rightX = cosY, rightZ = -sinY;

        ud.legs.forEach(l => {
            const L1 = l.L1 || 0.33;
            const L2 = l.L2 || 0.46;

            const localRestX = l.side * 0.58 * unitScale;
            const localRestZ = (l.zOff * 1.42) * unitScale;
            const idealWorldX = mesh.position.x + rightX * localRestX + fwdX * localRestZ;
            const idealWorldZ = mesh.position.z + rightZ * localRestX + fwdZ * localRestZ;
            const groundY = mesh.position.y;

            if (!l.footWorldPos) {
                l.footWorldPos = new THREE.Vector3(idealWorldX, groundY, idealWorldZ);
                l.stepStartPos = l.footWorldPos.clone();
                l.stepTargetPos = l.footWorldPos.clone();
                l.stepProgress = 1.0;
            }

            const gaitWave = Math.sin(ud.phase + (l.tripodGroup ? Math.PI : 0) + l.idx * 0.55);
            const distFromIdeal = Math.hypot(l.footWorldPos.x - idealWorldX, l.footWorldPos.z - idealWorldZ);
            const stepThreshold = (isMoving ? 0.24 : 0.08) * unitScale;

            if (l.stepProgress >= 1.0 && distFromIdeal > stepThreshold && (gaitWave > 0 || distFromIdeal > stepThreshold * 1.85)) {
                l.stepStartPos.copy(l.footWorldPos);
                const leadDist = (isMoving ? 0.22 : 0.0) * unitScale;
                const targetX = idealWorldX + fwdX * leadDist;
                const targetZ = idealWorldZ + fwdZ * leadDist;
                const targetY = (typeof getSurfaceHeightWithBridges === 'function')
                    ? getSurfaceHeightWithBridges(targetX, targetZ)
                    : groundY;
                l.stepTargetPos.set(targetX, targetY, targetZ);
                l.stepProgress = 0.0;
            }

            if (l.stepProgress < 1.0) {
                l.stepProgress = Math.min(1.0, l.stepProgress + dt * (isMoving ? 9.5 : 5.0));
                const s = l.stepProgress * l.stepProgress * (3.0 - 2.0 * l.stepProgress);
                l.footWorldPos.lerpVectors(l.stepStartPos, l.stepTargetPos, s);
                const stepArcHeight = Math.sin(l.stepProgress * Math.PI) * (isMoving ? 0.22 : 0.05) * unitScale;
                l.footWorldPos.y += stepArcHeight;
            } else if (!isMoving) {
                l.footWorldPos.x += (idealWorldX - l.footWorldPos.x) * Math.min(1, dt * 4.0);
                l.footWorldPos.z += (idealWorldZ - l.footWorldPos.z) * Math.min(1, dt * 4.0);
                l.footWorldPos.y = groundY;
            }

            const dxWorld = (l.footWorldPos.x - mesh.position.x) / unitScale;
            const dyWorld = (l.footWorldPos.y - mesh.position.y) / unitScale;
            const dzWorld = (l.footWorldPos.z - mesh.position.z) / unitScale;

            const localX = dxWorld * rightX + dzWorld * rightZ;
            const localZ = dxWorld * fwdX + dzWorld * fwdZ;
            const localY = dyWorld;

            const hipX = l.side * 0.25;
            const hipY = 0.36;
            const hipZ = l.zOff;

            const relX = localX - hipX;
            const relY = localY - hipY;
            const relZ = localZ - hipZ;

            const horizReach = Math.max(0.08, Math.hypot(relX, relZ));
            const yawAngle = Math.atan2(relZ, Math.abs(relX)) * -l.side;
            l.pivot.rotation.y = THREE.MathUtils.clamp(yawAngle, -0.78, 0.78);

            const reachDist = THREE.MathUtils.clamp(Math.hypot(horizReach, relY), 0.14, (L1 + L2) * 0.96);
            const targetElevation = Math.atan2(relY, horizReach);

            const cosHipInterior = THREE.MathUtils.clamp(
                (L1 * L1 + reachDist * reachDist - L2 * L2) / (2.0 * L1 * reachDist),
                -0.98, 0.98
            );
            const hipInteriorAngle = Math.acos(cosHipInterior);

            const cosKneeInterior = THREE.MathUtils.clamp(
                (L1 * L1 + L2 * L2 - reachDist * reachDist) / (2.0 * L1 * L2),
                -0.98, 0.98
            );
            const kneeInteriorAngle = Math.acos(cosKneeInterior);

            const solvedFemurLift = (targetElevation + hipInteriorAngle) - 0.32;
            const solvedKneeFlex = (Math.PI - kneeInteriorAngle) - 1.15;

            if (l.femurPivot && l.kneePivot) {
                l.femurPivot.rotation.z = THREE.MathUtils.clamp(solvedFemurLift, -0.55, 0.72) * l.side;
                l.kneePivot.rotation.z = THREE.MathUtils.clamp(-solvedKneeFlex, -0.85, 0.65) * l.side;
            } else {
                l.pivot.rotation.z = THREE.MathUtils.clamp(solvedFemurLift, -0.45, 0.65) * l.side;
            }
        });
        const pulse = 1 + Math.sin(ud.phase * 0.8) * (ud.variant === 'burster' ? 0.16 : 0.07);
        ud.abdomen.scale.setScalar(pulse);
        const snap = Math.sin(ud.phase * 1.5) * 0.2 + ud.attackAnim * 0.65;
        ud.mandL.rotation.y = -snap;
        ud.mandR.rotation.y = snap;
        if (ud.scytheL && ud.scytheR) {
            const slash = Math.sin(ud.attackAnim * Math.PI) * 0.85 + Math.sin(ud.phase) * (isMoving ? 0.22 : 0.05);
            ud.scytheL.rotation.x = slash;
            ud.scytheL.rotation.y = -slash * 0.4;
            ud.scytheR.rotation.x = slash;
            ud.scytheR.rotation.y = slash * 0.4;
        }
        if (ud.tailCatapult) {
            const whip = Math.sin(ud.attackAnim * Math.PI);
            ud.tailCatapult.rotation.x = Math.sin(ud.phase * 0.7) * 0.12 + whip * 0.78;
            ud.tailCatapult.rotation.y = Math.cos(ud.phase * 0.5) * 0.14;
            if (ud.bileSac) {
                ud.bileSac.scale.setScalar(1.0 + Math.sin(ud.phase * 1.6) * 0.12 + whip * 0.35);
            }
        }
        ud.bodyGroup.position.z = ud.attackAnim * 0.38;
        ud.bodyGroup.position.y = Math.abs(Math.sin(ud.phase)) * (isMoving ? 0.075 : 0.02);
        ud.bodyGroup.rotation.z = isMoving ? Math.sin(ud.phase * 0.5) * 0.06 : 0;
        ud.bodyGroup.rotation.x = isMoving ? 0.06 + Math.cos(ud.phase) * 0.03 : 0;
    } else if (ud.isSolaris) {
        ud.phase += dt * (isMoving ? 13.0 : 3.4);
        if (ud.role === 'stalker') {
            if (ud.coreCrystal) ud.coreCrystal.rotation.y += dt * 2.8;
            if (ud.stalkerLegs) {
                ud.stalkerLegs.forEach(l => {
                    const wave = Math.sin(ud.phase + l.idx * Math.PI * 0.5);
                    l.pivot.rotation.x = isMoving ? wave * 0.42 : 0;
                    l.pivot.rotation.z = isMoving ? Math.max(0, -wave) * 0.24 * l.side : 0;
                });
            }
            if (ud.bodyGroup) {
                ud.bodyGroup.position.y = 0.56 + Math.sin(ud.phase * 1.2) * 0.04;
                ud.bodyGroup.position.z = -ud.attackAnim * 0.16;
            }
            return;
        }
        if (ud.role === 'archon') {
            if (ud.coreSphere) {
                ud.coreSphere.rotation.y += dt * 2.5;
                ud.coreSphere.rotation.x += dt * 1.4;
                const pulse = 1.0 + Math.sin(ud.phase * 1.6) * 0.12 + ud.attackAnim * 0.28;
                ud.coreSphere.scale.setScalar(pulse);
            }
            if (ud.ringOuter) {
                ud.ringOuter.rotation.z += dt * 3.2;
                ud.ringOuter.rotation.x = Math.sin(ud.phase * 0.7) * 0.65;
            }
            if (ud.ringInner) {
                ud.ringInner.rotation.y -= dt * 4.1;
                ud.ringInner.rotation.z = Math.cos(ud.phase * 0.9) * 0.65;
            }
            if (ud.bodyGroup) {
                ud.bodyGroup.position.y = 1.08 + Math.sin(ud.phase * 0.9) * 0.12;
            }
            return;
        }
        // Chrono-Zealot multi-joint stride animation
        if (ud.solarHalo) ud.solarHalo.rotation.z += dt * 2.6;
        if (isMoving && ud.legL && ud.legR) {
            const cL = ud.phase;
            const cR = ud.phase + Math.PI;
            const sL = Math.sin(cL) * 0.74;
            const lL = Math.max(0, Math.cos(cL));
            const sR = Math.sin(cR) * 0.74;
            const lR = Math.max(0, Math.cos(cR));
            ud.legL.hip.rotation.x = sL - lL * 0.32;
            ud.legL.hip.rotation.z = Math.sin(cL) * 0.05;
            if (ud.legL.knee) ud.legL.knee.rotation.x = lL * 1.18 + Math.max(0, -sL * 0.38);
            ud.legR.hip.rotation.x = sR - lR * 0.32;
            ud.legR.hip.rotation.z = Math.sin(cR) * 0.05;
            if (ud.legR.knee) ud.legR.knee.rotation.x = lR * 1.18 + Math.max(0, -sR * 0.38);
            ud.upperBody.position.y = 0.52 + Math.abs(Math.sin(ud.phase)) * 0.065;
            ud.upperBody.rotation.z = Math.cos(ud.phase) * 0.055;
            ud.upperBody.rotation.x = 0.12;
        } else if (ud.legL && ud.legR) {
            ud.legL.hip.rotation.x = THREE.MathUtils.lerp(ud.legL.hip.rotation.x, 0, dt * 10);
            ud.legR.hip.rotation.x = THREE.MathUtils.lerp(ud.legR.hip.rotation.x, 0, dt * 10);
            if (ud.legL.knee) ud.legL.knee.rotation.x = THREE.MathUtils.lerp(ud.legL.knee.rotation.x, 0, dt * 10);
            if (ud.legR.knee) ud.legR.knee.rotation.x = THREE.MathUtils.lerp(ud.legR.knee.rotation.x, 0, dt * 10);
            ud.upperBody.rotation.z = THREE.MathUtils.lerp(ud.upperBody.rotation.z || 0, 0, dt * 10);
            ud.upperBody.rotation.x = THREE.MathUtils.lerp(ud.upperBody.rotation.x || 0, 0, dt * 10);
        }
        const slash = Math.sin(ud.attackAnim * Math.PI);
        if (ud.shoulderR && ud.shoulderL) {
            const armStride = isMoving ? Math.sin(ud.phase) * 0.32 : 0;
            ud.shoulderR.rotation.x = -0.55 + armStride - slash * 1.15;
            ud.shoulderL.rotation.x = -0.55 - armStride - Math.sin(ud.attackAnim * Math.PI * 0.8) * 0.95;
            ud.upperBody.rotation.y = (isMoving ? -Math.sin(ud.phase) * 0.12 : 0) + slash * 0.45;
        }
    } else {
        // ============================================================================
        // REALISTIC TERRAN BIPEDAL 2-BONE LEG IK, 3-AXIS IK HIPS, DUAL-ARM GUN IK
        // ATTACHMENT & ANATOMICAL HEAD TARGET TRACKING
        // ============================================================================
        const isHeavyExo = ud.role === 'marauder' || ud.role === 'firebat' || ud.role === 'hero';
        const walkFreq = isHeavyExo ? 9.4 : (ud.role === 'reaper' || ud.role === 'grunt' ? 12.8 : 11.2);
        ud.phase += dt * (isMoving ? walkFreq : 2.4);

        if (ud.heroCoreRing) ud.heroCoreRing.rotation.z += dt * 4.5;
        if (ud.heroWings) ud.heroWings.position.y = 0.36 + Math.sin(ud.phase * 0.8) * 0.025;
        if (ud.heroWeapon && ud.heroWeapon.userData && ud.heroWeapon.userData.fusionDrum) {
            ud.heroWeapon.userData.fusionDrum.rotation.x += dt * (ud.attackAnim > 0.05 ? 24 : 3.5);
        }

        // Compute Local Enemy Aim Vector (Azimuth & Elevation) for Realistic Aiming & Head Look-At
        let hasAimTarget = false;
        let aimYaw = 0;
        let aimPitch = 0;
        if (aimTargetPos) {
            const localAim = mesh.worldToLocal(aimTargetPos.clone());
            const horizDist = Math.hypot(localAim.x, localAim.z);
            if (horizDist > 0.05) {
                hasAimTarget = true;
                aimYaw = THREE.MathUtils.clamp(Math.atan2(localAim.x, Math.max(0.25, localAim.z)), -1.15, 1.15);
                aimPitch = THREE.MathUtils.clamp(-Math.atan2(localAim.y - 0.72, horizDist), -0.65, 0.65);
            }
        }

        // Analytical 2-Bone Humanoid Leg IK Solver (Thigh L1=0.20, Shin L2=0.20) with Heel-Strike & Toe-Off Ankle
        function solveHumanoidLegIK(footZ, footY, gaitPhase) {
            const L1 = 0.20, L2 = 0.20;
            const d = THREE.MathUtils.clamp(Math.hypot(footZ, footY), 0.12, 0.398);
            const basePitch = Math.atan2(footZ, -footY);
            const cosHip = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -0.99, 0.99);
            const cosKnee = THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -0.99, 0.99);
            const hipAngle = -(basePitch + Math.acos(cosHip));
            const kneeAngle = Math.PI - Math.acos(cosKnee);
            // Heel-strike dorsiflexion on forward contact (sin > 0) + plantarflexion push on toe-off (sin < 0)
            const heelToeWave = Math.sin(gaitPhase) * 0.24 - Math.max(0, Math.cos(gaitPhase)) * 0.18;
            const ankleAngle = -(hipAngle + kneeAngle) * 0.65 - heelToeWave;
            return { hipAngle, kneeAngle, ankleAngle };
        }

        const headNode = ud.headGroup || ud.head;

        if (ud.role === 'reaper') {
            // ============================================================================
            // AIRBORNE JUMP-JET REAPER FLIGHT POSE & DYNAMIC TWIN THRUSTER PARTICLE TRAILS
            // Reapers fly/hover on twin jump-jets instead of walking on the ground!
            // ============================================================================
            const hoverBob = Math.sin(ud.phase * 1.25) * 0.065;
            const hoverSway = Math.cos(ud.phase * 0.85) * 0.035;
            const flightPitch = isMoving ? 0.32 : (hasAimTarget ? 0.14 : 0.08);

            if (ud.pelvisGroup) {
                ud.pelvisGroup.position.set(hoverSway * 0.4, 0.42 + hoverBob, 0);
                ud.pelvisGroup.rotation.set(flightPitch * 0.65, Math.sin(ud.phase * 0.6) * 0.06, -hoverSway * 0.8);
            }

            // Airborne Jump-Jet Leg Tuck (One knee slightly raised, boots angled downward in thruster flight stance)
            const legSwayL = Math.sin(ud.phase * 1.1) * 0.10;
            const legSwayR = Math.cos(ud.phase * 1.1) * 0.10;
            ud.legL.hip.rotation.x = THREE.MathUtils.lerp(ud.legL.hip.rotation.x || 0, -0.34 + (isMoving ? 0.22 : 0) + legSwayL, dt * 10);
            ud.legL.hip.rotation.z = -0.08;
            ud.legL.knee.rotation.x = THREE.MathUtils.lerp(ud.legL.knee.rotation.x || 0, 0.78 + legSwayL * 0.5, dt * 10);
            if (ud.legL.ankle) ud.legL.ankle.rotation.x = 0.38;

            ud.legR.hip.rotation.x = THREE.MathUtils.lerp(ud.legR.hip.rotation.x || 0, -0.12 + (isMoving ? 0.28 : 0) + legSwayR, dt * 10);
            ud.legR.hip.rotation.z = 0.08;
            ud.legR.knee.rotation.x = THREE.MathUtils.lerp(ud.legR.knee.rotation.x || 0, 0.52 + legSwayR * 0.5, dt * 10);
            if (ud.legR.ankle) ud.legR.ankle.rotation.x = 0.34;

            ud.upperBody.position.y = 0.52 + hoverBob;
            ud.upperBody.position.x = hoverSway * 0.35;
            ud.upperBody.rotation.x = THREE.MathUtils.lerp(ud.upperBody.rotation.x || 0, flightPitch - ud.attackAnim * 0.10, dt * 12);
            ud.upperBody.rotation.z = -hoverSway * 0.75;

            // Emit continuous 3D jump-jet thrust particles from both canted turbine nozzles
            if (ud.reaperNozzles && ud.reaperNozzles.length > 0) {
                ud.reaperJetTimer = (ud.reaperJetTimer || 0) - dt;
                if (ud.reaperJetTimer <= 0) {
                    ud.reaperJetTimer = isMoving ? 0.026 : 0.045;
                    for (let ni = 0; ni < ud.reaperNozzles.length; ni++) {
                        const rn = ud.reaperNozzles[ni];
                        if (rn && rn.node) {
                            emitThrusterExhaustParticles(rn.node, rn.dir, 'amber', isMoving ? 0.78 : 0.62, isMoving);
                        }
                    }
                }
            }
        } else if (isMoving) {
            const cycleL = ud.phase;
            const cycleR = ud.phase + Math.PI;
            const strideLen = isHeavyExo ? 0.19 : 0.22;
            const stepHeight = isHeavyExo ? 0.11 : 0.135;

            // Foot trajectory in pelvis-local space (elliptical swing arc + stance ground contact with mid-stance compression)
            const swingL = Math.max(0, Math.cos(cycleL));
            const stanceL = Math.max(0, -Math.cos(cycleL));
            const footZL = Math.sin(cycleL) * strideLen;
            const footYL = -0.385 + swingL * stepHeight + stanceL * 0.024;

            const swingR = Math.max(0, Math.cos(cycleR));
            const stanceR = Math.max(0, -Math.cos(cycleR));
            const footZR = Math.sin(cycleR) * strideLen;
            const footYR = -0.385 + swingR * stepHeight + stanceR * 0.024;

            const ikL = solveHumanoidLegIK(footZL, footYL, cycleL);
            const ikR = solveHumanoidLegIK(footZR, footYR, cycleR);

            // 1. 3-Axis IK Hips (Pelvis Group): Vertical gait drop, lateral weight-shift over planted foot, pelvic roll & counter-yaw twist!
            const hipDrop = -Math.cos(ud.phase * 2.0) * (isHeavyExo ? 0.026 : 0.022);
            const hipLateralShift = -Math.sin(ud.phase) * (isHeavyExo ? 0.030 : 0.024);
            const pelvicRoll = Math.sin(ud.phase) * (isHeavyExo ? 0.075 : 0.062);
            const pelvicYaw = Math.cos(ud.phase) * (isHeavyExo ? 0.11 : 0.14);
            const pelvicPitch = 0.05 + Math.sin(ud.phase * 2.0) * 0.028;

            if (ud.pelvisGroup) {
                ud.pelvisGroup.position.set(hipLateralShift, 0.40 + hipDrop, 0);
                ud.pelvisGroup.rotation.set(pelvicPitch, pelvicYaw, pelvicRoll);
            }

            ud.legL.hip.rotation.x = ikL.hipAngle - pelvicPitch;
            ud.legL.hip.rotation.z = -pelvicRoll * 0.75 + Math.sin(cycleL) * 0.032;
            ud.legL.knee.rotation.x = ikL.kneeAngle;
            if (ud.legL.ankle) ud.legL.ankle.rotation.x = ikL.ankleAngle;

            ud.legR.hip.rotation.x = ikR.hipAngle - pelvicPitch;
            ud.legR.hip.rotation.z = -pelvicRoll * 0.75 + Math.sin(cycleR) * 0.032;
            ud.legR.knee.rotation.x = ikR.kneeAngle;
            if (ud.legR.ankle) ud.legR.ankle.rotation.x = ikR.ankleAngle;

            // 2. Upper Body Tactical March & Counter-Balance Posture
            const combatLean = hasAimTarget
                ? THREE.MathUtils.clamp(0.11 + aimPitch * 0.38, -0.22, 0.38)
                : ((ud.role === 'grunt' || ud.role === 'reaper') ? 0.16 : 0.11);
            ud.upperBody.position.y = 0.50 + hipDrop + Math.abs(Math.sin(ud.phase)) * 0.018;
            ud.upperBody.position.x = hipLateralShift * 0.55;
            ud.upperBody.rotation.x = THREE.MathUtils.lerp(ud.upperBody.rotation.x || 0, combatLean - ud.attackAnim * 0.08, Math.min(1, dt * 12));
            ud.upperBody.rotation.z = -pelvicRoll * 0.65;
        } else {
            // Slope-Adaptive Planted IK Stance + Ready-Aim Weight Shift
            // Optimization: sample terrain slope at most every 0.25s when idle instead of allocating 2 Vector3s every frame!
            ud.idleSlopeTimer = (ud.idleSlopeTimer || 0) - dt;
            if (ud.cachedHDiff === undefined || ud.idleSlopeTimer <= 0) {
                ud.idleSlopeTimer = 0.25;
                const cosY = Math.cos(mesh.rotation.y || 0);
                const sinY = Math.sin(mesh.rotation.y || 0);
                const lx = mesh.position.x - 0.14 * cosY;
                const lz = mesh.position.z + 0.14 * sinY;
                const rx = mesh.position.x + 0.14 * cosY;
                const rz = mesh.position.z - 0.14 * sinY;
                ud.cachedHDiff = THREE.MathUtils.clamp(getTerrainHeight(lx, lz) - getTerrainHeight(rx, rz), -0.22, 0.22);
            }
            const hDiff = ud.cachedHDiff || 0;

            const ikStanceL = solveHumanoidLegIK(0.03, -0.39 + Math.max(0, hDiff * 0.45), 0);
            const ikStanceR = solveHumanoidLegIK(-0.03, -0.39 + Math.max(0, -hDiff * 0.45), Math.PI);
            const idleBreath = Math.sin(ud.phase) * 0.012;

            if (ud.pelvisGroup) {
                ud.pelvisGroup.position.x = THREE.MathUtils.lerp(ud.pelvisGroup.position.x || 0, hasAimTarget ? -0.015 : 0, dt * 10);
                ud.pelvisGroup.position.y = THREE.MathUtils.lerp(ud.pelvisGroup.position.y || 0.40, 0.395 + idleBreath * 0.5, dt * 10);
                ud.pelvisGroup.rotation.x = THREE.MathUtils.lerp(ud.pelvisGroup.rotation.x || 0, hasAimTarget ? 0.04 : 0, dt * 10);
                ud.pelvisGroup.rotation.y = THREE.MathUtils.lerp(ud.pelvisGroup.rotation.y || 0, hasAimTarget ? -0.16 : 0, dt * 10);
                ud.pelvisGroup.rotation.z = THREE.MathUtils.lerp(ud.pelvisGroup.rotation.z || 0, hDiff * 0.35, dt * 10);
            }

            ud.legL.hip.rotation.x = THREE.MathUtils.lerp(ud.legL.hip.rotation.x, ikStanceL.hipAngle, dt * 10);
            ud.legL.hip.rotation.z = THREE.MathUtils.lerp(ud.legL.hip.rotation.z || 0, -0.03, dt * 10);
            ud.legL.knee.rotation.x = THREE.MathUtils.lerp(ud.legL.knee.rotation.x, ikStanceL.kneeAngle, dt * 10);
            if (ud.legL.ankle) ud.legL.ankle.rotation.x = THREE.MathUtils.lerp(ud.legL.ankle.rotation.x || 0, ikStanceL.ankleAngle, dt * 10);

            ud.legR.hip.rotation.x = THREE.MathUtils.lerp(ud.legR.hip.rotation.x, ikStanceR.hipAngle, dt * 10);
            ud.legR.hip.rotation.z = THREE.MathUtils.lerp(ud.legR.hip.rotation.z || 0, 0.03, dt * 10);
            ud.legR.knee.rotation.x = THREE.MathUtils.lerp(ud.legR.knee.rotation.x, ikStanceR.kneeAngle, dt * 10);
            if (ud.legR.ankle) ud.legR.ankle.rotation.x = THREE.MathUtils.lerp(ud.legR.ankle.rotation.x || 0, ikStanceR.ankleAngle, dt * 10);

            const targetBodyPitch = hasAimTarget ? THREE.MathUtils.clamp(aimPitch * 0.35 + 0.04, -0.25, 0.32) - ud.attackAnim * 0.09 : 0.02;
            ud.upperBody.position.y = 0.495 + idleBreath;
            ud.upperBody.position.x = THREE.MathUtils.lerp(ud.upperBody.position.x || 0, 0, dt * 10);
            ud.upperBody.rotation.x = THREE.MathUtils.lerp(ud.upperBody.rotation.x || 0, targetBodyPitch, dt * 10);
            ud.upperBody.rotation.z = THREE.MathUtils.lerp(ud.upperBody.rotation.z || 0, 0, dt * 10);
        }

        // 3. Arm & Weapon Aiming Kinematics + Dual-Arm Rifle Foregrip IK Attachment
        const isTwoHandRifle = (ud.role === 'marine' || ud.role === 'ranger' || ud.role === 'plasma' || ud.role === 'sniper' || ud.role === 'rocketman' || ud.role === 'hero' || !ud.role);
        const gaitSway = isMoving ? Math.sin(ud.phase) * 0.085 : Math.sin(ud.phase) * 0.015;
        const torsoCounterTwist = isMoving ? -Math.cos(ud.phase) * 0.11 : 0;

        if (ud.role === 'grunt') {
            const slash = Math.sin(ud.attackAnim * Math.PI);
            const armCounterSwing = isMoving ? Math.sin(ud.phase) * 0.34 : 0;
            const targetTorsoYaw = (hasAimTarget ? aimYaw * 0.45 : torsoCounterTwist) + slash * 0.55;
            ud.upperBody.rotation.y = THREE.MathUtils.lerp(ud.upperBody.rotation.y || 0, targetTorsoYaw, Math.min(1, dt * 14));
            ud.shoulderR.rotation.x = -0.48 - slash * 0.95 + armCounterSwing + (hasAimTarget ? aimPitch * 0.5 : 0);
            ud.elbowR.rotation.x = -0.88 + slash * 1.35 - Math.max(0, armCounterSwing) * 0.25;
            if (ud.shoulderL) {
                ud.shoulderL.rotation.set(-0.52 - armCounterSwing * 0.65, 0.35, 0);
                ud.elbowL.rotation.set(-0.90, 0, 0);
            }
        } else if (isTwoHandRifle) {
            // Bladed tactical shooting stance: torso turns slightly (-0.16 rad) while aiming toward enemy azimuth & elevation!
            const aimStanceWeight = (hasAimTarget || ud.attackAnim > 0.01) ? 1.0 : 0.45;
            const desiredTorsoYaw = hasAimTarget
                ? THREE.MathUtils.clamp(aimYaw * 0.58 - 0.14, -0.78, 0.78)
                : (torsoCounterTwist - 0.10);
            ud.upperBody.rotation.y = THREE.MathUtils.lerp(ud.upperBody.rotation.y || 0, desiredTorsoYaw, Math.min(1, dt * 14));

            const residualYaw = hasAimTarget ? THREE.MathUtils.clamp(aimYaw - ud.upperBody.rotation.y, -0.55, 0.55) : 0;
            const weaponPitch = hasAimTarget ? THREE.MathUtils.clamp(aimPitch - ud.upperBody.rotation.x, -0.55, 0.55) : 0;
            const recoilKick = ud.attackAnim * (ud.role === 'hero' ? 0.28 : (ud.role === 'sniper' || ud.role === 'rocketman' ? 0.26 : 0.19));

            // Right Arm (Trigger & Shoulder-Stock Arm): raises rifle to shoulder eye-line when aiming, absorbs recoil kick
            const rShoulderPitch = THREE.MathUtils.lerp(-0.56, -0.74, aimStanceWeight) + weaponPitch * 0.72 - recoilKick + gaitSway * 0.65;
            const rShoulderYaw = -0.14 + residualYaw * 0.65;
            const rElbowPitch = THREE.MathUtils.lerp(-1.02, -0.84, aimStanceWeight) + weaponPitch * 0.28 + recoilKick * 0.55;

            ud.shoulderR.rotation.set(rShoulderPitch, rShoulderYaw, -0.05);
            ud.elbowR.rotation.set(rElbowPitch, 0.08, 0);

            // Left Support Arm IK: Solves shoulderL & elbowL so the left hand stays physically locked onto the weapon's foregrip/barrel shroud!
            // Compute where the rifle foregrip sits in upperBody coordinates given shoulderR + elbowR rotations
            const foregripForwardZ = 0.36 - recoilKick * 0.14;
            const foregripY = 0.12 - Math.sin(rShoulderPitch + rElbowPitch * 0.55) * 0.24 - weaponPitch * 0.22;
            const foregripX = 0.08 + Math.sin(rShoulderYaw) * 0.28;

            // Vector from Left Shoulder (-0.31, 0.36, 0) to Rifle Foregrip (foregripX, foregripY, foregripForwardZ)
            const dxL = foregripX - (-0.31);
            const dyL = foregripY - 0.36;
            const dzL = Math.max(0.18, foregripForwardZ);
            const reachPlanar = Math.hypot(dxL, dzL);
            const reachTotal = THREE.MathUtils.clamp(Math.hypot(reachPlanar, dyL), 0.18, 0.435);

            // 2-Bone Arm IK (UpperArm L1=0.22, Forearm L2=0.23)
            const L1 = 0.22, L2 = 0.23;
            const cosElbowL = THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - reachTotal * reachTotal) / (2 * L1 * L2), -0.98, 0.98);
            const cosShoulderL = THREE.MathUtils.clamp((L1 * L1 + reachTotal * reachTotal - L2 * L2) / (2 * L1 * reachTotal), -0.98, 0.98);

            const solvedElbowFlexL = -(Math.PI - Math.acos(cosElbowL));
            const targetElevL = Math.atan2(dzL, -dyL);
            const solvedShoulderPitchL = -(targetElevL - Math.acos(cosShoulderL) * 0.55) + weaponPitch * 0.45 - recoilKick * 0.45;
            const solvedShoulderYawL = Math.atan2(dxL, dzL) * 0.92;

            ud.shoulderL.rotation.set(
                THREE.MathUtils.clamp(solvedShoulderPitchL, -1.35, -0.35),
                THREE.MathUtils.clamp(solvedShoulderYawL, 0.38, 0.95),
                0.12
            );
            ud.elbowL.rotation.set(
                THREE.MathUtils.clamp(solvedElbowFlexL, -1.45, -0.45),
                0.24,
                0
            );
        } else {
            // Dual-Gauntlet / Dual-Weapon Units (Firebat, Marauder, Reaper, Medic): Independent Dual-Arm Target Tracking
            const kick = ud.attackAnim * 0.24;
            const desiredTorsoYaw = hasAimTarget ? THREE.MathUtils.clamp(aimYaw * 0.65, -0.82, 0.82) : torsoCounterTwist;
            ud.upperBody.rotation.y = THREE.MathUtils.lerp(ud.upperBody.rotation.y || 0, desiredTorsoYaw, Math.min(1, dt * 14));
            const resYaw = hasAimTarget ? THREE.MathUtils.clamp(aimYaw - ud.upperBody.rotation.y, -0.45, 0.45) : 0;
            const elevPitch = hasAimTarget ? THREE.MathUtils.clamp(aimPitch * 0.75, -0.50, 0.50) : 0;

            ud.shoulderR.rotation.set(-0.64 + elevPitch - kick + gaitSway, -0.10 + resYaw, 0);
            ud.elbowR.rotation.set(-0.90 + kick * 0.45, 0, 0);
            ud.shoulderL.rotation.set(-0.64 + elevPitch - kick * 0.85 - gaitSway, 0.10 + resYaw, 0);
            ud.elbowL.rotation.set(-0.90 + kick * 0.45, 0, 0);
        }

        // 4. Realistic Anatomical Head & Helmet Visor Target Look-At Tracking
        if (headNode) {
            let desiredHeadYaw = 0;
            let desiredHeadPitch = 0;
            let desiredHeadRoll = -ud.upperBody.rotation.z * 0.65;

            if (hasAimTarget) {
                // Compensate for upperBody yaw/pitch so the head looks directly at the enemy target!
                desiredHeadYaw = THREE.MathUtils.clamp(aimYaw - (ud.upperBody.rotation.y || 0), -0.95, 0.95);
                desiredHeadPitch = THREE.MathUtils.clamp(aimPitch - (ud.upperBody.rotation.x || 0) * 0.75, -0.52, 0.52);
                desiredHeadRoll += THREE.MathUtils.clamp(desiredHeadYaw * -0.12, -0.14, 0.14);
            } else if (isMoving) {
                desiredHeadYaw = -(ud.upperBody.rotation.y || 0) * 0.55 + Math.sin(ud.phase * 0.5) * 0.08;
                desiredHeadPitch = -0.06;
            } else {
                // Subtle tactical scanning while idle
                desiredHeadYaw = Math.sin(ud.phase * 0.65) * 0.16;
                desiredHeadPitch = Math.cos(ud.phase * 0.45) * 0.04;
            }

            const headLerp = Math.min(1, dt * 14.0);
            headNode.rotation.y = THREE.MathUtils.lerp(headNode.rotation.y || 0, desiredHeadYaw, headLerp);
            headNode.rotation.x = THREE.MathUtils.lerp(headNode.rotation.x || 0, desiredHeadPitch, headLerp);
            headNode.rotation.z = THREE.MathUtils.lerp(headNode.rotation.z || 0, desiredHeadRoll, headLerp);
        }
    }
}

// ============================================================================
// 6. DEATH CORPSES, CATASTROPHIC VEHICLE WRECKAGE & GORE FX
// ============================================================================
const particles = [];
const bloodDrops = [];
const bombCraters = [];
const shellCasings = [];
const smokeClouds = [];
const shockwaves = [];
const groundDecals = [];
const corpses = [];
const wreckageParts = [];
const scavengerDebrisClusters = [];
let screenShake = 0;

// ============================================================================
// SCAVENGER POST-DEATH WRECK DEBRIS SYSTEM
// Units that fall in battle spawn small, procedurally placed battlefield salvage
// & wreck debris clusters conforming to the canyon terrain for heightened realism.
// ============================================================================
function spawnScavengerPostDeathDebris(pos, unitCategory = 'infantry', isBug = false, isSolaris = false) {
    if (!pos) return;
    const hy = getTerrainHeight(pos.x, pos.z);
    if (hy < -0.30) return; // Skip underwater deep channels

    // Avoid over-stacking if another scavenger debris cluster is within 0.65m
    for (let i = scavengerDebrisClusters.length - 1; i >= Math.max(0, scavengerDebrisClusters.length - 20); i--) {
        const ex = scavengerDebrisClusters[i];
        if (ex && ex.group) {
            const dx = ex.group.position.x - pos.x;
            const dz = ex.group.position.z - pos.z;
            if (dx * dx + dz * dz < 0.42) return;
        }
    }

    const clusterGroup = new THREE.Group();
    const norm = getTerrainNormal(pos.x, pos.z);
    clusterGroup.position.set(pos.x, hy + 0.025, pos.z);
    clusterGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);

    const innerYaw = new THREE.Group();
    innerYaw.rotation.y = Math.random() * Math.PI * 2;
    clusterGroup.add(innerYaw);

    let beaconMesh = null;
    const pieceCount = unitCategory === 'vehicle' ? (4 + Math.floor(Math.random() * 3)) : (3 + Math.floor(Math.random() * 2));

    for (let i = 0; i < pieceCount; i++) {
        const ang = (i / pieceCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.55;
        const dist = (unitCategory === 'vehicle' ? 0.35 : 0.18) + Math.random() * (unitCategory === 'vehicle' ? 0.65 : 0.38);
        const px = Math.cos(ang) * dist;
        const pz = Math.sin(ang) * dist;

        let debrisPiece = null;
        if (isBug) {
            // Zerg Xeno-Scavenger Remains: Calcified Chitin Carapace Plate, Broken Scythe Talon, or Ruptured Bio-Gland
            if (i === 0) {
                debrisPiece = new THREE.Mesh(
                    createOrganicBioCarapaceGeo(0.22, 0.09, 0.28, 5, 0.03),
                    Math.random() > 0.4 ? MAT.chitinArmor : MAT.chitinRed
                );
            } else if (i === 1) {
                debrisPiece = new THREE.Mesh(
                    createCurvedScytheBladeGeo(0.32, 0.045, 0.08),
                    MAT.copper
                );
            } else {
                debrisPiece = new THREE.Mesh(
                    SHARED_FX_GEO.xenoSac,
                    i % 2 === 0 ? MAT.xenoIchorGreen : MAT.hiveVeinGlow
                );
                debrisPiece.scale.set(0.85, 0.55, 0.85);
                beaconMesh = debrisPiece;
            }
        } else if (isSolaris) {
            // Protoss Solaris Chrono-Remains: Golden Phase-Alloy Shards & Cracked Khaydarin Crystal Core
            if (i === 0) {
                debrisPiece = new THREE.Mesh(
                    createExtrudedArmorHullGeo(0.26, 0.06, 0.34, 0.015, 0.05),
                    MAT.copper
                );
            } else if (i === 1) {
                debrisPiece = new THREE.Mesh(
                    createSculptedFacetedCrystalGeo(0.11, 0),
                    MAT.cyanGlow
                );
                debrisPiece.scale.set(0.8, 0.55, 1.35);
                beaconMesh = debrisPiece;
            } else {
                debrisPiece = new THREE.Mesh(
                    createSculptedTorusCollarGeo(0.14, 0.022, 6, 10, Math.PI * 1.1),
                    MAT.amberGlow
                );
            }
        } else if (unitCategory === 'vehicle') {
            // Heavy Vehicle / Aircraft Scavenger Wreck Debris: Twisted Armor Plate, Track/Rotor Strut & Salvage Reactor Cell
            if (i === 0) {
                debrisPiece = new THREE.Mesh(
                    createExtrudedArmorHullGeo(0.46, 0.08, 0.38, 0.02, 0.06),
                    Math.random() > 0.5 ? MAT.charredSteel : MAT.terranPlating
                );
            } else if (i === 1) {
                debrisPiece = new THREE.Mesh(
                    createSculptedLatheBarrelGeo(0.08, 0.08, 0.34, 8),
                    MAT.hazard
                );
            } else if (i === 2) {
                debrisPiece = new THREE.Mesh(
                    createSculptedLatheBarrelGeo(0.065, 0.065, 0.22, 8),
                    MAT.amberGlow
                );
                beaconMesh = debrisPiece;
            } else {
                debrisPiece = new THREE.Mesh(
                    SHARED_FX_GEO.shrapnel,
                    i % 2 === 0 ? MAT.darkSteel : MAT.terranBlue
                );
                debrisPiece.scale.set(0.95, 0.45, 1.15);
            }
        } else {
            // Terran Bio-Infantry Scavenger Wreck Debris: Cracked CMC Pauldron/Helmet, Discarded Weapon Housing & Salvage Power Cell
            if (i === 0) {
                debrisPiece = new THREE.Mesh(
                    createSculptedArmorDomeGeo(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
                    Math.random() > 0.35 ? MAT.terranBlue : MAT.terranPlating
                );
            } else if (i === 1) {
                debrisPiece = new THREE.Mesh(
                    createExtrudedArmorHullGeo(0.07, 0.08, 0.34),
                    MAT.gunmetal
                );
            } else if (i === 2) {
                debrisPiece = new THREE.Mesh(
                    createSculptedLatheBarrelGeo(0.038, 0.038, 0.14, 8),
                    MAT.cyanGlow
                );
                beaconMesh = debrisPiece;
            } else {
                debrisPiece = new THREE.Mesh(
                    SHARED_FX_GEO.shrapnel,
                    MAT.charredSteel
                );
                debrisPiece.scale.set(0.55, 0.32, 0.68);
            }
        }

        if (debrisPiece) {
            debrisPiece.position.set(px, 0.03 + (i % 2) * 0.02, pz);
            debrisPiece.rotation.set(
                (Math.random() - 0.5) * 0.65,
                Math.random() * Math.PI * 2,
                (Math.random() - 0.5) * 0.65
            );
            debrisPiece.castShadow = true;
            debrisPiece.receiveShadow = true;
            innerYaw.add(debrisPiece);
        }
    }

    scene.add(clusterGroup);
    scavengerDebrisClusters.push({
        group: clusterGroup,
        beaconMesh,
        age: 0,
        life: 65.0 + Math.random() * 25.0
    });

    // Cap active scavenger debris clusters to 85 across the canyon battlefield
    if (scavengerDebrisClusters.length > 85) {
        const oldest = scavengerDebrisClusters.shift();
        if (oldest && oldest.group) {
            disposeHierarchy(oldest.group);
        }
    }
}
window.spawnScavengerPostDeathDebris = spawnScavengerPostDeathDebris;

function updateScavengerDebris(dt) {
    for (let i = scavengerDebrisClusters.length - 1; i >= 0; i--) {
        const item = scavengerDebrisClusters[i];
        item.age += dt;
        item.life -= dt;
        if (item.beaconMesh && item.age < 18.0) {
            const flicker = 0.78 + Math.sin(item.age * 7.5 + i) * 0.22;
            item.beaconMesh.scale.y = Math.max(0.25, flicker * 0.65);
        }
        if (item.life < 2.5 && item.group) {
            item.group.position.y -= dt * 0.08;
        }
        if (item.life <= 0) {
            if (item.group) disposeHierarchy(item.group);
            scavengerDebrisClusters.splice(i, 1);
        }
    }
}
window.updateScavengerDebris = updateScavengerDebris;

const flashLight = new THREE.PointLight(0xffaa00, 0, 12);
scene.add(flashLight);

function triggerMuzzleFlash(pos) {
    flashLight.position.copy(pos);
    flashLight.intensity = 3.5;
}

// Reactive Water Ripple & Ballistic Droplet Projectile Generator (Strictly suppressed on/under bridges!)
function triggerWaterRippleFX(x, z, strength = 1.0, isSplash = false) {
    if (typeof getNearestPondInteraction !== 'function') return;
    if (typeof window.isOnRiverBridge === 'function' && window.isOnRiverBridge(x, z, 0.95)) return;

    // Tight interaction threshold so units/impacts on banks or bridge ramps never trigger false water splashes
    const hit = getNearestPondInteraction(x, z, isSplash ? 0.65 : 0.25);
    if (!hit) return;

    const clampedStrength = Math.min(1.35, Math.max(0.25, strength * 0.68));
    const waterY = typeof hit.waterY === 'number' ? hit.waterY : ((hit.pond && typeof hit.pond.waterY === 'number') ? hit.pond.waterY : -0.32);
    const rx = hit.isInside ? x : hit.pond.x + ((x - hit.pond.x) / Math.max(0.1, hit.dist)) * (hit.pond.r * 0.85);
    const rz = hit.isInside ? z : hit.pond.z + ((z - hit.pond.z) / Math.max(0.1, hit.dist)) * (hit.pond.r * 0.85);

    if (window.pushWaterShaderRipple) {
        window.pushWaterShaderRipple(rx, rz, clampedStrength * 0.75);
    }

    // Subtle expanding water surface wave ring
    const ring = new THREE.Mesh(SHARED_FX_GEO.waterRippleRing, SHARED_FX_MAT.waterRipple.clone());
    ring.position.set(rx, waterY + 0.025, rz);
    scene.add(ring);
    shockwaves.push({
        mesh: ring,
        scale: 0.28,
        speed: 1.85 + clampedStrength * 1.15,
        alpha: Math.min(0.55, 0.34 * clampedStrength)
    });

    // Ballistic 3D Arcing Water Droplet Projectiles on Splash / Step in Water
    const spawnDrops = isSplash || (clampedStrength > 0.45 && Math.random() < 0.55);
    if (spawnDrops && particles.length < 135) {
        const dropCount = isSplash
            ? Math.min(9, Math.max(3, Math.floor(4 + clampedStrength * 3.5)))
            : 2;
        const dropGeo = SHARED_FX_GEO.waterDropProj || SHARED_FX_GEO.bloodDrop;
        const dropMat = SHARED_FX_MAT.waterDropMat || MAT.cyanGlow;

        for (let i = 0; i < dropCount; i++) {
            const ang = (i / dropCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.55;
            const horizSpeed = (isSplash ? 1.6 : 0.85) + Math.random() * (isSplash ? 2.4 : 0.95) * clampedStrength;
            const upSpeed = (isSplash ? 2.6 : 1.35) + Math.random() * (isSplash ? 2.5 : 0.95) * clampedStrength;
            const vx = Math.cos(ang) * horizSpeed;
            const vz = Math.sin(ang) * horizSpeed;

            const drop = new THREE.Mesh(dropGeo, dropMat);
            const s = (isSplash ? 0.65 : 0.48) + Math.random() * 0.35;
            drop.scale.set(s, s, s * 1.45);
            drop.position.set(rx + Math.cos(ang) * 0.14, waterY + 0.08, rz + Math.sin(ang) * 0.14);
            drop.lookAt(drop.position.x + vx, drop.position.y + upSpeed, drop.position.z + vz);
            scene.add(drop);

            particles.push({
                mesh: drop,
                vel: new THREE.Vector3(vx, upSpeed, vz),
                gravity: 13.5,
                life: 0.36 + Math.random() * 0.22,
                isWaterDrop: true,
                waterY
            });
        }
    }
}

function ejectBrassCasing(pos) {
    if (shellCasings.length >= 45) {
        const old = shellCasings.shift();
        scene.remove(old.mesh);
    }
    const casing = new THREE.Mesh(SHARED_FX_GEO.casing, MAT.copper);
    casing.position.copy(pos);
    scene.add(casing);
    shellCasings.push({
        mesh: casing,
        vel: new THREE.Vector3((Math.random() - 0.5) * 3.5, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 3.5),
        rotVel: new THREE.Vector3(Math.random()*15, Math.random()*15, Math.random()*15),
        life: 1.0
    });
}

function spawnDeathCorpse(unitMesh, isBug = false, impulseVec = null, isHeavyBlast = false) {
    const pos = unitMesh.position.clone();
    const groundY = getTerrainHeight(pos.x, pos.z);
    pos.y = Math.max(pos.y, groundY + 0.08);
    unitMesh.position.copy(pos);
    unitMesh.updateMatrixWorld(true);

    const ud = unitMesh.userData || {};
    if (ud.selCircle) {
        ud.selCircle.visible = false;
    }

    // Spawn procedural Scavenger post-death wreck debris at fallen unit's location
    spawnScavengerPostDeathDebris(pos, 'infantry', isBug, !!ud.isSolaris);

    // Calculate ballistic launch velocity (knockback from attacker or random blast vector)
    const dirAngle = Math.random() * Math.PI * 2;
    const horizSpeed = isHeavyBlast ? (4.8 + Math.random() * 3.5) : (1.8 + Math.random() * 2.2);
    const vx = impulseVec ? impulseVec.x : Math.cos(dirAngle) * horizSpeed;
    const vz = impulseVec ? impulseVec.z : Math.sin(dirAngle) * horizSpeed;
    const vy = impulseVec ? impulseVec.y : (isHeavyBlast ? (5.2 + Math.random() * 2.8) : (2.4 + Math.random() * 1.6));

    // --- DESTRUCTIBLE BUG LIMBS, WINGS & BODY PARTS FOR RAGDOLL ---
    if (isBug && ((ud.legs && ud.legs.length > 0) || ud.wingL || ud.wingR)) {
        const severablePool = [];
        if (ud.legs) ud.legs.forEach(l => severablePool.push({ obj: l.pivot, parent: unitMesh, isLeg: true, legRef: l }));
        if (ud.wingL) severablePool.push({ obj: ud.wingL, parent: ud.bodyGroup, isLeg: false });
        if (ud.wingR) severablePool.push({ obj: ud.wingR, parent: ud.bodyGroup, isLeg: false });
        if (ud.scytheL) severablePool.push({ obj: ud.scytheL, parent: ud.bodyGroup, isLeg: false });
        if (ud.scytheR) severablePool.push({ obj: ud.scytheR, parent: ud.bodyGroup, isLeg: false });
        if (ud.mandL && isHeavyBlast) severablePool.push({ obj: ud.mandL, parent: ud.bodyGroup, isLeg: false });
        if (ud.mandR && isHeavyBlast) severablePool.push({ obj: ud.mandR, parent: ud.bodyGroup, isLeg: false });

        for (let i = severablePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = severablePool[i]; severablePool[i] = severablePool[j]; severablePool[j] = tmp;
        }

        const severCount = Math.min(
            severablePool.length,
            isHeavyBlast ? (4 + Math.floor(Math.random() * 3)) : (2 + Math.floor(Math.random() * 2))
        );

        for (let s = 0; s < severCount; s++) {
            const item = severablePool[s];
            const partObj = item.obj;
            if (!partObj || !partObj.visible) continue;

            const socketWorldPos = new THREE.Vector3();
            partObj.getWorldPosition(socketWorldPos);

            partObj.visible = false;
            if (item.legRef) item.legRef.severed = true;

            // Attach a glowing bioluminescent xeno-ichor wound stump at the severed socket on the bug corpse
            if (item.parent) {
                const stump = new THREE.Mesh(
                    createSculptedArmorDomeGeo(0.09, 8, 6),
                    ud.variant === 'spitter' ? MAT.xenoIchorGreen : MAT.xenoIchorViolet
                );
                stump.position.copy(partObj.position);
                stump.scale.set(1.2, 0.8, 1.2);
                item.parent.add(stump);
            }

            if (wreckageParts.length >= 42) {
                const old = wreckageParts.shift();
                scene.remove(old.mesh);
            }
            const flyingLimb = partObj.clone();
            flyingLimb.visible = true;
            flyingLimb.scale.multiplyScalar(unitMesh.scale.x || 1.0);
            flyingLimb.position.copy(socketWorldPos).add(new THREE.Vector3(0, 0.18, 0));
            scene.add(flyingLimb);

            const limbAngle = Math.random() * Math.PI * 2;
            const limbSpread = (isHeavyBlast ? 5.5 : 3.2) + Math.random() * 3.5;
            wreckageParts.push({
                mesh: flyingLimb,
                hasFire: false,
                vel: new THREE.Vector3(
                    vx * 0.75 + Math.cos(limbAngle) * limbSpread,
                    vy * 0.9 + 2.8 + Math.random() * 2.6,
                    vz * 0.75 + Math.sin(limbAngle) * limbSpread
                ),
                rotVel: new THREE.Vector3(
                    (Math.random() - 0.5) * 22,
                    (Math.random() - 0.5) * 22,
                    (Math.random() - 0.5) * 22
                ),
                smokeTimer: 0,
                life: 7.5
            });
        }

        if (isHeavyBlast && ud.abdomen && Math.random() > 0.35) {
            ud.abdomen.visible = false;
        }
    } else if (!isBug && wreckageParts.length < 42) {
        const propMesh = new THREE.Mesh(SHARED_FX_GEO.shrapnel, MAT.darkSteel);
        propMesh.scale.set(0.35, 0.45, 1.85);
        propMesh.position.copy(pos).add(new THREE.Vector3(0, 0.55, 0));
        scene.add(propMesh);
        wreckageParts.push({
            mesh: propMesh,
            hasFire: false,
            vel: new THREE.Vector3(vx * 1.25 + (Math.random() - 0.5) * 4, vy + 2.2, vz * 1.25 + (Math.random() - 0.5) * 4),
            rotVel: new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18),
            smokeTimer: 0,
            life: 6.5
        });
    }

    const fallBackwards = Math.random() > 0.42;
    const ragdollPose = {
        pitchTarget: isBug
            ? (Math.random() - 0.5) * 0.55
            : (fallBackwards ? -Math.PI * (0.46 + Math.random() * 0.08) : Math.PI * (0.44 + Math.random() * 0.08)),
        rollTarget: isBug
            ? (fallBackwards ? Math.PI * (0.82 + Math.random() * 0.14) : (Math.random() - 0.5) * 0.65)
            : (Math.random() - 0.5) * 0.6,
        yawSpin: (Math.random() - 0.5) * (isHeavyBlast ? 9.5 : 4.2),
        armLRot: new THREE.Vector3(-0.3 - Math.random() * 1.4, (Math.random() - 0.5) * 0.9, -0.4 - Math.random() * 1.1),
        armRRot: new THREE.Vector3(-0.3 - Math.random() * 1.4, (Math.random() - 0.5) * 0.9, 0.4 + Math.random() * 1.1),
        elbowL: -0.2 - Math.random() * 1.1,
        elbowR: -0.2 - Math.random() * 1.1,
        hipL: (Math.random() - 0.5) * 1.1,
        hipR: (Math.random() - 0.5) * 1.1,
        kneeL: 0.25 + Math.random() * 1.25,
        kneeR: 0.25 + Math.random() * 1.25,
        headYaw: (Math.random() - 0.5) * 1.2,
        headPitch: (Math.random() - 0.5) * 0.7,
        flippedOnBack: isBug && fallBackwards
    };

    corpses.push({
        mesh: unitMesh,
        isBug,
        vel: new THREE.Vector3(vx, vy, vz),
        angVel: new THREE.Vector3(
            ragdollPose.pitchTarget * 3.2,
            ragdollPose.yawSpin,
            ragdollPose.rollTarget * 3.2
        ),
        pose: ragdollPose,
        bounces: 0,
        settled: false,
        age: 0,
        life: 14.0
    });
    if (corpses.length > 32) {
        const old = corpses.shift();
        disposeHierarchy(old.mesh);
    }
}

function updateRagdollCorpse(c, dt) {
    c.life -= dt;
    c.age += dt;
    const mesh = c.mesh;
    const ud = mesh.userData || {};
    const pose = c.pose;

    const groundY = getTerrainHeight(mesh.position.x, mesh.position.z);
    const restOffset = c.isBug ? (pose.flippedOnBack ? 0.34 : 0.14) : 0.14;
    const targetGroundY = groundY + restOffset;

    if (!c.settled) {
        mesh.position.x += c.vel.x * dt;
        mesh.position.y += c.vel.y * dt;
        mesh.position.z += c.vel.z * dt;
        c.vel.y -= 17.5 * dt;

        mesh.rotation.y += c.angVel.y * dt;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, pose.pitchTarget, dt * 6.5);
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, pose.rollTarget, dt * 6.5);

        if (mesh.position.y <= targetGroundY) {
            mesh.position.y = targetGroundY;
            if (Math.abs(c.vel.y) > 1.35 && c.bounces < 2) {
                c.vel.y = -c.vel.y * 0.36;
                c.vel.x *= 0.62;
                c.vel.z *= 0.62;
                c.angVel.multiplyScalar(0.55);
                c.bounces++;
                if (c.isBug && particles.length < 135) {
                    const sp = new THREE.Mesh(SHARED_FX_GEO.xenoSac, MAT.xenoIchorGreen);
                    sp.scale.setScalar(0.55);
                    sp.position.copy(mesh.position);
                    scene.add(sp);
                    particles.push({
                        mesh: sp,
                        vel: new THREE.Vector3((Math.random() - 0.5) * 3, 2.2, (Math.random() - 0.5) * 3),
                        gravity: 14,
                        life: 0.35
                    });
                }
            } else {
                const norm = getTerrainNormal(mesh.position.x, mesh.position.z);
                c.vel.x = (c.vel.x + norm.x * 4.5 * dt) * Math.pow(0.08, dt);
                c.vel.z = (c.vel.z + norm.z * 4.5 * dt) * Math.pow(0.08, dt);
                c.vel.y = 0;
                c.angVel.multiplyScalar(Math.pow(0.05, dt));
                if (Math.hypot(c.vel.x, c.vel.z) < 0.08 && c.age > 0.65) {
                    c.settled = true;
                }
            }
        }
    }

    const isAirborne = mesh.position.y > targetGroundY + 0.12;
    const flailFreq = isAirborne ? 22 : 11;
    const twitchEnv = Math.max(0, 1 - c.age / 3.2);
    const twitch = Math.sin(c.age * flailFreq + (ud.phase || 0)) * (isAirborne ? 0.45 : 0.16 * twitchEnv);

    if (c.isBug && ud.legs) {
        ud.legs.forEach(l => {
            if (pose.flippedOnBack) {
                const curlZ = -l.side * (0.95 + Math.sin(c.age * 14 + l.idx) * 0.28 * twitchEnv);
                const curlY = Math.sin(c.age * 10 + l.idx * 1.7) * 0.35 * twitchEnv;
                l.pivot.rotation.z = THREE.MathUtils.lerp(l.pivot.rotation.z, curlZ, dt * 9);
                l.pivot.rotation.y = THREE.MathUtils.lerp(l.pivot.rotation.y, curlY, dt * 9);
            } else {
                const splayZ = l.side * (0.52 + twitch * 0.4);
                const splayY = (l.idx - 1) * 0.45 + twitch * 0.3;
                l.pivot.rotation.z = THREE.MathUtils.lerp(l.pivot.rotation.z, splayZ, dt * 8);
                l.pivot.rotation.y = THREE.MathUtils.lerp(l.pivot.rotation.y, splayY, dt * 8);
            }
        });
        if (ud.abdomen) {
            const deflate = Math.max(0.58, 1 - c.age * 0.14) + twitch * 0.08;
            ud.abdomen.scale.setScalar(deflate);
        }
        if (ud.mandL && ud.mandR) {
            const jawSpasm = 0.35 + twitch * 0.6;
            ud.mandL.rotation.y = -jawSpasm;
            ud.mandR.rotation.y = jawSpasm;
        }
    } else if (!c.isBug && ud.upperBody) {
        ud.upperBody.rotation.x = THREE.MathUtils.lerp(ud.upperBody.rotation.x, 0.25 + twitch * 0.3, dt * 8);
        ud.upperBody.rotation.z = THREE.MathUtils.lerp(ud.upperBody.rotation.z, (pose.rollTarget * 0.25), dt * 8);
        if (ud.headGroup) {
            ud.headGroup.rotation.y = THREE.MathUtils.lerp(ud.headGroup.rotation.y, pose.headYaw + twitch * 0.25, dt * 8);
            ud.headGroup.rotation.x = THREE.MathUtils.lerp(ud.headGroup.rotation.x, pose.headPitch, dt * 8);
        }
        if (ud.shoulderL && ud.elbowL) {
            ud.shoulderL.rotation.x = THREE.MathUtils.lerp(ud.shoulderL.rotation.x, pose.armLRot.x + twitch, dt * 9);
            ud.shoulderL.rotation.y = THREE.MathUtils.lerp(ud.shoulderL.rotation.y, pose.armLRot.y, dt * 9);
            ud.shoulderL.rotation.z = THREE.MathUtils.lerp(ud.shoulderL.rotation.z, pose.armLRot.z, dt * 9);
            ud.elbowL.rotation.x = THREE.MathUtils.lerp(ud.elbowL.rotation.x, pose.elbowL, dt * 9);
        }
        if (ud.shoulderR && ud.elbowR) {
            ud.shoulderR.rotation.x = THREE.MathUtils.lerp(ud.shoulderR.rotation.x, pose.armRRot.x - twitch, dt * 9);
            ud.shoulderR.rotation.y = THREE.MathUtils.lerp(ud.shoulderR.rotation.y, pose.armRRot.y, dt * 9);
            ud.shoulderR.rotation.z = THREE.MathUtils.lerp(ud.shoulderR.rotation.z, pose.armRRot.z, dt * 9);
            ud.elbowR.rotation.x = THREE.MathUtils.lerp(ud.elbowR.rotation.x, pose.elbowR, dt * 9);
        }
        if (ud.legL && ud.legR) {
            ud.legL.hip.rotation.x = THREE.MathUtils.lerp(ud.legL.hip.rotation.x, pose.hipL + twitch * 0.5, dt * 9);
            ud.legL.hip.rotation.z = THREE.MathUtils.lerp(ud.legL.hip.rotation.z, -0.28, dt * 8);
            ud.legL.knee.rotation.x = THREE.MathUtils.lerp(ud.legL.knee.rotation.x, pose.kneeL, dt * 9);

            ud.legR.hip.rotation.x = THREE.MathUtils.lerp(ud.legR.hip.rotation.x, pose.hipR - twitch * 0.5, dt * 9);
            ud.legR.hip.rotation.z = THREE.MathUtils.lerp(ud.legR.hip.rotation.z, 0.28, dt * 8);
            ud.legR.knee.rotation.x = THREE.MathUtils.lerp(ud.legR.knee.rotation.x, pose.kneeR, dt * 9);
        }
    }

    if (c.life < 2.2) {
        mesh.position.y -= dt * 0.38;
    }
}

function spawnVehicleWreckageExplosion(pos, vType) {
    detonateArtilleryBomb(pos, false);
    spawnScavengerPostDeathDebris(pos, 'vehicle', false, false);

    for (let i = 0; i < 6; i++) {
        if (wreckageParts.length >= 38) {
            const old = wreckageParts.shift();
            scene.remove(old.mesh);
        }
        const plate = new THREE.Mesh(SHARED_FX_GEO.shrapnel, i % 2 === 0 ? MAT.charredSteel : MAT.hazard);
        plate.scale.set(1.6, 0.7, 1.4);
        plate.position.copy(pos).add(new THREE.Vector3((Math.random()-0.5)*0.8, 0.5, (Math.random()-0.5)*0.8));
        scene.add(plate);

        wreckageParts.push({
            mesh: plate,
            hasFire: i < 3,
            vel: new THREE.Vector3((Math.random() - 0.5) * 12, 6.0 + Math.random() * 5, (Math.random() - 0.5) * 12),
            rotVel: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
            smokeTimer: 0,
            life: 10.0
        });
    }
}

const crashingHelis = [];
const expandingGoreDecals = [];

// Helper to spawn a dynamically generated 3D organic viscoelastic goo/blood pool with outward satellite droplets (Zero flat square planes!)
function spawnDynamicLiquidGoreDecal(pos, mat, sizeCategory = 'small', impulseVec = null) {
    const hy = getTerrainHeight(pos.x, pos.z);
    if (hy <= -1.0) return null;

    const norm = getTerrainNormal(pos.x, pos.z);
    const gooMat = (mat === SHARED_FX_MAT.splatCrimsonBlood)
        ? MAT.crimsonBlood
        : ((mat === SHARED_FX_MAT.splatXenoViolet) ? MAT.xenoIchorViolet : MAT.xenoIchorGreen);
    const mainGeo = createProceduralViscoelasticGooGeo(
        sizeCategory === 'big' ? 0.36 : (sizeCategory === 'drop' ? 0.14 : 0.24),
        0.032,
        sizeCategory === 'big' ? 0.44 : (sizeCategory === 'drop' ? 0.18 : 0.30),
        1
    );

    const splatGroup = new THREE.Group();
    splatGroup.position.set(pos.x, hy + 0.025 + Math.random() * 0.008, pos.z);
    splatGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);

    const innerPivot = new THREE.Group();
    const angle = (impulseVec && (Math.abs(impulseVec.x) + Math.abs(impulseVec.z) > 0.05))
        ? Math.atan2(impulseVec.x, impulseVec.z) + (Math.random() - 0.5) * 0.35
        : Math.random() * Math.PI * 2;
    innerPivot.rotation.y = angle;

    const mainMesh = new THREE.Mesh(mainGeo, gooMat);
    const stretchZ = (impulseVec ? 1.35 : 1.12) + Math.random() * 0.38;
    const stretchX = 0.78 + Math.random() * 0.32;
    mainMesh.scale.set(stretchX, 0.55, stretchZ);
    innerPivot.add(mainMesh);

    const satCount = sizeCategory === 'big' ? 5 : (sizeCategory === 'small' ? 3 : 2);
    const baseR = sizeCategory === 'big' ? 0.58 : (sizeCategory === 'small' ? 0.34 : 0.18);
    const satGeo = createProceduralViscoelasticGooGeo(0.11, 0.028, 0.15, 2);
    for (let s = 0; s < satCount; s++) {
        const satMesh = new THREE.Mesh(satGeo, gooMat);
        const satAng = (s / satCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const satDist = baseR * (0.75 + Math.random() * 0.65);
        satMesh.position.set(Math.sin(satAng) * satDist * stretchX, 0.004, Math.cos(satAng) * satDist * stretchZ);
        satMesh.rotation.y = satAng;
        const satScale = (sizeCategory === 'big' ? 0.72 : 0.48) * (0.65 + Math.random() * 0.55);
        satMesh.scale.set(satScale * 0.75, 0.5, satScale * 1.45);
        innerPivot.add(satMesh);
    }

    splatGroup.add(innerPivot);
    splatGroup.scale.setScalar(0.38);
    scene.add(splatGroup);

    expandingGoreDecals.push({ group: splatGroup, targetScale: 0.85 + Math.random() * 0.25, age: 0 });
    groundDecals.push(splatGroup);
    while (groundDecals.length > 48) {
        const old = groundDecals.shift();
        scene.remove(old);
    }
    return splatGroup;
}

function updateDynamicGoreSplashes(dt) {
    for (let i = expandingGoreDecals.length - 1; i >= 0; i--) {
        const eg = expandingGoreDecals[i];
        eg.age += dt;
        const s = THREE.MathUtils.lerp(eg.group.scale.x, eg.targetScale, Math.min(1, dt * 14));
        eg.group.scale.setScalar(s);
        if (eg.age >= 0.35) {
            expandingGoreDecals.splice(i, 1);
        }
    }
}

// --- HELICOPTER TAIL-DESTROYED -> SPINNING OUT OF CONTROL -> FALL & BOMB EXPLOSION ANIMATION ---
function startHelicopterTailDestroyCrash(heliUnit) {
    const mesh = heliUnit.mesh;
    const ud = mesh.userData || {};
    const pos = mesh.position.clone();

    // 1. Detonate initial flak explosion right at the Helicopter's Tail Rotor!
    const tailWorldPos = ud.tailRotor
        ? ud.tailRotor.getWorldPosition(new THREE.Vector3())
        : pos.clone().add(new THREE.Vector3(0, 0.3, -2.2));

    triggerMuzzleFlash(tailWorldPos);
    if (window.SFX) window.SFX.playExplosion(false);
    screenShake = Math.max(screenShake, 0.25);

    // Sever & hide the tail rotor, vertical fin, and horizontal stabilizer on the helicopter
    if (ud.tailRotor) ud.tailRotor.visible = false;
    if (ud.vFin) ud.vFin.visible = false;
    if (ud.hStab) ud.hStab.visible = false;
    if (ud.tailBoom) {
        ud.tailBoom.scale.y = 0.55; // visibly sheared/shortened tail boom stump!
        ud.tailBoom.material = MAT.charredSteel;
    }

    // Spawn flying severed tail-rotor assembly into wreckageParts
    const severedTail = new THREE.Group();
    const boomChunk = new THREE.Mesh(createSculptedLatheBarrelGeo(0.10, 0.18, 0.75, 10), MAT.charredSteel);
    boomChunk.rotation.x = Math.PI / 2;
    const finChunk = new THREE.Mesh(createExtrudedArmorHullGeo(0.08, 0.55, 0.35), MAT.hazard);
    finChunk.position.set(0, 0.2, -0.2);
    const rotorChunk = new THREE.Mesh(createExtrudedArmorHullGeo(0.04, 0.62, 0.08), MAT.darkSteel);
    rotorChunk.position.set(0.1, 0.25, -0.25);
    severedTail.add(boomChunk, finChunk, rotorChunk);
    severedTail.position.copy(tailWorldPos);
    scene.add(severedTail);

    if (wreckageParts.length >= 40) {
        const old = wreckageParts.shift();
        scene.remove(old.mesh);
    }
    wreckageParts.push({
        mesh: severedTail,
        hasFire: true,
        vel: new THREE.Vector3((Math.random() - 0.5) * 9, 4.5 + Math.random() * 3.5, (Math.random() - 0.5) * 9),
        rotVel: new THREE.Vector3(16, -22, 18),
        smokeTimer: 0,
        life: 6.5
    });

    // Attach roaring fire plume at the severed tail stump on the helicopter airframe (No floating crash text label!)
    const tailFire = new THREE.Mesh(SHARED_FX_GEO.fireBall, MAT.volatileGlow);
    tailFire.scale.set(1.1, 1.4, 1.8);
    tailFire.position.set(0, 0.12, -1.55);
    if (ud.airframe) ud.airframe.add(tailFire);
    else mesh.add(tailFire);

    const driftAngle = (heliUnit.currentYaw || mesh.rotation.y || 0) + (Math.random() - 0.5) * 0.8;
    crashingHelis.push({
        mesh,
        tailFire,
        vel: new THREE.Vector3(Math.sin(driftAngle) * 4.2, 0.8, Math.cos(driftAngle) * 4.2),
        yawSpin: 8.5 * (Math.random() > 0.5 ? 1 : -1),
        pitch: mesh.rotation.x || 0,
        roll: mesh.rotation.z || 0,
        smokeTimer: 0,
        age: 0
    });
}

function updateCrashingHelicopters(dt) {
    for (let i = crashingHelis.length - 1; i >= 0; i--) {
        const ch = crashingHelis[i];
        ch.age += dt;
        const mesh = ch.mesh;
        const ud = mesh.userData || {};

        // Accelerate downward under gravity while spiraling horizontally
        ch.vel.y -= 11.5 * dt;
        mesh.position.addScaledVector(ch.vel, dt);

        // Because the tail rotor is destroyed, yaw spin rate accelerates rapidly as the helicopter falls!
        ch.yawSpin *= (1 + dt * 0.95);
        mesh.rotation.order = 'YXZ';
        mesh.rotation.y += ch.yawSpin * dt;
        ch.pitch = THREE.MathUtils.lerp(ch.pitch, 0.52, dt * 2.8);
        ch.roll = Math.sin(ch.age * 9.0) * 0.46;
        mesh.rotation.x = ch.pitch;
        mesh.rotation.z = ch.roll;

        // Keep main rotor spinning & flicker tail fire
        if (ud.rotor) ud.rotor.rotation.y += dt * 32;
        if (ch.tailFire) {
            ch.tailFire.scale.setScalar(0.95 + Math.random() * 0.55);
        }

        // Emit dense corkscrew black smoke & fire sparks from the severed tail stump
        ch.smokeTimer -= dt;
        if (ch.smokeTimer <= 0) {
            ch.smokeTimer = 0.045;
            const stumpWorld = ch.tailFire
                ? ch.tailFire.getWorldPosition(new THREE.Vector3())
                : mesh.position.clone();
            if (smokeClouds.length < 62) {
                const sm = new THREE.Mesh(
                    SHARED_FX_GEO.smoke,
                    Math.random() > 0.35 ? SHARED_FX_MAT.smokeDark : SHARED_FX_MAT.smokeFire
                );
                sm.scale.setScalar(0.85 + Math.random() * 0.35);
                sm.position.copy(stumpWorld);
                scene.add(sm);
                smokeClouds.push({
                    mesh: sm,
                    vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.8 + Math.random(), (Math.random() - 0.5) * 1.5),
                    life: 0.65
                });
            }
            if (particles.length < 140) {
                const sp = new THREE.Mesh(SHARED_FX_GEO.spark, MAT.amberGlow);
                sp.position.copy(stumpWorld);
                scene.add(sp);
                particles.push({
                    mesh: sp,
                    vel: new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 3, (Math.random() - 0.5) * 6),
                    gravity: 15,
                    life: 0.28
                });
            }
        }

        // Check ground impact -> Massive Bomb Explosion & Crater (No floating crash text label!)
        const groundY = getTerrainHeight(mesh.position.x, mesh.position.z);
        if (mesh.position.y <= groundY + 0.35 || ch.age > 3.2) {
            const impactPos = new THREE.Vector3(mesh.position.x, Math.max(groundY, mesh.position.y), mesh.position.z);
            detonateArtilleryBomb(impactPos, true);
            spawnVehicleWreckageExplosion(impactPos, 'heli');
            scene.remove(mesh);
            crashingHelis.splice(i, 1);
        }
    }
}

// --- DEDICATED TANK & SIEGE TANK CANNON MUZZLE BLAST FX (MULTI-STAGE VOLUMETRIC FIREBALL + MUZZLE-BRAKE PLUME ENGINE) ---
let _muzzleFlashFlameGeo = null;
function triggerTankMuzzleFlash(muzzlePos, targetPos = null, isSiegeArtillery = false) {
    triggerMuzzleFlash(muzzlePos);

    let dir = new THREE.Vector3(0, 0, 1);
    if (targetPos) {
        dir.subVectors(targetPos, muzzlePos);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) dir.normalize();
        else dir.set(0, 0, 1);
    }
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const scaleMult = isSiegeArtillery ? 1.52 : 1.08;

    ensureThrusterParticleAssets();
    if (!_muzzleFlashFlameGeo) {
        _muzzleFlashFlameGeo = createProceduralViscoelasticGooGeo(0.08, 0.075, 0.22, 1);
    }

    // 1. Forward Supersonic Mach-Cone Fireball Plume (White-Hot Core -> Golden-Amber -> Expanding Smoke)
    const coreCount = particles.length > 90 ? 10 : (isSiegeArtillery ? 20 : 14);
    for (let i = 0; i < coreCount; i++) {
        if (particles.length >= 175) {
            const old = particles.shift();
            if (old && old.mesh) scene.remove(old.mesh);
        }
        const isWhiteCore = i < 5;
        const isAmberJet = i < 11;
        const pMat = isWhiteCore
            ? _thrusterMats.coreWhite
            : (isAmberJet ? (isSiegeArtillery && i % 2 === 0 ? _thrusterMats.cyanHot : _thrusterMats.amberHot) : _thrusterMats.amberFlame);
        const pMesh = new THREE.Mesh(isWhiteCore ? _thrusterMicroGeo : _muzzleFlashFlameGeo, pMat);
        const s = (isWhiteCore ? 1.45 : (0.85 + Math.random() * 0.65)) * scaleMult;
        pMesh.scale.set(s * 0.72, s * 0.72, s * (isWhiteCore ? 2.65 : 1.95));

        const forwardOffset = 0.05 + (i / coreCount) * 0.42 * scaleMult;
        pMesh.position.copy(muzzlePos).addScaledVector(dir, forwardOffset);
        pMesh.position.x += (Math.random() - 0.5) * 0.09;
        pMesh.position.y += (Math.random() - 0.5) * 0.09;
        pMesh.position.z += (Math.random() - 0.5) * 0.09;

        const fwdSpeed = (isWhiteCore ? (18.0 + Math.random() * 7.0) : (9.5 + Math.random() * 8.5)) * scaleMult;
        const spread = isWhiteCore ? 0.95 : 2.65;
        const vel = dir.clone().multiplyScalar(fwdSpeed);
        vel.x += (Math.random() - 0.5) * spread;
        vel.y += (Math.random() - 0.35) * spread;
        vel.z += (Math.random() - 0.5) * spread;

        pMesh.lookAt(pMesh.position.x + vel.x, pMesh.position.y + vel.y, pMesh.position.z + vel.z);
        scene.add(pMesh);

        const maxLife = (isWhiteCore ? 0.075 : 0.14) + Math.random() * 0.06;
        particles.push({
            mesh: pMesh,
            vel,
            gravity: -1.8,
            drag: 8.2,
            isThrustParticle: true,
            maxLife,
            life: maxLife
        });
    }

    // 2. Twin-Baffle Muzzle-Brake Lateral Overpressure Vent Plumes (Port & Starboard)
    const baffleCount = particles.length > 105 ? 6 : 10;
    for (let b = 0; b < baffleCount; b++) {
        if (particles.length >= 175) break;
        const sideSign = (b % 2 === 0) ? 1 : -1;
        const gMat = (b < 4) ? _thrusterMats.amberHot : _thrusterMats.amberFlame;
        const gMesh = new THREE.Mesh(_muzzleFlashFlameGeo, gMat);
        const gs = (0.72 + Math.random() * 0.48) * scaleMult;
        gMesh.scale.set(gs * 0.75, gs * 0.75, gs * 1.85);
        gMesh.position.copy(muzzlePos).addScaledVector(right, sideSign * 0.18).addScaledVector(dir, -0.05);
        scene.add(gMesh);

        const latSpeed = (6.8 + Math.random() * 5.2) * scaleMult;
        const gVel = right.clone().multiplyScalar(sideSign * latSpeed)
            .addScaledVector(dir, (Math.random() - 0.25) * 2.4);
        gVel.y += 0.35 + Math.random() * 1.1;
        gMesh.lookAt(gMesh.position.x + gVel.x, gMesh.position.y + gVel.y, gMesh.position.z + gVel.z);

        const maxLife = 0.11 + Math.random() * 0.07;
        particles.push({
            mesh: gMesh,
            vel: gVel,
            gravity: -1.5,
            drag: 6.5,
            isThrustParticle: true,
            maxLife,
            life: maxLife
        });
    }

    // 3. Expanding Volumetric Bore Smoke Ring & Incandescent Ballistic Embers
    if (typeof spawnSimulatedSmokePuff === 'function') {
        const smokePos = muzzlePos.clone().addScaledVector(dir, 0.35 * scaleMult);
        spawnSimulatedSmokePuff(smokePos, new THREE.Vector3(dir.x * 2.6, 0.9, dir.z * 2.6), 0.38 * scaleMult, 0.55);
    }

    const spkCount = particles.length > 100 ? 6 : (isSiegeArtillery ? 12 : 8);
    for (let s = 0; s < spkCount; s++) {
        if (particles.length >= 180) break;
        const sp = new THREE.Mesh(
            SHARED_FX_GEO.weldSpark,
            (isSiegeArtillery && s % 2 === 0) ? _thrusterMats.cyanHot : _thrusterMats.amberHot
        );
        const spScale = (0.75 + Math.random() * 0.45) * scaleMult;
        sp.scale.set(spScale * 0.55, spScale * 0.55, spScale * 2.15);
        sp.position.copy(muzzlePos);
        scene.add(sp);
        const vel = dir.clone().multiplyScalar((12.5 + Math.random() * 9.5) * scaleMult);
        vel.x += (Math.random() - 0.5) * 4.2;
        vel.y += 1.5 + Math.random() * 3.0;
        vel.z += (Math.random() - 0.5) * 4.2;
        particles.push({
            mesh: sp,
            vel,
            gravity: 16.5,
            drag: 1.6,
            isBallisticSpark: true,
            bounces: 1,
            life: 0.26 + Math.random() * 0.16
        });
    }
}

// --- REALISTIC M80 GRIZZLY 120MM APFSDS SHELL & CRUCIO SIEGE TANK 180MM SHOCK-ARTILLERY SHELL ---
function createTankCannonShellMesh(isSiegeArtillery = false) {
    const shellGroup = new THREE.Group();
    ensureThrusterParticleAssets();

    // 1. Sculpted Armor-Piercing Sabot / Artillery Warhead Body
    const body = new THREE.Mesh(SHARED_FX_GEO.tankSabotShell, isSiegeArtillery ? MAT.darkSteel : MAT.copper);
    if (isSiegeArtillery) {
        body.scale.set(1.38, 1.38, 1.48);
    }
    shellGroup.add(body);

    // 2. Superheated Nose Cone & Tapered Plasma Sabot Core (100% 3D Lathe/Dome Geometry — ZERO flat planes!)
    const hotTip = new THREE.Mesh(SHARED_FX_GEO.bloodDrop, isSiegeArtillery ? _thrusterMats.coreWhite : SHARED_FX_MAT.projTankTip);
    hotTip.scale.set(isSiegeArtillery ? 1.05 : 0.78, isSiegeArtillery ? 1.05 : 0.78, isSiegeArtillery ? 2.65 : 2.20);
    hotTip.position.z = isSiegeArtillery ? 0.68 : 0.55;

    const tracerCore = new THREE.Mesh(_thrusterMicroGeo, isSiegeArtillery ? _thrusterMats.amberHot : SHARED_FX_MAT.projTankCore);
    tracerCore.scale.set(isSiegeArtillery ? 4.2 : 3.0, isSiegeArtillery ? 4.2 : 3.0, isSiegeArtillery ? 5.8 : 4.2);
    tracerCore.position.z = -0.38;
    shellGroup.add(hotTip, tracerCore);

    // 3. Stabilizer Sabot Fins
    for (let f = 0; f < 2; f++) {
        const fin = new THREE.Mesh(SHARED_FX_GEO.tankFin, MAT.darkSteel);
        fin.rotation.z = (f * Math.PI) / 2;
        if (isSiegeArtillery) fin.scale.set(1.35, 1.35, 1.25);
        fin.position.z = -0.34;
        shellGroup.add(fin);
    }

    // 4. Supersonic Mach Shockwave Collar Ring(s)
    const machRing = new THREE.Mesh(SHARED_FX_GEO.waterRippleRing, isSiegeArtillery ? SHARED_FX_MAT.shockCyan : SHARED_FX_MAT.shockAmber);
    machRing.rotation.x = Math.PI / 2;
    machRing.scale.setScalar(isSiegeArtillery ? 0.76 : 0.52);
    machRing.position.z = 0.10;
    shellGroup.add(machRing);

    if (isSiegeArtillery) {
        const aftRing = new THREE.Mesh(SHARED_FX_GEO.waterRippleRing, SHARED_FX_MAT.shockAmber);
        aftRing.rotation.x = Math.PI / 2;
        aftRing.scale.setScalar(0.96);
        aftRing.position.z = -0.22;
        shellGroup.add(aftRing);
        shellGroup.userData = { isSiegeShell: true, machRing, aftRing };
    }

    return shellGroup;
}

function detonateTankKineticShell(pos, isSiegeArtillery = false) {
    triggerMuzzleFlash(pos.clone().add(new THREE.Vector3(0, 1.0, 0)));
    screenShake = Math.max(screenShake, isSiegeArtillery ? 0.52 : 0.34);
    if (window.triggerHitstop) window.triggerHitstop(isSiegeArtillery ? 0.045 : 0.03);
    if (window.SFX) window.SFX.playExplosion(true);
    triggerWaterRippleFX(pos.x, pos.z, isSiegeArtillery ? 2.45 : 1.85, true);

    // Always carve a real 3D crater depression & permanent scorched crater rim into the terrain on Tank/Siege Tank shell impact!
    spawnBombCrater(pos, isSiegeArtillery ? 1.32 : 0.98);
    if (typeof deformTerrainCrater === 'function') {
        deformTerrainCrater(pos.x, pos.z, isSiegeArtillery ? 2.65 : 1.95, isSiegeArtillery ? 0.36 : 0.24);
    }

    // Spawn Physics-Simulated Volumetric Combustion Plumes & Ballistic Armor-Spall Embers
    spawnSimulatedVolumetricExplosion(
        pos,
        isSiegeArtillery ? 1.35 : 0.95,
        isSiegeArtillery ? 1.85 : 1.38,
        0.0,
        isSiegeArtillery ? 14 : 10,
        isSiegeArtillery ? 22 : 16
    );
}

// --- SUBTLE DEATH-ONLY BLOOD & XENO-GORE SPLASHES (Only triggered when ground units die!) ---
function spawnXenoBugGoreExplosion(pos, isBig = false, isVolatile = false) {
    spawnGoreExplosion(pos, isBig, isVolatile, true, null);
}

function spawnGoreExplosion(pos, isBig = false, isVolatile = false, isBug = true, impulseVec = null) {
    triggerWaterRippleFX(pos.x, pos.z, isBig ? 1.2 : 0.7, false);

    if (!isBug) {
        spawnAlliedBloodPhysicsSplash(pos, impulseVec);
        return;
    }

    if (isBig || isVolatile) {
        screenShake = Math.max(screenShake, 0.20);
        if (window.SFX) window.SFX.playExplosion(false);
    }

    const sacCount = isBig ? 10 : 5;
    for (let i = 0; i < sacCount; i++) {
        if (particles.length >= 145) {
            const old = particles.shift();
            scene.remove(old.mesh);
        }
        const isSac = i % 3 === 0;
        const mat = isVolatile
            ? (i % 2 === 0 ? MAT.volatileGlow : MAT.xenoIchorGreen)
            : (i % 3 === 0 ? MAT.xenoIchorGreen : (i % 3 === 1 ? MAT.xenoIchorViolet : MAT.chitinArmor));
        const geo = isSac ? SHARED_FX_GEO.xenoSac : SHARED_FX_GEO.goreChunk;
        const chunk = new THREE.Mesh(geo, mat);
        chunk.scale.set(
            0.55 + Math.random() * 0.55,
            isSac ? (0.85 + Math.random() * 0.4) : (0.45 + Math.random() * 0.4),
            0.55 + Math.random() * 0.55
        );
        chunk.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.35, (Math.random() - 0.5) * 0.3));
        scene.add(chunk);

        const ang = Math.random() * Math.PI * 2;
        const spd = (isBig ? 4.8 : 3.2) + Math.random() * 3.5;
        particles.push({
            mesh: chunk,
            vel: new THREE.Vector3(Math.cos(ang) * spd, 2.2 + Math.random() * 4.2, Math.sin(ang) * spd),
            gravity: 16.0,
            life: 0.45 + Math.random() * 0.25
        });
    }

    // Subtle 3D viscoelastic goo splash on ground
    const hy = getTerrainHeight(pos.x, pos.z);
    if (hy > -1.0) {
        const decal = spawnDynamicLiquidGoreDecal(
            pos,
            isVolatile ? SHARED_FX_MAT.splatXenoViolet : SHARED_FX_MAT.splatXenoAcid,
            'drop',
            impulseVec
        );
        if (decal) decal.scale.setScalar(0.28);
    }
}

// --- ORGANIC 3D VISCOELASTIC GOO & ACID DROPLET SPLASH FX FOR ENEMY PROJECTILES ---
// Replaces flat white expanding square block decals/shockwaves on enemy projectile impacts
// with 3D viscoelastic slime/goo globules, splashing bio-jelly droplets, and organic ground puddles!
function spawnEnemyGooSplashFX(pos, wType = 'spitter') {
    if (!pos) return;
    const hy = getTerrainHeight(pos.x, pos.z);
    const baseY = Math.max(hy + 0.08, pos.y);
    const isHeavy = (wType === 'behemoth' || wType === 'gorgon');
    const isViolet = (wType === 'behemoth' || wType === 'mutalisk');

    triggerWaterRippleFX(pos.x, pos.z, isHeavy ? 1.15 : 0.65, false);

    const jellyMats = (typeof getBioJellyMaterials === 'function') ? getBioJellyMaterials() : null;
    const primaryMat = isViolet
        ? (jellyMats ? jellyMats.violetCore : MAT.xenoIchorViolet)
        : (jellyMats ? jellyMats.acidCore : MAT.acidGlow);
    const secondaryMat = isViolet
        ? (jellyMats ? jellyMats.violetOuter : MAT.hiveVeinGlow)
        : (jellyMats ? jellyMats.acidOuter : MAT.xenoIchorGreen);

    // 1. Burst 10–18 3D Viscoelastic Goo Globules & Stretched Slime Droplets in parabolic arcs
    const dropCount = particles.length > 90 ? 7 : (isHeavy ? 16 : 10);
    for (let i = 0; i < dropCount; i++) {
        if (particles.length >= 165) {
            const old = particles.shift();
            if (old && old.mesh) scene.remove(old.mesh);
        }
        const variantIdx = (i % 4) + 1;
        const gooGeo = createProceduralViscoelasticGooGeo(
            isHeavy ? 0.13 : 0.095,
            isHeavy ? 0.11 : 0.085,
            isHeavy ? 0.22 : 0.16,
            variantIdx
        );
        const droplet = new THREE.Mesh(gooGeo, (i % 3 === 0) ? secondaryMat : primaryMat);
        const s = (isHeavy ? 0.85 : 0.62) + Math.random() * 0.55;
        droplet.scale.set(s * 0.85, s * 0.85, s * 1.45);
        droplet.position.set(
            pos.x + (Math.random() - 0.5) * 0.35,
            baseY + 0.18 + Math.random() * 0.25,
            pos.z + (Math.random() - 0.5) * 0.35
        );
        scene.add(droplet);

        const ang = (i / dropCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
        const horizSpd = (isHeavy ? 3.4 : 2.2) + Math.random() * (isHeavy ? 4.2 : 2.8);
        const upSpd = (isHeavy ? 3.2 : 2.1) + Math.random() * (isHeavy ? 3.6 : 2.4);
        const vel = new THREE.Vector3(Math.cos(ang) * horizSpd, upSpd, Math.sin(ang) * horizSpd);
        droplet.lookAt(droplet.position.x + vel.x, droplet.position.y + vel.y, droplet.position.z + vel.z);

        particles.push({
            mesh: droplet,
            vel,
            gravity: 15.5,
            drag: 1.2,
            isBallisticSpark: true,
            bounces: 1,
            life: 0.34 + Math.random() * 0.24
        });
    }

    // 2. Organic 3D Viscoelastic Slime Puddle on Ground (Zero flat planes!)
    if (hy > -1.0) {
        const puddle = spawnDynamicLiquidGoreDecal(
            pos,
            isViolet ? SHARED_FX_MAT.splatXenoViolet : SHARED_FX_MAT.splatXenoAcid,
            isHeavy ? 'small' : 'drop',
            null
        );
        if (puddle) {
            puddle.scale.setScalar(isHeavy ? 0.48 : 0.30);
        }
    }
}
window.spawnEnemyGooSplashFX = spawnEnemyGooSplashFX;

// SUBTLE ALLIED GROUND UNIT DEATH BLOOD SPLASH: Only a little splash & small droplets on death!
function spawnAlliedBloodPhysicsSplash(pos, impulseVec = null) {
    const baseDirX = impulseVec ? impulseVec.x * 0.35 : 0;
    const baseDirZ = impulseVec ? impulseVec.z * 0.35 : 0;

    // Small, subtle liquid splash decal only when unit dies
    const decal = spawnDynamicLiquidGoreDecal(pos, SHARED_FX_MAT.splatCrimsonBlood, 'drop', impulseVec);
    if (decal) decal.scale.setScalar(0.26);

    // Spawn only 6 small blood droplets (subtle ground unit death splash)
    const dropCount = 6;
    for (let i = 0; i < dropCount; i++) {
        if (bloodDrops.length >= 40) {
            const old = bloodDrops.shift();
            scene.remove(old.mesh);
        }
        const dropMesh = new THREE.Mesh(
            SHARED_FX_GEO.bloodDrop,
            i % 3 === 0 ? MAT.goreMeat : MAT.crimsonBlood
        );
        const s = 0.42 + Math.random() * 0.35;
        dropMesh.scale.set(s * 0.65, s * 0.65, s * 1.5);
        dropMesh.position.copy(pos).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.25,
            0.35 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.25
        ));
        scene.add(dropMesh);

        const ang = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 2.6;
        const vx = baseDirX + Math.cos(ang) * speed;
        const vz = baseDirZ + Math.sin(ang) * speed;
        const vy = 1.8 + Math.random() * 2.6;

        bloodDrops.push({
            mesh: dropMesh,
            vel: new THREE.Vector3(vx, vy, vz),
            size: s,
            splashed: false,
            life: 0.85
        });
    }
}

function updateBloodPhysicsDrops(dt) {
    updateDynamicGoreSplashes(dt);
    for (let i = bloodDrops.length - 1; i >= 0; i--) {
        const bd = bloodDrops[i];
        bd.life -= dt;
        bd.mesh.position.addScaledVector(bd.vel, dt);
        bd.vel.y -= 18.5 * dt;
        bd.vel.x *= (1 - dt * 0.8);
        bd.vel.z *= (1 - dt * 0.8);

        if (bd.vel.lengthSq() > 0.01) {
            const lookPt = bd.mesh.position.clone().add(bd.vel);
            bd.mesh.lookAt(lookPt);
        }

        const gx = bd.mesh.position.x;
        const gz = bd.mesh.position.z;
        const groundY = getTerrainHeight(gx, gz);

        if (bd.mesh.position.y <= groundY + 0.04) {
            scene.remove(bd.mesh);
            bloodDrops.splice(i, 1);
            continue;
        }

        if (bd.life <= 0) {
            scene.remove(bd.mesh);
            bloodDrops.splice(i, 1);
        }
    }
}

// Shared Procedural Radial Scorch Decal Material (Lazy-Initialized once for Permanent Battle Scars!)
let _permanentScorchDecalMat = null;
let _permanentScorchDecalGeo = null;
function getPermanentScorchAssets() {
    if (!_permanentScorchDecalMat) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);

        // Soft charred outer soot gradient
        const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
        grad.addColorStop(0.0, 'rgba(10, 8, 7, 0.96)');
        grad.addColorStop(0.38, 'rgba(22, 18, 15, 0.88)');
        grad.addColorStop(0.68, 'rgba(34, 28, 22, 0.52)');
        grad.addColorStop(1.0, 'rgba(20, 16, 12, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(128, 128, 122, 0, Math.PI * 2);
        ctx.fill();

        // Jagged radial blast-ray streaks
        ctx.save();
        ctx.translate(128, 128);
        for (let r = 0; r < 28; r++) {
            const ang = (r / 28) * Math.PI * 2 + (r * 0.37);
            const len = 62 + (r % 5) * 12;
            ctx.save();
            ctx.rotate(ang);
            ctx.fillStyle = r % 2 === 0 ? 'rgba(12, 10, 8, 0.58)' : 'rgba(42, 32, 22, 0.42)';
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(len, 0);
            ctx.lineTo(0, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        const tex = new THREE.CanvasTexture(c);
        _permanentScorchDecalMat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.94,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
        });
        _permanentScorchDecalGeo = createDynamicLiquidSplashGeo(1.25, 14, 0.22, 1.0, 77);
    }
    return { mat: _permanentScorchDecalMat, geo: _permanentScorchDecalGeo };
}

// 3D Sculpted Bomb & Explosive Projectile Impact Crater + Permanent Scorch Decal Spawner
// Visually chronicles the intensity of ongoing battles across the terrain!
function spawnBombCrater(pos, scale = 1.0) {
    if (!pos) return;
    const hy = getTerrainHeight(pos.x, pos.z);
    if (hy < -0.26) return; // Don't place dry scorch craters underwater

    // Merge/skip if another permanent crater is already at this exact spot (< 0.55m) to prevent excessive stacking
    for (let i = bombCraters.length - 1; i >= Math.max(0, bombCraters.length - 25); i--) {
        const existing = bombCraters[i];
        if (existing && existing.group) {
            const dx = existing.group.position.x - pos.x;
            const dz = existing.group.position.z - pos.z;
            if (dx * dx + dz * dz < 0.32) {
                // Re-heat existing crater ember & slightly enlarge it!
                existing.age = 0;
                existing.cooled = false;
                const curS = existing.group.scale.x;
                existing.group.scale.setScalar(Math.min(1.65, curS * 1.08));
                return;
            }
        }
    }

    // Deform terrain vertices slightly at impact site
    if (typeof deformTerrainCrater === 'function') {
        deformTerrainCrater(pos.x, pos.z, 2.1 * scale, 0.14 * scale);
    }

    const craterGroup = new THREE.Group();
    const newHy = getTerrainHeight(pos.x, pos.z);
    craterGroup.position.set(pos.x, newHy + 0.025, pos.z);

    const norm = getTerrainNormal(pos.x, pos.z);
    craterGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
    const finalScale = (0.72 + Math.random() * 0.28) * scale;
    craterGroup.scale.setScalar(finalScale);

    // 1. Permanent Radial Blast-Ray Scorch Mark Decal on Terrain
    const scorchAssets = getPermanentScorchAssets();
    const scorchDecal = new THREE.Mesh(scorchAssets.geo, scorchAssets.mat);
    scorchDecal.rotation.y = Math.random() * Math.PI * 2;
    scorchDecal.position.y = 0.008;

    // 2. 3D Sculpted Shattered Crater Rim
    const rimMesh = new THREE.Mesh(SHARED_FX_GEO.craterRim, SHARED_FX_MAT.craterScorch);
    rimMesh.rotation.y = Math.random() * Math.PI * 2;
    rimMesh.receiveShadow = true;

    // 3. Molten Ember Crater Pit (Cools into permanent dark charred ash over 8 seconds)
    const emberMat = new THREE.MeshBasicMaterial({
        color: 0xff6a00,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide
    });
    const emberFloor = new THREE.Mesh(SHARED_FX_GEO.craterCenter, emberMat);
    emberFloor.position.y = 0.028;

    craterGroup.add(scorchDecal, rimMesh, emberFloor);
    scene.add(craterGroup);

    bombCraters.push({
        group: craterGroup,
        emberMat,
        age: 0,
        cooled: false
    });

    // Keep up to 160 permanent battle craters across the battlefield before recycling the oldest one
    if (bombCraters.length > 160) {
        const old = bombCraters.shift();
        if (old.emberMat) old.emberMat.dispose();
        scene.remove(old.group);
    }
}
window.spawnBombCrater = spawnBombCrater;

function updateBombCraters(dt) {
    for (let i = 0; i < bombCraters.length; i++) {
        const bc = bombCraters[i];
        if (bc.cooled) continue;
        bc.age += dt;
        // Cool glowing molten ember floor over first 8 seconds into permanent dark scorched obsidian/ash
        if (bc.age < 8.0) {
            const coolRatio = bc.age / 8.0;
            bc.emberMat.color.setRGB(
                1.0 * (1 - coolRatio) + 0.07 * coolRatio,
                0.42 * (1 - coolRatio) + 0.055 * coolRatio,
                0.02 * (1 - coolRatio) + 0.045 * coolRatio
            );
        } else {
            bc.emberMat.color.setRGB(0.07, 0.055, 0.045);
            bc.cooled = true;
        }
    }
}

// ============================================================================
// PHYSICS-SIMULATED TURBULENT VOLUMETRIC COMBUSTION & FLUID EXPLOSION ENGINE
// Replaces rigid SphereGeometry fireballs, CylinderGeometry pillars, and hard rings
// with multi-layered FBM/curl-noise blackbody thermal plumes + ballistic spark streaks!
// ============================================================================
// 3D Particle System Radial Blast Wave & Psionic/Energy Burst Engine (ZERO flat PlaneGeometry squares!)
function spawnParticleBlastWaveFX(pos, colorHex = 0x38bdf8, radiusScale = 1.0, particleCount = 14) {
    if (!pos) return;
    const hy = getTerrainHeight(pos.x, pos.z);
    const baseY = Math.max(hy + 0.14, pos.y + 0.12);
    const isGoldOrAmber = (colorHex === 0xf5b932 || colorHex === 0xffaa00 || colorHex === 0xffb700);
    const isCrimson = (colorHex === 0xff2a4b || colorHex === 0xff5400);
    const isEmerald = (colorHex === 0x00ff88 || colorHex === 0x10b981 || colorHex === 0x84cc16);
    const isViolet = (colorHex === 0xd946ef || colorHex === 0xc026d3);

    const primaryMat = isGoldOrAmber
        ? (MAT.solarisGold || MAT.amberGlow)
        : (isCrimson ? (MAT.volatileGlow || MAT.amberGlow)
            : (isEmerald ? (MAT.healGlow || MAT.cyanGlow)
                : (isViolet ? (MAT.hiveVeinGlow || MAT.cyanGlow) : (MAT.solarisPrismGlow || MAT.cyanGlow))));
    const secondaryMat = isGoldOrAmber
        ? (MAT.solarisPrismGlow || MAT.cyanGlow)
        : (isCrimson ? MAT.amberGlow : MAT.cyanGlow);

    const count = particles.length > 105 ? Math.max(6, Math.floor(particleCount * 0.55)) : particleCount;
    for (let i = 0; i < count; i++) {
        if (particles.length >= 175) {
            const old = particles.shift();
            if (old && old.mesh) scene.remove(old.mesh);
        }
        const isStreak = (i % 2 === 0);
        const geo = isStreak ? SHARED_FX_GEO.weldSpark : SHARED_FX_GEO.bloodDrop;
        const pMesh = new THREE.Mesh(geo, (i % 3 === 0) ? secondaryMat : primaryMat);
        const s = (0.62 + Math.random() * 0.52) * Math.sqrt(radiusScale);
        if (isStreak) {
            pMesh.scale.set(s * 0.65, s * 0.65, s * 2.15);
        } else {
            pMesh.scale.set(s * 0.85, s * 0.85, s * 1.45);
        }

        const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const initR = 0.14 * radiusScale;
        pMesh.position.set(
            pos.x + Math.cos(ang) * initR,
            baseY + (Math.random() * 0.22) * radiusScale,
            pos.z + Math.sin(ang) * initR
        );

        const horizSpd = (4.8 + Math.random() * 6.4) * radiusScale;
        const upSpd = (1.2 + Math.random() * 3.4) * Math.sqrt(radiusScale);
        const vel = new THREE.Vector3(Math.cos(ang) * horizSpd, upSpd, Math.sin(ang) * horizSpd);
        pMesh.lookAt(pMesh.position.x + vel.x, pMesh.position.y + vel.y, pMesh.position.z + vel.z);
        scene.add(pMesh);

        particles.push({
            mesh: pMesh,
            vel,
            gravity: isEmerald ? -2.0 : 9.5,
            drag: 3.4,
            isThrustParticle: true,
            life: 0.24 + Math.random() * 0.18
        });
    }
}
window.spawnParticleBlastWaveFX = spawnParticleBlastWaveFX;

function spawnSimulatedVolumetricExplosion(pos, radiusScale = 1.0, peakTemp = 1.5, hueMode = 0.0, plumeCount = 8, sparkCount = 12) {
    if (!pos) return;
    const hy = getTerrainHeight(pos.x, pos.z);
    const baseY = Math.max(hy, pos.y);

    // 1. 3D Radial Particle Pressure Burst (Replaces flat square shockRing PlaneGeometry!)
    const burstColor = hueMode > 1.5 ? 0x84cc16 : (hueMode > 0.5 ? 0x38bdf8 : 0xffaa00);
    spawnParticleBlastWaveFX(pos, burstColor, radiusScale * 0.92, Math.min(14, Math.max(6, sparkCount)));

    // 2. Multi-Layered Turbulent Combustion Plumes (Adaptive count during heavy multi-unit firefights)
    const effectivePlumes = smokeClouds.length > 26 ? Math.min(3, plumeCount) : Math.min(6, plumeCount);
    for (let i = 0; i < effectivePlumes; i++) {
        if (smokeClouds.length >= 48) {
            const old = smokeClouds.shift();
            if (old && old.mesh) {
                scene.remove(old.mesh);
                if (old.ownsMaterial && old.mesh.material) old.mesh.material.dispose();
            }
        }
        const layerFrac = i / Math.max(1, effectivePlumes - 1);
        const isCoreFlash = i < 2;
        const isUpperCrown = i >= Math.floor(effectivePlumes * 0.55);

        const plumeMat = isCoreFlash ? SHARED_FX_MAT.smokeFire : SHARED_FX_MAT.smokeDark;

        const plumeMesh = new THREE.Mesh(SHARED_FX_GEO.smoke, plumeMat);
        const ang = (i / effectivePlumes) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
        const radialDist = isCoreFlash
            ? (Math.random() * 0.22 * radiusScale)
            : ((0.28 + Math.random() * 0.68) * radiusScale);

        const initScale = (isCoreFlash ? 1.35 : (isUpperCrown ? 1.18 : 0.92)) * radiusScale * (0.85 + Math.random() * 0.32);
        plumeMesh.scale.setScalar(initScale);
        plumeMesh.position.set(
            pos.x + Math.cos(ang) * radialDist,
            baseY + (isCoreFlash ? 0.42 : (isUpperCrown ? 0.78 + layerFrac * 0.55 : 0.28 + layerFrac * 0.35)) * radiusScale,
            pos.z + Math.sin(ang) * radialDist
        );
        scene.add(plumeMesh);

        const horizSpeed = (isCoreFlash ? 0.8 : (isUpperCrown ? 2.4 : 3.2)) * radiusScale * (0.75 + Math.random() * 0.5);
        const vertSpeed = (isCoreFlash ? 1.8 : (isUpperCrown ? 3.8 : 1.6)) * radiusScale * (0.8 + Math.random() * 0.45);
        const maxLife = isCoreFlash
            ? (0.38 + Math.random() * 0.18)
            : (0.68 + Math.random() * 0.35);

        smokeClouds.push({
            mesh: plumeMesh,
            vel: new THREE.Vector3(
                Math.cos(ang) * horizSpeed,
                vertSpeed,
                Math.sin(ang) * horizSpeed
            ),
            buoyancy: isUpperCrown ? 3.6 : 2.4,
            drag: isCoreFlash ? 3.2 : 2.4,
            expandRate: isCoreFlash ? 2.2 : 1.35,
            age: 0,
            maxLife,
            life: maxLife,
            ownsMaterial: false
        });
    }

    // 3. Ballistic Incandescent Spark Streaks & Molten Shrapnel Embers
    const effectiveSparks = particles.length > 55 ? Math.min(4, sparkCount) : Math.min(8, sparkCount);
    for (let i = 0; i < effectiveSparks; i++) {
        if (particles.length >= 96) {
            const old = particles.shift();
            if (old && old.mesh) scene.remove(old.mesh);
        }
        const isStreak = i % 3 !== 0;
        const sparkMat = hueMode > 0.5
            ? (i % 2 === 0 ? MAT.cyanGlow : MAT.solarisPrismGlow)
            : (i % 3 === 0 ? MAT.volatileGlow : (i % 3 === 1 ? MAT.amberGlow : MAT.charredSteel));
        const p = new THREE.Mesh(
            isStreak ? SHARED_FX_GEO.weldSpark : SHARED_FX_GEO.shrapnel,
            sparkMat
        );
        const s = (isStreak ? (0.72 + Math.random() * 0.55) : (0.85 + Math.random() * 0.65)) * Math.sqrt(radiusScale);
        if (isStreak) {
            p.scale.set(s * 0.65, s * 0.65, s * 1.85);
        } else {
            p.scale.setScalar(s);
        }
        p.position.set(
            pos.x + (Math.random() - 0.5) * 0.45 * radiusScale,
            baseY + 0.32 * radiusScale,
            pos.z + (Math.random() - 0.5) * 0.45 * radiusScale
        );
        scene.add(p);

        const ejectAng = (i / effectiveSparks) * Math.PI * 2 + (Math.random() - 0.5) * 0.42;
        const ejectSpd = (6.2 + Math.random() * 10.5) * Math.sqrt(radiusScale);
        particles.push({
            mesh: p,
            vel: new THREE.Vector3(
                Math.cos(ejectAng) * ejectSpd,
                (4.2 + Math.random() * 8.5) * Math.sqrt(radiusScale),
                Math.sin(ejectAng) * ejectSpd
            ),
            gravity: 19.5,
            drag: isStreak ? 1.4 : 0.8,
            isBallisticSpark: isStreak,
            bounces: 0,
            life: 0.42 + Math.random() * 0.32
        });
    }
}
window.spawnSimulatedVolumetricExplosion = spawnSimulatedVolumetricExplosion;

function detonateArtilleryBomb(pos, leaveCrater = true) {
    triggerMuzzleFlash(pos.clone().add(new THREE.Vector3(0, 1.35, 0)));
    screenShake = Math.max(screenShake, 0.48);
    if (window.triggerHitstop) window.triggerHitstop(0.04);
    if (window.SFX) window.SFX.playExplosion(true);

    triggerWaterRippleFX(pos.x, pos.z, 2.25, true);

    if (leaveCrater) {
        spawnBombCrater(pos, 1.08);
    }

    spawnSimulatedVolumetricExplosion(pos, 1.25, 1.60, 0.0, 8, 12);
}

// Firebat Twin Perdition Flamethrower Cone Stream FX (Turbulent Fluid Combustion Stream)
function triggerFirebatFlameStreamFX(muzzlePos, targetPos) {
    const dir = new THREE.Vector3().subVectors(targetPos, muzzlePos);
    const dist = Math.max(0.8, Math.min(5.2, dir.length()));
    dir.normalize();
    const count = smokeClouds.length > 26 ? 2 : 3;
    for (let i = 0; i < count; i++) {
        if (smokeClouds.length >= 46) break;
        const frac = (i + 1) / count;
        const plumeMat = i < 2 ? SHARED_FX_MAT.smokeFire : SHARED_FX_MAT.smokeDark;
        const flameOrb = new THREE.Mesh(SHARED_FX_GEO.smoke, plumeMat);
        flameOrb.scale.setScalar(0.36 + frac * 0.62);
        flameOrb.position.copy(muzzlePos).addScaledVector(dir, dist * frac * 0.85);
        flameOrb.position.y += 0.15;
        scene.add(flameOrb);
        const maxLife = 0.28 + Math.random() * 0.14;
        smokeClouds.push({
            mesh: flameOrb,
            vel: new THREE.Vector3(
                dir.x * 3.2 + (Math.random() - 0.5) * 1.1,
                1.1 + Math.random() * 1.3,
                dir.z * 3.2 + (Math.random() - 0.5) * 1.1
            ),
            buoyancy: 2.8,
            drag: 3.0,
            expandRate: 1.85,
            age: 0,
            maxLife,
            life: maxLife,
            ownsMaterial: false
        });
    }
}

// Ballistic Impact Spark Burst Helper (Used by Marauder Concussive Shells & Ordnance Impacts)
function triggerSparks(pos, count = 6) {
    if (!pos) return;
    const hy = getTerrainHeight(pos.x, pos.z);
    for (let i = 0; i < count; i++) {
        if (particles.length >= 165) {
            const old = particles.shift();
            if (old && old.mesh) scene.remove(old.mesh);
        }
        const sp = new THREE.Mesh(
            i % 2 === 0 ? SHARED_FX_GEO.weldSpark : SHARED_FX_GEO.spark,
            i % 3 === 0 ? MAT.volatileGlow : MAT.amberGlow
        );
        const s = 0.78 + Math.random() * 0.45;
        sp.scale.set(s * 0.65, s * 0.65, s * 1.75);
        sp.position.set(
            pos.x + (Math.random() - 0.5) * 0.35,
            Math.max(hy + 0.18, pos.y + 0.25),
            pos.z + (Math.random() - 0.5) * 0.35
        );
        scene.add(sp);
        const ang = (i / Math.max(1, count)) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const spd = 4.2 + Math.random() * 5.8;
        particles.push({
            mesh: sp,
            vel: new THREE.Vector3(Math.cos(ang) * spd, 2.6 + Math.random() * 4.2, Math.sin(ang) * spd),
            gravity: 17.5,
            drag: 1.5,
            isBallisticSpark: true,
            bounces: 0,
            life: 0.32 + Math.random() * 0.20
        });
    }
}
window.triggerSparks = triggerSparks;

// Marauder Punisher Concussive Grenade Blast FX (Simulated Turbulent Blast Plume + Ballistic Sparks)
function detonateMarauderConcussiveShell(pos) {
    spawnSimulatedVolumetricExplosion(pos, 0.56, 1.32, 0.0, 5, 8);
}

// HQ Emergency Repair Overload Shockwave Bomb (Instant-kills surrounding enemies to prevent spawn-camping)
function detonateHQOverloadBlast(pos) {
    triggerMuzzleFlash(pos.clone().add(new THREE.Vector3(0, 2.2, 0)));
    screenShake = Math.max(screenShake, 0.85);
    if (window.triggerHitstop) window.triggerHitstop(0.08);
    if (window.SFX) window.SFX.playExplosion(true);
    triggerWaterRippleFX(pos.x, pos.z, 2.2, true);

    // Primary 3D EMP Particle Burst + Simulated Plasma-Thermal Combustion Plumes & EMP Sparks (Zero flat square planes!)
    spawnParticleBlastWaveFX(pos, 0x38bdf8, 1.85, 22);
    spawnSimulatedVolumetricExplosion(pos, 1.45, 1.65, 1.0, 14, 26);
}

// Distinct Structural Nano-Weld Spark FX (Used by Fixing Drone on damaged buildings)
function spawnNanoWeldSparkFX(pos) {
    const hy = getTerrainHeight(pos.x, pos.z);
    spawnParticleBlastWaveFX(pos, 0x38bdf8, 0.55, 8);

    // Flying Cyan & Amber Arc-Welding Sparks
    for (let i = 0; i < 6; i++) {
        if (particles.length >= 140) {
            const old = particles.shift();
            scene.remove(old.mesh);
        }
        const spark = new THREE.Mesh(SHARED_FX_GEO.weldSpark, i % 2 === 0 ? MAT.cyanGlow : MAT.amberGlow);
        spark.position.set(
            pos.x + (Math.random() - 0.5) * 1.4,
            Math.max(hy + 0.3, pos.y + 0.5 + Math.random() * 0.8),
            pos.z + (Math.random() - 0.5) * 1.4
        );
        scene.add(spark);
        particles.push({
            mesh: spark,
            vel: new THREE.Vector3((Math.random() - 0.5) * 5.5, 2.5 + Math.random() * 3.5, (Math.random() - 0.5) * 5.5),
            gravity: 16,
            life: 0.32 + Math.random() * 0.2
        });
    }
}

// Distinct Caduceus Biological Cellular Regeneration FX (Used by Combat Medic on injured infantry)
const medicNaniteGeo = createSculptedFacetedCrystalGeo(0.05, 0);
function spawnMedicBioPulseFX(pos) {
    // Rising 3D Emerald Bio-Nanite Particle Burst (Zero flat square planes!)
    spawnParticleBlastWaveFX(pos, 0x00ff88, 0.52, 8);

    // Rising Restorative Nano-Sparkles (negative gravity so they float upward around the healed soldier)
    for (let i = 0; i < 5; i++) {
        if (particles.length >= 140) {
            const old = particles.shift();
            scene.remove(old.mesh);
        }
        const a = (i / 5) * Math.PI * 2 + Math.random();
        const orb = new THREE.Mesh(medicNaniteGeo, i % 2 === 0 ? MAT.healGlow : MAT.cyanGlow);
        orb.position.set(pos.x + Math.cos(a) * 0.42, pos.y + 0.35, pos.z + Math.sin(a) * 0.42);
        scene.add(orb);
        particles.push({
            mesh: orb,
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 2.0 + Math.random() * 1.4, (Math.random() - 0.5) * 0.5),
            gravity: -1.8,
            life: 0.52 + Math.random() * 0.25
        });
    }
}

// 3D Forcefield Energy Shield Dome Mesh for Turret 'shield' Generator
// Crystal-clear see-through interior so buildings & units inside are 100% visible, with 3D hit ripple animation!
function createTurretShieldDomeMesh(radius = 9.5) {
    const group = new THREE.Group();
    const domeGeo = createSculptedArmorDomeGeo(radius, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const domeMat = (typeof SHADER_ENGINE !== 'undefined' && SHADER_ENGINE.shieldShaderMat)
        ? SHADER_ENGINE.shieldShaderMat
        : (SHARED_FX_MAT.shieldDome || MAT.cyanGlow);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.renderOrder = 12;
    const wire = new THREE.Mesh(domeGeo, SHARED_FX_MAT.shieldDomeWire || SHARED_FX_MAT.shieldWire);
    wire.renderOrder = 13;
    const baseRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });
    const baseRing = new THREE.Mesh(
        new THREE.RingGeometry(radius - 0.16, radius + 0.04, 56).rotateX(-Math.PI / 2),
        baseRingMat
    );
    baseRing.position.y = 0.14;
    group.add(dome, wire, baseRing);
    group.userData = { dome, wire, baseRing, radius, isShieldDome: true };
    // Disable raycasting on the shield dome so it NEVER blocks clicking/tapping buildings inside or behind the shield!
    group.traverse(c => { c.raycast = () => {}; });
    return group;
}

// Triggers a 3D concentric energy ripple across the Force Shield Dome when hit by enemy fire!
function triggerShieldHitRippleFX(hitWorldPos, domeCenterPos = null, domeRadius = 9.5) {
    if (!hitWorldPos) return;
    let impactPos = hitWorldPos.clone();
    if (domeCenterPos) {
        const dir = impactPos.clone().sub(domeCenterPos);
        if (dir.lengthSq() > 0.01) {
            dir.normalize();
            impactPos = domeCenterPos.clone().addScaledVector(dir, domeRadius * 0.96);
            impactPos.y = Math.max(domeCenterPos.y + 0.8, impactPos.y);
        }
    }
    if (typeof window.pushShieldHitRipple === 'function') {
        window.pushShieldHitRipple(impactPos.x, impactPos.y, impactPos.z, 1.35);
    }

    // Spawn a tangent 3D expanding energy ripple ring on the shield dome surface
    const rippleMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const rippleMesh = new THREE.Mesh(SHARED_FX_GEO.waterRippleRing, rippleMat);
    rippleMesh.position.copy(impactPos);
    if (domeCenterPos) {
        rippleMesh.lookAt(domeCenterPos);
    }
    scene.add(rippleMesh);
    shockwaves.push({ mesh: rippleMesh, scale: 0.35, speed: 6.2, alpha: 0.95, isOriented: true });
}

// Tank 120mm / 180mm Cannon Muzzle Blast Effect (100% Dynamic Multi-Stage 3D Particle Generation — Zero Static Attached Shapes!)
function triggerTankCannonMuzzleFlash(tankMesh, muzzleWorldPos, targetPos = null) {
    let isSiege = false;
    if (tankMesh && tankMesh.userData) {
        tankMesh.userData.attackAnim = 1.0;
        isSiege = !!(tankMesh.userData.vType === 'siege_tank' && tankMesh.userData.siegeMode);
    }
    triggerTankMuzzleFlash(muzzleWorldPos, targetPos, isSiege);
}

// ============================================================================
// ALGORITHMIC VISCOELASTIC BIO-GOO / SPIT / JELLY PROJECTILE SYNTHESIZER
// Zero basic primitive shapes: constructs organic metaball / droplet surfaces
// purely from multi-harmonic spherical-polar field synthesis + trailing mucus strands.
// ============================================================================
const _bioGooGeoCache = {};
function createProceduralViscoelasticGooGeo(rx = 0.16, ry = 0.15, rz = 0.24, variantKey = 0) {
    const cacheKey = `${rx.toFixed(3)}_${ry.toFixed(3)}_${rz.toFixed(3)}_${variantKey}`;
    if (_bioGooGeoCache[cacheKey]) return _bioGooGeoCache[cacheKey];

    const uSteps = 14;
    const vSteps = 12;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const seed = variantKey * 2.39996;

    for (let iv = 0; iv <= vSteps; iv++) {
        const v = iv / vSteps;
        const phi = v * Math.PI; // 0 (front nose +Z) to PI (trailing tail -Z)
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // Teardrop / viscoelastic spit profile: bulbous front, pinched waist, drawn-out trailing goo tail
        const tearEnvelope = cosPhi >= 0
            ? (1.0 + 0.18 * Math.sin(phi * 2.0))
            : (1.0 + 0.55 * Math.pow(-cosPhi, 1.35));

        for (let iu = 0; iu <= uSteps; iu++) {
            const u = iu / uSteps;
            const theta = u * Math.PI * 2;

            // Multi-octave harmonic metaball surface perturbation (organic jelly lobes, zero flat/spherical uniformity)
            const h1 = Math.sin(theta * 3.0 + seed) * Math.cos(phi * 2.0 - seed * 0.7) * 0.22;
            const h2 = Math.cos(theta * 4.0 - phi * 3.0 + seed * 1.3) * 0.15;
            const h3 = Math.sin(theta * 5.0 + phi * 4.0 - seed * 2.1) * 0.09;
            const pinchNeck = Math.sin(phi * 3.0) * 0.12;
            const rMod = Math.max(0.38, 1.0 + (h1 + h2 + h3 + pinchNeck) * sinPhi);

            const x = Math.cos(theta) * sinPhi * rx * rMod;
            const y = Math.sin(theta) * sinPhi * ry * rMod;
            // Asymmetrical curvature sag (gravity droop on the spit globule)
            const droopY = -Math.pow(sinPhi, 2.0) * ry * 0.16;
            const z = cosPhi * rz * tearEnvelope * (1.0 + h2 * 0.35);

            positions.push(x, y + droopY, z);
            uvs.push(u, v);
            normals.push(0, 1, 0);
        }
    }

    for (let iv = 0; iv < vSteps; iv++) {
        for (let iu = 0; iu < uSteps; iu++) {
            const a = iv * (uSteps + 1) + iu;
            const b = a + uSteps + 1;
            const c = a + 1;
            const d = b + 1;
            indices.push(a, b, c);
            indices.push(c, b, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    _bioGooGeoCache[cacheKey] = geo;
    return geo;
}
window.createProceduralViscoelasticGooGeo = createProceduralViscoelasticGooGeo;

let _jellyShellMats = null;
function getBioJellyMaterials() {
    if (!_jellyShellMats) {
        _jellyShellMats = {
            acidJelly: new THREE.MeshStandardMaterial({
                color: 0x84cc16,
                emissive: 0x4d7c0f,
                emissiveIntensity: 1.15,
                roughness: 0.08,
                metalness: 0.05,
                transparent: true,
                opacity: 0.74,
                depthWrite: false
            }),
            acidNucleus: new THREE.MeshBasicMaterial({
                color: 0xd9f99d,
                transparent: true,
                opacity: 0.96
            }),
            violetJelly: new THREE.MeshStandardMaterial({
                color: 0xc026d3,
                emissive: 0x86198f,
                emissiveIntensity: 1.25,
                roughness: 0.08,
                metalness: 0.08,
                transparent: true,
                opacity: 0.76,
                depthWrite: false
            }),
            violetNucleus: new THREE.MeshBasicMaterial({
                color: 0xf5d0fe,
                transparent: true,
                opacity: 0.96
            }),
            amberBileJelly: new THREE.MeshStandardMaterial({
                color: 0xa3e635,
                emissive: 0x65a30d,
                emissiveIntensity: 1.35,
                roughness: 0.06,
                metalness: 0.05,
                transparent: true,
                opacity: 0.78,
                depthWrite: false
            })
        };
    }
    return _jellyShellMats;
}

function createAlgorithmicBioGooProjectile(wType = 'spitter') {
    const group = new THREE.Group();
    const mats = getBioJellyMaterials();

    const isViolet = (wType === 'mutalisk' || wType === 'spine');
    const isHeavyBile = (wType === 'behemoth' || wType === 'gorgon');
    const baseScale = isHeavyBile ? 1.48 : (wType === 'spine' ? 1.18 : (wType === 'mutalisk' ? 1.12 : 0.92));

    const outerMat = isViolet ? mats.violetJelly : (isHeavyBile ? mats.amberBileJelly : mats.acidJelly);
    const coreMat = isViolet ? mats.violetNucleus : mats.acidNucleus;
    const strandMat = isViolet ? (MAT.hiveVeinGlow || mats.violetJelly) : (MAT.acidGlow || mats.acidJelly);

    // 1. Primary Viscoelastic Jelly Envelope (Translucent undulating mucus membrane)
    const coreBlob = new THREE.Mesh(
        createProceduralViscoelasticGooGeo(0.15 * baseScale, 0.14 * baseScale, 0.25 * baseScale, 1),
        outerMat
    );
    group.add(coreBlob);

    // 2. Suspended Bioluminescent Enzymes / Nucleus Globule inside the jelly
    const innerNucleus = new THREE.Mesh(
        createProceduralViscoelasticGooGeo(0.085 * baseScale, 0.08 * baseScale, 0.13 * baseScale, 2),
        coreMat
    );
    innerNucleus.position.set(0, 0.01 * baseScale, 0.03 * baseScale);
    coreBlob.add(innerNucleus);

    // 3. Coalescing Satellite Spit / Goo Globules (Orbit and merge into the main mass algorithmically)
    const satelliteBlobs = [];
    const satCount = isHeavyBile ? 6 : 4;
    for (let i = 0; i < satCount; i++) {
        const ang = (i / satCount) * Math.PI * 2 + i * 0.55;
        const r = (0.09 + (i % 2) * 0.04) * baseScale;
        const zOff = (-0.04 - (i / satCount) * 0.18) * baseScale;
        const satMesh = new THREE.Mesh(
            createProceduralViscoelasticGooGeo(0.065 * baseScale, 0.06 * baseScale, 0.11 * baseScale, 3 + (i % 3)),
            i % 2 === 0 ? outerMat : coreMat
        );
        const bx = Math.cos(ang) * r;
        const by = Math.sin(ang) * r;
        satMesh.position.set(bx, by, zOff);
        group.add(satMesh);
        satelliteBlobs.push({
            mesh: satMesh,
            baseX: bx,
            baseY: by,
            baseZ: zOff,
            phase: i * 1.57,
            freq: 14.0 + i * 2.3
        });
    }

    // 4. Stretched Viscoelastic Mucus / Spit Strands trailing behind the globule
    const gooStrands = [];
    for (let s = 0; s < 3; s++) {
        const sAng = (s / 3) * Math.PI * 2 + 0.4;
        const strandMesh = new THREE.Mesh(
            createProceduralViscoelasticGooGeo(0.028 * baseScale, 0.026 * baseScale, 0.22 * baseScale, 6 + s),
            strandMat
        );
        const sx = Math.cos(sAng) * 0.055 * baseScale;
        const sy = Math.sin(sAng) * 0.055 * baseScale;
        strandMesh.position.set(sx, sy, -0.22 * baseScale);
        group.add(strandMesh);
        gooStrands.push({
            mesh: strandMesh,
            baseX: sx,
            baseY: sy,
            phase: s * 2.1
        });
    }

    group.userData.isBioGooProj = true;
    group.userData.baseScale = baseScale;
    group.userData.coreBlob = coreBlob;
    group.userData.innerNucleus = innerNucleus;
    group.userData.satelliteBlobs = satelliteBlobs;
    group.userData.gooStrands = gooStrands;
    group.userData.dripMat = coreMat;
    group.userData.dripGeo = createProceduralViscoelasticGooGeo(0.042 * baseScale, 0.04 * baseScale, 0.075 * baseScale, 9);
    return group;
}
window.createAlgorithmicBioGooProjectile = createAlgorithmicBioGooProjectile;

// Gunship Helicopter Under-Belly Minigun Turret Muzzle Flash Effect
function triggerHeliBellyMinigunFlash(heliMesh) {
    if (!heliMesh || !heliMesh.userData) return;
    heliMesh.userData.attackAnim = Math.max(heliMesh.userData.attackAnim || 0, 0.75);
    if (heliMesh.userData.bellyMuzzleFlash) {
        heliMesh.userData.bellyMuzzleFlash.visible = true;
        heliMesh.userData.bellyMuzzleFlash.rotation.z += 0.9;
    }
}

// Psionic Mind Control Neural Domination FX (3D Particle Burst)
function spawnMindControlDominationFX(targetPos, emitterPos) {
    spawnParticleBlastWaveFX(targetPos, 0xd946ef, 0.78, 14);
}

// ============================================================================
// REAL-TIME 3D TROOP FACE PORTRAIT VIEWER FOR ADJUTANT LINK (#portrait-3d-canvas)
// Renders a live articulated 3D character head/visor/helmet bust inside the HUD!
// ============================================================================
(function initPortrait3DViewer() {
    let portraitRenderer = null;
    let portraitScene = null;
    let portraitCamera = null;
    let activeRole = null;
    let headRootGroup = null;
    let headPivot = null;
    let jawPivot = null;
    let visorMesh = null;
    let hudHoloRing = null;
    let keyLight = null;
    let rimLight = null;
    let animClock = 0;
    let talkBurstTimer = 0;
    let portraitRepairRig = null;
    let portraitRepairTimer = 0;
    const roleHeadCache = {};

    let initFailed = false;
    function ensureInitialized() {
        if (initFailed) return false;
        if (portraitRenderer) return true;
        const canvas = document.getElementById('portrait-3d-canvas');
        if (!canvas || typeof THREE === 'undefined') return false;
        try {
            portraitRenderer = new THREE.WebGLRenderer({
                canvas,
                antialias: true,
                alpha: false,
                powerPreference: 'low-power'
            });
            portraitRenderer.setSize(128, 128, false);
            portraitRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            portraitRenderer.setClearColor(0x040911, 1);

            portraitScene = new THREE.Scene();
            portraitScene.fog = new THREE.FogExp2(0x040911, 0.18);

            portraitCamera = new THREE.PerspectiveCamera(34, 1.0, 0.1, 20);
            portraitCamera.position.set(0, 0.06, 2.25);
            portraitCamera.lookAt(0, 0.02, 0);

            const amb = new THREE.AmbientLight(0x3b5878, 1.45);
            portraitScene.add(amb);

            keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.35);
            keyLight.position.set(1.6, 1.8, 2.4);
            portraitScene.add(keyLight);

            rimLight = new THREE.PointLight(0x00e5ff, 2.8, 6.0);
            rimLight.position.set(-1.5, 0.9, -1.1);
            portraitScene.add(rimLight);

            const chinLight = new THREE.PointLight(0x0284c7, 1.4, 4.0);
            chinLight.position.set(0, -1.2, 1.4);
            portraitScene.add(chinLight);

            // Subtle Holographic Telemetry Frame Ring behind the 3D Troop Face
            hudHoloRing = new THREE.Mesh(
                new THREE.RingGeometry(0.68, 0.72, 24),
                new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
            );
            hudHoloRing.position.set(0, 0.04, -0.52);
            portraitScene.add(hudHoloRing);

            headRootGroup = new THREE.Group();
            portraitScene.add(headRootGroup);

            // 3D SCV / Repair Drone Nano-Welding Beam Rig inside the 3D Unit Portrait View!
            portraitRepairRig = buildPortraitRepairDroneBeamRig();
            portraitRepairRig.root.visible = false;
            portraitScene.add(portraitRepairRig.root);

            setPortraitRole('adjutant');
            return true;
        } catch (err) {
            initFailed = true;
            return false;
        }
    }

    function buildPortraitRepairDroneBeamRig() {
        const root = new THREE.Group();

        // Hovering miniature SCV/Repair Drone emitter assembly in upper-right corner of portrait
        const droneEmitter = new THREE.Group();
        droneEmitter.position.set(0.46, 0.36, 0.56);

        const droneBody = new THREE.Mesh(
            createSculptedArmorDomeGeo(0.11, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.28, metalness: 0.78 })
        );
        droneBody.scale.set(1.15, 0.72, 1.25);

        const hazardCollar = new THREE.Mesh(
            createSculptedTorusCollarGeo(0.095, 0.022, 6, 14),
            new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.65 })
        );
        hazardCollar.rotation.x = Math.PI / 2;

        const nozzle = new THREE.Mesh(
            createSculptedLatheBarrelGeo(0.028, 0.045, 0.16, 8).rotateX(Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.2 })
        );
        nozzle.position.set(-0.08, -0.06, -0.04);
        nozzle.lookAt(0.08, -0.14, 0.32);

        droneEmitter.add(droneBody, hazardCollar, nozzle);
        root.add(droneEmitter);

        // Dual-Layer Nano-Weld Plasma Beam connecting Emitter Nozzle to Mechanical Unit Armor in Portrait
        const beamGroup = new THREE.Group();
        const coreBeamMat = new THREE.MeshBasicMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const outerBeamMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.52,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const coreBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.024, 1.0, 8, 1, true).rotateX(Math.PI / 2),
            coreBeamMat
        );
        const outerBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.042, 0.062, 1.0, 10, 1, true).rotateX(Math.PI / 2),
            outerBeamMat
        );
        beamGroup.add(coreBeam, outerBeam);

        const pulseRings = [];
        for (let r = 0; r < 3; r++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.045, 0.009, 6, 14),
                new THREE.MeshBasicMaterial({
                    color: r % 2 === 0 ? 0x00ff88 : 0x00e5ff,
                    transparent: true,
                    opacity: 0.85,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            beamGroup.add(ring);
            pulseRings.push(ring);
        }
        root.add(beamGroup);

        // Contact Welding Flare & 3D Flying Sparks at the Armor Patch Point
        const weldSpotGroup = new THREE.Group();
        weldSpotGroup.position.set(0.14, -0.16, 0.34);
        const contactFlare = new THREE.Mesh(
            createSculptedArmorDomeGeo(0.055, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.92,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        const weldLight = new THREE.PointLight(0x00e5ff, 2.2, 2.5);
        weldSpotGroup.add(contactFlare, weldLight);

        const sparks = [];
        const sparkGeo = new THREE.OctahedronGeometry(0.018, 0);
        for (let s = 0; s < 8; s++) {
            const sp = new THREE.Mesh(
                sparkGeo,
                new THREE.MeshBasicMaterial({
                    color: s % 2 === 0 ? 0x00e5ff : 0xfde047,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            weldSpotGroup.add(sp);
            sparks.push({
                mesh: sp,
                ang: (s / 8) * Math.PI * 2,
                speed: 1.8 + (s % 3) * 0.65,
                phase: s * 0.78
            });
        }
        root.add(weldSpotGroup);

        return {
            root,
            droneEmitter,
            beamGroup,
            coreBeam,
            outerBeam,
            pulseRings,
            weldSpotGroup,
            contactFlare,
            weldLight,
            sparks
        };
    }

    function buildTroopHeadModel(role) {
        const root = new THREE.Group();
        const head = new THREE.Group();
        const jaw = new THREE.Group();
        let visor = null;

        const isZerg = String(role).startsWith('enemy_') || role === 'hive' || role === 'spine' || role === 'lair' || role === 'spire';
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x2a3b4e, roughness: 0.38, metalness: 0.72 });
        const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x16202b, roughness: 0.55, metalness: 0.60 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a383, roughness: 0.62, metalness: 0.08 });
        const visorCyanMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00a8cc, emissiveIntensity: 0.85, roughness: 0.15, metalness: 0.9 });
        const visorAmberMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xd97706, emissiveIntensity: 0.85, roughness: 0.15, metalness: 0.9 });
        const visorRedMat = new THREE.MeshStandardMaterial({ color: 0xff2a4b, emissive: 0xbe123c, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.9 });
        const visorGreenMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x059669, emissiveIntensity: 0.85, roughness: 0.15, metalness: 0.9 });

        if (isZerg) {
            // Sculpted Zerg Hive Bio-Horror Head Bust (Chitin Crest + Glowing Eyes + Articulated Mandibles)
            const chitinMat = new THREE.MeshStandardMaterial({ color: 0x4a153b, roughness: 0.42, metalness: 0.28 });
            const fleshMat = new THREE.MeshStandardMaterial({ color: 0x701a46, roughness: 0.65, metalness: 0.12 });

            const cranium = new THREE.Mesh(createOrganicBioCarapaceGeo(0.42, 0.36, 0.58, 6, 0.08), chitinMat);
            cranium.position.set(0, 0.12, -0.05);
            head.add(cranium);

            const crest = new THREE.Mesh(createExtrudedArmorHullGeo(0.58, 0.24, 0.44, 0.06, 0.12), chitinMat);
            crest.position.set(0, 0.28, -0.10);
            crest.rotation.x = 0.28;
            head.add(crest);

            // 4 Glowing Bio-Optic Eyes
            [-1, 1].forEach(side => {
                const primaryEye = new THREE.Mesh(createSculptedArmorDomeGeo(0.065, 10, 10), visorAmberMat);
                primaryEye.position.set(side * 0.17, 0.08, 0.36);
                const secondaryEye = new THREE.Mesh(createSculptedArmorDomeGeo(0.042, 8, 8), visorRedMat);
                secondaryEye.position.set(side * 0.24, 0.16, 0.28);
                head.add(primaryEye, secondaryEye);

                const mandible = new THREE.Mesh(createCurvedScytheBladeGeo(0.36, 0.07, 0.12), chitinMat);
                mandible.position.set(side * 0.18, -0.12, 0.28);
                mandible.rotation.z = side * 0.45;
                mandible.rotation.x = 1.25;
                jaw.add(mandible);
            });

            const maw = new THREE.Mesh(createExtrudedArmorHullGeo(0.26, 0.14, 0.28), fleshMat);
            maw.position.set(0, -0.14, 0.18);
            jaw.add(maw);
            visor = cranium;
        } else {
            // Terran Dominion Chest & Gorget Collar Base
            const chestArmor = new THREE.Mesh(createExtrudedArmorHullGeo(0.96, 0.46, 0.62, 0.08, 0.18), armorMat);
            chestArmor.position.set(0, -0.46, -0.04);
            root.add(chestArmor);

            [-1, 1].forEach(side => {
                const pauldron = new THREE.Mesh(createExtrudedArmorHullGeo(0.36, 0.32, 0.52, 0.06, 0.14), armorMat);
                pauldron.position.set(side * 0.52, -0.38, -0.02);
                pauldron.rotation.z = -side * 0.22;
                root.add(pauldron);
            });

            const neckCollar = new THREE.Mesh(createSculptedLatheBarrelGeo(0.24, 0.29, 0.22, 12), darkTrimMat);
            neckCollar.position.set(0, -0.22, 0);
            root.add(neckCollar);

            // Role-Specific Terran Helmet & Face Geometry
            const helmetDome = new THREE.Mesh(createExtrudedArmorHullGeo(0.56, 0.46, 0.60, 0.09, 0.18), armorMat);
            helmetDome.position.set(0, 0.14, -0.02);
            head.add(helmetDome);

            const browGuard = new THREE.Mesh(createExtrudedArmorHullGeo(0.58, 0.14, 0.36, 0.04, 0.08), darkTrimMat);
            browGuard.position.set(0, 0.26, 0.18);
            browGuard.rotation.x = 0.12;
            head.add(browGuard);

            if (role === 'ranger' || role === 'barracks') {
                // CMC Combat Marine: Exposed rugged lower face + T-Visor HUD + Heavy Breather Cheek Guards + Cigar
                const faceLower = new THREE.Mesh(createExtrudedArmorHullGeo(0.34, 0.24, 0.36), skinMat);
                faceLower.position.set(0, -0.02, 0.14);
                head.add(faceLower);

                visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.44, 0.14, 0.12), visorCyanMat);
                visor.position.set(0, 0.12, 0.28);
                head.add(visor);

                [-1, 1].forEach(side => {
                    const cheekPlate = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.24, 0.32, 0.03, 0.06), armorMat);
                    cheekPlate.position.set(side * 0.23, -0.04, 0.16);
                    head.add(cheekPlate);
                });

                const chinStrap = new THREE.Mesh(createExtrudedArmorHullGeo(0.36, 0.11, 0.26, 0.02, 0.05), darkTrimMat);
                chinStrap.position.set(0, -0.14, 0.20);
                jaw.add(chinStrap);

                // Iconic Marine Cigar + Glowing Ember Tip
                const cigar = new THREE.Mesh(createSculptedLatheBarrelGeo(0.022, 0.024, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 }));
                cigar.rotation.x = Math.PI / 2 + 0.15;
                cigar.rotation.z = -0.25;
                cigar.position.set(0.08, -0.09, 0.36);
                const ember = new THREE.Mesh(createSculptedArmorDomeGeo(0.025, 8, 8), visorRedMat);
                ember.position.set(0.10, -0.08, 0.44);
                jaw.add(cigar, ember);
            } else if (role === 'medic') {
                // Combat Medic: White/Teal Valkyrie Med-Helmet + Emerald Biometric Visor + Headset Mic
                const medWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.32, metalness: 0.45 });
                helmetDome.material = medWhiteMat;

                const faceMesh = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 0.26, 0.34), skinMat);
                faceMesh.position.set(0, -0.01, 0.14);
                head.add(faceMesh);

                visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.44, 0.15, 0.10), visorGreenMat);
                visor.position.set(0, 0.11, 0.28);
                head.add(visor);

                // Red Cross Crest Emblem on Forehead
                const crossV = new THREE.Mesh(createExtrudedArmorHullGeo(0.06, 0.14, 0.04), visorRedMat);
                crossV.position.set(0, 0.28, 0.36);
                const crossH = new THREE.Mesh(createExtrudedArmorHullGeo(0.14, 0.06, 0.04), visorRedMat);
                crossH.position.set(0, 0.28, 0.36);
                head.add(crossV, crossH);

                const jawMic = new THREE.Mesh(createExtrudedArmorHullGeo(0.32, 0.09, 0.24), medWhiteMat);
                jawMic.position.set(0, -0.14, 0.19);
                jaw.add(jawMic);
            } else if (role === 'grunt' || role === 'turret') {
                // Marauder / Heavy Rocket Trooper: Full Sealed Blast-Visor Helmet + Twin Respirator Canisters
                visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.46, 0.16, 0.12), visorAmberMat);
                visor.position.set(0, 0.11, 0.28);
                head.add(visor);

                const respiratorMask = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 0.24, 0.32, 0.04, 0.08), darkTrimMat);
                respiratorMask.position.set(0, -0.08, 0.20);
                jaw.add(respiratorMask);

                [-1, 1].forEach(side => {
                    const filterCan = new THREE.Mesh(createSculptedLatheBarrelGeo(0.08, 0.09, 0.18, 10), armorMat);
                    filterCan.rotation.x = Math.PI / 2;
                    filterCan.rotation.z = side * 0.35;
                    filterCan.position.set(side * 0.18, -0.10, 0.32);
                    jaw.add(filterCan);
                });
            } else if (role === 'reaper') {
                // Reaper Raider: Skull-Plated Jump Mask + Dual Crimson Optic Goggles
                [-1, 1].forEach(side => {
                    const goggleRim = new THREE.Mesh(createSculptedLatheBarrelGeo(0.11, 0.11, 0.12, 12), darkTrimMat);
                    goggleRim.rotation.x = Math.PI / 2;
                    goggleRim.position.set(side * 0.13, 0.11, 0.27);
                    const goggleLens = new THREE.Mesh(createSculptedLatheBarrelGeo(0.085, 0.085, 0.13, 12), visorRedMat);
                    goggleLens.rotation.x = Math.PI / 2;
                    goggleLens.position.set(side * 0.13, 0.11, 0.27);
                    head.add(goggleRim, goggleLens);
                });
                visor = head.children[head.children.length - 1];

                const skullJaw = new THREE.Mesh(createExtrudedArmorHullGeo(0.38, 0.20, 0.28, 0.04, 0.08), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.45 }));
                skullJaw.position.set(0, -0.10, 0.20);
                jaw.add(skullJaw);
            } else if (role === 'sniper' || role === 'comm_array') {
                // Ghost / Marksman: Sleek Stealth Hood + Tri-Optic Cybernetic NVD Visor
                visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.42, 0.12, 0.12), visorCyanMat);
                visor.position.set(0, 0.11, 0.28);
                head.add(visor);

                [-0.12, 0, 0.12].forEach((ox, idx) => {
                    const node = new THREE.Mesh(createSculptedArmorDomeGeo(idx === 1 ? 0.045 : 0.035, 10, 10), idx === 1 ? visorGreenMat : visorCyanMat);
                    node.position.set(ox, 0.11, 0.35);
                    head.add(node);
                });

                const stealthMask = new THREE.Mesh(createExtrudedArmorHullGeo(0.36, 0.20, 0.30, 0.04, 0.08), darkTrimMat);
                stealthMask.position.set(0, -0.09, 0.19);
                jaw.add(stealthMask);
            } else if (role === 'tank' || role === 'vehicle_bay' || role === 'heli' || role === 'airfield') {
                // Siege Tank / Gunship Commander: Flight/Armored Comms Helmet + Gold Polarized Visor + Boom Mic
                visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.48, 0.18, 0.14), visorAmberMat);
                visor.position.set(0, 0.10, 0.27);
                head.add(visor);

                const earCupL = new THREE.Mesh(createSculptedLatheBarrelGeo(0.12, 0.12, 0.10, 12), darkTrimMat);
                earCupL.rotation.z = Math.PI / 2;
                earCupL.position.set(-0.30, 0.04, 0.02);
                const earCupR = earCupL.clone();
                earCupR.position.x = 0.30;
                head.add(earCupL, earCupR);

                const chinGuard = new THREE.Mesh(createExtrudedArmorHullGeo(0.38, 0.16, 0.28, 0.03, 0.07), armorMat);
                chinGuard.position.set(0, -0.11, 0.20);
                jaw.add(chinGuard);
            } else {
                // Adjutant / Command HQ / SCV: Cybernetic Android Adjutant Faceplate with Glowing Neural Visor
                const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.88 });
                helmetDome.material = chromeMat;

                visor = new THREE.Mesh(createExtrudedArmorHullGeo(0.46, 0.14, 0.12), visorCyanMat);
                visor.position.set(0, 0.11, 0.28);
                head.add(visor);

                const neuralCore = new THREE.Mesh(createSculptedArmorDomeGeo(0.06, 12, 12), visorCyanMat);
                neuralCore.position.set(0, 0.27, 0.32);
                head.add(neuralCore);

                const synthJaw = new THREE.Mesh(createExtrudedArmorHullGeo(0.36, 0.18, 0.28, 0.04, 0.08), chromeMat);
                synthJaw.position.set(0, -0.10, 0.19);
                const voiceBox = new THREE.Mesh(createExtrudedArmorHullGeo(0.20, 0.06, 0.06), visorCyanMat);
                voiceBox.position.set(0, -0.09, 0.33);
                jaw.add(synthJaw, voiceBox);
            }

            // Helmet Side Tactical Flashlight & Antenna
            const sideLamp = new THREE.Mesh(createSculptedLatheBarrelGeo(0.04, 0.04, 0.16, 8), darkTrimMat);
            sideLamp.rotation.x = Math.PI / 2;
            sideLamp.position.set(0.31, 0.14, 0.12);
            const lampLens = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), visorCyanMat);
            lampLens.position.set(0.31, 0.14, 0.205);
            head.add(sideLamp, lampLens);
        }

        head.add(jaw);
        root.add(head);
        return { root, head, jaw, visor, isZerg };
    }

    function setPortraitRole(roleKey) {
        const normalized = roleKey || 'adjutant';
        if (!portraitScene && !ensureInitialized()) return;
        if (activeRole === normalized && headPivot) {
            talkBurstTimer = 0.85;
            return;
        }
        activeRole = normalized;
        talkBurstTimer = 1.1;

        while (headRootGroup.children.length > 0) {
            headRootGroup.remove(headRootGroup.children[0]);
        }

        if (!roleHeadCache[normalized]) {
            roleHeadCache[normalized] = buildTroopHeadModel(normalized);
        }
        const entry = roleHeadCache[normalized];
        headRootGroup.add(entry.root);
        headPivot = entry.head;
        jawPivot = entry.jaw;
        visorMesh = entry.visor;

        if (rimLight) {
            rimLight.color.setHex(entry.isZerg ? 0xff2a4b : (normalized === 'medic' ? 0x00ff88 : 0x00e5ff));
        }
        if (hudHoloRing && hudHoloRing.material) {
            hudHoloRing.material.color.setHex(entry.isZerg ? 0xff2a4b : (normalized === 'medic' ? 0x00ff88 : 0x00e5ff));
        }
    }

    let renderAccum = 0;
    function updateAndRender(dt) {
        const wing = document.getElementById('portrait-wing');
        if (wing && wing.offsetParent === null) return;
        if (!ensureInitialized()) return;
        animClock += dt;
        if (talkBurstTimer > 0) {
            talkBurstTimer = Math.max(0, talkBurstTimer - dt);
        }
        if (portraitRepairTimer > 0) {
            portraitRepairTimer = Math.max(0, portraitRepairTimer - dt);
        }
        renderAccum += dt;
        if (renderAccum < 0.062) return;
        renderAccum = 0;

        if (headPivot) {
            // Natural 3D troop head look-around & breathing motion inside the view frame
            headPivot.rotation.y = Math.sin(animClock * 1.15) * 0.22 + Math.cos(animClock * 0.48) * 0.08;
            headPivot.rotation.x = Math.sin(animClock * 0.85) * 0.07;
            headPivot.rotation.z = Math.cos(animClock * 0.65) * 0.035;
            headPivot.position.y = Math.sin(animClock * 2.1) * 0.018;
        }

        if (jawPivot) {
            // Articulated jaw movement when transmitting voice or periodically on comms
            const autoCommsCycle = (Math.sin(animClock * 1.4) > 0.55) ? 1.0 : 0.0;
            const talkIntensity = Math.max(talkBurstTimer > 0 ? 1.0 : 0.0, autoCommsCycle);
            const jawOpen = talkIntensity * Math.abs(Math.sin(animClock * 16.5)) * 0.055;
            jawPivot.position.y = -jawOpen;
            jawPivot.rotation.x = jawOpen * 1.8;
        }

        if (hudHoloRing) {
            hudHoloRing.rotation.z = animClock * 0.35;
        }

        // Animate SCV / Repair Drone Nano-Weld Beam inside the 3D Unit Portrait whenever repairing or viewing mech/drone/SCV!
        if (portraitRepairRig) {
            const isMechOrDroneRole = (
                activeRole === 'scv' || activeRole === 'drone' ||
                activeRole === 'tank' || activeRole === 'heli' ||
                activeRole === 'vehicle_bay' || activeRole === 'turret'
            );
            const showRepairFX = (portraitRepairTimer > 0) || (isMechOrDroneRole && (Math.sin(animClock * 0.95) > -0.15));
            portraitRepairRig.root.visible = showRepairFX;

            if (showRepairFX) {
                const dPos = portraitRepairRig.droneEmitter.position;
                dPos.x = 0.46 + Math.cos(animClock * 2.8) * 0.06;
                dPos.y = 0.34 + Math.sin(animClock * 3.6) * 0.07;
                dPos.z = 0.54 + Math.sin(animClock * 2.1) * 0.04;

                const tPos = portraitRepairRig.weldSpotGroup.position;
                tPos.x = 0.12 + Math.sin(animClock * 4.5) * 0.14;
                tPos.y = -0.22 + Math.cos(animClock * 3.8) * 0.08;
                tPos.z = 0.34;

                portraitRepairRig.droneEmitter.lookAt(tPos);

                const beamDist = dPos.distanceTo(tPos);
                const pulse = 0.85 + Math.sin(animClock * 24.0) * 0.28;
                portraitRepairRig.beamGroup.position.lerpVectors(dPos, tPos, 0.5);
                portraitRepairRig.beamGroup.lookAt(tPos);
                portraitRepairRig.coreBeam.scale.set(pulse, pulse, beamDist);
                portraitRepairRig.outerBeam.scale.set(pulse * 1.15, pulse * 1.15, beamDist);

                for (let r = 0; r < portraitRepairRig.pulseRings.length; r++) {
                    const ring = portraitRepairRig.pulseRings[r];
                    const t = ((animClock * 2.6 + r * 0.33) % 1.0);
                    ring.position.set(0, 0, (t - 0.5) * beamDist);
                    const rs = 0.65 + Math.sin(t * Math.PI) * 0.75;
                    ring.scale.setScalar(rs);
                }

                portraitRepairRig.contactFlare.scale.setScalar(0.85 + Math.abs(Math.sin(animClock * 28.0)) * 0.65);
                portraitRepairRig.weldLight.intensity = 1.6 + Math.abs(Math.sin(animClock * 30.0)) * 1.4;

                for (let s = 0; s < portraitRepairRig.sparks.length; s++) {
                    const sp = portraitRepairRig.sparks[s];
                    const cyc = ((animClock * sp.speed + sp.phase) % 1.0);
                    const rad = cyc * 0.24;
                    sp.mesh.position.set(
                        Math.cos(sp.ang + animClock * 2.0) * rad,
                        Math.sin(cyc * Math.PI) * 0.12 - cyc * cyc * 0.16,
                        Math.sin(sp.ang + animClock * 2.0) * rad * 0.5 + 0.04
                    );
                    sp.mesh.scale.setScalar(Math.max(0.1, 1.15 - cyc * 0.95));
                }
            }
        }

        try {
            portraitRenderer.render(portraitScene, portraitCamera);
        } catch (e) {}
    }

    window.PORTRAIT_3D_VIEWER = {
        setRole: setPortraitRole,
        setRepairing: function(active = true, duration = 0.85) {
            portraitRepairTimer = active ? Math.max(portraitRepairTimer, duration) : 0;
        },
        triggerTalk: function(duration = 1.2) { talkBurstTimer = Math.max(talkBurstTimer, duration); },
        update: updateAndRender
    };
})();

// ============================================================================
// 3D WORLD SCV & REPAIR DRONE NANO-WELD BEAM ASSEMBLY + TERRAN BASE BLAST CRATER
// ============================================================================
window.createRepairBeamAssembly = function() {
    const group = new THREE.Group();
    group.visible = false;

    const coreGeo = new THREE.CylinderGeometry(0.032, 0.048, 1.0, 8, 1, true);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.94,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);

    const sheathGeo = new THREE.CylinderGeometry(0.085, 0.135, 1.0, 10, 1, true);
    sheathGeo.rotateX(Math.PI / 2);
    const sheathMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const sheathMesh = new THREE.Mesh(sheathGeo, sheathMat);
    group.add(coreMesh, sheathMesh);

    const rings = [];
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.11, 0.020, 6, 14),
            new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x00ff88 : 0x00e5ff,
                transparent: true,
                opacity: 0.82,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        group.add(ring);
        rings.push(ring);
    }

    const contactFlare = new THREE.Mesh(
        createSculptedArmorDomeGeo(0.16, 8, 8),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.90,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    group.add(contactFlare);

    group.userData = { coreMesh, sheathMesh, rings, contactFlare, phase: Math.random() * 6.28 };
    return group;
};

window.updateRepairBeamAssembly = function(beamGroup, startWorldPos, endWorldPos, dt = 0.016) {
    if (!beamGroup || !startWorldPos || !endWorldPos) return;
    beamGroup.visible = true;
    const ud = beamGroup.userData;
    ud.phase = (ud.phase || 0) + dt * 18.0;

    const dist = Math.max(0.2, startWorldPos.distanceTo(endWorldPos));
    beamGroup.position.lerpVectors(startWorldPos, endWorldPos, 0.5);
    beamGroup.lookAt(endWorldPos);

    const pulse = 0.85 + Math.sin(ud.phase * 1.6) * 0.28;
    if (ud.coreMesh) ud.coreMesh.scale.set(pulse, pulse, dist);
    if (ud.sheathMesh) ud.sheathMesh.scale.set(pulse * 1.15, pulse * 1.15, dist);

    if (ud.rings) {
        for (let i = 0; i < ud.rings.length; i++) {
            const r = ud.rings[i];
            const t = ((ud.phase * 0.14 + i * 0.33) % 1.0);
            r.position.set(0, 0, (t - 0.5) * dist);
            const rs = 0.72 + Math.sin(t * Math.PI) * 0.75;
            r.scale.setScalar(rs);
        }
    }
    if (ud.contactFlare) {
        ud.contactFlare.position.set(0, 0, dist * 0.5);
        ud.contactFlare.scale.setScalar(0.85 + Math.abs(Math.sin(ud.phase * 2.2)) * 0.65);
    }
};

// Spawns a Permanent Scorched Blast Patch Crater when a Terran Base or Structure is Destroyed!
window.spawnTerranBaseBlastCrater = function(pos, radiusScale = 2.4) {
    if (!pos || typeof scene === 'undefined') return;
    const cx = pos.x;
    const cz = pos.z;

    // 1. Physically carve & scorch the terrain mesh vertices underneath the destroyed Terran base
    if (typeof deformTerrainCrater === 'function') {
        deformTerrainCrater(cx, cz, radiusScale * 1.32, 0.38, true);
    }
    if (typeof spawnBombCrater === 'function') {
        spawnBombCrater(pos, radiusScale * 1.15);
    }

    // 2. Build a 3D Scorched Blast Patch Rim, Molten Slag Core & Twisted Girder Stubs
    const craterGroup = new THREE.Group();
    const gy = getTerrainHeight(cx, cz);
    craterGroup.position.set(cx, gy + 0.03, cz);

    // Sunken glowing slag & charred ash pit floor
    const ashFloorGeo = new THREE.CircleGeometry(radiusScale * 0.92, 24);
    ashFloorGeo.rotateX(-Math.PI / 2);
    const ashFloor = new THREE.Mesh(
        ashFloorGeo,
        new THREE.MeshStandardMaterial({
            color: 0x111318,
            roughness: 0.92,
            metalness: 0.15,
            emissive: 0x3b1106,
            emissiveIntensity: 0.45,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            polygonOffsetUnits: -4
        })
    );
    craterGroup.add(ashFloor);

    // Raised shattered concrete & scorched earth rim slabs
    const slabCount = 10;
    for (let i = 0; i < slabCount; i++) {
        const a = (i / slabCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
        const r = radiusScale * (0.82 + (i % 2) * 0.14);
        const slab = new THREE.Mesh(
            createOrganicBioCarapaceGeo(0.42 * radiusScale * 0.45, 0.18, 0.32 * radiusScale * 0.45, 4, 0.04),
            i % 3 === 0 ? MAT.charredSteel : MAT.darkSteel
        );
        const sx = Math.cos(a) * r;
        const sz = Math.sin(a) * r;
        const localY = getTerrainHeight(cx + sx, cz + sz) - gy;
        slab.position.set(sx, localY + 0.08, sz);
        slab.rotation.y = a + Math.PI / 2;
        slab.rotation.x = -0.28;
        craterGroup.add(slab);
    }

    // Twisted smoldering structural I-beam stubs jutting out of the blast crater
    for (let b = 0; b < 4; b++) {
        const ba = (b / 4) * Math.PI * 2 + 0.4;
        const br = radiusScale * 0.58;
        const girder = new THREE.Mesh(
            createExtrudedArmorHullGeo(0.14, 0.78, 0.16, 0.02, 0.04),
            b % 2 === 0 ? MAT.charredSteel : MAT.gunmetal
        );
        girder.position.set(Math.cos(ba) * br, 0.22, Math.sin(ba) * br);
        girder.rotation.z = -Math.cos(ba) * 0.55;
        girder.rotation.x = Math.sin(ba) * 0.55;
        craterGroup.add(girder);
    }

    scene.add(craterGroup);
    if (typeof wreckageParts !== 'undefined') {
        wreckageParts.push({
            mesh: craterGroup,
            hasFire: true,
            vel: new THREE.Vector3(0, 0, 0),
            rotVel: new THREE.Vector3(0, 0, 0),
            smokeTimer: 0.25,
            life: 32.0
        });
    }
};

// ============================================================================
// 7. PROCEDURAL BATTLE DAMAGE TEXTURES, ZERG GROUND UNIT BRUISE MARKS,
//    MECHANICAL DEFORMED ARMOR & FACTION UNIT UPGRADE APPEARANCE SYSTEM
// ============================================================================
(function initBattleDamageAndUpgradeVisualSystem() {
    // 1. Procedural Deformed & Scorched Mechanical Armor Texture (Dents, Shell Craters, Torn Steel Seams & Glowing Slag Cracks)
    function buildDeformedMechArmorTexture() {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#1e2631';
        ctx.fillRect(0, 0, 256, 256);

        // Warped, dented steel plate shading gradients
        for (let i = 0; i < 18; i++) {
            const x = (i * 53) % 240 + 8;
            const y = (i * 89) % 240 + 8;
            const r = 18 + (i % 4) * 10;
            const g = ctx.createRadialGradient(x, y, 2, x, y, r);
            g.addColorStop(0, '#090c10');
            g.addColorStop(0.45, '#2b3544');
            g.addColorStop(0.75, '#475569');
            g.addColorStop(1, 'rgba(30,38,49,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Jagged armor gouges, shrapnel tears & glowing orange slag fissures
        for (let s = 0; s < 28; s++) {
            const x0 = (s * 41) % 256;
            const y0 = (s * 67) % 256;
            const ang = (s * 1.37);
            const len = 22 + (s % 5) * 9;
            ctx.strokeStyle = s % 4 === 0 ? '#f97316' : '#0b0f17';
            ctx.lineWidth = s % 4 === 0 ? 2.2 : 3.5;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
            ctx.stroke();

            // Specular torn-metal edge highlight next to each gouge
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x0 + 2, y0 + 2);
            ctx.lineTo(x0 + Math.cos(ang) * len + 2, y0 + Math.sin(ang) * len + 2);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    // 2. Procedural Bruised Zerg Chitin Carapace Texture (Deep Violet-Black Contusions, Cracked Chitin Plates & Oozing Green-Purple Hemolymph)
    function buildBruisedZergChitinTexture() {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#2d0e28';
        ctx.fillRect(0, 0, 256, 256);

        // Deep bruised purple-indigo & acid-scarred contusion blotches
        for (let i = 0; i < 22; i++) {
            const x = (i * 47) % 240 + 8;
            const y = (i * 73) % 240 + 8;
            const r = 16 + (i % 5) * 8;
            const g = ctx.createRadialGradient(x, y, 2, x, y, r);
            if (i % 3 === 0) {
                g.addColorStop(0, '#84cc16');
                g.addColorStop(0.35, '#4c1d95');
                g.addColorStop(0.75, '#1e091c');
            } else {
                g.addColorStop(0, '#a21caf');
                g.addColorStop(0.4, '#3b0764');
                g.addColorStop(0.8, '#140516');
            }
            g.addColorStop(1, 'rgba(45,14,40,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Spiderweb cracked chitin fracture lines
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.6;
        for (let k = 0; k < 20; k++) {
            const cx = (k * 59) % 240 + 8;
            const cy = (k * 83) % 240 + 8;
            for (let b = 0; b < 4; b++) {
                const a = k + b * 1.55;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    const deformedMechTex = buildDeformedMechArmorTexture();
    const bruisedChitinTex = buildBruisedZergChitinTexture();

    MAT.damagedMechArmor = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        map: deformedMechTex,
        bumpMap: deformedMechTex,
        bumpScale: 0.085,
        roughness: 0.68,
        metalness: 0.78,
        emissive: 0x3b1106,
        emissiveIntensity: 0.35
    });

    MAT.damagedMechCritical = new THREE.MeshStandardMaterial({
        color: 0x334155,
        map: deformedMechTex,
        bumpMap: deformedMechTex,
        bumpScale: 0.12,
        roughness: 0.78,
        metalness: 0.65,
        emissive: 0x9a3412,
        emissiveIntensity: 0.55
    });

    MAT.bruisedZergChitin = new THREE.MeshStandardMaterial({
        color: 0x7e22ce,
        map: bruisedChitinTex,
        bumpMap: bruisedChitinTex,
        bumpScale: 0.075,
        roughness: 0.42,
        metalness: 0.22,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.48
    });

    MAT.bruisedZergHemolymph = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        map: bruisedChitinTex,
        roughness: 0.25,
        metalness: 0.15,
        emissive: 0x65a30d,
        emissiveIntensity: 0.72
    });

    // 3. ZERG GROUND UNIT BRUISE MARKS & CRACKED CHITIN WELTS (Updates dynamically as HP drops)
    window.updateZergUnitBruiseDamage = function(e) {
        if (!e || !e.mesh || e.isAir || e.hp <= 0) return;
        const maxHp = Math.max(1, e.maxHp || 100);
        const hpRatio = THREE.MathUtils.clamp(e.hp / maxHp, 0, 1);
        const ud = e.mesh.userData || {};

        // Quantize to 4 damage tiers so we never do redundant work every frame
        const bruiseTier = hpRatio > 0.88 ? 0 : (hpRatio > 0.62 ? 1 : (hpRatio > 0.34 ? 2 : 3));
        if (ud._lastBruiseTier === bruiseTier) return;
        ud._lastBruiseTier = bruiseTier;

        const hostGroup = ud.bodyGroup || e.mesh;
        if (bruiseTier === 0) {
            if (ud.bruiseOverlayGroup) ud.bruiseOverlayGroup.visible = false;
            return;
        }

        if (!ud.bruiseOverlayGroup) {
            const bGroup = new THREE.Group();
            bGroup.name = 'zergBruiseOverlay';
            const isHeavyZerg = (e.type === 'behemoth' || e.type === 'gorgon');
            const sMult = isHeavyZerg ? 1.55 : (e.type === 'spitter' ? 1.08 : 0.88);

            // 5 Sculpted 3D Bruised Chitin Contusion Welts & Fractured Hemolymph Scars across dorsal thorax & flanks
            const weltOffsets = [
                { x: 0.0,  y: 0.56 * sMult, z: 0.12 * sMult, rx: 0.12, rz: 0.0,  s: 1.05 * sMult },
                { x: -0.22 * sMult, y: 0.48 * sMult, z: 0.02 * sMult, rx: 0.0, rz: 0.48, s: 0.88 * sMult },
                { x: 0.22 * sMult,  y: 0.48 * sMult, z: -0.04 * sMult, rx: 0.0, rz: -0.48, s: 0.88 * sMult },
                { x: -0.14 * sMult, y: 0.52 * sMult, z: -0.28 * sMult, rx: -0.25, rz: 0.22, s: 0.95 * sMult },
                { x: 0.15 * sMult,  y: 0.50 * sMult, z: 0.26 * sMult, rx: 0.28, rz: -0.22, s: 0.82 * sMult }
            ];

            const weltMeshes = [];
            weltOffsets.forEach((wo, idx) => {
                const weltPatch = new THREE.Group();
                weltPatch.position.set(wo.x, wo.y, wo.z);
                weltPatch.rotation.set(wo.rx, idx * 0.7, wo.rz);

                // Dark bruised purple-violet cracked carapace welt
                const outerBruise = new THREE.Mesh(
                    createOrganicBioCarapaceGeo(0.18 * wo.s, 0.055 * wo.s, 0.22 * wo.s, 6, 0.02),
                    MAT.bruisedZergChitin
                );
                // Inner glowing purple-green oozing hemolymph fissure
                const fissureCore = new THREE.Mesh(
                    createOrganicBioCarapaceGeo(0.11 * wo.s, 0.065 * wo.s, 0.14 * wo.s, 5, 0.015),
                    MAT.bruisedZergHemolymph
                );
                fissureCore.position.y = 0.012;
                weltPatch.add(outerBruise, fissureCore);
                weltPatch.visible = false;
                bGroup.add(weltPatch);
                weltMeshes.push(weltPatch);
            });

            bGroup.traverse(c => { c.raycast = () => {}; });
            hostGroup.add(bGroup);
            ud.bruiseOverlayGroup = bGroup;
            ud.bruiseWeltMeshes = weltMeshes;
        }

        ud.bruiseOverlayGroup.visible = true;
        const visibleCount = bruiseTier === 1 ? 2 : (bruiseTier === 2 ? 4 : 5);
        if (ud.bruiseWeltMeshes) {
            ud.bruiseWeltMeshes.forEach((wm, idx) => {
                wm.visible = idx < visibleCount;
                const scaleBoost = 0.85 + bruiseTier * 0.16;
                wm.scale.setScalar(scaleBoost);
            });
        }

        // Apply bruised chitin texture directly onto primary carapace meshes when heavily bruised (tier >= 2)
        if (bruiseTier >= 2 && !ud._carapaceBruiseApplied) {
            ud._carapaceBruiseApplied = true;
            let swapped = 0;
            hostGroup.traverse(child => {
                if (child.isMesh && swapped < 3 && (child.material === MAT.chitinArmor || child.material === MAT.chitinRed || child.material === MAT.chitinDark)) {
                    child.userData._origZergMat = child.material;
                    child.material = MAT.bruisedZergChitin;
                    swapped++;
                }
            });
        }
    };

    // 4. MECHANICAL UNIT & TANK DAMAGED / DEFORMED ARMOR TEXTURE & DENTED HULL GEOMETRY
    window.updateMechanicalUnitDamageDeformation = function(u) {
        if (!u || !u.mesh || u.hp <= 0) return;
        const isMech = (u.type === 'tank' || u.type === 'siege_tank' || u.type === 'valkyrie' || u.type === 'stalker' || u.type === 'heli' || u.type === 'transport' || u.type === 'scv_drone' || u.type === 'solaris_probe');
        if (!isMech) return;

        const maxHp = Math.max(1, u.maxHp || 200);
        const hpRatio = THREE.MathUtils.clamp(u.hp / maxHp, 0, 1);
        const ud = u.mesh.userData || {};

        const dmgTier = hpRatio > 0.86 ? 0 : (hpRatio > 0.55 ? 1 : (hpRatio > 0.28 ? 2 : 3));
        if (ud._lastMechDmgTier === dmgTier) return;
        ud._lastMechDmgTier = dmgTier;

        const hostHull = ud.chassisGroup || ud.airframe || ud.bodyGroup || u.mesh;

        // Restore pristine state if repaired by SCV/Medic back above 86% HP
        if (dmgTier === 0) {
            if (ud.mechDamageGroup) ud.mechDamageGroup.visible = false;
            if (ud._deformedMeshes) {
                ud._deformedMeshes.forEach(entry => {
                    if (entry.mesh && entry.origMat) entry.mesh.material = entry.origMat;
                    if (entry.mesh && entry.origRotZ !== undefined) entry.mesh.rotation.z = entry.origRotZ;
                    if (entry.mesh && entry.origRotX !== undefined) entry.mesh.rotation.x = entry.origRotX;
                });
            }
            return;
        }

        // Lazily create 3D Deformed/Bent Armor Skirts, Shell Impact Craters & Scorched Slag Breaches
        if (!ud.mechDamageGroup) {
            const dGroup = new THREE.Group();
            dGroup.name = 'mechDamageDeformationGroup';
            const isTank = (u.type === 'tank' || u.type === 'siege_tank');
            const span = isTank ? 0.95 : 0.58;

            const craterSites = [
                { x: -0.52 * span, y: 0.42, z: 0.46 * span, rx: 0.22, rz: 0.35 },
                { x:  0.54 * span, y: 0.45, z: -0.32 * span, rx: -0.28, rz: -0.38 },
                { x:  0.18 * span, y: 0.68, z: 0.55 * span, rx: 0.35, rz: -0.15 },
                { x: -0.38 * span, y: 0.58, z: -0.58 * span, rx: -0.32, rz: 0.28 }
            ];

            const dentNodes = [];
            craterSites.forEach((cs, idx) => {
                const node = new THREE.Group();
                node.position.set(cs.x, cs.y, cs.z);
                node.rotation.set(cs.rx, idx * 1.1, cs.rz);

                // Warped/peeled dented armor plate with deformed armor bump texture
                const bentPlate = new THREE.Mesh(
                    createExtrudedArmorHullGeo(0.38 * span, 0.09, 0.42 * span, 0.02, 0.05),
                    MAT.damagedMechArmor
                );
                bentPlate.rotation.z = (idx % 2 === 0 ? 1 : -1) * 0.28;
                bentPlate.rotation.x = 0.22;

                // Glowing molten shell-impact crater core
                const slagCrater = new THREE.Mesh(
                    createSculptedTorusCollarGeo(0.13 * span, 0.035, 6, 12),
                    MAT.damagedMechCritical
                );
                slagCrater.rotation.x = Math.PI / 2;
                slagCrater.position.y = 0.04;

                node.add(bentPlate, slagCrater);
                node.visible = false;
                dGroup.add(node);
                dentNodes.push(node);
            });

            dGroup.traverse(c => { c.raycast = () => {}; });
            hostHull.add(dGroup);
            ud.mechDamageGroup = dGroup;
            ud.mechDentNodes = dentNodes;

            // Collect primary armor hull meshes so we can swap their texture to MAT.damagedMechArmor & physically deform/tilt them!
            const hullCandidates = [];
            u.mesh.traverse(child => {
                if (child.isMesh && hullCandidates.length < 6 &&
                    (child.material === MAT.terranPlating || child.material === MAT.terranBlue || child.material === MAT.camoArmor || child.material === MAT.gunmetal || child.material === MAT.solarisGold || child.material === MAT.solarisIvory)) {
                    hullCandidates.push({
                        mesh: child,
                        origMat: child.material,
                        origRotZ: child.rotation.z,
                        origRotX: child.rotation.x
                    });
                }
            });
            ud._deformedMeshes = hullCandidates;
        }

        ud.mechDamageGroup.visible = true;
        if (ud.mechDentNodes) {
            ud.mechDentNodes.forEach((dn, idx) => {
                dn.visible = idx < (dmgTier + 1);
                dn.scale.setScalar(0.85 + dmgTier * 0.18);
            });
        }

        // Apply deformed armor texture & subtle physical dent tilt to armor plates based on damage severity
        if (ud._deformedMeshes) {
            const swapLimit = dmgTier === 1 ? 2 : (dmgTier === 2 ? 4 : 6);
            ud._deformedMeshes.forEach((entry, idx) => {
                if (!entry.mesh) return;
                if (idx < swapLimit) {
                    entry.mesh.material = (dmgTier >= 3 && idx % 2 === 0) ? MAT.damagedMechCritical : MAT.damagedMechArmor;
                    const dentAngle = (idx % 2 === 0 ? 1 : -1) * (0.045 * dmgTier);
                    entry.mesh.rotation.z = entry.origRotZ + dentAngle;
                } else {
                    entry.mesh.material = entry.origMat;
                    entry.mesh.rotation.z = entry.origRotZ;
                }
            });
        }
    };

    // 5. FACTION UNIT ARMS & ARMOR UPGRADE 3D APPEARANCE SYSTEM (Changes unit weapon & armor 3D silhouette on upgrade!)
    window.applyUnitUpgradeVisuals = function(unitObj, weaponLvl = 0, armorLvl = 0, faction = 'terran') {
        if (!unitObj || !unitObj.mesh) return;
        const mesh = unitObj.mesh;
        const ud = mesh.userData || {};
        if (ud._appliedWepLvl === weaponLvl && ud._appliedArmLvl === armorLvl) return;
        ud._appliedWepLvl = weaponLvl;
        ud._appliedArmLvl = armorLvl;

        const isZerg = (faction === 'zerg' || unitObj.isZerg || ['grunt', 'spitter', 'behemoth', 'gorgon', 'mutalisk', 'zerg_drone'].includes(unitObj.type) && !unitObj.type.startsWith('solaris'));
        const isSolaris = (faction === 'solaris' || unitObj.faction === 'solaris' || ['zealot', 'stalker', 'archon', 'solaris_probe'].includes(unitObj.type));
        const isVehicle = !!ud.isVehicle || ['tank', 'siege_tank', 'valkyrie', 'heli', 'transport', 'stalker'].includes(unitObj.type);

        // Clean up previous upgrade visual nodes if re-applying at a higher level
        if (ud._upgradeArmsGroup && ud._upgradeArmsGroup.parent) {
            ud._upgradeArmsGroup.parent.remove(ud._upgradeArmsGroup);
        }
        if (ud._upgradeArmorGroup && ud._upgradeArmorGroup.parent) {
            ud._upgradeArmorGroup.parent.remove(ud._upgradeArmorGroup);
        }

        // --- A. UPGRADED ARMS / WEAPONS VISUALS (Lv.1 -> Lv.3) ---
        if (weaponLvl > 0) {
            const armsGroup = new THREE.Group();
            armsGroup.name = 'unitUpgradedArmsGroup';
            const glowMat = weaponLvl >= 3 ? MAT.amberGlow : (isZerg ? MAT.acidGlow : (isSolaris ? MAT.solarisPrismGlow : MAT.cyanGlow));
            const trimMat = isZerg ? MAT.chitinRed : (isSolaris ? MAT.solarisGold : MAT.copper);

            if (isZerg) {
                // Zerg Upgraded Claws / Bio-Plasma Spines: Glowing serrated hyper-scythe talons & dorsal venom-accelerator pods
                const host = ud.bodyGroup || mesh;
                [-1, 1].forEach(side => {
                    const hyperTalon = new THREE.Mesh(
                        createCurvedScytheBladeGeo(0.55 + weaponLvl * 0.14, 0.08 + weaponLvl * 0.015, 0.16),
                        glowMat
                    );
                    hyperTalon.position.set(side * 0.34, 0.48, 0.36);
                    hyperTalon.rotation.x = Math.PI * 0.38;
                    hyperTalon.rotation.z = -side * 0.35;
                    armsGroup.add(hyperTalon);
                });
                if (weaponLvl >= 2) {
                    const bioCannonPod = new THREE.Mesh(createOrganicBioCarapaceGeo(0.18, 0.16, 0.28, 6, 0.04), glowMat);
                    bioCannonPod.position.set(0, 0.72, 0.24);
                    armsGroup.add(bioCannonPod);
                }
                host.add(armsGroup);
            } else if (isVehicle) {
                // Vehicle / Tank / Walker Upgraded Weapons: Twin Overcharged Gauss Accelerator Rails & Plasma Coils on Turret/Airframe
                const turretHost = ud.turret || ud.upperTorso || ud.airframe || mesh;
                [-1, 1].forEach(side => {
                    const railPod = new THREE.Mesh(
                        createExtrudedArmorHullGeo(0.14, 0.14, 0.68 + weaponLvl * 0.16, 0.02, 0.05),
                        trimMat
                    );
                    railPod.position.set(side * 0.56, 0.28, 0.42);
                    const plasmaAccelerator = new THREE.Mesh(
                        createSculptedLatheBarrelGeo(0.045, 0.055, 0.78 + weaponLvl * 0.18, 10),
                        glowMat
                    );
                    plasmaAccelerator.rotation.x = Math.PI / 2;
                    plasmaAccelerator.position.set(side * 0.56, 0.30, 0.58);
                    armsGroup.add(railPod, plasmaAccelerator);
                });
                turretHost.add(armsGroup);
            } else {
                // Humanoid Infantry / Solaris Warrior Upgraded Arms: Extended Glowing Rail Barrel Shroud, Energy Bayonet & Shoulder Micro-Pod
                const weaponHost = ud.elbowR || ud.shoulderR || ud.upperBody || mesh;
                const barrelAccel = new THREE.Mesh(
                    createSculptedLatheBarrelGeo(0.036, 0.042, 0.44 + weaponLvl * 0.10, 8),
                    glowMat
                );
                barrelAccel.rotation.x = Math.PI / 2;
                barrelAccel.position.set(0, -0.08, 0.38);

                const bayonetGlaive = new THREE.Mesh(
                    createCurvedScytheBladeGeo(0.32 + weaponLvl * 0.08, 0.045, 0.09),
                    weaponLvl >= 2 ? MAT.amberGlow : glowMat
                );
                bayonetGlaive.rotation.x = Math.PI / 2;
                bayonetGlaive.position.set(0, -0.14, 0.42);
                armsGroup.add(barrelAccel, bayonetGlaive);

                if (weaponLvl >= 2) {
                    const coilRing = new THREE.Mesh(createSculptedTorusCollarGeo(0.068, 0.016, 6, 14), MAT.amberGlow);
                    coilRing.position.set(0, -0.08, 0.46);
                    armsGroup.add(coilRing);
                }
                weaponHost.add(armsGroup);
            }
            armsGroup.traverse(c => { c.raycast = () => {}; });
            ud._upgradeArmsGroup = armsGroup;
        }

        // --- B. UPGRADED ARMOR / PLATING VISUALS (Lv.1 -> Lv.3) ---
        if (armorLvl > 0) {
            const armorGroup = new THREE.Group();
            armorGroup.name = 'unitUpgradedArmorGroup';
            const plateMat = isZerg
                ? MAT.chitinRed
                : (isSolaris ? MAT.solarisGold : (armorLvl >= 3 ? MAT.copper : MAT.terranBlue));
            const trimGlow = armorLvl >= 3 ? MAT.amberGlow : (isZerg ? MAT.hiveVeinGlow : (isSolaris ? MAT.solarisPrismGlow : MAT.cyanGlow));

            if (isZerg) {
                // Zerg Upgraded Carapace: Heavy Ultralisk-style dorsal crest plates & lateral chitin shields
                const host = ud.bodyGroup || mesh;
                const dorsalCarapace = new THREE.Mesh(
                    createOrganicBioCarapaceGeo(0.32 + armorLvl * 0.05, 0.14, 0.44 + armorLvl * 0.06, 8, 0.05),
                    plateMat
                );
                dorsalCarapace.position.set(0, 0.66, 0.06);
                armorGroup.add(dorsalCarapace);

                [-1, 1].forEach(side => {
                    const hornCrest = new THREE.Mesh(
                        createCurvedScytheBladeGeo(0.48 + armorLvl * 0.12, 0.08, 0.16),
                        MAT.copper
                    );
                    hornCrest.position.set(side * 0.32, 0.64, -0.05);
                    hornCrest.rotation.z = -side * 0.55;
                    armorGroup.add(hornCrest);
                });
                host.add(armorGroup);
            } else if (isVehicle) {
                // Vehicle / Tank Upgraded Reactive Armor: Sloped Chobham Side-Skirt Plates & Dorsal Reactor Shield
                const hullHost = ud.chassisGroup || ud.airframe || mesh;
                [-1, 1].forEach(side => {
                    const reactiveSkirt = new THREE.Mesh(
                        createExtrudedArmorHullGeo(0.16, 0.34 + armorLvl * 0.05, 1.45, 0.03, 0.08),
                        plateMat
                    );
                    reactiveSkirt.position.set(side * 0.96, 0.36, 0.0);
                    const energyStrip = new THREE.Mesh(
                        createExtrudedArmorHullGeo(0.18, 0.07, 1.25),
                        trimGlow
                    );
                    energyStrip.position.set(side * 0.97, 0.42, 0.0);
                    armorGroup.add(reactiveSkirt, energyStrip);
                });
                hullHost.add(armorGroup);
            } else {
                // Humanoid Infantry / Solaris Warrior Upgraded Armor: Heavy Reactive Pauldron Crowns & Dorsal Aegis Crest
                const torsoHost = ud.upperBody || mesh;
                [-1, 1].forEach(side => {
                    const heavyPauldron = new THREE.Mesh(
                        createExtrudedArmorHullGeo(0.22 + armorLvl * 0.03, 0.20, 0.30, 0.03, 0.08),
                        plateMat
                    );
                    heavyPauldron.position.set(side * 0.34, 0.36, 0.0);
                    heavyPauldron.rotation.z = -side * 0.25;
                    const pauldronTrim = new THREE.Mesh(
                        createExtrudedArmorHullGeo(0.24 + armorLvl * 0.03, 0.05, 0.26),
                        trimGlow
                    );
                    pauldronTrim.position.set(side * 0.35, 0.44, 0.0);
                    pauldronTrim.rotation.z = -side * 0.25;
                    armorGroup.add(heavyPauldron, pauldronTrim);
                });
                if (armorLvl >= 2) {
                    const dorsalCrest = new THREE.Mesh(
                        createSculptedTorusCollarGeo(0.24, 0.028, 6, 18),
                        trimGlow
                    );
                    dorsalCrest.rotation.x = Math.PI / 2;
                    dorsalCrest.position.set(0, 0.48, -0.06);
                    armorGroup.add(dorsalCrest);
                }
                torsoHost.add(armorGroup);
            }
            armorGroup.traverse(c => { c.raycast = () => {}; });
            ud._upgradeArmorGroup = armorGroup;
        }
    };
})();



