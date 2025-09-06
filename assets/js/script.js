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
    let clueBank = new Map(); 
    let currentOrientation = 'across';
    
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

    initModals({ buttons: modalButtons, modals, body });
    initThemeToggle(toggleBtn, html);

    const log = (...args) => console.log('[WW]', ...args);
    
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

    /**
     * Initialise modal system: binds open/close triggers, traps focus, restores focus, and handles Escape + outside-click to close.
     */
    function initModals({ buttons, modals, body }) {
        let activeModal = null;
        let escHandler = null;
        let trapHandler = null;

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
    }
    
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

    initHeaderHeightObserver();
    
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
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Try multiple randomised layouts and keep the fullest grid.
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
     * Fetch, sanitise, and render a crossword for the chosen category/difficulty.
     */
    async function loadCrossword(selectedCategory, chosenDifficulty) {
        // console.log('loadCrossword called with:', selectedCategory, chosenDifficulty);

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

    /**
     * Place as many clues as possible onto an internal character grid.
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

        function makeGrid(size) {
            return Array.from({ length: size }, () => Array(size).fill(null));
        }

        function inBounds(row, col) {
            return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
        }

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

        function countCrosses(candidate, word) {
            let crosses = 0;
            for (let i = 0; i < word.length; i++) {
                const row = candidate.ori === ACROSS ? candidate.startRow : candidate.startRow + i;
                const col = candidate.ori === ACROSS ? candidate.startCol + i : candidate.startCol;
                if (gridChars[row]?.[col] === word[i]) crosses++;
            }
            return crosses;
        }

        function centreDistance(candidate, length, centreCoord) {
            const midpointRow = candidate.ori === DOWN ? candidate.startRow + (length - 1) / 2 : candidate.startRow;
            const midpointCol = candidate.ori === ACROSS ? candidate.startCol + (length - 1) / 2 : candidate.startCol;
            return Math.abs(midpointRow - centreCoord) + Math.abs(midpointCol - centreCoord);
        }

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
     * Build a renderable cell grid from placed clues.
     * Assumes each clue has {answer, row, col, orientation, id}
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
     * Render a 2D crossword grid into the board using CSS Grid.
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
     * Compute crossword numbering: scans the grid and ssigns numbers to the cells that start across and/or down answer, rendering their coordinates and ids.
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
     * Update the game title to reflect the chosen category
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
     * Compute lengths and friendly records for Across/Down from the rendered grid.
     * Uses the computeClueNumbers() + the global clueBank.
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

    /**
     * Render mobile carousel + tablet/desktop two panel lists, and wire up interactions (prev/next, click to focus).
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

        function selectClueById(clueId) {
            const i = linearClues.findIndex(c => c.id === clueId);
            if (i === -1) return;
            currentIndex = i;
            updateCarousel();

            // const clue = linearClues[currentIndex];
            // const row = clue.row;
            // const col = clue.col;

            const { row, col, orientation } = linearClues[currentIndex];
            const firstCell = getCellEl(row, col);

            currentOrientation = orientation;
            // const input = firstCell?.querySelector('.cell-input');
            const activeCells = activeCellsSorted();
            const nextInput = activeCells.find(c => {
                const input = c.querySelector('.cell-input');
                return input && !input.value;
            })?.querySelector('.cell-input') || firstCell?.querySelector('.cell-input');

            highlightFromCell(firstCell, orientation);

            if (document.activeElement && document.activeElement !== nextInput) {
                document.activeElement.getBoundingClientRect();
            }

            // requestAnimationFrame(() => {
            //     if (nextInput) {
            //         nextInput.focus({ preventScroll: false});
            //         nextInput.select?.();
            //     }
            // });
            // setTimeout(() => {
            //     nextInput?.focus();
            //     nextInput?.select?.();
            //     // nextInput?.scrollIntoView({ behavior: 'smooth', black: 'center'})
            // }, 20);
            
            // selectClueFromCell(firstCell, clue.orientation);

            // input?.focus();
            // input?.select?.();

            // highlightFromCell(firstCell, currentOrientation);
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

            // setTimeout(() => {
            //     if (nextInput) {
            //         nextInput.dispatchEvent(new Event('touchstart', { bubbles: true }));
            //         nextInput.dispatchEvent(new Event('mousedown', { bubbles: true }));
            //         nextInput?.click();
            //         nextInput?.focus();
            //         nextInput?.select?.();
            //     }
            // }, 20);
            
            

            selectClueFromCell(firstCell, currentOrientation, { skipEvent:true });
            // selectClueById(li.dataset.clueId);
        });

        container.addEventListener('keydown', (e) => {
            const li = e.target.closest('li[data-clue-id]');
            if (!li) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectClueById(li.dataset.clueId)
            }
        });

        function setActiveListItem(id) {
            container.querySelectorAll('.clues-panel li').forEach(li => {
                li.classList.toggle('is-active', li.dataset.clueId === id);
            });
        }

        updateCarousel();
        wireActionButtons(container.querySelector('.game-ctrls'));
    }

    /**
     * Highlight the cells for a clue starting at (row,col) and orientation.
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
     * Get the .cell element at a board coordinate.
     */
    function getCellEl(row , col) {
        return board?.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    function clearBoardHighlights() {
        if (!board) return;
        board.querySelectorAll('.cell.is-active, .cell.is-head').forEach(el => el.classList.remove('is-active', 'is-head'));
    }

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

    function wireActionButtons(scopeEl) {
        if (!scopeEl) return;
        const hintBtn = scopeEl.querySelector('.hint');
        setupHintGestures(hintBtn);

        scopeEl.querySelector('.submit')?.addEventListener('click', checkAnswers);
        scopeEl.querySelector('.reset')?.addEventListener('click', resetGrid);
    }

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

    function moveRelative(currentCell, offset) {
        const orderedActiveCells = activeCellsSorted();
        if (orderedActiveCells.length === 0) return;

        const currentRow = currentCell?.dataset.row;
        const currentCol = currentCell?.dataset.col;

        const currentIndex = orderedActiveCells.findIndex(cell => 
            cell.dataset.row === currentRow && cell.dataset.col === currentCol
        );

        if (currentIndex === -1) return;

        // const currentIndex = Math.max(0, orderedActiveCells.indexOf(currentCell));

        const targetIndex = Math.min(Math.max(currentIndex + offset, 0), orderedActiveCells.length - 1);
        const targetCell = orderedActiveCells[targetIndex];
        const targetInput = targetCell?.querySelector('.cell-input');
        targetInput?.focus();
        targetInput?.select?.();
    }

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
            alert('All correct well done');
        }
        else {
            const wrong = filled - correct;
            const empty = total - filled;
            alert(`Checked:\n• Correct: ${correct}\n• Wrong: ${wrong} \n• Empty: ${empty}`);
        }
    }

    function resetGrid() {
        if (!board) return;
        board.querySelectorAll('.cell-input').forEach(i => (i.value = ''));
        board.querySelectorAll('.cell').forEach(c => c.classList.remove('is-wrong', 'is-correct', 'is-hint'));
    }

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
            // const head = getCellEl(row, startCol);
            // head?.classList.add('is-head');
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
            // const head = getCellEl(startRow, col);
            // head?.classList.add('is-head');
            getCellEl(startRow, col)?.classList.add('is-head');
            log('down head', { col, startRow, endRow });
            // getCellEl(startRow, col)?.classList.add('.is-head');
        }
    }

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
});