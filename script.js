const player = document.getElementById('player');
const obstacle = document.querySelector('.obstacle');
const coin = document.getElementById('coin');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const highscoreDisplay = document.getElementById('highscore');
let score = 0;
let time = 0;

let isJumping = false;
let gravity = 0.5; // Gravitace
let jumpStrength = 10; // Síla skoku
let playerVelocity = 0; // Rychlost hráče
let obstaclePosition = 800; // Počáteční pozice překážky
let coinPosition = 900; // Počáteční pozice coinu
let speed = 5; // Počáteční rychlost pohybu překážky a coinu

// Uchovávání nejlepšího skóre
let highscore = localStorage.getItem('highscore') ? parseInt(localStorage.getItem('highscore')) : 0;
highscoreDisplay.textContent = `High Score: ${highscore}`;

// Posloucháme na stisknutí klávesy 'W' pro PC
document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyW' && !isJumping) { // Klávesa W
        isJumping = true;
        playerVelocity = jumpStrength; // Změna směru rychlosti na skok
    }
});

// Posloucháme na dotykové akce pro mobilní zařízení
document.addEventListener('touchstart', function() {
    if (!isJumping) { // Povolíme skákání pouze pokud hráč právě neskáče
        isJumping = true;
        playerVelocity = jumpStrength; // Skok při dotyku
    }
});

function gameLoop() {
    // Logika skoku
    if (isJumping) {
        player.style.bottom = parseFloat(player.style.bottom) + playerVelocity + 'px';
        playerVelocity -= gravity; // Aplikujeme gravitaci
    }

    // Zastavení skoku, když hráč dosáhne země
    if (parseFloat(player.style.bottom) <= 0) {
        isJumping = false;
        player.style.bottom = '0px'; // Resetujeme pozici hráče na zem
        playerVelocity = 0; // Resetujeme rychlost
    }

    // Pohyb překážky
    obstaclePosition -= speed; // Rychlost překážky

    if (obstaclePosition < -20) {
        obstaclePosition = 800; // Reset pozice překážky
    }

    // Aktualizace pozice překážky
    obstacle.style.left = obstaclePosition + 'px';

    // Pohyb coinu
    coinPosition -= speed; // Rychlost coinu

    if (coinPosition < -20) {
        spawnCoin(); // Při zmizení coinu ho znovu spawnueme
    }

    // Aktualizace pozice coinu
    coin.style.left = coinPosition + 'px';

    // Kontrola kolize s překážkou
    const playerRect = player.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();
    if (
        playerRect.right > obstacleRect.left &&
        playerRect.left < obstacleRect.right &&
        playerRect.bottom > obstacleRect.top &&
        playerRect.top < obstacleRect.bottom
    ) {
        resetGame(); // Resetování hry při kolizi
    }

    // Kontrola kolize s coinem
    const coinRect = coin.getBoundingClientRect();
    if (
        playerRect.right > coinRect.left &&
        playerRect.left < coinRect.right &&
        playerRect.bottom > coinRect.top &&
        playerRect.top < coinRect.bottom
    ) {
        score++; // Zvýšení skóre
        coin.style.display = 'none'; // Skrytí coinu
        scoreDisplay.textContent = `Score: ${score}`;
    }

    // Zobrazení času
    time++;
    timeDisplay.textContent = `Time: ${Math.floor(time / 60)}s`; // Zobrazujeme pouze sekundy

    requestAnimationFrame(gameLoop); // Další cyklus
}

// Zvýšení obtížnosti každých 30 sekund
setInterval(() => {
    speed += 1; // Zvýšení rychlosti pohybu překážek a coinu
    console.log('Obtížnost se zvýšila!'); // Můžeme to vidět v konzoli
}, 30000); // 30000 milisekund = 30 sekund

function spawnCoin() {
    // Generování náhodné výšky pro coin
    const randomHeight = Math.random() * 100 + 50; // Coin bude mít náhodnou výšku mezi 50px a 150px
    coin.style.bottom = randomHeight + 'px';
    coin.style.display = 'block'; // Zobrazení coinu
    coinPosition = 800; // Reset pozice coinu
}

function resetGame() {
    // Aktualizace nejlepšího skóre
    if (score > highscore) {
        highscore = score;
        highscoreDisplay.textContent = `High Score: ${highscore}`;
        localStorage.setItem('highscore', highscore); // Uložení nejlepšího skóre do localStorage
    }

    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    obstaclePosition = 800; // Resetování pozice překážky
    player.style.bottom = '0px'; // Resetování pozice hráče
    coin.style.display = 'none'; // Skrytí coinu
    time = 0; // Resetování času
    timeDisplay.textContent = `Time: 0s`; // Zobrazení nula na časomíru
    speed = 5; // Resetování rychlosti
    isJumping = false; // Resetování stavu skoku
}

gameLoop(); // Spuštění herní smyčky
