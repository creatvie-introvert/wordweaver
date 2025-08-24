// Run code after the DOM has finished loading
document.addEventListener('DOMContentLoaded', () => {

    // THEME TOGGLE LOGIC - Handles light/dark mode switching and saves user preference to localStorage

    const html = document.documentElement;
    const toggleBtn = document.querySelector('[data-theme-toggle]');
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
        const label = currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        toggleBtn.setAttribute('aria-label', label);
    }

    // MODAL LOGIC - Handles opening, closing, and accessibility for all modals in the app
    const modalButtons = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const body = document.body;
    let escHandler = null;

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

    // Show a modal
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

    /**
     * Hide a modal, restore attributes, and re-enable page scrolling
     */
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
    
    // START GAME BUTTON LOGIC - Handles transition from Hero to Category selection
    const startBtn = document.querySelector('#start-game-btn');

    // Get references to the hero, category, and difficulty sections
    const heroSection = document.querySelector('#hero-section');
    const categorySection = document.querySelector('#category-section');
    const categoryContainer = categorySection?.querySelector('.category-container');
    const difficultySection = document.querySelector('#difficulty-section');
    const difficultyTitle = document.querySelector('#difficulty-title');

    // state holder for API
    let selectedCategory = null;
    let chosenDifficulty = null;

    if (startBtn) {
        // Listen for clicks on the Start Game Button
        startBtn.addEventListener('click', () => {
            // Hide the hero section
            heroSection.classList.add('hidden');
            heroSection.setAttribute('aria-hidden', 'true');
            heroSection.setAttribute('hidden', '');

            // Show the category selection section
            categorySection.classList.remove('hidden');
            categorySection.removeAttribute('hidden');
            categorySection.setAttribute('aria-hidden', 'false');

            // Move focus to category title
            const categoryHeading = document.getElementById('category-title');
            categoryHeading?.focus();
        });
    }

    // CATEGORY SELECTION LOGIC - Use event delegation on the category container
    if (categoryContainer) {
        categoryContainer.addEventListener('click', (e) => {
            const categoryBtn = e.target.closest('[data-category]');    // any button with data-category attribute

            if (!categoryBtn) return;   // ignore clicks outside buttons

            selectedCategory = categoryBtn.getAttribute('data-category');

            console.log('Category chosen:', selectedCategory);

            // Hide category section
            categorySection.classList.add('hidden');
            categorySection.setAttribute('aria-hidden', 'true');
            categorySection.setAttribute('hidden', '');

            // Show difficulty section
            difficultySection.classList.remove('hidden');
            difficultySection.setAttribute('aria-hidden', 'false');
            difficultySection.removeAttribute('hidden');

            // Move focus for acessibility
            const focusTarget = difficultySection.querySelector('[autofocus], button, a, [tabindex]:not([tabindex="-1"])');
            (focusTarget || difficultySection).focus?.();
        });
    }

    // DIFFICULTY SELECTION LOGIC
    const difficutyContainer = difficultySection?.querySelector('.difficulty-btn-container');
    const gameSection = document.querySelector('#game-section');

    if (difficutyContainer) {
        difficutyContainer.addEventListener('click', (e) => {
            const difficultyBtn = e.target.closest('[data-difficulty]');

            if (!difficultyBtn) return;

            chosenDifficulty = difficultyBtn.getAttribute('data-difficulty');

            console.log('Difficulty chosen:', chosenDifficulty);

            // Hide difficulty section
            difficultySection.classList.add('hidden');
            difficultySection.setAttribute('aria-hidden', 'true');
            difficultySection.setAttribute('hidden', '');

            // Show game section
            gameSection.classList.remove('hidden');
            gameSection.removeAttribute('hidden');
            gameSection.setAttribute('aria-hidden', 'false');

            // Focus game title
            document.getElementById('game-title')?.focus();

            // TODO: Load crossword board & clues via API

            loadCrossword(selectedCategory, chosenDifficulty);
        });
    }

    // BACK BUTTON LOGIC - handles all .back-btn elements
    const backBtns = document.querySelectorAll('.back-btn');

    backBtns.forEach(backBtn => {
        backBtn.addEventListener('click', () => {
            const prevId = backBtn.getAttribute('data-prev');
            const currentSection = backBtn.closest('section');
            const previousSection = document.getElementById(prevId);

            if (!currentSection || !previousSection) {
                console.warn('Back handler: missing current or previous section', {prevId, currentSection, previousSection});
                return;
            }

            // Hide current section
            currentSection.classList.add('hidden');

            currentSection.setAttribute('aria-hidden', 'true');

            currentSection.setAttribute('hidden', '');

            // Show previous section
            previousSection.classList.remove('hidden');

            previousSection.removeAttribute('hidden');

            previousSection.setAttribute('aria-hidden', 'false');

            // Move focus to a sensible target
            const headingId = previousSection.getAttribute('aria-labelledby');
            const heading = headingId ? document.getElementById(headingId) : null;

            (heading || previousSection).focus();
        });
    });

    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
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

    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function buildBestLayout(rawClues, size, attempts = 12) {
        let best = null;

        for (let t = 0; t < attempts; t++) {
            const clues = shuffle(rawClues.slice()).map(c => ({ ...c }));
            const placed = assignCluePositions(clues, size);
            const grid = generateGrid(placed, size);
            const filled = grid.flat().filter(cell => !cell.isBlock && cell.letter).length;

            if (!best || filled > best.filled) {
                best = { filled, grid };
            }
        }
        return best.grid;
    }

    async function loadCrossword(selectedCategory, chosenDifficulty) {
        console.log('loadCrossword called with:', selectedCategory, chosenDifficulty);

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

        const categoryId = categoryMap[selectedCategory];

        const gridSize = sizeByDifficulty[chosenDifficulty] || 13;

        const attempts = attemptsByDifficulty[chosenDifficulty] || 36;

        console.log('Category ID:', categoryId);

        let numQuestions = 50;

        switch (chosenDifficulty) {
            case 'easy':
                numQuestions = 40;
                break;
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
                const seen = new Set();
                let cluesArray = [];

                data.results.forEach((result) => {
                    const clueText = decodeHTML(result.question);
                    const answerText = decodeHTML(result.correct_answer);

                    const clean = answerText.replace(/[^A-Z]/gi, '').toUpperCase();
                    if (!clean) return;

                    if (/\d/.test(answerText)) return;
                    if (clean.length > gridSize) return;

                    if (seen.has(clean)) return;
                    seen.add(clean);

                    cluesArray.push({
                        clue: clueText,
                        answer: clean,
                        id: `clue-${cluesArray.length}`
                    });
                });
                // data.results.forEach(result => {
                //     const clueText = decodeHTML(result.question);
                //     const answerText = decodeHTML(result.correct_answer);

                //     if (/\d/.test(answerText)) return;
                    
                //     const cleanAnswer = answerText.replace(/[^A-Z]/gi, '').toUpperCase();

                //     console.log('Parse clue:', clueText, '| Clean answer:', cleanAnswer);

                //     cluesArray.push({
                //         clue: clueText,
                //         answer: cleanAnswer,
                //         // Temporary debugging code
                //         row: 0,
                //         col:cluesArray.length * 2,
                //         id: `clue-${cluesArray.length}`
                //     });
                // });

                console.log('Final cluesArray with orientations:', cluesArray);

                const bestGrid = buildBestLayout(cluesArray, gridSize, attempts);
                renderCrossword(bestGrid);
            }
        } catch (error) {
            console.error('Error fetching trivia data', error);
        }
    }

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

        const canPlace = (clue, r, c, orientation) => {
            const w = clue.answer;

            const lastR = orientation === 'across' ? r : r + w.length - 1;
            const lastC = orientation === 'across' ? c + w.length - 1 : c;
            if (!inBounds(r, c) || !inBounds(lastR, lastC)) return false;

            const beforeR = orientation === 'across' ? r : r - 1;
            const beforeC = orientation === 'across' ? c - 1 : c;
            const afterR = orientation === 'across' ? r : r + w.length;
            const afterC = orientation === 'across' ? c + w.length : c;
            if (inBounds(beforeR, beforeC) && grid[beforeR][beforeC] !== null) return false;
            if (inBounds(afterR, afterC) && grid[afterR][afterC] !== null) return false;

            for (let i = 0; i < w.length; i++) {
                const rr = orientation === 'across' ? r : r + i;
                const cc = orientation === 'across' ? c + i : c;

                const existing = grid[rr][cc];
                if (existing !== null && existing !== w[i]) return false;

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

            for (let k = 1; k < cluesArray.length; k++) {
                const clue = cluesArray[k];
                const w = clue.answer;

                const candidates = [];

                for (let i = 0; i < w.length; i++) {
                    for (let r = 0; r < gridSize; r++) {
                        for (let c = 0; c < gridSize; c++) {
                            if (grid[r][c] === w[i]) {
                                const rDown = r - i, cDown = c;
                                if (canPlace(clue, rDown, cDown, 'down')) {
                                    candidates.push({ r: rDown, c: cDown, ori: 'down' });
                                }
                                const rAcross = r, cAcross = c - i;
                                if (canPlace(clue, rAcross, cAcross, 'across')) {
                                    candidates.push({ r: rAcross, c: cAcross, ori: 'across' });
                                }
                            }
                        }
                    }
                }

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
                    return [-crosses, dist];
                };

                candidates.sort((a, b) => {
                    const [c1, d1] = score(a);
                    const [c2, d2] = score(b);
                    return c1 - c2 || d1 - d2;
                });

                let placed = false;
                for (const cand of candidates) {
                    if (canPlace(clue, cand.r, cand.c, cand.ori)) {
                        place(clue, cand.r, cand.c, cand.ori);
                        placed = true;
                        break;
                    }
                }
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
        return cluesArray.filter(c => c.placed);
    }

    function generateGrid(cluesArray, gridSize) {
        const grid = [];

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

        cluesArray.forEach(clue => {

            

            const answer = clue.answer.toUpperCase();
            const orientation = clue.orientation;
            const startRow = clue.row;
            const startCol = clue.col;

            if (typeof startRow !== 'number' || typeof startCol !== 'number') {
                console.warn(`Skipping unplaced clue "${clue.answer}"`);
                return;
            }

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

                const cell = grid[row][col];
                cell.letter = answer[i];
            }

            if (!canPlace) {
                console.warn(`Skipping "${clue.answer}" due to conflict`);
                return;
            }

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

        console.table(grid);

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

    // function buildCrosswordGrid(cluesArray) {
    //     console.log('Grid rendering function called with:', cluesArray);

    //     // TODO: Build crossword rendering logic
    //     const gridSize = 15;
    //     const grid = generateGrid(cluesArray, gridSize);

    //     console.table(grid);

    //     renderCrossword(grid)
    // }

    function renderCrossword(grid) {
        const board = document.getElementById('crossword-board');
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
                    cellDiv.textContent = cell.letter;  // Use for debugging
                }

                board.appendChild(cellDiv);
            });
        });
    }
});