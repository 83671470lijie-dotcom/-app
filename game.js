class CavityBugGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.gameActive = false;
        this.isPaused = false;
        this.foodResidues = [];
        this.cavityBugs = [];
        this.powerUps = [];
        this.timeLeft = 60; // 时间限制，单位秒
        this.lives = 3; // 生命值
        this.gameTimer = null;
        this.toothModel = document.getElementById('tooth-model');
        this.startButton = document.getElementById('start-button');
        this.toothpasteGun = document.getElementById('toothpaste-gun');
        this.toothbrushSword = document.getElementById('toothbrush-sword');
        this.pauseButton = document.getElementById('pause-button');
        this.gameMessage = document.getElementById('game-message');
        this.levelDisplay = document.getElementById('level');
        this.scoreDisplay = document.getElementById('score');
        this.popSound = document.getElementById('pop-sound');
        this.winSound = document.getElementById('win-sound');
        this.buttonSound = document.getElementById('button-sound');
        this.lastLifeLossTime = 0;
        this.warningGiven = false;
        this.blankClickHandler = null;
        this.touchStartHandler = null;
        
        // 武器使用状态
        this.isUsingToothpasteGun = false;
        this.isUsingToothbrushSword = false;
        
        // 连击系统
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = null;
        this.comboTimeLimit = 1000; // 连击时间限制（毫秒）
        
        // 道具系统
        this.powerUpTypes = ['freeze', 'doubleScore', 'blast'];
        
        // 创建时间和生命值显示元素
        this.createGameInfoElements();
        
        this.init();
        
        // 添加排行榜和分数说明的点击显示功能
        this.initToggleControls();
    }
    
    createGameInfoElements() {
        // 检查是否已存在这些元素
        if (!document.getElementById('time-left')) {
            const gameInfo = document.getElementById('game-info');
            
            // 创建时间显示
            const timeElement = document.createElement('div');
            timeElement.id = 'time-left';
            timeElement.textContent = '时间: 60s';
            gameInfo.appendChild(timeElement);
            
            // 创建生命值显示
            const livesElement = document.createElement('div');
            livesElement.id = 'lives';
            livesElement.textContent = '生命: 3';
            gameInfo.appendChild(livesElement);
            
            // 创建分数要求显示
            const scoreRequirementElement = document.createElement('div');
            scoreRequirementElement.id = 'score-requirement';
            scoreRequirementElement.textContent = '分数要求: 100';
            gameInfo.appendChild(scoreRequirementElement);
            
            // 创建连击显示
            const comboElement = document.createElement('div');
            comboElement.id = 'combo';
            comboElement.textContent = '连击: 0';
            gameInfo.appendChild(comboElement);
        }
        
        // 保存引用
        this.timeDisplay = document.getElementById('time-left');
        this.livesDisplay = document.getElementById('lives');
        this.scoreRequirementDisplay = document.getElementById('score-requirement');
        this.comboDisplay = document.getElementById('combo');
    }
    
    // 增加连击数
    increaseCombo() {
        if (!this.gameActive || this.isPaused) return;
        
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // 更新连击显示
        if (this.comboDisplay) {
            this.comboDisplay.textContent = `连击: ${this.combo}`;
        }
        
        // 显示连击效果
        if (this.combo >= 5) {
            const comboEffect = document.createElement('div');
            comboEffect.style.position = 'absolute';
            comboEffect.style.left = `${this.toothModel.offsetWidth / 2 - 30}px`;
            comboEffect.style.top = `${this.toothModel.offsetHeight / 2 - 20}px`;
            comboEffect.style.fontSize = '24px';
            comboEffect.style.fontWeight = 'bold';
            comboEffect.style.color = '#ffd700';
            comboEffect.style.animation = 'comboEffect 1s ease-out forwards';
            comboEffect.textContent = `${this.combo}连击！`;
            this.toothModel.appendChild(comboEffect);
            
            // 添加连击动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes comboEffect {
                    0% { transform: scale(0); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            
            // 自动移除效果
            setTimeout(() => {
                comboEffect.remove();
                style.remove();
            }, 1000);
        }
        
        // 重置连击计时器
        this.resetComboTimer();
    }
    
    // 重置连击计时器
    resetComboTimer() {
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }
        
        this.comboTimer = setTimeout(() => {
            this.resetCombo();
        }, this.comboTimeLimit);
    }
    
    // 重置连击数
    resetCombo() {
        if (this.combo > 0) {
            // 给予连击奖励分数
            if (this.combo >= 3) {
                const bonusScore = this.combo * 10;
                this.score += bonusScore;
                this.showScoreChange(bonusScore, 'bonus');
                this.gameMessage.textContent = `连击结束！获得${bonusScore}分奖励！`;
            }
            
            this.combo = 0;
            if (this.comboDisplay) {
                this.comboDisplay.textContent = `连击: ${this.combo}`;
            }
        }
    }
    
    // 显示分数变化
    showScoreChange(amount, type = 'normal') {
        const scoreChange = document.createElement('div');
        scoreChange.style.position = 'absolute';
        scoreChange.style.left = `${Math.random() * (this.toothModel.offsetWidth - 50) + 25}px`;
        scoreChange.style.top = `${Math.random() * (this.toothModel.offsetHeight - 50) + 25}px`;
        scoreChange.style.fontSize = '20px';
        scoreChange.style.fontWeight = 'bold';
        scoreChange.style.animation = 'scoreChange 1s ease-out forwards';
        
        if (type === 'bonus') {
            scoreChange.style.color = '#ffd700';
            scoreChange.textContent = `+${amount} (连击奖励)`;
        } else {
            scoreChange.style.color = amount > 0 ? 'green' : 'red';
            scoreChange.textContent = amount > 0 ? `+${amount}` : `${amount}`;
        }
        
        this.toothModel.appendChild(scoreChange);
        
        // 添加分数变化动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scoreChange {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-30px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // 自动移除
        setTimeout(() => {
            scoreChange.remove();
            style.remove();
        }, 1000);
    }
    
    playSound(sound) {
        try {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        } catch (e) {
            console.log('Sound error:', e);
        }
    }
    
    init() {
        // 添加点击和触摸事件支持
        this.startButton.addEventListener('click', () => this.startGame());
        this.startButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startGame();
        });
        
        this.toothpasteGun.addEventListener('click', () => this.useToothpasteGun());
        this.toothpasteGun.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.useToothpasteGun();
        });
        
        this.toothbrushSword.addEventListener('click', () => this.useToothbrushSword());
        this.toothbrushSword.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.useToothbrushSword();
        });
        
        this.superCleaner = document.getElementById('super-cleaner');
        if (this.superCleaner) {
            this.superCleaner.addEventListener('click', () => this.useSuperCleaner());
            this.superCleaner.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useSuperCleaner();
            });
        }
        
        // 添加暂停按钮事件监听器
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.pauseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.togglePause();
        });
        
        // 添加排行榜关闭按钮事件监听器
        const closeLeaderboardButton = document.getElementById('close-leaderboard');
        if (closeLeaderboardButton) {
            closeLeaderboardButton.addEventListener('click', () => {
                document.getElementById('leaderboard').style.display = 'none';
            });
        }
    }
    
    startGame() {
        this.playSound(this.buttonSound);
        this.level = 1;
        this.score = 0;
        this.timeLeft = 60;
        this.lives = 3;
        this.gameActive = true;
        this.startButton.textContent = '重新开始';
        
        // 添加游戏开始倒计时
        this.gameMessage.textContent = '准备开始！';
        
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                this.gameMessage.textContent = `准备开始！${countdown}`;
                this.playSound(this.buttonSound);
                countdown--;
            } else {
                clearInterval(countdownInterval);
                this.gameMessage.textContent = '开始清除食物残渣！';
                this.clearGameArea();
                this.generateFoodResidues();
                this.updateDisplay();
                this.updateLeaderboardDisplay();
                this.startGameTimer();
            }
        }, 1000);
    }
    
    startGameTimer() {
        // 清除之前的计时器
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // 启动新计时器
        this.gameTimer = setInterval(() => {
            if (this.gameActive) {
                this.timeLeft--;
                this.updateDisplay();
                
                // 检查时间是否耗尽
                if (this.timeLeft <= 0) {
                    this.gameOver('时间到！游戏结束！');
                }
            }
        }, 1000);
    }
    
    gameOver(message) {
        this.gameActive = false;
        this.isPaused = false;
        
        // 清除计时器
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // 更新排行榜
        this.updateLeaderboard();
        
        // 显示游戏结束信息
        this.gameMessage.textContent = message;
        this.startButton.textContent = '重新开始';
        this.pauseButton.textContent = '暂停';
        
        // 清除游戏区域
        this.clearGameArea();
        
        // 更新排行榜显示
        this.updateLeaderboardDisplay();
    }
    
    updateLeaderboard() {
        // 获取当前排行榜
        let leaderboard = this.getLeaderboard();
        
        // 添加当前分数
        leaderboard.push({
            score: this.score,
            date: new Date().toLocaleString()
        });
        
        // 按分数排序
        leaderboard.sort((a, b) => b.score - a.score);
        
        // 只保留前10名
        leaderboard = leaderboard.slice(0, 10);
        
        // 保存排行榜
        localStorage.setItem('cavityBugLeaderboard', JSON.stringify(leaderboard));
    }
    
    getLeaderboard() {
        // 从本地存储获取排行榜
        const leaderboardData = localStorage.getItem('cavityBugLeaderboard');
        return leaderboardData ? JSON.parse(leaderboardData) : [];
    }
    
    showLeaderboard() {
        // 获取排行榜数据
        const leaderboard = this.getLeaderboard();
        const leaderboardList = document.getElementById('leaderboard-list');
        
        // 清空排行榜列表
        leaderboardList.innerHTML = '';
        
        // 添加排行榜项
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p style="font-size: 12px; margin: 5px 0;">暂无记录</p>';
        } else {
            leaderboard.forEach((entry, index) => {
                const listItem = document.createElement('div');
                listItem.style.padding = '3px 0';
                listItem.style.borderBottom = '1px solid #eee';
                listItem.textContent = `${index + 1}. ${entry.score}分`;
                listItem.style.fontSize = '11px';
                leaderboardList.appendChild(listItem);
            });
        }
    }
    
    updateLeaderboardDisplay() {
        // 实时更新排行榜显示
        this.showLeaderboard();
    }
    
    togglePause() {
        if (!this.gameActive) return;
        
        this.playSound(this.buttonSound);
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // 暂停游戏
            if (this.gameTimer) {
                clearInterval(this.gameTimer);
            }
            this.gameMessage.textContent = '游戏已暂停！点击继续按钮恢复游戏。';
            this.pauseButton.textContent = '继续';
            
            // 禁用游戏控制按钮
            this.toothpasteGun.disabled = true;
            this.toothbrushSword.disabled = true;
            this.superCleaner.disabled = true;
        } else {
            // 继续游戏
            this.startGameTimer();
            this.gameMessage.textContent = '游戏继续！';
            this.pauseButton.textContent = '暂停';
            
            // 启用游戏控制按钮
            this.toothpasteGun.disabled = false;
            this.toothbrushSword.disabled = false;
            this.superCleaner.disabled = false;
        }
    }
    
    clearGameArea() {
        // 保留光泽效果元素
        const shineEffect = this.toothModel.querySelector('.shine-effect');
        this.toothModel.innerHTML = '';
        if (shineEffect) {
            this.toothModel.appendChild(shineEffect);
        }
        this.foodResidues = [];
        this.cavityBugs = [];
        this.powerUps = [];
    }
    
    generateFoodResidues() {
        const residueCount = 5 + (this.level * 2);
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6a0572'];
        
        for (let i = 0; i < residueCount; i++) {
            const residue = document.createElement('div');
            residue.className = 'food-residue';
            residue.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            residue.style.left = `${Math.random() * (this.toothModel.offsetWidth - 25)}px`;
            residue.style.top = `${Math.random() * (this.toothModel.offsetHeight - 25)}px`;
            // 添加点击和触摸事件支持（增加点击区域）
            residue.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFoodResidue(residue);
            });
            residue.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeFoodResidue(residue);
            });
            
            // 增加点击区域的视觉反馈
            residue.style.cursor = 'pointer';
            residue.style.transition = 'transform 0.2s ease';
            residue.addEventListener('mouseover', () => {
                residue.style.transform = 'scale(1.1)';
            });
            residue.addEventListener('mouseout', () => {
                residue.style.transform = 'scale(1)';
            });
            
            // 添加移动属性，根据关卡难度调整初始速度
            const baseSpeed = 1.0;
            const speedIncrease = (this.level - 1) * 0.1;
            const maxBaseSpeed = 2.0;
            const finalBaseSpeed = Math.min(baseSpeed + speedIncrease, maxBaseSpeed);
            residue.speedX = (Math.random() - 0.5) * finalBaseSpeed;
            residue.speedY = (Math.random() - 0.5) * finalBaseSpeed;
            
            this.toothModel.appendChild(residue);
            this.foodResidues.push(residue);
        }
        
        // 添加空白区域点击事件，实现扣分机制
        const handleBlankClick = (e) => {
            if (!this.gameActive || this.isPaused) return;
            
            // 检查点击目标是否为空白区域
            if (e.target === this.toothModel || e.target.className === 'shine-effect') {
                this.deductScore(10); // 点击空白区域扣10分
            }
        };
        
        // 创建touchstart事件处理函数
        const handleTouchStart = (e) => {
            e.preventDefault();
            handleBlankClick(e);
        };
        
        // 移除旧的事件监听器，避免重复添加
        if (this.blankClickHandler) {
            this.toothModel.removeEventListener('click', this.blankClickHandler);
        }
        if (this.touchStartHandler) {
            this.toothModel.removeEventListener('touchstart', this.touchStartHandler);
        }
        
        // 保存当前的事件监听器引用
        this.blankClickHandler = handleBlankClick;
        this.touchStartHandler = handleTouchStart;
        
        // 添加新的事件监听器
        this.toothModel.addEventListener('click', handleBlankClick);
        this.toothModel.addEventListener('touchstart', handleTouchStart);
        
        // 启动食物残渣移动
        this.moveFoodResidues();
    }
    
    moveFoodResidues() {
        if (!this.gameActive) return;
        
        if (!this.isPaused) {
            this.foodResidues.forEach(residue => {
                if (!residue) return;
                
                let x = parseFloat(residue.style.left) || 0;
                let y = parseFloat(residue.style.top) || 0;
                
                // 更新位置
                x += residue.speedX;
                y += residue.speedY;
                
                // 边界检测和反弹，增加内边距，避免在边缘浮动
                const padding = 10;
                const maxX = this.toothModel.offsetWidth - 25 - padding;
                const maxY = this.toothModel.offsetHeight - 25 - padding;
                
                let collided = false;
                
                if (x < padding || x > maxX) {
                    // 碰撞后改变路线和方向，不仅仅是简单的反弹
                    residue.speedX = -residue.speedX * (0.7 + Math.random() * 0.4); // 随机阻尼
                    residue.speedY += (Math.random() - 0.5) * 1.0; // 随机改变Y方向速度
                    x = Math.max(padding, Math.min(maxX, x));
                    collided = true;
                }
                
                if (y < padding || y > maxY) {
                    // 碰撞后改变路线和方向，不仅仅是简单的反弹
                    residue.speedY = -residue.speedY * (0.7 + Math.random() * 0.4); // 随机阻尼
                    residue.speedX += (Math.random() - 0.5) * 1.0; // 随机改变X方向速度
                    y = Math.max(padding, Math.min(maxY, y));
                    collided = true;
                }
                
                // 碰撞后增加一些额外的随机性，使移动轨迹更自然
                if (collided) {
                    // 随机改变速度方向
                    if (Math.random() < 0.3) {
                        residue.speedX += (Math.random() - 0.5) * 0.8;
                        residue.speedY += (Math.random() - 0.5) * 0.8;
                    }
                }
                
                // 随机改变速度，使移动更有趣和流畅
                if (Math.random() < 0.01) {
                    // 使用更平滑的速度变化，限制速度增长
                    const speedFactor = 1 + (this.level * 0.05); // 减少速度增长系数
                    residue.speedX += (Math.random() - 0.5) * 0.3;
                    residue.speedY += (Math.random() - 0.5) * 0.3;
                    
                    // 限制最大速度，确保后期不会太快
                    const maxSpeed = Math.min(2.5, 1.5 + (this.level * 0.1)); // 限制最大速度为2.5
                    residue.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, residue.speedX));
                    residue.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, residue.speedY));
                }
                
                // 添加一些随机性，使移动轨迹更自然
                if (Math.random() < 0.005) {
                    const speedFactor = 1 + (this.level * 0.05); // 减少速度增长系数
                    residue.speedX = (Math.random() - 0.5) * 1.5 * speedFactor;
                    residue.speedY = (Math.random() - 0.5) * 1.5 * speedFactor;
                }
                
                // 限制最大速度，确保后期不会太快
                const maxSpeed = Math.min(2.5, 1.5 + (this.level * 0.1)); // 限制最大速度为2.5
                residue.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, residue.speedX));
                residue.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, residue.speedY));
                
                // 更新样式
                residue.style.left = `${x}px`;
                residue.style.top = `${y}px`;
            });
        }
        
        // 继续移动，即使在暂停状态下也保持游戏循环
        requestAnimationFrame(() => this.moveFoodResidues());
    }
    
    removeFoodResidue(residue, isFromFoam = false) {
        if (!this.gameActive || this.isPaused) return;
        
        this.playSound(this.popSound);
        
        // 创建爆炸效果
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = residue.style.left;
        explosion.style.top = residue.style.top;
        this.toothModel.appendChild(explosion);
        
        // 移除残渣
        residue.remove();
        this.foodResidues = this.foodResidues.filter(r => r !== residue);
        
        // 增加分数（牙膏泡沫枪击中只加1分）
        const scoreGain = isFromFoam ? 1 : 10;
        this.score += scoreGain;
        this.updateDisplay();
        this.showScoreChange(scoreGain);
        
        // 增加连击数
        this.increaseCombo();
        
        // 检查是否清除完所有残渣
        if (this.foodResidues.length === 0) {
            this.gameMessage.textContent = '食物残渣已清除！现在准备对抗蛀牙虫！';
            setTimeout(() => this.generateCavityBugs(), 1000);
        }
    }
    
    generateCavityBugs() {
        const bugCount = this.level + 1;
        
        for (let i = 0; i < bugCount; i++) {
            // 随机选择蛀牙虫类型
            const bugType = Math.random() < 0.7 ? 'normal' : (Math.random() < 0.5 ? 'fast' : 'tough');
            
            const bug = document.createElement('div');
            bug.className = 'cavity-bug';
            bug.style.left = `${Math.random() * (this.toothModel.offsetWidth - 35)}px`;
            bug.style.top = `${Math.random() * (this.toothModel.offsetHeight - 35)}px`;
            
            // 根据类型设置不同的样式和属性
            const speedIncrease = (this.level - 1) * 0.1;
            
            if (bugType === 'fast') {
                bug.style.backgroundColor = '#ff6b6b';
                bug.style.width = '30px';
                bug.style.height = '30px';
                const maxSpeed = Math.min(3.0, 2.0 + speedIncrease);
                bug.speedX = (Math.random() - 0.5) * maxSpeed;
                bug.speedY = (Math.random() - 0.5) * maxSpeed;
                bug.type = 'fast';
                bug.health = 1;
            } else if (bugType === 'tough') {
                bug.style.backgroundColor = '#8b4513';
                bug.style.width = '40px';
                bug.style.height = '40px';
                const maxSpeed = Math.min(1.5, 1.0 + speedIncrease);
                bug.speedX = (Math.random() - 0.5) * maxSpeed;
                bug.speedY = (Math.random() - 0.5) * maxSpeed;
                bug.type = 'tough';
                bug.health = 2;
            } else {
                bug.style.backgroundColor = '#8b5a2b';
                bug.style.width = '35px';
                bug.style.height = '35px';
                const maxSpeed = Math.min(2.0, 1.5 + speedIncrease);
                bug.speedX = (Math.random() - 0.5) * maxSpeed;
                bug.speedY = (Math.random() - 0.5) * maxSpeed;
                bug.type = 'normal';
                bug.health = 1;
            }
            
            // 添加点击和触摸事件支持（增加点击区域）
            bug.addEventListener('click', (e) => {
                e.stopPropagation();
                this.attackCavityBug(bug);
            });
            bug.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.attackCavityBug(bug);
            });
            
            // 增加点击区域的视觉反馈
            bug.style.cursor = 'pointer';
            bug.style.transition = 'transform 0.2s ease';
            bug.addEventListener('mouseover', () => {
                bug.style.transform = 'scale(1.1)';
            });
            bug.addEventListener('mouseout', () => {
                bug.style.transform = 'scale(1)';
            });
            
            // 添加嘴巴元素
            const mouth = document.createElement('span');
            bug.appendChild(mouth);
            
            // 添加移动属性
            bug.wiggleDirection = 1;
            bug.wiggleCount = 0;
            
            this.toothModel.appendChild(bug);
            this.cavityBugs.push(bug);
        }
        
        // 随机生成道具
        if (Math.random() < 0.5) {
            this.generatePowerUp();
        }
        
        this.gameMessage.textContent = `击败所有${bugCount}只蛀牙虫！注意不同类型的蛀牙虫有不同的特点！`;
        
        // 启动蛀牙虫移动
        this.moveCavityBugs();
    }
    
    generatePowerUp() {
        const powerUp = document.createElement('div');
        powerUp.className = 'power-up';
        powerUp.style.left = `${Math.random() * (this.toothModel.offsetWidth - 30)}px`;
        powerUp.style.top = `${Math.random() * (this.toothModel.offsetHeight - 30)}px`;
        powerUp.style.width = '30px';
        powerUp.style.height = '30px';
        powerUp.style.borderRadius = '50%';
        powerUp.style.backgroundColor = '#ffd700';
        powerUp.style.display = 'flex';
        powerUp.style.alignItems = 'center';
        powerUp.style.justifyContent = 'center';
        powerUp.style.fontSize = '18px';
        powerUp.style.cursor = 'pointer';
        powerUp.style.animation = 'bounce 1s infinite alternate';
        powerUp.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
        
        // 随机选择道具类型
        const powerUpType = Math.random() < 0.5 ? 'score' : 'time';
        powerUp.textContent = powerUpType === 'score' ? '+' : '⏱';
        powerUp.type = powerUpType;
        
        // 添加点击和触摸事件支持
        powerUp.addEventListener('click', () => this.collectPowerUp(powerUp));
        powerUp.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.collectPowerUp(powerUp);
        });
        
        this.toothModel.appendChild(powerUp);
        this.powerUps.push(powerUp);
        
        // 30秒后自动消失
        setTimeout(() => {
            if (powerUp && powerUp.parentNode) {
                powerUp.remove();
                this.powerUps = this.powerUps.filter(p => p !== powerUp);
            }
        }, 30000);
    }
    
    collectPowerUp(powerUp) {
        if (!this.gameActive) return;
        
        this.playSound(this.winSound);
        
        // 创建收集效果
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = powerUp.style.left;
        effect.style.top = powerUp.style.top;
        effect.style.width = '40px';
        effect.style.height = '40px';
        effect.style.borderRadius = '50%';
        effect.style.backgroundColor = '#ffd700';
        effect.style.animation = 'explosion 0.5s ease-out forwards';
        this.toothModel.appendChild(effect);
        
        // 根据道具类型执行不同效果
        if (powerUp.type === 'score') {
            this.score += 50;
            this.gameMessage.textContent = '获得额外分数！';
        } else if (powerUp.type === 'time') {
            // 这里可以添加时间奖励逻辑
            this.gameMessage.textContent = '获得时间奖励！';
        }
        
        // 移除道具
        powerUp.remove();
        this.powerUps = this.powerUps.filter(p => p !== powerUp);
        
        // 更新分数显示
        this.updateDisplay();
        
        // 自动移除效果
        setTimeout(() => effect.remove(), 500);
    }
    
    moveCavityBugs() {
        if (!this.gameActive) return;
        
        if (!this.isPaused) {
            this.cavityBugs.forEach(bug => {
                if (!bug) return;
                
                let x = parseFloat(bug.style.left) || 0;
                let y = parseFloat(bug.style.top) || 0;
                
                // 更新位置
                x += bug.speedX;
                y += bug.speedY;
                
                // 边界检测和反弹，增加内边距，避免在边缘浮动
                const padding = 10;
                const bugWidth = bug.type === 'tough' ? 40 : (bug.type === 'fast' ? 30 : 35);
                const maxX = this.toothModel.offsetWidth - bugWidth - padding;
                const maxY = this.toothModel.offsetHeight - bugWidth - padding;
                
                let collided = false;
                
                if (x < padding || x > maxX) {
                    // 碰撞后改变路线和方向，不仅仅是简单的反弹
                    bug.speedX = -bug.speedX * (0.7 + Math.random() * 0.4); // 随机阻尼
                    bug.speedY += (Math.random() - 0.5) * 1.0; // 随机改变Y方向速度
                    x = Math.max(padding, Math.min(maxX, x));
                    collided = true;
                }
                
                if (y < padding || y > maxY) {
                    // 碰撞后改变路线和方向，不仅仅是简单的反弹
                    bug.speedY = -bug.speedY * (0.7 + Math.random() * 0.4); // 随机阻尼
                    bug.speedX += (Math.random() - 0.5) * 1.0; // 随机改变X方向速度
                    y = Math.max(padding, Math.min(maxY, y));
                    collided = true;
                }
                
                // 碰撞后增加一些额外的随机性，使移动轨迹更自然
                if (collided) {
                    // 随机改变速度方向
                    if (Math.random() < 0.3) {
                        if (bug.type === 'fast') {
                            bug.speedX += (Math.random() - 0.5) * 0.6;
                            bug.speedY += (Math.random() - 0.5) * 0.6;
                        } else if (bug.type === 'tough') {
                            bug.speedX += (Math.random() - 0.5) * 0.3;
                            bug.speedY += (Math.random() - 0.5) * 0.3;
                        } else {
                            bug.speedX += (Math.random() - 0.5) * 0.4;
                            bug.speedY += (Math.random() - 0.5) * 0.4;
                        }
                    }
                }
                
                // 随机改变速度，使移动更有趣和流畅
                if (Math.random() < 0.02) {
                    // 使用更平滑的速度变化，限制速度增长
                    const speedFactor = 1 + (this.level * 0.05); // 减少速度增长系数
                    
                    if (bug.type === 'fast') {
                        bug.speedX += (Math.random() - 0.5) * 0.6;
                        bug.speedY += (Math.random() - 0.5) * 0.6;
                        // 限制最大速度，确保后期不会太快
                        const maxSpeed = Math.min(2.5, 2 + (this.level * 0.1)); // 限制最大速度为2.5
                        bug.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, bug.speedX));
                        bug.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, bug.speedY));
                    } else if (bug.type === 'tough') {
                        bug.speedX += (Math.random() - 0.5) * 0.3;
                        bug.speedY += (Math.random() - 0.5) * 0.3;
                        // 限制最大速度
                        const maxSpeed = Math.min(1.5, 1 + (this.level * 0.05)); // 限制最大速度为1.5
                        bug.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, bug.speedX));
                        bug.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, bug.speedY));
                    } else {
                        bug.speedX += (Math.random() - 0.5) * 0.4;
                        bug.speedY += (Math.random() - 0.5) * 0.4;
                        // 限制最大速度
                        const maxSpeed = Math.min(2, 1.2 + (this.level * 0.08)); // 限制最大速度为2
                        bug.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, bug.speedX));
                        bug.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, bug.speedY));
                    }
                }
                
                // 添加一些随机性，使移动轨迹更自然
                if (Math.random() < 0.01) {
                    const speedFactor = 1 + (this.level * 0.05); // 减少速度增长系数
                    
                    if (bug.type === 'fast') {
                        bug.speedX = (Math.random() - 0.5) * 2 * speedFactor;
                        bug.speedY = (Math.random() - 0.5) * 2 * speedFactor;
                    } else if (bug.type === 'tough') {
                        bug.speedX = (Math.random() - 0.5) * 0.8 * speedFactor;
                        bug.speedY = (Math.random() - 0.5) * 0.8 * speedFactor;
                    } else {
                        bug.speedX = (Math.random() - 0.5) * 1.2 * speedFactor;
                        bug.speedY = (Math.random() - 0.5) * 1.2 * speedFactor;
                    }
                }
                
                // 增加摆动效果
                bug.wiggleCount++;
                if (bug.wiggleCount > 20) {
                    bug.wiggleDirection = -bug.wiggleDirection;
                    bug.wiggleCount = 0;
                }
                
                // 应用摆动变换
                const wiggleAngle = bug.wiggleDirection * 5;
                bug.style.transform = `rotate(${wiggleAngle}deg)`;
                
                // 更新样式
                bug.style.left = `${x}px`;
                bug.style.top = `${y}px`;
            });
            
            // 检查蛀牙虫是否存在时间过长
            this.checkCavityBugDuration();
        }
        
        // 继续移动，即使在暂停状态下也保持游戏循环
        requestAnimationFrame(() => this.moveCavityBugs());
    }
    
    checkCavityBugDuration() {
        // 根据关卡调整触发阈值
        const threshold = 3 + this.level;
        
        // 检查是否需要减少生命值
        if (this.cavityBugs.length > threshold) {
            // 检查是否在冷却时间内
            const now = Date.now();
            if (!this.lastLifeLossTime || now - this.lastLifeLossTime > 3000) { // 3秒冷却时间
                this.lives--;
                this.updateDisplay();
                this.lastLifeLossTime = now;
                
                // 播放生命值减少的音效
                this.playSound(this.buttonSound);
                
                // 创建生命值减少的视觉效果
                const lifeLossEffect = document.createElement('div');
                lifeLossEffect.style.position = 'absolute';
                lifeLossEffect.style.left = `${this.toothModel.offsetWidth / 2 - 50}px`;
                lifeLossEffect.style.top = `${this.toothModel.offsetHeight / 2 - 20}px`;
                lifeLossEffect.style.fontSize = '30px';
                lifeLossEffect.style.fontWeight = 'bold';
                lifeLossEffect.style.color = 'red';
                lifeLossEffect.style.animation = 'lifeLoss 1s ease-out forwards';
                lifeLossEffect.textContent = '-1生命';
                this.toothModel.appendChild(lifeLossEffect);
                
                // 添加生命值减少动画
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes lifeLoss {
                        0% { transform: scale(0); opacity: 1; }
                        50% { transform: scale(1.5); opacity: 0.8; }
                        100% { transform: scale(1); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                // 自动移除效果
                setTimeout(() => {
                    lifeLossEffect.remove();
                    style.remove();
                }, 1000);
                
                // 检查生命值是否耗尽
                if (this.lives <= 0) {
                    this.gameOver('生命值耗尽！游戏结束！');
                } else {
                    this.gameMessage.textContent = `蛀牙虫太多了！失去一条生命！还剩${this.lives}条生命！`;
                    
                    // 清除一半的蛀牙虫
                    const bugsToRemove = [...this.cavityBugs].sort(() => Math.random() - 0.5).slice(0, Math.floor(this.cavityBugs.length / 2));
                    bugsToRemove.forEach(bug => {
                        if (bug) {
                            // 创建爆炸效果
                            const explosion = document.createElement('div');
                            explosion.className = 'explosion';
                            explosion.style.left = bug.style.left;
                            explosion.style.top = bug.style.top;
                            this.toothModel.appendChild(explosion);
                            
                            // 移除蛀牙虫
                            bug.remove();
                        }
                    });
                    
                    // 更新蛀牙虫数组
                    this.cavityBugs = this.cavityBugs.filter(bug => !bugsToRemove.includes(bug));
                }
            } else if (!this.warningGiven) {
                // 给予警告
                this.gameMessage.textContent = `警告！蛀牙虫太多了！请尽快清除它们！`;
                this.warningGiven = true;
                
                // 3秒后重置警告状态
                setTimeout(() => {
                    this.warningGiven = false;
                }, 3000);
            }
        }
    }
    
    attackCavityBug(bug, isFromFoam = false) {
        if (!this.gameActive || this.isPaused) return;
        
        this.playSound(this.popSound);
        
        // 减少蛀牙虫生命值
        bug.health--;
        
        // 创建爆炸效果
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = bug.style.left;
        explosion.style.top = bug.style.top;
        this.toothModel.appendChild(explosion);
        
        // 检查是否击败蛀牙虫
        if (bug.health <= 0) {
            // 移除蛀牙虫
            bug.remove();
            this.cavityBugs = this.cavityBugs.filter(b => b !== bug);
            
            // 根据类型增加不同分数（牙膏泡沫枪击中只加1分）
            let scoreValue = isFromFoam ? 1 : 50;
            if (!isFromFoam) {
                if (bug.type === 'fast') {
                    scoreValue = 70;
                } else if (bug.type === 'tough') {
                    scoreValue = 100;
                }
            }
            
            this.score += scoreValue;
            this.updateDisplay();
            this.showScoreChange(scoreValue);
            
            // 增加连击数
            this.increaseCombo();
            
            // 检查是否击败所有蛀牙虫
            if (this.cavityBugs.length === 0) {
                this.playSound(this.winSound);
                this.gameMessage.textContent = '太棒了！所有蛀牙虫都被击败了！';
                setTimeout(() => this.nextLevel(), 1500);
            }
        } else {
            // 显示受伤效果
            bug.style.opacity = '0.6';
            setTimeout(() => {
                if (bug) bug.style.opacity = '1';
            }, 300);
        }
    }
    
    useToothpasteGun() {
        if (!this.gameActive || this.isPaused) return;
        
        // 检查是否正在使用牙膏泡沫枪
        if (this.isUsingToothpasteGun) {
            return;
        }
        
        // 检查分数是否足够
        const cost = 30; // 增加使用成本
        if (this.score < cost) {
            this.gameMessage.textContent = `分数不足！需要${cost}分才能使用牙膏泡沫枪。`;
            return;
        }
        
        // 扣除分数
        this.score -= cost;
        this.updateDisplay();
        this.showScoreChange(-cost);
        
        this.playSound(this.buttonSound);
        
        // 设置武器使用状态
        this.isUsingToothpasteGun = true;
        
        // 提示玩家选择释放位置
        this.gameMessage.textContent = '点击屏幕选择牙膏泡沫枪释放位置！';
        
        // 添加临时点击事件监听器
        const handleClick = (e) => {
            if (!this.gameActive || this.isPaused) return;
            
            // 移除事件监听器
            this.toothModel.removeEventListener('click', handleClick);
            this.toothModel.removeEventListener('touchstart', handleClick);
            
            // 获取点击位置
            const rect = this.toothModel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 创建牙膏泡沫效果，从点击位置向四周扩散（减少泡沫数量）
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const foam = document.createElement('div');
                    foam.className = 'foam';
                    foam.style.left = `${x}px`;
                    foam.style.top = `${y}px`;
                    foam.style.width = `${Math.random() * 8 + 8}px`; // 缩小泡沫大小
                    foam.style.height = `${Math.random() * 8 + 8}px`; // 缩小泡沫大小
                    foam.style.opacity = `${Math.random() * 0.5 + 0.5}`;
                    this.toothModel.appendChild(foam);
                    
                    // 泡沫移动（降低移动速度）
                    const angle = (Math.PI * 2 * i) / 6;
                    const speedX = Math.cos(angle) * 2; // 降低移动速度
                    const speedY = Math.sin(angle) * 2; // 降低移动速度
                    let currentX = x;
                    let currentY = y;
                    
                    const moveFoam = () => {
                        if (!foam || this.isPaused) return;
                        currentX += speedX;
                        currentY += speedY;
                        foam.style.left = `${currentX}px`;
                        foam.style.top = `${currentY}px`;
                        
                        // 检查是否接触到食物残渣
                        this.checkFoamCollision(foam);
                        
                        // 边界检测
                        if (currentX < 0 || currentX > this.toothModel.offsetWidth || currentY < 0 || currentY > this.toothModel.offsetHeight) {
                            foam.remove();
                            return;
                        }
                        
                        requestAnimationFrame(moveFoam);
                    };
                    moveFoam();
                    
                    // 自动移除泡沫
                    setTimeout(() => foam.remove(), 1500); // 缩短泡沫存在时间
                }, i * 150);
            }
            
            // 重置武器使用状态
            setTimeout(() => {
                this.isUsingToothpasteGun = false;
                this.gameMessage.textContent = '发射牙膏泡沫！';
            }, 100);
        };
        
        // 添加事件监听器
        this.toothModel.addEventListener('click', handleClick);
        this.toothModel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleClick(e);
        });
        
        // 设置超时，防止用户长时间不点击导致武器无法使用
        setTimeout(() => {
            if (this.isUsingToothpasteGun) {
                this.toothModel.removeEventListener('click', handleClick);
                this.toothModel.removeEventListener('touchstart', handleClick);
                this.isUsingToothpasteGun = false;
                this.gameMessage.textContent = '';
            }
        }, 5000);
    }
    
    checkFoamCollision(foam) {
        // 检查食物残渣碰撞
        this.foodResidues.forEach(residue => {
            if (!residue || !foam) return;
            
            const foamRect = foam.getBoundingClientRect();
            const residueRect = residue.getBoundingClientRect();
            
            // 简单的碰撞检测
            if (foamRect.left < residueRect.right && 
                foamRect.right > residueRect.left && 
                foamRect.top < residueRect.bottom && 
                foamRect.bottom > residueRect.top) {
                // 移除残渣（牙膏泡沫枪击中只加1分）
                this.removeFoodResidue(residue, true);
            }
        });
        
        // 检查蛀牙虫碰撞
        this.cavityBugs.forEach(bug => {
            if (!bug || !foam) return;
            
            const foamRect = foam.getBoundingClientRect();
            const bugRect = bug.getBoundingClientRect();
            
            // 简单的碰撞检测
            if (foamRect.left < bugRect.right && 
                foamRect.right > bugRect.left && 
                foamRect.top < bugRect.bottom && 
                foamRect.bottom > bugRect.top) {
                // 攻击蛀牙虫（牙膏泡沫枪击中只加1分）
                this.attackCavityBug(bug, true);
            }
        });
    }
    
    useToothbrushSword() {
        if (!this.gameActive || this.isPaused) return;
        
        // 检查是否正在使用牙刷剑
        if (this.isUsingToothbrushSword) {
            return;
        }
        
        // 检查分数是否足够
        const cost = 30;
        if (this.score < cost) {
            this.gameMessage.textContent = `分数不足！需要${cost}分才能使用牙刷剑。`;
            return;
        }
        
        // 扣除分数
        this.score -= cost;
        this.updateDisplay();
        this.showScoreChange(-cost);
        
        this.playSound(this.buttonSound);
        
        // 设置武器使用状态
        this.isUsingToothbrushSword = true;
        
        // 提示玩家选择释放方向
        this.gameMessage.textContent = '点击屏幕选择牙刷剑释放方向！';
        
        // 添加临时点击事件监听器
        const handleClick = (e) => {
            if (!this.gameActive || this.isPaused) return;
            
            // 移除事件监听器
            this.toothModel.removeEventListener('click', handleClick);
            this.toothModel.removeEventListener('touchstart', handleClick);
            
            // 获取点击位置
            const rect = this.toothModel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 计算牙刷剑的起始位置和方向
            const centerX = this.toothModel.offsetWidth / 2;
            const centerY = this.toothModel.offsetHeight / 2;
            const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
            
            // 创建牙刷剑效果
            const swordEffect = document.createElement('div');
            swordEffect.style.position = 'absolute';
            swordEffect.style.width = '150px';
            swordEffect.style.height = '12px';
            swordEffect.style.backgroundColor = '#ff6b6b';
            swordEffect.style.left = `${centerX}px`;
            swordEffect.style.top = `${centerY}px`;
            swordEffect.style.borderRadius = '6px';
            swordEffect.style.transformOrigin = 'left center';
            swordEffect.style.transform = `rotate(${angle}deg) scale(0)`;
            swordEffect.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.8)';
            swordEffect.style.animation = 'swordSwing 0.6s ease-out forwards';
            this.toothModel.appendChild(swordEffect);
            
            // 添加剑击动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes swordSwing {
                    0% { transform: rotate(${angle}deg) scale(0); opacity: 1; }
                    50% { transform: rotate(${angle + 90}deg) scale(1.5); opacity: 1; box-shadow: 0 0 20px rgba(255, 107, 107, 1); }
                    100% { transform: rotate(${angle + 180}deg) scale(0); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            
            // 检查剑击效果的碰撞
            let animationFrame;
            const checkCollision = () => {
                if (!swordEffect || this.isPaused) return;
                
                const swordRect = swordEffect.getBoundingClientRect();
                
                // 检查食物残渣碰撞
                this.foodResidues.forEach(residue => {
                    if (!residue) return;
                    
                    const residueRect = residue.getBoundingClientRect();
                    
                    // 简单的碰撞检测
                    if (swordRect.left < residueRect.right && 
                        swordRect.right > residueRect.left && 
                        swordRect.top < residueRect.bottom && 
                        swordRect.bottom > residueRect.top) {
                        // 移除残渣
                        this.removeFoodResidue(residue);
                    }
                });
                
                // 检查蛀牙虫碰撞
                this.cavityBugs.forEach(bug => {
                    if (!bug) return;
                    
                    const bugRect = bug.getBoundingClientRect();
                    
                    // 简单的碰撞检测
                    if (swordRect.left < bugRect.right && 
                        swordRect.right > bugRect.left && 
                        swordRect.top < bugRect.bottom && 
                        swordRect.bottom > bugRect.top) {
                        // 攻击蛀牙虫
                        this.attackCavityBug(bug);
                    }
                });
                
                animationFrame = requestAnimationFrame(checkCollision);
            };
            
            checkCollision();
            
            // 自动移除剑击效果
            setTimeout(() => {
                if (swordEffect) swordEffect.remove();
                style.remove();
                cancelAnimationFrame(animationFrame);
                
                // 重置武器使用状态
                this.isUsingToothbrushSword = false;
                this.gameMessage.textContent = '使用牙刷剑！';
            }, 600);
        };
        
        // 添加事件监听器
        this.toothModel.addEventListener('click', handleClick);
        this.toothModel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleClick(e);
        });
        
        // 设置超时，防止用户长时间不点击导致武器无法使用
        setTimeout(() => {
            if (this.isUsingToothbrushSword) {
                this.toothModel.removeEventListener('click', handleClick);
                this.toothModel.removeEventListener('touchstart', handleClick);
                this.isUsingToothbrushSword = false;
                this.gameMessage.textContent = '';
            }
        }, 5000);
    }
    
    useSuperCleaner() {
        if (!this.gameActive || this.isPaused) return;
        
        // 检查分数是否足够
        const cost = 50;
        if (this.score < cost) {
            this.gameMessage.textContent = `分数不足！需要${cost}分才能使用超级清洁剂。`;
            return;
        }
        
        // 扣除分数
        this.score -= cost;
        this.updateDisplay();
        this.showScoreChange(-cost);
        
        this.playSound(this.winSound);
        
        // 创建超级清洁效果
        const cleanerEffect = document.createElement('div');
        cleanerEffect.style.position = 'absolute';
        cleanerEffect.style.width = '100%';
        cleanerEffect.style.height = '100%';
        cleanerEffect.style.backgroundColor = 'rgba(155, 89, 182, 0.5)';
        cleanerEffect.style.borderRadius = '60px';
        cleanerEffect.style.animation = 'superClean 1s ease-out forwards';
        this.toothModel.appendChild(cleanerEffect);
        
        // 添加超级清洁动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes superClean {
                0% { transform: scale(0); opacity: 0.8; }
                50% { transform: scale(1.2); opacity: 0.6; }
                100% { transform: scale(1); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // 限制清除数量，只清除一部分食物残渣
        const maxCleanCount = Math.min(5 + this.level, this.foodResidues.length);
        let cleanedCount = 0;
        
        // 随机选择食物残渣进行清除
        const residuesToClean = [...this.foodResidues].sort(() => Math.random() - 0.5).slice(0, maxCleanCount);
        
        residuesToClean.forEach(residue => {
            if (residue) {
                // 创建爆炸效果
                const explosion = document.createElement('div');
                explosion.className = 'explosion';
                explosion.style.left = residue.style.left;
                explosion.style.top = residue.style.top;
                this.toothModel.appendChild(explosion);
                
                // 移除残渣
                residue.remove();
                cleanedCount++;
            }
        });
        
        // 更新食物残渣数组
        this.foodResidues = this.foodResidues.filter(r => !residuesToClean.includes(r));
        
        // 增加分数
        this.score += cleanedCount * 10;
        this.updateDisplay();
        
        // 自动移除清洁效果
        setTimeout(() => {
            if (this.isPaused) return;
            
            cleanerEffect.remove();
            style.remove();
            
            // 检查是否清除完所有残渣
            if (this.foodResidues.length === 0) {
                this.gameMessage.textContent = '食物残渣已清除！现在准备对抗蛀牙虫！';
                setTimeout(() => this.generateCavityBugs(), 1000);
            } else {
                this.gameMessage.textContent = `超级清洁剂清除了${cleanedCount}个食物残渣！`;
            }
        }, 1000);
        
        this.gameMessage.textContent = '使用超级清洁剂！';
    }
    
    nextLevel() {
        // 检查是否达到分数要求
        const requiredScore = this.getScoreRequirement();
        if (this.score < requiredScore) {
            // 分数不足，扣减生命值
            this.lives--;
            this.updateDisplay();
            
            // 播放生命值减少的音效
            this.playSound(this.buttonSound);
            
            // 创建生命值减少的视觉效果
            const lifeLossEffect = document.createElement('div');
            lifeLossEffect.style.position = 'absolute';
            lifeLossEffect.style.left = `${this.toothModel.offsetWidth / 2 - 50}px`;
            lifeLossEffect.style.top = `${this.toothModel.offsetHeight / 2 - 20}px`;
            lifeLossEffect.style.fontSize = '30px';
            lifeLossEffect.style.fontWeight = 'bold';
            lifeLossEffect.style.color = 'red';
            lifeLossEffect.style.animation = 'lifeLoss 1s ease-out forwards';
            lifeLossEffect.textContent = '-1生命';
            this.toothModel.appendChild(lifeLossEffect);
            
            // 添加生命值减少动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes lifeLoss {
                    0% { transform: scale(0); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            
            // 自动移除效果
            setTimeout(() => {
                lifeLossEffect.remove();
                style.remove();
            }, 1000);
            
            // 检查生命值是否耗尽
            if (this.lives <= 0) {
                this.gameOver('生命值耗尽！游戏结束！');
                return;
            }
            
            // 显示分数不足和扣生命值的提示
            this.gameMessage.textContent = `分数不足！需要${requiredScore}分才能进入下一关。扣除1次生命，还剩${this.lives}次生命！`;
            return;
        }
        
        // 根据得分给予评价
        let evaluation = '';
        if (this.score >= 300) {
            evaluation = '太棒了！你是口腔卫士！';
            this.playSound(this.winSound);
        } else if (this.score >= 200) {
            evaluation = '很好！继续保持！';
            this.playSound(this.winSound);
        } else {
            evaluation = '不错！再接再厉！';
            this.playSound(this.buttonSound);
        }
        
        // 检查是否达到分数要求
        this.checkScoreRequirement();
        
        this.gameMessage.textContent = `${evaluation}\n恭喜进入第${this.level + 1}关！`;
        
        this.level++;
        
        // 重置时间，每关减少5秒，最低30秒
        this.timeLeft = Math.max(30, 60 - (this.level - 1) * 5);
        
        // 重置游戏区域并开始新关卡
        setTimeout(() => {
            this.clearGameArea();
            this.generateFoodResidues();
            this.updateDisplay();
            this.startGameTimer();
        }, 2000);
    }
    
    updateDisplay() {
        this.levelDisplay.textContent = `关卡: ${this.level}`;
        this.scoreDisplay.textContent = `分数: ${this.score}`;
        this.timeDisplay.textContent = `时间: ${this.timeLeft}s`;
        this.livesDisplay.textContent = `生命: ${this.lives}`;
        
        // 更新分数要求显示
        if (this.scoreRequirementDisplay) {
            const nextRequirement = this.getScoreRequirement();
            this.scoreRequirementDisplay.textContent = `分数要求: ${nextRequirement}`;
        }
    }
    
    getScoreRequirement() {
        // 根据关卡计算阶段性分数要求，使用指数增长方式，使难度逐渐提高
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }
    
    checkScoreRequirement() {
        // 检查是否达到分数要求
        const requiredScore = this.getScoreRequirement();
        if (this.score >= requiredScore) {
            this.gameMessage.textContent = `太棒了！达到了本关卡的分数要求：${requiredScore}分！`;
        }
    }
    
    deductScore(amount) {
        // 扣分机制
        if (this.score >= amount) {
            this.score -= amount;
            this.updateDisplay();
            this.showScoreChange(-amount);
            this.gameMessage.textContent = `扣分！-${amount}分`;
        }
    }
    
    showScoreChange(amount) {
        // 显示分数变化
        const scoreChange = document.createElement('div');
        scoreChange.style.position = 'absolute';
        scoreChange.style.left = `${Math.random() * (this.toothModel.offsetWidth - 50) + 25}px`;
        scoreChange.style.top = `${Math.random() * (this.toothModel.offsetHeight - 50) + 25}px`;
        scoreChange.style.fontSize = '20px';
        scoreChange.style.fontWeight = 'bold';
        scoreChange.style.color = amount > 0 ? 'green' : 'red';
        scoreChange.style.animation = 'scoreChange 1s ease-out forwards';
        scoreChange.textContent = amount > 0 ? `+${amount}` : `${amount}`;
        this.toothModel.appendChild(scoreChange);
        
        // 添加分数变化动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scoreChange {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
                100% { transform: scale(1); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // 自动移除分数变化元素
        setTimeout(() => {
            scoreChange.remove();
            style.remove();
        }, 1000);
    }
    
    initToggleControls() {
        // 初始化排行榜和分数说明的切换控件
        const leaderboardIcon = document.getElementById('leaderboard-icon');
        const leaderboard = document.getElementById('leaderboard');
        const scoreGuideIcon = document.getElementById('score-guide-icon');
        const scoreGuide = document.getElementById('score-guide');
        
        // 点击排行榜图标显示/隐藏排行榜
        if (leaderboardIcon && leaderboard) {
            leaderboardIcon.addEventListener('click', () => {
                leaderboard.style.display = leaderboard.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        // 点击分数说明图标显示/隐藏分数说明
        if (scoreGuideIcon && scoreGuide) {
            scoreGuideIcon.addEventListener('click', () => {
                scoreGuide.style.display = scoreGuide.style.display === 'none' ? 'block' : 'none';
            });
        }
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new CavityBugGame();
});