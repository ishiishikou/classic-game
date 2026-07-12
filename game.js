(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('startOverlay');

  const VIEW_W = 320;
  const VIEW_H = 180;
  const WORLD_W = VIEW_W * 3;
  const GROUND_Y = 149;

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
    x: 56,
    y: GROUND_Y - 28,
    width: 48,
    height: 28,
    vx: 0,
    vy: 0,
    speed: 92,
    jumpPower: 214,
    gravity: 590,
    grounded: true,
    facing: 1,
    frameClock: 0,
    runFrame: 0,
  };

  const P = {
    outline: '#4a241c',
    dark: '#713622',
    cream: '#fff0c7',
    shade: '#e7bc83',
    peach: '#ef8b58',
    peachDark: '#c95d3f',
    eye: '#2d1a18',
    white: '#fff9df',
    green: '#4d6d2c',
    greenLight: '#7f9b39',
    gold: '#e4af3b',
  };

  function rect(g, color, x, y, w, h) {
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function makeRunner(frame) {
    const s = document.createElement('canvas');
    s.width = 48;
    s.height = 32;
    const g = s.getContext('2d');
    g.imageSmoothingEnabled = false;

    // Raised fluffy tail behind the body.
    rect(g, P.outline, 31, 8, 10, 2);
    rect(g, P.outline, 38, 6, 5, 3);
    rect(g, P.outline, 42, 8, 4, 4);
    rect(g, P.outline, 44, 11, 3, 10);
    rect(g, P.outline, 40, 20, 5, 4);
    rect(g, P.outline, 33, 22, 8, 3);
    rect(g, P.peach, 32, 9, 9, 3);
    rect(g, P.peach, 39, 8, 4, 5);
    rect(g, P.peach, 41, 11, 4, 8);
    rect(g, P.cream, 33, 12, 8, 9);
    rect(g, P.shade, 35, 20, 7, 2);
    rect(g, P.peachDark, 42, 12, 3, 5);

    // Long, low running body.
    rect(g, P.outline, 13, 13, 22, 13);
    rect(g, P.outline, 17, 11, 13, 3);
    rect(g, P.cream, 14, 14, 20, 10);
    rect(g, P.shade, 18, 22, 15, 3);
    rect(g, P.white, 21, 14, 10, 3);
    rect(g, P.white, 24, 17, 8, 3);

    // Scarf and trailing leaf ribbon.
    rect(g, P.outline, 16, 11, 17, 4);
    rect(g, P.green, 17, 12, 15, 2);
    rect(g, P.greenLight, 28, 10, 6, 2);
    rect(g, P.green, 31, 12, 6, 2);
    rect(g, P.gold, 16, 15, 2, 2);
    rect(g, P.greenLight, 16, 17, 3, 4);
    rect(g, P.green, 17, 19, 2, 3);

    // Side-view head and muzzle.
    rect(g, P.outline, 4, 9, 14, 14);
    rect(g, P.outline, 6, 6, 11, 4);
    rect(g, P.cream, 5, 10, 12, 11);
    rect(g, P.cream, 7, 7, 9, 6);
    rect(g, P.white, 3, 15, 8, 6);
    rect(g, P.peach, 5, 18, 6, 3);

    // Oversized upright ears.
    rect(g, P.outline, 6, 1, 5, 9);
    rect(g, P.outline, 8, 0, 4, 5);
    rect(g, P.outline, 12, 2, 5, 8);
    rect(g, P.outline, 14, 0, 4, 7);
    rect(g, P.peach, 7, 2, 3, 7);
    rect(g, P.cream, 8, 3, 2, 5);
    rect(g, P.peach, 13, 3, 3, 7);
    rect(g, P.cream, 14, 3, 2, 5);

    // Face and forehead curl.
    rect(g, P.eye, 5, 11, 4, 5);
    rect(g, P.white, 6, 11, 1, 1);
    rect(g, P.dark, 9, 17, 2, 2);
    rect(g, P.eye, 11, 14, 2, 2);
    rect(g, P.peachDark, 4, 17, 2, 2);
    rect(g, P.peach, 13, 18, 3, 2);
    rect(g, P.outline, 10, 5, 4, 2);
    rect(g, P.cream, 10, 6, 3, 2);

    // Two clear running poses.
    if (frame === 0) {
      rect(g, P.outline, 12, 23, 10, 4);
      rect(g, P.cream, 14, 23, 6, 3);
      rect(g, P.peachDark, 10, 26, 10, 2);
      rect(g, P.outline, 27, 23, 9, 4);
      rect(g, P.cream, 28, 23, 7, 3);
      rect(g, P.peachDark, 34, 26, 8, 2);
    } else {
      rect(g, P.outline, 15, 23, 8, 5);
      rect(g, P.cream, 16, 23, 6, 3);
      rect(g, P.peachDark, 18, 27, 8, 2);
      rect(g, P.outline, 27, 23, 7, 5);
      rect(g, P.cream, 28, 23, 5, 3);
      rect(g, P.peachDark, 24, 27, 8, 2);
    }

    return s;
  }

  const runnerFrames = [makeRunner(0), makeRunner(1)];

  function fill(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function cloud(worldX, y, parallax) {
    const x = worldX - state.cameraX * parallax;
    if (x < -45 || x > VIEW_W + 45) return;
    fill(x, y + 5, 34, 8, '#fff1ca');
    fill(x + 7, y, 20, 13, '#fff1ca');
  }

  function hill(worldX, y, width, height, color, parallax) {
    const x = worldX - state.cameraX * parallax;
    fill(x, y, width, height, color);
    fill(x + 10, y - 8, width - 20, 8, color);
    fill(x + 24, y - 15, width - 48, 7, color);
  }

  function tree(worldX, scale, trunk, leaves) {
    const x = worldX - state.cameraX * 0.76;
    if (x < -45 || x > VIEW_W + 45) return;
    fill(x, GROUND_Y - 41 * scale, 6 * scale, 41 * scale, trunk);
    fill(x - 15 * scale, GROUND_Y - 58 * scale, 36 * scale, 17 * scale, leaves);
    fill(x - 9 * scale, GROUND_Y - 68 * scale, 24 * scale, 13 * scale, leaves);
    fill(x - 2 * scale, GROUND_Y - 75 * scale, 12 * scale, 9 * scale, leaves);
  }

  function drawBackground() {
    const progress = state.cameraX / (WORLD_W - VIEW_W);
    const sky = progress < 0.5 ? '#77cedf' : '#e39a79';
    const far = progress < 0.5 ? '#5ca475' : '#887358';
    const near = progress < 0.5 ? '#397657' : '#65505a';

    fill(0, 0, VIEW_W, VIEW_H, sky);

    const sunX = 267 - state.cameraX * 0.08;
    fill(sunX, 18, 26, 25, '#fff0a4');
    fill(sunX - 3, 24, 32, 13, '#fff0a4');

    [42, 188, 380, 612, 820].forEach((x, i) => cloud(x, 23 + (i % 2) * 7, 0.2));
    for (let i = -1; i < 8; i += 1) hill(i * 145, 83 + (i % 2) * 8, 132, 49, far, 0.28);
    for (let i = -1; i < 7; i += 1) hill(i * 172, 108 + (i % 3) * 5, 154, 34, near, 0.5);

    const trees = [
      [55, 1.05, '#70472f', '#2d6d49'], [168, 0.8, '#70472f', '#3f8557'],
      [286, 1.1, '#70472f', '#347a4d'], [390, 0.85, '#7c5234', '#6e9b52'],
      [515, 1.12, '#745039', '#8e8a4b'], [640, 0.85, '#6d4937', '#a37347'],
      [748, 1.08, '#684237', '#925344'], [885, 0.92, '#5d3c34', '#704454'],
    ];
    trees.forEach((t) => tree(...t));

    fill(0, GROUND_Y - 7, VIEW_W, 7, '#c5d866');
    fill(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, '#9b7248');
    fill(0, GROUND_Y + 5, VIEW_W, 4, '#79563a');

    const offset = -Math.floor(state.cameraX) % 24;
    for (let x = offset - 24; x < VIEW_W + 24; x += 24) {
      fill(x, GROUND_Y + 11, 8, 4, '#c79b5c');
      fill(x + 11, GROUND_Y + 24, 7, 4, '#6f4d35');
    }

    [102, 224, 350, 435, 560, 688, 817, 925].forEach((wx, i) => {
      const x = wx - state.cameraX;
      if (x < -8 || x > VIEW_W + 8) return;
      fill(x, GROUND_Y - 14, 2, 14, '#477949');
      fill(x - 2, GROUND_Y - 17, 6, 5, i % 2 ? '#ff9c86' : '#ffe47a');
      fill(x, GROUND_Y - 16, 2, 2, '#fff5b5');
    });

    [320, 640].forEach((wx) => {
      const x = wx - state.cameraX;
      if (x < -14 || x > VIEW_W + 14) return;
      fill(x - 2, GROUND_Y - 31, 4, 31, '#553b2c');
      fill(x - 9, GROUND_Y - 34, 18, 4, '#d4b65a');
    });
  }

  function drawPlayer() {
    const moving = Math.abs(player.vx) > 1 && player.grounded;
    const frame = moving ? player.runFrame : 0;
    const bob = moving && frame === 1 ? 1 : 0;
    const x = Math.round(player.x - state.cameraX);
    const y = Math.round(player.y + bob);

    ctx.save();
    if (player.facing < 0) {
      ctx.translate(x + player.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(runnerFrames[frame], 0, y);
    } else {
      ctx.drawImage(runnerFrames[frame], x, y);
    }
    ctx.restore();
  }

  function drawHUD() {
    fill(8, 8, 74, 15, 'rgba(52,31,23,.82)');
    fill(111, 8, 99, 15, 'rgba(52,31,23,.68)');
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff0bd';
    const progress = Math.round((player.x / (WORLD_W - player.width)) * 100);
    ctx.fillText(`TRAVEL ${String(progress).padStart(3, ' ')}%`, 13, 12);
    const zone = player.x < 320 ? 'MORNING WOODS' : player.x < 640 ? 'SUNLIT MEADOW' : 'TWILIGHT GROVE';
    ctx.fillText(zone, 118, 12);
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
      if (player.frameClock >= 0.11) {
        player.frameClock = 0;
        player.runFrame = (player.runFrame + 1) % 2;
      }
    } else {
      player.frameClock = 0;
      player.runFrame = 0;
    }

    const target = player.x - VIEW_W * 0.38;
    const clamped = Math.max(0, Math.min(WORLD_W - VIEW_W, target));
    state.cameraX += (clamped - state.cameraX) * Math.min(1, dt * 7);
  }

  function render() {
    drawBackground();
    drawPlayer();
    drawHUD();
  }

  function jump() {
    if (!state.started || !player.grounded) return;
    player.vy = -player.jumpPower;
    player.grounded = false;
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
    const delta = now - state.lastTapTime;
    const distance = Math.hypot(point.x - state.lastTapX, point.y - state.lastTapY);

    if (delta > 0 && delta < 300 && distance < 56) {
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

  window.addEventListener('keyup', (event) => state.keys.delete(event.key));
  window.addEventListener('blur', () => {
    state.pointerHeld = false;
    state.keys.clear();
  });

  function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = Math.min(0.032, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;
    if (state.started) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  render();
  requestAnimationFrame(loop);
})();
