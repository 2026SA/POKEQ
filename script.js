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

const DIFFICULTY = {
  superEasy: { minClues: 68, maxClues: 72, label: "スーパーかんたん", singlesOnly: true, maxBlanksPerUnit: 2 },
  easy:      { minClues: 42, maxClues: 46, label: "かんたん" },
  normal:    { minClues: 34, maxClues: 38, label: "ふつう" },
  hard:      { minClues: 28, maxClues: 32, label: "むずかしい" }
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
const answerModeBtn = document.getElementById("answerModeBtn");
const noteModeBtn = document.getElementById("noteModeBtn");
const modeHelpEl = document.getElementById("modeHelp");
const lockBtn = document.getElementById("lockBtn");
const eraseBtn = document.getElementById("eraseBtn");
const newGameBtn = document.getElementById("newGameBtn");

let puzzle = [], solution = [], state = [];
let notes = [], locked = [];
let selectedCell = null;
let inputMode = "answer";
let startTime = 0, timerId = null, finished = false;
let generating = false;

const cloneGrid = grid => grid.map(row => [...row]);
const formatTime = s => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
const elapsedSeconds = () => Math.max(0, Math.floor((Date.now() - startTime) / 1000));
const makeEmptyNotes = () => Array.from({length: 9}, () => Array.from({length: 9}, () => new Set()));
const makeFalseGrid = () => Array.from({length: 9}, () => Array(9).fill(false));

function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setStatus(message, tone="") {
  statusEl.textContent = message;
  statusEl.className = `status-message ${tone}`.trim();
}

function startTimer() {
  clearInterval(timerId);
  startTime = Date.now();
  timerEl.textContent = "00:00";
  timerId = setInterval(() => {
    if (!finished && !generating) timerEl.textContent = formatTime(elapsedSeconds());
  }, 1000);
}

function makePokemonVisual(value) {
  const img = document.createElement("img");
  img.src = POKEMON[value].file;
  img.alt = POKEMON[value].name;
  img.loading = "eager";
  return img;
}

// ---- ランダム数独生成 ----
// 完成盤をランダム化し、1つずつヒントを消しながら「解が1つだけ」を確認します。
function generateSolution() {
  const pattern = (r, c) => (r * 3 + Math.floor(r / 3) + c) % 9;
  const bands = shuffle([0,1,2]);
  const stacks = shuffle([0,1,2]);
  const rows = bands.flatMap(b => shuffle([0,1,2]).map(r => b*3+r));
  const cols = stacks.flatMap(s => shuffle([0,1,2]).map(c => s*3+c));
  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  return rows.map(r => cols.map(c => nums[pattern(r,c)]));
}

function candidatesFor(board, row, col) {
  const used = new Set();
  for (let c=0;c<9;c++) if (board[row][c]) used.add(board[row][c]);
  for (let r=0;r<9;r++) if (board[r][col]) used.add(board[r][col]);
  const r0 = Math.floor(row/3)*3, c0 = Math.floor(col/3)*3;
  for (let r=r0;r<r0+3;r++) for (let c=c0;c<c0+3;c++) if (board[r][c]) used.add(board[r][c]);
  return [1,2,3,4,5,6,7,8,9].filter(v => !used.has(v));
}

function countSolutions(board, limit=2) {
  let count = 0;

  function solve() {
    if (count >= limit) return;

    let best = null;
    let bestCandidates = null;

    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        if (board[r][c] !== 0) continue;
        const cand = candidatesFor(board, r, c);
        if (cand.length === 0) return;
        if (!bestCandidates || cand.length < bestCandidates.length) {
          best = [r,c];
          bestCandidates = cand;
          if (cand.length === 1) break;
        }
      }
      if (bestCandidates && bestCandidates.length === 1) break;
    }

    if (!best) {
      count++;
      return;
    }

    const [row,col] = best;
    for (const value of bestCandidates) {
      board[row][col] = value;
      solve();
      board[row][col] = 0;
      if (count >= limit) return;
    }
  }

  solve();
  return count;
}

// 「スーパーかんたん」用。
// 難しい推測を使わず、候補が1つだけのマスを順番に見つければ最後まで解けるか確認します。
function canSolveBySinglesOnly(board) {
  const work = cloneGrid(board);

  while (true) {
    let emptyCount = 0;
    let filledThisRound = false;

    for (let r=0; r<9; r++) {
      for (let c=0; c<9; c++) {
        if (work[r][c] !== 0) continue;
        emptyCount++;

        const cand = candidatesFor(work, r, c);
        if (cand.length === 0) return false;

        if (cand.length === 1) {
          work[r][c] = cand[0];
          filledThisRound = true;
        }
      }
    }

    if (emptyCount === 0) return true;
    if (!filledThisRound) return false;
  }
}

function generateSuperEasyPuzzle() {
  const cfg = DIFFICULTY.superEasy;
  const target = cfg.minClues + Math.floor(Math.random() * (cfg.maxClues - cfg.minClues + 1));

  // 条件が厳しいので、必要なら別の完成盤で何度か作り直します。
  let bestResult = null;

  for (let attempt=0; attempt<40; attempt++) {
    const solved = generateSolution();
    const board = cloneGrid(solved);
    const rowBlanks = Array(9).fill(0);
    const colBlanks = Array(9).fill(0);
    const blockBlanks = Array(9).fill(0);
    let clueCount = 81;

    const cells = shuffle(Array.from({length:81}, (_,i) => i));

    for (const index of cells) {
      if (clueCount <= target) break;

      const row = Math.floor(index/9);
      const col = index%9;
      const block = Math.floor(row/3)*3 + Math.floor(col/3);

      // 小さい子が見やすいよう、1つの「たて・よこ・3×3」に空欄を増やしすぎません。
      if (rowBlanks[row] >= cfg.maxBlanksPerUnit) continue;
      if (colBlanks[col] >= cfg.maxBlanksPerUnit) continue;
      if (blockBlanks[block] >= cfg.maxBlanksPerUnit) continue;

      const backup = board[row][col];
      board[row][col] = 0;

      const unique = countSolutions(cloneGrid(board), 2) === 1;
      const simple = canSolveBySinglesOnly(board);

      if (unique && simple) {
        rowBlanks[row]++;
        colBlanks[col]++;
        blockBlanks[block]++;
        clueCount--;
      } else {
        board[row][col] = backup;
      }
    }

    const result = { puzzle: board, solution: solved, clueCount };

    if (!bestResult || clueCount < bestResult.clueCount) {
      bestResult = result;
    }

    if (clueCount <= target) return result;
  }

  // 目標まで空欄を作れなかった場合も、最もやさしく作れた盤面を返します。
  return bestResult;
}

function generatePuzzle(level) {
  if (level === "superEasy") return generateSuperEasyPuzzle();
  const solved = generateSolution();
  const board = cloneGrid(solved);
  const cfg = DIFFICULTY[level];
  const target = cfg.minClues + Math.floor(Math.random() * (cfg.maxClues - cfg.minClues + 1));
  let clueCount = 81;

  const cells = shuffle(Array.from({length:81}, (_,i) => i));
  for (const index of cells) {
    if (clueCount <= target) break;
    const row = Math.floor(index/9), col = index%9;
    const backup = board[row][col];
    board[row][col] = 0;

    const test = cloneGrid(board);
    if (countSolutions(test, 2) === 1) {
      clueCount--;
    } else {
      board[row][col] = backup;
    }
  }

  return { puzzle: board, solution: solved, clueCount };
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
    button.setAttribute("aria-label", `${POKEMON[value].name}、${value}`);
    button.appendChild(makePokemonVisual(value));

    const name = document.createElement("small");
    name.textContent = POKEMON[value].name;
    const number = document.createElement("span");
    number.className = "palette-number";
    number.textContent = value;
    number.hidden = !showNumbersEl.checked && inputMode === "answer";
    button.append(name, number);

    button.addEventListener("click", () => handlePaletteClick(value, button));
    paletteEl.appendChild(button);
  }
}

function handlePaletteClick(value, button) {
  if (finished || generating) return;
  if (!selectedCell) {
    setStatus("さきに、ポケモンを入れたいマスをタップしてね。", "bad");
    return;
  }

  const {row, col} = selectedCell;
  if (puzzle[row][col] !== 0) {
    setStatus("このマスは、問題として最初から入っているので変えられません。", "bad");
    return;
  }
  if (locked[row][col]) {
    setStatus("このマスはロック中です。変えるときは、先にロックを外してね。", "bad");
    return;
  }

  clearPaletteActive();
  button.classList.add("active");
  window.setTimeout(clearPaletteActive, 170);

  if (inputMode === "note") {
    toggleNote(row, col, value);
  } else {
    placeValue(row, col, value);
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
    if (puzzle[row][col] !== 0) {
      button.classList.add("fixed");
      button.setAttribute("aria-readonly", "true");
    }

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
    const isFixed = puzzle[row][col] !== 0;
    const isUserFilled = !isFixed && value !== 0;

    cell.innerHTML = "";
    cell.classList.remove("selected", "related", "error", "user-filled", "user-locked", "has-notes");
    if (isUserFilled) cell.classList.add("user-filled");
    if (locked[row][col]) cell.classList.add("user-locked");

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

      if (locked[row][col]) {
        const badge = document.createElement("span");
        badge.className = "lock-badge";
        badge.textContent = "🔒";
        cell.appendChild(badge);
      }
      cell.setAttribute("aria-label", `${POKEMON[value].name}${isFixed ? "、問題のマス" : locked[row][col] ? "、自分でロックしたマス" : "、自分で入れたマス"}`);
    } else if (notes[row][col].size > 0) {
      cell.classList.add("has-notes");
      const grid = document.createElement("span");
      grid.className = "candidate-grid";
      for (let n=1;n<=9;n++) {
        const s = document.createElement("span");
        if (notes[row][col].has(n)) {
          s.textContent = n;
          s.className = "candidate-on";
        }
        grid.appendChild(s);
      }
      cell.appendChild(grid);
      cell.setAttribute("aria-label", `候補メモ ${[...notes[row][col]].sort().join("、")}`);
    } else {
      cell.setAttribute("aria-label", "空いているマス");
    }
  });

  updateToolButtons();
}

function selectCell(row, col) {
  if (generating) return;
  selectedCell = {row, col};
  clearPaletteActive();
  refreshBoard();

  if (puzzle[row][col] !== 0) {
    setStatus("黄色のマスは、問題として最初から入っているポケモンです。");
  } else if (locked[row][col]) {
    setStatus("このマスは自分でロックしています。変えるときは「ロック解除」を押してね。");
  } else if (state[row][col]) {
    setStatus(`${POKEMON[state[row][col]].name}を自分で入れたマスです。確定ならロックできます。`);
  } else if (notes[row][col].size > 0) {
    setStatus("候補メモがあります。候補メモモードなら、数字を追加したり消したりできます。", "good");
  } else if (inputMode === "note") {
    setStatus("このマスに入りそうなポケモンを、候補としていくつでもメモできます。", "good");
  } else {
    setStatus("このマスに入るポケモンを考えて、下からえらんでね。", "good");
  }
}

function placeValue(row, col, value) {
  if (finished || puzzle[row][col] !== 0 || locked[row][col]) return;

  state[row][col] = value;
  notes[row][col].clear();
  refreshBoard();

  if (instantHintsEl.checked && hasConflict(row, col, value)) {
    markConflicts();
    setStatus("おなじポケモンが、たて・よこ・3×3の中にいるよ。", "bad");
  } else {
    setStatus(`${POKEMON[value].name}を入れました。確定だと思ったら「ロック」も使えます。`);
  }

  if (isBoardFull()) checkBoard(true);
}

function toggleNote(row, col, value) {
  if (state[row][col] !== 0) {
    setStatus("このマスにはポケモンが入っています。候補メモを使うなら、まず「けす」で空にしてね。", "bad");
    return;
  }
  const set = notes[row][col];
  if (set.has(value)) {
    set.delete(value);
    setStatus(`候補 ${value} を消しました。`);
  } else {
    set.add(value);
    setStatus(`候補 ${value} をメモしました。候補はいくつでも置けます。`, "good");
  }
  refreshBoard();
}

function setInputMode(mode) {
  inputMode = mode;
  answerModeBtn.classList.toggle("active", mode === "answer");
  noteModeBtn.classList.toggle("active", mode === "note");
  modeHelpEl.textContent = mode === "answer"
    ? "えらんだマスに、1ひきのポケモンを入れます。"
    : "入りそうなものを、1〜9の小さな数字でいくつでもメモします。";
  renderPalette();
  if (mode === "note") setStatus("候補メモモードです。マスをえらんで、候補のポケモンをタップしてね。");
  else setStatus("ポケモン入力モードです。マスをえらんで、入れるポケモンをタップしてね。");
}

function updateToolButtons() {
  if (!selectedCell) {
    lockBtn.disabled = true;
    eraseBtn.disabled = true;
    lockBtn.textContent = "🔒 ロック";
    return;
  }
  const {row,col} = selectedCell;
  const fixed = puzzle[row][col] !== 0;
  const isLocked = locked[row][col];
  lockBtn.disabled = fixed || (!state[row][col] && !isLocked);
  eraseBtn.disabled = fixed || isLocked || (state[row][col] === 0 && notes[row][col].size === 0);
  lockBtn.textContent = isLocked ? "🔓 ロック解除" : "🔒 ロック";
}

function toggleLock() {
  if (!selectedCell || finished) return;
  const {row,col} = selectedCell;
  if (puzzle[row][col] !== 0) return;

  if (locked[row][col]) {
    locked[row][col] = false;
    setStatus("ロックを外しました。もう一度変更できます。");
  } else if (state[row][col] !== 0) {
    locked[row][col] = true;
    setStatus("このマスをロックしました。まちがえて変えてしまうのを防げます。", "good");
  } else {
    setStatus("ポケモンを1ひき入れたマスだけロックできます。", "bad");
  }
  refreshBoard();
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

function clearErrorMarks() {
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("error"));
}

function markConflicts() {
  const conflicts = findConflictCells();
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.toggle("error", conflicts.has(`${cell.dataset.row}-${cell.dataset.col}`));
  });
}

function checkBoard(auto=false) {
  if (finished) return;

  clearErrorMarks();
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
    setStatus("問題として最初から入っているマスは消せません。", "bad");
    return;
  }
  if (locked[row][col]) {
    setStatus("このマスはロック中です。先にロックを外してね。", "bad");
    return;
  }
  state[row][col] = 0;
  notes[row][col].clear();
  refreshBoard();
  setStatus("このマスを空にしました。");
}

function resetGame() {
  state = cloneGrid(puzzle);
  notes = makeEmptyNotes();
  locked = makeFalseGrid();
  selectedCell = null;
  finished = false;
  celebrationEl.hidden = true;
  clearPaletteActive();
  refreshBoard();
  startTimer();
  setStatus("最初の状態にもどしました。まず、空いているマスをえらんでね。");
}

function loadNewGame() {
  if (generating) return;
  generating = true;
  finished = false;
  clearInterval(timerId);
  newGameBtn.disabled = true;
  difficultyEl.disabled = true;
  setStatus("新しい問題をつくっています…");

  // 表示を更新してから生成を始める。
  setTimeout(() => {
    try {
      const level = difficultyEl.value;
      const game = generatePuzzle(level);
      puzzle = cloneGrid(game.puzzle);
      solution = cloneGrid(game.solution);
      state = cloneGrid(puzzle);
      notes = makeEmptyNotes();
      locked = makeFalseGrid();
      selectedCell = null;
      inputMode = "answer";
      answerModeBtn.classList.add("active");
      noteModeBtn.classList.remove("active");
      modeHelpEl.textContent = "えらんだマスに、1ひきのポケモンを入れます。";
      celebrationEl.hidden = true;
      renderBoard();
      renderPalette();
      generating = false;
      newGameBtn.disabled = false;
      difficultyEl.disabled = false;
      startTimer();
      if (level === "superEasy") {
        setStatus(`スーパーかんたんです。空いているのは ${81 - game.clueCount}マスだけ。1つずつ「まだいないポケモン」を見つけよう！`, "good");
      } else {
        setStatus(`${DIFFICULTY[level].label}のランダム問題です。ヒントは ${game.clueCount}マス。まず空いているマスをタップしてね。`);
      }
    } catch (err) {
      console.error(err);
      generating = false;
      newGameBtn.disabled = false;
      difficultyEl.disabled = false;
      setStatus("問題を作れませんでした。もう一度「新しい問題」を押してね。", "bad");
    }
  }, 30);
}

showNumbersEl.addEventListener("change", () => {
  refreshBoard();
  document.querySelectorAll(".palette-number").forEach(el => {
    el.hidden = !showNumbersEl.checked && inputMode === "answer";
  });
});

instantHintsEl.addEventListener("change", () => {
  clearErrorMarks();
  refreshBoard();
  if (instantHintsEl.checked) {
    markConflicts();
    if (findConflictCells().size > 0) setStatus("ミスをおしえる：ON。重なっているマスをピンクで知らせます。");
    else setStatus("ミスをおしえる：ON。重なりがあればピンクで知らせます。");
  } else {
    clearErrorMarks();
    setStatus("ミスをおしえる：OFF。まずは自分で考えてみよう！");
  }
});

difficultyEl.addEventListener("change", loadNewGame);
answerModeBtn.addEventListener("click", () => setInputMode("answer"));
noteModeBtn.addEventListener("click", () => setInputMode("note"));
eraseBtn.addEventListener("click", eraseSelected);
lockBtn.addEventListener("click", toggleLock);
document.getElementById("checkBtn").addEventListener("click", () => checkBoard(false));
document.getElementById("resetBtn").addEventListener("click", resetGame);
newGameBtn.addEventListener("click", loadNewGame);
document.getElementById("playAgainBtn").addEventListener("click", loadNewGame);
document.getElementById("closeClearBtn").addEventListener("click", () => celebrationEl.hidden=true);

loadNewGame();
