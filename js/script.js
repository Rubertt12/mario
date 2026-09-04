const gameBoard = document.getElementById('gameBoard');
const mario = document.getElementById('mario');
const pipe = document.getElementById('pipe');
const jumpCounterEl = document.getElementById('jumpCounter');
const bestCounterEl = document.getElementById('bestCounter');
const startHint = document.getElementById('startHint');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const resultMessageEl = document.getElementById('resultMessage');
const restartButton = document.getElementById('restartButton');

const MARIO_RUNNING_SRC = '/images/mario.gif';
const MARIO_GAME_OVER_SRC = '/images/game-over.png';
const BEST_SCORE_KEY = 'marioJumpBest';
const JUMP_DURATION = 560;

let isJumping = false;
let isRunning = false;
let isGameOver = false;
let jumpCounter = 0;
let bestScore = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10);
let animationFrameId = null;

const formatScore = (value) => String(Math.max(0, value)).padStart(2, '0');

const updateHud = () => {
    jumpCounterEl.textContent = formatScore(jumpCounter);
    bestCounterEl.textContent = formatScore(bestScore);
};

const startGame = () => {
    if (isRunning || isGameOver) return;

    isRunning = true;
    gameBoard.classList.add('is-running');
    startHint.classList.add('is-hidden');
};

const canUseKey = (event) => {
    const acceptedKeys = ['Space', 'ArrowUp', 'KeyW'];
    return acceptedKeys.includes(event.code);
};

const jump = (event) => {
    if (isGameOver) return;

    if (event?.type === 'keydown') {
        if (!canUseKey(event)) return;
        event.preventDefault();
    }

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

const isColliding = () => {
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

const getResultMessage = (score, isNewRecord) => {
    if (isNewRecord && score > 0) return 'Novo recorde! Aí sim, agora ficou sério.';
    if (score >= 20) return 'Mandou bem. Esse cano foi traiçoeiro.';
    if (score >= 10) return 'Boa sequência. Mais uma e passa.';
    if (score >= 5) return 'Já pegou o ritmo. Bora de novo.';
    return 'Quase! Tenta mais uma.';
};

const finishGame = () => {
    if (isGameOver) return;

    isGameOver = true;
    isRunning = false;

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
        localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    }

    updateHud();
    finalScoreEl.textContent = formatScore(jumpCounter);
    finalBestEl.textContent = formatScore(bestScore);
    resultMessageEl.textContent = getResultMessage(jumpCounter, isNewRecord);

    window.setTimeout(() => {
        gameOverEl.hidden = false;
        restartButton.focus({ preventScroll: true });
    }, 240);
};

const gameLoop = () => {
    if (!isGameOver && isRunning && isColliding()) {
        finishGame();
        return;
    }

    if (!isGameOver) {
        animationFrameId = window.requestAnimationFrame(gameLoop);
    }
};

const restartGame = () => {
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
    }

    isJumping = false;
    isRunning = false;
    isGameOver = false;
    jumpCounter = 0;

    gameOverEl.hidden = true;
    gameBoard.classList.remove('is-running');
    startHint.classList.remove('is-hidden');

    pipe.removeAttribute('style');
    mario.removeAttribute('style');
    mario.classList.remove('jump', 'is-dead');
    mario.src = MARIO_RUNNING_SRC;

    updateHud();
    animationFrameId = window.requestAnimationFrame(gameLoop);
};

const handlePointer = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    jump(event);
};

document.addEventListener('keydown', jump);
gameBoard.addEventListener('pointerdown', handlePointer);
restartButton.addEventListener('click', (event) => {
    event.stopPropagation();
    restartGame();
});

updateHud();
animationFrameId = window.requestAnimationFrame(gameLoop);
