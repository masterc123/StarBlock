// ============================================================================
// 1. CUSTOM SVG EMBLEMS, HIGH-RES PBR TEXTURES & ZERO-LEAK SHARED FX POOLS
// ============================================================================
const HUMAN_SVG_ICON = `<svg viewBox="0 0 32 32" fill="none"><path d="M16 2L4 7v9c0 7.4 5.1 13.8 12 15.5C22.9 29.8 28 23.4 28 16V7L16 2z" stroke="#00e5ff" stroke-width="2" fill="rgba(0,229,255,0.18)"/><path d="M16 7l-8 8h5v9h6v-9h5l-8-8z" fill="#ffaa00"/></svg>`;
const ENEMY_SVG_ICON = `<svg viewBox="0 0 32 32" fill="none"><polygon points="16,2 28,9 24,26 16,30 8,26 4,9" stroke="#ff2a4b" stroke-width="2" fill="rgba(255,42,75,0.22)"/><path d="M9 12l5 4-3 7M23 12l-5 4 3 7" stroke="#ffaa00" stroke-width="2"/><circle cx="12" cy="11" r="2" fill="#ffaa00"/><circle cx="20" cy="11" r="2" fill="#ffaa00"/><circle cx="16" cy="8" r="1.8" fill="#ff2a4b"/></svg>`;

// MOBILE PERFORMANCE MODE (Termux / phone playtesting via Cloudflare tunnel)
const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.matchMedia('(pointer: coarse)').matches);

function makeProceduralTexture(drawFn, repeatX = 1, repeatY = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, 512, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
}

// Terran Dominion Aquila Emblem Texture (Used for Ground Ring & Floating 3D Holo-Crest)
const humanEmblemTex = makeProceduralTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;

    // Outer glowing compass ring
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy, 224, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)'; ctx.lineWidth = 3;
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 198, cy + Math.sin(a) * 198);
        ctx.lineTo(cx + Math.cos(a) * 220, cy + Math.sin(a) * 220);
        ctx.stroke();
    }

    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 5;
    ctx.setLineDash([28, 14]);
    ctx.beginPath(); ctx.arc(cx, cy, 182, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Terran Aquila Wings & Shield
    ctx.fillStyle = 'rgba(0, 229, 255, 0.28)';
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 140); ctx.lineTo(cx + 150, cy - 60); ctx.lineTo(cx + 115, cy + 15);
    ctx.lineTo(cx + 138, cy + 40); ctx.lineTo(cx + 72, cy + 98); ctx.lineTo(cx, cy + 155);
    ctx.lineTo(cx - 72, cy + 98); ctx.lineTo(cx - 138, cy + 40); ctx.lineTo(cx - 115, cy + 15);
    ctx.lineTo(cx - 150, cy - 60); ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Central Gold Star & Sword
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 112); ctx.lineTo(cx + 24, cy - 28); ctx.lineTo(cx + 76, cy - 8);
    ctx.lineTo(cx + 20, cy + 28); ctx.lineTo(cx, cy + 118); ctx.lineTo(cx - 20, cy + 28);
    ctx.lineTo(cx - 76, cy - 8); ctx.lineTo(cx - 24, cy - 28); ctx.closePath();
    ctx.fill();
});

// Zerg Brood Bio-Emblem Texture
const enemyEmblemTex = makeProceduralTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = '#ff2a4b'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy, 224, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = '#b845ff'; ctx.lineWidth = 5;
    ctx.setLineDash([20, 12]);
    ctx.beginPath(); ctx.arc(cx, cy, 188, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(184, 69, 255, 0.35)';
    ctx.strokeStyle = '#ff5400'; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 140); ctx.lineTo(cx + 130, cy - 45); ctx.lineTo(cx + 78, cy + 145);
    ctx.lineTo(cx + 25, cy + 65); ctx.lineTo(cx, cy + 118); ctx.lineTo(cx - 25, cy + 65);
    ctx.lineTo(cx - 78, cy + 145); ctx.lineTo(cx - 130, cy - 45); ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffaa00';
    [[-38, -25, 14], [38, -25, 14], [0, -62, 17]].forEach(([ox, oy, r]) => {
        ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2); ctx.fill();
    });
});

// ============================================================================
// REBUILT STARCRAFT II MULTI-CHANNEL PROCEDURAL PBR TEXTURE SUITE
// Includes Albedo, Tangent-Space Normal, Roughness, Organic Chitin & Khalai Filigree Maps
// ============================================================================
function generateNormalMapFromHeightCanvas(srcCanvas, strength = 2.6, repeatX = 1, repeatY = 1) {
    const w = srcCanvas.width, h = srcCanvas.height;
    const srcCtx = srcCanvas.getContext('2d');
    const srcData = srcCtx.getImageData(0, 0, w, h).data;
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = w; dstCanvas.height = h;
    const dstCtx = dstCanvas.getContext('2d');
    const dstImg = dstCtx.createImageData(w, h);
    const dstData = dstImg.data;

    const lumaAt = (x, y) => {
        const wx = ((x % w) + w) % w;
        const wy = ((y % h) + h) % h;
        const idx = (wy * w + wx) * 4;
        return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
    };

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const tl = lumaAt(x - 1, y - 1);
            const t  = lumaAt(x,     y - 1);
            const tr = lumaAt(x + 1, y - 1);
            const l  = lumaAt(x - 1, y);
            const r  = lumaAt(x + 1, y);
            const bl = lumaAt(x - 1, y + 1);
            const b  = lumaAt(x,     y + 1);
            const br = lumaAt(x + 1, y + 1);

            const dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
            const dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
            let nx = -dX * strength;
            let ny = -dY * strength;
            let nz = 1.0;
            const invLen = 1.0 / Math.hypot(nx, ny, nz);
            nx *= invLen; ny *= invLen; nz *= invLen;

            const p = (y * w + x) * 4;
            dstData[p]     = Math.floor((nx * 0.5 + 0.5) * 255);
            dstData[p + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
            dstData[p + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
            dstData[p + 3] = 255;
        }
    }
    dstCtx.putImageData(dstImg, 0, 0);
    const normalTex = new THREE.CanvasTexture(dstCanvas);
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(repeatX, repeatY);
    return normalTex;
}

// 1. StarCraft II Terran Dominion Brushed Titanium & Beveled Chobham Armor Texture + Normal + Roughness
const _terranArmorCanvases = (() => {
    const w = 512, h = 512;
    const albCanvas = document.createElement('canvas');
    albCanvas.width = w; albCanvas.height = h;
    const ctx = albCanvas.getContext('2d');

    const rghCanvas = document.createElement('canvas');
    rghCanvas.width = w; rghCanvas.height = h;
    const rCtx = rghCanvas.getContext('2d');

    // Base anisotropic gunmetal-titanium gradient (High-albedo brushed titanium so unit tint colors stay vibrant and never turn black)
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#c4d2e0');
    grad.addColorStop(0.35, '#a8b8c8');
    grad.addColorStop(0.7, '#b6c5d4');
    grad.addColorStop(1, '#98a8ba');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    rCtx.fillStyle = '#6e6e6e';
    rCtx.fillRect(0, 0, w, h);

    // Fine directional brushed steel micro-grain & combat scratches
    for (let i = 0; i < 3200; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        const gl = 18 + Math.random() * 56;
        const isLight = i % 3 === 0;
        ctx.fillStyle = isLight ? 'rgba(225, 240, 255, 0.038)' : 'rgba(12, 18, 26, 0.045)';
        ctx.fillRect(gx, gy, gl, 1.2);
        rCtx.fillStyle = isLight ? 'rgba(180,180,180,0.05)' : 'rgba(80,80,80,0.05)';
        rCtx.fillRect(gx, gy, gl, 1.2);
    }

    // Subtle oil/soot cavity grime around panel perimeters
    const drawArmorPanel = (x, y, pw, ph, chamfer = 14) => {
        const grimeGrad = ctx.createLinearGradient(x, y, x, y + ph);
        grimeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        grimeGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.0)');
        grimeGrad.addColorStop(1, 'rgba(10, 14, 20, 0.22)');
        ctx.fillStyle = grimeGrad;
        ctx.fillRect(x + 3, y + 3, pw - 6, ph - 6);

        // Deep recessed panel groove (AO seam)
        ctx.strokeStyle = 'rgba(10, 15, 22, 0.78)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x + chamfer, y);
        ctx.lineTo(x + pw - chamfer, y);
        ctx.lineTo(x + pw, y + chamfer);
        ctx.lineTo(x + pw, y + ph - chamfer);
        ctx.lineTo(x + pw - chamfer, y + ph);
        ctx.lineTo(x + chamfer, y + ph);
        ctx.lineTo(x, y + ph - chamfer);
        ctx.lineTo(x, y + chamfer);
        ctx.closePath();
        ctx.stroke();

        // Roughness in seams is higher (matte dirt), edge highlight is lower (worn polished metal)
        rCtx.strokeStyle = '#d8d8d8';
        rCtx.lineWidth = 4;
        rCtx.stroke();

        // Machined edge highlight bevel
        ctx.strokeStyle = 'rgba(210, 232, 255, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 4, y + 4, pw - 8, ph - 8);
        rCtx.strokeStyle = '#383838';
        rCtx.lineWidth = 2;
        rCtx.strokeRect(x + 4, y + 4, pw - 8, ph - 8);

        // Recessed hex bolts
        [[x + 14, y + 14], [x + pw - 14, y + 14], [x + 14, y + ph - 14], [x + pw - 14, y + ph - 14]].forEach(([bx, by]) => {
            ctx.fillStyle = '#232c38';
            ctx.beginPath(); ctx.arc(bx, by, 4.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#8fa3ba';
            ctx.beginPath(); ctx.arc(bx - 0.8, by - 0.8, 2.5, 0, Math.PI * 2); ctx.fill();
        });
    };

    drawArmorPanel(8, 8, w - 16, h - 16, 22);
    drawArmorPanel(20, 20, w / 2 - 26, h / 2 - 26, 14);
    drawArmorPanel(w / 2 + 6, 20, w / 2 - 26, h / 2 - 26, 14);
    drawArmorPanel(20, h / 2 + 6, w / 2 - 26, h / 2 - 26, 14);
    drawArmorPanel(w / 2 + 6, h / 2 + 6, w / 2 - 26, h / 2 - 26, 14);

    // Recessed heat-exchanger louvers
    for (let vy = h - 76; vy < h - 30; vy += 8) {
        ctx.fillStyle = 'rgba(12, 17, 24, 0.72)';
        ctx.fillRect(42, vy, 98, 4.5);
        ctx.fillRect(w - 140, vy, 98, 4.5);
        ctx.fillStyle = 'rgba(190, 212, 235, 0.18)';
        ctx.fillRect(42, vy + 4.5, 98, 1.2);
        ctx.fillRect(w - 140, vy + 4.5, 98, 1.2);
    }

    const albedo = new THREE.CanvasTexture(albCanvas);
    albedo.wrapS = THREE.RepeatWrapping; albedo.wrapT = THREE.RepeatWrapping;
    const roughness = new THREE.CanvasTexture(rghCanvas);
    roughness.wrapS = THREE.RepeatWrapping; roughness.wrapT = THREE.RepeatWrapping;
    const normal = generateNormalMapFromHeightCanvas(albCanvas, 3.2, 1, 1);
    return { albedo, roughness, normal };
})();

const metalTex = _terranArmorCanvases.albedo;
const metalRoughnessTex = _terranArmorCanvases.roughness;
const metalNormalTex = _terranArmorCanvases.normal;
window.metalNormalTex = metalNormalTex;
window.metalRoughnessTex = metalRoughnessTex;

// 2. Weathered Industrial Caution Chevron Texture (Chipped Paint, Grime & Rivets)
const hazardTex = makeProceduralTexture((ctx, w, h) => {
    ctx.fillStyle = '#d98a16';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b2028';
    for (let i = -h; i < w + h; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i + 32, 0);
        ctx.lineTo(i + 32 - h, h); ctx.lineTo(i - h, h);
        ctx.fill();
    }
    // Weathering & metal wear speckles
    for (let s = 0; s < 900; s++) {
        ctx.fillStyle = s % 2 === 0 ? 'rgba(20, 24, 30, 0.14)' : 'rgba(215, 225, 235, 0.10)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 1.5 + Math.random() * 3);
    }
    ctx.strokeStyle = 'rgba(15, 20, 28, 0.65)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
}, 1, 1);

// 3. Organic Zerg Chitin Carapace Normal Map (Smooth Striated Plates — Zero Pattern Dots)
const chitinNormalTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Smooth overlapping longitudinal chitin plate bands (no circular dots or spots)
    for (let y = 0; y < 256; y += 32) {
        const g = ctx.createLinearGradient(0, y, 0, y + 32);
        g.addColorStop(0, 'rgba(195, 195, 195, 0.38)');
        g.addColorStop(0.55, 'rgba(128, 128, 128, 0.15)');
        g.addColorStop(1, 'rgba(65, 65, 65, 0.42)');
        ctx.fillStyle = g;
        ctx.fillRect(0, y, 256, 32);
    }

    // Flowing organic carapace seam ridges
    ctx.strokeStyle = 'rgba(42, 42, 42, 0.42)';
    ctx.lineWidth = 2.2;
    for (let y = 16; y < 256; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 256; x += 16) {
            ctx.lineTo(x, y + Math.sin(x * 0.049) * 3.0);
        }
        ctx.stroke();
    }
    return generateNormalMapFromHeightCanvas(c, 2.8, 2, 2);
})();
window.chitinNormalTex = chitinNormalTex;

// 4. Protoss Solaris Khalai Geometric Filigree Normal Map
const solarisFiligreeTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#909090';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 3;
    // Sacred Khalai geometric circuit conduits & diamond inlays
    for (let ring = 28; ring <= 112; ring += 28) {
        ctx.beginPath(); ctx.arc(128, 128, ring, 0, Math.PI * 2); ctx.stroke();
    }
    for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(128 + Math.cos(ang) * 28, 128 + Math.sin(ang) * 28);
        ctx.lineTo(128 + Math.cos(ang) * 120, 128 + Math.sin(ang) * 120);
        ctx.stroke();
    }
    ctx.strokeRect(18, 18, 220, 220);
    return generateNormalMapFromHeightCanvas(c, 2.8, 1, 1);
})();
window.solarisFiligreeTex = solarisFiligreeTex;

// 5. 512x512 Seamless Koprulu Highland Turf, Soil & Sedimentary Micro-Detail Texture + Normal Map
const _terrainCanvases = (() => {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    function hash2D(ix, iy, period) {
        const x = ((ix % period) + period) % period;
        const y = ((iy % period) + period) % period;
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
        return n - Math.floor(n);
    }

    function valueNoisePeriodic(u, v, freq) {
        const px = u * freq;
        const py = v * freq;
        const ix = Math.floor(px);
        const iy = Math.floor(py);
        const fx = px - ix;
        const fy = py - iy;
        const sx = fx * fx * (3.0 - 2.0 * fx);
        const sy = fy * fy * (3.0 - 2.0 * fy);

        const n00 = hash2D(ix, iy, freq);
        const n10 = hash2D(ix + 1, iy, freq);
        const n01 = hash2D(ix, iy + 1, freq);
        const n11 = hash2D(ix + 1, iy + 1, freq);

        const nx0 = n00 + sx * (n10 - n00);
        const nx1 = n01 + sx * (n11 - n01);
        return nx0 + sy * (nx1 - nx0);
    }

    for (let y = 0; y < size; y++) {
        const v = y / size;
        for (let x = 0; x < size; x++) {
            const u = x / size;
            const n1 = valueNoisePeriodic(u, v, 6);
            const n2 = valueNoisePeriodic(u, v, 16);
            const n3 = valueNoisePeriodic(u, v, 38);
            const n4 = valueNoisePeriodic(u, v, 84);
            const fbm = n1 * 0.40 + n2 * 0.30 + n3 * 0.20 + n4 * 0.10;

            const bladeTuft = Math.sin((u * 48.0 + n2 * 2.1) * Math.PI * 2) * Math.cos((v * 48.0 - n1 * 2.1) * Math.PI * 2) * 0.045;
            const microGrain = (hash2D(x, y, size) - 0.5) * 0.055;

            const lum = Math.min(188, Math.max(118, Math.floor(138 + fbm * 42 + (bladeTuft + microGrain) * 180)));
            const r = Math.max(0, Math.min(255, lum - Math.floor(n2 * 10)));
            const g = Math.max(0, Math.min(255, lum + Math.floor((n1 - 0.35) * 12)));
            const b = Math.max(0, Math.min(255, lum - Math.floor(n3 * 10)));

            const p = (y * size + x) * 4;
            data[p] = r;
            data[p + 1] = g;
            data[p + 2] = b;
            data[p + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);

    // Organic soil pebbles & fine botanical blades
    for (let i = 0; i < 2800; i++) {
        const gx = Math.random() * size;
        const gy = Math.random() * size;
        ctx.strokeStyle = i % 3 === 0 ? 'rgba(225, 245, 215, 0.13)' : 'rgba(135, 180, 125, 0.12)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + (Math.random() - 0.5) * 3.8, gy - 3.5 - Math.random() * 4.5);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    const norm = generateNormalMapFromHeightCanvas(c, 2.8, 24, 24);
    return { tex, norm };
})();

const terrainDetailTex = _terrainCanvases.tex;
const terrainNormalTex = _terrainCanvases.norm;
window.terrainNormalTex = terrainNormalTex;

const waterTex = makeProceduralTexture((ctx, w, h) => {
    ctx.fillStyle = '#0c2e40'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(110, 215, 245, 0.28)'; ctx.lineWidth = 2;
    for (let i = 0; i < 95; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 24, 0, Math.PI);
        ctx.stroke();
    }
}, 10, 10);

// ============================================================================
// 2. SCENE, CAMERA, ACES FILMIC RENDERER & PROCEDURAL HDR SKY ENVIRONMENT MAP
// ============================================================================
const container = document.getElementById('game-container');
const worldUi = document.getElementById('world-ui');
const cursorTag = document.getElementById('cursor-tag');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x182838);
scene.fog = new THREE.FogExp2(0x182838, 0.00042);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1400);
camera.position.set(22, 38, 56);

const renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(IS_MOBILE ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    terrainDetailTex.anisotropy = maxAniso;
    terrainNormalTex.anisotropy = maxAniso;
    metalTex.anisotropy = maxAniso;
    metalNormalTex.anisotropy = maxAniso;
}
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(18, 0, 22);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minPolarAngle = 0.52;
controls.maxPolarAngle = Math.PI / 2 - 0.12;
controls.minDistance = 14;
controls.maxDistance = 145;
controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
if (IS_MOBILE) {
    // 1 finger = game input (place / select), 2 fingers = pan + pinch zoom + orbit
    controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_PAN };
    camera.position.set(30, 52, 74);
    controls.maxDistance = 165;
}

const keysPressed = {};
window.addEventListener('keydown', e => { keysPressed[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keysPressed[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => {
    for (const k in keysPressed) keysPressed[k] = false;
});

renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault();
});

// Procedural Web Audio Synthesizer (Weight-scaled tactical feedback with mute toggle)
const SFX = {
    ctx: null,
    muted: false,
    lastShotTime: 0,
    _hwUnlocked: false,
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    },
    unlockAndResume() {
        this.init();
        if (!this.ctx) return;
        // Universal WebAudio hardware unlock inside user gesture (works in iframes, Chrome, Safari, Mobile)
        if (!this._hwUnlocked) {
            try {
                const buf = this.ctx.createBuffer(1, 1, 22050);
                const src = this.ctx.createBufferSource();
                src.buffer = buf;
                src.connect(this.ctx.destination);
                src.start(0);
                if (this.ctx.state === 'running') this._hwUnlocked = true;
            } catch (e) {}
        }
        const startOrKickMusic = () => {
            this._hwUnlocked = true;
            if (window.RAID_MUSIC && !window.RAID_MUSIC.muted && !this.muted) {
                if (!window.RAID_MUSIC.playing) {
                    window.RAID_MUSIC.start();
                } else {
                    window.RAID_MUSIC.ensureNodes();
                    if (!window.RAID_MUSIC.timerId) window.RAID_MUSIC.scheduleLoop();
                    if (!window.RAID_MUSIC._firstAudibleBeatPlayed) {
                        window.RAID_MUSIC._firstAudibleBeatPlayed = true;
                        window.RAID_MUSIC.tick();
                    }
                    window.RAID_MUSIC.updateHudButton();
                }
            }
        };
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(startOrKickMusic).catch(() => {});
        } else if (this.ctx.state === 'running') {
            startOrKickMusic();
        }
    },
    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.045);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
    },
    playBuild() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [330, 440, 660].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.07, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.14);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.15);
        });
    },
    playShoot(wType = 'mg') {
        if (this.muted) return;
        const perfNow = performance.now();
        if (perfNow - this.lastShotTime < 45) return;
        this.lastShotTime = perfNow;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const isHeavy = wType === 'tank' || wType === 'mortar';
        osc.type = isHeavy ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(isHeavy ? 140 : 320, now);
        osc.frequency.exponentialRampToValueAtTime(isHeavy ? 38 : 75, now + (isHeavy ? 0.18 : 0.07));
        gain.gain.setValueAtTime(isHeavy ? 0.11 : 0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.19 : 0.075));
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + (isHeavy ? 0.2 : 0.08));
    },
    playExplosion(isBig = false) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isBig ? 95 : 130, now);
        osc.frequency.exponentialRampToValueAtTime(22, now + (isBig ? 0.38 : 0.22));
        gain.gain.setValueAtTime(isBig ? 0.16 : 0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isBig ? 0.4 : 0.24));
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + (isBig ? 0.42 : 0.25));
    },
    playHeal() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
    }
};
window.SFX = SFX;

// ============================================================================
// 2A. COMMAND & CONQUER: RED ALERT ("HELL MARCH" / "GRINDER") PROCEDURAL AI MUSIC ENGINE
//     Industrial Military Synth-Rock: Heavy Boot-Stomp Cadence, Distorted Power-Chord
//     Bass Guitar Riff, Militant Snare March, Brass Command Stabs & Dynamic Combat Lead
// ============================================================================
const RAID_MUSIC = {
    playing: false,
    muted: false,
    trackIndex: 0,
    step: 0,
    timerId: null,
    combatIntensity: 0.25,
    masterGain: null,
    compressor: null,
    distortionCurve: null,
    noiseBuffer: null,
    tracks: [
        {
            name: 'IRON MARCH (HELL MARCH)',
            bpm: 130,
            // E Phrygian / E Minor Heavy Industrial Power-Chord Ostinato (E1=41.20, F1=43.65, G1=49.00, A1=55.00, Bb1=58.27, B1=61.74, C2=65.41, D2=73.42, E2=82.41)
            bassRiff: [
                41.20, 41.20, 82.41, 41.20,  43.65, 43.65, 49.00, 41.20,
                41.20, 41.20, 82.41, 41.20,  65.41, 61.74, 55.00, 49.00,
                41.20, 41.20, 82.41, 41.20,  43.65, 43.65, 49.00, 55.00,
                61.74, 61.74, 65.41, 61.74,  55.00, 49.00, 43.65, 41.20
            ],
            // Brass / Industrial Lead Stabs (0 = rest)
            leadMelody: [
                329.63, 0, 329.63, 0,  349.23, 0, 392.00, 329.63,
                0, 0, 329.63, 0,       523.25, 493.88, 440.00, 392.00,
                329.63, 0, 329.63, 0,  349.23, 0, 392.00, 440.00,
                493.88, 0, 523.25, 493.88, 440.00, 392.00, 349.23, 329.63
            ]
        },
        {
            name: 'SOVIET GRINDER (ARMOR ASSAULT)',
            bpm: 138,
            bassRiff: [
                36.71, 36.71, 73.42, 36.71,  41.20, 43.65, 36.71, 36.71,
                36.71, 36.71, 73.42, 36.71,  55.00, 49.00, 43.65, 41.20,
                36.71, 36.71, 73.42, 36.71,  41.20, 43.65, 49.00, 55.00,
                58.27, 55.00, 49.00, 43.65,  41.20, 36.71, 73.42, 36.71
            ],
            leadMelody: [
                293.66, 0, 293.66, 349.23,   329.63, 0, 293.66, 0,
                440.00, 0, 466.16, 440.00,   392.00, 349.23, 329.63, 293.66,
                293.66, 0, 349.23, 392.00,   440.00, 0, 466.16, 523.25,
                587.33, 0, 523.25, 466.16,   440.00, 392.00, 349.23, 293.66
            ]
        },
        {
            name: 'DEFCON VALKYRIE (AIR SUPREMACY)',
            bpm: 142,
            bassRiff: [
                41.20, 82.41, 41.20, 82.41,  49.00, 98.00, 49.00, 98.00,
                55.00, 110.0, 55.00, 110.0,  61.74, 65.41, 61.74, 49.00,
                41.20, 82.41, 41.20, 82.41,  49.00, 98.00, 55.00, 110.0,
                65.41, 65.41, 61.74, 55.00,  49.00, 43.65, 41.20, 41.20
            ],
            leadMelody: [
                659.25, 0, 493.88, 523.25,   587.33, 0, 440.00, 493.88,
                523.25, 0, 392.00, 440.00,   493.88, 523.25, 493.88, 392.00,
                659.25, 0, 587.33, 523.25,   493.88, 0, 440.00, 392.00,
                523.25, 493.88, 440.00, 392.00, 349.23, 392.00, 329.63, 0
            ]
        }
    ],
    ensureNodes() {
        SFX.init();
        if (!SFX.ctx) return false;
        const ctx = SFX.ctx;
        if (!this.masterGain) {
            this.masterGain = ctx.createGain();
            this.masterGain.gain.value = 0.58;
            if (typeof ctx.createDynamicsCompressor === 'function') {
                this.compressor = ctx.createDynamicsCompressor();
                this.compressor.threshold.setValueAtTime(-16, ctx.currentTime);
                this.compressor.knee.setValueAtTime(18, ctx.currentTime);
                this.compressor.ratio.setValueAtTime(4, ctx.currentTime);
                this.compressor.attack.setValueAtTime(0.005, ctx.currentTime);
                this.compressor.release.setValueAtTime(0.18, ctx.currentTime);
                this.masterGain.connect(this.compressor);
                this.compressor.connect(ctx.destination);
            } else {
                this.masterGain.connect(ctx.destination);
            }
        }
        if (!this.distortionCurve) {
            const samples = 512;
            const curve = new Float32Array(samples);
            const k = 42;
            for (let i = 0; i < samples; i++) {
                const x = (i * 2) / samples - 1;
                curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
            }
            this.distortionCurve = curve;
        }
        if (!this.noiseBuffer) {
            const len = Math.floor(ctx.sampleRate * 0.25);
            this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.065));
            }
        }
        return true;
    },
    triggerKickAndBootStomp(now, isHeavyStomp) {
        const ctx = SFX.ctx;
        // Sub-bass military kick drum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isHeavyStomp ? 135 : 115, now);
        osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
        gain.gain.setValueAtTime(isHeavyStomp ? 0.48 : 0.34, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.17);

        // Iconic Red Alert Marching Boot-Stomp Thud on beats 0 & 2
        if (isHeavyStomp && this.noiseBuffer) {
            const noise = ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(320, now);
            filter.Q.value = 1.8;
            const nGain = ctx.createGain();
            nGain.gain.setValueAtTime(0.28, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.masterGain);
            noise.start(now);
            noise.stop(now + 0.12);
        }
    },
    triggerMilitantSnare(now, accent = false) {
        const ctx = SFX.ctx;
        if (!this.noiseBuffer) return;
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(850, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(accent ? 0.32 : 0.16, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + (accent ? 0.14 : 0.08));
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.15);

        // Snare body snap
        const body = ctx.createOscillator();
        const bGain = ctx.createGain();
        body.type = 'triangle';
        body.frequency.setValueAtTime(210, now);
        body.frequency.exponentialRampToValueAtTime(95, now + 0.07);
        bGain.gain.setValueAtTime(accent ? 0.22 : 0.11, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        body.connect(bGain);
        bGain.connect(this.masterGain);
        body.start(now);
        body.stop(now + 0.09);
    },
    triggerHiHat(now, open = false) {
        const ctx = SFX.ctx;
        if (!this.noiseBuffer) return;
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5200, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(open ? 0.11 : 0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (open ? 0.11 : 0.04));
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.12);
    },
    triggerPowerChordGuitar(now, rootFreq, duration, accent = false) {
        const ctx = SFX.ctx;
        // Root + Fifth (1.498x) Overdriven Industrial Chug
        [rootFreq, rootFreq * 1.4983, rootFreq * 2.0].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = idx === 0 ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(freq, now);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(accent ? 1750 : 1150, now);
            filter.frequency.exponentialRampToValueAtTime(360, now + duration);
            filter.Q.value = 3.2;

            const shaper = ctx.createWaveShaper();
            shaper.curve = this.distortionCurve;

            const gain = ctx.createGain();
            const vol = (idx === 0 ? 0.16 : 0.085) * (accent ? 1.25 : 0.94);
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(filter);
            filter.connect(shaper);
            shaper.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + duration + 0.01);
        });
    },
    triggerCommandBrassAndSynthLead(now, freq, duration) {
        if (!freq || freq <= 0) return;
        const ctx = SFX.ctx;
        // Detuned dual-sawtooth Soviet Command Brass / Industrial Synth Lead
        [-4.5, 4.5].forEach(detune => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.detune.setValueAtTime(detune, now);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2400 + this.combatIntensity * 1200, now);
            filter.frequency.exponentialRampToValueAtTime(720, now + duration);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.10 * (0.78 + this.combatIntensity * 0.45), now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + duration + 0.02);
        });
    },
    tick() {
        if (!this.playing || this.muted || SFX.muted) return;
        if (!this.ensureNodes()) return;
        const ctx = SFX.ctx;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
            return;
        }
        this._firstAudibleBeatPlayed = true;
        const track = this.tracks[this.trackIndex % this.tracks.length];
        const stepDur = (60 / track.bpm) / 4; // 16th-note step
        const now = ctx.currentTime + 0.01;
        const s = this.step % 32;
        const beatStep = s % 4;

        // 1. Militant Boot-Stomp & Kick Pattern (Beats 0, 2 + syncopated double-kick on bar end)
        if (beatStep === 0 || (s % 8 === 6 && this.combatIntensity > 0.35)) {
            this.triggerKickAndBootStomp(now, s % 8 === 0 || s % 8 === 4);
        }
        // 2. Industrial Marching Snare Cadence (Backbeat + military snare roll at phrase end)
        if (s % 8 === 4) {
            this.triggerMilitantSnare(now, true);
        } else if (s >= 28 && (s % 2 === 1)) {
            this.triggerMilitantSnare(now, false);
        }
        // 3. Driving 16th-note Industrial Hi-Hat
        if (s % 2 === 0 || this.combatIntensity > 0.45) {
            this.triggerHiHat(now, beatStep === 2);
        }
        // 4. Distorted Power-Chord Guitar & Bass Riff
        const bassFreq = track.bassRiff[s];
        if (bassFreq > 0) {
            const isAccent = (beatStep === 0) || (s % 8 === 3);
            this.triggerPowerChordGuitar(now, bassFreq, stepDur * (isAccent ? 1.85 : 1.15), isAccent);
        }
        // 5. Command Brass & Synth Lead Melody
        const leadFreq = track.leadMelody[s];
        if (leadFreq > 0 && (s < 16 || this.combatIntensity > 0.15)) {
            this.triggerCommandBrassAndSynthLead(now, leadFreq, stepDur * 2.1);
        }

        this.step = (this.step + 1) % 32;
    },
    start() {
        this.ensureNodes();
        if (SFX.ctx && SFX.ctx.state === 'suspended') {
            SFX.ctx.resume().catch(() => {});
        }
        if (this.playing) {
            if (!this.timerId) this.scheduleLoop();
            if (SFX.ctx && SFX.ctx.state === 'running' && !this.muted && !SFX.muted && !this._firstAudibleBeatPlayed) {
                this.tick();
            }
            this.updateHudButton();
            return;
        }
        this.playing = true;
        this.scheduleLoop();
        // Play immediate first beat if context is running so the player gets instant musical feedback!
        if (SFX.ctx && SFX.ctx.state === 'running' && !this.muted && !SFX.muted) {
            this.tick();
        }
        this.updateHudButton();
    },
    scheduleLoop() {
        if (this.timerId) clearInterval(this.timerId);
        if (!this.playing) return;
        const track = this.tracks[this.trackIndex % this.tracks.length];
        const stepMs = ((60 / track.bpm) / 4) * 1000;
        this.timerId = setInterval(() => this.tick(), stepMs);
    },
    toggleMusic() {
        this.ensureNodes();
        const wasSuspended = SFX.ctx && SFX.ctx.state === 'suspended';
        if (wasSuspended) {
            SFX.ctx.resume().catch(() => {});
        }
        if (!this.playing) {
            this.muted = false;
            SFX.muted = false;
            this.start();
        } else if (wasSuspended && !this.muted) {
            // Context was suspended by browser autoplay policy; resume and play instead of muting!
            this.muted = false;
            SFX.muted = false;
            this.tick();
        } else {
            this.muted = !this.muted;
            if (!this.muted) {
                SFX.muted = false;
                this.tick();
            }
        }
        this.updateHudButton();
        return !this.muted;
    },
    nextTrack() {
        this.ensureNodes();
        if (SFX.ctx && SFX.ctx.state === 'suspended') {
            SFX.ctx.resume().catch(() => {});
        }
        this.trackIndex = (this.trackIndex + 1) % this.tracks.length;
        this.step = 0;
        this.muted = false;
        if (!this.playing) this.start();
        else {
            this.scheduleLoop();
            this.tick();
        }
        this.updateHudButton();
        return this.tracks[this.trackIndex].name;
    },
    setCombatIntensity(level) {
        this.combatIntensity = Math.max(0.15, Math.min(1.0, level));
    },
    updateHudButton() {
        const btn = document.getElementById('hud-music-btn');
        const track = this.tracks[this.trackIndex % this.tracks.length];
        if (btn) {
            const isOn = this.playing && !this.muted && !SFX.muted;
            btn.textContent = isOn ? `🎸 ${track.name.split(' ')[0]}: ON` : '🎸 MUSIC: OFF';
            btn.style.color = isOn ? '#ffaa00' : '#7896b4';
            btn.style.borderColor = isOn ? 'rgba(255,170,0,0.45)' : 'rgba(255,255,255,0.15)';
        }
        const modalBtn = document.getElementById('modal-music-track-btn');
        if (modalBtn) {
            modalBtn.textContent = `🎸 TRACK: ${track.name}`;
        }
    }
};
window.RAID_MUSIC = RAID_MUSIC;

// Global Capture-Phase User-Gesture Audio Unlock: unlocks Web Audio even when inner buttons call stopPropagation()!
['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'click'].forEach(evtName => {
    window.addEventListener(evtName, () => {
        SFX.unlockAndResume();
    }, { capture: true, passive: true });
    document.addEventListener(evtName, () => {
        SFX.unlockAndResume();
    }, { capture: true, passive: true });
});

// Calibrated StarCraft II Three-Point RTS Studio Lighting Rig:
// 1. Key Light: Warm Koprulu Sun with 2048x2048 Soft Shadows
// 2. Fill Light: Cool Sky / Warm Canyon Ground Hemisphere Ambient
// 3. Rim Light: High-Contrast Cool Backlight for Unit Silhouette Separation
const hemiLight = new THREE.HemisphereLight(0x98c6ec, 0x384d38, 0.86);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff2de, 1.22);
dirLight.position.set(58, 96, 48);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
const d = 88;
dirLight.shadow.camera.left = -d; dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d; dirLight.shadow.camera.bottom = -d;
dirLight.shadow.camera.near = 10;
dirLight.shadow.camera.far = 230;
dirLight.shadow.bias = -0.00035;
dirLight.shadow.normalBias = 0.014;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x6eb6ff, 0.52);
rimLight.position.set(-64, 52, -56);
scene.add(rimLight);

// ============================================================================
// 2B. ADVANCED CUSTOM GLSL SHADER ENGINE (FLAME, BOMB, WATER, TERRAIN & FORCEFIELD)
// ============================================================================
// Procedural Volumetric Flame Shader (Pulsating Turbulent Fire Core + Heat Shimmer)
const flameShaderMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 }
    },
    vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec3 p = position;
            // Upward flickering wind displacement
            float flameWave = sin(p.y * 7.5 - uTime * 14.0) * cos(p.x * 6.0 + uTime * 9.0) * 0.12 * (p.y + 0.2);
            p.x += flameWave * 0.75;
            p.z += flameWave * 0.55;
            p.y *= (1.0 + 0.15 * sin(uTime * 11.0));
            vPos = p;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
            float y = clamp(vUv.y, 0.0, 1.0);
            float noise1 = sin(vPos.x * 8.0 + uTime * 8.0) * cos(vPos.y * 10.0 - uTime * 12.0);
            float noise2 = sin(vPos.z * 9.0 - uTime * 10.0) * cos(vPos.x * 7.0 + uTime * 7.0);
            float flicker = 0.5 + 0.5 * (noise1 * 0.6 + noise2 * 0.4);
            
            // Thermal gradient: white-hot core -> gold -> deep roaring crimson -> smoke dissipation
            vec3 coreCol = vec3(1.0, 0.98, 0.85);
            vec3 flameGold = vec3(1.0, 0.62, 0.08);
            vec3 flameRed = vec3(0.96, 0.16, 0.04);
            vec3 charredCol = vec3(0.22, 0.04, 0.01);
            
            vec3 col = mix(coreCol, flameGold, smoothstep(0.0, 0.35, y));
            col = mix(col, flameRed, smoothstep(0.35, 0.78, y));
            col = mix(col, charredCol, smoothstep(0.78, 1.0, y));
            
            float alpha = (1.0 - pow(y, 1.4)) * (0.65 + 0.35 * flicker) * uIntensity;
            gl_FragColor = vec4(col * 1.35, clamp(alpha, 0.0, 1.0));
        }
    `
});

const MAX_WATER_RIPPLES = 8;
const waterRippleCenters = [];
for (let i = 0; i < MAX_WATER_RIPPLES; i++) waterRippleCenters.push(new THREE.Vector2(9999, 9999));
const waterRippleTimes = new Float32Array(MAX_WATER_RIPPLES).fill(-99.0);
const waterRippleStrengths = new Float32Array(MAX_WATER_RIPPLES).fill(0.0);
let nextWaterRippleSlot = 0;

const _fallbackFowBytes = new Uint8Array([255, 255, 255, 0]);
const _fallbackFowTex = new THREE.DataTexture(_fallbackFowBytes, 1, 1, THREE.RGBAFormat);
_fallbackFowTex.needsUpdate = true;
const _sharedFowFlag = { value: 0.0 };
const _sharedMapSize = { value: 260.0 };
const _sharedTitleFlag = { value: 1.0 };
const _sharedSunLightFactor = { value: 1.0 };

const plasmaShaderMat = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uCoreColor: { value: new THREE.Color(0x00e5ff) },
        uRimColor: { value: new THREE.Color(0xffffff) },
        uAccentColor: { value: new THREE.Color(0x38bdf8) },
        uFowMap: { value: _fallbackFowTex },
        uHasFow: _sharedFowFlag,
        uMapSize: _sharedMapSize,
        uTitleScreen: _sharedTitleFlag,
        uSunLightFactor: _sharedSunLightFactor
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vLocalPos;
        varying vec3 vWorldPos;
        void main() {
            vLocalPos = position;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = viewMatrix * worldPos;
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uCoreColor;
        uniform vec3 uRimColor;
        uniform vec3 uAccentColor;
        uniform sampler2D uFowMap;
        uniform float uHasFow;
        uniform float uMapSize;
        uniform float uTitleScreen;
        uniform float uSunLightFactor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vLocalPos;
        varying vec3 vWorldPos;
        void main() {
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 1.65);
            float swirl1 = sin(vLocalPos.y * 16.0 + vLocalPos.x * 11.0 - uTime * 8.2);
            float swirl2 = cos(vLocalPos.z * 14.0 - vLocalPos.y * 9.0 + uTime * 6.4);
            float plasmaBand = 0.5 + 0.5 * sin(swirl1 * 1.8 + swirl2 * 1.6);
            float pulse = 0.82 + 0.18 * sin(uTime * 5.5 + vLocalPos.z * 8.0);
            vec3 base = mix(uCoreColor * pulse, uAccentColor, plasmaBand * 0.55);
            vec3 col = mix(base, uRimColor, clamp(fresnel * 0.72 + plasmaBand * 0.28, 0.0, 1.0));
            col *= clamp(0.48 + 0.52 * uSunLightFactor, 0.38, 1.05);
            if (uHasFow > 0.5 && uTitleScreen < 0.5) {
                vec2 fowUv = vec2((vWorldPos.x / uMapSize) + 0.5, 0.5 - (vWorldPos.z / uMapSize));
                if (fowUv.x >= 0.0 && fowUv.x <= 1.0 && fowUv.y >= 0.0 && fowUv.y <= 1.0) {
                    float fA = texture2D(uFowMap, fowUv).a;
                    float fowIntensity = smoothstep(0.03, 0.95, fA);
                    vec3 darkShroud = mix(col * 0.22, vec3(0.02, 0.035, 0.06), smoothstep(0.4, 0.88, fowIntensity));
                    col = mix(col, darkShroud, clamp(fowIntensity * 0.96, 0.0, 0.96));
                }
            }
            gl_FragColor = vec4(col, 1.0);
        }
    `
});

const zergBioShaderMat = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x521046) },
        uVeinColor: { value: new THREE.Color(0x5ec408) },
        uPulseColor: { value: new THREE.Color(0xa626bd) },
        uFowMap: { value: _fallbackFowTex },
        uHasFow: _sharedFowFlag,
        uMapSize: _sharedMapSize,
        uTitleScreen: _sharedTitleFlag,
        uSunLightFactor: _sharedSunLightFactor
    },
    vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vPos;
        varying vec3 vWorldPos;
        void main() {
            vPos = position;
            float throb = 1.0 + 0.042 * sin(uTime * 4.2 + position.y * 5.5 + position.x * 4.2);
            vec3 displaced = position + normal * (0.022 * sin(uTime * 5.2 + position.z * 6.5));
            vec4 worldPos = modelMatrix * vec4(displaced * throb, 1.0);
            vWorldPos = worldPos.xyz;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = viewMatrix * worldPos;
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uVeinColor;
        uniform vec3 uPulseColor;
        uniform sampler2D uFowMap;
        uniform float uHasFow;
        uniform float uMapSize;
        uniform float uTitleScreen;
        uniform float uSunLightFactor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vPos;
        varying vec3 vWorldPos;
        void main() {
            vec3 viewDir = normalize(vViewPosition);
            vec3 worldNorm = normalize(vNormal);
            float sunDiff = clamp(0.42 + 0.58 * max(0.0, dot(worldNorm, normalize(vec3(0.45, 0.82, 0.35)))), 0.35, 1.0);
            float rim = pow(1.0 - abs(dot(worldNorm, viewDir)), 2.1);
            float v1 = abs(sin(vPos.x * 12.0 + uTime * 3.1) * cos(vPos.y * 12.0 - uTime * 2.4));
            float v2 = abs(sin(vPos.z * 9.5 - uTime * 2.8));
            float veinMask = smoothstep(0.46, 0.86, v1 * 0.75 + v2 * 0.25);
            vec3 veinMix = mix(uPulseColor, uVeinColor, 0.5 + 0.5 * sin(uTime * 3.5 + vPos.y * 4.0));
            vec3 col = mix(uBaseColor * sunDiff, veinMix * (0.55 + 0.45 * sunDiff), clamp(veinMask * 0.58 + rim * 0.35, 0.0, 0.85));
            col *= clamp(0.38 + 0.62 * uSunLightFactor, 0.30, 1.05);
            if (uHasFow > 0.5 && uTitleScreen < 0.5) {
                vec2 fowUv = vec2((vWorldPos.x / uMapSize) + 0.5, 0.5 - (vWorldPos.z / uMapSize));
                if (fowUv.x >= 0.0 && fowUv.x <= 1.0 && fowUv.y >= 0.0 && fowUv.y <= 1.0) {
                    vec2 tStep = vec2(1.25 / 160.0);
                    float fA = texture2D(uFowMap, fowUv).a * 0.40
                             + texture2D(uFowMap, fowUv + vec2(tStep.x, 0.0)).a * 0.15
                             + texture2D(uFowMap, fowUv - vec2(tStep.x, 0.0)).a * 0.15
                             + texture2D(uFowMap, fowUv + vec2(0.0, tStep.y)).a * 0.15
                             + texture2D(uFowMap, fowUv - vec2(0.0, tStep.y)).a * 0.15;
                    float fowIntensity = smoothstep(0.03, 0.96, fA);
                    float luma = dot(col, vec3(0.299, 0.587, 0.114));
                    vec3 exploredCol = mix(col, vec3(luma) * vec3(0.48, 0.58, 0.78), 0.72) * 0.34;
                    vec3 unexploredCol = mix(exploredCol * 0.18, vec3(0.018, 0.030, 0.052), 0.82);
                    vec3 targetFow = mix(exploredCol, unexploredCol, smoothstep(0.42, 0.88, fowIntensity));
                    col = mix(col, targetFow, clamp(fowIntensity * 0.96, 0.0, 0.96));
                }
            }
            gl_FragColor = vec4(col, 1.0);
        }
    `
});

const waterShaderMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
        uTime: { value: 0 },
        uRainIntensity: { value: 0.0 },
        uFlowDir: { value: new THREE.Vector2(0.82, 0.57) },
        uRippleCenters: { value: waterRippleCenters },
        uRippleTimes: { value: waterRippleTimes },
        uRippleStrengths: { value: waterRippleStrengths },
        uFowMap: { value: _fallbackFowTex },
        uHasFow: _sharedFowFlag,
        uMapSize: _sharedMapSize,
        uTitleScreen: _sharedTitleFlag
    },
    vertexShader: `
        uniform float uTime;
        uniform float uRainIntensity;
        uniform vec2 uFlowDir;
        uniform vec2 uRippleCenters[8];
        uniform float uRippleTimes[8];
        uniform float uRippleStrengths[8];
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vViewDir;
        varying float vWaveHeight;
        void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            float flowPhase = dot(worldPosition.xz, uFlowDir) * 1.65 - uTime * 3.2;
            float h = sin(flowPhase) * cos(worldPosition.z * 1.4 - uTime * 2.1) * 0.055;
            h += sin(worldPosition.x * 3.2 - worldPosition.z * 2.8 + uTime * 4.1) * 0.028;

            // Interactive dynamic concentric ripples from units, air downwash, river crossings & bomb impacts!
            for (int i = 0; i < 8; i++) {
                float age = uTime - uRippleTimes[i];
                if (age >= 0.0 && age < 3.2 && uRippleStrengths[i] > 0.01) {
                    float dist = distance(worldPosition.xz, uRippleCenters[i]);
                    float waveFront = age * 5.2;
                    float band = exp(-pow(dist - waveFront, 2.0) * 1.35);
                    float decay = max(0.0, 1.0 - age / 3.2);
                    h += sin((dist - waveFront) * 6.5) * band * decay * uRippleStrengths[i] * 0.22;
                }
            }

            worldPosition.y += h;
            vWorldPos = worldPosition.xyz;
            vViewDir = normalize(cameraPosition - worldPosition.xyz);
            vWaveHeight = h;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uRainIntensity;
        uniform vec2 uFlowDir;
        uniform vec2 uRippleCenters[8];
        uniform float uRippleTimes[8];
        uniform float uRippleStrengths[8];
        uniform sampler2D uFowMap;
        uniform float uHasFow;
        uniform float uMapSize;
        uniform float uTitleScreen;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vViewDir;
        varying float vWaveHeight;
        void main() {
            float edgeFactor = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0;
            float radialDist = clamp(1.0 - edgeFactor, 0.0, 1.0);
            vec3 deepCol = mix(vec3(0.03, 0.19, 0.30), vec3(0.08, 0.28, 0.22), uRainIntensity * 0.55);
            vec3 shallowCol = mix(vec3(0.08, 0.44, 0.54), vec3(0.24, 0.62, 0.32), uRainIntensity * 0.55);
            vec3 col = mix(deepCol, shallowCol, smoothstep(0.15, 0.92, radialDist));

            // Dual scrolling directional river & pond caustic network
            vec2 flowUv1 = vWorldPos.xz * 0.42 - uFlowDir * (uTime * 0.65);
            vec2 flowUv2 = vWorldPos.xz * 0.68 + vec2(-uFlowDir.y, uFlowDir.x) * (uTime * 0.42);
            float c1 = sin(flowUv1.x * 8.0 + sin(flowUv1.y * 6.0 + uTime * 2.0)) * cos(flowUv1.y * 8.0);
            float c2 = sin(flowUv2.x * 9.5 - flowUv2.y * 7.5 + uTime * 3.1);
            float caustics = smoothstep(0.34, 0.86, abs(c1 * 0.65 + c2 * 0.45));
            vec3 causticTint = mix(vec3(0.20, 0.72, 0.88), vec3(0.52, 0.95, 0.28), uRainIntensity * 0.65);
            col += causticTint * caustics * 0.30;

            // Acid raindrop micro-rings on water surface when raining
            if (uRainIntensity > 0.02) {
                vec2 cell = floor(vWorldPos.xz * 1.8);
                vec2 local = fract(vWorldPos.xz * 1.8) - 0.5;
                float rnd = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
                float rAge = fract(uTime * 1.9 + rnd);
                float rDist = length(local);
                float rRing = exp(-pow(rDist - rAge * 0.46, 2.0) * 190.0) * (1.0 - rAge);
                col += vec3(0.58, 1.0, 0.35) * rRing * uRainIntensity * 0.85;
            }

            // Highlight interactive ripple crests in bright cyan-white foam
            float rippleFoam = 0.0;
            for (int i = 0; i < 8; i++) {
                float age = uTime - uRippleTimes[i];
                if (age >= 0.0 && age < 3.2 && uRippleStrengths[i] > 0.01) {
                    float dist = distance(vWorldPos.xz, uRippleCenters[i]);
                    float waveFront = age * 5.2;
                    float ring = exp(-pow(dist - waveFront, 2.0) * 2.2);
                    float decay = max(0.0, 1.0 - age / 3.2);
                    rippleFoam += ring * decay * uRippleStrengths[i];
                }
            }
            col = mix(col, vec3(0.72, 0.97, 1.0), clamp(rippleFoam * 0.85 + max(0.0, vWaveHeight * 4.5), 0.0, 0.9));

            // Fresnel Sky Reflection + Solar Specular Glint + Beer-Lambert Depth Absorption
            vec3 sunDir = normalize(vec3(58.0, 96.0, 48.0));
            vec2 waveGrad = vec2(
                cos(vWorldPos.x * 2.4 + uTime * 2.8) * 0.14,
                sin(vWorldPos.z * 2.2 - uTime * 2.4) * 0.14
            );
            vec3 waterNormal = normalize(vec3(waveGrad.x, 1.0, waveGrad.y));
            vec3 halfVec = normalize(sunDir + normalize(vViewDir));
            float specGlint = pow(max(0.0, dot(waterNormal, halfVec)), 72.0) * (1.0 - uRainIntensity * 0.5);

            float fresnel = pow(1.0 - max(0.0, dot(waterNormal, normalize(vViewDir))), 3.0);
            vec3 skyReflCol = mix(vec3(0.42, 0.68, 0.88), vec3(0.28, 0.46, 0.36), uRainIntensity * 0.6);
            col = mix(col, skyReflCol, fresnel * 0.48);
            col += vec3(1.0, 0.95, 0.82) * specGlint * 0.85;

            float shoreFoam = smoothstep(0.82, 0.98, radialDist + 0.032 * sin(uTime * 3.0 + vWorldPos.x * 2.2));
            col = mix(col, vec3(0.82, 0.94, 0.98), shoreFoam * 0.42);

            // Apply Fog of War Intensity Attenuation to Water so Rivers & Ponds match Terrain Shroud!
            if (uHasFow > 0.5 && uTitleScreen < 0.5) {
                vec2 fowUv = vec2((vWorldPos.x / uMapSize) + 0.5, 0.5 - (vWorldPos.z / uMapSize));
                if (fowUv.x >= 0.0 && fowUv.x <= 1.0 && fowUv.y >= 0.0 && fowUv.y <= 1.0) {
                    vec2 tStep = vec2(1.0 / 160.0);
                    float fA = texture2D(uFowMap, fowUv).a * 0.40
                             + texture2D(uFowMap, fowUv + vec2(tStep.x, 0.0)).a * 0.15
                             + texture2D(uFowMap, fowUv - vec2(tStep.x, 0.0)).a * 0.15
                             + texture2D(uFowMap, fowUv + vec2(0.0, tStep.y)).a * 0.15
                             + texture2D(uFowMap, fowUv - vec2(0.0, tStep.y)).a * 0.15;
                    float fowFactor = smoothstep(0.04, 0.96, fA);
                    float luma = dot(col, vec3(0.299, 0.587, 0.114));
                    vec3 desatWater = mix(col, vec3(luma) * vec3(0.42, 0.58, 0.78), 0.72);
                    vec3 exploredWater = desatWater * 0.42;
                    vec3 unexploredWater = mix(desatWater * 0.18, vec3(0.02, 0.038, 0.065), 0.76);
                    vec3 shroudedWater = mix(exploredWater, unexploredWater, smoothstep(0.42, 0.88, fowFactor));
                    col = mix(col, shroudedWater, clamp(fowFactor * 0.92, 0.0, 0.92));
                }
            }

            gl_FragColor = vec4(col, 0.92);
        }
    `
});

// Hexagonal Forcefield Energy Shield Shader for Turret Shield Domes
// Crystal-clear see-through interior so buildings & units inside are 100% visible,
// with 3D concentric shockwave ripple animation across the dome surface when hit!
const MAX_SHIELD_RIPPLES = 6;
const shieldHitPoints = Array.from({ length: MAX_SHIELD_RIPPLES }, () => new THREE.Vector3(0, -999, 0));
const shieldHitTimes = new Float32Array(MAX_SHIELD_RIPPLES).fill(-999.0);
let nextShieldRippleSlot = 0;

const shieldHexShaderMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x00e5ff) },
        uHitPoints: { value: shieldHitPoints },
        uHitTimes: { value: shieldHitTimes }
    },
    vertexShader: `
        uniform float uTime;
        uniform vec3 uHitPoints[${MAX_SHIELD_RIPPLES}];
        uniform float uHitTimes[${MAX_SHIELD_RIPPLES}];
        varying vec3 vNormal;
        varying vec3 vViewPos;
        varying vec3 vLocalPos;
        varying vec3 vWorldPos;
        void main() {
            vLocalPos = position;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            float disp = 0.0;
            for (int i = 0; i < ${MAX_SHIELD_RIPPLES}; i++) {
                float age = uTime - uHitTimes[i];
                if (age > 0.0 && age < 1.35) {
                    float d = distance(worldPosition.xyz, uHitPoints[i]);
                    float waveFront = age * 11.5;
                    float ring = exp(-pow(d - waveFront, 2.0) * 1.8) * (1.0 - age / 1.35);
                    disp += sin((d - waveFront) * 4.5) * ring * 0.18;
                }
            }
            vec3 displaced = position + normal * disp;
            worldPosition = modelMatrix * vec4(displaced, 1.0);
            vWorldPos = worldPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = viewMatrix * worldPosition;
            vViewPos = -mvPos.xyz;
            gl_Position = projectionMatrix * mvPos;
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uHitPoints[${MAX_SHIELD_RIPPLES}];
        uniform float uHitTimes[${MAX_SHIELD_RIPPLES}];
        varying vec3 vNormal;
        varying vec3 vViewPos;
        varying vec3 vLocalPos;
        varying vec3 vWorldPos;
        void main() {
            vec3 viewDir = normalize(vViewPos);
            float fresnel = pow(1.0 - clamp(abs(dot(vNormal, viewDir)), 0.0, 1.0), 2.85);
            float hexX = abs(sin(vLocalPos.x * 3.4 + vLocalPos.z * 1.95));
            float hexZ = abs(cos(vLocalPos.z * 3.4 - vLocalPos.y * 2.8));
            float lattice = smoothstep(0.88, 0.985, max(hexX, hexZ));
            float baseRim = smoothstep(0.0, 1.2, 1.2 - vLocalPos.y);

            // Compute concentric 3D impact ripples radiating from hit coordinates
            float hitRippleGlow = 0.0;
            for (int i = 0; i < ${MAX_SHIELD_RIPPLES}; i++) {
                float age = uTime - uHitTimes[i];
                if (age > 0.0 && age < 1.35) {
                    float fade = 1.0 - (age / 1.35);
                    float d = distance(vWorldPos, uHitPoints[i]);
                    float r1 = age * 11.5;
                    float r2 = max(0.0, (age - 0.12) * 11.5);
                    float r3 = max(0.0, (age - 0.24) * 11.5);
                    float wave1 = exp(-pow(d - r1, 2.0) * 3.2);
                    float wave2 = exp(-pow(d - r2, 2.0) * 4.0) * 0.75;
                    float wave3 = exp(-pow(d - r3, 2.0) * 4.5) * 0.5;
                    float centerFlash = exp(-d * d * 0.55) * max(0.0, 1.0 - age * 2.4);
                    hitRippleGlow += (wave1 + wave2 + wave3 + centerFlash) * fade;
                }
            }
            hitRippleGlow = clamp(hitRippleGlow, 0.0, 1.6);

            // Keep interior 98% transparent so buildings & units inside are completely visible!
            float passiveAlpha = fresnel * 0.24 + lattice * 0.055 + baseRim * 0.14;
            float rippleAlpha = hitRippleGlow * (0.48 + lattice * 0.42);
            float alpha = clamp(passiveAlpha + rippleAlpha, 0.012, 0.78);
            vec3 col = mix(uColor, vec3(0.88, 0.99, 1.0), clamp(lattice * 0.5 + fresnel * 0.4 + hitRippleGlow * 0.65, 0.0, 1.0));
            gl_FragColor = vec4(col, alpha);
        }
    `
});

window.pushShieldHitRipple = function(wx, wy, wz) {
    const t = shieldHexShaderMat.uniforms.uTime.value;
    shieldHitPoints[nextShieldRippleSlot].set(wx, wy, wz);
    shieldHitTimes[nextShieldRippleSlot] = t;
    nextShieldRippleSlot = (nextShieldRippleSlot + 1) % MAX_SHIELD_RIPPLES;
};

// Realistic Multi-Layered Domain-Warped Volumetric Cumulus/Stratus Cloud Shroud for Fog of War Overlay Mesh
const fowCloudShaderMat = new THREE.ShaderMaterial({
    uniforms: {
        uFowMap: { value: _fallbackFowTex },
        uTime: { value: 0.0 },
        uMapSize: { value: 260.0 }
    },
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2,
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
        }
    `,
    fragmentShader: `
        uniform sampler2D uFowMap;
        uniform float uTime;
        uniform float uMapSize;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        float hash21(vec2 p) {
            p = fract(p * vec2(127.1, 311.7));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float valueNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
            float a = hash21(i);
            float b = hash21(i + vec2(1.0, 0.0));
            float c = hash21(i + vec2(0.0, 1.0));
            float d = hash21(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // 4-Octave Rotational FBM for realistic billowing cumulus cloud structure
        float fbmCloud(vec2 p) {
            float v = 0.0;
            float amp = 0.52;
            mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
            for (int i = 0; i < 4; i++) {
                v += amp * valueNoise(p);
                p = rot * p * 2.08 + vec2(2.3, 1.7);
                amp *= 0.48;
            }
            return v;
        }

        void main() {
            // 9-tap Gaussian-weighted Fog of War sampling for ultra-smooth organic cloud borders
            vec2 texel = vec2(1.5 / 192.0);
            float a0 = texture2D(uFowMap, vUv).a * 0.28;
            float aN = texture2D(uFowMap, vUv + vec2(0.0, texel.y)).a * 0.12;
            float aS = texture2D(uFowMap, vUv - vec2(0.0, texel.y)).a * 0.12;
            float aE = texture2D(uFowMap, vUv + vec2(texel.x, 0.0)).a * 0.12;
            float aW = texture2D(uFowMap, vUv - vec2(texel.x, 0.0)).a * 0.12;
            float aNE = texture2D(uFowMap, vUv + texel).a * 0.06;
            float aNW = texture2D(uFowMap, vUv + vec2(-texel.x, texel.y)).a * 0.06;
            float aSE = texture2D(uFowMap, vUv + vec2(texel.x, -texel.y)).a * 0.06;
            float aSW = texture2D(uFowMap, vUv - texel).a * 0.06;
            float rawFow = a0 + aN + aS + aE + aW + aNE + aNW + aSE + aSW;

            if (rawFow < 0.015) discard;

            // Domain-warped multi-altitude atmospheric cloud layers (Low stratus + High billowing cumulus)
            vec2 baseUv = vWorldPos.xz * 0.028;
            vec2 windLow = vec2(uTime * 0.014, -uTime * 0.010);
            vec2 windHigh = vec2(-uTime * 0.009, uTime * 0.016);

            vec2 q = vec2(
                fbmCloud(baseUv + windLow),
                fbmCloud(baseUv + vec2(5.2, 1.3) - windLow * 0.8)
            );
            float cumulus = fbmCloud(baseUv * 1.45 + q * 1.65 + windHigh);
            float wispyStratus = fbmCloud(baseUv * 2.85 - q * 0.95 + windLow * 1.4);
            float billow = clamp(cumulus * 0.68 + wispyStratus * 0.32, 0.0, 1.0);

            // Pseudo-3D cloud normal gradient for realistic directional sun/moon lighting on cloud puffs
            float dCloudX = fbmCloud(baseUv * 1.45 + vec2(0.08, 0.0) + q * 1.65 + windHigh) - cumulus;
            float dCloudZ = fbmCloud(baseUv * 1.45 + vec2(0.0, 0.08) + q * 1.65 + windHigh) - cumulus;
            float cloudLit = clamp(0.55 + (dCloudX * 3.8 - dCloudZ * 3.2), 0.0, 1.0);

            // Feathered, billowing cloud-bank edge along the line-of-sight boundary
            float edgeBand = 4.0 * rawFow * (1.0 - rawFow);
            float softFow = smoothstep(0.05, 0.92, rawFow + (billow - 0.48) * 0.28 * edgeBand);

            // Rich volumetric cloud palette: deep slate-indigo cloud base, moonlit silver-blue crests, and wispy rim
            vec3 cloudShadowBase = vec3(0.014, 0.024, 0.044);
            vec3 cloudMidBody    = vec3(0.048, 0.078, 0.128);
            vec3 cloudSilverCrest = vec3(0.145, 0.215, 0.310);

            vec3 cloudCol = mix(cloudShadowBase, cloudMidBody, smoothstep(0.22, 0.72, billow));
            cloudCol = mix(cloudCol, cloudSilverCrest, smoothstep(0.52, 0.92, billow * 0.65 + cloudLit * 0.45) * (0.42 + edgeBand * 0.58));

            float puffDensity = mix(0.68, 1.18, smoothstep(0.25, 0.85, billow));
            float finalAlpha = clamp(softFow * puffDensity * 0.36, 0.0, 0.48);
            gl_FragColor = vec4(cloudCol, finalAlpha);
        }
    `
});

// Procedural Non-Animated Wave-Like Viscous Zerg Goo Biomass Texture (512x512 - Zero Dots, Zero Lines, Rich Goo Ripples!)
const creepOverlayTex = makeProceduralTexture((ctx, w, h) => {
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const twoPi = Math.PI * 2;
    for (let y = 0; y < h; y++) {
        const ny = (y / h) * twoPi;
        for (let x = 0; x < w; x++) {
            const nx = (x / w) * twoPi;
            // Sinuous, domain-warped organic goo waves (tileable, non-animated, zero dots or straight lines)
            const warpX = nx + 0.85 * Math.sin(ny * 2.0 + Math.cos(nx * 1.0)) + 0.42 * Math.cos(ny * 3.0 - nx);
            const warpY = ny + 0.85 * Math.cos(nx * 2.0 - Math.sin(ny * 1.0)) + 0.42 * Math.sin(nx * 3.0 + ny);

            // Multi-layered viscous goo wave crests and glossy troughs
            const wavePrimary = Math.sin(warpX * 2.0 + Math.sin(warpY * 2.0)) * 0.5 + 0.5;
            const waveSecondary = Math.cos(warpY * 3.0 - Math.cos(warpX * 2.0)) * 0.5 + 0.5;
            const gooRipple = Math.sin(warpX * 4.0 + warpY * 3.0 + wavePrimary * 2.4) * 0.5 + 0.5;

            // Smooth ridge crest shaping for thick gelatinous goo waves
            const crest = Math.pow(wavePrimary * 0.52 + waveSecondary * 0.30 + gooRipple * 0.18, 1.35);
            const trough = 1.0 - Math.abs(wavePrimary - waveSecondary);
            const sheen = Math.pow(Math.max(0, Math.sin(warpX * 3.0 + warpY * 2.0)), 3.0) * 0.28;

            const idx = (y * w + x) * 4;
            data[idx]     = Math.min(255, Math.round(28 + crest * 54 + trough * 16 + sheen * 48)); // R (deep violet-crimson goo crest)
            data[idx + 1] = Math.min(255, Math.round(6 + crest * 15 + sheen * 18));                // G (viscous dark Bio-slime trough)
            data[idx + 2] = Math.min(255, Math.round(42 + crest * 68 + trough * 22 + sheen * 56)); // B (rich bioluminescent purple goo)
            data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}, 1, 1);

// Centralized Shader Engine with Custom Vertex Lighting, Shadow Map & Texture-Blending FoW Shader Injection
const SHADER_ENGINE = {
    shieldShaderMat: shieldHexShaderMat,
    fowCloudShaderMat: fowCloudShaderMat,
    terrainUniforms: {
        uTime: { value: 0 },
        uWetness: { value: 0.0 },
        uAcidRain: { value: 0.0 },
        uFogBoost: { value: 0.0 },
        uFowMap: { value: _fallbackFowTex },
        uHasFow: _sharedFowFlag,
        uUseFow: _sharedFowFlag,
        uMapSize: _sharedMapSize,
        uTitleScreen: _sharedTitleFlag,
        uSunLightFactor: _sharedSunLightFactor,
        uCreepCenter: { value: new THREE.Vector2(-74.0, -74.0) },
        uCreepRadius: { value: 16.5 },
        uCreepTex: { value: creepOverlayTex }
    },
    setFogOfWarTexture(tex, mapSize = 260.0) {
        if (tex && tex.isTexture) {
            this.terrainUniforms.uFowMap.value = tex;
            fowCloudShaderMat.uniforms.uFowMap.value = tex;
            waterShaderMat.uniforms.uFowMap.value = tex;
            plasmaShaderMat.uniforms.uFowMap.value = tex;
            zergBioShaderMat.uniforms.uFowMap.value = tex;
            _sharedFowFlag.value = 1.0;
        } else {
            this.terrainUniforms.uFowMap.value = _fallbackFowTex;
            fowCloudShaderMat.uniforms.uFowMap.value = _fallbackFowTex;
            waterShaderMat.uniforms.uFowMap.value = _fallbackFowTex;
            plasmaShaderMat.uniforms.uFowMap.value = _fallbackFowTex;
            zergBioShaderMat.uniforms.uFowMap.value = _fallbackFowTex;
            _sharedFowFlag.value = 0.0;
        }
        _sharedMapSize.value = mapSize;
        this.terrainUniforms.uMapSize.value = mapSize;
        fowCloudShaderMat.uniforms.uMapSize.value = mapSize;
        waterShaderMat.uniforms.uMapSize.value = mapSize;
    },
    setFowTexture(tex, mapSize = 260.0) {
        this.setFogOfWarTexture(tex, mapSize);
    },
    setZergCreepUniforms(cx, cz, radius) {
        this.terrainUniforms.uCreepCenter.value.set(cx, cz);
        this.terrainUniforms.uCreepRadius.value = Math.max(0.0, radius);
    },
    applyTerrainShader(material, isRoadMaterial = false) {
        this.enhanceTerrainMaterial(material, isRoadMaterial, false);
    },
    applyRoadShader(material) {
        this.enhanceTerrainMaterial(material, true, false);
    },
    applyBuildingShader(material) {
        this.enhanceTerrainMaterial(material, false, true);
    },
    enhanceTerrainMaterial(material, isRoadMaterial = false, isBuildingMaterial = false) {
        if (!material || material.isShaderMaterial || material.type === 'ShaderMaterial' || material._hasEnhancedShader) return;
        material._hasEnhancedShader = true;
        if (!material.userData) material.userData = {};
        material.userData.fowEnhanced = true;
        material.userData.terrainEnhanced = true;
        const isMeadowGrass = !!(material.userData && material.userData.isMeadowGrass);
        material.onBeforeCompile = (shader) => {
            if (shader.fragmentShader.includes('uniform sampler2D uFowMap;') || shader.vertexShader.includes('varying vec3 vCustomWorldPos;')) {
                return;
            }
            shader.uniforms.uTime = this.terrainUniforms.uTime;
            shader.uniforms.uWetness = this.terrainUniforms.uWetness;
            shader.uniforms.uAcidRain = this.terrainUniforms.uAcidRain;
            shader.uniforms.uFogBoost = this.terrainUniforms.uFogBoost;
            shader.uniforms.uFowMap = this.terrainUniforms.uFowMap;
            shader.uniforms.uHasFow = this.terrainUniforms.uHasFow;
            shader.uniforms.uMapSize = this.terrainUniforms.uMapSize;
            shader.uniforms.uTitleScreen = this.terrainUniforms.uTitleScreen;
            shader.uniforms.uSunLightFactor = this.terrainUniforms.uSunLightFactor;
            shader.uniforms.uCreepCenter = this.terrainUniforms.uCreepCenter;
            shader.uniforms.uCreepRadius = this.terrainUniforms.uCreepRadius;
            shader.uniforms.uCreepTex = this.terrainUniforms.uCreepTex;
            shader.uniforms.uIsRoad = { value: isRoadMaterial ? 1.0 : 0.0 };
            shader.uniforms.uIsBuilding = { value: isBuildingMaterial ? 1.0 : 0.0 };
            shader.uniforms.uIsGrass = { value: isMeadowGrass ? 1.0 : 0.0 };

            shader.vertexShader = `
                uniform float uTime;
                uniform float uIsBuilding;
                uniform float uIsGrass;
                uniform float uSunLightFactor;
                uniform vec2 uCreepCenter;
                uniform float uCreepRadius;
                varying vec3 vCustomWorldPos;
                varying vec3 vCustomWorldNormal;
                varying vec3 vVertexLighting;
            ` + shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                if (uIsGrass > 0.5 && position.y > 0.02) {
                    float bendFactor = clamp(position.y * 2.4, 0.0, 1.5);
                    float swayX = sin(uTime * 2.6 + position.x * 6.0 + position.z * 6.0) * 0.055 * bendFactor;
                    float swayZ = cos(uTime * 2.1 - position.z * 5.0 + position.x * 4.0) * 0.045 * bendFactor;
                    transformed.x += swayX;
                    transformed.z += swayZ;
                }`
            ).replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                vec4 customWp = modelMatrix * vec4(transformed, 1.0);
                #ifdef USE_INSTANCING
                    customWp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
                #endif
                // Automatically collapse 3D meadow grass blades when taken over by Zerg Creep!
                if (uIsGrass > 0.5 && uCreepRadius > 0.5) {
                    vec2 toGrass = customWp.xz - uCreepCenter;
                    float gDist = length(toGrass);
                    float gAng = atan(toGrass.y, toGrass.x);
                    float gContour = sin(gAng * 9.0) * 0.95 + cos(gAng * 15.0) * 0.55 + sin(customWp.x * 0.55 + customWp.z * 0.55) * 0.65;
                    if (gDist + gContour < uCreepRadius + 1.45) {
                        transformed *= 0.0;
                        transformed.y = -20.0;
                        customWp.y = -20.0;
                        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
                    }
                }
                vCustomWorldPos = customWp.xyz;
                vec3 rawN = mat3(modelMatrix) * objectNormal;
                #ifdef USE_INSTANCING
                    rawN = mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal;
                #endif
                float nLen = length(rawN);
                vec3 safeWNormal = nLen > 1e-4 ? (rawN / nLen) : vec3(0.0, 1.0, 0.0);
                vCustomWorldNormal = safeWNormal;

                // Per-Vertex Directional Sun + Ground AO Shading (Reacts naturally to day/night uSunLightFactor & shadows!)
                vec3 sunDirV = normalize(vec3(58.0, 96.0, 48.0));
                float nDotL = max(0.0, dot(safeWNormal, sunDirV));
                float hemiMix = safeWNormal.y * 0.5 + 0.5;
                vec3 hemiCol = mix(vec3(0.54, 0.60, 0.68), vec3(0.92, 0.96, 1.0), hemiMix);
                float aoHeight = uIsBuilding > 0.5 ? clamp(0.76 + customWp.y * 0.08, 0.76, 1.0) : 1.0;
                float sunScale = clamp(uSunLightFactor, 0.35, 1.15);
                vVertexLighting = clamp((hemiCol * (0.58 * sunScale) + vec3(0.42, 0.40, 0.38) * nDotL * sunScale) * aoHeight, vec3(0.32), vec3(1.0));`
            );

            shader.fragmentShader = `
                uniform float uTime;
                uniform float uWetness;
                uniform float uAcidRain;
                uniform float uFogBoost;
                uniform sampler2D uFowMap;
                uniform float uHasFow;
                uniform float uMapSize;
                uniform float uTitleScreen;
                uniform float uSunLightFactor;
                uniform vec2 uCreepCenter;
                uniform float uCreepRadius;
                uniform sampler2D uCreepTex;
                uniform float uIsRoad;
                uniform float uIsBuilding;
                uniform float uIsGrass;
                varying vec3 vCustomWorldPos;
                varying vec3 vCustomWorldNormal;
                varying vec3 vVertexLighting;
            ` + shader.fragmentShader.replace(
                '#include <color_fragment>',
                `#include <color_fragment>
                // Discard any 3D grass fragment taken over by Zerg Creep!
                if (uIsGrass > 0.5 && uCreepRadius > 0.5) {
                    vec2 toG = vCustomWorldPos.xz - uCreepCenter;
                    float gD = length(toG);
                    float gA = atan(toG.y, toG.x);
                    float gT = sin(gA * 9.0) * 0.95 + cos(gA * 15.0) * 0.55 + sin(vCustomWorldPos.x * 0.55 + vCustomWorldPos.z * 0.55) * 0.65;
                    if (gD + gT < uCreepRadius + 1.45) {
                        discard;
                    }
                }

                // 0. Apply Per-Vertex AO, Directional Sun & Day/Night Shading so structures react to night & shadow!
                diffuseColor.rgb *= mix(vec3(1.0), vVertexLighting, uIsBuilding > 0.5 ? 0.58 : 0.32);

                // 1. Subtle wind-swept cloud shadow & botanical meadow shimmer
                float cloudWave = 0.92 + 0.06 * sin(vCustomWorldPos.x * 0.055 + uTime * 0.42) * cos(vCustomWorldPos.z * 0.055 - uTime * 0.31);
                diffuseColor.rgb *= cloudWave;

                // 2. Procedural tri-planar sedimentary rock strata + crevice ambient occlusion on steep canyon cliffs
                float terrainOnly = clamp(1.0 - uIsRoad - uIsBuilding - uIsGrass, 0.0, 1.0);
                float slopeFactor = clamp((1.0 - abs(vCustomWorldNormal.y)) * 2.8, 0.0, 1.0) * terrainOnly;
                if (slopeFactor > 0.10) {
                    float strataLayer = sin(vCustomWorldPos.y * 5.6 + sin(vCustomWorldPos.x * 0.75 + vCustomWorldPos.z * 0.65) * 1.5);
                    float fracture = cos(vCustomWorldPos.x * 2.8 - vCustomWorldPos.y * 3.2) * sin(vCustomWorldPos.z * 2.6 + vCustomWorldPos.y * 2.9);
                    float rockCreviceAO = smoothstep(-0.85, 0.45, strataLayer * 0.65 + fracture * 0.35);
                    vec3 rockWarmTint = mix(vec3(0.62, 0.64, 0.68), vec3(1.06, 1.03, 0.98), rockCreviceAO);
                    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * rockWarmTint, slopeFactor * 0.84);
                }
                if (uIsGrass > 0.5) {
                    // Root-to-tip botanical ambient occlusion + sunlit tip translucency
                    float grassTip = clamp(vCustomWorldPos.y * 1.6, 0.0, 1.0);
                    diffuseColor.rgb *= mix(0.72, 1.12, grassTip);
                }

                // 3. Dynamic Acid Rain Wetness Sheen
                if (uWetness > 0.01) {
                    diffuseColor.rgb *= (1.0 - uWetness * 0.16);
                    diffuseColor.rgb += vec3(0.01, 0.04, 0.01) * uAcidRain * uWetness * (1.0 - uIsRoad * 0.65 - uIsBuilding * 0.5);
                }

                // 4. Micro-aggregate asphalt grain on roads
                if (uIsRoad > 0.5) {
                    float grain = 0.92 + 0.08 * fract(sin(dot(floor(vCustomWorldPos.xz * 14.0), vec2(12.9898, 78.233))) * 43758.5453);
                    diffuseColor.rgb *= grain * 0.86;
                } else if (uIsBuilding < 0.5) {
                    float windGust = sin(vCustomWorldPos.x * 0.11 + vCustomWorldPos.z * 0.08 + uTime * 2.6) * 
                                     cos(vCustomWorldPos.x * 0.05 - vCustomWorldPos.z * 0.10 + uTime * 1.8);
                    diffuseColor.rgb *= (0.95 + 0.05 * windGust);
                }

                // 5. Static, Non-Animated Wave-Like Goo Zerg Creep Zone Overlay (Compact Radius, 100% Hole-Free Floor + Semi-Textured Structure Creep!)
                float creepWetnessBoost = 0.0;
                if (uCreepRadius > 0.5 && uIsGrass < 0.5 && vCustomWorldPos.y > -12.0) {
                    vec2 toPos = vCustomWorldPos.xz - uCreepCenter;
                    float dHive = length(toPos);
                    float ang = atan(toPos.y, toPos.x);

                    // Soft static organic contour only at the outer rim so interior has ZERO holes
                    float tendrilContour = sin(ang * 7.0) * 0.65
                                         + cos(ang * 11.0) * 0.35
                                         + sin(vCustomWorldPos.x * 0.45 + vCustomWorldPos.z * 0.45) * 0.38;
                    float effDist = dHive + tendrilContour * smoothstep(uCreepRadius * 0.72, uCreepRadius + 1.5, dHive);

                    if (effDist < uCreepRadius + 2.0) {
                        vec2 baseCreepCoords = vCustomWorldPos.xz + vec2(vCustomWorldPos.y * 0.25, -vCustomWorldPos.y * 0.22);
                        // Static domain-warped goo wave coordinates (strictly non-animated — zero uTime dependency!)
                        vec2 gooWarp = vec2(
                            sin(baseCreepCoords.y * 0.42 + cos(baseCreepCoords.x * 0.35)),
                            cos(baseCreepCoords.x * 0.42 - sin(baseCreepCoords.y * 0.35))
                        ) * 1.15;
                        vec2 warpedCoords = baseCreepCoords + gooWarp;

                        vec3 texSample1 = texture2D(uCreepTex, warpedCoords * 0.048).rgb;
                        vec3 texSample2 = texture2D(uCreepTex, warpedCoords * 0.085 + vec2(0.37, 0.61)).rgb;
                        vec3 creepTexCol = mix(texSample1, texSample2, 0.52);

                        // Static concentric + sinuous viscous goo wave ridges radiating from the Zerg Hive
                        float concentricWave = sin(dHive * 1.35 + sin(ang * 5.0 + dHive * 0.35) * 1.45 + gooWarp.x * 0.85);
                        float crossGooWave = cos(warpedCoords.x * 0.72 - sin(warpedCoords.y * 0.68) * 1.35);
                        float gooCrest = smoothstep(-0.55, 0.85, concentricWave * 0.58 + crossGooWave * 0.42);
                        float gooSpecularHighlight = pow(max(0.0, concentricWave * 0.5 + 0.5), 3.2) * 0.22;

                        float radialDepth = clamp(1.0 - (effDist / max(1.0, uCreepRadius)), 0.0, 1.0);
                        vec3 troughBiomass = vec3(0.18, 0.04, 0.27);
                        vec3 crestBiomass  = vec3(0.42, 0.11, 0.56);
                        vec3 waveBiomass   = mix(troughBiomass, crestBiomass, gooCrest);
                        vec3 baseBiomass   = mix(waveBiomass, troughBiomass * 0.88, radialDepth * 0.25);
                        vec3 organicCreep  = mix(baseBiomass, creepTexCol * vec3(1.18, 0.72, 1.32), 0.56)
                                           + vec3(0.28, 0.08, 0.38) * gooSpecularHighlight;

                        if (uIsBuilding < 0.5) {
                            // 100% solid interior floor coverage (zero holes) + static wave-like goo outer rim
                            float solidInterior = smoothstep(uCreepRadius + 1.5, uCreepRadius - 1.4, effDist);
                            float frontierRim = smoothstep(2.0, 0.0, abs(uCreepRadius - effDist - 0.30));
                            organicCreep += vec3(0.42, 0.12, 0.54) * frontierRim * 0.34;

                            float creepOpacity = clamp(solidInterior, 0.0, 1.0);
                            diffuseColor.rgb = mix(diffuseColor.rgb, organicCreep, creepOpacity);
                            creepWetnessBoost = solidInterior * (0.78 + gooCrest * 0.20);
                        } else if (vCustomWorldPos.y < 3.6) {
                            // Semi-textured wave-goo creep bio-membrane wrapping around the base of terrain structures, rocks & cliffs
                            float structRadial = smoothstep(uCreepRadius + 2.0, uCreepRadius - 1.8, effDist);
                            float heightWrap = smoothstep(3.4, 0.15, max(0.0, vCustomWorldPos.y));
                            float bioWaveWrap = 0.62 + 0.38 * gooCrest;
                            float structCreepAlpha = clamp(structRadial * heightWrap * bioWaveWrap * 0.70, 0.0, 0.74);
                            diffuseColor.rgb = mix(diffuseColor.rgb, organicCreep * 0.92, structCreepAlpha);
                            creepWetnessBoost = structCreepAlpha * 0.78;
                        }
                    }
                }`
            ).replace(
                '#include <roughnessmap_fragment>',
                `#include <roughnessmap_fragment>
                if (uIsRoad > 0.5) {
                    roughnessFactor = mix(0.92, 0.28, creepWetnessBoost * 0.75);
                } else {
                    roughnessFactor = mix(roughnessFactor, 0.34, uWetness * 0.55);
                    if (creepWetnessBoost > 0.01) {
                        roughnessFactor = mix(roughnessFactor, 0.18, creepWetnessBoost * 0.85);
                    }
                }`
            ).replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>
                // Prevent structures from always glowing brightly at night or inside unexplored Fog of War!
                totalEmissiveRadiance *= clamp(0.32 + 0.68 * uSunLightFactor, 0.28, 1.0);
                if (uHasFow > 0.5 && uTitleScreen < 0.5) {
                    vec2 eFowUv = vec2((vCustomWorldPos.x / uMapSize) + 0.5, 0.5 - (vCustomWorldPos.z / uMapSize));
                    if (eFowUv.x >= 0.0 && eFowUv.x <= 1.0 && eFowUv.y >= 0.0 && eFowUv.y <= 1.0) {
                        float eFa = texture2D(uFowMap, eFowUv).a;
                        totalEmissiveRadiance *= (1.0 - smoothstep(0.05, 0.85, eFa) * 0.96);
                    }
                }`
            ).replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                // 6. Texture-Preserving 9-Tap Fog of War Intensity Shader (Darkens terrain, roads, structures & Zerg infestations in FoW!)
                if (uHasFow > 0.5 && uTitleScreen < 0.5) {
                    vec2 fowUv = vec2((vCustomWorldPos.x / uMapSize) + 0.5, 0.5 - (vCustomWorldPos.z / uMapSize));
                    if (fowUv.x >= 0.0 && fowUv.x <= 1.0 && fowUv.y >= 0.0 && fowUv.y <= 1.0) {
                        vec2 tStep = vec2(1.25 / 160.0);
                        float fA = texture2D(uFowMap, fowUv).a * 0.40
                                 + texture2D(uFowMap, fowUv + vec2(tStep.x, 0.0)).a * 0.15
                                 + texture2D(uFowMap, fowUv - vec2(tStep.x, 0.0)).a * 0.15
                                 + texture2D(uFowMap, fowUv + vec2(0.0, tStep.y)).a * 0.15
                                 + texture2D(uFowMap, fowUv - vec2(0.0, tStep.y)).a * 0.15;
                        float fowIntensity = smoothstep(0.03, 0.97, fA);
                        // Preserve underlying terrain/building texture detail via cool moonlight desaturation + organic contrast
                        float texLuma = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
                        vec3 moonlitTex = mix(gl_FragColor.rgb, vec3(texLuma) * vec3(0.48, 0.62, 0.82), 0.74);
                        vec3 exploredBlend = moonlitTex * 0.36;
                        vec3 unexploredBlend = mix(moonlitTex * 0.12, vec3(0.018, 0.030, 0.052), 0.78);
                        vec3 targetFowCol = mix(exploredBlend, unexploredBlend, smoothstep(0.40, 0.88, fowIntensity));
                        // Subtle cyan-blue vision rim glow right at the FoW edge
                        float visionEdge = 4.0 * fowIntensity * (1.0 - fowIntensity);
                        targetFowCol += vec3(0.025, 0.055, 0.10) * visionEdge * (0.4 + 0.6 * texLuma);
                        gl_FragColor.rgb = mix(gl_FragColor.rgb, targetFowCol, clamp(fowIntensity * 0.95, 0.0, 0.95));
                    }
                }`
            );
        };
        material.needsUpdate = true;
    },
    update(timeSec, dt = 0.016) {
        plasmaShaderMat.uniforms.uTime.value = timeSec;
        zergBioShaderMat.uniforms.uTime.value = timeSec;
        waterShaderMat.uniforms.uTime.value = timeSec;
        const isTitle = window.titleScreenActive ? 1.0 : 0.0;
        _sharedTitleFlag.value = isTitle;
        waterShaderMat.uniforms.uTitleScreen.value = isTitle;
        shieldHexShaderMat.uniforms.uTime.value = timeSec;
        flameShaderMat.uniforms.uTime.value = timeSec;
        fowCloudShaderMat.uniforms.uTime.value = timeSec;
        this.terrainUniforms.uTime.value = timeSec;
        this.terrainUniforms.uTitleScreen.value = isTitle;
        if (typeof dirLight !== 'undefined' && dirLight) {
            _sharedSunLightFactor.value = THREE.MathUtils.clamp(dirLight.intensity / 1.15, 0.28, 1.15);
        }

        if (window.WEATHER_SYSTEM) {
            window.WEATHER_SYSTEM.update(dt, timeSec);
        }
    }
};
window.SHADER_ENGINE = SHADER_ENGINE;

window.pushWaterShaderRipple = function(wx, wz, strength = 1.0) {
    if (typeof window.isOnRiverBridge === 'function' && window.isOnRiverBridge(wx, wz, 0.85)) return;
    const t = waterShaderMat.uniforms.uTime.value;
    waterRippleCenters[nextWaterRippleSlot].set(wx, wz);
    waterRippleTimes[nextWaterRippleSlot] = t;
    waterRippleStrengths[nextWaterRippleSlot] = Math.min(1.35, strength * 0.72);
    nextWaterRippleSlot = (nextWaterRippleSlot + 1) % MAX_WATER_RIPPLES;
};

window.updateCustomShaders = function(timeSec, dt = 0.016) {
    SHADER_ENGINE.update(timeSec, dt);
};

// ============================================================================
// 2C. DYNAMIC WEATHER, CANYON DUST STORM & ASH-FALL PARTICLE SYSTEM
//     (CLEAR -> DUST & ASH STORM -> ACID RAIN -> HEAVY FOG -> NIGHTFALL)
//     Dynamically intensifies 3D wind-driven canyon dust motes, swirling sand
//     squalls & falling charred/ember ash flakes when the weather changes!
// ============================================================================
const WEATHER_STATES = [
    {
        id: 'clear',
        name: 'CLEAR SKIES',
        shortLabel: 'CLEAR (FOW 100% · SPD 100%)',
        fowMult: 1.00,
        speedMult: 1.00,
        fogDensity: 0.00038,
        fogColor: 0x1c3044,
        skyColor: 0x98c6ec,
        groundColor: 0x2e422d,
        sunIntensity: 1.18,
        wetness: 0.0,
        acidRain: 0.0,
        dustIntensity: 0.24,
        ashIntensity: 0.20,
        windSpeed: 1.0,
        dotColor: '#00ff66',
        duration: 32.0
    },
    {
        id: 'dust_storm',
        name: 'CANYON DUST & ASH STORM',
        shortLabel: 'DUST & ASH (FOW 72% · SPD 88%)',
        fowMult: 0.72,
        speedMult: 0.88,
        fogDensity: 0.00096,
        fogColor: 0x4a3220,
        skyColor: 0xd49a6a,
        groundColor: 0x452d1c,
        sunIntensity: 0.92,
        wetness: 0.0,
        acidRain: 0.0,
        dustIntensity: 1.00,
        ashIntensity: 1.00,
        windSpeed: 3.15,
        dotColor: '#f59e0b',
        duration: 30.0
    },
    {
        id: 'acid_rain',
        name: 'LIGHT ACID RAIN & ASH',
        shortLabel: 'ACID RAIN (FOW 78% · SPD 82%)',
        fowMult: 0.78,
        speedMult: 0.82,
        fogDensity: 0.00072,
        fogColor: 0x1c3424,
        skyColor: 0x7ab480,
        groundColor: 0x243b28,
        sunIntensity: 0.86,
        wetness: 0.85,
        acidRain: 1.0,
        dustIntensity: 0.42,
        ashIntensity: 0.68,
        windSpeed: 1.85,
        dotColor: '#84cc16',
        duration: 30.0
    },
    {
        id: 'heavy_fog',
        name: 'ASHEN HEAVY FOG',
        shortLabel: 'HEAVY FOG (FOW 58% · SPD 88%)',
        fowMult: 0.58,
        speedMult: 0.88,
        fogDensity: 0.00125,
        fogColor: 0x243648,
        skyColor: 0x627c94,
        groundColor: 0x1d2935,
        sunIntensity: 0.72,
        wetness: 0.35,
        acidRain: 0.0,
        dustIntensity: 0.65,
        ashIntensity: 0.82,
        windSpeed: 1.45,
        dotColor: '#38bdf8',
        duration: 28.0
    },
    {
        id: 'nightfall',
        name: 'EMBER NIGHTFALL OPS',
        shortLabel: 'NIGHTFALL (FOW 68% · SPD 94%)',
        fowMult: 0.68,
        speedMult: 0.94,
        fogDensity: 0.00065,
        fogColor: 0x0b1524,
        skyColor: 0x354f73,
        groundColor: 0x111a26,
        sunIntensity: 0.52,
        wetness: 0.15,
        acidRain: 0.0,
        dustIntensity: 0.48,
        ashIntensity: 0.74,
        windSpeed: 1.55,
        dotColor: '#a855f7',
        duration: 32.0
    }
];

window.WEATHER_STATE = {
    id: 'clear',
    name: 'CLEAR SKIES',
    fowMult: 1.0,
    speedMult: 1.0,
    dustIntensity: 0.24,
    ashIntensity: 0.20
};

function createProceduralDustSpriteTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0.0, 'rgba(255, 238, 205, 0.95)');
    g.addColorStop(0.38, 'rgba(232, 188, 132, 0.68)');
    g.addColorStop(0.75, 'rgba(184, 134, 82, 0.22)');
    g.addColorStop(1.0, 'rgba(140, 95, 50, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function createProceduralAshFlakeTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    // Irregular jagged ash flake core + warm ember halo
    const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 26);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.45, 'rgba(235, 220, 205, 0.85)');
    g.addColorStop(0.78, 'rgba(160, 140, 125, 0.30)');
    g.addColorStop(1.0, 'rgba(90, 80, 75, 0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(32, 8);
    ctx.lineTo(50, 18);
    ctx.lineTo(54, 36);
    ctx.lineTo(42, 54);
    ctx.lineTo(22, 52);
    ctx.lineTo(10, 36);
    ctx.lineTo(16, 16);
    ctx.closePath();
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

const WEATHER_SYSTEM = {
    currentIndex: 0,
    timer: 32.0,
    rainLines: null,
    rainPositions: null,
    rainCount: IS_MOBILE ? 240 : 480,
    fogBanks: [],
    dustPoints: null,
    dustPositions: null,
    dustVelocities: null,
    dustPhases: null,
    dustCount: IS_MOBILE ? 320 : 680,
    ashPoints: null,
    ashPositions: null,
    ashVelocities: null,
    ashPhases: null,
    ashCount: IS_MOBILE ? 240 : 520,
    dustSquallClouds: [],
    currentDustIntensity: 0.24,
    currentAshIntensity: 0.20,
    currentWindSpeed: 1.0,
    transitionBurstTimer: 0.0,
    splashTimer: 0,
    init() {
        // 1. Build 3D Falling Acid Rain Streak Particle System
        const positions = new Float32Array(this.rainCount * 6);
        for (let i = 0; i < this.rainCount; i++) {
            const rx = (Math.random() - 0.5) * 95;
            const ry = Math.random() * 38;
            const rz = (Math.random() - 0.5) * 95;
            const p = i * 6;
            positions[p] = rx;
            positions[p + 1] = ry;
            positions[p + 2] = rz;
            positions[p + 3] = rx - 0.35;
            positions[p + 4] = ry - 1.65;
            positions[p + 5] = rz - 0.2;
        }
        this.rainPositions = positions;
        const rainGeo = new THREE.BufferGeometry();
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainMat = new THREE.LineBasicMaterial({
            color: 0x9ef01a,
            transparent: true,
            opacity: 0.0,
            depthWrite: false
        });
        this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
        this.rainLines.visible = false;
        this.rainLines.frustumCulled = false;
        scene.add(this.rainLines);

        // 2. Build Drifting Low-Altitude Volumetric-Style Heavy Fog Banks
        const fogBankGeo = createSculptedArmorDomeGeo(5.5, 12, 8);
        fogBankGeo.scale(2.4, 0.32, 1.8);
        const fogBankMat = new THREE.MeshBasicMaterial({
            color: 0x6c8ca8,
            transparent: true,
            opacity: 0.0,
            depthWrite: false
        });
        this.fogBankMat = fogBankMat;
        const bankCount = IS_MOBILE ? 10 : 18;
        for (let i = 0; i < bankCount; i++) {
            const m = new THREE.Mesh(fogBankGeo, fogBankMat);
            m.position.set((Math.random() - 0.5) * 110, 1.8 + Math.random() * 2.8, (Math.random() - 0.5) * 110);
            m.rotation.y = Math.random() * Math.PI * 2;
            m.visible = false;
            scene.add(m);
            this.fogBanks.push({
                mesh: m,
                vx: 1.4 + Math.random() * 1.2,
                vz: 0.6 + Math.random() * 0.9,
                baseY: m.position.y,
                phase: Math.random() * 10
            });
        }

        // 3. Build Particle-Based Canyon Dust Storm System (Wind-swept ochre/sandstone particulate motes)
        const dustPos = new Float32Array(this.dustCount * 3);
        const dustCol = new Float32Array(this.dustCount * 3);
        const dustVel = new Float32Array(this.dustCount * 3);
        const dustPhase = new Float32Array(this.dustCount);
        const dustPalette = [
            new THREE.Color(0xd99b56), // Warm canyon ochre
            new THREE.Color(0xc57d3e), // Reddish badlands sandstone
            new THREE.Color(0xe6be8a), // Sunlit desert silt
            new THREE.Color(0x9c673a)  // Deep canyon dust
        ];
        for (let i = 0; i < this.dustCount; i++) {
            const p = i * 3;
            dustPos[p]     = (Math.random() - 0.5) * 120;
            dustPos[p + 1] = 0.4 + Math.random() * 24.0;
            dustPos[p + 2] = (Math.random() - 0.5) * 120;
            dustVel[p]     = 5.5 + Math.random() * 7.5;   // Fast horizontal canyon wind
            dustVel[p + 1] = (Math.random() - 0.48) * 1.4; // Swirling updraft/downdraft
            dustVel[p + 2] = 2.0 + Math.random() * 3.8;
            dustPhase[i]   = Math.random() * Math.PI * 2;

            const c = dustPalette[i % dustPalette.length];
            const shade = 0.82 + Math.random() * 0.28;
            dustCol[p]     = Math.min(1, c.r * shade);
            dustCol[p + 1] = Math.min(1, c.g * shade);
            dustCol[p + 2] = Math.min(1, c.b * shade);
        }
        this.dustPositions = dustPos;
        this.dustVelocities = dustVel;
        this.dustPhases = dustPhase;
        const dustGeo = new THREE.BufferGeometry();
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
        const dustMat = new THREE.PointsMaterial({
            size: IS_MOBILE ? 1.35 : 1.15,
            map: createProceduralDustSpriteTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
            blending: THREE.NormalBlending,
            sizeAttenuation: true
        });
        this.dustPoints = new THREE.Points(dustGeo, dustMat);
        this.dustPoints.frustumCulled = false;
        scene.add(this.dustPoints);

        // 4. Build Particle-Based Volcanic / Battlefield Ash-Fall System (Fluttering charcoal ash flakes & glowing cinders)
        const ashPos = new Float32Array(this.ashCount * 3);
        const ashCol = new Float32Array(this.ashCount * 3);
        const ashVel = new Float32Array(this.ashCount * 3);
        const ashPhase = new Float32Array(this.ashCount);
        for (let i = 0; i < this.ashCount; i++) {
            const p = i * 3;
            ashPos[p]     = (Math.random() - 0.5) * 110;
            ashPos[p + 1] = 0.5 + Math.random() * 32.0;
            ashPos[p + 2] = (Math.random() - 0.5) * 110;
            ashVel[p]     = 1.2 + Math.random() * 2.4;    // Lateral wind drift
            ashVel[p + 1] = -(1.8 + Math.random() * 2.6); // Gentle fluttering ash descent
            ashVel[p + 2] = 0.6 + Math.random() * 1.8;
            ashPhase[i]   = Math.random() * Math.PI * 2;

            // 22% glowing orange/amber volcanic cinders, 78% pale/charred ash flakes
            const isEmber = (i % 9 === 0) || (i % 13 === 0);
            if (isEmber) {
                ashCol[p]     = 1.0;
                ashCol[p + 1] = 0.45 + Math.random() * 0.35;
                ashCol[p + 2] = 0.12;
            } else {
                const gVal = 0.52 + Math.random() * 0.34;
                ashCol[p]     = gVal * 1.04;
                ashCol[p + 1] = gVal * 0.98;
                ashCol[p + 2] = gVal * 0.92;
            }
        }
        this.ashPositions = ashPos;
        this.ashVelocities = ashVel;
        this.ashPhases = ashPhase;
        const ashGeo = new THREE.BufferGeometry();
        ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
        ashGeo.setAttribute('color', new THREE.BufferAttribute(ashCol, 3));
        const ashMat = new THREE.PointsMaterial({
            size: IS_MOBILE ? 0.85 : 0.72,
            map: createProceduralAshFlakeTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
            sizeAttenuation: true
        });
        this.ashPoints = new THREE.Points(ashGeo, ashMat);
        this.ashPoints.frustumCulled = false;
        scene.add(this.ashPoints);

        // 5. Build Rolling Canyon Dust Squall Clouds (Low-altitude billowing sand/dust plumes)
        const squallGeo = createSculptedArmorDomeGeo(4.8, 10, 7);
        squallGeo.scale(2.6, 0.48, 1.65);
        const squallMat = new THREE.MeshBasicMaterial({
            color: 0xc88a4b,
            transparent: true,
            opacity: 0.0,
            depthWrite: false
        });
        this.dustSquallMat = squallMat;
        const squallCount = IS_MOBILE ? 8 : 14;
        for (let i = 0; i < squallCount; i++) {
            const sm = new THREE.Mesh(squallGeo, squallMat);
            sm.position.set((Math.random() - 0.5) * 115, 1.4 + Math.random() * 3.8, (Math.random() - 0.5) * 115);
            sm.rotation.y = Math.random() * Math.PI * 2;
            sm.visible = false;
            scene.add(sm);
            this.dustSquallClouds.push({
                mesh: sm,
                vx: 5.2 + Math.random() * 3.5,
                vz: 2.1 + Math.random() * 1.8,
                baseY: sm.position.y,
                phase: Math.random() * 10
            });
        }

        this.syncHUD();
    },
    setWeather(index) {
        this.currentIndex = ((index % WEATHER_STATES.length) + WEATHER_STATES.length) % WEATHER_STATES.length;
        const w = WEATHER_STATES[this.currentIndex];
        this.timer = w.duration;
        // Trigger a dynamic atmospheric gust surge whenever weather changes!
        this.transitionBurstTimer = 4.5;
        window.WEATHER_STATE.id = w.id;
        window.WEATHER_STATE.name = w.name;
        window.WEATHER_STATE.fowMult = w.fowMult;
        window.WEATHER_STATE.speedMult = w.speedMult;
        window.WEATHER_STATE.dustIntensity = w.dustIntensity;
        window.WEATHER_STATE.ashIntensity = w.ashIntensity;
        this.syncHUD();

        if (typeof updateFogOfWarVision === 'function') {
            updateFogOfWarVision();
        }
        if (typeof spawnCombatFloat === 'function' && controls && controls.target) {
            const col = w.dotColor || '#00ff66';
            spawnCombatFloat(controls.target, `WEATHER: ${w.name}`, col);
        }
    },
    cycleNext() {
        if (window.SFX) window.SFX.playClick();
        this.setWeather(this.currentIndex + 1);
    },
    getSpeedMultiplier() {
        const w = WEATHER_STATES[this.currentIndex];
        return w ? w.speedMult : 1.0;
    },
    syncHUD() {
        const w = WEATHER_STATES[this.currentIndex];
        const lbl = document.getElementById('ui-weather-label');
        const dot = document.getElementById('ui-weather-dot');
        const btn = document.getElementById('btn-weather-cycle');
        if (lbl) lbl.innerText = w.shortLabel;
        if (dot) {
            dot.style.background = w.dotColor;
            dot.style.boxShadow = `0 0 6px ${w.dotColor}`;
        }
        if (btn) {
            btn.style.borderColor = w.dotColor;
        }
    },
    update(dt, timeSec) {
        if (!this.rainLines) this.init();
        if (!window.titleScreenActive && !window.gamePaused) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.setWeather(this.currentIndex + 1);
            }
        }
        if (this.transitionBurstTimer > 0) {
            this.transitionBurstTimer = Math.max(0, this.transitionBurstTimer - dt);
        }

        const w = WEATHER_STATES[this.currentIndex];
        // Weather-change surge factor: temporarily intensifies dust & ash gusts during weather shifts
        const transitionSurge = this.transitionBurstTimer > 0
            ? Math.sin((this.transitionBurstTimer / 4.5) * Math.PI) * 0.38
            : 0.0;

        const targetDust = Math.min(1.25, (w.dustIntensity !== undefined ? w.dustIntensity : 0.25) + transitionSurge);
        const targetAsh  = Math.min(1.25, (w.ashIntensity !== undefined ? w.ashIntensity : 0.22) + transitionSurge * 0.85);
        const targetWind = (w.windSpeed !== undefined ? w.windSpeed : 1.0) + transitionSurge * 1.4;

        this.currentDustIntensity = THREE.MathUtils.lerp(this.currentDustIntensity, targetDust, dt * 1.8);
        this.currentAshIntensity  = THREE.MathUtils.lerp(this.currentAshIntensity, targetAsh, dt * 1.8);
        this.currentWindSpeed     = THREE.MathUtils.lerp(this.currentWindSpeed, targetWind, dt * 1.6);

        // Zoom-compensated fog density: automatically scales down fog density when zooming out so the battlefield always stays bright & visible!
        const camDist = (controls && controls.target) ? camera.position.distanceTo(controls.target) : 42.0;
        const zoomFogScale = Math.min(1.0, 36.0 / Math.max(36.0, camDist * 1.15));
        const targetFogDensity = w.fogDensity * zoomFogScale;
        scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetFogDensity, dt * 3.5);
        scene.fog.color.lerp(new THREE.Color(w.fogColor), dt * 1.8);
        scene.background.lerp(new THREE.Color(w.fogColor), dt * 1.8);
        hemiLight.color.lerp(new THREE.Color(w.skyColor), dt * 1.8);
        hemiLight.groundColor.lerp(new THREE.Color(w.groundColor), dt * 1.8);
        dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, w.sunIntensity, dt * 1.8);

        SHADER_ENGINE.terrainUniforms.uWetness.value = THREE.MathUtils.lerp(SHADER_ENGINE.terrainUniforms.uWetness.value, w.wetness, dt * 2.0);
        SHADER_ENGINE.terrainUniforms.uAcidRain.value = THREE.MathUtils.lerp(SHADER_ENGINE.terrainUniforms.uAcidRain.value, w.acidRain, dt * 2.0);
        waterShaderMat.uniforms.uRainIntensity.value = SHADER_ENGINE.terrainUniforms.uAcidRain.value;

        const cx = (controls && controls.target) ? controls.target.x : 0;
        const cz = (controls && controls.target) ? controls.target.z : 0;

        // 1. Animate 3D Acid Rain Streaks around camera target
        const rainAlpha = SHADER_ENGINE.terrainUniforms.uAcidRain.value * 0.68;
        this.rainLines.material.opacity = rainAlpha;
        this.rainLines.visible = rainAlpha > 0.02;
        if (this.rainLines.visible) {
            const pos = this.rainPositions;
            const fallStep = 36.0 * dt;
            const windStep = 7.5 * dt;
            for (let i = 0; i < this.rainCount; i++) {
                const p = i * 6;
                pos[p] -= windStep;
                pos[p + 1] -= fallStep;
                pos[p + 3] = pos[p] - 0.38;
                pos[p + 4] = pos[p + 1] - 1.75;
                if (pos[p + 1] < -1.0) {
                    pos[p] = cx + (Math.random() - 0.5) * 85;
                    pos[p + 1] = 28 + Math.random() * 14;
                    pos[p + 2] = cz + (Math.random() - 0.5) * 85;
                    pos[p + 3] = pos[p] - 0.38;
                    pos[p + 4] = pos[p + 1] - 1.75;
                    pos[p + 5] = pos[p + 2] - 0.2;
                }
            }
            this.rainLines.geometry.attributes.position.needsUpdate = true;

            this.splashTimer -= dt;
            if (this.splashTimer <= 0) {
                this.splashTimer = 0.22;
                window.pushWaterShaderRipple(
                    cx + (Math.random() - 0.5) * 45,
                    cz + (Math.random() - 0.5) * 45,
                    0.45
                );
            }
        }

        // 2. Animate 3D Canyon Dust Storm Particle System (Turbulent wind gusts around camera target)
        if (this.dustPoints) {
            const dustOpacity = THREE.MathUtils.clamp(this.currentDustIntensity * 0.72, 0.08, 0.85);
            this.dustPoints.material.opacity = dustOpacity;
            this.dustPoints.material.size = (IS_MOBILE ? 1.25 : 1.05) + this.currentDustIntensity * 0.65;
            this.dustPoints.visible = dustOpacity > 0.02;

            const dPos = this.dustPositions;
            const dVel = this.dustVelocities;
            const dPhs = this.dustPhases;
            const gustX = (1.0 + 0.35 * Math.sin(timeSec * 1.4)) * this.currentWindSpeed;
            const gustZ = (1.0 + 0.30 * Math.cos(timeSec * 1.1)) * this.currentWindSpeed;
            const halfSpan = 58.0;

            for (let i = 0; i < this.dustCount; i++) {
                const p = i * 3;
                const ph = dPhs[i];
                const swirlY = Math.sin(timeSec * 2.4 + ph) * 0.85 * this.currentDustIntensity;
                const swirlZ = Math.cos(timeSec * 1.9 + ph) * 1.35 * this.currentDustIntensity;

                dPos[p]     += dVel[p] * gustX * dt;
                dPos[p + 1] += (dVel[p + 1] + swirlY) * dt;
                dPos[p + 2] += (dVel[p + 2] * gustZ + swirlZ) * dt;

                // Wrap seamlessly inside the active camera frustum box so dust density is always rich
                if (dPos[p] - cx > halfSpan)  dPos[p] -= halfSpan * 2.0;
                if (dPos[p] - cx < -halfSpan) dPos[p] += halfSpan * 2.0;
                if (dPos[p + 2] - cz > halfSpan)  dPos[p + 2] -= halfSpan * 2.0;
                if (dPos[p + 2] - cz < -halfSpan) dPos[p + 2] += halfSpan * 2.0;
                if (dPos[p + 1] < 0.35) dPos[p + 1] = 22.0 + Math.random() * 4.0;
                if (dPos[p + 1] > 26.5) dPos[p + 1] = 0.5 + Math.random() * 2.5;
            }
            this.dustPoints.geometry.attributes.position.needsUpdate = true;
        }

        // 3. Animate 3D Falling Volcanic / Battlefield Ash-Fall Particle System
        if (this.ashPoints) {
            const ashOpacity = THREE.MathUtils.clamp(this.currentAshIntensity * 0.78, 0.10, 0.90);
            this.ashPoints.material.opacity = ashOpacity;
            this.ashPoints.material.size = (IS_MOBILE ? 0.78 : 0.64) + this.currentAshIntensity * 0.38;
            this.ashPoints.visible = ashOpacity > 0.02;

            const aPos = this.ashPositions;
            const aVel = this.ashVelocities;
            const aPhs = this.ashPhases;
            const halfSpan = 54.0;
            const windScale = 0.65 + this.currentWindSpeed * 0.55;

            for (let i = 0; i < this.ashCount; i++) {
                const p = i * 3;
                const ph = aPhs[i];
                // Fluttering leaf/ash curl motion as ash flakes descend
                const flutterX = Math.sin(timeSec * 2.8 + ph) * 1.45;
                const flutterZ = Math.cos(timeSec * 2.3 + ph * 1.3) * 1.45;

                aPos[p]     += (aVel[p] * windScale + flutterX) * dt;
                aPos[p + 1] += aVel[p + 1] * (0.75 + this.currentAshIntensity * 0.55) * dt;
                aPos[p + 2] += (aVel[p + 2] * windScale + flutterZ) * dt;

                if (aPos[p + 1] < 0.25) {
                    aPos[p]     = cx + (Math.random() - 0.5) * (halfSpan * 2.0);
                    aPos[p + 1] = 24.0 + Math.random() * 10.0;
                    aPos[p + 2] = cz + (Math.random() - 0.5) * (halfSpan * 2.0);
                } else {
                    if (aPos[p] - cx > halfSpan)  aPos[p] -= halfSpan * 2.0;
                    if (aPos[p] - cx < -halfSpan) aPos[p] += halfSpan * 2.0;
                    if (aPos[p + 2] - cz > halfSpan)  aPos[p + 2] -= halfSpan * 2.0;
                    if (aPos[p + 2] - cz < -halfSpan) aPos[p + 2] += halfSpan * 2.0;
                }
            }
            this.ashPoints.geometry.attributes.position.needsUpdate = true;
        }

        // 4. Animate Rolling Canyon Dust Squall Clouds (Intensifies during Dust Storm & Weather Transitions)
        const targetSquallOpacity = w.id === 'dust_storm'
            ? 0.22
            : (this.transitionBurstTimer > 0 ? 0.10 : 0.0);
        if (this.dustSquallMat) {
            this.dustSquallMat.opacity = THREE.MathUtils.lerp(this.dustSquallMat.opacity, targetSquallOpacity, dt * 2.0);
            const showSqualls = this.dustSquallMat.opacity > 0.012;
            for (let i = 0; i < this.dustSquallClouds.length; i++) {
                const sq = this.dustSquallClouds[i];
                sq.mesh.visible = showSqualls;
                if (showSqualls) {
                    sq.mesh.position.x += sq.vx * this.currentWindSpeed * 0.45 * dt;
                    sq.mesh.position.z += sq.vz * this.currentWindSpeed * 0.45 * dt;
                    sq.mesh.position.y = sq.baseY + Math.sin(timeSec * 1.5 + sq.phase) * 0.55;
                    if (sq.mesh.position.x > 75) sq.mesh.position.x = -75;
                    if (sq.mesh.position.z > 75) sq.mesh.position.z = -75;
                }
            }
        }

        // 5. Animate Low-Altitude Heavy Fog Banks
        const isFoggy = w.id === 'heavy_fog';
        const targetFogOpacity = isFoggy ? 0.24 : 0.0;
        this.fogBankMat.opacity = THREE.MathUtils.lerp(this.fogBankMat.opacity, targetFogOpacity, dt * 2.0);
        const showFogMeshes = this.fogBankMat.opacity > 0.015;
        for (let i = 0; i < this.fogBanks.length; i++) {
            const b = this.fogBanks[i];
            b.mesh.visible = showFogMeshes;
            if (showFogMeshes) {
                b.mesh.position.x += b.vx * dt;
                b.mesh.position.z += b.vz * dt;
                b.mesh.position.y = b.baseY + Math.sin(timeSec * 0.8 + b.phase) * 0.35;
                if (b.mesh.position.x > 65) b.mesh.position.x = -65;
                if (b.mesh.position.z > 65) b.mesh.position.z = -65;
            }
        }
    }
};
window.WEATHER_SYSTEM = WEATHER_SYSTEM;

// ============================================================================
// SCULPTED 3D GEOMETRY GENERATORS (Extrude, Lathe, CatmullRom Splines & Ribbed Bio-Mesh)
// Globally shared across textures-scene.js, terrain-fow.js, and models-fx.js
// ============================================================================
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
        curveSegments: 3
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
window.createExtrudedArmorHullGeo = createExtrudedArmorHullGeo;

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
    const geo = new THREE.LatheGeometry(pts, Math.max(6, Math.min(12, segs)));
    geo.computeVertexNormals();
    return geo;
}
window.createSculptedLatheBarrelGeo = createSculptedLatheBarrelGeo;

function createSculptedArmorDomeGeo(radius = 0.25, widthSegments = 12, heightSegments = 8, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
    const wSegs = Math.max(6, Math.min(14, widthSegments));
    const hSegs = Math.max(5, Math.min(10, heightSegments));
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let iy = 0; iy <= hSegs; iy++) {
        const v = iy / hSegs;
        const theta = thetaStart + v * thetaLength;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
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
window.createSculptedArmorDomeGeo = createSculptedArmorDomeGeo;

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
    const geo = new THREE.LatheGeometry(pts, Math.max(5, Math.min(10, radialSegments)));
    geo.computeVertexNormals();
    return geo;
}
window.createSculptedOgiveSpireGeo = createSculptedOgiveSpireGeo;

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
window.createSculptedFacetedCrystalGeo = createSculptedFacetedCrystalGeo;

function createSculptedTorusCollarGeo(radius = 0.4, tube = 0.05, radialSegments = 8, tubularSegments = 16, arc = Math.PI * 2) {
    const rSegs = Math.max(6, Math.min(8, radialSegments));
    const tSegs = Math.max(8, Math.min(18, tubularSegments));
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let j = 0; j <= rSegs; j++) {
        const v = (j / rSegs) * Math.PI * 2;
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
window.createSculptedTorusCollarGeo = createSculptedTorusCollarGeo;

function createCurvedScytheBladeGeo(length = 0.65, baseRadius = 0.08, curveBend = 0.22) {
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, curveBend * 0.35, length * 0.36),
        new THREE.Vector3(0, curveBend, length * 0.74),
        new THREE.Vector3(0, curveBend * 0.45, length)
    ]);
    const tubularSegments = 9;
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
window.createCurvedScytheBladeGeo = createCurvedScytheBladeGeo;

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
            const lateralFlange = Math.exp(-Math.pow(Math.abs(y) - 0.15, 2) * 14.0) * 0.055;
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
window.createOrganicBioCarapaceGeo = createOrganicBioCarapaceGeo;

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
window.createBatWingMembraneGeo = createBatWingMembraneGeo;

// ============================================================================
// GROUNDED STARCRAFT II PBR MATERIAL LIBRARY (Shadow, Night & FoW Reactive!)
// ============================================================================
const MAT = {
    gunmetal: new THREE.MeshStandardMaterial({ color: 0x9eb2c6, map: metalTex, roughnessMap: metalRoughnessTex, roughness: 0.48, metalness: 0.32 }),
    titanium: new THREE.MeshStandardMaterial({ color: 0xc8d8e8, map: metalTex, roughnessMap: metalRoughnessTex, roughness: 0.42, metalness: 0.34 }),
    charredSteel: new THREE.MeshStandardMaterial({ color: 0x2c2826, roughness: 0.84, metalness: 0.22 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x4b5c6e, map: metalTex, roughness: 0.54, metalness: 0.30 }),
    oliveArmor: new THREE.MeshStandardMaterial({ color: 0x68845c, map: metalTex, roughnessMap: metalRoughnessTex, roughness: 0.52, metalness: 0.24 }),
    sandArmor: new THREE.MeshStandardMaterial({ color: 0xc4ac86, map: metalTex, roughness: 0.56, metalness: 0.20 }),
    medicArmor: new THREE.MeshStandardMaterial({ color: 0xe6eef6, map: metalTex, roughness: 0.42, metalness: 0.22 }),
    medicCross: new THREE.MeshStandardMaterial({ color: 0xd6202e, roughness: 0.42, metalness: 0.24, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    hazard: new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.55, metalness: 0.22, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xd68232, roughness: 0.42, metalness: 0.40 }),
    crimsonTank: new THREE.MeshStandardMaterial({ color: 0xa42225, roughness: 0.46, metalness: 0.28 }),
    amberGlow: new THREE.MeshStandardMaterial({ color: 0xd99216, emissive: 0x8a4800, emissiveIntensity: 0.32, roughness: 0.36, metalness: 0.28 }),
    cyanGlow: new THREE.MeshStandardMaterial({ color: 0x28b8d8, emissive: 0x005577, emissiveIntensity: 0.32, roughness: 0.34, metalness: 0.30 }),
    healGlow: new THREE.MeshStandardMaterial({ color: 0x28c874, emissive: 0x006628, emissiveIntensity: 0.30, roughness: 0.36, metalness: 0.26 }),
    plasmaShader: plasmaShaderMat,
    zergBioShader: zergBioShaderMat,
    waterShader: waterShaderMat,
    flameShader: flameShaderMat,
    nanoWeldBeam: new THREE.MeshBasicMaterial({ color: 0x38e8ff, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }),
    medicBioBeam: new THREE.MeshBasicMaterial({ color: 0x34f598, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }),
    acidGlow: new THREE.MeshStandardMaterial({ color: 0x7ec812, emissive: 0x285400, emissiveIntensity: 0.30, roughness: 0.36, metalness: 0.14 }),
    volatileGlow: new THREE.MeshStandardMaterial({ color: 0xe0520c, emissive: 0x7a1c00, emissiveIntensity: 0.34, roughness: 0.36, metalness: 0.18 }),
    hiveVeinGlow: new THREE.MeshStandardMaterial({ color: 0x9c28b4, emissive: 0x420856, emissiveIntensity: 0.28, roughness: 0.38, metalness: 0.18 }),
    zergFlesh: new THREE.MeshStandardMaterial({ color: 0x581634, roughness: 0.42, metalness: 0.12 }),
    chitinDark: new THREE.MeshStandardMaterial({ color: 0x26182c, roughness: 0.44, metalness: 0.24 }),
    chitinRed: new THREE.MeshStandardMaterial({ color: 0x761a30, roughness: 0.42, metalness: 0.20 }),
    chitinGreen: new THREE.MeshStandardMaterial({ color: 0x385818, roughness: 0.44, metalness: 0.16 }),
    chitinArmor: new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.42, metalness: 0.28 }),
    goreMeat: new THREE.MeshStandardMaterial({ color: 0x6e0b0b, roughness: 0.30, metalness: 0.12 }),
    crimsonBlood: new THREE.MeshStandardMaterial({ color: 0x9e0814, roughness: 0.22, metalness: 0.14 }),
    xenoIchorGreen: new THREE.MeshStandardMaterial({ color: 0x68e004, emissive: 0x225500, emissiveIntensity: 0.28, roughness: 0.28, metalness: 0.14 }),
    xenoIchorViolet: new THREE.MeshStandardMaterial({ color: 0xa820ba, emissive: 0x3d084a, emissiveIntensity: 0.28, roughness: 0.28, metalness: 0.18 }),
    scaffoldWire: new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.55 }),
    humanHoloMat: new THREE.MeshBasicMaterial({ map: humanEmblemTex, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false }),
    enemyHoloMat: new THREE.MeshBasicMaterial({ map: enemyEmblemTex, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false }),
    terranBlue: new THREE.MeshStandardMaterial({ color: 0x346de0, map: metalTex, roughnessMap: metalRoughnessTex, roughness: 0.44, metalness: 0.28, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    terranCobalt: new THREE.MeshStandardMaterial({ color: 0x208ecc, map: metalTex, roughness: 0.42, metalness: 0.28, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    terranTrim: new THREE.MeshStandardMaterial({ color: 0x20bcd6, roughness: 0.36, metalness: 0.38, emissive: 0x00283d, emissiveIntensity: 0.22 }),
    terranPlating: new THREE.MeshStandardMaterial({ color: 0x7288a0, map: metalTex, roughnessMap: metalRoughnessTex, roughness: 0.46, metalness: 0.30 }),
    zergTeamPurple: new THREE.MeshStandardMaterial({ color: 0x641468, roughness: 0.40, metalness: 0.22, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    zergTeamCrimson: new THREE.MeshStandardMaterial({ color: 0x8a0e30, roughness: 0.40, metalness: 0.20, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    zergTeamGreen: new THREE.MeshStandardMaterial({ color: 0x426a0c, roughness: 0.42, metalness: 0.18, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    medicDecalCross: new THREE.MeshStandardMaterial({ color: 0xd61840, roughness: 0.38, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
};

// Apply Fog of War, Night/Sun Shading & Cloud Shadow Shader to ALL Standard Building/Structure & Accent Materials
[
    'gunmetal', 'titanium', 'charredSteel', 'darkSteel', 'oliveArmor', 'sandArmor', 'medicArmor', 'medicCross',
    'hazard', 'copper', 'crimsonTank', 'amberGlow', 'cyanGlow', 'healGlow',
    'acidGlow', 'volatileGlow', 'hiveVeinGlow', 'zergFlesh', 'chitinDark', 'chitinRed', 'chitinGreen', 'chitinArmor',
    'goreMeat', 'crimsonBlood', 'xenoIchorGreen', 'xenoIchorViolet',
    'terranBlue', 'terranCobalt', 'terranTrim', 'terranPlating',
    'zergTeamPurple', 'zergTeamCrimson', 'zergTeamGreen', 'medicDecalCross'
].forEach(matKey => {
    if (MAT[matKey] && SHADER_ENGINE && typeof SHADER_ENGINE.applyBuildingShader === 'function') {
        SHADER_ENGINE.applyBuildingShader(MAT[matKey]);
    }
});

// Sculpted Bomb Impact Crater Rim Geometry (Lathe-turned raised blast lip + sunken pit)
const craterRimLathePts = [
    new THREE.Vector2(0.0, -0.06),
    new THREE.Vector2(0.52, -0.05),
    new THREE.Vector2(0.78, 0.22),
    new THREE.Vector2(0.95, 0.26),
    new THREE.Vector2(1.22, 0.08),
    new THREE.Vector2(1.42, 0.0)
];
const craterRimGeo = new THREE.LatheGeometry(craterRimLathePts, 20);
craterRimGeo.computeVertexNormals();

// DYNAMICALLY GENERATED IRREGULAR LIQUID SPLASH GORE GEOMETRY (Zero Circles — Multi-Lobed Splatter Tendrils!)
function createDynamicLiquidSplashGeo(baseRadius = 0.68, lobeCount = 9, spikeAmp = 0.48, stretchZ = 1.0, seedOffset = 0) {
    const pts = [];
    const totalSteps = lobeCount * 4;
    const phaseA = seedOffset * 1.7 + Math.random() * 6.28;
    const phaseB = seedOffset * 3.1 + Math.random() * 6.28;
    const phaseC = seedOffset * 5.3 + Math.random() * 6.28;

    for (let i = 0; i < totalSteps; i++) {
        const t = (i / totalSteps) * Math.PI * 2;
        const w1 = Math.sin(t * lobeCount + phaseA);
        const w2 = Math.cos(t * (lobeCount * 2 - 1) - phaseB);
        const w3 = Math.sin(t * 3 + phaseC);
        const tendril = Math.pow(Math.max(0, w1 * 0.65 + w2 * 0.35), 1.6) * spikeAmp * 1.35;
        const neckPinch = (w1 < -0.35) ? -0.24 * spikeAmp : 0;
        const asymm = 1.0 + 0.22 * w3;
        const r = Math.max(baseRadius * 0.26, baseRadius * asymm * (0.68 + tendril + neckPinch));
        const px = Math.cos(t) * r;
        const py = Math.sin(t) * r * stretchZ;
        pts.push(new THREE.Vector2(px, py));
    }

    const shape = new THREE.Shape();
    const firstMidX = (pts[pts.length - 1].x + pts[0].x) * 0.5;
    const firstMidY = (pts[pts.length - 1].y + pts[0].y) * 0.5;
    shape.moveTo(firstMidX, firstMidY);
    for (let i = 0; i < pts.length; i++) {
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        const midX = (curr.x + next.x) * 0.5;
        const midY = (curr.y + next.y) * 0.5;
        shape.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape, 6);
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
}

// Sculpted 120mm Tank APFSDS-HEAT Armor-Piercing Fin-Stabilized Shell Geometry
const tankShellLathePts = [
    new THREE.Vector2(0.0, -0.45),
    new THREE.Vector2(0.075, -0.42),
    new THREE.Vector2(0.095, -0.18),
    new THREE.Vector2(0.115, 0.05),
    new THREE.Vector2(0.085, 0.28),
    new THREE.Vector2(0.032, 0.52),
    new THREE.Vector2(0.0, 0.68)
];
const tankSabotShellGeo = new THREE.LatheGeometry(tankShellLathePts, 14);
tankSabotShellGeo.rotateX(Math.PI / 2);
tankSabotShellGeo.computeVertexNormals();

// Pre-build diverse pools of irregular dynamically generated liquid splash geometries
const LIQUID_SPLASH_POOL_BIG = [];
const LIQUID_SPLASH_POOL_SMALL = [];
const LIQUID_SPLASH_POOL_DROP = [];
for (let s = 0; s < 8; s++) {
    LIQUID_SPLASH_POOL_BIG.push(createDynamicLiquidSplashGeo(1.18, 9 + (s % 4), 0.56, 1.0 + (s % 3) * 0.22, s + 1));
    LIQUID_SPLASH_POOL_SMALL.push(createDynamicLiquidSplashGeo(0.72, 7 + (s % 4), 0.52, 1.0 + (s % 3) * 0.25, s + 11));
    LIQUID_SPLASH_POOL_DROP.push(createDynamicLiquidSplashGeo(0.36, 5 + (s % 4), 0.48, 1.15 + (s % 3) * 0.35, s + 23));
}

function getDynamicSplashGeo(sizeCategory = 'small') {
    if (sizeCategory === 'big') {
        return LIQUID_SPLASH_POOL_BIG[Math.floor(Math.random() * LIQUID_SPLASH_POOL_BIG.length)];
    }
    if (sizeCategory === 'drop') {
        return LIQUID_SPLASH_POOL_DROP[Math.floor(Math.random() * LIQUID_SPLASH_POOL_DROP.length)];
    }
    return LIQUID_SPLASH_POOL_SMALL[Math.floor(Math.random() * LIQUID_SPLASH_POOL_SMALL.length)];
}

// ============================================================================
// SIMULATED TURBULENT VOLUMETRIC COMBUSTION & EXPLOSIVE FLUID SHADER
// Replaces primitive 3D spheres/rings with FBM curl-noise raymarched-style
// soft-particle plumes that evolve along a Blackbody Temperature Curve:
// 6000K White-Hot Core -> 2400K Roaring Orange Fireball -> 400K Billowing Soot!
// ============================================================================
function createSimulatedExplosionPlumeMaterial(initialTemp = 1.0, seed = 0.0, hueMode = 0.0) {
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
        uniforms: {
            uAge: { value: 0.0 },
            uLife: { value: 1.0 },
            uTemp: { value: initialTemp },
            uSeed: { value: seed },
            uHueMode: { value: hueMode } // 0.0 = Thermal Fire/Soot, 1.0 = Corrosive Zerg Acid/Spore, 2.0 = Protoss Plasma/Void
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vObjPos;
            varying vec3 vViewNormal;
            varying vec3 vViewDir;
            void main() {
                vUv = uv;
                vObjPos = position;
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                vViewNormal = normalize(normalMatrix * normal);
                vViewDir = normalize(-mvPos.xyz);
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: `
            uniform float uAge;
            uniform float uLife;
            uniform float uTemp;
            uniform float uSeed;
            uniform float uHueMode;
            varying vec2 vUv;
            varying vec3 vObjPos;
            varying vec3 vViewNormal;
            varying vec3 vViewDir;

            float hash2(vec2 p) {
                p = fract(p * vec2(127.1, 311.7) + uSeed * 17.3);
                p += dot(p, p + 34.5);
                return fract(p.x * p.y);
            }

            float noise2(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x),
                    mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x),
                    f.y
                );
            }

            float fbmTurbulence(vec2 p) {
                float v = 0.0;
                float a = 0.52;
                mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
                for (int i = 0; i < 4; i++) {
                    v += a * noise2(p);
                    p = rot * p * 2.12 + vec2(1.7, 2.9);
                    a *= 0.48;
                }
                return v;
            }

            void main() {
                float ndv = clamp(dot(normalize(vViewNormal), normalize(vViewDir)), 0.0, 1.0);
                float r = 1.0 - ndv;
                float progress = clamp(uAge / max(0.05, uLife), 0.0, 1.0);

                vec2 flowUv = (vObjPos.xz + vec2(vObjPos.y * 0.75, -vObjPos.y * 0.65)) * (3.8 + progress * 1.4) + vec2(uSeed * 5.1, -uAge * 2.4);
                float n1 = fbmTurbulence(flowUv);
                float n2 = fbmTurbulence(flowUv * 1.85 - vec2(uAge * 1.8, -uAge * 2.2));
                float turb = n1 * 0.62 + n2 * 0.38;

                // Soft volumetric Fresnel edge erosion so 3D cloud puffs have zero hard edges or square borders
                float radialMask = smoothstep(0.08, 0.68, ndv + (turb - 0.46) * 0.45);
                if (radialMask <= 0.01) discard;

                float coreDensity = clamp(radialMask * (0.68 + turb * 0.65), 0.0, 1.0);
                float sunLit = clamp(0.55 + 0.45 * vViewNormal.y + (turb - 0.5) * 0.35, 0.18, 1.0);
                float heat = clamp(uTemp * (1.0 - progress * 0.85) * (0.55 + turb * 0.85) * (0.65 + ndv * 0.55), 0.0, 1.5);

                vec3 col;
                if (uHueMode > 1.5) {
                    vec3 sootVoid = vec3(0.05, 0.12, 0.24) * sunLit;
                    vec3 arcBlue = vec3(0.08, 0.68, 1.0);
                    vec3 whiteCore = vec3(0.92, 0.99, 1.0) * 1.8;
                    col = mix(sootVoid, arcBlue, smoothstep(0.12, 0.58, heat));
                    col = mix(col, whiteCore, smoothstep(0.58, 1.15, heat));
                } else if (uHueMode > 0.5) {
                    vec3 sporeSmoke = vec3(0.12, 0.20, 0.08) * sunLit;
                    vec3 acidLime = vec3(0.52, 0.94, 0.08);
                    vec3 bileCore = vec3(0.92, 1.0, 0.55) * 1.5;
                    col = mix(sporeSmoke, acidLime, smoothstep(0.12, 0.58, heat));
                    col = mix(col, bileCore, smoothstep(0.58, 1.15, heat));
                } else {
                    vec3 darkSoot = mix(vec3(0.08, 0.075, 0.07), vec3(0.28, 0.26, 0.24), sunLit);
                    vec3 emberRed = vec3(0.82, 0.16, 0.02);
                    vec3 roaringOrange = vec3(1.0, 0.54, 0.08) * 1.35;
                    vec3 whiteHot = vec3(1.0, 0.97, 0.86) * 2.1;

                    col = mix(darkSoot, emberRed, smoothstep(0.10, 0.36, heat));
                    col = mix(col, roaringOrange, smoothstep(0.36, 0.72, heat));
                    col = mix(col, whiteHot, smoothstep(0.72, 1.18, heat));
                }

                float fadeOut = pow(1.0 - progress, 0.72);
                float alpha = clamp(coreDensity * fadeOut * (0.86 - progress * 0.22), 0.0, 0.92);
                gl_FragColor = vec4(col, alpha);
            }
        `
    });
}
window.createSimulatedExplosionPlumeMaterial = createSimulatedExplosionPlumeMaterial;

// Simulated Soft Pressure Blast-Wave Shader (Replaces hard geometric RingGeometry shockwaves!)
function createSimulatedBlastWaveMaterial(colorHex = 0xff9f1c) {
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uColor: { value: new THREE.Color(colorHex) },
            uOpacity: { value: 0.9 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
                vec2 p = (vUv - 0.5) * 2.0;
                float r = length(p);
                if (r > 1.0) discard;
                float ang = atan(p.y, p.x);
                float turb = sin(ang * 12.0 + r * 8.0) * 0.035 + cos(ang * 7.0 - r * 6.0) * 0.025;
                float dist = r + turb;
                // Soft Mach condensation wave profile (gradual inner compression + feathered outer front)
                float waveProfile = exp(-pow((dist - 0.76) * 6.2, 2.0)) * 0.85 + exp(-dist * dist * 3.2) * 0.25;
                float edgeFade = smoothstep(1.0, 0.82, r);
                float alpha = clamp(waveProfile * edgeFade * uOpacity, 0.0, 0.95);
                vec3 col = mix(uColor, vec3(1.0, 0.97, 0.90), waveProfile * 0.45);
                gl_FragColor = vec4(col, alpha);
            }
        `
    });
}
window.createSimulatedBlastWaveMaterial = createSimulatedBlastWaveMaterial;

// 3D Sculpted Volumetric Plume & Fireball Geometries (Zero flat PlaneGeometry squares!)
const _softPlumeVolGeo = createOrganicBioCarapaceGeo(0.34, 0.30, 0.34, 5, 0.065);
const _softFireballVolGeo = createSculptedOgiveSpireGeo(0.18, 0.44, 8);
_softFireballVolGeo.rotateX(Math.PI / 2);
const _softGroundWaveGeo = createSculptedTorusCollarGeo(0.48, 0.038, 8, 22);
_softGroundWaveGeo.rotateX(-Math.PI / 2);
const _sparkStreakGeo = createSculptedOgiveSpireGeo(0.032, 0.42, 6);
_sparkStreakGeo.rotateX(Math.PI / 2);

// PRE-ALLOCATED SHARED FX GEOMETRIES & MATERIALS (Prevents WebGL Memory Leak & Crashing!)
const SHARED_FX_GEO = {
    casing: createSculptedLatheBarrelGeo(0.02, 0.02, 0.08, 6),
    goreChunk: createOrganicBioCarapaceGeo(0.085, 0.065, 0.11, 4, 0.02),
    bloodDrop: createSculptedOgiveSpireGeo(0.055, 0.18, 6),
    xenoSac: createOrganicBioCarapaceGeo(0.11, 0.09, 0.13, 5, 0.025),
    spark: _sparkStreakGeo,
    shrapnel: createExtrudedArmorHullGeo(0.14, 0.045, 0.18, 0.01, 0.03),
    smoke: _softPlumeVolGeo,
    fireBall: _softFireballVolGeo,
    shockRing: _softGroundWaveGeo,
    waterRippleRing: new THREE.RingGeometry(0.32, 0.44, 32),
    healRing: _softGroundWaveGeo,
    medicRing: _softGroundWaveGeo,
    repairHex: _softGroundWaveGeo,
    medicPulse: _softGroundWaveGeo,
    weldSpark: _sparkStreakGeo,
    splatSmall: LIQUID_SPLASH_POOL_SMALL[0],
    splatBig: LIQUID_SPLASH_POOL_BIG[0],
    splatDrop: LIQUID_SPLASH_POOL_DROP[0],
    craterRim: craterRimGeo,
    craterCenter: createDynamicLiquidSplashGeo(0.76, 10, 0.28, 1.0, 99),
    bulletProj: createSculptedLatheBarrelGeo(0.018, 0.028, 0.82, 6),
    mortarProj: createSculptedOgiveSpireGeo(0.11, 0.52, 10),
    tankSabotShell: tankSabotShellGeo,
    tankFin: createExtrudedArmorHullGeo(0.34, 0.025, 0.22, 0.004, 0.02),
    acidProj: createOrganicBioCarapaceGeo(0.13, 0.12, 0.22, 5, 0.03),
    waterDropProj: createSculptedOgiveSpireGeo(0.055, 0.24, 7)
};
SHARED_FX_GEO.waterRippleRing.rotateX(-Math.PI / 2);
SHARED_FX_GEO.bulletProj.rotateX(Math.PI / 2);
SHARED_FX_GEO.mortarProj.rotateX(Math.PI / 2);
SHARED_FX_GEO.waterDropProj.rotateX(Math.PI / 2);

const SHARED_FX_MAT = {
    smokeDark: createSimulatedExplosionPlumeMaterial(0.18, 1.1, 0.0),
    smokeGrey: createSimulatedExplosionPlumeMaterial(0.28, 2.3, 0.0),
    smokeFire: createSimulatedExplosionPlumeMaterial(0.95, 3.7, 0.0),
    shockAmber: createSimulatedBlastWaveMaterial(0xff9f1c),
    shockCyan: createSimulatedBlastWaveMaterial(0x00e5ff),
    waterRipple: new THREE.MeshBasicMaterial({ color: 0x80f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.65, depthWrite: false }),
    waterDropMat: new THREE.MeshStandardMaterial({ color: 0xbaf6ff, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.84 }),
    repairGrid: createSimulatedBlastWaveMaterial(0x00e5ff),
    droneWeldBeam: new THREE.MeshBasicMaterial({ color: 0x38e8ff, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }),
    droneScanRing: createSimulatedBlastWaveMaterial(0x00e5ff),
    medicBioBeam: new THREE.MeshBasicMaterial({ color: 0x34f598, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }),
    medicBioRing: createSimulatedBlastWaveMaterial(0x00ff66),
    creepSpore: createSimulatedExplosionPlumeMaterial(0.75, 5.2, 1.0),
    splatBlood: new THREE.MeshStandardMaterial({ color: 0x6e060b, roughness: 0.16, metalness: 0.12, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
    splatCrimsonBlood: new THREE.MeshStandardMaterial({ color: 0x990614, emissive: 0x220004, roughness: 0.14, metalness: 0.15, transparent: true, opacity: 0.94, side: THREE.DoubleSide }),
    splatXenoAcid: new THREE.MeshStandardMaterial({ color: 0x56d804, emissive: 0x1f4d00, emissiveIntensity: 0.45, roughness: 0.18, metalness: 0.15, transparent: true, opacity: 0.90, side: THREE.DoubleSide }),
    splatXenoViolet: new THREE.MeshStandardMaterial({ color: 0x8b14b8, emissive: 0x320547, emissiveIntensity: 0.45, roughness: 0.18, metalness: 0.18, transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
    splatScorch: new THREE.MeshBasicMaterial({ color: 0x16110e, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    craterScorch: new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: 0.92, metalness: 0.08 }),
    projBullet: new THREE.MeshBasicMaterial({ color: 0xfff0a8 }),
    projMortar: new THREE.MeshStandardMaterial({ color: 0xff9f1c, emissive: 0xff5500, emissiveIntensity: 1.5, roughness: 0.2 }),
    projTankCore: new THREE.MeshBasicMaterial({ color: 0xff5500 }),
    projTankTip: new THREE.MeshBasicMaterial({ color: 0xfff7cc }),
    projAcid: new THREE.MeshStandardMaterial({ color: 0x9ef01a, emissive: 0x55a600, emissiveIntensity: 1.35, roughness: 0.18 }),
    projBehemoth: new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0x86198f, emissiveIntensity: 1.35, roughness: 0.2 }),
    projRocket: new THREE.MeshStandardMaterial({ color: 0xff3b5c, emissive: 0xc81e3a, emissiveIntensity: 1.35, roughness: 0.25 }),
    shieldDome: shieldHexShaderMat,
    shieldWire: new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.035, depthWrite: false }),
    shieldDomeWire: new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.035, depthWrite: false }),
    mindBeam: new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }),
    mindControlBeam: new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }),
    mindHalo: createSimulatedBlastWaveMaterial(0xf43f5e),
    mindControlRing: createSimulatedBlastWaveMaterial(0xe879f9)
};



