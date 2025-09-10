// ========== Constants & Config ==========
const categoryMap = {
    'general-knowledge': 9,
    'science-and-nature': 17,
    'film': 11,
    'music': 12,
    'video-games': 15,
    'sports': 21,
    'geography': 22,
    'history': 23,
    'computers': 18
}

const sizeByDifficulty = {
    easy: 11,
    medium: 13,
    hard: 15
}

const attemptsByDifficulty = {
    easy: 36,
    medium: 60,
    hard: 96
}

// ========== Global Variables ==========
let selectedCategory = null;
let chosenDifficulty = null;
let clueBank = new Map(); 
let currentOrientation = 'across';

const FOCUSABLE_SELECTOR = [
    '[autofocus]', 'a[href]', 'button:not([disabled])', 
    'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(', ');

document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM Element References ==========
    const html = document.documentElement;
    const toggleBtn = document.querySelector('[data-theme-toggle]');
    const startBtn = document.querySelector('#start-game-btn');
    const heroSection = document.querySelector('#hero-section');
    const categorySection = document.querySelector('#category-section');
    const categoryContainer = categorySection?.querySelector('.category-container');
    const difficultySection = document.querySelector('#difficulty-section');
    const difficultyContainer = difficultySection?.querySelector('.difficulty-btn-container');
    const gameSection = document.querySelector('#game-section');
    const board = document.getElementById('crossword-board');
    const backBtns = document.querySelectorAll('.back-btn');
    const modalButtons = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const body = document.body;
    const restartBtn = document.getElementById('restart-btn');
    const homeBtn = document.getElementById('home-btn');
    const completeModal = document.getElementById('completeModal');

    // ========== Initialisation ==========
    initModals({ buttons: modalButtons, modals, body });
    initThemeToggle(toggleBtn, html);
    initHeaderHeightObserver();

    // ========== Utilities ==========
    /**
     * Decodes HTML entities in a string to their corresdonding characters.
     * 
     * Useful for handling API responses or user input that inclues HTML-encoded characters.
     * 
     * @param {string} html - The HTML-encoded string to decode.
     * @returns {string} - The decoded plain-text string.
     */
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    /**
     * Shuffles the elements of an array in place using the Fisher-Yates algorithm.
     * 
     * This function rearranges the elements of the given array in a random order.
     * It modifies the original array and returns it.
     * 
     * @param {any[]} arr - The array to be shuffled.
     * @returns {any[]} - The same array with its elements randomly reordered. 
     */
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Initialise the theme toggle functionality for light/dark mode.
     * 
     * - Applies a saved theme from localStorage if available.
     * - Falls back to system preference (prefers-color-scheme) if no theme is saved.
     * - Listens for clicks on the toggle button to switch between light and dark themes.
     * - Updates the HTML root's `data-theme` attribute and the toggle button's accessibility labels.
     * 
     * @param {HTMLElement|null} btn - The toggle button element. If null, no toggle interaction is set up.
     * @param {HTMLElement} [root = document.documentElement] - The root element to apply the `data-theme` attribute to.
     */
    function initThemeToggle(btn, root = document.documentElement) {
        let theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        applyTheme(theme);

        if (btn) {
            btn.addEventListener('click', () => {
                theme = theme === 'dark' ? 'light' : 'dark';
                localStorage.setItem('theme', theme);
                applyTheme(theme);
            });
        }

        /**
         * Applies the selected theme by updating the `data-theme` attribute on the root element.
         * Also updates the toggle button's accessibility attributes.
         * 
         * @param {string} theme - The current theme to apply ('light' or 'dark').
         */
        function applyTheme(theme) {
            root.setAttribute('data-theme', theme);
            if (btn) {
                btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
                btn.setAttribute('aria-pressed', String(theme === 'dark'));
            }
        }
    }

    let activeModal = null;
    let escHandler = null;
    let trapHandler = null;

    /**
     * Initialises modal functionality by wiring up open and close behaviour, managing focus trapping and escape key handling for accessibility.
     * 
     * @param {Object} options - Configuration object.
     * @param {NodeListOf<Element>} options.buttons - Elements that trigger modals (must have a `data-modal` attribute). 
     * @param {NodeListOf<Element>} options.modals - All modal elements on the page.
     * @param {HTMLElement} options.body - The <body> element, used to toggle a class when modals are open.
     */
    function initModals({ buttons, modals, body }) {
        

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-modal');
                openModal(document.getElementById(id), button);
            });
        });

        modals.forEach(modal => {
            modal.addEventListener('click', e => {
                if (e.target.closest('.close-modal')) {
                    e.preventDefault();
                    closeModal(modal);
                    return;
                }
                const content = modal.querySelector('.modal-content');
                if (content && !content.contains(e.target)) closeModal(modal);
            });
        });
    }

    /**
     * Opens a modal dialog, applies ARIA accessibility attributes, traps keyboard focus inside the modal, and sets up Escape key to close it.
     * 
     * @param {HTMLElement} modal - The modal element tp open.
     * @param {HTMLElement} openerEl  - The element that triggered the modal to open.
     * @returns 
     */
    function openModal(modal, openerEl) {
        if (!modal) return;
        if (activeModal && activeModal !== modal) closeModal(activeModal);

        activeModal = modal;
        modal.dataset.returnFocusId = openerEl?.id || '';
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-modal', 'true');
        if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
        body.classList.add('modal-open');

        requestAnimationFrame(() => {
            (modal.querySelector('.close-modal') || 
                modal.querySelector(FOCUSABLE_SELECTOR) ||
                modal).focus?.();
        });

        escHandler = (e) => {
            if (e.key === 'Escape') closeModal(modal);
        };

        trapHandler = (e) => {
            if (e.key !== 'Tab') return;
            const focusables = [...modal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
            if (!focusables.length) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const current = document.activeElement;

            if (e.shiftKey && current === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && current === last) {
                e.preventDefault()
                first.focus();
            }
        };

        document.addEventListener('keydown', escHandler);
        document.addEventListener('keydown', trapHandler);
    }

    /**
     * Closes the modal dialog, removes ARIA accessibility attributes, unbinds key event listeners, and restores focus to the element that opened the modal.
     * 
     * @param {HTMLElement} modal - The modal element to close.
     * @returns 
     */
    function closeModal(modal) {
        if (!modal) return;

        modal.hidden = true;
        modal.setAttribute('aria-hidden', true);
        modal.removeAttribute('aria-modal');
        body.classList.remove('modal-open');

        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
            escHandler = null;
        }
        if (trapHandler) {
            document.removeEventListener('keydown', trapHandler);
            trapHandler = null;
        }

        const returnId = modal.dataset.returnFocusId;
        const fallback = document.querySelector('#site-header a, #site-header button');
        (returnId ? document.getElementById(returnId) : fallback)?.focus?.();

        activeModal = null;
    }

    /**
     * Initialises a dynamic header height observer that updates CSS custom properties based on the current height of the site header.
     * 
     * This ensures that other layout elements (e.g., scroll padding) adapt automatically when the header's size changes due to content, resizing, or device orientation.
     */
    function initHeaderHeightObserver() {
        const headerEl = document.getElementById('site-header');
        if (headerEl) {
            const updateHeaderHeight = () => { 
                const h = Math.ceil(headerEl.getBoundingClientRect().height);
                const root = document.documentElement;
                root.style.setProperty('--header-h', `${h}px`); 

                root.style.setProperty('--scroll-pad-top', `calc(${h}px + 1rem)`);
            };
            updateHeaderHeight();
            new ResizeObserver(updateHeaderHeight).observe(headerEl);
            window.addEventListener('orientationchange', updateHeaderHeight);
            window.addEventListener('resize', updateHeaderHeight);
        }
    }

    const log = (...args) => console.log('[WW]', ...args);
    
    // ========== Event Listeners ==========
    startBtn?.addEventListener('click', () => {
        goToSection(heroSection, categorySection, '#category-title');
    });

    categoryContainer?.addEventListener('click', (e) => {
        const categoryBtn = e.target.closest('[data-category]');
        if (!categoryBtn) return;

        selectedCategory = categoryBtn.getAttribute('data-category');
        goToSection(categorySection, difficultySection, '#difficulty-title');
    });

    difficultyContainer?.addEventListener('click', (e) => {
        const difficultyBtn = e.target.closest('[data-difficulty]');
        if (!difficultyBtn) return;

        chosenDifficulty = difficultyBtn.getAttribute('data-difficulty');
        setGameTitle(selectedCategory);

        goToSection(difficultySection, gameSection, '#game-title');
        loadCrossword(selectedCategory, chosenDifficulty);
    });

    backBtns.forEach(backBtn => {
        backBtn.addEventListener('click', () => {
            const prevId = backBtn.getAttribute('data-prev');
            const currentSection = backBtn.closest('section');
            const previousSection = document.getElementById(prevId);

            if (!currentSection || !previousSection) {
                console.warn('Back handler: missing current or previous section', { prevId, currentSection, previousSection });
                return;
            } 

            const headingId = previousSection.getAttribute('aria-labelledby');
            const focusSel = headingId ? `#${headingId}` : null;
            goToSection(currentSection, previousSection, focusSel);
        });
    });

    restartBtn?.addEventListener('click', () => {
        returnToSection(document.getElementById('category-section'), '#category-title');
    });

    homeBtn?.addEventListener('click', () => {
        returnToSection(document.getElementById('hero-section'), 'h1');
    });

    // ========== Navigation Functions ==========
    /**
     * Show or hides a section element, updating its visibility classes and ARIA attributes.
     * 
     * @param {HTMLElement} section - The section to show or hide.
     * @param {boolean} visible - Whether the section should be visible (`true`) or hidden (`false`).
     */
    function setSectionVisible (section, visible) {
        if (!section) return;

        section.classList.toggle('hidden', !visible);
        section.toggleAttribute('hidden', !visible);
        section.setAttribute('aria-hidden', visible ? 'false' : 'true')
    }

    /**
     * Navigate from one section to another, updates visibility, scrolls to a new section, and moves focus to a specific element within the new section.
     * 
     * @param {HTMLElement} from - The currently visible section to hide.
     * @param {HTMLElement} to - The section to show and scroll into view.
     * @param {string} [focusSelector] - CSS selector for an element within `to` to focus after scroll.
     */
    function goToSection(from, to, focusSelector) {
        if (!from || !to) return;

        setSectionVisible(from, false);
        setSectionVisible(to, true);

        requestAnimationFrame(() => {
            const target = focusSelector ? to.querySelector(focusSelector) : to;
            if (!target) return;

            const headerPx = parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue('--header-h')
            ) || 0;

            const y = target.getBoundingClientRect().top + window.scrollY - headerPx - 10;
            window.scrollTo({ top: y, behavior: 'smooth' });
            target.focus?.({ preventScroll: true });
        });
    }

    /**
     * Navogates from game section to the target seection (hero or category), resetting the game state.
     * 
     * @param {HTMLElement} targetSection - The section to show.
     * @param {string} focusSelector - Optional CSS selector to apply focus.
     */
    function returnToSection (targetSection, focusSelector = '') {
        closeModal(completeModal);

        setSectionVisible(document.getElementById('game-section'), false);
        setSectionVisible(targetSection, true);

        resetGrid();
        requestAnimationFrame(() => {
            if (focusSelector) targetSection.querySelector(focusSelector)?.focus();
        });
    }

    // ========== Crossword Initialisation ==========
    /**
     * Fetch trivia questions from the Open Trivia DB API based on the selected category and difficulty, sanitises and filters the results, builds the best crossword layout from the clues, and renders the crossword board.
     * 
     * @async
     * @param {string} selectedCategory - The slug of the chosen category.
     * @param {string} chosenDifficulty - The selected difficulty level.
     */
    async function loadCrossword(selectedCategory, chosenDifficulty) {
        const categoryId = categoryMap[selectedCategory];
        if (!categoryId) {
            console.warn('Unknown category:', selectedCategory);
            return;
        }

        const gridSize = sizeByDifficulty[chosenDifficulty] || 13;
        const attempts = attemptsByDifficulty[chosenDifficulty] ?? 36;
        const amount = ({
            easy: 40,
            medium: 40,
            hard: 50
        }[chosenDifficulty]) ?? 40;

        const url = new URL('https://opentdb.com/api.php');
        url.search = new URLSearchParams({
            amount: String(amount),
            category: String(categoryId),
            difficulty: chosenDifficulty,
            type: 'multiple'
        }).toString();

        let data;
        try {
            const res = await fetch(url);
            data = await res.json();
        }
        catch (err) {
            console.error('Failed to fetch trivia data', err);
            return;
        }

        if (data?.response_code !== 0 || !Array.isArray(data.results)) {
            console.warn('Unexpected API response:', data);
            return;
        }

        const clues = sanitiseResults(data.results, gridSize);
        clueBank = new Map(clues.map(c => [c.id, c]));

        const bestGrid = buildBestLayout(clues, gridSize, attempts);
        renderCrossword(bestGrid, clueBank);
        renderClues(bestGrid, clueBank);
        renderBoardActions();
        wireBoardInputs();

        /**
         * Cleans and filter te raw trivia results from the API to produce valid crossword clues.
         * 
         * - Decodes HTML entities in questions and answers.
         * - removes any non-alphabetic characters from answers.
         * - Filters outanswers that are too long, contani digits, or are duplicates.
         * - Converts answers to uppercase for consistency in crossword placement.
         * 
         * @param {Array<Object>} results - The raw trivia question objects from the API.
         * @param {number} maxLen - The maximum allowed length for any answer (Based on grid size).
         * @returns  {Array<Object>} - An array of valid clue objects.
         */
        function sanitiseResults(results, maxLen) {
            const seen = new Set();
            const out = [];
            for (const r of results) {
                const clue = decodeHTML(r.question);
                const answer = decodeHTML(r.correct_answer);
                const clean = answer.replace(/[^A-Z]/gi, '').toUpperCase();
                if (!clean) continue;
                if (/\d/.test(answer)) continue;
                if (clean.length > maxLen) continue;
                if (seen.has(clean)) continue;
                seen.add(clean);
                out.push({ clue, answer: clean, id: `clue-${out.length}` });
            }
            return out;
        }
    }

    // ========== Crossword Construction Logic ==========
    /**
     * Attempts to generate the best possible crossword layout from a given set of clues.
     * 
     * It runs multiple layout attempts by randomlu shuffling the clues each time, then returns the grid layout that filled the most cells.
     * 
     * @param {Array<Object>} rawClues - Array of clue objects containing question and answer data.
     * @param {number} gridSize - Size of the square crossword grid.
     * @param {number} [attempts=12] - Number of layout attempts to try using different clue orders.
     * @returns {Array<Array<Object>>} The best-performiong grid layout found, or an empty grid if none is suitable. 
     */
    function buildBestLayout(rawClues, gridSize, attempts = 12) {
        if (!Array.isArray(rawClues) || rawClues.length === 0) return [];

        const tryLayout = (clues) => {
            const placedClues = assignCluePositions(clues, gridSize);
            const candidateGrid = generateGrid(placedClues, gridSize);
            const filledCount = countFilledCells(candidateGrid);
            return { grid: candidateGrid, filled: filledCount };
        };

        let bestCandidate = null;

        for (let attemptIndex = 0; attemptIndex < attempts; attemptIndex++) {
            const shuffledClues = shuffle(rawClues.map(c => ({ ...c })));
            const candidate = tryLayout(shuffledClues);
            if (!bestCandidate || candidate.filled > bestCandidate.filled) {
                bestCandidate = candidate;
            }
        }

        return bestCandidate?.grid ?? [];

        /**
         * Counts how many non-block cells in the crossword grid contain a letter.
         * 
         * This is used to evaluate how well a crossword layout performs by checking how many letter cells are filled (excluding black squares).
         * 
         * @param {Array<Array<Object>>} grid - The 2D crossword grid to evaluate.
         * @returns {number} The total number of filled letter cells in the grid.
         */
        function countFilledCells(grid) {
            let count = 0;
            for (const row of grid) {
                for (const cell of row) {
                    if (!cell.isBlock && cell.letter) count++;
                }
            }
            return count;
        }
    }

    /**
     * Attempts to place all valid clues onto a crossword grid using a mix of optimal and fallback logic.
     * Words are positioned to maximise intersections and minimise empty space.
     * @param {Array<Object>} clues - The list of clue objects containing answer string.
     * @param {number} [gridSize=15] - The width and height of the square crossword grid.
     * @returns {Array<Object>}A filtered list of clue objects that were successfully placed on the grid, each updated with position and orientation.
     */
    function assignCluePositions(clues, gridSize = 15) {
        const ACROSS = 'across';
        const DOWN = 'down';

        const validClues = clues.filter(clue => 
            clue?.answer && /^[A-Z]+$/.test(clue.answer) && 
            clue.answer.length <= gridSize
        );
        if (validClues.length === 0) return [];

        const gridChars = makeGrid(gridSize);

        validClues.sort((clueA, clueB) =>
            clueB.answer.length - clueA.answer.length || (Math.random() - 0.5)
        );

        placeSeed(validClues[0]);

        for (let clueIndex = 1; clueIndex < validClues.length; clueIndex++) {
            const clue = validClues[clueIndex];
            const candidatePlacements = getCandidates(clue).sort(compareCandidates(clue));
            let placed = false;

            for (const candidate of candidatePlacements) {
                if (canPlace(clue, candidate.startRow, candidate.startCol, candidate.ori)) {
                    place(clue, candidate.startRow, candidate.startCol, candidate.ori);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                const fallbackSpot = findFirstSpot(clue);
                if (fallbackSpot) place(clue, fallbackSpot.startRow, fallbackSpot.startCol, fallbackSpot.ori);
                else console.warn(`Could not place: ${clue.answer}`);
            }
        }

        return validClues.filter(c => c.placed);

        /**
         * Creates a 2D grid array filled with `null` values.
         * 
         * @param {number} size - The number of rows and columns in the grid.
         * @returns {Array<Array<null>>} A square grid of specified size filled with `null`
         */
        function makeGrid(size) {
            return Array.from({ length: size }, () => Array(size).fill(null));
        }

        /**
         * Checks if a given row and column coordinate is within the bounds of the grid.
         * @param {number} row - The row index to check.
         * @param {number} col - The column index to check.
         * @returns {boolean} True if tthe coordinates are within bounds, false otherwise.
         */
        function inBounds(row, col) {
            return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
        }

        /**
         * Places a clue's answer on the grid at the specified starting position and orientation.
         * Updates the clue object with placement metadata.
         * 
         * @param {object} clue - The clue object to place. 
         * @param {number} startRow - Starting row Index
         * @param {number} startCol - Starting column Index
         * @param {string} ori - Orientation of the clue.
         */
        function place(clue, startRow, startCol, ori) {
            const word = clue.answer;
            for (let i = 0; i < word.length; i++) {
                const row = ori === ACROSS ? startRow : startRow + i;
                const col = ori === ACROSS ? startCol + i : startCol;
                gridChars[row][col] = word[i];
            }
            clue.row = startRow;
            clue.col = startCol;
            clue.orientation = ori;
            clue.placed = true;
        }

        /**
         * Deterines if a word can be placed on the grid at the specified position and orientation without overlapping invalid characters or breaking crossword rules.
         * 
         * @param {Object} clue - The clue object being tested.
         * @param {number} startRow - Starting row Index. 
         * @param {number} startCol - Starting column Index.
         * @param {string} ori - Orientation
         * @returns {boolean} True if the clue can be placed, false otherwise.
         */
        function canPlace(clue, startRow, startCol, ori) {
            const word = clue.answer;

            const lastRow = ori === ACROSS ? startRow : startRow + word.length - 1;
            const lastCol = ori === ACROSS ? startCol + word.length - 1 : startCol;
            if (!inBounds(startRow, startCol) || !inBounds(lastRow, lastCol)) return false;

            const prevRow = ori === ACROSS ? startRow : startRow - 1;
            const prevCol = ori === ACROSS ? startCol - 1 : startCol;
            const nextRow = ori === ACROSS ? startRow : startRow + word.length;
            const nextCol = ori === ACROSS ? startCol + word.length : startCol;

            if (inBounds(prevRow, prevCol) && gridChars[prevRow][prevCol] !== null) return false; 
            if (inBounds(nextRow, nextCol) && gridChars[nextRow][nextCol] !== null) return false; 

            for (let i = 0; i < word.length; i++) {
                const row = ori === ACROSS ? startRow : startRow + i;
                const col = ori === ACROSS ? startCol + i : startCol;
                const existingChar = gridChars[row][col];
                
                if (existingChar !== null && existingChar !== word[i]) return false;

                if (existingChar === null) {
                    if (ori === ACROSS) {
                        if (inBounds(row - 1, col) && gridChars[row - 1][col] !== null) return false;
                        if (inBounds(row + 1, col) && gridChars[row + 1][col] !== null) return false;
                    }
                    else {
                        if (inBounds(row, col - 1) && gridChars[row][col - 1] !== null) return false;
                        if (inBounds(row, col + 1) && gridChars[row][col + 1] !== null) return false;
                    }
                }
            }
            return true;
        }

        /**
         * Attempts to place the first clue in the centre of the grid as the starting point (seed).
         * Falls back to the first available valid spot if centred placement fails.
         * 
         * @param {object} firstClue - The first clue to place on the board.
         */
        function placeSeed(firstClue) {
            if (!firstClue) return;
            const startRow = Math.floor(gridSize / 2);
            const startCol = Math.floor((gridSize - firstClue.answer.length) / 2);
            if (canPlace(firstClue, startRow, startCol, ACROSS)) {
                place(firstClue, startRow, startCol, ACROSS);
                return;
            }
            const fallbackSpot = findFirstSpot(firstClue);
            if (fallbackSpot) place(firstClue, fallbackSpot.startRow, fallbackSpot.startCol, fallbackSpot.ori);
            else console.warn(`Could not place seed: ${firstClue.answer}`);
        }

        /**
         * Generate a list of potential placement positions for a given clue by matching its letters to existing letters already on the grid.
         * 
         * @param {object} clue - The clue to evaluate.
         * @returns {Array<Object>} An array of candiate placements with start coordinates and orientation.
         */
        function getCandidates(clue) {
            const word = clue.answer;
            const placements = [];
            for (let letterIndex = 0; letterIndex < word.length; letterIndex++) {
                for (let row = 0; row < gridSize; row++) {
                    for (let col = 0; col < gridSize; col++) {
                        if (gridChars[row][col] !== word[letterIndex]) continue;

                        const startRowDown = row - letterIndex, startColDown = col;
                        if (canPlace(clue, startRowDown, startColDown, DOWN)) {
                            placements.push({ startRow: startRowDown, startCol: startColDown, ori: DOWN });
                        }

                        const startRowAcross = row, startColAcross = col - letterIndex;
                        if (canPlace(clue, startRowAcross, startColAcross, ACROSS)) {
                            placements.push({ startRow: startRowAcross, startCol: startColAcross, ori: ACROSS });
                        }
                    }
                }
            }
            return placements;
        }

        /**
         * Returns a comparator function to rank candidate placements by number of overlaps and proximity to the grid's centre.
         * @param {Object} clue - The clue being placed.
         * @returns {function(Object, Object): number} A sorting comparator for candiate placements.
         */
        function compareCandidates(clue) {
            const word = clue.answer;
            const centreCoord = (gridSize - 1) / 2;

            return (candA, candB) => {
                const crossesA = countCrosses(candA, word);
                const crossesB = countCrosses(candB, word);
                if (crossesB !== crossesA) return crossesB - crossesA;

                const distA = centreDistance(candA, word.length, centreCoord);
                const distB = centreDistance(candB, word.length, centreCoord);
                return distA - distB;
            };
        }

        /**
         * Counts how many letters in a candidate placement intersect with existing letters on the grid.
         * 
         * @param {Object} candidate - A placement option with row, col, and orientation.
         * @param {string} word - The clue answer being placed.
         * @returns {number} The number of matching characters already on the board.
         */
        function countCrosses(candidate, word) {
            let crosses = 0;
            for (let i = 0; i < word.length; i++) {
                const row = candidate.ori === ACROSS ? candidate.startRow : candidate.startRow + i;
                const col = candidate.ori === ACROSS ? candidate.startCol + i : candidate.startCol;
                if (gridChars[row]?.[col] === word[i]) crosses++;
            }
            return crosses;
        }

        /**
         * Calculate the Manhattan distance from the candidate placement's centre point to the centre of the grid.
         * 
         * @param {Object} candidate - A placement option with row, col, and orientation.
         * @param {number} length - The length of. the word.
         * @param {number} centreCoord - The central coordinate of the grid.
         * @returns {number} The sum of horizontal and vertical distance from centre.
         */
        function centreDistance(candidate, length, centreCoord) {
            const midpointRow = candidate.ori === DOWN ? candidate.startRow + (length - 1) / 2 : candidate.startRow;
            const midpointCol = candidate.ori === ACROSS ? candidate.startCol + (length - 1) / 2 : candidate.startCol;
            return Math.abs(midpointRow - centreCoord) + Math.abs(midpointCol - centreCoord);
        }

        /**
         * Finds the first available valid spot on the grid where a clue can be placed.
         * 
         * @param {Object} clue - The clue to place.
         * @returns {Object|null} A placement object or null if none found.
         */
        function findFirstSpot(clue) {
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    if (canPlace(clue, row, col, ACROSS)) return { startRow: row, startCol: col, ori: ACROSS };
                    if (canPlace(clue, row, col, DOWN))   return { startRow:row, startCol: col, ori: DOWN };
                }
            }
            return null;
        }
    }

    /**
     * Converts an array of placed clues into a structured crossword grid.
     * 
     * Each grid cell contains metadata such as its position, letter, clue associations, and whether it starts a clue.
     * 
     * @param {Array<Object>} placedClues - An array of clue objects with row, col, id, answer, and orientation.
     * @param {number} gridSize - The size of the square crossword grid.
     * @returns {Array<Array<Object>>} A 2D grid array where each cell includes letter data and clue metadata.
     */
    function generateGrid(placedClues, gridSize) {
        const ACROSS = 'across';

        const cellGrid = Array.from({ length: gridSize }, (_, rowIndex) =>
            Array.from({ length: gridSize }, (_, colIndex) => ({
                row: rowIndex,
                col: colIndex,
                isBlock: true,
                letter: '',
                acrossClueId: null,
                downClueId: null,
                isStartOfClue: false
            }))
        );

        const positionsForClue = (placedClue) => {
            const lettersArr = placedClue.answer.toUpperCase().split('');
            return lettersArr.map((letter, offsetIndex) => ({
                row: placedClue.orientation === ACROSS ? placedClue.row : placedClue.row + offsetIndex,
                col: placedClue.orientation === ACROSS ? placedClue.col + offsetIndex : placedClue.col,
                letter
            })); 
        };

        for (const placedClue of placedClues) {
            if (!Number.isInteger(placedClue.row) || !Number.isInteger(placedClue.col)) {
                continue;
            }

            const positions = positionsForClue(placedClue);

            const isOutOfBounds = positions.some(pos =>
                pos.row < 0 || pos.col < 0 || pos.row >= gridSize || pos.col >= gridSize
            );
            if (isOutOfBounds) {
                console.warn(`Skipping "${placedClue.answer}" due to conflict`);
                continue;
            }

            positions.forEach((pos, letterIndex) => {
                const gridCell = cellGrid[pos.row][pos.col];
                gridCell.letter = pos.letter;
                gridCell.isBlock = false;
                if (placedClue.orientation === ACROSS) gridCell.acrossClueId = placedClue.id;
                else gridCell.downClueId = placedClue.id;
                if (letterIndex === 0) gridCell.isStartOfClue = true;
            });

            placedClue.placed = true;
        }

        return cellGrid;
    }

    /**
     * Scans the crossword grid and assigns numbers to the starting cells of each across and down word. These numbers are used for displaying the puzzle clues and for referencing cell in the UI.
     * 
     * @param {Array<Array<Object>>} grid - A 2D array representing the crossword grid.
     * @returns {Object} An object with `across` and `down` arrays, each containing objects with clue number, row, col, and clue ID.
     */
    function computeClueNumbers(grid) {
        const clueNumbers = { across: [], down: [] };
        let nextClueNumber = 1;

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid.length; col++) {
                const cell = grid[row][col];
                if (cell.isBlock) continue;

                const startsAcross = (!grid[row][col-1] || grid[row][col-1].isBlock) &&
                                     (grid[row][col+1] && !grid[row][col+1].isBlock);
                const startsDown = (!grid[row-1]?.[col] || grid[row-1][col].isBlock) &&
                                   (grid[row+1]?.[col] && !grid[row+1][col].isBlock);
                
                if (startsAcross || startsDown) {
                    if (startsAcross) clueNumbers.across.push({ number: nextClueNumber, row, col, id: cell.acrossClueId });
                    if (startsDown) clueNumbers.down.push({ number: nextClueNumber, row, col, id: cell.downClueId});
                    nextClueNumber++;
                }
            }
        }
        return clueNumbers;
    }

    /**
     * Builds a clue index from the crossword grid and clue bank.
     * It combines grid-based clue positions with metadata like clue text, answer, and length.
     * @param {Array<Array<Object>>} grid - A 2D array representing the crossword puzzle grid.
     * @param {Map<string, Object>} bank - A Map of clue metadata keyed by clue ID.
     * @returns {Object} An object with `across` and `down` arrays, each containing clue data including number, position, orientation, clue text, answer, and answer length.
     */
    function buildClueIndex(grid, bank) {
        const clueNumbers = computeClueNumbers(grid);

        const getAnswerLength = (startRow, startCol, ori) => {
            let length = 0;
            if (ori === 'across') {
                for (let c = startCol; c < grid.length && !grid[startRow][c].isBlock; c++) {
                    length++;
                }
            }
            else {
                for (let r = startRow; r < grid.length && !grid[r][startCol].isBlock; r++) {
                    length++;
                }
            }
            return length;
        };

        const attachMetaData = (entries, ori) => entries.map(({ number, row: startRow, col: startCol, id }) => {
            const clueMeta = bank.get(id) || {};
            return {
                number,
                orientation: ori,
                row: startRow,
                col: startCol,
                id,
                orientation: ori,
                clue: clueMeta.clue || '(missing clue)',
                answer: clueMeta.answer || '',
                length: getAnswerLength(startRow, startCol, ori)
            };
        });

        return {
            across: attachMetaData(clueNumbers.across, 'across'),
            down: attachMetaData(clueNumbers.down, 'down')
        };
    }

    // ========== Rendering Functions ==========
    /**
     * Render the crossword board on the page using the provided cell grid.
     * Builds each cell with appropiate data, styles, and input elements, and injects them into the DOM using document fragment for performance.
     * @param {Array<Array<Object>>} cellGrid - 2D array representing the crossword grid structure. 
     */
    function renderCrossword(cellGrid) {
        if (!board || !Array.isArray(cellGrid) || cellGrid.length === 0) return;

        const clueNumberByCoord = (() => {
            const numberMap = new Map();
            const clueNumbers = computeClueNumbers(cellGrid);
            for (const acrossStart of clueNumbers.across) {
                numberMap.set(`${acrossStart.row},${acrossStart.col}`, acrossStart.number);
            }
            for (const downStart of clueNumbers.down) {
                const coordKey = `${downStart.row},${downStart.col}`;
                if (!numberMap.has(coordKey)) numberMap.set(coordKey, downStart.number);
            }
            return numberMap;
        })();

        const gridSize = cellGrid.length;
        board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        board.replaceChildren();

        const frag = document.createDocumentFragment();
        for (const rowCells of cellGrid) {
            for (const gridCell of rowCells) {
                frag.appendChild(buildCell(gridCell));
            }
        }

        board.appendChild(frag);

        /**
         * Create a DOM element representing a single crossword cell.
         * This includes visual styling, clue numbers, and user input elements if the cell is not a block.
         * 
         * @param {Object} gridCell - The data for the cell including position, content, and metadata.
         * @returns {HTMLElement} - A div element representing the grid cell.
         */
        function buildCell(gridCell) {
            const el = document.createElement('div');
            el.className = gridCell.isBlock ? 'cell black-cell' : 'cell';
            el.dataset.row = String(gridCell.row);
            el.dataset.col = String(gridCell.col);

            if (!gridCell.isBlock) {
                el.dataset.acrossId = gridCell.acrossClueId || '';
                el.dataset.downId = gridCell.downClueId || '';
            }

            if (!gridCell.isBlock) {
                const coordKey = `${gridCell.row},${gridCell.col}`;
                const clueNumber = clueNumberByCoord.get(coordKey);
                if (clueNumber) {
                    const badgeNumber = document.createElement('span');
                    badgeNumber.className = 'cell-num';
                    badgeNumber.textContent = String(clueNumber);
                    el.appendChild(badgeNumber);
                }

                el.dataset.solution = (gridCell.letter || '').toUpperCase();

                const input = document.createElement('input');
                input.className = 'cell-input';
                input.type = 'text';
                input.inputMode = 'latin';
                input.maxLength = 1;
                input.autocomplete = false;
                input.setAttribute('aria-label', `Row ${gridCell.row + 1}, column ${gridCell.col + 1}`);

                el.appendChild(input);
            } 
            
            return el;
        }
    }

    /**
     * Renders the crossword clues, carousel navigation, and game controls into the DOM.
     * Builds both across and down clues using the crossword grid and clue bank, and wires up interactions for clue selection, keyboard access, and navigation.
     * @param {Array<Array<Object>>} grid - The 2D grid of crossword cell objects.
     * @param {Map<string, Object>} bank - A Map of clue metadata keyed by clue ID.
     */
    function renderClues(grid, bank) {
        const container = document.getElementById('clues-container');
        if (!container) return;

        const clueIndex = buildClueIndex(grid, bank);

        const linearClues = [...clueIndex.across, ...clueIndex.down];

        container.innerHTML = `
            <div class="clue-carousel" role="region" aria-label="Current clue">
                <button class="clue-nav prev" aria-label="Previous clue" type="button" title="Previous clue"><i class="fa-solid fa-caret-left"></i></button>
                <div class="clue-display" aria-live="polite">
                    <span class="clue-line">
                        <span class="clue-no"></span>
                        <span class="clue-direction"></span>
                        <span class="clue-meta"></span>
                    </span>
                    <span class="clue-text"></span>
                </div>
                <button class="clue-nav next" aria-label="Next clue" type="button" title="Next clue"><i class="fa-solid fa-caret-right"></i></button>
            </div>

            <div class="game-ctrls" aria-label="Game controls">
                <button class="ctrl-btn hint" type="button" aria-label="Hint">Hint</button>
                <button class="ctrl-btn submit" type="button" aria-label="Submit">Submit</button>
                <button class="ctrl-btn reset" type="button" aria-label="Reset">Reset</button>
            </div>

            <div class="clues-panels" role="region" aria-label="Clues">
                <section class="clues-panel">
                    <h3>Across</h3>
                    <ol class="across-list"></ol>
                </section>
                <section class="clues-panel">
                    <h3>Down</h3>
                    <ol class="down-list"></ol>
                </section>
            </div>
        `;

        const acrossOl = container.querySelector('.across-list');
        const downOl = container.querySelector('.down-list');

        const liFor = clue => {
            const li = document.createElement('li');
            li.dataset.clueId = clue.id || '';
            li.dataset.row = clue.row;
            li.dataset.col = clue.col;
            li.dataset.ori = clue.orientation;
            li.innerHTML = `<span class="no">${clue.number}.</span> ${clue.clue} <span class="clue-meta">(${clue.length})</span>`;
            li.tabIndex = 0;
            return li;
        };

        clueIndex.across.forEach(c => acrossOl?.appendChild(liFor(c)));
        clueIndex.down.forEach(c => downOl?.appendChild(liFor(c)));

        const prevBtn = container.querySelector('.clue-nav.prev');
        const nextBtn = container.querySelector('.clue-nav.next');
        const clueNumberEl = container.querySelector('.clue-no');
        const clueDirectionEl = container.querySelector('.clue-direction');
        const clueMetaEl = container.querySelector('.clue-meta');
        const clueTextEl = container.querySelector('.clue-text');

        let currentIndex = 0;

        /**
         * Updates the clue carousel display with the currently selected clue.
         * Displays the clue number, direction, length, and text, and highlights the active clue in both the clue list and on the crossword grid.
         */
        function updateCarousel() {
            if (!linearClues.length) return;
            const current = linearClues[currentIndex];

            clueNumberEl.textContent = `${current.number}.`;
            clueDirectionEl.textContent = current.orientation === 'across' ? 'Across' : 'Down';
            clueMetaEl.textContent = `(${current.length})`;
            clueTextEl.textContent = current.clue;

            setActiveListItem(current.id);
            highlightClueOnBoard(current);
        }

        prevBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + linearClues.length) % linearClues.length;
            updateCarousel();
        });
        nextBtn?.addEventListener('click', () => {
            currentIndex = (currentIndex + 1 + linearClues.length) % linearClues.length;
            updateCarousel();
        });

        /**
         * Selects a clue in the clue list and board grid based on its clue ID.
         * Updates the clue carousel, highlights the clue's starting cell, focuses the next empty input cell (if any), and prepares input state.
         * 
         * @param {string} clueId - The ID of the clue to select.
         */
        function selectClueById(clueId) {
            const i = linearClues.findIndex(c => c.id === clueId);
            if (i === -1) return;
            currentIndex = i;
            updateCarousel();

            const { row, col, orientation } = linearClues[currentIndex];
            const firstCell = getCellEl(row, col);

            currentOrientation = orientation;
            const activeCells = activeCellsSorted();
            const nextInput = activeCells.find(c => {
                const input = c.querySelector('.cell-input');
                return input && !input.value;
            })?.querySelector('.cell-input') || firstCell?.querySelector('.cell-input');

            highlightFromCell(firstCell, orientation);

            if (document.activeElement && document.activeElement !== nextInput) {
                document.activeElement.getBoundingClientRect();
            }

            selectClueFromCell(firstCell, currentOrientation, { skipEvent: true });
        }

        container.addEventListener('select-clue', (e) => {
            const id = e.detail?.clueId;
            log('event: select-clue', id);
            if (id) selectClueById(id);
        });

        container.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-clue-id]');
            if (!li) return;

            const clueId = li.dataset.clueId;
            const clue = linearClues.find(c => c.id === clueId);
            if (!clue) return;

            currentIndex = linearClues.indexOf(clue);
            updateCarousel();

            const { row, col, orientation } = clue;
            currentOrientation = orientation;

            const firstCell = getCellEl(row, col);
            highlightFromCell(firstCell, orientation);

            const activeCells = activeCellsSorted();
            const nextInput = activeCells.find(c => {
                const input = c.querySelector('.cell-input');
                return input && !input.value;
            })?.querySelector('.cell-input') || firstCell?.querySelector('.cell-input');

            selectClueFromCell(firstCell, currentOrientation, { skipEvent:true });
        });

        container.addEventListener('keydown', (e) => {
            const li = e.target.closest('li[data-clue-id]');
            if (!li) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectClueById(li.dataset.clueId)
            }
        });

        /**
         * Highlights the currently active clue in the list panel.
         * Removes the `is-active` class from all other clues.
         * 
         * @param {string} id - The clue ID to mark as active.
         */
        function setActiveListItem(id) {
            container.querySelectorAll('.clues-panel li').forEach(li => {
                li.classList.toggle('is-active', li.dataset.clueId === id);
            });
        }

        updateCarousel();
        wireActionButtons(container.querySelector('.game-ctrls'));
    }

    /**
     * Renders the crossword game control buttons (Hint, Submit, Reset) inside the crossword board section and wires them to their handlers.
     * 
     * @function 
     */
    function renderBoardActions() {
        const root = ensureBoardActions();
        if (!root) return;
        root.innerHTML = `
            <button class="ctrl-btn hint" type="button" aria-label="Hint">Hint</button>
            <button class="ctrl-btn submit" type="button" aria-label="Submit">Submit</button>
            <button class="ctrl-btn reset" type="button" aria-label="Reset">Reset</button>
        `;
        wireActionButtons(root);
    }

    /**
     * Ensures the crossword board has a sibling container for action buttons.
     * Creates and inserts the container if it doesn't exist.
     * 
     * @function
     * @returns {HTMLElement|null} The action buttons container element, or null if board is missing.
     */
    function ensureBoardActions() {
        const boardEl = document.getElementById('crossword-board');
        if (!boardEl) return null;
        let el = document.getElementById('board-actions');
        if (!el) {
            el = document.createElement('div');
            el.id = 'board-actions';
            el.className = 'board-actions';
            boardEl.insertAdjacentElement('afterend', el);
        }
        return el;
    }
    
    // ========== UI Functions ==========
    /**
     * Highlight all cells on the board that belong to a specific clue.
     * Scrolls the clue's starting cell into view and visually marks the clue path.
     * 
     * @param {Object} clue - The clue object containing its orientation, row, and col.
     */
    function highlightClueOnBoard(clue) {
        if (!clue || !board) return;

        clearBoardHighlights();
        log('highlightClueOnBoard', clue);
        currentOrientation = clue.orientation;

        const rowStep = clue.orientation === 'down' ? 1 : 0;
        const colStep = clue.orientation === 'across' ? 1 : 0;

        let row = Number(clue.row);
        let col = Number(clue.col);

        while (true) {
            const cell = getCellEl(row, col);
            if (!cell || cell.classList.contains('black-cell')) break;

            cell.classList.add('is-active');
            row += rowStep;
            col += colStep;
        }

        const head = getCellEl(clue.row, clue.col);
        if (head) {
            head.classList.add('is-head');
            head.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }

    /**
     * Retrieves a specific cell element from the crossword board using its row and column coordinates.
     * 
     * @param {number|string} row - The row index of the cell.
     * @param {number|string} col - The column index of the cell.
     * @returns {HTMLElement|null} The corresponding cell element, or null if not found.
     */
    function getCellEl(row , col) {
        return board?.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Removes visual classes from all crossowrd grid cells.
     * 
     * Specifically it removes 'is-active' and 'is-head' classes from any cell that currently has them, clearing previous clue highlights.
     */
    function clearBoardHighlights() {
        if (!board) return;
        board.querySelectorAll('.cell.is-active, .cell.is-head').forEach(el => el.classList.remove('is-active', 'is-head'));
    }

    /**
     * Updates the crossword game's heading based on the selected category.
     * 
     * Converts the category slug into a human-readable title and sets it as the text content of the element with ID 'game-title'.
     * 
     * @param {string} categorySlug - The category identifier.
     */
    function setGameTitle(categorySlug) {
        const label = ({
            'general-knowledge': 'General Knowledge',
            'science-and-nature': 'Science & Nature',
            'film': 'Film',
            'music': 'Music',
            'sports': 'Sports',
            'geography': 'Geography',
            'history': 'History',
            'computers': 'Computers'
        }[categorySlug]) ?? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, s => s.toUpperCase());

        const el = document.getElementById('game-title');
        if (el) el.textContent = `${label} Crossword`;
    }

    /**
     * Highlights a full clue (across or down) starting from a given cell.
     * 
     * Traverses from the selected cell to find the full span of the clue in the specified orientation, highlights all the relevant cells, and marks the starting cell as the "head" of the clue.
     * 
     * @param {HTMLElement} cell - The starting DOM element (cell) where the user clicked.
     * @param {'across' | 'down'} ori - The orientation of the clue ('across' or 'down').
     */
    function highlightFromCell(cell, ori) {
        if (!cell) return;
        clearBoardHighlights();
        currentOrientation = ori;

        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);

        log('highlightFromCell start', { row, col, ori });
        if (ori === 'across') {
            let startCol = col;
            while (true) {
                const prev = getCellEl(row, startCol - 1);
                if (!prev || prev.classList.contains('black-cell')) break;
                startCol--;
            }

            let endCol = startCol;
            for (let colIndex = startCol; ; colIndex++) {
                const el = getCellEl(row, colIndex);
                if (!el || el.classList.contains('black-cell')) {
                    endCol = colIndex - 1;
                    break;
                }
                el.classList.add('is-active');
            }
            
            getCellEl(row, startCol)?.classList.add('is-head');
            log('across head', { row, startCol, endCol });
            getCellEl(row, startCol)?.classList.add('is-head');
        }
        else {
            let startRow = row;
            while (true) {
                const prev = getCellEl(startRow - 1, col);
                if (!prev || prev.classList.contains('black-cell')) break;
                startRow--;
            }

            let endRow = startRow;
            for (let rowIndex = startRow; ; rowIndex++ ) {
                const el = getCellEl(rowIndex, col);
                if (!el || el.classList.contains('black-cell')) {
                    endRow = rowIndex - 1;
                    break;
                } 
                el.classList.add('is-active');
            }
            
            getCellEl(startRow, col)?.classList.add('is-head');
            log('down head', { col, startRow, endRow });
        }
    }
    
    /**
     * Triggers selection of the clue associated with a given cell and orientation.
     * 
     * Looks up the clue ID based on the cell's data attributes and dispatches a custon 'select-clue' event from the clues container, unless skipped via options.
     * 
     * @param {HTMLElement} cell - The DOM cell element the user interacted with.
     * @param {'across' | 'down'} ori - The intended orientation of the clue.
     * @param {Object} [options={}] - Optional argument.
     * @returns {boolean} [options.skipEvent=false] - If true, skips dispatching the event.
     */
    function selectClueFromCell(cell, ori, options = {}) {
        ori = currentOrientation;
        if (!cell) return;
        const id = cell.dataset[ori === 'across' ? 'acrossId' : 'downId'];
        log('selectClueFromCell', { ori, id, cell: cell.dataset });
        if (!id) return;

        if (options.skipEvent) return;

        const container = document.getElementById('clues-container');
        container?.dispatchEvent(new CustomEvent('select-clue', {
            detail: { clueId: id },
            bubbles: true
        }));
    }
    
    // ========== Input + Navigation Handlers ==========
    /**
     * Wires up all event listeners for the crossword board's input interactions.
     * Handles user actions such as focusing on cells, typing letters, navigation with arro keys, deleting letters, toggling clue orientation, and interacting via mouse clicks.
     * 
     * Events handled:
     * - `focusin`: Highlights and selects a clue when a cell recieves focus.
     * - `input`: Restricts user input to a single uppercase letter and moves to the next cell.
     * - `keydown`: Handles Backspace, Arrow keys, and space for movement and orientation toggle.
     * - `click`: Focuses input and selects clue when a cell is clicked.
     * - `dblclick`: Toggles orientation and selects clue on double-click. 
     */
    function wireBoardInputs() {
        board.addEventListener('focusin', (e) => {
            const input = e.target.closest('.cell-input');
            if (!input) return;
            const cell = input.closest('.cell');
            log('focusin -> highlightFromCell', cell?.dataset);
            highlightFromCell(cell, currentOrientation);
            selectClueFromCell(cell, currentOrientation, { skipEvent: true });
        });

        board.addEventListener('input', (e) => {
            const input = e.target.closest('.cell-input');
            if (!input) return;
            
            const v = input.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1);
            input.value = v;

            if (v) {
                const cell = input.closest('.cell');
                log('input letter', v, '-> moveRelative +1');
                moveRelative(cell, 1);
            }
        });

        board.addEventListener('keydown', (e) => {
            const input = e.target.closest('.cell-input');
            if (!input) return;
            const cell = input.closest('.cell');

            if (e.key === 'Backspace') {
                const cell = input.closest('.cell');

                if (input.value) {
                    log('Backspace: clearing current cell'); 
                    input.value = '';
                    e.preventDefault();
                    return;
                }
                log('Backspace: moveRelatice -1 and clear previous');
                moveRelative(cell, -1);
                const prev = document.activeElement?.closest('.cell')?.querySelector('.cell-input');
                if (prev) prev.value = '';
                e.preventDefault();
                return;
            }

            if (e.key === 'ArrowRight') {
                log('ArrowRight -> across, move +1');
                highlightFromCell(cell, 'across');
                selectClueFromCell(cell, 'across', { skipEvent: true });
                moveRelative(cell, 1);
                e.preventDefault();
                return;
            }
            else if (e.key === 'ArrowLeft') {
                log('ArrowLeft -> across, move -1');
                highlightFromCell(cell, 'across');
                selectClueFromCell(cell, 'across', { skipEvent: true });
                moveRelative(cell, -1);
                e.preventDefault();
                return;
            }
            else if (e.key === 'ArrowDown') {
                log('ArrowDown -> down, move +1');
                highlightFromCell(cell, 'down');
                selectClueFromCell(cell, 'down', { skipEvent: true });
                moveRelative(cell, 1);
                e.preventDefault();
                return;
            }
            else if (e.key === 'ArrowUp') {
                log('ArrowUp -> down, move -1');
                highlightFromCell(cell, 'down');
                selectClueFromCell(cell, 'down', { skipEvent: true });
                moveRelative(cell, -1);
                e.preventDefault();
                return;
            }

            if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
                const nextOri = currentOrientation === 'across' ? 'down' : 'across';
                log('Space: toggle orientation', currentOrientation, '->', nextOri);
                highlightFromCell(cell, nextOri);
                selectClueFromCell(cell, nextOri, { skipEvent: true });
                e.preventDefault();
                return;
            }
        });

        board.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell:not(.black-cell)');
            if (!cell) return;
            log('click cell', cell.dataset);
            const input =  cell.querySelector('.cell-input');
            input?.focus();
            input?.select?.();
            selectClueFromCell(cell, currentOrientation);
        });

        board.addEventListener('dblclick', (e) => {
            const cell = e.target.closest('.cell:not(.black-cell)');
            if (!cell) return;
            const nextOri = currentOrientation === 'across' ? 'down' : 'across';
            log('dblclick cell', cell.dataset, 'toggle to', nextOri);
            highlightFromCell(cell, nextOri);
            const input = cell.querySelector('.cell-input');
            input?.focus();
            input?.select?.();
            selectClueFromCell(cell, nextOri);
        });
    }

    /**
     * Retuns the currently highlighted (active) cells on the board, sorted in logical order based on the current clue orientation.
     * 
     * @returns {HTMLElement} Sorted list of active cell elements.
     */
    function activeCellsSorted() {
        const activeCells = [...board.querySelectorAll('.cell.is-active:not(.black-cell)')];
        if (!activeCells.length) return [];
        const compareNumbers = (a, b) => Number(a) - Number(b);

        if (currentOrientation === 'across') {
            return activeCells.sort((cellA, cellB) => {
                const rowA = Number(cellA.dataset.row);
                const rowB = Number(cellB.dataset.row);
                const colA = Number(cellA.dataset.col);
                const colB = Number(cellB.dataset.col);
                return rowA === rowB ? compareNumbers(colA, colB) : compareNumbers(rowA, rowB);
            });
        }
        else {
            return activeCells.sort((cellA, cellB) => {
                const rowA = Number(cellA.dataset.row);
                const rowB = Number(cellB.dataset.row);
                const colA = Number(cellA.dataset.col);
                const colB = Number(cellB.dataset.col);
                return colA === colB ? compareNumbers(rowA, rowB) : compareNumbers(colA, colB);
            });
        }
    }
    
    /**
     * Moves focus to another input cell within the currently active clue, based on a relative offset from the currently focused cell.
     * 
     * @param {HTMLElement} currentCell - The currently focused `.cell` element.
     * @param {number} offset - The number of steps to move (positive or negative).
     */
    function moveRelative(currentCell, offset) {
        const orderedActiveCells = activeCellsSorted();
        if (orderedActiveCells.length === 0) return;

        const currentRow = currentCell?.dataset.row;
        const currentCol = currentCell?.dataset.col;

        const currentIndex = orderedActiveCells.findIndex(cell => 
            cell.dataset.row === currentRow && cell.dataset.col === currentCol
        );

        if (currentIndex === -1) return;

        const targetIndex = Math.min(Math.max(currentIndex + offset, 0), orderedActiveCells.length - 1);
        const targetCell = orderedActiveCells[targetIndex];
        const targetInput = targetCell?.querySelector('.cell-input');
        targetInput?.focus();
        targetInput?.select?.();
    }

    // ========== Game Control Actions (Hint, Check, Reset) ==========
    /**
     * Wires up event listeners to the crossword action buttons (Hint, Submit, and Reset) within the given container element.
     * 
     * @param {HTMLElement} scopeEl - The container element where the action buttons are loacted. 
     */
    function wireActionButtons(scopeEl) {
        if (!scopeEl) return;
        const hintBtn = scopeEl.querySelector('.hint');
        setupHintGestures(hintBtn);

        scopeEl.querySelector('.submit')?.addEventListener('click', checkAnswers);
        scopeEl.querySelector('.reset')?.addEventListener('click', resetGrid);
    }

    /**
     * Sets up gesture-based behaviour for the "Hint" button.
     * 
     * - A short click/tap reveals a single letter hint.
     * - A long press (held for ≥ 600ms) reveals the full word.
     * 
     * Handles bout mouse and touch events for accessibility across devices.
     * 
     * @param {HTMLElement} hintBtn - the hint button element to attach gesture listeners to.
     */
    function setupHintGestures(hintBtn) {
        if (!hintBtn) return;

        let timer = null;
        let long = false;
        const LONG_MS = 600;

        const start = () => {
            long = false;
            clearTimeout(timer);
            timer = setTimeout(() => {
                long = true;
                revealHint({ mode: 'word' });
            }, LONG_MS);
        };

        const end = () => {
            if (timer) {
                clearTimeout(timer);
                if (!long) revealHint({ mode: 'letter' });
            }
        };

        hintBtn.addEventListener('mousedown', start);
        hintBtn.addEventListener('mouseup', end);
        hintBtn.addEventListener('mouseleave', end);

        hintBtn.addEventListener('touchstart', start, { passive: true });
        hintBtn.addEventListener('touchend', end);
        hintBtn.addEventListener('touchcancel', end);
    }

    /**
     * Reveals hint(s) for the currently selected clue.
     * 
     * Depending on the mode, it reveals eithe the next missing letter or the entire word.
     * 
     * The function updates the input ofields with the correct answer(s) and visually marks them using the `is-hint` class.
     * 
     * @param {Object} opts - Options to control reveal behaviour.
     * @param {string} [opts.mode] - 'letter' to reveal single letter, 'word' to reveal full word.
     * @param {boolean} [opts.shiftKey] - Optional flag to infer mode if `mode` is not explicitly set.
     */
    function revealHint(opts) {
        const cells = activeCellsSorted();
        if (!cells.length) return;

        const mode = opts?.mode || (opts?.shiftKey ? 'word' : 'letter');
        const revealAll = mode === 'word';

        for (const cell of cells) {
            const input = cell.querySelector('.cell-input');
            const right = (cell.dataset.solution || '').toUpperCase();
            const val = (input?.value || '').toUpperCase();

            if (!val || val !== right || revealAll) {
                if (input) {
                    input.value = right;
                    input.classList.add('is-hint');
                }
                if (!revealAll) break;
            }
        }
    }

    /**
     * Validates the user's current crossword answers.
     * 
     * Compares user input in each cell to the correct solution stored in `data-solution`.
     * Applies cisual feedback classes (`is-correct`, `is-wrong`) to eacg cell based on acuracy.
     * Displays an alert summarising the result:
     * - If all answers are correct, shows a success message.
     * - Otherwise, displays a breakdown of correctm wrong, and empty cells.
     */
    function checkAnswers() {
        if(!board) return;
        let total = 0, filled = 0, correct = 0;

        board.querySelectorAll('.cell:not(.black-cell)').forEach(cell => {
            const input = cell.querySelector('.cell-input');
            const want = (cell.dataset.solution || '').toUpperCase();
            const got = (input?.value || '').toUpperCase();

            total++
            if (got) filled++

            const ok = got === want;
            cell.classList.toggle('is-wrong', !ok && !!got);
            cell.classList.toggle('is-correct', ok && !!got);
            if (ok) correct++;
        });

        if (filled === total && correct === total) {
            openModal(document.getElementById('completeModal'));
            return;
        }
        else {
            const incorrect = filled - correct;
            const empty = total - filled;

            const message = `You have ${incorrect} incorrect letter${incorrect !== 1 ? 's' : ''} and ${empty} empty cell${empty !== 1 ? 's' : ''}. Please complete the puzzle before submitting.`;

            const incompleteMsg = document.getElementById('incompleteMsg');
            incompleteMsg.textContent = message;

            openModal(document.getElementById('incompleteModal'));
        }
    }

    /**
     * Clears alll user input and visual feedback fron the crossword grid.
     * 
     * - Empties the value of each input cell.
     * - Removes any status classes ('is-wrong', 'is-correct', 'is-hint').
     * @returns 
     */
    function resetGrid() {
        if (!board) return;
        board.querySelectorAll('.cell-input').forEach(i => (i.value = ''));
        board.querySelectorAll('.cell').forEach(c => c.classList.remove('is-wrong', 'is-correct', 'is-hint'));
    } 
});