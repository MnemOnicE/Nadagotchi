// --- I. INITIALIZE GAME STATE ---
let pet_hunger = 100;
let pet_happiness = 100;

const stat_max_value = 100;
const feed_amount = 20;
const play_amount = 20;
const hunger_decay = 2;
const happiness_decay = 1;


// --- II. GET HTML ELEMENTS ---
const pet_display_element = document.getElementById("pet-display");
const hunger_stat_element = document.getElementById("hunger-stat");
const happiness_stat_element = document.getElementById("happiness-stat");

const feed_button_element = document.getElementById("feed-button");
const play_button_element = document.getElementById("play-button");


// --- III. DEFINE CORE GAME FUNCTIONS ---

function onFeedButton_Click() {
    pet_hunger = pet_hunger + feed_amount;

    if (pet_hunger > stat_max_value) {
        pet_hunger = stat_max_value;
    }

    updateUI();
}

function onPlayButton_Click() {
    pet_happiness = pet_happiness + play_amount;

    if (pet_happiness > stat_max_value) {
        pet_happiness = stat_max_value;
    }

    pet_hunger = pet_hunger - (feed_amount / 2);

    updateUI();
}

function game_loop() {
    pet_hunger = pet_hunger - hunger_decay;
    pet_happiness = pet_happiness - happiness_decay;

    if (pet_hunger < 0) {
        pet_hunger = 0;
    }
    if (pet_happiness < 0) {
        pet_happiness = 0;
    }

    updateUI();

    checkPetMood();
}

function updateUI() {
    hunger_stat_element.textContent = pet_hunger;
    happiness_stat_element.textContent = pet_happiness;
}

function checkPetMood() {
    if (pet_hunger < 30 || pet_happiness < 30) {
        pet_display_element.textContent = "(T_T)"; // Sad
    } else {
        pet_display_element.textContent = "(^-^)"; // Happy
    }
}


// --- IV. START THE GAME ---

feed_button_element.addEventListener("click", onFeedButton_Click);
play_button_element.addEventListener("click", onPlayButton_Click);

setInterval(game_loop, 2000);

updateUI();
