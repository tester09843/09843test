class ModifierEngine {
    constructor(modeName, definitions, waveCounts) {
        this.modeName = modeName;
        this.definitions = definitions;
        this.waveCounts = waveCounts;
        this.active = new Set();
        this.timerInterval = null;
        this.buffedModifier = null;
    }

    startTimer(seconds) {
        this.clearTimer();
        let timeLeft = seconds;

        const formatTime = (totalSeconds) => {
            const minutes = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        const updateTimerDisplay = () => {
            const tag = document.querySelector(".modifier-tag.security-protocol");
            if (tag) tag.innerText = `SECURITY PROTOCOL (${formatTime(timeLeft)})`;
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
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    evaluateWave(waveNumber) {
        const targetCount = this.waveCounts[waveNumber] ?? 1;
        let pool = Object.keys(this.definitions);

        // Vitarage buffs another active modifier, so it can never be the sole
        // modifier selected for a wave — exclude it when only 1 slot is available.
        if (targetCount <= 1) {
            pool = pool.filter(key => key !== "vitarage");
        }

        const selectedKeys = [];
        while (selectedKeys.length < targetCount && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            selectedKeys.push(pool.splice(randomIndex, 1)[0]);
        }

        // Pass 1: activate every modifier for this wave before any of them can act.
        // This ensures a modifier whose onStart triggers a guess (e.g. Jammed Radar)
        // can never fire before another modifier (e.g. Cloaked) is active.
        selectedKeys.forEach(key => {
            const def = this.definitions[key];
            if (def && !this.active.has(key)) {
                this.active.add(key);
            }
        });
        this.renderBadges();

        // Pass 2: now that all modifiers for this wave are active, run their onStart hooks.
        selectedKeys.forEach(key => {
            const def = this.definitions[key];
            if (def && def.onStart) {
                def.onStart(this);
            }
        });
    }

    enable(key) {
        const def = this.definitions[key];
        if (def && !this.active.has(key)) {
            this.active.add(key);
            if (def.onStart) def.onStart(this);
            this.renderBadges();
        }
    }

    onGuess(row, guessedEnemy, secretEnemy) {
        this.active.forEach(key => {
            if (this.definitions[key]?.onGuess) {
                this.definitions[key].onGuess(row, guessedEnemy, secretEnemy);
            }
        });

        if (guessedEnemy.name === secretEnemy.name) {
            this.clearTimer();
        }
    }

    afterGuess() {
        this.active.forEach(key => {
            if (this.definitions[key]?.afterGuess) {
                this.definitions[key].afterGuess();
            }
        });
    }

    resetAll() {
        this.clearTimer();
        this.buffedModifier = null;
        this.active.forEach(key => {
            if (this.definitions[key]?.onReset) {
                this.definitions[key].onReset(this);
            }
        });
        this.active.clear();
        this.renderBadges();
    }

    renderBadges() {
        const listContainer = document.getElementById("modifiersList");
        if (!listContainer) return;

        listContainer.innerHTML = "";

        if (this.active.size === 0) {
            listContainer.innerHTML = '<span class="modifier-tag">None</span>';
            return;
        }

        this.active.forEach(key => {
            const def = this.definitions[key];
            if (def) {
                const tag = document.createElement("span");
                const classKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
                tag.className = `modifier-tag ${classKey}`;
                if (key === this.buffedModifier) {
                    tag.classList.add("modifier-buffed");
                    tag.innerText = `⚡ ${def.name}`;
                } else {
                    tag.innerText = def.name;
                }
                listContainer.appendChild(tag);
            }
        });
    }
}
