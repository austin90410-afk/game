const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed');
const bestScoreElement = document.getElementById('best-score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const recordMsgElement = document.getElementById('record-msg');
const restartBtn = document.getElementById('restart-btn');

let gameRunning = true;
let score = 0;
let bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;
let gameTime = 0;
let groundY = canvas.height - 20;
let obstacleSpeed = 5;
let lastObstacleTime = 0;

// 初始化最高分顯示
bestScoreElement.textContent = bestScore;

// 火柴人
let stickman = {
    x: 50,
    y: groundY - 50,
    width: 20,
    height: 50,
    velocityY: 0,
    isJumping: false,
    isDucking: false
};

// 障礙物
let obstacles = [];
let airObstacles = [];

// 遊戲循環
function gameLoop() {
    if (!gameRunning) return;

    gameTime++;
    obstacleSpeed = 5 + gameTime / 500; // 速度隨時間增加
    speedElement.textContent = Math.floor(obstacleSpeed);

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 更新遊戲狀態
function update() {
    // 火柴人跳躍
    if (stickman.isJumping) {
        stickman.velocityY += 0.5; // 重力
        stickman.y += stickman.velocityY;

        if (stickman.y >= groundY - stickman.height) {
            stickman.y = groundY - stickman.height;
            stickman.velocityY = 0;
            stickman.isJumping = false;
            stickman.isDucking = false;
        }
    }

    // 生成地面障礙物 - 改進生成邏輯，避免太緊密
    if (Math.random() < 0.01 && gameTime - lastObstacleTime > 40) {
        obstacles.push({
            x: canvas.width,
            y: groundY - 30,
            width: 20,
            height: 30,
            isAir: false
        });
        lastObstacleTime = gameTime;
    }

    // 生成空中障礙物
    if (Math.random() < 0.005 && gameTime - lastObstacleTime > 50) {
        airObstacles.push({
            x: canvas.width,
            y: groundY - 35,
            width: 25,
            height: 10,
            isAir: true
        });
        lastObstacleTime = gameTime;
    }

    // 更新障礙物位置
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacleSpeed;
    });

    airObstacles.forEach(obstacle => {
        obstacle.x -= obstacleSpeed;
    });

    // 碰撞檢測 - 地面障礙物
    for (let obstacle of obstacles) {
        if (stickman.x < obstacle.x + obstacle.width &&
            stickman.x + stickman.width > obstacle.x &&
            stickman.y < obstacle.y + obstacle.height &&
            stickman.y + stickman.height > obstacle.y) {
            // 蹲下可以躲避地面障礙物
            if (!stickman.isDucking) {
                gameOver();
            }
        }
    }

    // 碰撞檢測 - 空中障礙物
    for (let obstacle of airObstacles) {
        let stickmanLeft = stickman.x;
        let stickmanRight = stickman.x + stickman.width;
        let stickmanTop, stickmanBottom;
        
        if (stickman.isDucking) {
            // 蹲下時的碰撞框更小
            stickmanTop = stickman.y + 25;
            stickmanBottom = stickman.y + 48;
        } else {
            stickmanTop = stickman.y;
            stickmanBottom = stickman.y + stickman.height;
        }
        
        if (stickmanLeft < obstacle.x + obstacle.width &&
            stickmanRight > obstacle.x &&
            stickmanTop < obstacle.y + obstacle.height &&
            stickmanBottom > obstacle.y) {
            gameOver();
        }
    }

    // 移除離開屏幕的障礙物
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
            scoreElement.textContent = score;
        }
    }

    // 移除離開屏幕的空中障礙物
    for (let i = airObstacles.length - 1; i >= 0; i--) {
        if (airObstacles[i].x + airObstacles[i].width < 0) {
            airObstacles.splice(i, 1);
            score++;
            scoreElement.textContent = score;
        }
    }
}

// 繪製遊戲
function draw() {
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製地面
    ctx.fillStyle = '#000';
    ctx.fillRect(0, groundY, canvas.width, 2);

    // 繪製火柴人
    drawStickman(stickman.x, stickman.y);

    // 繪製障礙物
    ctx.fillStyle = '#000';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // 繪製空中障礙物
    ctx.fillStyle = '#FF6B6B';
    airObstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// 繪製火柴人
function drawStickman(x, y) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    if (stickman.isDucking) {
        // 蹲下的火柴人
        // 頭
        ctx.beginPath();
        ctx.arc(x + 10, y + 30, 6, 0, Math.PI * 2);
        ctx.stroke();

        // 身體
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 36);
        ctx.lineTo(x + 10, y + 42);
        ctx.stroke();

        // 手臂
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 39);
        ctx.lineTo(x + 5, y + 35);
        ctx.moveTo(x + 10, y + 39);
        ctx.lineTo(x + 15, y + 35);
        ctx.stroke();

        // 腿
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 42);
        ctx.lineTo(x + 5, y + 48);
        ctx.moveTo(x + 10, y + 42);
        ctx.lineTo(x + 15, y + 48);
        ctx.stroke();
    } else {
        // 正常的火柴人
        // 頭
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
        ctx.stroke();

        // 身體
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 18);
        ctx.lineTo(x + 10, y + 35);
        ctx.stroke();

        // 手臂
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 25);
        ctx.lineTo(x + 5, y + 20);
        ctx.moveTo(x + 10, y + 25);
        ctx.lineTo(x + 15, y + 20);
        ctx.stroke();

        // 腿
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 35);
        ctx.lineTo(x + 5, y + 45);
        ctx.moveTo(x + 10, y + 35);
        ctx.lineTo(x + 15, y + 45);
        ctx.stroke();
    }
}

// 跳躍
function jump() {
    if (!stickman.isJumping) {
        stickman.velocityY = -10;
        stickman.isJumping = true;
    }
}

// 遊戲結束
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    
    // 檢查是否打破記錄
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
        bestScoreElement.textContent = bestScore;
        recordMsgElement.textContent = '🎉 新的最高分！';
    } else {
        recordMsgElement.textContent = '';
    }
    
    gameOverElement.style.display = 'block';
}

// 重新開始
function restart() {
    gameRunning = true;
    score = 0;
    gameTime = 0;
    obstacleSpeed = 5;
    lastObstacleTime = 0;
    scoreElement.textContent = score;
    speedElement.textContent = '5';
    gameOverElement.style.display = 'none';
    stickman.y = groundY - stickman.height;
    stickman.velocityY = 0;
    stickman.isJumping = false;
    stickman.isDucking = false;
    obstacles = [];
    airObstacles = [];
    gameLoop();
}

// 事件監聽
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
    if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (!stickman.isJumping) {
            stickman.isDucking = true;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stickman.isDucking = false;
    }
});

canvas.addEventListener('click', jump);

restartBtn.addEventListener('click', restart);

// 開始遊戲
gameLoop();