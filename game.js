(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('startOverlay');
  const overlayMessage = overlay.querySelector('.panel span');

  const VIEW_W = 320;
  const VIEW_H = 180;
  const WORLD_W = VIEW_W * 3;
  const GROUND_Y = 149;

  const SPRITE_PATH = './assets/sprites/forest-runner-96.png';
  const SPRITE_FRAME_W = 96;
  const SPRITE_FRAME_H = 96;
  const SPRITE_COLUMNS = 4;
  const SPRITE_BASELINE = 87;
  const FRAMES = {
    idle: 0,
    run: [1, 2, 3, 4],
    jumpUp: 5,
    jumpApex: 6,
    jumpDown: 7,
  };

  ctx.imageSmoothingEnabled = false;

  const state = {
    started: false,
    spriteReady: false,
    spriteFailed: false,
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
    width: 34,
    height: 28,
    drawWidth: 96,
    drawHeight: 96,
    vx: 0,
    vy: 0,
    speed: 92,
    jumpPower: 214,
    gravity: 590,
    grounded: true,
    landingClock: 0,
    facing: 1,
    frameClock: 0,
    runFrame: 0,
  };

  const spriteSheet = new Image();
  spriteSheet.decoding = 'async';
  overlayMessage.textContent = '素材を読み込み中…';

  spriteSheet.addEventListener('load', () => {
    state.spriteReady = true;
    overlayMessage.textContent = 'タップしてスタート';
    render();
  });

  spriteSheet.addEventListener('error', () => {
    state.spriteFailed = true;
    overlayMessage.textContent = 'キャラクター画像を読み込めませんでした';
    render();
  });

  spriteSheet.src = SPRITE_PATH;

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

  function currentPlayerFrame() {
    if (!player.grounded) {
      if (player.vy < -45) return FRAMES.jumpUp;
      if (player.vy <= 45) return FRAMES.jumpApex;
      return FRAMES.jumpDown;
    }

    if (player.landingClock > 0) return FRAMES.jumpDown;
    if (Math.abs(player.vx) > 1) return FRAMES.run[player.runFrame];
    return FRAMES.idle;
  }

  function drawPlayer() {
    if (!state.spriteReady) return;

    const frame = currentPlayerFrame();
    const sx = (frame % SPRITE_COLUMNS) * SPRITE_FRAME_W;
    const sy = Math.floor(frame / SPRITE_COLUMNS) * SPRITE_FRAME_H;
    const x = Math.round(player.x - state.cameraX + (player.width - player.drawWidth) / 2);
    const y = Math.round(player.y + player.height - SPRITE_BASELINE);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (player.facing < 0) {
      ctx.translate(x + player.drawWidth, y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        spriteSheet,
        sx, sy, SPRITE_FRAME_W, SPRITE_FRAME_H,
        0, 0, player.drawWidth, player.drawHeight,
      );
    } else {
      ctx.drawImage(
        spriteSheet,
        sx, sy, SPRITE_FRAME_W, SPRITE_FRAME_H,
        x, y, player.drawWidth, player.drawHeight,
      );
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

    const wasGrounded = player.grounded;
    player.vy += player.gravity * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = Math.max(0, Math.min(WORLD_W - player.width, player.x));

    const floorY = GROUND_Y - player.height;
    if (player.y >= floorY) {
      player.y = floorY;
      player.vy = 0;
      player.grounded = true;
      if (!wasGrounded) player.landingClock = 0.08;
    } else {
      player.grounded = false;
    }

    player.landingClock = Math.max(0, player.landingClock - dt);

    if (Math.abs(player.vx) > 1 && player.grounded && player.landingClock === 0) {
      player.frameClock += dt;
      if (player.frameClock >= 0.1) {
        player.frameClock %= 0.1;
        player.runFrame = (player.runFrame + 1) % FRAMES.run.length;
      }
    } else {
      player.frameClock = 0;
      if (Math.abs(player.vx) <= 1) player.runFrame = 0;
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
    player.landingClock = 0;
  }

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * VIEW_W,
      y: ((event.clientY - bounds.top) / bounds.height) * VIEW_H,
    };
  }

  function startGame() {
    if (state.started || !state.spriteReady || state.spriteFailed) return;
    state.started = true;
    overlay.classList.add('hidden');
  }

  function onPointerDown(event) {
    event.preventDefault();
    startGame();
    if (!state.started) return;

    if (event.currentTarget === canvas) {
      try {
        canvas.setPointerCapture?.(event.pointerId);
      } catch {
        // Pointer capture is optional and can fail on older mobile Safari versions.
      }
    }

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
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
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
    state.pointerDirection = 0;
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
