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
}

const handleTouch = (event) => {
    jump();
}

const loop = setInterval(() => {
    const pipePosition = pipe.offsetLeft;
    const marioPosition = window.getComputedStyle(mario).bottom.replace('px', '');

    if (pipePosition < 120 && pipePosition > 0 && marioPosition < 80) {
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${pipePosition}px`;

        mario.src = '/images/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';

        clearInterval(loop);
    }
}, 10);

document.addEventListener('keydown', jump);
document.addEventListener('touchstart', handleTouch);
