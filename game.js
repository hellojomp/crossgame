class CrossGame {
    constructor(gridSize = 20, cellSize = 30, difficulty = 0) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.difficulty = difficulty;
        this.grid = [];
        this.words = {};
        this.startPoints = [];
        this.foundWords = [];
        this.letterCount = [];
        this.currentPath = [];

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;
    }

    async initializeGame() {
        await this.loadWords();
        this.createGrid();
        this.setStartPoints();

        // creae a grid of custom difficulty level
        this.findSolvableGame();
        this.foundWords = [];
        this.currentPath = [];


        this.renderGrid();
        this.addEventListeners();
    }

    async loadWords() {
        const response = await fetch('data/words.txt');
        const text = await response.text();

        text.split('\n').forEach(word => word.trim() && (this.words[word.trim()] = 1));
    }

    createGrid() {
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            this.letterCount[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = this.getRandomLetter();
                this.letterCount[i][j] = 0;
            }
        }
    }

    getRandomLetter() {
        if (this.difficulty === 0) {
            return this.frequencyLetter();
        } else {
            return this.randomLetter();
        }
    }

    randomLetter() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    frequencyLetter() {
        const frequencyDistribution = 'EETTAAOOINNSSRRHHDDLLUUCCMMFFYYWGGPBBVKKJJXQZ';
        return frequencyDistribution[Math.floor(Math.random() * frequencyDistribution.length)];
    }

    setStartPoints(points) {
        if (points === undefined) {
            this.startPoints = [this.getRandomPointOnSide(), this.getRandomPointOnSide()];
        } else {
            this.startPoints = points;
        }
    }

    getRandomPointOnSide() {
        switch (Math.floor(Math.random() * 4)) {
            case 0: return [0, Math.floor(Math.random() * this.gridSize)];
            case 1: return [Math.floor(Math.random() * this.gridSize), this.gridSize - 1];
            case 2: return [this.gridSize - 1, Math.floor(Math.random() * this.gridSize)];
            case 3: return [Math.floor(Math.random() * this.gridSize), 0];
        }  
    }
    isCellInFoundWords(row, col) {

        return this.foundWords.some(path => 
            this.getFullPath(path[0][0], path[0][1], path[1][0], path[1][1]).some(point => point[0] == row && point[1] == col)
        );
    }

    isCellInCurrentPath(row, col) {
        if (this.currentPath.length === 0) {
            return false;
        }

        if (this.currentPath.length === 1) {
            const [startRow, startCol] = this.currentPath[0];
            return startRow === row && startCol === col;
        }

        // this function checks if row, col is between the current path start point and end point in horizontal, vertical, or diagonal direction
        const [startRow, startCol] = this.currentPath[0];
        const [endRow, endCol] = this.currentPath[this.currentPath.length - 1];



        if (row === startRow) {
            return (startCol <= col && col <= endCol) || (endCol <= col && col <= startCol);
        } else if (col === startCol) {
            return (startRow <= row && row <= endRow) || (endRow <= row && row <= startRow);
        } else if (Math.abs(endRow - startRow) === Math.abs(endCol - startCol)) {
            return (Math.abs(row - startRow) === Math.abs(col - startCol)) && ((Math.abs(row - startRow) <= Math.abs(endRow - startRow)) && (Math.abs(col - startCol) <= Math.abs(endCol - startCol))) && (Math.sign(endRow - startRow) === Math.sign(row - startRow)) && (Math.sign(endCol - startCol) === Math.sign(col - startCol));
        }
        return false;
    }

    isStartPoint(row, col) {
        return this.startPoints.some(point => point[0] === row && point[1] === col);
    }


    isValidStartCell(row, col) {
        return this.isStartPoint(row, col) || this.foundWords.length > 0;
    }

    addCellToPath(row, col) {
        this.currentPath.push([row, col]);
    }

    isValidPath(startRow, startCol, endRow, endCol) {
        if (startRow !== endRow || startCol !== endCol) {
            if (startRow === endRow ||
                startCol === endCol ||
                Math.abs(endRow - startRow) === Math.abs(endCol - startCol)
            ) {
                if (this.foundWords.length === 0) return true;

                const path = this.getFullPath(startRow, startCol, endRow, endCol);
                return path.some(point => this.isCellInFoundWords(...point));
            }
        }
        return false;
    }
    
    isValidCurrentPath() {

        if (this.currentPath.length == 2) {
            let [startRow, startCol] = this.currentPath[0];
            let [endRow, endCol] = this.currentPath[1];
            return this.isValidPath(startRow, startCol, endRow, endCol);
        }
        return false;
    }

    getFullPath(startRow, startCol, endRow, endCol) {
    
        const path = [];
        let currentRow = startRow;
        let currentCol = startCol;
    
        // Determine the direction
        const rowDirection = Math.sign(endRow - startRow);
        const colDirection = Math.sign(endCol - startCol);
    
        // Add the start point to the path
        path.push([currentRow, currentCol]);
    
        // Generate the path
        while (currentRow !== endRow || currentCol !== endCol) {
            if (currentRow !== endRow) {
                currentRow += rowDirection;
            }
            if (currentCol !== endCol) {
                currentCol += colDirection;
            }
            path.push([currentRow, currentCol]);
        }
    
        return path
    }

    getWordFromCurrentPath() {
        const [startRow, startCol] = this.currentPath[0];
        const [endRow, endCol] = this.currentPath[this.currentPath.length - 1];
        return this.getFullPath(startRow, startCol, endRow, endCol).map(([row, col]) => this.grid[row][col]).join('');
    }

    isValidWord(word) {
        return this.words[word] !== undefined || this.words[word.split('').reverse().join('')] !== undefined;
    }

    hasWon() {
        const connectedCells = new Set();
        this.foundWords.forEach(path => {
            path.forEach(([row, col]) => connectedCells.add(`${row},${col}`));
        });

        const visited = new Set();
        const startPoint = this.startPoints[0];
        const queue = [[startPoint[0], startPoint[1]]];

        while (queue.length > 0) {
            const [row, col] = queue.shift();
            const key = `${row},${col}`;

            for (let i = 1; i < this.startPoints.length; i++) {
                if (row === this.startPoints[i][0] && col === this.startPoints[i][1]) {
                    return true; // Path found between start points
                }
            }

            if (!visited.has(key) && connectedCells.has(key)) {
                visited.add(key);

                // Check all 8 directions
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newRow = row + i;
                        const newCol = col + j;
                        if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                            queue.push([newRow, newCol]);
                        }
                    }
                }
            }
        }

        return false; // No path found between start points
    }

    renderGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = '#ccc';
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }

        // Draw letters and highlights
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
        
                let letterCount = (2 + this.letterCount[i][j]) / 8;

                if (this.isStartPoint(i, j)) {
                    this.ctx.fillStyle = 'black';
                    this.ctx.fillRect(j * this.cellSize, i * this.cellSize, this.cellSize, this.cellSize);
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(j * this.cellSize, i * this.cellSize, this.cellSize - letterCount, this.cellSize - letterCount);
                }
                

                if (this.isCellInCurrentPath(i, j)) {
                    this.ctx.fillStyle = '#097969';
                    this.ctx.fillRect(j * this.cellSize, i * this.cellSize, this.cellSize, this.cellSize);
                } else if (this.isCellInFoundWords(i, j)) {
                    this.ctx.fillStyle = 'black';
                    this.ctx.fillRect(j * this.cellSize, i * this.cellSize, this.cellSize, this.cellSize);
                    this.ctx.fillStyle = '#50C878';
                    this.ctx.fillRect(j * this.cellSize, i * this.cellSize, this.cellSize - letterCount, this.cellSize - letterCount);
                } 


                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = 'black';
                this.ctx.fillText(this.grid[i][j], (j + 0.5) * this.cellSize, (i + 0.5) * this.cellSize);
            }
        }
    }

    addEventListeners() {
    
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));


        document.getElementById('easy').addEventListener('click', () => this.setDifficulty(0));
        document.getElementById('medium').addEventListener('click', () => this.setDifficulty(1));
        document.getElementById('hard').addEventListener('click', () => this.setDifficulty(2));
    }


    onMouseLeave() {
        this.currentPath = [];
        this.renderGrid();
    }

    onMouseDown(event) {
        const [row, col] = this.getCellFromMouseEvent(event);
        if (this.isValidStartCell(row, col)) {
            this.currentPath = [[row, col]];
            this.renderGrid();
        }
    }

    onMouseMove(event) {
        if (this.currentPath.length > 0) {
            const [startRow, startCol] = this.currentPath[0];
            const [row, col] = this.getCellFromMouseEvent(event);
            if (startRow == row && startCol === col) return;

            if (this.currentPath.length > 1) {
                this.currentPath.pop();
            }
            this.addCellToPath(row, col);
            this.renderGrid();
        }
    }

    onMouseUp() {
        if (this.currentPath.length > 1) {
            const word = this.getWordFromCurrentPath();
            if (this.isValidCurrentPath() && this.isValidWord(word)) {

                // check that the path doesn't already exist in the foundWords
                if (this.foundWords.some(path => path.every(([row, col]) => this.currentPath.some(([r, c]) => r === row && c === col)))) {
                    this.currentPath = [];
                    this.renderGrid();
                    return;
                }
                this.foundWords.push(this.currentPath);
                this.renderGrid();
                if (this.hasWon()) {
                    alert('Congratulations! You won!');
                    if (this.difficulty === 0) {
                        this.setDifficulty(1);
                    } else if (this.difficulty === 1) {
                        this.setDifficulty(2);
                    }

                    this.resetGame();
                }
            }
            this.currentPath = [];
            this.renderGrid();
        }
    }

    getCellFromMouseEvent(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return [row, col];
    }

    resetGame() {
        this.grid = [];
        this.startPoints = [];
        this.foundWords = [];
        this.currentPath = [];

        this.initializeGame();
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.resetGame();
    }

    getSolvedGameDifficulty() {
        let maxWordsFound = this.foundWords.length;
        if (maxWordsFound > 1300) {
            return 0
        } else if (maxWordsFound > 900) {
            return 1
        } else if (maxWordsFound > 500) {
            return 2
        } else {
            return 3
        }
    }

    findSolvableGame() {

        this.solve();
        while (!this.hasWon()) {
            this.initializeGame();
            this.solve();

        }
    }

    addWordPath(path) {
        this.foundWords.push(path);
        let [startRow, startCol] = path[0];
        let [endRow, endCol] = path[1];
        for (let [row, col] of this.getFullPath(startRow, startCol, endRow, endCol)) {
            this.letterCount[row][col]++;
        }
    }

    solve() {
        this.foundWords = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.findWordsFromCell(row, col, directions);
            }
        }

    };

    findWordsFromCell(row, col, directions) {
        for (let [dx, dy] of directions) {
            let currentRow = row;
            let currentCol = col;
            let word = '';
            let path = [];

            while (currentRow >= 0 && currentRow < this.gridSize && 
                currentCol >= 0 && currentCol < this.gridSize) {
                word += this.grid[currentRow][currentCol];
                path.push([currentRow, currentCol]);

                if (this.isValidWord(word)) {
                    this.addWordPath(path);
                }

                currentRow += dx;
                currentCol += dy;
            }
        }
    }
}

const game = new CrossGame(20, 20, 0);
game.initializeGame();