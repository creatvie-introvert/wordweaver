# Algorithm: Load Crossword -> Fetch and Prepare Trivia Data

**Goal:** To fetch a dynamic number of trivia questions from the Open Trivia DB based on the user's selected categpry and difficulty, clean and format the data into clue-answer pairs, and pass the result to the crossword grid rendering function. The clues will be split evenly between Across and Down for balanced crossword layout.

1. **Initialise function parameters**
    - Accept selectedCategory and chosenDifficulty

2. **Determine number of questions based on difficulty**
    - If Easy -> 10
    - If Medium -> 14
    - If Hard -> 20

3. **Convert category name to numeric ID**
    - Use categoryMap to get the corresponding ID from the selected category

4. **Build the API request URL**
    - Use the Open Trivia DB endpoint with:
        - amount = dynamic value
        - category = ID from map
        - difficulty = chosen difficulty
        - type = multiple

5. **Fetch data from API**
    - Send GET request using fetch()
    - Convert response to JSON
    - Check if response_code is 0 (success)

6. **Sanitise data**
    - Loop through each result:
        - Decode HTML entities from question and correct answer
        - Strip whitespace and symbols from the answer
        - Convert answer to uppercase

7. **Create structured clue/answer pairs**
    - Store in array of objects like:
        - { clue: '...', answer: '...' }

8. **Split clue set into Across and Down**
    - Divide the array evenly
    - Tag each object with orientation: 'across' or 'down'

9. **Pass data to grid rendering function**
    - Call buildCrosswordGrid(cluesArray)

10. **Handle errors or bad responses**
    - If fetch fails or response is not 0:
        - Show error message or fallback UI

## Pseudocode: Load Crossword

FUNCTION loadCrossword(selectedCategory, chosenDifficulty)
    SET categoryMap with readable category names and ID numbers
    SET categoryId TO categoryMap[selectedCAtegory]

    SWITCH chosenDifficulty
        CASE 'easy': 
            SET numQuestions TO 10
        CASE 'medium':
            SET numQuestions TO 14
        CASE 'hard':
            SET numQuestions TO 20
    
    SET apiUrl To 'https://opentdb.com/api.php?amount=' + numQuestions + 
                  '&category=' + categoryId + 
                  '&difficulty=' + chosenDifficulty + 
                  '&type=multiple'

    TRY
        FETCH apiUrl
        CONVERT response to JSON

        IF response_code IS 0 THEN
            CREATE empty cluesArray
            FOR EACH item IN results
                DECODE item.question TO clueText
                DECODE item.correct_answer TO answerText
                CLEAN answerText (remove special chars, trim, uppercase)
                ADD { clue: clueText, answer: answerText } TO cluesArray
            END FOR

            SPLIT cluesArray evenly into two halves
            SET first half to orientation 'across'
            SET second half to orientation 'down'

            CALL buildCrosswordGrid(cluesArray)
        ELSE
            DISPLAY 'Trivia fetch failed: invalid response'
        END IF

        CATCH error
            LOG error
            DISPLAY 'Error fetching trivia data'
END FUNCTION