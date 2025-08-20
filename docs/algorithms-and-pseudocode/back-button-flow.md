# Algorithm: Back Button -> Return to Previous Section

**Goal:** When the user clicks a **Back** button in any section, hide the **current section** and show the **previous section** (specified by the button's `data-prev` attribute).

1. **Initialise Elements**
    - Select **all back buttons** (e.g., elements with the class `.back-btn`).
    - Ensure each back button has a **data-prev** attribute that points to the **ID** of the section it should return to (e.g., `data-prev="hero-section"`).

2. **Attach Event Listeners**
    - For each back button, add a `click` event listener.

3. **Handle Click**
    - On click:
        - Determine the **currently visible section** (e.g., the first `.section-wrapper` that does **not** have the `.hidden` class or does **not** have the `hidden` attribute).
        - Read the target **previous section ID** from the button's `data-prev` attribute.
        - Find the **previous section element** by that ID.
        - If the previous section exists:
            - Hide the **current section** (e.g., add `.hidden` class or set `[hidden]`).
            - Show the **previous section** (e.g., remove `.hidden` class or remove `[hidden]`).
        - If it does not exist, log a warning (for testing during development).

4. **Accessibility**
    - Move keyboard focus to the **first focusable element** in the previous section (e.g., a heading with `tabindex="-1"` or the first button/link).
    - Synchronise ARIA state (`aria-hidden="true"` on the hidden section and `aria-hidden="false"` on the shown section).

## PSEUDOCODE: Back Button

START
    SET backButtons = all elements with class "back-btn"

    FOR EACH button IN backButtons:
        ON button "click" DO:
            SET prevId = button.data-prev
            SET currentSection = first visible section (no ".hidden" or no [hidden])
            SET previouseSection = element with id == prevId

            IF previousSection EXISTS THEN
                ADD ".hidden" (or [hidden]) TO currentSection
                REMOVE ".hidden" (or [hidden]) FROM previousSection

                OPTIONAL:
                    MOVE focus to first focusable element inside previousSection
                    SET currentSection.aria-hidden = "true"
                    SET previousSection.aria-hidden = "false"
            ELSE
                LOG "Warning: Back target not found for data-prev=" + prevId
            END IF
        END FOR
    END