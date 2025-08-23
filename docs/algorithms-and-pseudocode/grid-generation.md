# Algorithm: Grid Generation -> Build Empty Crossword Grid Matrix

**Goal:** To dynamically generate a 2D array (matrix) that will serve as the structural foundation for the crossword board. Each cell in the grid is represented as an object with position and status information (e.g., empty, black square, or part of a word). This data structure will be used to visually render the crossword and manage user input logic.

1. **Initialise a 2D array (grid)**
    - Define dimensions: e.g. 10x10, 12x12, or dynamic
    - Each item represents a row, and each sub-item is a cell object

2. **Define default cell structure**
    - Set up each cell as:
        - `row`: row index
        - `col`: column index
        - `isBlock`: false (black or empty square)
        - `letter`: '' (populated later)
        - `acrossClueId`: null
        - `downClueId`: null
        - `isStartOfClue`: false

3. **Iterate through each clue in cluesArray**
    - For each clue object:
        - Extract starting row, column, answer, and orientation
        - Loop through each letter in the answer
        - Insert letter in appropiate cell (by row/col and direction)
        - Assign the clue ID to each cell
        - Mark the starting cell as `isStartOfClue: true`

4. **Handle overlaps**
    - If a cell is reused by both across and down clues, store both IDs

5. **Return final grid**
    - This matrix will be passed to the rendering function that turns it into HTML

## Pseudocode: Grid Generation

FUNCTION generateGrid(cluesArray, gridSize = 12)
    CREATE empty 2D array 'grid' with dimensions gridSize x gridSize

    FOR row FROM 0 TO gridSize - 1
        FOR col FROM 0 TO gridSize - 1
            SET grid[row][col] TO {
                row: row,
                col: col,
                isBlock: false,
                letter: '',
                acrossClueId: null,
                downClueId: null,
                isStartOfClue:false
            }
    
    FOR EACH clue IN cluesArray
        GET startingRow, startingCol, orientation, answer

        FOR i FROM 0 TO length of answer - 1
            IF orientation IS 'across'
                SET cell TO grid[startingRow][startingCol + i]
            ELSE IF orientation IS 'down'
                SET cell TO grid[startingRow + i][startingCol]

            SET cell.letter TO answer[i]
            SET clue ID to cell.acrossClueId or downClueId
            IF i IS 0
                SET cell.isStartOfClue TO true
        
    RETURN grid
END FUNCTION