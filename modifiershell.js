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
    }
};

// Set wave modifier counts for Hell (e.g., Wave 1 spawns 1, Wave 2 spawns 2)
const hellWaveCounts = {
    1: 1,
    2: 2
};

// Expose standard 'Modifiers' window object for hell.js to use
window.Modifiers = new ModifierEngine("hell", hellDefinitions, hellWaveCounts);
