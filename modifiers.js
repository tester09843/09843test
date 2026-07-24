const Modifiers = {
    active: new Set(),
    timerInterval: null, // Tracks active timer

    definitions: {
        classic: {
            cloaked: {
                name: "Cloaked",
                description: "Hides the Type column.",
                onStart: () => {
                    const typeHeader = document.querySelector("#guessTable th:nth-child(2)");
                    if (typeHeader) typeHeader.style.display = "none";
                },
                onGuess: (row) => {
                    const typeCell = row.querySelector(".cell-type") || row.children[1];
                    if (typeCell) typeCell.remove();
                },
                onReset: () => {
                    const typeHeader = document.querySelector("#guessTable th:nth-child(2)");
                    if (typeHeader) typeHeader.style.display = "";
                }
            },
            securityProtocol: {
                name: "Security Protocol (60s)",
                description: "Guess the enemy within 60 seconds or fail.",
                onStart: function() {
                    Modifiers.startTimer(60);
                },
                onReset: function() {
                    Modifiers.clearTimer();
                }
            }
        },

        hell: {
            cloaked: {
                name: "Cloaked",
                description: "Hides the Type column.",
                onStart: () => {
                    const typeHeader = document.querySelector("#guessTable th:nth-child(2)");
                    if (typeHeader) typeHeader.style.display = "none";
                },
                onGuess: (row) => {
                    const typeCell = row.querySelector(".cell-type") || row.children[1];
                    if (typeCell) typeCell.remove();
                },
                onReset: () => {
                    const typeHeader = document.querySelector("#guessTable th:nth-child(2)");
                    if (typeHeader) typeHeader.style.display = "";
                }
            },
            jammedRadar: {
                name: "Jammed Radar",
                description: "Automatically submits a random guess on wave start.",
                onStart: () => {
                    if (typeof window.makeRandomGuess === "function") {
                        window.makeRandomGuess();
                    }
                },
                onReset: () => {}
            },
            securityProtocol: {
                name: "Security Protocol (01:00)",
                description: "Guess the enemy within 60 seconds or fail.",
                onStart: function() {
                    Modifiers.startTimer(60);
                },
                onReset: function() {
                    Modifiers.clearTimer();
                }
            }
        }
    },
    
    startTimer(seconds) {
        this.clearTimer();
        let timeLeft = seconds;

        const formatTime = (totalSeconds) => {
            const minutes = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            const paddedMinutes = String(minutes).padStart(2, '0');
            const paddedSeconds = String(secs).padStart(2, '0');
            return `${paddedMinutes}:${paddedSeconds}`;
        };

        const updateTimerDisplay = () => {
            const tag = document.querySelector(".modifier-tag.security-protocol");
            if (tag) {
                tag.innerText = `SECURITY PROTOCOL (${formatTime(timeLeft)})`;
            }
        };

        updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                this.clearTimer();
                if (typeof window.handleTimerTimeout === "function") {
                    window.handleTimerTimeout();
                }
            }
        }, 1000);
    },

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    currentMode: "hell",

    evaluateWave(waveNumber, mode = "hell") {
        this.currentMode = mode;
        const categoryPool = this.definitions[mode] || {};

        const waveModifierCounts = {
            hell: { 1: 1, 2: 2 },
            classic: { 1: 0, 2: 1 }
        };

        const targetCount = (waveModifierCounts[mode] && waveModifierCounts[mode][waveNumber]) || 1;
        const availableKeys = Object.keys(categoryPool);

        const selectedKeys = [];
        const pool = [...availableKeys];

        while (selectedKeys.length < targetCount && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            selectedKeys.push(pool.splice(randomIndex, 1)[0]);
        }

        selectedKeys.forEach(key => this.enable(key, mode));
    },

    enable(key, mode = this.currentMode) {
        const def = this.definitions[mode] && this.definitions[mode][key];
        if (def && !this.active.has(key)) {
            this.active.add(key);
            def.onStart();
            this.renderBadges();
        }
    },

    onGuess(row, guessedEnemy, secretEnemy) {
        const categoryPool = this.definitions[this.currentMode] || {};
        this.active.forEach(key => {
            if (categoryPool[key] && categoryPool[key].onGuess) {
                categoryPool[key].onGuess(row, guessedEnemy, secretEnemy);
            }
        });

        // Stop timer on correct guess
        if (guessedEnemy.name === secretEnemy.name) {
            this.clearTimer();
        }
    },

    afterGuess() {
        const categoryPool = this.definitions[this.currentMode] || {};
        this.active.forEach(key => {
            if (categoryPool[key] && categoryPool[key].afterGuess) {
                categoryPool[key].afterGuess();
            }
        });
    },

    resetAll() {
        this.clearTimer();
        const categoryPool = this.definitions[this.currentMode] || {};
        this.active.forEach(key => {
            if (categoryPool[key] && categoryPool[key].onReset) {
                categoryPool[key].onReset();
            }
        });
        this.active.clear();
        this.renderBadges();
    },

    renderBadges() {
        const listContainer = document.getElementById("modifiersList");
        if (!listContainer) return;

        listContainer.innerHTML = "";

        if (this.active.size === 0) {
            listContainer.innerHTML = '<span class="modifier-tag">None</span>';
            return;
        }

        const categoryPool = this.definitions[this.currentMode] || {};

        this.active.forEach(key => {
            const def = categoryPool[key];
            if (def) {
                const tag = document.createElement("span");
                const classKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

                tag.className = `modifier-tag ${classKey}`;
                tag.innerText = def.name;
                listContainer.appendChild(tag);
            }
        });
    }
};
