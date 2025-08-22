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

        console.log('Category ID:', categoryId);

        let numQuestions;

        switch (chosenDifficulty) {
            case 'easy':
                numQuestions = 10;
                break;
            case 'medium':
                numQuestions = 14;
                break;
            case 'hard':
                numQuestions = 20;
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
                let cluesArray = [];

                data.results.forEach(result => {
                    const clueText = decodeHTML(result.question);
                    const answerText = decodeHTML(result.correct_answer);

                    if (/\d/.test(answerText)) return;
                    
                    const cleanAnswer = answerText.replace(/[^A-Z]/gi, '').toUpperCase();

                    console.log('Parse clue:', clueText, '| Clean answer:', cleanAnswer);

                    cluesArray.push({
                        clue: clueText,
                        answer: cleanAnswer
                    })
                });

                let halfway = Math.floor(cluesArray.length / 2);

                cluesArray.forEach((clue, index) => {
                    if (index < halfway) {
                        clue.orientation = 'across';
                    }
                    else {
                        clue.orientation = 'down';
                    }
                });

                console.log('Final cluesArray with orientations:', cluesArray);

                buildCrosswordGrid(cluesArray);
            }
        } catch (error) {
            console.error('Error fetching trivia data', error);
        }
    }

    function buildCrosswordGrid(cluesArray) {
        console.log('Grid rendering function called with:', cluesArray);

        // TODO: Build crossword rendering logic
    }
});