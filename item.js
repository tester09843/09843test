const itemDatabase = {
    "rifle": { name: "Rifle", type: "Weapon", damage: 20, firerate: 500, hasSpecialAbility: false },
    "harpoon gun": { name: "Harpoon Gun", type: "Weapon", damage: 25, firerate: 550, hasSpecialAbility: true },
    "bolter": { name: "Bolter", type: "Weapon", damage: 20, firerate: 550, hasSpecialAbility: true },
    "shotgun": { name: "Shotgun", type: "Weapon", damage: 15, firerate: 65, hasSpecialAbility: false },
    "sprinters streak": { name: "Sprinters Streak", type: "Weapon", damage: 10, firerate: 100, hasSpecialAbility: true },
    "hallsweeper": { name: "Hallsweeper", type: "Weapon", damage: 7.5, firerate: 100, hasSpecialAbility: true },
    "dmr": { name: "DMR", type: "Weapon", damage: 55, firerate: 95, hasSpecialAbility: false },
    "gift of fire": { name: "Gift Of Fire", type: "Weapon", damage: 55, firerate: 70, hasSpecialAbility: true },
    "armor peeler": { name: "Armor Peeler", type: "Weapon", damage: 55, firerate: 120, hasSpecialAbility: true },
    "akimbo": { name: "Akimbo", type: "Weapon", damage: 26, firerate: 400, hasSpecialAbility: false },
    "voltaic impact": { name: "Voltaic Impact", type: "Weapon", damage: 27, firerate: 585, hasSpecialAbility: true},
    "gunslinger": { name: "Gunslinger", type: "Weapon", damage: 20, firerate: 250, hasSpecialAbility: true },
};

const itemKeys = Object.keys(itemDatabase);

let secretItem = null;
let currentWave = 1;
let guessCount = 0;
const MAX_GUESSES = 6;
let gameOver = false;
let isWaveClear = false;

let inputElement, dropdownMenu, waveIndicator, continueButton, submitButton, messageElement, guessRows;

document.addEventListener("DOMContentLoaded", () => {
    inputElement = document.getElementById("itemInput");
    dropdownMenu = document.getElementById("dropdownMenu");
    waveIndicator = document.getElementById("waveIndicator");
    continueButton = document.getElementById("continueButton");
    submitButton = document.querySelector(".submit-btn");
    messageElement = document.getElementById("gameMessage");
    guessRows = document.getElementById("guessRows");

    if (inputElement) {
        inputElement.addEventListener("input", showFilteredOptions);
        inputElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter") submitGuess();
        });
        inputElement.addEventListener("focus", showFilteredOptions);
        document.addEventListener("click", (e) => {
            if (dropdownMenu && !e.target.closest(".search-container")) {
                dropdownMenu.style.display = "none";
            }
        });
    }
    if (submitButton) submitButton.addEventListener("click", submitGuess);

    initializeGameSession();
});

function initializeGameSession() {
    guessCount = 0;
    gameOver = false;
    isWaveClear = false;
    secretItem = itemDatabase[itemKeys[Math.floor(Math.random() * itemKeys.length)]];
    console.log(`Wave ${currentWave} answer: ${secretItem.name}`);

    if (guessRows) guessRows.innerHTML = "";
    if (messageElement) {
        messageElement.innerText = "";
        messageElement.style.color = "";
    }
    if (waveIndicator) waveIndicator.innerText = `Wave: ${currentWave}`;
    if (continueButton) continueButton.style.display = "none";
    if (inputElement) {
        inputElement.value = "";
        inputElement.disabled = false;
    }
    if (submitButton) submitButton.disabled = false;
}

function advanceNextWave() {
    currentWave++;
    initializeGameSession();
}

function resetToWaveOne() {
    currentWave = 1;
    initializeGameSession();
}

function showFilteredOptions() {
    if (gameOver || isWaveClear || !dropdownMenu || !inputElement) return;
    const query = inputElement.value.trim().toLowerCase();
    dropdownMenu.innerHTML = "";

    if (!query) {
        dropdownMenu.style.display = "none";
        return;
    }

    const matches = itemKeys
        .map(key => itemDatabase[key])
        .filter(item => item.name.toLowerCase().includes(query));

    if (matches.length === 0) {
        dropdownMenu.style.display = "none";
        return;
    }

    matches.forEach(item => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerText = item.name;
        div.onclick = () => {
            inputElement.value = item.name;
            dropdownMenu.style.display = "none";
        };
        dropdownMenu.appendChild(div);
    });
    dropdownMenu.style.display = "block";
}

function findItemByName(name) {
    const normalized = name.trim().toLowerCase();
    return itemKeys
        .map(key => itemDatabase[key])
        .find(item => item.name.toLowerCase() === normalized) || null;
}

function createNameCell(guessedItem) {
    const td = document.createElement("td");
    td.innerText = guessedItem.name;
    td.className = guessedItem.name === secretItem.name ? "cell-correct" : "cell-incorrect";
    return td;
}

function createTypeCell(guessedItem) {
    const td = document.createElement("td");
    td.innerText = guessedItem.type;
    td.className = guessedItem.type === secretItem.type ? "cell-correct" : "cell-incorrect";
    return td;
}

function createNumericCell(guessedValue, targetValue, threshold) {
    const td = document.createElement("td");
    if (guessedValue === targetValue) {
        td.innerText = guessedValue;
        td.className = "cell-correct";
    } else {
        const arrow = guessedValue < targetValue ? "↑" : "↓";
        td.innerText = `${guessedValue} ${arrow}`;
        td.className = Math.abs(guessedValue - targetValue) <= threshold ? "cell-partial" : "cell-incorrect";
    }
    return td;
}

function createBooleanCell(guessedValue) {
    const td = document.createElement("td");
    td.innerText = guessedValue ? "Yes" : "No";
    td.className = guessedValue === secretItem.hasSpecialAbility ? "cell-correct" : "cell-incorrect";
    return td;
}

function submitGuess() {
    if (gameOver || isWaveClear || !inputElement) return;

    const guessedItem = findItemByName(inputElement.value);
    if (!guessedItem) {
        if (messageElement) {
            messageElement.innerText = "Not a valid item. Pick one from the list.";
            messageElement.style.color = "#ff3333";
        }
        return;
    }

    guessCount++;
    inputElement.value = "";
    if (dropdownMenu) dropdownMenu.style.display = "none";

    const row = document.createElement("tr");
    row.appendChild(createNameCell(guessedItem));
    row.appendChild(createTypeCell(guessedItem));
    row.appendChild(createNumericCell(guessedItem.damage, secretItem.damage, 15));
    row.appendChild(createNumericCell(guessedItem.firerate, secretItem.firerate, 2));
    row.appendChild(createBooleanCell(guessedItem.hasSpecialAbility));
    if (guessRows) guessRows.prepend(row);

    if (guessedItem.name === secretItem.name) {
        if (messageElement) {
            messageElement.innerText = `SUCCESS! The item was ${secretItem.name}! Wave ${currentWave} Complete!`;
            messageElement.style.color = "#00ffcc";
        }
        isWaveClear = true;
        inputElement.disabled = true;
        if (submitButton) submitButton.disabled = true;
        if (continueButton) {
            continueButton.innerText = "Continue";
            continueButton.onclick = advanceNextWave;
            continueButton.style.display = "inline-block";
        }
        return;
    }

    if (guessCount >= MAX_GUESSES) {
        if (messageElement) {
            messageElement.innerText = `Out of guesses. The item was: ${secretItem.name}. You reached Wave ${currentWave} before failing.`;
            messageElement.style.color = "#ff3333";
        }
        gameOver = true;
        inputElement.disabled = true;
        if (submitButton) submitButton.disabled = true;
        if (continueButton) {
            continueButton.innerText = "Restart from Wave 1";
            continueButton.style.display = "inline-block";
            continueButton.onclick = resetToWaveOne;
        }
    }
}
