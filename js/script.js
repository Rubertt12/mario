const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
let isJumping = false;
let jumpCounter = 0;

const jump = () => {
    if (!isJumping) {
        isJumping = true;
        jumpCounter++;
        document.getElementById('jumpCounter').textContent = jumpCounter;

        mario.classList.add('jump');

        setTimeout(() => {
            mario.classList.remove('jump');
            isJumping = false;
        }, 500);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Esconde o botão no início
    document.getElementById('botaoContainer').style.display = 'none';
});

function restartGame() {
    // Recarrega a página
    location.reload();
}

const showGameOverModal = () => {
    // Exibe o modal de reinício
    const modal = document.createElement('div');
    modal.className = 'modal';

    const gameOverText = document.createElement('p');
    gameOverText.textContent = 'Game Over';

    const jumpCountText = document.createElement('p');
    jumpCountText.textContent = `Total Jumps: ${jumpCounter}`;

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Reiniciar';
    restartButton.className = 'botao';
    restartButton.addEventListener('click', restartGame);

    const botaoContainer = document.createElement('div');
    botaoContainer.className = 'botao-container';
    botaoContainer.appendChild(restartButton);

    modal.appendChild(gameOverText);
    modal.appendChild(jumpCountText);
    modal.appendChild(botaoContainer);

    document.body.appendChild(modal);

    // Exibe o modal de reinício
    modal.style.display = 'block';
};

const handleTouch = (event) => {
    jump();
};

const jumpMobile = () => {
    if (!isJumping) {
        isJumping = true;
        jumpCounter++;
        document.getElementById('jumpCounter').textContent = jumpCounter;

        mario.classList.add('jump');

        setTimeout(() => {
            mario.classList.remove('jump');
            isJumping = false;
        }, 500);
    }
};

const loop = setInterval(() => {
    const pipePosition = pipe.offsetLeft;
    const marioPosition = parseFloat(window.getComputedStyle(mario).bottom);

    if (pipePosition < 120 && pipePosition > 0 && marioPosition < 80) {
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${pipePosition}px`;

        mario.src = '/images/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '60px';

        clearInterval(loop);

        // Chama a função para mostrar o modal quando o jogador morre
        showGameOverModal();
    }
}, 10);

document.addEventListener('keydown', jump);
document.addEventListener('touchstart', handleTouch);
