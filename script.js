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

const GAMES = {
  easy: [{
    puzzle: [
      [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],
      [8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],
      [0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]
    ],
    solution: [
      [4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],
      [8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],
      [5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9]
    ]
  }],
  normal: [{
    puzzle: [
      [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
    ],
    solution: [
      [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
    ]
  }],
  hard: [{
    puzzle: [
      [0,2,0,6,0,8,0,0,0],[5,8,0,0,0,9,7,0,0],[0,0,0,0,4,0,0,0,0],
      [3,7,0,0,0,0,5,0,0],[6,0,0,0,0,0,0,0,4],[0,0,8,0,0,0,0,1,3],
      [0,0,0,0,2,0,0,0,0],[0,0,9,8,0,0,0,3,6],[0,0,0,3,0,6,0,9,0]
    ],
    solution: [
      [1,2,3,6,7,8,9,4,5],[5,8,4,2,3,9,7,6,1],[9,6,7,1,4,5,3,2,8],
      [3,7,2,4,6,1,5,8,9],[6,9,1,5,8,3,2,7,4],[4,5,8,7,9,2,6,1,3],
      [8,3,6,9,2,4,1,5,7],[2,1,9,8,5,7,4,3,6],[7,4,5,3,1,6,8,9,2]
    ]
  }]
};

const boardEl = document.getElementById("sudokuBoard");
const paletteEl = document.getElementById("palette");
const statusEl = document.getElementById("statusMessage");
const showNumbersEl = document.getElementById("showNumbers");
const instantHintsEl = document.getElementById("instantHints");
const difficultyEl = document.getElementById("difficulty");
const timerEl = document.getElementById("timer");
const celebrationEl = document.getElementById("celebration");
const celebrationPokemonEl = document.getElementById("celebrationPokemon");
const clearTimeEl = document.getElementById("clearTime");

let puzzle = [], solution = [], state = [];
let selectedCell = null;
let startTime = 0, timerId = null, finished = false;

const cloneGrid = grid => grid.map(row => [...row]);
const formatTime = s => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
const elapsedSeconds = () => Math.max(0, Math.floor((Date.now() - startTime) / 1000));

function setStatus(message, tone="") {
  statusEl.textContent = message;
  statusEl.className = `status-message ${tone}`.trim();
}

function startTimer() {
  clearInterval(timerId);
  startTime = Date.now();
  timerEl.textContent = "00:00";
  timerId = setInterval(() => {
    if (!finished) timerEl.textContent = formatTime(elapsedSeconds());
  }, 1000);
}

function makePokemonVisual(value) {
  const img = document.createElement("img");
  img.src = POKEMON[value].file;
  img.alt = POKEMON[value].name;
  img.loading = "eager";
  return img;
}

function clearPaletteActive() {
  document.querySelectorAll(".pokemon-button").forEach(btn => btn.classList.remove("active"));
}

function renderPalette() {
  paletteEl.innerHTML = "";
  for (let value=1; value<=9; value++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pokemon-button";
    button.dataset.value = value;
    button.setAttribute("aria-label", `${POKEMON[value].name}を入れる`);
    button.appendChild(makePokemonVisual(value));

    const name = document.createElement("small");
    name.textContent = POKEMON[value].name;
    const number = document.createElement("span");
    number.className = "palette-number";
    number.textContent = value;
    number.hidden = !showNumbersEl.checked;
    button.append(name, number);

    button.addEventListener("click", () => {
      if (finished) return;

      // 「マスを選ぶ → ポケモンを選ぶ」の順番を固定。
      if (!selectedCell) {
        setStatus("さきに、ポケモンを入れたいマスをタップしてね。", "bad");
        return;
      }

      const {row, col} = selectedCell;
      if (puzzle[row][col] !== 0) {
        setStatus("このマスは、はじめから入っているので変えられません。", "bad");
        return;
      }

      clearPaletteActive();
      button.classList.add("active");
      placeValue(row, col, value);
      window.setTimeout(clearPaletteActive, 160);
    });

    paletteEl.appendChild(button);
  }
}

function renderBoard() {
  boardEl.innerHTML = "";
  for (let row=0; row<9; row++) for (let col=0; col<9; col++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.dataset.row = row;
    button.dataset.col = col;
    button.setAttribute("role", "gridcell");

    if (col===2 || col===5) button.classList.add("block-right");
    if (row===2 || row===5) button.classList.add("block-bottom");

    const isFixed = puzzle[row][col] !== 0;
    if (isFixed) {
      button.classList.add("fixed");
      button.setAttribute("aria-readonly", "true");
    }

    // ここでは配置しない。マスを選ぶだけ。
    button.addEventListener("click", () => selectCell(row, col));
    boardEl.appendChild(button);
  }
  refreshBoard();
}

function refreshBoard() {
  document.querySelectorAll(".cell").forEach(cell => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = state[row][col];

    cell.innerHTML = "";
    cell.classList.remove("selected", "related", "error");

    if (selectedCell) {
      const sameRow = row === selectedCell.row;
      const sameCol = col === selectedCell.col;
      const sameBlock = Math.floor(row/3) === Math.floor(selectedCell.row/3) && Math.floor(col/3) === Math.floor(selectedCell.col/3);
      if (sameRow || sameCol || sameBlock) cell.classList.add("related");
      if (row === selectedCell.row && col === selectedCell.col) cell.classList.add("selected");
    }

    if (value) {
      cell.appendChild(makePokemonVisual(value));
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
  selectedCell = {row, col};
  clearPaletteActive();
  refreshBoard();

  if (puzzle[row][col] !== 0) {
    setStatus("ここは、はじめから入っているマスです。空いているマスをえらんでね。");
  } else if (state[row][col]) {
    setStatus(`${POKEMON[state[row][col]].name}が入っています。変えるなら、下のポケモンをタップしてね。`);
  } else {
    setStatus("このマスに入るポケモンを考えて、下からえらんでね。", "good");
  }
}

function placeValue(row, col, value) {
  if (finished || puzzle[row][col] !== 0) return;

  state[row][col] = value;
  const conflict = hasConflict(row, col, value);

  // 置いたら選択を解除。次の1手も必ず「マス → ポケモン」。
  selectedCell = null;
  refreshBoard();

  if (instantHintsEl.checked && conflict) {
    markConflicts();
    setStatus("おなじポケモンが、たて・よこ・3×3の中にいるよ。", "bad");
  } else {
    setStatus(`${POKEMON[value].name}を入れました。つぎのマスをえらんでね。`);
  }

  // 全部埋まったときだけ最終判定する。
  if (isBoardFull()) checkBoard(true);
}

function hasConflict(row, col, value) {
  for (let c=0;c<9;c++) if (c!==col && state[row][c]===value) return true;
  for (let r=0;r<9;r++) if (r!==row && state[r][col]===value) return true;
  const r0=Math.floor(row/3)*3, c0=Math.floor(col/3)*3;
  for (let r=r0;r<r0+3;r++) for (let c=c0;c<c0+3;c++) {
    if ((r!==row || c!==col) && state[r][c]===value) return true;
  }
  return false;
}

function findConflictCells() {
  const conflicts = new Set();
  const addDuplicates = coords => {
    const m = new Map();
    coords.forEach(([r,c]) => {
      const v = state[r][c];
      if (!v) return;
      if (!m.has(v)) m.set(v, []);
      m.get(v).push([r,c]);
    });
    m.forEach(list => {
      if (list.length > 1) list.forEach(([r,c]) => conflicts.add(`${r}-${c}`));
    });
  };

  for (let r=0;r<9;r++) addDuplicates(Array.from({length:9},(_,c)=>[r,c]));
  for (let c=0;c<9;c++) addDuplicates(Array.from({length:9},(_,r)=>[r,c]));
  for (let br=0;br<3;br++) for (let bc=0;bc<3;bc++) {
    const coords=[];
    for (let r=br*3;r<br*3+3;r++) for (let c=bc*3;c<bc*3+3;c++) coords.push([r,c]);
    addDuplicates(coords);
  }
  return conflicts;
}

function markConflicts() {
  const conflicts = findConflictCells();
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.toggle("error", conflicts.has(`${cell.dataset.row}-${cell.dataset.col}`));
  });
}

function checkBoard(auto=false) {
  if (finished) return;

  markConflicts();
  if (findConflictCells().size > 0) {
    setStatus("おなじポケモンが重なっているところがあります。ピンクのマスを見直してね。", "bad");
    return;
  }

  let wrong=0, empty=0;
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    if (state[r][c]===0) empty++;
    else if (state[r][c]!==solution[r][c]) wrong++;
  }

  if (wrong===0 && empty===0) {
    finishGame();
    return;
  }

  if (wrong>0) {
    document.querySelectorAll(".cell").forEach(cell => {
      const r=Number(cell.dataset.row), c=Number(cell.dataset.col);
      if (puzzle[r][c]===0 && state[r][c]!==0 && state[r][c]!==solution[r][c]) cell.classList.add("error");
    });
    setStatus(`まだ ${wrong}か所、見直せるところがあるよ。`, "bad");
  } else if (!auto) {
    setStatus(`ここまではOK！ あと ${empty}マスです。`, "good");
  }
}

const isBoardFull = () => state.every(row => row.every(v => v!==0));

function buildCelebrationPokemon() {
  celebrationPokemonEl.innerHTML = "";
  for (let value=1; value<=9; value++) {
    const item = document.createElement("div");
    item.className = "celebration-item";
    item.appendChild(makePokemonVisual(value));
    const label = document.createElement("strong");
    label.textContent = POKEMON[value].name;
    item.appendChild(label);
    celebrationPokemonEl.appendChild(item);
  }
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

function eraseSelected() {
  if (!selectedCell || finished) {
    if (!finished) setStatus("けしたいマスを、さきにタップしてね。");
    return;
  }
  const {row,col} = selectedCell;
  if (puzzle[row][col] !== 0) {
    setStatus("このマスは、はじめから入っているので消せません。", "bad");
    return;
  }
  state[row][col] = 0;
  selectedCell = null;
  refreshBoard();
  setStatus("マスを空にしました。つぎのマスをえらんでね。");
}

function resetGame() {
  state = cloneGrid(puzzle);
  selectedCell = null;
  finished = false;
  celebrationEl.hidden = true;
  clearPaletteActive();
  refreshBoard();
  startTimer();
  setStatus("最初の状態にもどしました。まず、空いているマスをえらんでね。");
}

function loadNewGame() {
  const level = difficultyEl.value;
  const games = GAMES[level];
  const game = games[Math.floor(Math.random()*games.length)];
  puzzle = cloneGrid(game.puzzle);
  solution = cloneGrid(game.solution);
  state = cloneGrid(puzzle);
  selectedCell = null;
  finished = false;
  celebrationEl.hidden = true;
  renderBoard();
  renderPalette();
  startTimer();
  setStatus(`${difficultyEl.options[difficultyEl.selectedIndex].text}の問題です。まず、空いているマスをタップしてね。`);
}

showNumbersEl.addEventListener("change", () => {
  refreshBoard();
  document.querySelectorAll(".palette-number").forEach(el => el.hidden = !showNumbersEl.checked);
});

instantHintsEl.addEventListener("change", () => {
  refreshBoard();
  if (instantHintsEl.checked) {
    markConflicts();
    if (findConflictCells().size > 0) setStatus("ミスをおしえる：ON。重なっているマスをピンクで知らせます。");
    else setStatus("ミスをおしえる：ON。重なりがあればピンクで知らせます。");
  } else {
    setStatus("ミスをおしえる：OFF。まずは自分で考えてみよう！");
  }
});

difficultyEl.addEventListener("change", loadNewGame);
document.getElementById("eraseBtn").addEventListener("click", eraseSelected);
document.getElementById("checkBtn").addEventListener("click", () => checkBoard(false));
document.getElementById("resetBtn").addEventListener("click", resetGame);
document.getElementById("newGameBtn").addEventListener("click", loadNewGame);
document.getElementById("playAgainBtn").addEventListener("click", loadNewGame);
document.getElementById("closeClearBtn").addEventListener("click", () => celebrationEl.hidden=true);

loadNewGame();
