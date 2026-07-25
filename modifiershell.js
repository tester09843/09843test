// Tracks which enemy keys are secretly vitacharged for the current wave (Vitacharge modifier)
let vitachargedEnemies = new Set();

// Tracks the current wave's assassin enemy (Assassin modifier)
let currentAssassin = null;

const hellDefinitions = {
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
        onStart: (engine) => {
            engine.startTimer(60);
        },
        onReset: (engine) => {
            engine.clearTimer();
        }
    },
    fog: {
        name: "Fog",
        description: "Only your 2 most recent guesses are visible.",
        afterGuess: () => {
            const tbody = document.getElementById("guessRows");
            if (!tbody) return;
            Array.from(tbody.children).forEach((row, index) => {
                row.style.display = index < 2 ? "" : "none";
            });
        },
        onReset: () => {
            const tbody = document.getElementById("guessRows");
            if (!tbody) return;
            Array.from(tbody.children).forEach(row => {
                row.style.display = "";
            });
        }
    },
    sabotage: {
        name: "Sabotage",
        description: "One non-correct arrow (Health, Total Waves, or First Encounter) is always flipped to point the wrong way.",
        onGuess: (row) => {
            const flipPairs = [["↑", "↓"], ["↓", "↑"], ["→", "←"], ["←", "→"]];

            const candidates = ["cell-health", "cell-waves", "cell-encounter"]
                .map(cls => row.querySelector(`.${cls}`))
                .filter(cell => cell && !cell.classList.contains("cell-correct"));

            if (candidates.length === 0) return;

            const target = candidates[Math.floor(Math.random() * candidates.length)];
            for (const [from, to] of flipPairs) {
                if (target.innerText.includes(from)) {
                    target.innerText = target.innerText.replace(from, to);
                    break;
                }
            }
        }
    },
    weakenedSignal: {
        name: "Weakened Signal",
        description: "You only have 5 guesses instead of 6.",
        onStart: () => {
            if (typeof window.setMaxGuesses === "function") {
                window.setMaxGuesses(5);
            }
        },
        onReset: () => {
            if (typeof window.setMaxGuesses === "function") {
                window.setMaxGuesses(6);
            }
        }
    },
    miscommunication: {
        name: "Miscommunication",
        description: "A non-correct stat (Health, Total Waves, or First Encounter) may display the wrong value.",
        onGuess: (row, guessedEnemy) => {
            const candidates = ["cell-health", "cell-waves", "cell-encounter"]
                .map(cls => row.querySelector(`.${cls}`))
                .filter(cell => cell && !cell.classList.contains("cell-correct"));

            if (candidates.length === 0) return;

            const target = candidates[Math.floor(Math.random() * candidates.length)];
            const sign = Math.random() < 0.5 ? 1 : -1;
            const arrowMatch = target.innerText.match(/ [↑↓→←]$/);
            const arrowSuffix = arrowMatch ? arrowMatch[0] : "";

            if (target.classList.contains("cell-health")) {
                target.innerText = `${guessedEnemy.health + sign * 50}${arrowSuffix}`;
            } else if (target.classList.contains("cell-waves")) {
                target.innerText = `${guessedEnemy.waves + sign * 2}${arrowSuffix}`;
            } else if (target.classList.contains("cell-encounter")) {
                const order = window.encounterOrder || [];
                const lowerOrder = order.map(item => item.toLowerCase());
                const idx = lowerOrder.indexOf(guessedEnemy.encounter.toLowerCase());
                if (idx !== -1) {
                    const newIdx = Math.min(Math.max(idx + sign, 0), order.length - 1);
                    target.innerText = `${order[newIdx]}${arrowSuffix}`;
                }
            }
        }
    },
    vitacharge: {
        name: "Vitacharge",
        description: "2 enemies you guessed in the previous 2 waves are secretly vitacharged this wave. Guess one and every stat but its name goes blank and gold.",
        onStart: () => {
            vitachargedEnemies = new Set();
            if (typeof window.getPreviousWaveGuesses === "function") {
                const pool = [...new Set(window.getPreviousWaveGuesses(2))];
                while (vitachargedEnemies.size < 2 && pool.length > 0) {
                    const randomIndex = Math.floor(Math.random() * pool.length);
                    vitachargedEnemies.add(pool.splice(randomIndex, 1)[0]);
                }
            }
        },
        onGuess: (row, guessedEnemy) => {
            if (!vitachargedEnemies.has(guessedEnemy.name.toLowerCase())) return;

            row.classList.add("row-vitacharged");
            Array.from(row.children).forEach(cell => {
                if (cell.classList.contains("cell-name")) return;
                cell.classList.remove("cell-correct", "cell-incorrect", "cell-partial");
                cell.textContent = "";
                cell.classList.add("cell-vitacharged");
            });
        },
        onReset: () => {
            vitachargedEnemies = new Set();
        }
    },
    assassin: {
        name: "Assassin",
        description: "A random enemy is secretly the assassin this wave. Guessing it fails you instantly. Stats close to the assassin are colored black instead of yellow.",
        onStart: () => {
            currentAssassin = null;
            const db = window.enemyDatabase || {};
            const secret = typeof window.getSecretEnemy === "function" ? window.getSecretEnemy() : null;
            const pool = Object.keys(db).filter(key => !secret || db[key].name !== secret.name);
            if (pool.length > 0) {
                const randomKey = pool[Math.floor(Math.random() * pool.length)];
                currentAssassin = db[randomKey];
            }
        },
        onGuess: (row, guessedEnemy) => {
            if (!currentAssassin) return;

            const order = window.encounterOrder || [];
            const lowerOrder = order.map(item => item.toLowerCase());
            const guessedEncounterIdx = lowerOrder.indexOf(guessedEnemy.encounter.toLowerCase());
            const assassinEncounterIdx = lowerOrder.indexOf(currentAssassin.encounter.toLowerCase());

            const checks = [
                { cls: "cell-health", close: Math.abs(guessedEnemy.health - currentAssassin.health) <= 50 },
                { cls: "cell-waves", close: Math.abs(guessedEnemy.waves - currentAssassin.waves) <= 6 },
                {
                    cls: "cell-encounter",
                    close: guessedEncounterIdx !== -1 && assassinEncounterIdx !== -1 &&
                        Math.abs(guessedEncounterIdx - assassinEncounterIdx) <= 2
                }
            ];

            checks.forEach(({ cls, close }) => {
                if (!close) return;
                const cell = row.querySelector(`.${cls}`);
                if (!cell || cell.classList.contains("cell-correct")) return;
                cell.classList.remove("cell-incorrect", "cell-partial");
                cell.classList.add("cell-assassin-close");
            });

            if (guessedEnemy.name === currentAssassin.name) {
                if (typeof window.handleAssassinGuess === "function") {
                    window.handleAssassinGuess(currentAssassin);
                }
            }
        },
        onReset: () => {
            currentAssassin = null;
        }
    },
    vitarage: {
        name: "Vitarage",
        description: "Doesn't affect the game directly — instead buffs 1 other random active modifier this wave.",
        onStart: (engine) => {
            engine.buffedModifier = null;
            const candidates = [...engine.active].filter(key => key !== "vitarage");
            if (candidates.length > 0) {
                engine.buffedModifier = candidates[Math.floor(Math.random() * candidates.length)];
            }
            engine.renderBadges();
        },
        onReset: (engine) => {
            engine.buffedModifier = null;
        }
    }
};

// Set wave modifier counts for Hell (e.g., Wave 1 spawns 1, Wave 2 spawns 2)
const hellWaveCounts = {
    1: 1,
    2: 2
};

// Expose standard 'Modifiers' window object for hell.js to use
window.Modifiers = new ModifierEngine("hell", hellDefinitions, hellWaveCounts);
