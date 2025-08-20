# Algorithm: Start Button -> Show Category Selection

**Goal:** When the user clicks the **Start Game** button in the hero section, the **hero section** should hide and the **category section** should show.

1. **Initialise Elements**
    - Get a reference to the **Start Game button** inside the hero section.
    - Get a reference to the **hero section** container.
    - Get a reference to the **category section** container.

2. **Attach Event Listener**
    - Add a `click` event listener to the **Start Game button**.

3. **Handle Click**
    - When the button is clicked:
        - Hide the **hero section** (e.g., add `.hidden` class).
        - Show the **category section** (e.g., remove `.hidden` class).

4. **Accessibility (Optional Enhancement)**
    - Update focus: move heyboard focus to the first interactive element in the category section (e.g., first category).
    - Update ARIA attributes if needed (`aria-hidden="true"` on. hero, `aria-hidden="false"` on category).

## PSEUDOCODE: Start Button

START
    EVENT: User clicks "Start Game" button
    SET heroSection.visibility = hidden
    SET categorySection.visibility = visible
    SET focus to first category button
END

