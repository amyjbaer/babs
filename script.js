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

let currentPage = 'dice';

function showPage(pageName) {
    Object.keys(pages).forEach(key => {
        pages[key].classList.toggle('hidden', key !== pageName);
    });
    currentPage = pageName;

    // Update settings form when opening settings page
    if (pageName === 'settings') {
        document.getElementById('enableWindow').checked = enableWindow;
        document.getElementById('enablePercentage').checked = enablePercentage;
        document.getElementById('maxFrequency').value = maxSevens;
        document.getElementById('rollWindow').value = rollWindow;
        document.getElementById('maxPercentage').value = maxPercentage;
    }
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
const backFromSettingsButton = document.getElementById('backFromSettingsButton');
const viewStatsButton = document.getElementById('viewStatsButton');
const backToDiceButton = document.getElementById('backToDiceButton');
const settingsButton = document.getElementById('settingsButton');

// Event listeners - Navigation
backFromSettingsButton.addEventListener('click', () => {
    // Save settings when leaving settings page
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

// Play dice roll sound using uploaded audio file
function playDiceRollSound() {
    const audio = new Audio('dice.mp3');
    audio.volume = 0.6; // Adjust volume as needed
    audio.play().catch(err => {
        console.log('Audio playback failed:', err);
    });
}

// Roll two dice with frequency control
function rollDice() {
    let value1, value2, total;
    let attempts = 0;
    const maxAttempts = 100;
    let sevenWasPrevented = false;

    // Clear any previous celebration effects
    const container = document.querySelector('.container');
    container.classList.remove('celebrate-seven');
    die1.classList.remove('pulse-seven');
    die2.classList.remove('pulse-seven');

    // Play dice roll sound
    playDiceRollSound();

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

// Expected probabilities for two dice (theoretical bell curve)
const expectedProbabilities = {
    2: 1/36,   // 2.78%
    3: 2/36,   // 5.56%
    4: 3/36,   // 8.33%
    5: 4/36,   // 11.11%
    6: 5/36,   // 13.89%
    7: 6/36,   // 16.67%
    8: 5/36,   // 13.89%
    9: 4/36,   // 11.11%
    10: 3/36,  // 8.33%
    11: 2/36,  // 5.56%
    12: 1/36   // 2.78%
};

// Update distribution chart
function updateDistribution() {
    const totalRolls = rollHistory.length;

    // Calculate actual percentages
    const actualPercentages = {};
    for (let i = 2; i <= 12; i++) {
        actualPercentages[i] = totalRolls > 0 ? (distribution[i] / totalRolls) : 0;
    }

    // Find max value for scaling (use the higher of actual or expected)
    const maxActual = Math.max(...Object.values(actualPercentages));
    const maxExpected = Math.max(...Object.values(expectedProbabilities));
    const maxValue = Math.max(maxActual, maxExpected, 0.01); // Ensure non-zero

    // Create SVG line graph
    const graphHeight = 200;
    const padding = 10;

    // Calculate points for both lines
    const expectedPoints = [];
    const actualPoints = [];

    for (let i = 2; i <= 12; i++) {
        const x = ((i - 2) / 10) * 100; // 0% to 100%
        const expectedY = graphHeight - ((expectedProbabilities[i] / maxValue) * (graphHeight - padding * 2)) - padding;
        const actualY = graphHeight - ((actualPercentages[i] / maxValue) * (graphHeight - padding * 2)) - padding;

        expectedPoints.push({ x, y: expectedY });
        actualPoints.push({ x, y: actualY });
    }

    // Create smooth curves - simple quadratic curves between points
    function createSmoothPath(points) {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

        let path = `M ${points[0].x},${points[0].y}`;

        // Use simple quadratic curves
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Control point is at the midpoint horizontally, averaging the Y values
            const cpx = (current.x + next.x) / 2;
            const cpy = (current.y + next.y) / 2;

            path += ` Q ${cpx},${cpy} ${next.x},${next.y}`;
        }

        return path;
    }

    const expectedPath = createSmoothPath(expectedPoints);
    const actualPath = createSmoothPath(actualPoints);

    distributionDisplay.innerHTML = `
        <svg class="line-graph" viewBox="0 0 100 ${graphHeight}" preserveAspectRatio="none">
            <defs>
                <linearGradient id="actualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#ec4899;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
                </linearGradient>
            </defs>
            <!-- Expected line (bell curve) -->
            <path
                class="line expected-line"
                d="${expectedPath}"
                fill="none"
            />
            <!-- Actual line -->
            <path
                class="line actual-line"
                d="${actualPath}"
                fill="none"
            />
            <!-- Expected dots -->
            ${expectedPoints.map(point => {
                return `<circle cx="${point.x}" cy="${point.y}" r="0.8" class="dot expected-dot" />`;
            }).join('')}
            <!-- Actual dots -->
            ${actualPoints.map(point => {
                return `<circle cx="${point.x}" cy="${point.y}" r="0.8" class="dot actual-dot" />`;
            }).join('')}
        </svg>
        <div class="x-axis-labels">
            ${[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => `
                <div class="axis-label">
                    <div class="label-number">${num}</div>
                    <div class="label-count">${distribution[num]}</div>
                </div>
            `).join('')}
        </div>
    `;

    // Add legend if not already present
    if (!document.querySelector('.distribution-legend')) {
        const legend = document.createElement('div');
        legend.className = 'distribution-legend';
        legend.innerHTML = `
            <div class="legend-item">
                <div class="legend-line expected"></div>
                <span>Expected</span>
            </div>
            <div class="legend-item">
                <div class="legend-line actual"></div>
                <span>Actual</span>
            </div>
        `;
        distributionDisplay.parentElement.insertBefore(legend, distributionDisplay);
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

// ========================================
// WELCOME MODAL
// ========================================

const welcomeModal = document.getElementById('welcomeModal');
const closeWelcomeModalX = document.getElementById('closeWelcomeModalX');
const dontShowAgainCheckbox = document.getElementById('dontShowAgain');
const prevStepButton = document.getElementById('prevWelcomeStep');
const nextStepButton = document.getElementById('nextWelcomeStep');
const welcomeSections = document.querySelectorAll('.welcome-section');
const progressDots = document.querySelectorAll('.progress-dot');

let currentStep = 0;
const totalSteps = welcomeSections.length;

// Check if user has seen the welcome modal before
function shouldShowWelcomeModal() {
    const dontShowAgain = localStorage.getItem('dontShowWelcomeAgain');
    return dontShowAgain !== 'true';
}

// Show welcome modal on first visit
function showWelcomeModal() {
    welcomeModal.classList.remove('hidden');
    currentStep = 0;
    updateWelcomeStep();
}

// Hide welcome modal
function hideWelcomeModal() {
    welcomeModal.classList.add('hidden');

    // Only save to localStorage if "Don't show again" is checked
    if (dontShowAgainCheckbox.checked) {
        localStorage.setItem('dontShowWelcomeAgain', 'true');
    }
}

// Update the visible step
function updateWelcomeStep() {
    // Update sections visibility
    welcomeSections.forEach((section, index) => {
        section.classList.toggle('active', index === currentStep);
    });

    // Update progress dots
    progressDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentStep);
    });

    // Update button states
    prevStepButton.disabled = currentStep === 0;

    // Change next button to "Let's Roll!" on last step
    if (currentStep === totalSteps - 1) {
        nextStepButton.textContent = "Let's Roll! 🎲";
        nextStepButton.classList.add('final-step');
    } else {
        nextStepButton.textContent = 'Next →';
        nextStepButton.classList.remove('final-step');
    }
}

// Go to next step
function nextWelcomeStep() {
    if (currentStep < totalSteps - 1) {
        currentStep++;
        updateWelcomeStep();
    } else {
        // On last step, close the modal
        hideWelcomeModal();
    }
}

// Go to previous step
function prevWelcomeStep() {
    if (currentStep > 0) {
        currentStep--;
        updateWelcomeStep();
    }
}

// Event listeners
nextStepButton.addEventListener('click', nextWelcomeStep);
prevStepButton.addEventListener('click', prevWelcomeStep);
closeWelcomeModalX.addEventListener('click', hideWelcomeModal);

// Close modal when clicking outside of it
welcomeModal.addEventListener('click', (e) => {
    if (e.target === welcomeModal) {
        hideWelcomeModal();
    }
});

// Allow clicking on progress dots to jump to that step
progressDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentStep = index;
        updateWelcomeStep();
    });
});

// Show modal on first visit
if (shouldShowWelcomeModal()) {
    showWelcomeModal();
}

