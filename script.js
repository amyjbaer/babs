// Game state
let rollHistory = [];
let rollMetadata = []; // Track if a 7 was prevented for each roll
let distribution = {};
let enableWindow = true;
let enablePercentage = true;
let maxSevens = 2;
let rollWindow = 3;
let maxPercentage = 16.67;
let preventedSevens = 0;

// Initialize distribution
for (let i = 2; i <= 12; i++) {
    distribution[i] = 0;
}

// Page management
const pages = {
    settings: document.getElementById('settingsPage'),
    dice: document.getElementById('dicePage'),
    stats: document.getElementById('statsPage')
};

let currentPage = 'settings';

function showPage(pageName) {
    Object.keys(pages).forEach(key => {
        pages[key].classList.toggle('hidden', key !== pageName);
    });
    currentPage = pageName;
}

// DOM elements
const die1 = document.getElementById('die1');
const die2 = document.getElementById('die2');
const totalDisplay = document.getElementById('total');
const rollButton = document.getElementById('rollButton');
const resetButton = document.getElementById('resetButton');
const totalRollsDisplay = document.getElementById('totalRolls');
const sevensCountDisplay = document.getElementById('sevensCount');
const sevenFrequencyDisplay = document.getElementById('sevenFrequency');
const preventedCountDisplay = document.getElementById('preventedCount');
const preventionEffect = document.getElementById('preventionEffect');
const historyDisplay = document.getElementById('history');
const distributionDisplay = document.getElementById('distribution');

// Quick stats on dice page
const quickTotalRolls = document.getElementById('quickTotalRolls');
const quickSevensCount = document.getElementById('quickSevensCount');
const quickSevenFrequency = document.getElementById('quickSevenFrequency');

// Navigation buttons
const startButton = document.getElementById('startButton');
const viewStatsButton = document.getElementById('viewStatsButton');
const backToDiceButton = document.getElementById('backToDiceButton');
const settingsButton = document.getElementById('settingsButton');

// Event listeners - Navigation
startButton.addEventListener('click', () => {
    // Save settings
    enableWindow = document.getElementById('enableWindow').checked;
    enablePercentage = document.getElementById('enablePercentage').checked;
    maxSevens = parseInt(document.getElementById('maxFrequency').value);
    rollWindow = parseInt(document.getElementById('rollWindow').value);
    maxPercentage = parseFloat(document.getElementById('maxPercentage').value);

    showPage('dice');
});

viewStatsButton.addEventListener('click', () => {
    showPage('stats');
});

backToDiceButton.addEventListener('click', () => {
    showPage('dice');
});

settingsButton.addEventListener('click', () => {
    showPage('settings');
});

// Event listeners - Game actions
rollButton.addEventListener('click', rollDice);
resetButton.addEventListener('click', resetStats);

// Settings change listeners (for when returning to settings page)
document.getElementById('enableWindow').addEventListener('change', (e) => {
    enableWindow = e.target.checked;
});

document.getElementById('enablePercentage').addEventListener('change', (e) => {
    enablePercentage = e.target.checked;
});

document.getElementById('maxFrequency').addEventListener('change', (e) => {
    maxSevens = parseInt(e.target.value);
});

document.getElementById('rollWindow').addEventListener('change', (e) => {
    rollWindow = parseInt(e.target.value);
});

document.getElementById('maxPercentage').addEventListener('change', (e) => {
    maxPercentage = parseFloat(e.target.value);
});

// Roll a single die (1-6)
function rollSingleDie() {
    return Math.floor(Math.random() * 6) + 1;
}

// Check if we should allow a seven based on frequency settings
function shouldAllowSeven() {
    let allowSeven = true;

    // Check sliding window constraint if enabled
    if (enableWindow) {
        const recentRolls = rollHistory.slice(-rollWindow);
        const recentSevens = recentRolls.filter(roll => roll === 7).length;
        if (recentSevens >= maxSevens) {
            allowSeven = false;
        }
    }

    // Check overall percentage constraint if enabled
    if (enablePercentage && allowSeven) {
        const totalSevens = rollHistory.filter(roll => roll === 7).length;
        // Allow if adding one more seven would still keep us at or below the max percentage
        const futurePercentage = ((totalSevens + 1) / (rollHistory.length + 1)) * 100;
        if (futurePercentage > maxPercentage) {
            allowSeven = false;
        }
    }

    return allowSeven;
}

// Roll two dice with frequency control
function rollDice() {
    let value1, value2, total;
    let attempts = 0;
    const maxAttempts = 100;
    let sevenWasPrevented = false;

    do {
        value1 = rollSingleDie();
        value2 = rollSingleDie();
        total = value1 + value2;
        attempts++;

        // Check if we're preventing a seven
        if (total === 7 && !shouldAllowSeven()) {
            sevenWasPrevented = true;
        }

        // If we've tried too many times, just accept the roll
        if (attempts >= maxAttempts) {
            break;
        }
    } while (total === 7 && !shouldAllowSeven());

    // Track prevented sevens
    if (sevenWasPrevented && total !== 7) {
        preventedSevens++;
    }

    // Animate dice
    die1.classList.add('rolling');
    die2.classList.add('rolling');

    setTimeout(() => {
        // Update dice display
        die1.setAttribute('data-value', value1);
        die2.setAttribute('data-value', value2);

        // Update total display
        totalDisplay.textContent = `Total: ${total}`;
        totalDisplay.classList.toggle('seven', total === 7);

        // Show prevention effect if a seven was prevented
        if (sevenWasPrevented && total !== 7) {
            // Create particle explosion
            createParticles();

            preventionEffect.classList.add('show');
            setTimeout(() => {
                preventionEffect.classList.remove('show');
                // Clear particles
                document.getElementById('particles').innerHTML = '';
            }, 2000);
        }

        // Cool celebration when a 7 is rolled!
        if (total === 7) {
            celebrateSeven();
        }

        // Remove animation
        die1.classList.remove('rolling');
        die2.classList.remove('rolling');

        // Update statistics
        rollHistory.push(total);
        rollMetadata.push({ preventedSeven: sevenWasPrevented && total !== 7 });
        distribution[total]++;
        updateStats();
    }, 500);
}

// Update statistics display
function updateStats() {
    const totalRolls = rollHistory.length;
    const sevensCount = rollHistory.filter(roll => roll === 7).length;
    const sevenFrequency = totalRolls > 0 ? (sevensCount / totalRolls * 100).toFixed(2) : 0;

    // Update detailed stats (stats page)
    totalRollsDisplay.textContent = totalRolls;
    sevensCountDisplay.textContent = sevensCount;
    sevenFrequencyDisplay.textContent = `${sevenFrequency}%`;
    preventedCountDisplay.textContent = preventedSevens;

    // Update quick stats (dice page)
    quickTotalRolls.textContent = totalRolls;
    quickSevensCount.textContent = sevensCount;
    quickSevenFrequency.textContent = `${sevenFrequency}%`;

    // Update history (last 20 rolls)
    updateHistory();

    // Update distribution chart
    updateDistribution();
}

// Update roll history display
function updateHistory() {
    const last20Rolls = rollHistory.slice(-20);
    const last20Meta = rollMetadata.slice(-20);

    historyDisplay.innerHTML = last20Rolls.map((roll, index) => {
        const wasPrevented = last20Meta[index]?.preventedSeven || false;
        const preventedClass = wasPrevented ? 'prevented' : '';
        const preventedIndicator = wasPrevented ? '<span class="prevented-indicator">🚫</span>' : '';
        return `<div class="history-item ${roll === 7 ? 'seven' : ''} ${preventedClass}">${roll}${preventedIndicator}</div>`;
    }).reverse().join('');
}

// Update distribution chart
function updateDistribution() {
    const maxCount = Math.max(...Object.values(distribution));

    distributionDisplay.innerHTML = '';
    for (let i = 2; i <= 12; i++) {
        const count = distribution[i];
        const percentage = maxCount > 0 ? (count / maxCount * 100) : 0;

        const distItem = document.createElement('div');
        distItem.className = 'dist-item';
        distItem.innerHTML = `
            <div class="dist-number">${i}</div>
            <div class="dist-count">${count}</div>
            <div class="dist-bar" style="width: ${percentage}%"></div>
        `;
        distributionDisplay.appendChild(distItem);
    }
}

// Celebrate when a 7 is rolled!
function celebrateSeven() {
    // Add celebration class to the container
    const container = document.querySelector('.container');
    container.classList.add('celebrate-seven');

    // Pulse the dice
    die1.classList.add('pulse-seven');
    die2.classList.add('pulse-seven');

    // Remove celebration effects after animation
    setTimeout(() => {
        container.classList.remove('celebrate-seven');
        die1.classList.remove('pulse-seven');
        die2.classList.remove('pulse-seven');
    }, 2000);
}

// Reset all statistics
function resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
        rollHistory = [];
        rollMetadata = [];
        preventedSevens = 0;
        for (let i = 2; i <= 12; i++) {
            distribution[i] = 0;
        }
        updateStats();
    }
}

// Create particle explosion effect
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random angle and distance
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.animationDelay = `${Math.random() * 0.1}s`;

        particlesContainer.appendChild(particle);
    }
}

// Initialize display
updateDistribution();

