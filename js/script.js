const gameBoard = document.getElementById('gameBoard');
const hero = document.getElementById('hero');
const pipe = document.getElementById('pipe');

const jumpCounterEl = document.getElementById('jumpCounter');
const coinCounterEl = document.getElementById('coinCounter');
const koCounterEl = document.getElementById('koCounter');
const ammoCounterEl = document.getElementById('ammoCounter');
const bestCounterEl = document.getElementById('bestCounter');

const heroNameEl = document.getElementById('heroName');
const heroAbilityEl = document.getElementById('heroAbility');
const characterSelect = document.getElementById('characterSelect');
const characterButtons = [...document.querySelectorAll('.character-card')];
const changeCharacterButton = document.getElementById('changeCharacterButton');
const changeCharacterGameOver = document.getElementById('changeCharacterGameOver');

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

const BEST_SCORE_KEY = 'goldenAxeRunBest';
const MAX_AMMO = 9;

const CHARACTERS = {
    kain: {
        name: 'Kain Grinder',
        className: 'hero--kain',
        ability: 'Equilibrado · +1 carga de magia por item',
        maxJumps: 1,
        jumpVelocity: 690,
        gravity: 1780,
        projectileSpeed: 650,
        magicPickup: 4,
        stompReward: 1,
        hitboxInset: 8,
        shield: 0,
    },
    sarah: {
        name: 'Sarah Barn',
        className: 'hero--sarah',
        ability: 'Acrobatica · salto duplo',
        maxJumps: 2,
        jumpVelocity: 735,
        gravity: 1810,
        projectileSpeed: 690,
        magicPickup: 3,
        stompReward: 1,
        hitboxInset: 12,
        shield: 0,
    },
    proud: {
        name: 'Proud Cragger',
        className: 'hero--proud',
        ability: 'Forca bruta · 1 escudo contra inimigo',
        maxJumps: 1,
        jumpVelocity: 630,
        gravity: 1710,
        projectileSpeed: 560,
        magicPickup: 3,
        stompReward: 2,
        hitboxInset: 5,
        shield: 1,
    },
    chronos: {
        name: 'Chronos “Evil” Lait',
        className: 'hero--chronos',
        ability: 'Pantera veloz · salto duplo e magia rapida',
        maxJumps: 2,
        jumpVelocity: 755,
        gravity: 1880,
        projectileSpeed: 820,
        magicPickup: 3,
        stompReward: 1,
        hitboxInset: 11,
        shield: 0,
    },
};

let selectedCharacterKey = null;
let selectedCharacter = null;
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
let heroY = 0;
let heroVelocity = 0;
let jumpsUsed = 0;
let shieldCharges = 0;
let invulnerableUntil = 0;

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

const updateHeroStatus = () => {
    if (!selectedCharacter) {
        heroNameEl.textContent = 'Guerreiro';
        heroAbilityEl.textContent = 'Escolha um personagem';
        return;
    }

    heroNameEl.textContent = selectedCharacter.name;
    const shieldText = selectedCharacter.shield ? ` · Escudo ${shieldCharges}/${selectedCharacter.shield}` : '';
    heroAbilityEl.textContent = `${selectedCharacter.ability}${shieldText}`;
};

const updateHud = () => {
    jumpCounterEl.textContent = formatScore(jumpCounter);
    coinCounterEl.textContent = formatScore(coinCounter);
    koCounterEl.textContent = formatScore(koCounter);
    ammoCounterEl.textContent = formatScore(ammo);
    bestCounterEl.textContent = formatScore(bestScore);
    fireButton.disabled = !selectedCharacter || ammo <= 0 || isGameOver;
    jumpButton.disabled = !selectedCharacter || isGameOver;
    updateHeroStatus();
};

const overlaps = (a, b, inset = 0) => (
    a.right - inset > b.left + inset &&
    a.left + inset < b.right - inset &&
    a.bottom - inset > b.top + inset &&
    a.top + inset < b.bottom - inset
);

const startGame = () => {
    if (!selectedCharacter || isRunning || isGameOver) return;

    const now = performance.now();
    isRunning = true;
    gameBoard.classList.add('is-running');
    startHint.classList.add('is-hidden');
    nextEnemyAt = now + 3200;
    nextCoinAt = now + 1500;
    nextFireAt = now + 5400;
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

const applyCharacterVisual = () => {
    hero.classList.remove('hero--kain', 'hero--sarah', 'hero--proud', 'hero--chronos', 'is-dead', 'is-shielded');
    if (!selectedCharacter) return;
    hero.classList.add(selectedCharacter.className);
    hero.setAttribute('aria-label', selectedCharacter.name);
};

const selectCharacter = (key) => {
    const profile = CHARACTERS[key];
    if (!profile) return;

    selectedCharacterKey = key;
    selectedCharacter = profile;
    shieldCharges = profile.shield;
    invulnerableUntil = 0;
    heroY = 0;
    heroVelocity = 0;
    jumpsUsed = 0;

    applyCharacterVisual();
    hero.style.transform = 'translate3d(0, 0, 0)';
    characterSelect.hidden = true;
    gameBoard.classList.add('has-character');
    startHint.classList.remove('is-hidden');
    updateHud();
};

const jump = (event) => {
    if (!selectedCharacter || isGameOver) return;
    if (event?.target?.closest?.('button')) return;
    if (jumpsUsed >= selectedCharacter.maxJumps) return;

    startGame();
    jumpsUsed += 1;
    heroVelocity = selectedCharacter.jumpVelocity;
    jumpCounter += 1;
    updateHud();
};

const updateHeroPhysics = (dt) => {
    if (!selectedCharacter) return;

    if (heroY > 0 || heroVelocity > 0) {
        heroY += heroVelocity * dt;
        heroVelocity -= selectedCharacter.gravity * dt;

        if (heroY <= 0) {
            heroY = 0;
            heroVelocity = 0;
            jumpsUsed = 0;
        }
    }

    hero.style.transform = `translate3d(0, ${-heroY}px, 0)`;
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
        speed: randomBetween(145, 190) + Math.min(62, jumpCounter * 1.15),
        hit: false,
    });

    nextEnemyAt = now + randomBetween(4200, 6200);
};

const spawnCoin = (now) => {
    const el = document.createElement('div');
    el.className = 'game-entity coin';
    el.setAttribute('aria-hidden', 'true');
    el.style.bottom = `calc(var(--ground-height) + ${Math.round(randomBetween(60, 160))}px)`;
    gameBoard.appendChild(el);

    collectibles.push({
        el,
        type: 'coin',
        x: gameBoard.clientWidth + 30,
        speed: randomBetween(155, 195),
    });

    nextCoinAt = now + randomBetween(2200, 3500);
};

const spawnMagicPickup = (now) => {
    const el = document.createElement('div');
    el.className = 'game-entity fire-pickup';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="fire-pickup__flower"></span><span class="fire-pickup__stem"></span>';
    gameBoard.appendChild(el);

    collectibles.push({
        el,
        type: 'magic',
        x: gameBoard.clientWidth + 40,
        speed: 165,
    });

    nextFireAt = now + randomBetween(8200, 11600);
};

const removeFromArray = (list, index) => {
    const [item] = list.splice(index, 1);
    item?.el?.remove();
};

const defeatEnemy = (enemy, source = 'stomp') => {
    if (enemy.hit) return;
    enemy.hit = true;
    koCounter += 1;

    let reward = 1;
    let label = '+1 🪙  PISÃO!';

    if (source === 'magic') {
        reward = 2;
        label = '+2 🪙  MAGIA!';
    } else if (source === 'shield') {
        reward = 1;
        label = '🛡 BLOQUEOU!';
    } else if (selectedCharacter) {
        reward = selectedCharacter.stompReward;
        label = `+${reward} 🪙  PISÃO!`;
    }

    coinCounter += reward;
    updateHud();

    const rect = enemy.el.getBoundingClientRect();
    showPop(label, rect);
    enemy.el.classList.add('is-hit');
    window.setTimeout(() => enemy.el.remove(), 300);
};

const fire = (event) => {
    if (event) event.preventDefault();
    if (!selectedCharacter || isGameOver || ammo <= 0) return;

    startGame();
    ammo -= 1;
    updateHud();

    const boardRect = gameBoard.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `game-entity fireball fireball--${selectedCharacterKey}`;
    el.setAttribute('aria-hidden', 'true');
    el.style.bottom = `${boardRect.bottom - heroRect.bottom + heroRect.height * 0.43}px`;
    gameBoard.appendChild(el);

    projectiles.push({
        el,
        x: heroRect.right - boardRect.left - 10,
        speed: selectedCharacter.projectileSpeed,
    });
};

const updateEntityPosition = (entity) => {
    entity.el.style.left = '0px';
    entity.el.style.transform = `translate3d(${entity.x}px, 0, 0)`;
};

const absorbEnemyWithShield = (enemy) => {
    if (!selectedCharacter?.shield || shieldCharges <= 0) return false;

    shieldCharges -= 1;
    invulnerableUntil = performance.now() + 950;
    hero.classList.add('is-shielded');
    window.setTimeout(() => hero.classList.remove('is-shielded'), 650);
    defeatEnemy(enemy, 'shield');
    updateHud();
    return true;
};

const updateEnemies = (dt, now) => {
    const heroRect = hero.getBoundingClientRect();

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
        if (!overlaps(heroRect, enemyRect, selectedCharacter.hitboxInset)) continue;
        if (now < invulnerableUntil) continue;

        const falling = heroVelocity < 0;
        const stomped = falling && heroRect.bottom <= enemyRect.top + enemyRect.height * 0.55;

        if (stomped) {
            defeatEnemy(enemy, 'stomp');
            enemies.splice(i, 1);
            heroVelocity = Math.max(430, selectedCharacter.jumpVelocity * 0.62);
            jumpsUsed = Math.min(jumpsUsed, selectedCharacter.maxJumps - 1);
            continue;
        }

        if (absorbEnemyWithShield(enemy)) {
            enemies.splice(i, 1);
            continue;
        }

        finishGame('turtle');
        return;
    }
};

const updateCollectibles = (dt) => {
    const heroRect = hero.getBoundingClientRect();

    for (let i = collectibles.length - 1; i >= 0; i -= 1) {
        const item = collectibles[i];
        item.x -= item.speed * dt;
        updateEntityPosition(item);

        if (item.x < -80) {
            removeFromArray(collectibles, i);
            continue;
        }

        const rect = item.el.getBoundingClientRect();
        if (!overlaps(heroRect, rect, 5)) continue;

        if (item.type === 'coin') {
            coinCounter += 1;
            showPop('+1 🪙', rect);
        } else {
            const before = ammo;
            ammo = Math.min(MAX_AMMO, ammo + selectedCharacter.magicPickup);
            showPop(`+${ammo - before} ✨`, rect);
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

            defeatEnemy(enemy, 'magic');
            enemies.splice(j, 1);
            hitSomething = true;
            break;
        }

        if (hitSomething) removeFromArray(projectiles, i);
    }
};

const isPipeCollision = () => {
    if (!selectedCharacter) return false;

    const heroRect = hero.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();
    const inset = Math.max(4, selectedCharacter.hitboxInset);

    const heroHitbox = {
        left: heroRect.left + inset,
        right: heroRect.right - inset,
        top: heroRect.top + inset,
        bottom: heroRect.bottom - 4,
    };

    const pipeHitbox = {
        left: pipeRect.left + 5,
        right: pipeRect.right - 5,
        top: pipeRect.top + 5,
        bottom: pipeRect.bottom,
    };

    return overlaps(heroHitbox, pipeHitbox, 0);
};

const getResultMessage = (isNewRecord, cause) => {
    const name = selectedCharacter?.name || 'Seu guerreiro';
    if (isNewRecord && jumpCounter > 0) return `${name} bateu um novo recorde.`;
    if (koCounter >= 6) return `${name} derrubou ${koCounter} inimigos. A coisa ficou séria.`;
    if (cause === 'turtle') return 'A tartaruga levou essa. Usa magia ou acerta o pisão.';
    if (coinCounter >= 10) return `Boa coleta: ${coinCounter} moedas nessa rodada.`;
    return 'Quase. Troca de herói ou tenta mais uma.';
};

const finishGame = (cause = 'pipe') => {
    if (isGameOver) return;

    isGameOver = true;
    isRunning = false;
    gameBoard.classList.add('is-game-over');

    const pipeLeft = pipe.offsetLeft;
    pipe.style.animation = 'none';
    pipe.style.left = `${pipeLeft}px`;
    pipe.style.right = 'auto';
    hero.classList.add('is-dead');

    const isNewRecord = jumpCounter > bestScore;
    if (isNewRecord) {
        bestScore = jumpCounter;
        try {
            localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
        } catch {
            // Segue normalmente se o navegador bloquear armazenamento local.
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
    if (now >= nextFireAt) spawnMagicPickup(now);
};

const gameLoop = (now) => {
    const dt = Math.min((now - lastFrameTime) / 1000, 0.04);
    lastFrameTime = now;

    if (!isGameOver && selectedCharacter) {
        updateHeroPhysics(dt);
    }

    if (!isGameOver && isRunning) {
        spawnEntities(now);
        updateCollectibles(dt);
        updateProjectiles(dt);
        updateEnemies(dt, now);

        if (!isGameOver && isPipeCollision()) finishGame('pipe');
    }

    if (!isGameOver) animationFrameId = window.requestAnimationFrame(gameLoop);
};

const clearEntities = () => {
    [...enemies, ...collectibles, ...projectiles].forEach((item) => item.el?.remove());
    enemies.length = 0;
    collectibles.length = 0;
    projectiles.length = 0;
    gameBoard.querySelectorAll('.pickup-pop').forEach((el) => el.remove());
};

const resetRound = ({ keepCharacter = true } = {}) => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);

    clearEntities();
    isRunning = false;
    isGameOver = false;
    jumpCounter = 0;
    coinCounter = 0;
    koCounter = 0;
    ammo = 0;
    nextEnemyAt = 0;
    nextCoinAt = 0;
    nextFireAt = 0;
    heroY = 0;
    heroVelocity = 0;
    jumpsUsed = 0;
    invulnerableUntil = 0;

    gameOverEl.hidden = true;
    gameBoard.classList.remove('is-running', 'is-game-over');
    startHint.classList.remove('is-hidden');
    pipe.removeAttribute('style');
    hero.removeAttribute('style');
    hero.classList.remove('is-dead', 'is-shielded');

    if (keepCharacter && selectedCharacter) {
        shieldCharges = selectedCharacter.shield;
        gameBoard.classList.add('has-character');
        characterSelect.hidden = true;
        applyCharacterVisual();
    } else {
        selectedCharacterKey = null;
        selectedCharacter = null;
        shieldCharges = 0;
        gameBoard.classList.remove('has-character');
        characterSelect.hidden = false;
        applyCharacterVisual();
    }

    updateHud();
    lastFrameTime = performance.now();
    animationFrameId = window.requestAnimationFrame(gameLoop);
};

const openCharacterSelect = () => resetRound({ keepCharacter: false });

const handleBoardPointer = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    jump(event);
};

const handleKeydown = (event) => {
    if (!characterSelect.hidden) return;

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
        resetRound({ keepCharacter: true });
    }
};

characterButtons.forEach((button) => {
    button.addEventListener('click', () => selectCharacter(button.dataset.character));
});

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
    resetRound({ keepCharacter: true });
});

changeCharacterButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openCharacterSelect();
});

changeCharacterGameOver.addEventListener('click', (event) => {
    event.stopPropagation();
    openCharacterSelect();
});

updateHud();
animationFrameId = window.requestAnimationFrame(gameLoop);
