const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.font = "20px Benguiat Bold";
let playerName = "Joueur";


/* ============================
   ÉCRANS
============================ */
const titleScreen = document.getElementById('title-screen');
const levelsScreen = document.getElementById('levels');
const playerScreen = document.getElementById('pickPlayer');
const gameOverScreen = document.getElementById('game-over-screen');
const bgTVScreen = document.getElementById('bk-tv');
const nameScreen = document.getElementById('name-screen');
const nameInput = document.getElementById('playerNameInput');
const nameValidateButton = document.getElementById('name-validate-button');


/* ============================
   BOUTONS
============================ */
const titleButton = document.getElementById('title-button');
const restartButton = document.getElementById('restart-button');
const normalButton = document.getElementById('btn-normal');
const upsideDownButton = document.getElementById('btn-upsideDown');
const hopperButton = document.getElementById('btn-hopper');
const dustinButton = document.getElementById('btn-dustin');

let upsideDown = false;

/* ============================
   FONCTIONS ÉCRANS
============================ */
function showScreen(screenEl) {
    screenEl.classList.remove('hidden');
    screenEl.classList.remove('screen-appear');
    void screenEl.offsetWidth;
    screenEl.classList.add('screen-appear');
}

function hideScreen(screenEl) {
    screenEl.classList.add('hidden');
}

/* ============================
   NAVIGATION
============================ */
titleButton.onclick = () => {
    song.play();
    hideScreen(titleScreen);
    showScreen(nameScreen);
};

nameValidateButton.onclick = () => {
    const value = nameInput.value.trim();

    if (value.length > 0) {
        playerName = value;
    } else {
        playerName = "Joueur";
    }

    hideScreen(nameScreen);
    showScreen(levelsScreen);
};


normalButton.onclick = () => {
    upsideDown = false;
    hideScreen(levelsScreen);
    showScreen(playerScreen);
};

upsideDownButton.onclick = () => {
    upsideDown = true;
    hideScreen(levelsScreen);
    showScreen(playerScreen);
};

hopperButton.onclick = () => {
    hideScreen(playerScreen);
    canvas.classList.remove('hidden');
    bgTVScreen.classList.remove('hidden');
    canvas.classList.remove('first-background', 'second-background');

    if (!upsideDown) {
        canvas.classList.add('first-background');
        start();
    } else {
        canvas.classList.add('second-background');
        startUpsideDown();
    }
};

dustinButton.onclick = () => {
    hideScreen(playerScreen);
    canvas.classList.remove('hidden');
    bgTVScreen.classList.remove('hidden');
    canvas.classList.remove('first-background', 'second-background');

    if (!upsideDown) {
        canvas.classList.add('first-background');
        startDustin();
    } else {
        canvas.classList.add('second-background');
        startUpsideDownDustin();
    }
};

restartButton.onclick = () => {
    hideScreen(gameOverScreen);
    showScreen(titleScreen);
};

/* ============================
   VARIABLES JEU
============================ */
const cWidth = canvas.width;
const cHeight = canvas.height;

let frames = 0;
let score = 0;
let levels = 1;
let player;
let gravity;
let obstacles = [];
let bats = [];
let slimes = [];
let dogs = [];
let demogorgons = [];
let gameSpeed = 15;
let keys = {};
let interval = null;
let isRunning = false;
let initialSpawnTimer = 220;
let spawnTimer = initialSpawnTimer;

/* ============================
   GAME SESSION (ANTI-TRICHE)
============================ */
let gameSessionId = null;
let scoreSent = false;
function initGameSession() {
    gameSessionId = crypto.randomUUID();
    scoreSent = false;
}

/* ============================
   HIGH SCORES (TOP 3 - FIRESTORE)
============================ */
async function displayHighScores() {
    if (typeof getLeaderboard !== "function") return;

    const scores = await getLeaderboard();

    for (let i = 0; i < 3; i++) {
        const el = document.getElementById(`highScore${i + 1}`);
        if (!el) continue;

        if (scores[i]) {
            el.innerText = `${scores[i].player} — ${scores[i].score}`;
        } else {
            el.innerText = "";
        }
    }
}


/* ============================
   DÉMARRAGE
============================ */
function resetSpeed() {
    gameSpeed = 15;
}

function start() {
        initGameSession(); // 🔐 NOUVELLE LIGNE (OBLIGATOIRE)
    resetSpeed();
    interval = setInterval(update, 1000 / 60);
    isRunning = true;
    gravity = 0.9;
    upsideDown = false;
    player = new Player(125, 10, 50, 100);
}

function startDustin() {
        initGameSession(); // 🔐 NOUVELLE LIGNE (OBLIGATOIRE)
    resetSpeed();
    interval = setInterval(update, 1000 / 60);
    isRunning = true;
    gravity = 0.9;
    upsideDown = false;
    player = new Dustin(125, 10, 60, 90);
}

function startUpsideDown() {
        initGameSession(); // 🔐 NOUVELLE LIGNE (OBLIGATOIRE)
    resetSpeed();
    interval = setInterval(update, 1000 / 60);
    isRunning = true;
    gravity = 0.9;
    upsideDown = true;
    player = new Player2(125, 5, 50, 100);
}

function startUpsideDownDustin() {
        initGameSession(); // 🔐 NOUVELLE LIGNE (OBLIGATOIRE)
    resetSpeed();
    interval = setInterval(update, 1000 / 60);
    isRunning = true;
    gravity = 0.9;
    upsideDown = true;
    player = new Dustin2(125, 5, 60, 90);
}


/* ============================
   FIN DE PARTIE
============================ */
function endGame() {
    clearInterval(interval);
    isRunning = false;

    const finalScore = Math.round(score);
    const finalLevel = levels;

    const finalScoreEl = document.getElementById("finalScore");
    const finalLevelEl = document.getElementById("finalLevel");

    if (finalScoreEl) {
        finalScoreEl.innerText = "Score final : " + finalScore;
    }

    if (finalLevelEl) {
        finalLevelEl.innerText = "Niveau atteint : " + finalLevel;
    }

    // 🔥 SAUVEGARDE AVEC NOM
    displayHighScores();

    // 🔐 SAUVEGARDE FIRESTORE (JEU CONCOURS)
if (
    !scoreSent &&
    typeof saveScore === "function" &&
    gameSessionId
) {
    scoreSent = true;

    saveScore({
        player: playerName,
        score: finalScore,
        sessionId: gameSessionId,
        world: upsideDown ? "upsideDown" : "normal",
        character: player instanceof Dustin || player instanceof Dustin2
            ? "dustin"
            : "hopper"
    });
}

    // Reset ennemis
    obstacles = [];
    slimes = [];
    dogs = [];
    bats = [];
    demogorgons = [];

    // Reset partie
    frames = 0;
    score = 0;
    levels = 1;
    spawnTimer = initialSpawnTimer;
    resetSpeed();

    // Cache le jeu
    canvas.classList.add('hidden');
    canvas.classList.remove('first-background', 'second-background');
    bgTVScreen.classList.add('hidden');

    // Affiche Game Over
    showScreen(gameOverScreen);
}



/* ============================
   BOUCLE PRINCIPALE
============================ */
function update() {
    frames++;
    ctx.clearRect(0, 0, cWidth, cHeight);

    score = frames / 10;
    levels = Math.floor(score / 100) + 1;

    /* 🔥 ACCÉLÉRATION PROGRESSIVE (comme ta version qui marche) */
    gameSpeed += 0.008;
    if (Math.floor(score) % 100 === 0) {
        gameSpeed += 0.2;
    }

    /* HUD (comme ta version qui marche) */
    if (!upsideDown) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 165, 38);
        ctx.fillRect(625, 0, 110, 35);
        ctx.fillStyle = "red";
        ctx.fillText(`Score: ${Math.round(score)}`, 10, 30);
        ctx.fillText(`Level: ${levels}`, 630, 30);
    } else {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 520, 165, 38);
        ctx.fillRect(625, 520, 110, 35);
        ctx.fillStyle = "red";
        ctx.fillText(`-${Math.round(score)} :ǝɹoɔS`, 12, 540);
        ctx.fillText(`-${levels} :lǝʌǝ˥`, 630, 540);
    }

    /* SPAWN */
    spawnTimer--;
    if (spawnTimer <= 0) {
        const enemyPool = [];

        if (score > 20) enemyPool.push(spawnBats);
        if (score > 50) enemyPool.push(spawnSlimes);
        if (score > 100) enemyPool.push(spawnDogs);
        if (score > 150) enemyPool.push(spawnObstacle);
        if (score > 200) enemyPool.push(spawnDemogorgon);

        enemyPool[Math.floor(Math.random() * enemyPool.length)]();

        spawnTimer = Math.floor(Math.random() * 70) + 40;
    }

    /* UPDATE + COLLISIONS */
    [...obstacles, ...slimes, ...dogs, ...bats, ...demogorgons].forEach(enemy => {
        enemy.speed = gameSpeed; // garde ta logique
        enemy.update();
        if (player.colision(enemy)) endGame();
    });

    // IMPORTANT: on garde EXACTEMENT ce que tu avais (sinon perso invisible)
    player.animate();
    player.playerDraw(frames);
}

/* ============================
   CONTROLES
============================ */
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('touchstart', () => {
    if (player) player.jump();
});

/* ============================
   MUSIQUE
============================ */
let song = new Audio('./docs/assets/sounds/som_1.mp3');
song.loop = true;

/* ============================
   LANCEMENT
============================ */
window.addEventListener('load', () => {
    showScreen(titleScreen);
    displayHighScores(); // pour afficher les meilleurs scores dès le début
});



