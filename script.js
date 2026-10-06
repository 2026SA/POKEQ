const POKEMON = {
  1: { name: "ピカチュウ", file: "images/1_pikachu.png" },
  2: { name: "イーブイ", file: "images/2_eevee.png" },
  3: { name: "ポッチャマ", file: "images/3_piplup.png" },
  4: { name: "ヒトカゲ", file: "images/4_charmander.png" },
  5: { name: "ゲンガー", file: "images/5_gengar.png" },
  6: { name: "ホゲータ", file: "images/6_fuecoco.png" },
  7: { name: "ニャオハ", file: "images/7_sprigatito.png" },
  8: { name: "クワッス", file: "images/8_quaxly.png" },
  9: { name: "ミュウツー", file: "images/9_mewtwo.png" }
};

// まずは安定動作を優先し、検証済みの数独問題を複数用意。
// 0 は空欄。内部処理は通常の1〜9の数独です。
const PUZZLES = [
  {
    puzzle: [
      [5,3,0,0,7,0,0,0,0],
      [6,0,0,1,9,5,0,0,0],
      [0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],
      [4,0,0,8,0,3,0,0,1],
      [7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],
      [0,0,0,4,1,9,0,0,5],
      [0,0,0,0,8,0,0,7,9]
    ],
    solution: [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9]
    ]
  },
  {
    puzzle: [
      [0,0,0,2,6,0,7,0,1],
      [6,8,0,0,7,0,0,9,0],
      [1,9,0,0,0,4,5,0,0],
      [8,2,0,1,0,0,0,4,0],
      [0,0,4,6,0,2,9,0,0],
      [0,5,0,0,0,3,0,2,8],
      [0,0,9,3,0,0,0,7,4],
      [0,4,0,0,5,0,0,3,6],
      [7,0,3,0,1,8,0,0,0]
    ],
    solution: [
      [4,3,5,2,6,9,7,8,1],
      [6,8,2,5,7,1,4,9,3],
      [1,9,7,8,3,4,5,6,2],
      [8,2,6,1,9,5,3,4,7],
      [3,7,4,6,8,2,9,1,5],
      [9,5,1,7,4,3,6,2,8],
      [5,1,9,3,2,6,8,7,4],
      [2,4,8,9,5,7,1,3,6],
      [7,6,3,4,1,8,2,5,9]
    ]
  },
  {
    puzzle: [
      [0,2,0,6,0,8,0,0,0],
      [5,8,0,0,0,9,7,0,0],
      [0,0,0,0,4,0,0,0,0],
      [3,7,0,0,0,0,5,0,0],
      [6,0,0,0,0,0,0,0,4],
      [0,0,8,0,0,0,0,1,3],
      [0,0,0,0,2,0,0,0,0],
      [0,0,9,8,0,0,0,3,6],
      [0,0,0,3,0,6,0,9,0]
    ],
    solution: [
      [1,2,3,6,7,8,9,4,5],
      [5,8,4,2,3,9,7,6,1],
      [9,6,7,1,4,5,3,2,8],
      [3,7,2,4,6,1,5,8,9],
      [6,9,1,5,8,3,2,7,4],
      [4,5,8,7,9,2,6,1,3],
      [8,3,6,9,2,4,1,5,7],
      [2,1,9,8,5,7,4,3,6],
      [7,4,5,3,1,6,8,9,2]
    ]
  }
];

const boardEl = document.getElementById("sudokuBoard");
const paletteEl = document.getElementById("palette");
const statusEl = document.getElementById("statusMessage");
const showNumbersEl = document.getElementById("showNumbers");
const timerEl = document.getElementById("timer");
const celebrationEl = document.getElementById("celebration");
const celebrationPokemonEl = document.getElementById("celebrationPokemon");
const clearTimeEl = document.getElementById("clearTime");

let puzzleIndex = 0;
let puzzle = [];
let solution = [];
let state = [];
let selectedCell = null;
let selectedPokemon = null;
let startTime = 0;
let timerId = null;
let finished = false;

function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

function formatTime(totalSeconds) {
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const sec = (totalSeconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function elapsedSeconds() {
  return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
}

function startTimer() {
  clearInterval(timerId);
  startTime = Date.now();
  timerEl.textContent = "00:00";
  timerId = setInterval(() => {
    if (!finished) timerEl.textContent = formatTime(elapsedSeconds());
  }, 1000);
}

function setStatus(message, tone = "") {
  statusEl.textContent = message;
  statusEl.className = `status-message ${tone}`.trim();
}

function makePokemonVisual(value, context = "cell") {
  const info = POKEMON[value];
  const fragment = document.createDocumentFragment();

  const img = document.createElement("img");
  img.src = info.file;
  img.alt = info.name;
  img.loading = "eager";

  const fallback = document.createElement("span");
  fallback.className = context === "cell" ? "cell-name-fallback" : "fallback";
  fallback.textContent = context === "cell" ? info.name : value;
  fallback.hidden = true;

  img.addEventListener("error", () => {
    img.hidden = true;
    fallback.hidden = false;
  });

  fragment.append(img, fallback);
  return fragment;
}

function renderPalette() {
  paletteEl.innerHTML = "";

  for (let value = 1; value <= 9; value++) {
    const info = POKEMON[value];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pokemon-button";
    button.dataset.value = value;
    button.setAttribute("aria-label", `${info.name}を選ぶ`);

    button.appendChild(makePokemonVisual(value, "palette"));

    const name = document.createElement("small");
    name.textContent = info.name;

    const number = document.createElement("span");
    number.className = "palette-number";
    number.textContent = value;
    number.hidden = !showNumbersEl.checked;

    button.append(name, number);

    button.addEventListener("click", () => {
      selectedPokemon = value;
      document.querySelectorAll(".pokemon-button").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      if (selectedCell) {
        placeValue(selectedCell.row, selectedCell.col, value);
      } else {
        setStatus(`${info.name}をえらびました。入れたいマスをタップしてね。`);
      }
    });

    paletteEl.appendChild(button);
  }
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.dataset.row = row;
      button.dataset.col = col;
      button.setAttribute("role", "gridcell");

      if (col === 2 || col === 5) button.classList.add("block-right");
      if (row === 2 || row === 5) button.classList.add("block-bottom");

      const isFixed = puzzle[row][col] !== 0;
      if (isFixed) {
        button.classList.add("fixed");
        button.setAttribute("aria-readonly", "true");
      }

      button.addEventListener("click", () => {
        selectCell(row, col);
        if (!isFixed && selectedPokemon) {
          placeValue(row, col, selectedPokemon);
        }
      });

      boardEl.appendChild(button);
    }
  }

  refreshBoard();
}

function refreshBoard() {
  const cells = [...document.querySelectorAll(".cell")];

  cells.forEach(cell => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = state[row][col];

    cell.innerHTML = "";
    cell.classList.remove("selected", "related", "error");

    if (selectedCell) {
      const sameRow = row === selectedCell.row;
      const sameCol = col === selectedCell.col;
      const sameBlock =
        Math.floor(row / 3) === Math.floor(selectedCell.row / 3) &&
        Math.floor(col / 3) === Math.floor(selectedCell.col / 3);

      if (sameRow || sameCol || sameBlock) cell.classList.add("related");
      if (row === selectedCell.row && col === selectedCell.col) cell.classList.add("selected");
    }

    if (value) {
      cell.appendChild(makePokemonVisual(value, "cell"));

      const num = document.createElement("span");
      num.className = "cell-number";
      num.textContent = value;
      num.hidden = !showNumbersEl.checked;
      cell.appendChild(num);

      cell.setAttribute("aria-label", `${POKEMON[value].name}${puzzle[row][col] ? "、最初から入っているマス" : ""}`);
    } else {
      cell.setAttribute("aria-label", "空いているマス");
    }
  });
}

function selectCell(row, col) {
  selectedCell = { row, col };
  refreshBoard();

  if (puzzle[row][col] !== 0) {
    setStatus("このマスは最初から入っているので、変更できません。");
  } else if (state[row][col]) {
    setStatus(`${POKEMON[state[row][col]].name}が入っています。別のポケモンに変えることもできます。`);
  } else {
    setStatus("下から入れたいポケモンをえらんでね。");
  }
}

function placeValue(row, col, value) {
  if (finished || puzzle[row][col] !== 0) return;

  state[row][col] = value;
  selectedCell = { row, col };
  refreshBoard();

  // 入れた瞬間には正誤を断定しすぎず、同じ行・列・ブロックの重複だけ知らせる。
  const conflict = hasConflict(row, col, value);
  if (conflict) {
    markConflicts();
    setStatus("同じ列・行・3×3の中に、同じポケモンがいるよ。", "bad");
  } else {
    setStatus(`${POKEMON[value].name}を入れました。`, "good");
  }

  if (isBoardFull()) {
    checkBoard(true);
  }
}

function hasConflict(row, col, value) {
  for (let c = 0; c < 9; c++) {
    if (c !== col && state[row][c] === value) return true;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && state[r][col] === value) return true;
  }

  const r0 = Math.floor(row / 3) * 3;
  const c0 = Math.floor(col / 3) * 3;
  for (let r = r0; r < r0 + 3; r++) {
    for (let c = c0; c < c0 + 3; c++) {
      if ((r !== row || c !== col) && state[r][c] === value) return true;
    }
  }
  return false;
}

function findConflictCells() {
  const conflicts = new Set();

  const addDuplicates = (coords) => {
    const positionsByValue = new Map();
    coords.forEach(([r, c]) => {
      const v = state[r][c];
      if (!v) return;
      if (!positionsByValue.has(v)) positionsByValue.set(v, []);
      positionsByValue.get(v).push([r, c]);
    });
    positionsByValue.forEach(list => {
      if (list.length > 1) {
        list.forEach(([r, c]) => conflicts.add(`${r}-${c}`));
      }
    });
  };

  for (let r = 0; r < 9; r++) {
    addDuplicates(Array.from({ length: 9 }, (_, c) => [r, c]));
  }
  for (let c = 0; c < 9; c++) {
    addDuplicates(Array.from({ length: 9 }, (_, r) => [r, c]));
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const coords = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) coords.push([r, c]);
      }
      addDuplicates(coords);
    }
  }
  return conflicts;
}

function markConflicts() {
  const conflicts = findConflictCells();
  document.querySelectorAll(".cell").forEach(cell => {
    const key = `${cell.dataset.row}-${cell.dataset.col}`;
    cell.classList.toggle("error", conflicts.has(key));
  });
}

function checkBoard(auto = false) {
  if (finished) return;

  markConflicts();

  const conflicts = findConflictCells();
  if (conflicts.size > 0) {
    setStatus("同じポケモンが重なっている場所があります。赤いマスを見直してね。", "bad");
    return;
  }

  let wrong = 0;
  let empty = 0;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (state[r][c] === 0) empty++;
      else if (state[r][c] !== solution[r][c]) wrong++;
    }
  }

  if (wrong === 0 && empty === 0) {
    finishGame();
    return;
  }

  if (wrong > 0) {
    document.querySelectorAll(".cell").forEach(cell => {
      const r = Number(cell.dataset.row);
      const c = Number(cell.dataset.col);
      if (puzzle[r][c] === 0 && state[r][c] !== 0 && state[r][c] !== solution[r][c]) {
        cell.classList.add("error");
      }
    });
    setStatus(`まだ ${wrong}か所、見直せるところがあるよ。`, "bad");
  } else if (!auto) {
    setStatus(`ここまではOK！ あと ${empty}マスです。`, "good");
  }
}

function isBoardFull() {
  return state.every(row => row.every(v => v !== 0));
}

function finishGame() {
  finished = true;
  clearInterval(timerId);
  const time = formatTime(elapsedSeconds());
  timerEl.textContent = time;
  clearTimeEl.textContent = time;

  buildCelebrationPokemon();
  celebrationEl.hidden = false;
}

function buildCelebrationPokemon() {
  celebrationPokemonEl.innerHTML = "";

  for (let value = 1; value <= 9; value++) {
    const item = document.createElement("div");
    item.className = "celebration-item";

    item.appendChild(makePokemonVisual(value, "celebration"));

    const label = document.createElement("strong");
    label.textContent = POKEMON[value].name;
    item.appendChild(label);

    celebrationPokemonEl.appendChild(item);
  }
}

function eraseSelected() {
  if (!selectedCell || finished) return;

  const { row, col } = selectedCell;
  if (puzzle[row][col] !== 0) {
    setStatus("このマスは最初から入っているので、消せません。");
    return;
  }

  state[row][col] = 0;
  refreshBoard();
  setStatus("マスを空にしました。");
}

function resetGame() {
  state = cloneGrid(puzzle);
  selectedCell = null;
  selectedPokemon = null;
  finished = false;
  celebrationEl.hidden = true;
  document.querySelectorAll(".pokemon-button").forEach(btn => btn.classList.remove("active"));
  refreshBoard();
  startTimer();
  setStatus("最初の状態にもどしました。もう一度ちょうせん！");
}

function newGame() {
  let next = puzzleIndex;
  if (PUZZLES.length > 1) {
    while (next === puzzleIndex) {
      next = Math.floor(Math.random() * PUZZLES.length);
    }
  }
  puzzleIndex = next;

  puzzle = cloneGrid(PUZZLES[puzzleIndex].puzzle);
  solution = cloneGrid(PUZZLES[puzzleIndex].solution);
  state = cloneGrid(puzzle);
  selectedCell = null;
  selectedPokemon = null;
  finished = false;
  celebrationEl.hidden = true;

  renderBoard();
  renderPalette();
  startTimer();
  setStatus("新しい問題です。マスをタップして、ポケモンをえらんでね。");
}

showNumbersEl.addEventListener("change", () => {
  refreshBoard();
  document.querySelectorAll(".palette-number").forEach(el => {
    el.hidden = !showNumbersEl.checked;
  });
});

document.getElementById("eraseBtn").addEventListener("click", eraseSelected);
document.getElementById("checkBtn").addEventListener("click", () => checkBoard(false));
document.getElementById("resetBtn").addEventListener("click", resetGame);
document.getElementById("newGameBtn").addEventListener("click", newGame);
document.getElementById("playAgainBtn").addEventListener("click", newGame);

// 初期化
puzzleIndex = Math.floor(Math.random() * PUZZLES.length);
puzzle = cloneGrid(PUZZLES[puzzleIndex].puzzle);
solution = cloneGrid(PUZZLES[puzzleIndex].solution);
state = cloneGrid(puzzle);

renderBoard();
renderPalette();
startTimer();
