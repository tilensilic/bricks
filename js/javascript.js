var canvas, ctx, WIDTH, HEIGHT;
var x, y, dx, dy, r = 8;
var paddlex, paddleh = 12, paddlew = 100;
var rightDown = false, leftDown = false;
var bricks, NROWS, NCOLS, BRICKWIDTH, BRICKHEIGHT, PADDING = 4;

var tocke = 0, sekunde = 0, start = false, paused = false;
var timerInterval, lastTime;
var baseSpeed = 0;

function openModal(id) { $('#' + id).fadeIn(200).removeClass('hidden'); }
function closeModal(id) { $('#' + id).fadeOut(200, function() { $(this).addClass('hidden'); }); }

function init() {
    canvas = $('#canvas')[0];
    ctx = canvas.getContext("2d");
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    paddlex = WIDTH / 2 - paddlew / 2;
    
    var savedBest = localStorage.getItem("bestScore") || 0;
    $("#bestScore").html(savedBest);

    $(".diff-btn").click(function() {
        var level = $(this).data("level");
        setupDifficulty(level);
        $("#menuOverlay").fadeOut(300);
        $("#gameControls").removeClass("hidden");
        startGame();
    });
    
    $("#pauseBtn").click(togglePause);
}

function setupDifficulty(level) {
    if (level == 1) { baseSpeed = 220; paddlew = 140; NROWS = 3; }
    else if (level == 2) { baseSpeed = 320; paddlew = 100; NROWS = 5; }
    else { baseSpeed = 440; paddlew = 80; NROWS = 7; }
    paddlex = WIDTH / 2 - paddlew / 2;
    init_bricks();
}

function init_bricks() {
    NCOLS = 8;
    BRICKWIDTH = (WIDTH / NCOLS) - PADDING;
    BRICKHEIGHT = 18;
    bricks = new Array(NROWS);
    for (var i = 0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (var j = 0; j < NCOLS; j++) {
            bricks[i][j] = (Math.random() > 0.9) ? 2 : 1;
        }
    }
}

function startGame() {
    start = true; tocke = 0; sekunde = 0;
    x = WIDTH / 2; y = HEIGHT - 50;
    var angle = (Math.random() * (Math.PI / 4)) + (Math.PI / 4); 
    dx = Math.cos(angle) * baseSpeed;
    dy = -Math.sin(angle) * baseSpeed;
    lastTime = performance.now();
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!start || paused) return;
    var dt = (timestamp - lastTime) / 1000; 
    lastTime = timestamp;
    if (dt > 0.05) dt = 0.05;

    var steps = 3; 
    for(var i=0; i<steps; i++) {
        update(dt / steps);
    }
    
    draw();
    if(start) requestAnimationFrame(gameLoop);
}

function update(dt) {
    var paddleSpeed = 600;
    if (rightDown && paddlex < WIDTH - paddlew) paddlex += paddleSpeed * dt;
    else if (leftDown && paddlex > 0) paddlex -= paddleSpeed * dt;

    x += dx * dt; y += dy * dt;

    if (x + r > WIDTH) { dx = -Math.abs(dx); x = WIDTH - r; }
    else if (x - r < 0) { dx = Math.abs(dx); x = r; }
    if (y - r < 0) { dy = Math.abs(dy); y = r; } 
    else if (y + r > HEIGHT - paddleh) {
        if (x > paddlex && x < paddlex + paddlew) {
            var hitPos = (x - (paddlex + paddlew / 2)) / (paddlew / 2);
            dx = hitPos * baseSpeed * 1.5;
            dy = -Math.abs(dy); y = HEIGHT - paddleh - r;
        } else if (y + r > HEIGHT) {
            gameOver();
        }
    }

    var row = Math.floor(y / (BRICKHEIGHT + PADDING));
    var col = Math.floor(x / (BRICKWIDTH + PADDING));
    if (row < NROWS && row >= 0 && col < NCOLS && col >= 0 && bricks[row][col] > 0) {
        dy = -dy;
        tocke += (bricks[row][col] == 2) ? 5 : 1;
        bricks[row][col] = 0;
        $("#tocke").html(tocke);
        
        var win = true;
        for(var i=0; i<NROWS; i++) for(var j=0; j<NCOLS; j++) if(bricks[i][j] > 0) win = false;
        if(win) showFinishScreen("ZMAGA!");
    }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#38bdf8"; ctx.fillRect(paddlex, HEIGHT - paddleh, paddlew, paddleh);

    var colors = ["#f87171", "#fbbf24", "#4ade80", "#38bdf8", "#818cf8"];
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] > 0) {
                ctx.fillStyle = (bricks[i][j] == 2) ? "#fcd34d" : colors[i % colors.length];
                ctx.fillRect(j * (BRICKWIDTH + PADDING) + PADDING/2, i * (BRICKHEIGHT + PADDING) + PADDING/2, BRICKWIDTH, BRICKHEIGHT);
            }
        }
    }
}

function updateTimer() {
    if (start && !paused) {
        sekunde++;
        var m = Math.floor(sekunde / 60); var s = sekunde % 60;
        $("#cas").html((m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s));
    }
}

function togglePause() {
    if(!start) return;
    paused = !paused;
    if (paused) $("#pauseOverlay").removeClass('hidden');
    else { $("#pauseOverlay").addClass('hidden'); lastTime = performance.now(); requestAnimationFrame(gameLoop); }
}

function showFinishScreen(title) {
    start = false; clearInterval(timerInterval);
    var best = localStorage.getItem("bestScore") || 0;
    if (tocke > best) localStorage.setItem("bestScore", tocke);
    $("#finishTitle").html(title);
    $("#finalPoints").html(tocke);
    $("#finishOverlay").fadeIn(400).removeClass('hidden');
}

function gameOver() { showFinishScreen("KONEC IGRE"); }

$(document).keydown(function(e) {
    if (e.keyCode == 39) rightDown = true;
    if (e.keyCode == 37) leftDown = true;
    if (e.keyCode == 80) togglePause();
});
$(document).keyup(function(e) { if (e.keyCode == 39) rightDown = false; if (e.keyCode == 37) leftDown = false; });
$(document).ready(init);