const gameBoard = document.getElementById('gameBoard');
const mario = document.getElementById('mario');
const pipe = document.getElementById('pipe');

const jumpCounterEl = document.getElementById('jumpCounter');
const coinCounterEl = document.getElementById('coinCounter');
const koCounterEl = document.getElementById('koCounter');
const ammoCounterEl = document.getElementById('ammoCounter');
const bestCounterEl = document.getElementById('bestCounter');

const startHint = document.getElementById('startHint');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const finalCoinsEl = document.getElementById('finalCoins');
const finalKoEl = document.getElementById('finalKo');
const resultMessageEl = document.getElementById('resultMessage');
const restartButton = document.getElementById('restartButton');
const jumpButton = document.getElementById('jumpButton');
const fireButton = document.getElementById('fireButton');

const MARIO_RUNNING_SRC = '/images/mario.gif';
const MARIO_GAME_OVER_SRC = '/images/game-over.png';
const BEST_SCORE_KEY = 'marioJumpBest';
const JUMP_DURATION = 560;
const MAX_AMMO = 9;

let isJumping = false;
let isRunning = false;
let isGameOver = false;
let jumpCounter = 0;
let coinCounter = 0;
let koCounter = 0;
let ammo = 0;
let bestScore = 0;
let animationFrameId = null;
let lastFrameTime = performance.now();
let nextEnemyAt = 0;
let nextCoinAt = 0;
let nextFireAt = 0;

const enemies = [];
const collectibles = [];
const projectiles = [];

try {
    bestScore = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10) || 0;
} catch {
    bestScore = 0;
}

const formatScore = (value) => String(Math.max(0, value)).padStart(2, '0');
const randomBetween = (min, max) => Math.random() * (max - min) + min;

const updateHud = () => {
    jumpCounterEl.textContent = formatScore(jumpCounter);
    coinCounterEl.textContent = formatScore(coinCounter);
    koCounterEl.textContent = formatScore(koCounter);
    ammoCounterEl.textContent = formatScore(ammo);
    bestCounterEl.textContent = formatScore(bestScore);
    fireButton.disabled = ammo <= 0 || isGameOver;
};

const overlaps = (a, b, inset = 0) => (
    a.right - inset > b.left + inset &&
    a.left + inset < b.right - inset &&
    a.bottom - inset > b.top + inset &&
    a.top + inset < b.bottom - inset
);

const startGame = () => {
    if (isRunning || isGameOver) return;

    const now = performance.now();
    isRunning = true;
    gameBoard.classList.add('is-running');
    startHint.classList.add('is-hidden');
    nextEnemyAt = now + 3300;
    nextCoinAt = now + 1700;
    nextFireAt = now + 6500;
};

const showPop = (text, sourceRect, className = '') => {
    const boardRect = gameBoard.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = `pickup-pop ${className}`.trim();
    pop.textContent = text;
    pop.style.left = `${sourceRect.left - boardRect.left + sourceRect.width / 2}px`;
    pop.style.bottom = `${boardRect.bottom - sourceRect.top + 8}px`;
    gameBoard.appendChild(pop);
    window.setTimeout(() => pop.remove(), 620);
};

const jump = (event) => {
    if (isGameOver) return;
    if (event?.target?.closest?.('button')) return;
    if (isJumping) return;

    startGame();
    isJumping = true;
    jumpCounter += 1;
    updateHud();

    mario.classList.remove('jump');
    void mario.offsetWidth;
    mario.classList.add('jump');

    window.setTimeout(() => {
        mario.classList.remove('jump');
        isJumping = false;
    }, JUMP_DURATION);
};

const createTurtleElement = () => {
    const el = document.createElement('div');
    el.className = 'game-entity turtle';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
        <span class="turtle__shell"></span>
        <span class="turtle__head"></span>
        <span class="turtle__foot turtle__foot--left"></span>
        <span class="turtle__foot turtle__foot--right"></span>
    `;
    return el;
};

const spawnEnemy = (now) => {
    const el = createTurtleElement();
    gameBoard.appendChild(el);

    enemies.push({
        el,
        x: gameBoard.clientWidth + 35,
        speed: randomBetween(145, 195) + Math.min(55, jumpCounter * 1.2),
        hit: false,
    });

    nextEnemyAt = now + randomBetween(4800, 6800);
};

const spawnCoin = (now) => {
    const el = document.createElement('div');
    el.className = 'game-entity coin';
    el.setAttribute('aria-hidden', 'true');
    el.style.bottom = `calc(var(--ground-height) + ${Math.round(randomBetween(65, 145))}px)`;
    gameBoard.appendChild(el);

    collectibles.push({
        el,
        type: 'coin',
        x: gameBoard.clientWidth + 30,
        speed: randomBetween(155, 195),
    });

    nextCoinAt = now + randomBetween(2400, 3800);
};

const spawnFirePickup = (now) => {
    const el = document.createElement('div');
    el.className = 'game-entity fire-pickup';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="fire-pickup__flower"></span><span class="fire-pickup__stem"></span>';
    gameBoard.appendChild(el);

    collectibles.push({
        el,
        type: 'fire',
        x: gameBoard.clientWidth + 40,
        speed: 165,
    });

    nextFireAt = now + randomBetween(9500, 13500);
};

const removeFromArray = (list, index) => {
    const [item] = list.splice(index, 1);
    item?.el?.remove();
};

const defeatEnemy = (enemy, byFire = false) => {
    if (enemy.hit) return;
    enemy.hit = true;
    koCounter += 1;
    coinCounter += byFire ? 2 : 1;
    updateHud();

    const rect = enemy.el.getBoundingClientRect();
    showPop(byFire ? '+2 🪙  BOOM!' : '+1 🪙  PISÃO!', rect);
    enemy.el.classList.add('is-hit');

    window.setTimeout(() => enemy.el.remove(), 300);
};

const fire = (event) => {
    if (event) event.preventDefault();
    if (isGameOver || ammo <= 0) return;

    startGame();
    ammo -= 1;
    updateHud();

    const boardRect = gameBoard.getBoundingClientRect();
    const marioRect = mario.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'game-entity fireball';
    el.setAttribute('aria-hidden', 'true');
    el.style.bottom = `${boardRect.bottom - marioRect.bottom + marioRect.height * 0.43}px`;
    gameBoard.appendChild(el);

    projectiles.push({
        el,
        x: marioRect.right - boardRect.left - 12,
        speed: 620,
    });
};

const updateEntityPosition = (entity) => {
    entity.el.style.left = '0px';
    entity.el.style.transform = `translate3d(${entity.x}px, 0, 0)`;
};

const updateEnemies = (dt) => {
    const marioRect = mario.getBoundingClientRect();

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const enemy = enemies[i];

        if (enemy.hit) {
            enemies.splice(i, 1);
            continue;
        }

        enemy.x -= enemy.speed * dt;
        updateEntityPosition(enemy);

        if (enemy.x < -110) {
            removeFromArray(enemies, i);
            continue;
        }

        const enemyRect = enemy.el.getBoundingClientRect();
        if (!overlaps(marioRect, enemyRect, 8)) continue;

        const stomped = isJumping && marioRect.bottom <= enemyRect.top + enemyRect.height * 0.48;
        if (stomped) {
            defeatEnemy(enemy, false);
            enemies.splice(i, 1);
            continue;
        }

        finishGame('turtle');
        return;
    }
};

const updateCollectibles = (dt) => {
    const marioRect = mario.getBoundingClientRect();

    for (let i = collectibles.length - 1; i >= 0; i -= 1) {
        const item = collectibles[i];
        item.x -= item.speed * dt;
        updateEntityPosition(item);

        if (item.x < -80) {
            removeFromArray(collectibles, i);
            continue;
        }

        const rect = item.el.getBoundingClientRect();
        if (!overlaps(marioRect, rect, 5)) continue;

        if (item.type === 'coin') {
            coinCounter += 1;
            showPop('+1 🪙', rect);
        } else {
            const before = ammo;
            ammo = Math.min(MAX_AMMO, ammo + 3);
            showPop(`+${ammo - before} 🔥`, rect);
        }

        updateHud();
        removeFromArray(collectibles, i);
    }
};

const updateProjectiles = (dt) => {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
        const shot = projectiles[i];
        shot.x += shot.speed * dt;
        updateEntityPosition(shot);

        if (shot.x > gameBoard.clientWidth + 60) {
            removeFromArray(projectiles, i);
            continue;
        }

        const shotRect = shot.el.getBoundingClientRect();
        let hitSomething = false;

        for (let j = enemies.length - 1; j >= 0; j -= 1) {
            const enemy = enemies[j];
            if (enemy.hit) continue;

            const enemyRect = enemy.el.getBoundingClientRect();
            if (!overlaps(shotRect, enemyRect, 2)) continue;

            defeatEnemy(enemy, true);
            enemies.splice(j, 1);
            hitSomething = true;
            break;
        }

        if (hitSomething) {
            removeFromArray(projectiles, i);
        }
    }
};

const isPipeCollision = () => {
    const marioRect = mario.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();

    const marioHitbox = {
        left: marioRect.left + marioRect.width * 0.24,
        right: marioRect.right - marioRect.width * 0.18,
        top: marioRect.top + marioRect.height * 0.12,
        bottom: marioRect.bottom - 6,
    };

    const pipeHitbox = {
        left: pipeRect.left + 5,
        right: pipeRect.right - 5,
        top: pipeRect.top + 5,
        bottom: pipeRect.bottom,
    };

    return (
        marioHitbox.right > pipeHitbox.left &&
        marioHitbox.left < pipeHitbox.right &&
        marioHitbox.bottom > pipeHitbox.top &&
        marioHitbox.top < pipeHitbox.bottom
    );
};

const getResultMessage = (isNewRecord, cause) => {
    if (isNewRecord && jumpCounter > 0) return 'Novo recorde! E ainda teve tartaruga voando.';
    if (koCounter >= 5) return `Você derrubou ${koCounter} tartarugas. Tá virando guerra.`;
    if (cause === 'turtle') return 'A tartaruga levou essa. Na próxima, manda fogo nela.';
    if (coinCounter >= 8) return `Boa coleta: ${coinCounter} moedas nessa rodada.`;
    if (jumpCounter >= 10) return 'Boa sequência. Mais uma e passa.';
    return 'Quase! Pega a flor de fogo e devolve o desaforo.';
};

const finishGame = (cause = 'pipe') => {
    if (isGameOver) return;

    isGameOver = true;
    isRunning = false;
    gameBoard.classList.add('is-game-over');

    const pipeLeft = pipe.offsetLeft;
    const marioBottom = Number.parseFloat(window.getComputedStyle(mario).bottom) || 0;

    pipe.style.animation = 'none';
    pipe.style.left = `${pipeLeft}px`;
    pipe.style.right = 'auto';

    mario.style.animation = 'none';
    mario.style.bottom = `${marioBottom}px`;
    mario.src = MARIO_GAME_OVER_SRC;
    mario.classList.add('is-dead');

    const isNewRecord = jumpCounter > bestScore;
    if (isNewRecord) {
        bestScore = jumpCounter;
        try {
            localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
        } catch {
            // O jogo continua normalmente mesmo se o navegador bloquear o storage.
        }
    }

    updateHud();
    finalScoreEl.textContent = formatScore(jumpCounter);
    finalBestEl.textContent = formatScore(bestScore);
    finalCoinsEl.textContent = formatScore(coinCounter);
    finalKoEl.textContent = formatScore(koCounter);
    resultMessageEl.textContent = getResultMessage(isNewRecord, cause);

    window.setTimeout(() => {
        gameOverEl.hidden = false;
        restartButton.focus({ preventScroll: true });
    }, 240);
};

const spawnEntities = (now) => {
    if (now >= nextEnemyAt) spawnEnemy(now);
    if (now >= nextCoinAt) spawnCoin(now);
    if (now >= nextFireAt) spawnFirePickup(now);
};

const gameLoop = (now) => {
    const dt = Math.min((now - lastFrameTime) / 1000, 0.04);
    lastFrameTime = now;

    if (!isGameOver && isRunning) {
        spawnEntities(now);
        updateCollectibles(dt);
        updateProjectiles(dt);
        updateEnemies(dt);

        if (!isGameOver && isPipeCollision()) {
            finishGame('pipe');
        }
    }

    if (!isGameOver) {
        animationFrameId = window.requestAnimationFrame(gameLoop);
    }
};

const clearEntities = () => {
    [...enemies, ...collectibles, ...projectiles].forEach((item) => item.el?.remove());
    enemies.length = 0;
    collectibles.length = 0;
    projectiles.length = 0;
    gameBoard.querySelectorAll('.pickup-pop').forEach((el) => el.remove());
};

const restartGame = () => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);

    clearEntities();
    isJumping = false;
    isRunning = false;
    isGameOver = false;
    jumpCounter = 0;
    coinCounter = 0;
    koCounter = 0;
    ammo = 0;
    nextEnemyAt = 0;
    nextCoinAt = 0;
    nextFireAt = 0;

    gameOverEl.hidden = true;
    gameBoard.classList.remove('is-running', 'is-game-over');
    startHint.classList.remove('is-hidden');

    pipe.removeAttribute('style');
    mario.removeAttribute('style');
    mario.classList.remove('jump', 'is-dead');
    mario.src = MARIO_RUNNING_SRC;

    updateHud();
    lastFrameTime = performance.now();
    animationFrameId = window.requestAnimationFrame(gameLoop);
};

const handleBoardPointer = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    jump(event);
};

const handleKeydown = (event) => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
        event.preventDefault();
        jump();
        return;
    }

    if (['KeyF', 'Enter'].includes(event.code)) {
        fire(event);
        return;
    }

    if (isGameOver && event.code === 'KeyR') {
        event.preventDefault();
        restartGame();
    }
};

document.addEventListener('keydown', handleKeydown);
gameBoard.addEventListener('pointerdown', handleBoardPointer);

jumpButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    jump();
});

fireButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    fire();
});

restartButton.addEventListener('click', (event) => {
    event.stopPropagation();
    restartGame();
});

updateHud();
animationFrameId = window.requestAnimationFrame(gameLoop);
