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
    initModals({ buttons: modalButtons, modals, body });

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
        if (clues.length === 0) {
            console.warn('No valid clues after sanitisation');
            return;
        }

        const bestGrid = buildBestLayout(clues, gridSize, attempts);
        renderCrossword(bestGrid);

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

        const valid = clues.filter(c => 
            c?.answer && /^[A-Z]+$/.test(c.answer) && 
            c.answer.length <= gridSize
        );
        if (valid.length === 0) return [];

        const grid = makeGrid(gridSize);

        valid.sort((a, b) =>
            b.answer.length - a.answer.length || (Math.random() - 0.5)
        );

        placeSeed(valid[0]);

        for (let i = 1; i < valid.length; i++) {
            const clue = valid[i];
            const candidates = getCandidates(clue).sort(compareCandidates(clue));
            let placed = false;

            for (const cand of candidates) {
                if (canPlace(clue, cand.r, cand.c, cand.ori)) {
                    place(clue, cand.r, cand.c, cand.ori);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                const spot = findFirstSpot(clue);
                if (spot) place(clue, spot.r, spot.c, spot.ori);
                else console.warn(`Could not place: ${clue.answer}`);
            }
        }

        return valid.filter(c => c.placed);

        function makeGrid(n) {
            return Array.from({ length: n }, () => Array(n).fill(null));
        }

        function inBounds(r, c) {
            return r >= 0 && r < gridSize && c >= 0 && c < gridSize;
        }

        function place(clue, r, c, ori) {
            const w = clue.answer;
            for (let i = 0; i < w.length; i++) {
                const rr = ori === ACROSS ? r : r + i;
                const cc = ori === ACROSS ? c + i : c;
                grid[rr][cc] = w[i];
            }
            clue.row = r;
            clue.col = c;
            clue.orientation = ori;
            clue.placed = true;
        }

        function canPlace(clue, r, c, ori) {
            const w = clue.answer;

            const lastR = ori === ACROSS ? r : r + w.length - 1;
            const lastC = ori === ACROSS ? c + w.length - 1 : c;
            if (!inBounds(r, c) || !inBounds(lastR, lastC)) return false;

            const beforeR = ori === ACROSS ? r : r - 1;
            const beforeC = ori === ACROSS ? c - 1 : c;
            const afterR = ori === ACROSS ? r : r + w.length;
            const afterC = ori === ACROSS ? c + w.length : c;

            if (inBounds(beforeR, beforeC) && grid[beforeR][beforeC] !== null) return false; 
            if (inBounds(afterR, afterC) && grid[afterR][afterC] !== null) return false; 

            for (let i = 0; i < w.length; i ++) {
                const rr = ori === ACROSS ? r : r + i;
                const cc = ori === ACROSS ? c + i : c;
                const existing = grid[rr][cc];
                
                if (existing !== null && existing !==w[i]) return false;

                if (existing === null) {
                    if (ori === ACROSS) {
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
        }

        function placeSeed(first) {
            if (!first) return;
            const r = Math.floor(gridSize / 2);
            const c = Math.floor((gridSize - first.answer.length) / 2);
            if (canPlace(first, r, c, ACROSS)) {
                place(first, r, c, ACROSS);
                return;
            }
            const spot = findFirstSpot(first);
            if (spot) place(first, spot.r, spot.c, spot.ori);
            else console.warn(`Could not place seed: ${first.answer}`);
        }

        function getCandidates(clue) {
            const w = clue.answer;
            const out = [];
            for (let i = 0; i < w.length; i++) {
                for (let r = 0; r < gridSize; r++) {
                    for (let c = 0; c < gridSize; c++) {
                        if (grid[r][c] !== w[i]) continue;

                        const rDown = r - i, cDown = c;
                        if (canPlace(clue, rDown, cDown, DOWN)) out.push({ r: rDown, c: cDown, ori: DOWN });

                        const rAcross = r, cAcross = c - i;
                        if (canPlace(clue, rAcross, cAcross, ACROSS)) out.push({ r: rAcross, c: cAcross, ori: ACROSS });
                    }
                }
            }
            return out;
        }

        function compareCandidates(clue) {
            const w = clue.answer;
            const centre = (gridSize - 1) / 2;

            return (a, b) => {
                const cA = countCrosses(a, w);
                const cB = countCrosses(b, w);
                if (cB !== cA) return cB - cA;

                const dA = centreDistance(a, w.length, centre);
                const dB = centreDistance(b, w.length, centre);
                return dA - dB;
            };
        }

        function countCrosses(cand, w) {
            let crosses = 0;
            for (let i = 0; i < w.length; i++) {
                const rr = cand.ori === ACROSS ? cand.r : cand.r + i;
                const cc = cand.ori === ACROSS ? cand.c + i : cand.c;
                if (grid[rr]?.[cc] === w[i]) crosses++;
            }
            return crosses;
        }

        function centreDistance(cand, len, centre) {
            const midR = cand.ori === DOWN ? cand.r + (len - 1) / 2 : cand.r;
            const midC = cand.ori === ACROSS ? cand.c + (len - 1) / 2 : cand.c;
            return Math.abs(midR - centre) + Math.abs(midC - centre);
        }

        function findFirstSpot(clue) {
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    if (canPlace(clue, r, c, ACROSS)) return { r, c, ori: ACROSS };
                    if (canPlace(clue, r, c, DOWN))   return { r, c, ori: DOWN };
                }
            }
            return null;
        }
    }
    
    /**
     * Build a renderable cell grid from placed clues.
     * Assumes each clue has {answer, row, col, orientation, id}
     */
    function generateGrid(cluesArray, gridSize) {
        const ACROSS = 'across';

        const grid = Array.from({ length: gridSize }, (_, r) =>
            Array.from({ length: gridSize }, (_, c) => ({
                row: r,
                col: c,
                isBlock: true,
                letter: '',
                acrossClueId: null,
                downClueId: null,
                isStartOfClue: false
            }))
        );

        const positionsFor = (clue) => {
            const letters = clue.answer.toUpperCase().split('');
            return letters.map((ch, i) => ({
                row: clue.orientation === ACROSS ? clue.row : clue.row + i,
                col: clue.orientation === ACROSS ? clue.col + i : clue.col,
                ch,
            })); 
        };

        for (const clue of cluesArray) {
            if (!Number.isInteger(clue.row) || !Number.isInteger(clue.col)) {
                continue;
            }

            const cells = positionsFor(clue);

            const outOfBounds = cells.some(p =>
                p.row < 0 || p.col < 0 || p.row >= gridSize || p.col >= gridSize
            );
            if (outOfBounds) {
                console.warn(`Skipping "${clue.answer}" due to conflict`);
                continue;
            }

            cells.forEach((p, i) => {
                const cell = grid[p.row][p.col];
                cell.letter = p.ch;
                cell.isBlock = false;
                if (clue.orientation === ACROSS) cell.acrossClueId = clue.id;
                else cell.downClueId = clue.id;
                if (i === 0) cell.isStartOfClue = true;
            });

            clue.placed = true;
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