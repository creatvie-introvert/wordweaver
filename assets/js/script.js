document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const toggleBtn = document.querySelector('[data-theme-toggle]');
    let currentTheme = localStorage.getItem('theme');

    // Determine current theme
    if (!currentTheme) {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    html.setAttribute('data-theme', currentTheme);
    updateToggleLabel();

    toggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateToggleLabel();
    });

    function updateToggleLabel() {
        const label = currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        toggleBtn.setAttribute('aria-label', label);
    }

    const modalButtons = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const body = document.body;

    modalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            openModal(modal);
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', e => {
            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent.contains(e.target)) {
                closeModal(modal);
            }
        });
    });

    function openModal(modal) {
        if (!modal) return;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        body.classList.add('modal-open');
        // modal.querySelector('.close-modal').focus();

        // const closeBtn = modal.querySelector('.close-modal');

        // closeBtn.addEventListener('click', () => closeModal(modal));

        const closeBtn = modal.querySelector('.close-modal');

        requestAnimationFrame(() => {
            if (closeBtn) {
                closeBtn.focus();
                closeBtn.onclick = () => closeModal(modal);
            }
        });

        // document.addEventListener('keydown', escHandler);

        // function escHandler(e) {
        //     if (e.key === 'Escape') {
        //         closeModal(modal);

        //         document.removeEventListener('keydown', escHandler);
        //     }
        // }
        const escHandler = e => {
            if (e.key === 'Escape') {
                closeModal(modal);

                document.removeEventListener('keydown', escHandler);
            }
        };

        document.addEventListener('keydown', escHandler);
    }

    function closeModal(modal) {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        body.classList.remove('modal-open');
    }
});