// Hexadecimal Game - Vanilla JavaScript Implementation
// Adapted from Binary Game to teach hexadecimal (base-16) to decimal conversion
(function () {
    'use strict';
    // Game State
    const gameState = {
        score: 0,
        level: 1,
        timeElapsed: 0, // Changed from timeRemaining to timeElapsed
        problems: [],
        problemsCompleted: 0,
        isPlaying: false,
        isPaused: false,
        timerInterval: null,
        spawnInterval: null,
        timerInterval: null,
        spawnInterval: null,
        nextProblemId: 0,
        soundEnabled: true,
        audioContext: null
    };
    // Constants
    const MAX_PROBLEMS = 7; // Maximum problems that can be on screen at once
    // Hex values
    const HEX_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    // DOM Elements
    let gameRoot;
    let gameContainer;
    let problemContainer;
    let scoreElement;
    let levelElement;
    let linesLeftElement;
    // Initialize game
    function init() {
        gameRoot = document.getElementById('gameRoot');
        createStartScreen();
    }
    // Create start screen
    function createStartScreen() {
        // Render the empty game board first so it's visible in the background
        createGameBoard();

        // Add start screen modal on top
        const startModal = document.createElement('div');
        startModal.className = 'modal-container displayed start-screen-overlay';
        startModal.innerHTML = `
            <div class="modal transparent-modal">
                <h1 class="game-title">HEXADECIMAL GAME</h1>
                <p class="game-subtitle">Use your hexadecimal math skills to quickly solve as many puzzles as you can!</p>
                <button onclick="window.hexGame.startGame()" class="play-btn">PLAY GAME</button>
                <div class="instructions-link" onclick="window.hexGame.showTutorial()">INSTRUCTIONS</div>
            </div>
        `;
        gameRoot.appendChild(startModal);
    }

    // Show tutorial
    function showTutorial() {
        // Keep game board in background
        const startModal = document.querySelector('.modal-container');
        if (startModal) startModal.remove();

        const tutorialModal = document.createElement('div');
        tutorialModal.className = 'modal-container displayed start-screen-overlay';
        tutorialModal.innerHTML = `
            <div class="modal transparent-modal" style="max-width: 700px; text-align: left;">
                <h1 class="game-title" style="font-size: 2.5em; text-align: center;">HOW TO PLAY</h1>
                
                <h3 style="color: #fbab18; margin-bottom: 10px;">THE MISSION</h3>
                <p style="color: #e0e0e0; margin-bottom: 20px;">
                    Convert the <strong>Decimal Number</strong> (base-10) shown on the right into its <strong>Hexadecimal</strong> (base-16) equivalent.
                </p>

                <h3 style="color: #fbab18; margin-bottom: 10px;">CONTROLS</h3>
                <ul style="color: #e0e0e0; margin-bottom: 20px; line-height: 1.6;">
                    <li><strong>Left-Click</strong> a digit to cycle (0-9, A-F).</li>
                    <li><strong>Right-Click</strong> a digit to reset to 0.</li>
                    <li><strong>Digits</strong>: 0-9 represent values 0-9. <br>A=10, B=11, C=12, D=13, E=14, F=15.</li>
                </ul>

                <h3 style="color: #fbab18; margin-bottom: 10px;">SCORING</h3>
                <ul style="color: #e0e0e0; margin-bottom: 30px; line-height: 1.6;">
                    <li><strong>Level 1</strong>: 100 points per solve.</li>
                    <li><strong>Level 2+</strong>: 125 points per solve.</li>
                    <li><strong>Bonus</strong>: Clear the board for +250 points!</li>
                    <li><strong>Time</strong>: Solve basic problems quickly to prevent overflow.</li>
                </ul>

                <div style="text-align: center;">
                    <button onclick="window.hexGame.createStartScreen()" class="play-btn">BACK TO MENU</button>
                </div>
            </div>
        `;
        gameRoot.appendChild(tutorialModal);
    }
    // Start game
    function startGame() {
        gameState.score = 0;
        gameState.level = 1;
        gameState.timeElapsed = 0; // Start at 0, count up
        gameState.isPlaying = true;
        gameState.isPaused = false;
        gameState.problemsCompleted = 0;
        gameState.problems = [];
        gameState.nextProblemId = 0;
        gameState.nextProblemId = 0;

        // Remove start screen modal
        const startModal = document.querySelector('.modal-container');
        if (startModal) {
            startModal.remove();
        }

        // Game board is already rendered by createStartScreen
        // But we might need to reset it if retrying
        if (!document.querySelector('.gameboard')) {
            createGameBoard();
        } else {
            // Reset board state if needed (clear existing problems)
            const problemContainer = document.getElementById('problemContainer');
            if (problemContainer) problemContainer.innerHTML = '';

            // Re-initialize elements since we might have re-created the board or just cleared it
            if (typeof updateLinesLeft === 'function') {
                updateLinesLeft();
            }
        }

        startLevel();
        startTimer();
    }
    // Start a new level
    function startLevel() {
        // Clear any existing spawn interval
        if (gameState.spawnInterval) {
            clearInterval(gameState.spawnInterval);
        }
        // Start with 2 initial problems
        spawnProblem();
        setTimeout(() => spawnProblem(), 800); // Longer delay so both appear at bottom
        // Calculate spawn rate: Math.max((6.2 - level * 0.8) * 2, 6) seconds
        const secsBetweenProblems = Math.max((6.2 - (gameState.level - 1) * 0.8) * 2, 6);
        // Start spawning new problems
        gameState.spawnInterval = setInterval(() => {
            if (!gameState.isPaused && gameState.isPlaying) {
                spawnIfNeeded();
            }
        }, secsBetweenProblems * 1000);
    }
    // Spawn a problem if needed
    function spawnIfNeeded() {
        const problemsRequired = getProblemsRequired(gameState.level);
        const totalProblemsSpawned = gameState.problemsCompleted + gameState.problems.length;
        // Check if we've reached the required problems for this level
        if (totalProblemsSpawned < problemsRequired) {
            // Check if table is full (MAX_PROBLEMS)
            if (gameState.problems.length >= MAX_PROBLEMS) {
                // Game Over - table is full!
                gameOver();
            } else {
                spawnProblem();
            }
        }
    }
    // Get problems required for a level: 15 + level * 5
    function getProblemsRequired(level) {
        return 15 + (level - 1) * 5;
    }
    // Spawn a new problem
    function spawnProblem() {
        const maxValue = Math.min(65535, 15 + (gameState.level * 50));
        const targetDecimal = Math.floor(Math.random() * maxValue) + 1;
        // Check last problem to prevent streaks
        const lastProblem = gameState.problems[gameState.problems.length - 1];
        const lastWasReverse = lastProblem && lastProblem.isReverse;

        // Determine if this should be a reverse problem (hex to decimal)
        // 25% chance (1/4), but NEVER two in a row
        let isReverse = false;
        if (!lastWasReverse && Math.random() < 0.25) {
            isReverse = true;
        }
        const newProblem = {
            id: gameState.nextProblemId++,
            targetDecimal: targetDecimal,
            userHex: [0, 0, 0], // Three hex digits (256, 16, 1)
            userDecimal: '', // For reverse problems
            isReverse: isReverse,
            solved: false,
            isDisappearing: false,
            isNew: true
        };
        gameState.problems.push(newProblem);
        renderProblems();
        // Trigger drop-in animation
        setTimeout(() => {
            newProblem.isNew = false; // Mark as no longer new
            const problemElement = document.querySelector(`[data-problem-id="${newProblem.id}"]`);
            if (problemElement) {
                problemElement.classList.add('visible');
            }
        }, 50);
    }
    // Create game board
    function createGameBoard() {
        gameRoot.innerHTML = `
            <div class="game-container">
                <div class="gameboard window">
                    <div class="hex-guide">
                        <div class="numbers">
                            <div class="number">256</div>
                            <div class="number">16</div>
                            <div class="number">1</div>
                        </div>
                    </div>
                    <div class="problems">
                        <div class="hex-guide">
                            <div class="numbers">
                                <div class="number"></div>
                                <div class="number"></div>
                                <div class="number"></div>
                            </div>
                        </div>
                        <div class="problem-container" id="problemContainer"></div>
                    </div>
                    <div class="hex-guide">
                        <div class="numbers">
                            <div class="number">256</div>
                            <div class="number">16</div>
                            <div class="number">1</div>
                        </div>
                    </div>
                </div>
                <div class="menu-bar window">
                    <div class="gameStats">
                        <div class="item">
                            <span class="label">Score</span>
                            <span class="value" id="scoreValue">0</span>
                        </div>
                        <div class="item">
                            <span class="label">Level</span>
                            <span class="value" id="levelValue">1</span>
                        </div>
                        <div class="item">
                            <span class="label">Lines Left</span>
                            <span class="value" id="linesLeftValue">7</span>
                        </div>
                    </div>
                    <div class="buttons">
                        <button id="soundToggleBtn" onclick="window.hexGame.toggleSound()">Sound: On</button>
                        <button onclick="window.hexGame.pauseGame()">Pause</button>
                        <button onclick="window.hexGame.endGame()">Quit</button>
                    </div>
                </div>
            </div>
            <div class="score-toast hidden" id="scoreToast">+100</div>
        `;
        problemContainer = document.getElementById('problemContainer');
        scoreElement = document.getElementById('scoreValue');
        levelElement = document.getElementById('levelValue');
        linesLeftElement = document.getElementById('linesLeftValue');
        updateLinesLeft();
    }
    // Generate problems for current level
    // This function is no longer used after refactoring to dynamic spawning
    /*
    function generateProblems() {
        gameState.problems = [];
        // Progressive difficulty - can go up to 65535 (4 hex digits)
        const maxValue = Math.min(65535, 15 + (gameState.level * 50));
        for (let i = 0; i < gameState.problemsPerLevel; i++) {
            const targetDecimal = Math.floor(Math.random() * maxValue) + 1;
            gameState.problems.push({
                id: Date.now() + i, // Unique ID
                targetDecimal: targetDecimal,
                userHex: [0, 0], // Two hex digits
                solved: false,
                isDisappearing: false,
                isNew: true // Mark as new for drop-in animation
            });
        }
        renderProblemsWithStagger();
    }
    */
    // Render all problems
    function renderProblems() {
        if (!problemContainer) return;

        // Save focus state
        const activeElement = document.activeElement;
        let focusedProblemId = null;
        let selectionStart = 0;
        let selectionEnd = 0;

        if (activeElement && activeElement.tagName === 'INPUT') {
            const problemId = activeElement.getAttribute('data-problem-id');
            if (problemId) {
                focusedProblemId = parseInt(problemId);
                selectionStart = activeElement.selectionStart;
                selectionEnd = activeElement.selectionEnd;
            }
        }

        problemContainer.innerHTML = '';
        // Render all problems (including disappearing ones for animation)
        gameState.problems.forEach((problem, index) => {
            const problemElement = createProblemElement(problem, index);
            problemContainer.appendChild(problemElement);
        });

        updateLinesLeft();

        // Restore focus state
        if (focusedProblemId !== null) {
            const input = document.querySelector(`input[data-problem-id="${focusedProblemId}"]`);
            if (input) {
                input.focus();
                // Restore cursor position
                try {
                    input.setSelectionRange(selectionStart, selectionEnd);
                } catch (e) {
                    console.error("Could not set selection range", e);
                }
            }
        }
    }
    // Update lines left display
    function updateLinesLeft() {
        if (!linesLeftElement) return;
        const problemsRequired = getProblemsRequired(gameState.level);
        const linesLeft = problemsRequired - gameState.problemsCompleted;
        linesLeftElement.textContent = linesLeft;
        linesLeftElement.classList.add('updating');
        setTimeout(() => linesLeftElement.classList.remove('updating'), 200);
    }
    // Render problems with staggered drop-in animation
    // This function is no longer used after refactoring to dynamic spawning
    /*
    function renderProblemsWithStagger() {
        problemContainer.innerHTML = '';
        gameState.problems.forEach((problem, index) => {
            const problemElement = createProblemElement(problem, index);
            problemContainer.appendChild(problemElement);
            // Stagger the appearance
            if (problem.isNew) {
                setTimeout(() => {
                    problem.isNew = false;
                    problemElement.classList.add('visible');
                }, index * 150); // 150ms delay between each
            }
        });
    }
    */
    // Create a single problem element
    function createProblemElement(problem, index) {
        const div = document.createElement('div');
        div.className = 'problem';
        div.style.transform = `translateY(-${index * 100}%)`;
        div.setAttribute('data-problem-id', problem.id);
        // Add disappearing class if problem is being removed
        if (problem.isDisappearing) {
            div.classList.add('disappearing');
        }
        // Add new class for drop-in animation
        if (problem.isNew) {
            div.classList.add('new-problem');
        }
        const hexValue = decimalToHex(problem.targetDecimal);
        const isDisabled = problem.solved;
        if (problem.isReverse) {
            // Reverse problem: Hex given, find decimal
            div.innerHTML = `
                <div class="problem-wrapper">
                    <div class="sub-wrapper">
                        <div class="hex-digits">
                            <button class="hex-digit active" disabled>
                                ${hexValue[0]}
                            </button>
                            <button class="hex-digit active" disabled>
                                ${hexValue[1]}
                            </button>
                            <button class="hex-digit active" disabled>
                                ${hexValue[2]}
                            </button>
                        </div>
                        <div class="equals">=</div>
                        <input type="text" 
                               class="decimal-input ${problem.solved ? 'correct' : ''}" 
                               value="${problem.userDecimal}"
                               placeholder="?"
                               ${isDisabled ? 'disabled' : ''}
                               data-problem-id="${problem.id}"
                               maxlength="5"
                               oninput="window.hexGame.onDecimalInput(${problem.id}, this.value)" />
                    </div>
                </div>
            `;
        } else {
            // Normal problem: Decimal given, find hex
            div.innerHTML = `
                <div class="problem-wrapper">
                    <div class="sub-wrapper">
                        <div class="hex-digits">
                            <button class="hex-digit ${problem.userHex[0] > 0 ? 'active' : ''}" 
                                    data-problem="${problem.id}" 
                                    data-digit="0"
                                    ${isDisabled ? 'disabled' : ''}
                                    onclick="window.hexGame.cycleHexDigit(${problem.id}, 0)"
                                    oncontextmenu="window.hexGame.resetHexDigit(${problem.id}, 0); return false;">
                                ${HEX_CHARS[problem.userHex[0]]}
                            </button>
                            <button class="hex-digit ${problem.userHex[1] > 0 ? 'active' : ''}" 
                                    data-problem="${problem.id}" 
                                    data-digit="1"
                                    ${isDisabled ? 'disabled' : ''}
                                    onclick="window.hexGame.cycleHexDigit(${problem.id}, 1)"
                                    oncontextmenu="window.hexGame.resetHexDigit(${problem.id}, 1); return false;">
                                ${HEX_CHARS[problem.userHex[1]]}
                            </button>
                            <button class="hex-digit ${problem.userHex[2] > 0 ? 'active' : ''}" 
                                    data-problem="${problem.id}" 
                                    data-digit="2"
                                    ${isDisabled ? 'disabled' : ''}
                                    onclick="window.hexGame.cycleHexDigit(${problem.id}, 2)"
                                    oncontextmenu="window.hexGame.resetHexDigit(${problem.id}, 2); return false;">
                                ${HEX_CHARS[problem.userHex[2]]}
                            </button>
                        </div>
                        <div class="equals">=</div>
                        <div class="decimal-value ${problem.solved ? 'correct' : ''}">
                            ${problem.targetDecimal}
                        </div>
                    </div>
                </div>
            `;
        }
        return div;
    }
    // Cycle hex digit (0 -> 1 -> 2 -> ... -> F -> 0)
    function cycleHexDigit(problemId, digitIndex) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        const problem = gameState.problems.find(p => p.id === problemId);
        if (!problem || problem.solved) return;
        // Cycle to next hex value
        problem.userHex[digitIndex] = (problem.userHex[digitIndex] + 1) % 16;
        // Check if answer is correct
        checkAnswer(problem);
        // Re-render problems
        renderProblems();
    }
    // Reset hex digit to 0 (backspace functionality)
    function resetHexDigit(problemId, digitIndex) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        const problem = gameState.problems.find(p => p.id === problemId);
        if (!problem || problem.solved) return;
        // Reset to 0
        problem.userHex[digitIndex] = 0;
        // Re-render problems
        renderProblems();
    }
    // Handle decimal input for reverse problems
    function onDecimalInput(problemId, value) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        const problem = gameState.problems.find(p => p.id === problemId);
        if (!problem || problem.solved || !problem.isReverse) return;
        // Only allow digits
        const cleanValue = value.replace(/[^0-9]/g, '');
        problem.userDecimal = cleanValue;
        // Check if answer is correct
        if (cleanValue !== '' && parseInt(cleanValue) === problem.targetDecimal) {
            checkAnswer(problem);
        } else {
            // Re-render and restore focus
            renderProblems();
            // Restore focus to the input field after rendering
            setTimeout(() => {
                const inputElement = document.querySelector(`input[data-problem-id="${problemId}"]`);
                if (inputElement && !problem.solved) {
                    inputElement.focus();
                    // Set cursor to end of input
                    inputElement.setSelectionRange(cleanValue.length, cleanValue.length);
                }
            }, 0);
        }
    }
    // Check if user's answer is correct
    function checkAnswer(problem) {
        let isCorrect = false;
        if (problem.isReverse) {
            // Reverse problem: check decimal input
            isCorrect = problem.userDecimal !== '' && parseInt(problem.userDecimal) === problem.targetDecimal;
        } else {
            // Normal problem: check hex input (3 digits)
            const userDecimal = problem.userHex[0] * 256 + problem.userHex[1] * 16 + problem.userHex[2];
            isCorrect = userDecimal === problem.targetDecimal;
        }
        if (isCorrect) {
            problem.solved = true;
            problem.isDisappearing = true;
            gameState.problemsCompleted++;

            // Score handling: 100 points for Level 1, 125 points for Level 2+
            const pointsToAdd = gameState.level >= 2 ? 125 : 100;

            addScore(pointsToAdd);
            showScoreToast('+' + pointsToAdd);
            playSuccessSound();

            // Trigger disappear animation
            const problemElement = document.querySelector(`[data-problem-id="${problem.id}"]`);
            if (problemElement) {
                problemElement.classList.add('disappearing');
            }
            // Remove from array and re-render after animation
            setTimeout(() => {
                gameState.problems = gameState.problems.filter(p => p.id !== problem.id);
                renderProblems();
                // If no problems left, Board Clear Bonus!
                if (gameState.problems.length === 0) {
                    // Check if level is complete first
                    const problemsRequired = getProblemsRequired(gameState.level);
                    const totalProblemsSpawned = gameState.problemsCompleted + gameState.problems.length; // problems.length is 0 here

                    // Only trigger board clear if we are NOT finishing the level
                    // Actually, if we finish the level, we might still want the points, 
                    // but we shouldn't spawn new problems if level is done.

                    if (gameState.problemsCompleted >= problemsRequired) {
                        levelComplete();
                        return; // Stop here, level is done
                    }

                    // Board Clear Bonus
                    addScore(250);
                    showScoreToast('Board Clear! +250');
                    playSuccessSound(); // Extra sound for bonus? Maybe just the normal one is fine for now

                    // Spawn 2-4 new problems
                    const numToSpawn = Math.floor(Math.random() * 3) + 2; // Random 2, 3, or 4

                    // Spawn them with slight delay for visuals
                    let spawnedCount = 0;

                    const spawnLoop = () => {
                        const currentTotal = gameState.problemsCompleted + gameState.problems.length;
                        if (currentTotal < problemsRequired && spawnedCount < numToSpawn) {
                            spawnProblem();
                            spawnedCount++;
                            setTimeout(spawnLoop, 300);
                        }
                    };

                    spawnLoop();
                } else {
                    // Ensure we check for level complete even if board isn't empty
                    // (Though usually level complete happens when board is empty or filled)
                    // Wait, logic check: problemsCompleted increases when solved.
                    // If we solve one and there are others left, we still might be done.

                    const problemsRequired = getProblemsRequired(gameState.level);
                    if (gameState.problemsCompleted >= problemsRequired) {
                        levelComplete();
                    }
                }
            }, 800);
        }
    }
    // Add score with satisfying counting animation
    function addScore(points) {
        const startScore = gameState.score;
        gameState.score += points;
        const endScore = gameState.score;

        // Cancel any existing animation
        if (gameState.scoreAnimationId) {
            cancelAnimationFrame(gameState.scoreAnimationId);
        }

        const duration = 1000; // 1 second animation
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart for satisfying slow down at end
            // 1 - pow(1 - x, 4)
            const ease = 1 - Math.pow(1 - progress, 4);

            const currentVal = Math.floor(startScore + (points * ease));
            scoreElement.textContent = currentVal;

            if (progress < 1) {
                gameState.scoreAnimationId = requestAnimationFrame(animate);
            } else {
                scoreElement.textContent = endScore;
                gameState.scoreAnimationId = null;
            }
        }

        gameState.scoreAnimationId = requestAnimationFrame(animate);

        scoreElement.classList.add('updating');
        setTimeout(() => scoreElement.classList.remove('updating'), 200);
    }
    // Show score toast
    function showScoreToast(text) {
        const toast = document.getElementById('scoreToast');
        if (!toast) return;
        toast.textContent = text;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 1000);
    }
    // Level complete
    function levelComplete() {
        // Clear spawn interval
        if (gameState.spawnInterval) {
            clearInterval(gameState.spawnInterval);
        }
        // Clear all remaining problems
        gameState.problems = [];
        renderProblems();
        // Show level complete modal
        showLevelCompleteModal();
    }
    // Show level complete modal
    function showLevelCompleteModal() {
        const modalHtml = `
            <div class="modal-container displayed">
                <div class="modal">
                    <h1>Level ${gameState.level} Complete!</h1>
                    <div class="modal-body">
                        <div class="final-score">
                            <div class="score-item">
                                <span>Score</span>
                                <span>${gameState.score}</span>
                            </div>
                            <div class="score-item">
                                <span>Problems Solved</span>
                                <span>${gameState.problemsCompleted}</span>
                            </div>
                        </div>
                        <button onclick="window.hexGame.startNextLevel()">Start Level ${gameState.level + 1}</button>
                    </div>
                </div>
            </div>
        `;
        // Add modal to game container
        const existingModal = document.querySelector('.modal-container');
        if (existingModal) {
            existingModal.remove();
        }
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        gameRoot.appendChild(modalDiv.firstElementChild);
    }
    // Start next level
    function startNextLevel() {
        // Remove modal
        const modal = document.querySelector('.modal-container');
        if (modal) {
            modal.remove();
        }
        gameState.level++;
        gameState.problemsCompleted = 0;
        levelElement.textContent = gameState.level;
        updateLinesLeft();
        startLevel();
    }
    // Pause game
    function pauseGame() {
        if (!gameState.isPlaying) return;
        gameState.isPaused = !gameState.isPaused;
        const container = document.getElementById('problemContainer');
        if (container) {
            container.classList.toggle('paused');
        }
        const pauseButton = event.target;
        pauseButton.textContent = gameState.isPaused ? 'Resume' : 'Pause';
    }
    // End game
    function endGame() {
        if (!gameState.isPlaying) return;
        if (confirm('Are you sure you want to quit?')) {
            gameOver();
        }
    }
    // Game over
    function gameOver() {
        gameState.isPlaying = false;
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        if (gameState.spawnInterval) {
            clearInterval(gameState.spawnInterval);
            gameState.spawnInterval = null;
        }
        saveScore(gameState.score);
        showGameOverScreen();
    }

    // Save score to local storage
    function saveScore(score) {
        try {
            const scores = JSON.parse(localStorage.getItem('hexGameScores')) || [];
            scores.push({
                score: score,
                date: new Date().toLocaleDateString()
            });

            // Sort by score descending
            scores.sort((a, b) => b.score - a.score);

            localStorage.setItem('hexGameScores', JSON.stringify(scores));
        } catch (e) {
            console.error("Failed to save score:", e);
            // Reset storage if corrupted
            try {
                localStorage.removeItem('hexGameScores');
            } catch (e2) { }
        }
    }

    // Get high scores
    function getHighScores() {
        try {
            return JSON.parse(localStorage.getItem('hexGameScores')) || [];
        } catch (e) {
            console.error("Failed to load scores:", e);
            return [];
        }
    }

    // Show game over screen with leaderboard
    function showGameOverScreen() {
        const problemsRequired = getProblemsRequired(gameState.level);
        const highScores = getHighScores();

        // Take top 10 for display (or all if user really wants, but 10 is usually better UI)
        // User said "alle vorherigen scores", implies a scrollable list if many.
        // Let's make the list scrollable in CSS.

        let leaderboardHtml = highScores.map((s, index) => `
            <div class="score-item ${s.score === gameState.score && index === highScores.findIndex(x => x.score === gameState.score && x.date === s.date) ? 'current-score' : ''}">
                <span class="rank">${index + 1}.</span>
                <span class="score-val">${s.score}</span>
                <span class="date">${s.date}</span>
            </div>
        `).join('');
        gameRoot.innerHTML = `
            <div class="modal-container displayed">
                <div class="modal">
                    <h1>Game Over</h1>
                    <div class="modal-body">
                        <div class="final-score">
                            <div class="score-item">
                                <span>Final Score</span>
                                <span>${gameState.score}</span>
                            </div>
                            <div class="score-item">
                                <span>Level Reached</span>
                                <span>${gameState.level}</span>
                            </div>
                            <div class="score-item">
                                <span>Problems Solved</span>
                                <span>${gameState.problemsCompleted}</span>
                            </div>
                        </div>
                        
                        <div class="leaderboard-section">
                            <h3>High Scores</h3>
                            <div class="leaderboard-list">
                                ${leaderboardHtml}
                            </div>
                        </div>

                        <div class="action-buttons">
                            <button onclick="window.hexGame.startGame()">Play Again</button>
                            <button onclick="window.hexGame.createStartScreen()">Main Menu</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    // Helper: Convert decimal to hex string (3 digits)
    function decimalToHex(decimal) {
        return decimal.toString(16).toUpperCase().padStart(3, '0');
    }
    // Helper: Convert hex string to decimal
    function hexToDecimal(hexString) {
        return parseInt(hexString, 16);
    }
    // Audio System
    function initAudio() {
        if (!gameState.audioContext) {
            gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (gameState.audioContext.state === 'suspended') {
            gameState.audioContext.resume();
        }
    }

    function toggleSound() {
        gameState.soundEnabled = !gameState.soundEnabled;
        const btn = document.getElementById('soundToggleBtn');
        if (btn) {
            btn.textContent = gameState.soundEnabled ? 'Sound: On' : 'Sound: Off';
        }
        // Initialize audio context on user interaction if needed
        initAudio();
    }

    function playSuccessSound() {
        if (!gameState.soundEnabled) return;
        initAudio(); // Ensure context is ready

        const ctx = gameState.audioContext;
        const now = ctx.currentTime;

        // Main tone (Fundamental)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1);

        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        // Overtone (Metallic "Tine" sound)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        // Non-integer multiple creates metallic inharmonicity
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880 * 2.5, now); // ~2200Hz

        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15); // Faster decay

        osc1.start(now);
        osc1.stop(now + 0.4);

        osc2.start(now);
        osc2.stop(now + 0.15);
    }

    // Export public API
    window.hexGame = {
        init,
        startGame,
        createStartScreen,
        showTutorial,
        cycleHexDigit,
        resetHexDigit,
        onDecimalInput,
        pauseGame,
        endGame,
        startNextLevel,
        toggleSound, // Exported
        renderProblems // For debugging
    };
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
