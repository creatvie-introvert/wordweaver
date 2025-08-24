// Run code after the DOM has finished loading
document.addEventListener('DOMContentLoaded', () => {
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

    let selectedCategory = null;
    let chosenDifficulty = null;
    
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

    
    // ============================
    // THEME TOGGLE LOGIC (light/dark)
    // ============================
    // Stores the user's choice in localStorade and falls back to
    // the OS preferance on first load. 
    let currentTheme = localStorage.getItem('theme');

    // If no theme saved, fall back to system preference
    if (!currentTheme) {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply initial theme to <html> and update toggle label
    html.setAttribute('data-theme', currentTheme);
    updateToggleLabel();

    // Handle theme toggle button click (guard against null)
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);    // Save choice
            updateToggleLabel();
        });
    }

    // Updates the aria-label for the theme toggle button
    function updateToggleLabel() {
        if (!toggleBtn) return;
        const label = currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        toggleBtn.setAttribute('aria-label', label);
    }

    // ============================
    // MODAL LOGIC
    // ============================
    // Generic show/hide for all modals via [data-model] triggers.
    
    let escHandler = null;  // store an actove ESC listener while modal is open

    // Wire up open actions for each modal trigger
    modalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            openModal(modal, button);
        });
    });

    // Clicking outside modal content closes the modal
    modals.forEach(modal => {
        modal.addEventListener('click', e => {
            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent.contains(e.target)) {
                closeModal(modal);
            }
        });
    });

    // Show a modal and trap focus
    function openModal(modal, openerEl) {
        if (!modal) return;

        modal.dataset.returnFocusId = openerEl?.id || '';

        // Reveal modal and mark as visible for assistive tech
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');

        // Prevent background scrolling while modal is open
        body.classList.add('modal-open');

        const closeBtn = modal.querySelector('.close-modal');

        // Ensure focus occurs after the modal loads
        requestAnimationFrame(() => {
            if (closeBtn) {
                closeBtn.focus();
                closeBtn.onclick = () => closeModal(modal);
            }
        });

        // Create and store escape handler
        escHandler = e => {
            if (e.key === 'Escape') {
                closeModal(modal);
            }
        }

        // Attach ESC listener while modal is open
        document.addEventListener('keydown', escHandler);
    }

    
    // Hide a modal, restore attributes, and re-enable page scrolling
    function closeModal(modal) {
        const returnId = modal.dataset.returnFocusId;
        const returnEl = returnId ? document.getElementById(returnId) : null;
        (returnEl || document.querySelector('#site-header a, #site-header button'))?.focus?.(); 

        // Hide visually and from assistive tech
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');

        // Restore body scroll
        body.classList.remove('modal-open');

        // Clean up ESC listener if present
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
            escHandler = null;
        }
    }
    
    // ============================
    // SCREEN FLOW (Hero -> show category selection)
    // ============================
    

    // Start -> show category selection
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            heroSection.classList.add('hidden');
            heroSection.setAttribute('aria-hidden', 'true');
            heroSection.setAttribute('hidden', '');

            categorySection.classList.remove('hidden');
            categorySection.removeAttribute('hidden');
            categorySection.setAttribute('aria-hidden', 'false');

            const categoryHeading = document.getElementById('category-title');
            categoryHeading?.focus();
        });
    }

    // Choose category -> show difficulty
    if (categoryContainer) {
        categoryContainer.addEventListener('click', (e) => {
            const categoryBtn = e.target.closest('[data-category]');
            if (!categoryBtn) return;   // click wasn't on a category

            selectedCategory = categoryBtn.getAttribute('data-category');
            console.log('Category chosen:', selectedCategory);

            categorySection.classList.add('hidden');
            categorySection.setAttribute('aria-hidden', 'true');
            categorySection.setAttribute('hidden', '');

            difficultySection.classList.remove('hidden');
            difficultySection.setAttribute('aria-hidden', 'false');
            difficultySection.removeAttribute('hidden');

            // Move focus for acessibility: first interactove element
            const focusTarget = difficultySection.querySelector('[autofocus], button, a, [tabindex]:not([tabindex="-1"])');
            (focusTarget || difficultySection).focus?.();
        });
    }

    // Difficulty -> show game + build crossword
    
 
    if (difficultyContainer) {
        difficultyContainer.addEventListener('click', (e) => {
            const difficultyBtn = e.target.closest('[data-difficulty]');

            if (!difficultyBtn) return;

            chosenDifficulty = difficultyBtn.getAttribute('data-difficulty');

            console.log('Difficulty chosen:', chosenDifficulty);

            difficultySection.classList.add('hidden');
            difficultySection.setAttribute('aria-hidden', 'true');
            difficultySection.setAttribute('hidden', '');

            gameSection.classList.remove('hidden');
            gameSection.removeAttribute('hidden');
            gameSection.setAttribute('aria-hidden', 'false');

            document.getElementById('game-title')?.focus();

            // Start of crossword build
            loadCrossword(selectedCategory, chosenDifficulty);
        });
    }

    // Back Buttons
    
    backBtns.forEach(backBtn => {
        backBtn.addEventListener('click', () => {
            const prevId = backBtn.getAttribute('data-prev');
            const currentSection = backBtn.closest('section');
            const previousSection = document.getElementById(prevId);

            if (!currentSection || !previousSection) {
                console.warn('Back handler: missing current or previous section', {prevId, currentSection, previousSection});
                return;
            }

            currentSection.classList.add('hidden');
            currentSection.setAttribute('aria-hidden', 'true');
            currentSection.setAttribute('hidden', '');

            previousSection.classList.remove('hidden');
            previousSection.removeAttribute('hidden');
            previousSection.setAttribute('aria-hidden', 'false');

            const headingId = previousSection.getAttribute('aria-labelledby');
            const heading = headingId ? document.getElementById(headingId) : null;

            (heading || previousSection).focus();
        });
    });

    // ============================
    // UTILITIES
    // ============================

    /**
     * Decode HTML entities API strings (e.g., &quot;, &#039;) 
     * @param {string} html 
     * @returns {string}
     */
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    

    /**
     * In-place Fisher-Yates shuffle
     * @template T
     * @param {T[]} a 
     * @returns {T[]}
     */
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Try N randomised clue orders, keep the grid with the most filled letters.
     * @param {Array} rawClues unsaintised clue objects from API
     * @param {number} size gridSize (cells)
     * @param {number} attempts how many randomised layouts to try
     * @returns (Array<Array<Cell>>) the best grid found
     */
    function buildBestLayout(rawClues, size, attempts = 12) {
        let best = null;

        for (let t = 0; t < attempts; t++) {
            // Shuffle clues to vary the seed and crossing candidates
            const clues = shuffle(rawClues.slice()).map(c => ({ ...c }));
            
            // Place words into a temporary internal char-grid
            const placed = assignCluePositions(clues, size);
            
            // Convert placed clues into a renderable cell grid
            const grid = generateGrid(placed, size);

            // Seed by number of filed letters (higher = better)
            const filled = grid.flat().filter(cell => !cell.isBlock && cell.letter).length;

            if (!best || filled > best.filled) {
                best = { filled, grid };
            }
        }
        return best.grid;
    }

    // ============================
    // DATA FETCH + SANITISATION
    // ============================

    /**
     * Fetch questions for a category/difficulty, clean to {clue, answer}
     * Then ask the layout planner for the best grid and render it.
     */
    async function loadCrossword(selectedCategory, chosenDifficulty) {
        console.log('loadCrossword called with:', selectedCategory, chosenDifficulty);

        

        const categoryId = categoryMap[selectedCategory];
        const gridSize = sizeByDifficulty[chosenDifficulty] || 13;
        const attempts = attemptsByDifficulty[chosenDifficulty] || 36;

        console.log('Category ID:', categoryId);

        // Ask for enough questions to have option even after filtering
        let numQuestions = 50;
        switch (chosenDifficulty) {
            case 'easy':
            case 'medium':
                numQuestions = 40;
                break;
            case 'hard':
                numQuestions = 50;
                break;
            default:
                console.warn(`Unexpected difficulty level: ${chosenDifficulty}`);
        }

        const apiURL = `https://opentdb.com/api.php?amount=${numQuestions}&category=${categoryId}&difficulty=${chosenDifficulty}&type=multiple`;
        console.log('API URL:', apiURL)

        try {
            const response = await fetch(apiURL);
            const data = await response.json();
            console.log('API response data:', data);

            if (data.response_code === 0) {
                // Sanitise: strip punctuation, duplicates, numbers, fit grid length
                const seen = new Set();
                let cluesArray = [];

                data.results.forEach((result) => {
                    const clueText = decodeHTML(result.question);
                    const answerText = decodeHTML(result.correct_answer);

                    const clean = answerText.replace(/[^A-Z]/gi, '').toUpperCase();
                    if (!clean) return; // empty after stripping
                    if (/\d/.test(answerText)) return; // exclude numeric answers
                    if (clean.length > gridSize) return; // too long for current grid
                    if (seen.has(clean)) return; // avoid duplicates

                    seen.add(clean);
                    cluesArray.push({
                        clue: clueText,
                        answer: clean,
                        id: `clue-${cluesArray.length}`
                    });
                });

                console.log('Final cluesArray with orientations:', cluesArray);

                // Build several candidate layouts and keep the fullest
                const bestGrid = buildBestLayout(cluesArray, gridSize, attempts);
                renderCrossword(bestGrid);
            }
        } catch (error) {
            console.error('Error fetching trivia data', error);
        }
    }

    // ============================
    // LAYOUT PLANNER (word placement)
    // ============================

    /**
     * Place as many clues as possible into an internal char grid.
     * Adds row/col/orientation/placed to each placed clue.
     * @param {Array} cluesArray sanitised clies
     * @param {number} gridSize 
     * @returns (Array) only the clues that were successfully placed
     */
    function assignCluePositions(cluesArray, gridSize = 15) {
        // Hard filter : A-Z only and must fit the grid
        cluesArray = cluesArray.filter(c => c.answer && /^[A-Z]+$/.test(c.answer) && c.answer.length <= gridSize);

        // Internal char grid used only during placement checks
        const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

        const inBounds = (r, c) => r >= 0 && r < gridSize && c >= 0 && c < gridSize;

        // Write a word into the internal char grid and mark clue metadata
        const place = (clue, r, c, orientation) => {
            const w = clue.answer;
            for (let i = 0; i < w.length; i++) {
                const rr = orientation === 'across' ? r : r + i;
                const cc = orientation === 'across' ? c + i : c;
                grid[rr][cc] = w[i];
            }
            clue.row = r;
            clue.col = c;
            clue.orientation = orientation;
            clue.placed = true;
        };

        // Rules for whether a word can start at (r,c) in a given orientation
        const canPlace = (clue, r, c, orientation) => {
            const w = clue.answer;

            // Ensure the whole span is inside the grid
            const lastR = orientation === 'across' ? r : r + w.length - 1;
            const lastC = orientation === 'across' ? c + w.length - 1 : c;
            if (!inBounds(r, c) || !inBounds(lastR, lastC)) return false;

            // No letter immediately before or after the word (keeps words separated)
            const beforeR = orientation === 'across' ? r : r - 1;
            const beforeC = orientation === 'across' ? c - 1 : c;
            const afterR = orientation === 'across' ? r : r + w.length;
            const afterC = orientation === 'across' ? c + w.length : c;
            if (inBounds(beforeR, beforeC) && grid[beforeR][beforeC] !== null) return false;
            if (inBounds(afterR, afterC) && grid[afterR][afterC] !== null) return false;

            // Walk each letter; allow same-letter crossings only
            for (let i = 0; i < w.length; i++) {
                const rr = orientation === 'across' ? r : r + i;
                const cc = orientation === 'across' ? c + i : c;

                const existing = grid[rr][cc];
                if (existing !== null && existing !== w[i]) return false;

                // If this cell is empty, ensure we don't touch parallel neighbours
                if (existing === null) {
                    if (orientation === 'across') {
                        if (inBounds(rr - 1, cc) && grid[rr - 1][cc] !== null) return false;
                        if (inBounds(rr + 1, cc) && grid[rr + 1][cc] !== null) return false;
                    }
                    else {
                        if (inBounds(rr, cc - 1) && grid[rr][cc - 1] !== null) return false;
                        if (inBounds(rr, cc + 1) && grid[rr][cc + 1] !== null) return false;
                    }
                }
            }
            return true;
        };

        // Seed with the longest word (centred if possible)
        // NOTE: fixed comparator buy to sort by length (desc) and tiebreak randomly
        cluesArray.sort((a, b) => {
            const d = b.answer.length;
            return d !== 0 ? d : Math.random() - 0.5;
        });

        const first = cluesArray[0];
        if (first) {
            const seedRow = Math.floor(gridSize / 2);
            const seedCol = Math.floor((gridSize - first.answer.length) / 2);

            if (canPlace(first, seedRow, seedCol, 'across')) {
                place(first, seedRow, seedCol, 'across');
            }
            else {
                // Fallback: scan grid for any legal start for the seed
                let seeded = false;
                outerSeed: for (let r = 0; r < gridSize; r++) {
                    for (let c = 0; c < gridSize; c++) {
                        if (canPlace(first, r, c, 'across')) {
                            place(first, r, c, 'across');
                            seeded = true;
                            break outerSeed;
                        }
                        if (canPlace(first, r, c, 'down')) {
                            place(first, r, c, 'down');
                            seeded = true;
                            break outerSeed;
                        }
                    }
                }
                if (!seeded) {
                    console.warn(`Could not place seed: ${first.answer}`);
                }
            }

            // Try to place remaining words, preferring high-crossing candidates
            for (let k = 1; k < cluesArray.length; k++) {
                const clue = cluesArray[k];
                const w = clue.answer;
                const candidates = [];

                // For each letter in the word, look for matching letter already on the grid
                for (let i = 0; i < w.length; i++) {
                    for (let r = 0; r < gridSize; r++) {
                        for (let c = 0; c < gridSize; c++) {
                            if (grid[r][c] === w[i]) {
                                // Candidate if we align this letter on the crossing
                                const rDown = r - i, cDown = c; // place vertically
                                if (canPlace(clue, rDown, cDown, 'down')) {
                                    candidates.push({ r: rDown, c: cDown, ori: 'down' });
                                }
                                const rAcross = r, cAcross = c - i; // place horizontally
                                if (canPlace(clue, rAcross, cAcross, 'across')) {
                                    candidates.push({ r: rAcross, c: cAcross, ori: 'across' });
                                }
                            }
                        }
                    }
                }

                // Prefer more crossings and placements that are closer to centre
                const center = (gridSize - 1) / 2;
                const score = cand => {
                    let crosses = 0;
                    for (let i = 0; i < w.length; i++) {
                        const rr = cand.ori === 'across' ? cand.r : cand.r + i;
                        const cc = cand.ori === 'across' ? cand.c + i : cand.c;
                        if (grid[rr]?.[cc] === w[i]) crosses++;
                    }
                    const midR = cand.ori === 'down' ? cand.r + (w.length - 1) / 2 : cand.r;
                    const midC = cand.ori === 'across' ? cand.c + (w.length - 1) / 2 : cand.c;
                    const dist = Math.abs(midR - center) + Math.abs(midC - center);
                    return [-crosses, dist]; // lower is better
                };

                candidates.sort((a, b) => {
                    const [c1, d1] = score(a);
                    const [c2, d2] = score(b);
                    return c1 - c2 || d1 - d2;
                });

                // Place at the first legal candidate
                let placed = false;
                for (const cand of candidates) {
                    if (canPlace(clue, cand.r, cand.c, cand.ori)) {
                        place(clue, cand.r, cand.c, cand.ori);
                        placed = true;
                        break;
                    }
                }

                // Last-Resort: force scan for any legal start
                if (!placed) {
                    outer: for (let r = 0; r < gridSize; r++) {
                        for (let c = 0; c < gridSize; c++) {
                            if (canPlace(clue, r, c, 'across')) {
                                place(clue, r, c, 'across');
                                placed = true;
                                break outer;
                            }
                            if (canPlace(clue, r, c, 'down')) {
                                place(clue, r, c, 'down');
                                placed = true;
                                break outer;
                            }
                        }
                    }
                }

                if (!placed) console.warn(`Could not place: ${clue.answer}`);
            } 
        }

        // Only return the ones that actually fit
        return cluesArray.filter(c => c.placed);
    }

    // ============================
    // GRID BUILD (for rendering)
    // ============================

    /**
     * Convert placed clues into a grid of renderable cell objects.
     * Also marks empty cells as blocks so the boards paints black squares.
     * @param {Array} cluesArray already placed clues
     * @param {number} gridSize 
     * @returns {Array<Array<Cell>>}
     */
    function generateGrid(cluesArray, gridSize) {
        const grid = [];

        // Initialise empty grid with metadata per cell
        for (let i = 0; i < gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < gridSize; j++) {
                grid[i][j] = {
                    row: i,
                    col: j,
                    isBlock: false,
                    letter: '', 
                    acrossClueId: null,
                    downClueId: null,
                    isStartOfClue: false
                }
            }
        }

        // Paint letters for each placed clue
        cluesArray.forEach(clue => {
            const answer = clue.answer.toUpperCase();
            const orientation = clue.orientation;
            const startRow = clue.row;
            const startCol = clue.col;

            if (typeof startRow !== 'number' || typeof startCol !== 'number') {
                console.warn(`Skipping unplaced clue "${clue.answer}"`);
                return;
            }

            //Bounds check before writing
            let canPlace = true;
            for (let i = 0; i < answer.length; i++) {
                let row = startRow;
                let col = startCol;
                if (orientation === 'across') {
                    col += i;
                }
                else if (orientation === 'down') {
                    row += i;
                }

                if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
                    canPlace = false;
                    break;
                }

                grid[row][col].letter = answer[i];
            }

            if (!canPlace) {
                console.warn(`Skipping "${clue.answer}" due to conflict`);
                return;
            }

            // Second pass: tag metadata for UI (starts, across/down IDs)
            for (let i = 0; i < answer.length; i++) {
                let row = startRow;
                let col = startCol;
                
                if (orientation === 'across') {
                    col += i;
                }
                else if (orientation === 'down') {
                    row += i;
                }

                const cell = grid[row][col];
                cell.letter = answer[i];

                if (orientation === 'across') {
                    cell.acrossClueId = clue.id;
                }
                else if (orientation === 'down') {
                    cell.downClueId = clue.id;
                }

                if (i === 0) {
                    cell.isStartOfClue = true;
                }
            }

            clue.placed = true;
            
        });

        console.table(grid); // debuging code

        // Mark empty cells as blocks for rendering
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cell = grid[i][j];
                if (cell.letter === '') {
                    cell.isBlock = true;
                }
            }
        }

        return grid;
    }

    // ============================
    // RENDERING
    // ============================

    /**
     * Render a cell grid into the #crossword-board using CSS Grid.
     * Relies on CSS classes .cell and .black-cell for styling.
     * The board's columns/rows are sized to match the grid shape.
     */
    function renderCrossword(grid) {
        
        board.innerHTML = '';

        const gridSize = grid.length;
        board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${grid.length}, 1fr)`;

        grid.forEach((row) => {
            row.forEach((cell) => {
                const cellDiv = document.createElement('div');
                cellDiv.classList.add('cell');
                cellDiv.dataset.row = cell.row;
                cellDiv.dataset.col = cell.col;

                if (cell.isBlock) {
                    cellDiv.classList.add('black-cell');
                }
                else {
                    // For debuggin: show the letter: later replace this with inputs
                    cellDiv.textContent = cell.letter;  // Use for debugging
                }

                board.appendChild(cellDiv);
            });
        });
    }
});