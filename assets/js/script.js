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

    const FOCUSABLE_SELECTOR = [
        '[autofocus]', 'a[href]', 'button:not([disabled])', 
        'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    initThemeToggle(toggleBtn, html);
    
    /**
     * Initialise the theme toggle: apply saved/system theme, switch on click, persist to localStorage, and update the button's aria-label.
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

    modalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            openModal(document.getElementById(modalId), button);
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

    /**
     * Open a modal dialog.
     */
    function openModal(modal, openerEl) {
        if (!modal) return;
        if (activeModal && activeModal !== modal) closeModal(activeModal);

        activeModal = modal
        modal.dataset.returnFocusId = openerEl?.id || '';
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-modal', true);
        if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');

        body.classList.add('modal-open');

        requestAnimationFrame(() => {
            const firstFocus = modal.querySelector('.close-modal') 
                || modal.querySelector(FOCUSABLE_SELECTOR)
                || modal;
            firstFocus.focus?.();
        });

        escHandler = (e) => {
            if (e.key === 'Escape') closeModal(modal);
        };

        trapHandler = (e) => {
            if (e.key !== 'Tab') return;
            const focusables = [...modal.querySelectorAll(FOCUSABLE_SELECTOR)]. filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
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
     * Close a modal dialog.
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

    /**
     * Show or hide a section.
     */
    function setSectionVisible (section, visible) {
        if (!section) return;

        section.classList.toggle('hidden', !visible);
        section.toggleAttribute('hidden', !visible);
        section.setAttribute('aria-hidden', visible ? 'false' : 'true')
    }

    /**
     * Move focus to the first focusable descendant inside `root`.
     */
    function focusFirstFocusable(root) {
        if (!root) return;
        const el = root.querySelector(`${FOCUSABLE_SELECTOR}:not([hidden]):not([aria-hidden="true"]):not([inert])`);
        (el || root).focus?.();
    }

    /**
     * Navigate from one section to another with proper focus management.
     */
    function goToSection(from, to, focusSelector) {
        if (!from || !to) return;
            
        setSectionVisible(to, true);

        if (focusSelector) {
            to.querySelector(focusSelector)?.focus?.();
        }
        else {
            focusFirstFocusable(to);
        }
        setSectionVisible(from, false);
    }

    /**
     * Decode HTML entities API strings (e.g., &quot;, &#039;) using temporary <textarea>
     */
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    /**
     * In-place Fisher-Yates shuffle.
     */
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Try multiple randomised layouts and keep the fullest grid.
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
        return best ? best.grid : [];
    }

    /**
     * Fetch, sanitise, and render a crossword for the chosen category/difficulty.
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

    /**
     * Place as many clues as possible onto an internal character grid.
     */
    function assignCluePositions(cluesArray, gridSize = 15) {
        cluesArray = cluesArray.filter(c => c.answer && /^[A-Z]+$/.test(c.answer) && c.answer.length <= gridSize);

        const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

        const inBounds = (r, c) => r >= 0 && r < gridSize && c >= 0 && c < gridSize;

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

        shuffle(cluesArray);
        cluesArray.sort((a, b) => b.answer.length - a.answer.length);

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

    /**
     * Build a renderable cell grid from placed clues.
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

    /**
     * Render a 2D crossword grid into the board using CSS Grid.
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