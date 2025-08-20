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
            openModal(modal);
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
    function openModal(modal) {
        if (!modal) return;

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

    // Get references to the hero and category sections
    const heroSection = document.querySelector('#hero-section');
    const categorySection = document.querySelector('#category-section');

    if (startBtn) {
        // Listen for clicks on the Start Game Button
        startBtn.addEventListener('click', () => {
            // Hide the hero section
            heroSection.classList.add('hidden');

            // Show the category selection section
            categorySection.classList.remove('hidden');

            // Debug message for development/testing
            console.log('you pressed start');
        });
    }
});