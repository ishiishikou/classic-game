(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('startOverlay');

  const VIEW_W = 320;
  const VIEW_H = 180;
  const WORLD_W = VIEW_W * 3;
  const GROUND_Y = 145;

  ctx.imageSmoothingEnabled = false;

  const state = {
    started: false,
    lastTime: 0,
    cameraX: 0,
    pointerHeld: false,
    pointerDirection: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    keys: new Set(),
  };

  const player = {
    x: 80,
    y: GROUND_Y - 30,
    width: 28,
    height: 30,
    vx: 0,
    vy: 0,
    speed: 82,
    jumpPower: 205,
    gravity: 560,
    grounded: true,
    facing: 1,
    frameClock: 0,
    runFrame: 0,
  };

  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 32;
  spriteCanvas.height = 32;
  const sctx = spriteCanvas.getContext('2d');
  sctx.imageSmoothingEnabled = false;

  const C = {
    outline: '#4f2d22',
    dark: '#8b4b32',
    peach: '#e9874c',
    peach2: '#f2ad68',
    cream: '#ffe4ae',
    light: '#fff2ca',
    eye: '#6b331f',
    eyeGlow: '#d7823f',
    green: '#557c31',
    green2: '#88a844',
    gold: '#e8bd4f',
  };

  function px(c, x, y, w = 1, h = 1) {
    sctx.fillStyle = c;
    sctx.fillRect(x, y, w, h);
  }

  function drawForestSpirit(frame, moving, facing) {
    sctx.clearRect(0, 0, 32, 32);

    const bob = moving ? (frame % 2) : 0;
    const legShift = moving ? (frame % 2 === 0 ? -1 : 1) : 0;
    const tailShift = moving ? (frame % 2) : 0;

    sctx.save();
    if (facing < 0) {
      sctx.translate(32, 0);
      sctx.scale(-1, 1);
    }

    px(C.outline, 22, 15 + tailShift, 6, 10);
    px(C.outline, 25, 13 + tailShift, 4, 9);
    px(C.peach, 23, 16 + tailShift, 4, 7);
    px(C.peach2, 26, 14 + tailShift, 2, 6);
    px(C.cream, 23, 20 + tailShift, 3, 4);

    px(C.outline, 7, 2 + bob, 5, 10);
    px(C.outline, 19, 1 + bob, 5, 11);
    px(C.peach, 8, 3 + bob, 3, 8);
    px(C.peach, 20, 2 + bob, 3, 9);
    px(C.cream, 9, 5 + bob, 2, 5);
    px(C.cream, 20, 5 + bob, 2, 5);

    px(C.outline, 7, 9 + bob, 17, 11);
    px(C.outline, 5, 13 + bob, 3, 5);
    px(C.outline, 23, 13 + bob, 3, 5);
    px(C.cream, 8, 10 + bob, 15, 9);
    px(C.cream, 6, 14 + bob, 3, 3);
    px(C.cream, 23, 14 + bob, 2, 3);
    px(C.light, 10, 10 + bob, 10, 3);

    px(C.outline, 14, 7 + bob, 4, 3);
    px(C.cream, 14, 7 + bob, 3, 2);
    px(C.cream, 13, 8 + bob, 2, 2);

    px(C.peach, 7, 15 + bob, 4, 2);
    px(C.peach, 20, 15 + bob, 4, 2);
    px(C.outline, 10, 13 + bob, 4, 5);
    px(C.outline, 18, 13 + bob, 4, 5);
    px(C.eye, 11, 14 + bob, 2, 3);
    px(C.eye, 19, 14 + bob, 2, 3);
    px(C.light, 11, 14 + bob, 1, 1);
    px(C.light, 19, 14 + bob, 1, 1);
    px(C.eyeGlow, 12, 16 + bob, 1, 1);
    px(C.eyeGlow, 20, 16 + bob, 1, 1);
    px(C.dark, 15, 17 + bob, 2, 1);
    px(C.outline, 15, 18 + bob, 2, 1);
    px(C.peach, 15, 19 + bob, 2, 1);

    px(C.outline, 9, 19 + bob, 14, 9);
    px(C.cream, 10, 19 + bob, 12, 8);
    px(C.light, 13, 20 + bob, 6, 5);

    px(C.outline, 9, 19 + bob, 14, 3);
    px(C.green, 10, 19 + bob, 12, 2);
    px(C.green2, 12, 19 + bob, 4, 1);
    px(C.green, 21, 20 + bob, 4, 2);
    px(C.gold, 15, 21 + bob, 3, 2);
    px(C.green2, 15, 23 + bob, 3, 4);
    px(C.gold, 16, 24 + bob, 1, 2);

    px(C.outline, 8, 21 + bob, 4, 5);
    px(C.outline, 21, 21 + bob, 4, 5);
    px(C.cream, 9, 22 + bob, 3, 3);
    px(C.cream, 21, 22 + bob, 3, 3);
    px(C.peach, 9, 24 + bob, 2, 1);
    px(C.peach, 22, 24 + bob, 2, 1);

    px(C.outline, 10 + legShift, 27 + bob, 5, 3);
    px(C.outline, 18 - legShift, 27 + bob, 5, 3);
    px(C.peach, 11 + legShift, 27 + bob, 3, 2);
    px(C.peach, 19 - legShift, 27 + bob, 3, 2);

    sctx.restore();
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function circle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSky(cameraX) {
    const t = cameraX / (WORLD_W - VIEW_W);
    const top = t < 0.5 ? '#72c7db' : '#e49a75';
    const bottom = t < 0.5 ? '#d9f0c0' : '#f4cf88';

    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const glowX = 265 - cameraX * 0.08;
    circle(glowX, 34, 18, t > 0.55 ? '#ffe19b' : '#fff0b6');
  }

  function drawClouds(cameraX) {
    const offsets = [40, 180, 360, 610, 820];
    for (const worldX of offsets) {
      const x = worldX - cameraX * 0.22;
      if (x < -40 || x > VIEW_W + 40) continue;
      circle(x, 28, 9, '#f4f1d0');
      circle(x + 10, 24, 12, '#f4f1d0');
      circle(x + 23, 29, 8, '#f4f1d0');
      rect(x - 5, 29, 34, 8, '#f4f1d0');
    }
  }

  function drawBackHills(cameraX) {
    const colors = ['#4d9a70', '#477e5f', '#8c6b55'];
    for (let screen = 0; screen < 3; screen++) {
      const baseX = screen * VIEW_W - cameraX * 0.45;
      const color = colors[screen];
      for (let i = -1; i < 6; i++) {
        const x = baseX + i * 72;
        circle(x, 110, 52, color);
        circle(x + 34, 102, 44, color);
      }
    }
  }

  function drawTree(x, baseY, scale, trunk, leaves) {
    rect(x - 3 * scale, baseY - 26 * scale, 6 * scale, 26 * scale, trunk);
    circle(x, baseY - 36 * scale, 15 * scale, leaves);
    circle(x - 12 * scale, baseY - 29 * scale, 12 * scale, leaves);
    circle(x + 12 * scale, baseY - 29 * scale, 12 * scale, leaves);
    rect(x - 16 * scale, baseY - 31 * scale, 32 * scale, 11 * scale, leaves);
  }

  function drawMidground(cameraX) {
    const trees = [
      { x: 55, s: 1.2, trunk: '#745033', leaves: '#2f7647' },
      { x: 145, s: .9, trunk: '#745033', leaves: '#3e8a50' },
      { x: 270, s: 1.1, trunk: '#745033', leaves: '#347849' },
      { x: 380, s: 1.0, trunk: '#7f5636', leaves: '#5a9a4d' },
      { x: 510, s: 1.25, trunk: '#7b5435', leaves: '#709448' },
      { x: 625, s: .9, trunk: '#6f4937', leaves: '#98794b' },
      { x: 730, s: 1.2, trunk: '#694335', leaves: '#a76c45' },
      { x: 885, s: 1.0, trunk: '#5d3c34', leaves: '#784b45' },
    ];

    for (const tree of trees) {
      const x = tree.x - cameraX * 0.72;
      if (x < -45 || x > VIEW_W + 45) continue;
      drawTree(x, GROUND_Y + 3, tree.s, tree.trunk, tree.leaves);
    }
  }

  function drawGround(cameraX) {
    rect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, '#6f8f3f');
    rect(0, GROUND_Y, VIEW_W, 5, '#b9d76b');
    rect(0, GROUND_Y + 5, VIEW_W, 4, '#426c38');
    rect(0, GROUND_Y + 9, VIEW_W, VIEW_H - GROUND_Y - 9, '#8a6840');

    const tile = 16;
    const offset = -Math.floor(cameraX) % tile;
    for (let x = offset - tile; x < VIEW_W + tile; x += tile) {
      rect(x, GROUND_Y + 11, 6, 3, '#aa8650');
      rect(x + 8, GROUND_Y + 23, 5, 3, '#6e4c31');
      rect(x + 3, GROUND_Y + 31, 3, 2, '#c39a58');
    }

    const flowers = [80, 210, 348, 430, 565, 690, 785, 920];
    for (const wx of flowers) {
      const x = wx - cameraX;
      if (x < -8 || x > VIEW_W + 8) continue;
      rect(x, GROUND_Y - 8, 2, 8, '#3d7437');
      rect(x - 2, GROUND_Y - 10, 2, 2, wx < 600 ? '#f3d66e' : '#f0a06a');
      rect(x + 2, GROUND_Y - 10, 2, 2, wx < 600 ? '#f3d66e' : '#f0a06a');
      rect(x, GROUND_Y - 12, 2, 2, '#fff1b0');
    }

    const stones = [300, 603, 842];
    for (const wx of stones) {
      const x = wx - cameraX;
      if (x < -20 || x > VIEW_W + 20) continue;
      rect(x, GROUND_Y - 7, 14, 7, '#5e6554');
      rect(x + 3, GROUND_Y - 10, 8, 3, '#81856d');
      rect(x + 2, GROUND_Y - 6, 4, 2, '#a5a88a');
    }
  }

  function drawZoneLabel(cameraX) {
    const zone = Math.min(2, Math.floor((cameraX + VIEW_W * 0.45) / VIEW_W));
    const labels = ['MORNING WOODS', 'SUNLIT MEADOW', 'TWILIGHT GROVE'];
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(30, 42, 32, .65)';
    ctx.fillRect(98, 8, 124, 14);
    ctx.fillStyle = '#fff0bd';
    ctx.fillText(labels[zone], VIEW_W / 2, 18);
  }

  function drawPlayer() {
    const moving = Math.abs(player.vx) > 1 && player.grounded;
    drawForestSpirit(player.runFrame, moving, player.facing);

    const screenX = Math.round(player.x - state.cameraX - 2);
    const screenY = Math.round(player.y - 2);
    ctx.drawImage(spriteCanvas, screenX, screenY, 32, 32);
  }

  function drawHUD() {
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3d2a22';
    ctx.fillRect(8, 8, 68, 14);
    ctx.fillStyle = '#fff0bd';
    const progress = Math.round((player.x / (WORLD_W - player.width)) * 100);
    ctx.fillText(`TRAVEL ${String(progress).padStart(3, ' ')}%`, 13, 18);
  }

  function update(dt) {
    let direction = 0;

    if (state.pointerHeld) direction = state.pointerDirection;
    if (state.keys.has('ArrowLeft') || state.keys.has('a')) direction = -1;
    if (state.keys.has('ArrowRight') || state.keys.has('d')) direction = 1;

    player.vx = direction * player.speed;
    if (direction !== 0) player.facing = direction;

    player.vy += player.gravity * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = Math.max(0, Math.min(WORLD_W - player.width, player.x));

    const floorY = GROUND_Y - player.height;
    if (player.y >= floorY) {
      player.y = floorY;
      player.vy = 0;
      player.grounded = true;
    } else {
      player.grounded = false;
    }

    if (Math.abs(player.vx) > 1 && player.grounded) {
      player.frameClock += dt;
      if (player.frameClock >= 0.12) {
        player.frameClock = 0;
        player.runFrame = (player.runFrame + 1) % 2;
      }
    } else {
      player.frameClock = 0;
      player.runFrame = 0;
    }

    const targetCamera = player.x - VIEW_W * 0.42;
    const clampedTarget = Math.max(0, Math.min(WORLD_W - VIEW_W, targetCamera));
    state.cameraX += (clampedTarget - state.cameraX) * Math.min(1, dt * 7);
  }

  function render() {
    drawSky(state.cameraX);
    drawClouds(state.cameraX);
    drawBackHills(state.cameraX);
    drawMidground(state.cameraX);
    drawGround(state.cameraX);
    drawPlayer();
    drawHUD();
    drawZoneLabel(state.cameraX);
  }

  function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = Math.min(0.032, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;

    if (state.started) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function jump() {
    if (!state.started) return;
    if (player.grounded) {
      player.vy = -player.jumpPower;
      player.grounded = false;
    }
  }

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * VIEW_W,
      y: ((event.clientY - bounds.top) / bounds.height) * VIEW_H,
    };
  }

  function startGame() {
    if (state.started) return;
    state.started = true;
    overlay.classList.add('hidden');
  }

  function onPointerDown(event) {
    event.preventDefault();
    startGame();
    canvas.setPointerCapture?.(event.pointerId);

    const point = canvasPoint(event);
    const now = performance.now();
    const timeDelta = now - state.lastTapTime;
    const distance = Math.hypot(point.x - state.lastTapX, point.y - state.lastTapY);

    if (timeDelta > 0 && timeDelta < 300 && distance < 56) {
      jump();
      state.lastTapTime = 0;
    } else {
      state.lastTapTime = now;
      state.lastTapX = point.x;
      state.lastTapY = point.y;
    }

    state.pointerHeld = true;
    state.pointerDirection = point.x < VIEW_W / 2 ? -1 : 1;
  }

  function onPointerMove(event) {
    if (!state.pointerHeld) return;
    event.preventDefault();
    const point = canvasPoint(event);
    state.pointerDirection = point.x < VIEW_W / 2 ? -1 : 1;
  }

  function onPointerUp(event) {
    event.preventDefault();
    state.pointerHeld = false;
    state.pointerDirection = 0;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  overlay.addEventListener('pointerdown', onPointerDown);

  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp', 'a', 'd'].includes(event.key)) {
      event.preventDefault();
      startGame();
    }
    if (event.key === ' ' || event.key === 'ArrowUp') jump();
    state.keys.add(event.key);
  });

  window.addEventListener('keyup', (event) => {
    state.keys.delete(event.key);
  });

  window.addEventListener('blur', () => {
    state.pointerHeld = false;
    state.keys.clear();
  });

  render();
  requestAnimationFrame(loop);
})();
