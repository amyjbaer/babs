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
let enableSound = true; // Dice roll sound effects toggle
let enableBombSound = true; // Bomb explosion sound toggle
let distributionView = 'numbers'; // 'numbers' or 'graph'

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
        document.getElementById('enableSound').checked = enableSound;
        document.getElementById('enableBombSound').checked = enableBombSound;
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
    enableSound = document.getElementById('enableSound').checked;
    enableBombSound = document.getElementById('enableBombSound').checked;
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

// Distribution view toggle
const toggleNumbersBtn = document.getElementById('toggleNumbers');
const toggleGraphBtn = document.getElementById('toggleGraph');

toggleNumbersBtn.addEventListener('click', () => {
    distributionView = 'numbers';
    toggleNumbersBtn.classList.add('active');
    toggleGraphBtn.classList.remove('active');
    updateDistribution();
});

toggleGraphBtn.addEventListener('click', () => {
    distributionView = 'graph';
    toggleGraphBtn.classList.add('active');
    toggleNumbersBtn.classList.remove('active');
    updateDistribution();
});

// Settings change listeners (for when returning to settings page)
document.getElementById('enableSound').addEventListener('change', (e) => {
    enableSound = e.target.checked;
});

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
    // Only play sound if enabled in settings
    if (!enableSound) return;

    const audio = new Audio('dice.mp3');
    audio.volume = 0.6; // Adjust volume as needed
    audio.play().catch(err => {
        console.log('Audio playback failed:', err);
    });
}

// Play bomb explosion sound
function playBombSound() {
    if (!enableBombSound) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 2;

    // Create explosion sound with multiple layers
    // Layer 1: Deep bass boom
    const bass = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, audioContext.currentTime);
    bass.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.5);
    bassGain.gain.setValueAtTime(0.8, audioContext.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    bass.connect(bassGain);
    bassGain.connect(audioContext.destination);

    // Layer 2: Mid-range explosion
    const mid = audioContext.createOscillator();
    const midGain = audioContext.createGain();
    mid.type = 'triangle';
    mid.frequency.setValueAtTime(200, audioContext.currentTime);
    mid.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
    midGain.gain.setValueAtTime(0.5, audioContext.currentTime);
    midGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    mid.connect(midGain);
    midGain.connect(audioContext.destination);

    // Layer 3: White noise burst
    const bufferSize = audioContext.sampleRate * 0.5;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = audioContext.createGain();
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
    noiseGain.gain.setValueAtTime(0.6, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);

    // Start all layers
    bass.start(audioContext.currentTime);
    bass.stop(audioContext.currentTime + duration);
    mid.start(audioContext.currentTime);
    mid.stop(audioContext.currentTime + duration);
    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.5);
}

// Play dramatic falling sound for the 7
function playSevenFallSound() {
    if (!enableBombSound) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Falling whistle sound - descending pitch
    const whistle = audioContext.createOscillator();
    const whistleGain = audioContext.createGain();
    whistle.type = 'sine';

    // Start high and drop down (like a falling bomb whistle)
    whistle.frequency.setValueAtTime(1200, audioContext.currentTime);
    whistle.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1.5);

    // Fade in and out
    whistleGain.gain.setValueAtTime(0, audioContext.currentTime);
    whistleGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    whistleGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 1.2);
    whistleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

    whistle.connect(whistleGain);
    whistleGain.connect(audioContext.destination);

    // Add vibrato for dramatic effect
    const vibrato = audioContext.createOscillator();
    const vibratoGain = audioContext.createGain();
    vibrato.frequency.setValueAtTime(6, audioContext.currentTime);
    vibratoGain.gain.setValueAtTime(30, audioContext.currentTime);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(whistle.frequency);

    whistle.start(audioContext.currentTime);
    whistle.stop(audioContext.currentTime + 1.5);
    vibrato.start(audioContext.currentTime);
    vibrato.stop(audioContext.currentTime + 1.5);
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

    if (distributionView === 'numbers') {
        // Show numbers view
        distributionDisplay.innerHTML = `
            <div class="distribution-numbers">
                ${[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                    const actual = distribution[num];
                    const actualPct = (actualPercentages[num] * 100).toFixed(1);
                    const expectedPct = (expectedProbabilities[num] * 100).toFixed(1);
                    return `
                        <div class="number-item">
                            <div class="number-value">${num}</div>
                            <div class="number-count">${actual}</div>
                            <div class="number-percentage">${actualPct}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        // Show graph view with bars and trend line
        const maxActual = Math.max(...Object.values(actualPercentages));
        const maxExpected = Math.max(...Object.values(expectedProbabilities));
        const maxValue = Math.max(maxActual, maxExpected, 0.01);

        const graphHeight = 250;
        const barWidth = 7;
        const gap = 1.5;

        // Calculate points for bars (actual data)
        const barPoints = [];
        for (let i = 2; i <= 12; i++) {
            const x = ((i - 2) / 10) * 100;
            const y = graphHeight - ((actualPercentages[i] / maxValue) * (graphHeight - 20)) - 10;
            barPoints.push({ x, y, value: actualPercentages[i] });
        }

        // Create smoothed trend line using moving average
        function createSmoothedTrendLine(points) {
            if (points.length === 0) return { path: '', points: [] };

            // Apply smoothing - weighted moving average
            const smoothedPoints = [];
            for (let i = 0; i < points.length; i++) {
                let sum = 0;
                let weight = 0;

                // Use a window of 5 points with gaussian-like weights
                for (let j = Math.max(0, i - 2); j <= Math.min(points.length - 1, i + 2); j++) {
                    const distance = Math.abs(i - j);
                    const w = distance === 0 ? 0.4 : (distance === 1 ? 0.25 : 0.1);
                    sum += points[j].value * w;
                    weight += w;
                }

                const smoothedValue = sum / weight;
                const smoothedY = graphHeight - ((smoothedValue / maxValue) * (graphHeight - 20)) - 10;
                smoothedPoints.push({ x: points[i].x, y: smoothedY });
            }

            // Create smooth curve through smoothed points using Catmull-Rom spline
            if (smoothedPoints.length === 1) return { path: `M ${smoothedPoints[0].x},${smoothedPoints[0].y}`, points: smoothedPoints };

            let path = `M ${smoothedPoints[0].x},${smoothedPoints[0].y}`;

            for (let i = 0; i < smoothedPoints.length - 1; i++) {
                const p0 = smoothedPoints[Math.max(0, i - 1)];
                const p1 = smoothedPoints[i];
                const p2 = smoothedPoints[i + 1];
                const p3 = smoothedPoints[Math.min(smoothedPoints.length - 1, i + 2)];

                // Create smooth curve using cubic bezier
                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
            }

            return { path, points: smoothedPoints };
        }

        const trendLine = createSmoothedTrendLine(barPoints);
        const trendPath = trendLine.path;
        const trendPoints = trendLine.points;

        distributionDisplay.innerHTML = `
            <svg class="bar-graph" viewBox="0 0 100 ${graphHeight}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.9" />
                        <stop offset="100%" style="stop-color:#d946ef;stop-opacity:0.7" />
                    </linearGradient>
                </defs>
                <!-- Bars for actual distribution -->
                ${[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num, index) => {
                    const x = ((num - 2) / 10) * 100;
                    const barHeight = (actualPercentages[num] / maxValue) * (graphHeight - 20);
                    const y = graphHeight - barHeight - 10;
                    return `<rect x="${x - barWidth/2}" y="${y}" width="${barWidth}" height="${barHeight}" fill="url(#barGradient)" class="bar" />`;
                }).join('')}
                <!-- Trend line overlay -->
                <path
                    class="trend-line"
                    d="${trendPath}"
                    fill="none"
                    stroke="#d946ef"
                    stroke-width="2"
                    opacity="0.8"
                />
                <!-- Trend line dots -->
                ${trendPoints.map(point => {
                    return `<circle cx="${point.x}" cy="${point.y}" r="1.2" fill="#d946ef" class="trend-dot" />`;
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
    }
}

// Bomb explosion when a 7 is rolled!
function celebrateSeven() {
    console.log('💣 BOOM! Seven rolled - explosion triggered!');

    // Play bomb sound
    playBombSound();

    // Add explosion class to the container
    const container = document.querySelector('.container');
    container.classList.add('explode');

    // Create explosion flash
    const flash = document.createElement('div');
    flash.className = 'explosion-flash';
    document.body.appendChild(flash);

    // Remove flash after animation
    setTimeout(() => {
        flash.remove();
    }, 500);

    // Make all elements fall apart - target the current visible page
    const currentPage = document.querySelector('.page:not(.hidden)');
    const allElements = Array.from(currentPage.querySelectorAll('h1, h2, h3, button, .dice-container, .quick-stats, .stat-card, .history, .distribution, .number-item, .bar-graph, .setting-row, .settings-section'));

    // Add the total display to fall last
    const totalDisplay = document.getElementById('total');
    console.log('Total display element:', totalDisplay);
    if (totalDisplay) {
        allElements.push(totalDisplay);
        console.log('✅ Total display added to falling elements');
    }

    console.log(`Found ${allElements.length} elements to explode`);

    allElements.forEach((el, index) => {
        // Add random direction for each element
        el.style.setProperty('--random-x', Math.random());

        // Total display falls after 0.5 seconds so user can read it
        const delay = (el === totalDisplay) ? 500 : index * 30;

        setTimeout(() => {
            if (el === totalDisplay) {
                console.log('🎯 Making total display fall now!');
            }
            el.classList.add('fall-apart');

            // Play dramatic falling sound when total 7 falls
            if (el === totalDisplay && enableBombSound) {
                playSevenFallSound();
            }
        }, delay);
    });

    // Reset everything after explosion
    setTimeout(() => {
        container.classList.remove('explode');
        allElements.forEach(el => {
            el.classList.remove('fall-apart');
            el.style.removeProperty('--random-x');
        });
    }, 3000);

    // Create explosion particles
    createExplosionParticles();
}

// Create explosion particles
function createExplosionParticles() {
    const particlesContainer = document.getElementById('particles');
    particlesContainer.innerHTML = ''; // Clear existing particles

    // Create 100 explosion particles
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        // Random starting position near center
        const startX = 50 + (Math.random() - 0.5) * 20;
        const startY = 50 + (Math.random() - 0.5) * 20;

        // Random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;

        // Random size
        const size = 5 + Math.random() * 15;

        // Random colors (fire colors: red, orange, yellow)
        const colors = ['#ff0000', '#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            left: ${startX}%;
            top: ${startY}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            --end-x: ${endX}%;
            --end-y: ${endY}%;
            animation-delay: ${Math.random() * 0.1}s;
        `;

        particlesContainer.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
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

