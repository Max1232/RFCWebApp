// Data & DOM Elements
let pendingData = [];
let currentWeight = "";
let undoTimeout = null;

const weightDisplay = document.getElementById('weight-display');
const itemCountDisplay = document.getElementById('item-count');
const stateWeight = document.getElementById('state-weight');
const stateCategory = document.getElementById('state-category');
const delBtn = document.getElementById('del-btn');

// 1. Numpad Logic
document.querySelectorAll('.num').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Prevent multiple decimals
    if (e.target.innerText === '.' && currentWeight.includes('.')) return; 
    currentWeight += e.target.innerText;
    weightDisplay.innerText = currentWeight;
  });
});

// 2. Delete / Undo Button Logic
delBtn.addEventListener('click', () => {
  if (delBtn.classList.contains('undo-mode')) {
    // UNDO: Pop the last entry off the array and put it back in the display
    const lastEntry = pendingData.pop();
    currentWeight = lastEntry.weight.toString();
    weightDisplay.innerText = currentWeight;
    updateCount();
    clearUndoTimer();
  } else {
    // NORMAL DELETE: Remove last character
    currentWeight = currentWeight.slice(0, -1);
    weightDisplay.innerText = currentWeight;
  }
});

// 3. Enter Button Logic (Transition to State B)
document.getElementById('enter-btn').addEventListener('click', () => {
  if (!currentWeight || currentWeight === ".") return;
  stateWeight.classList.remove('active');
  stateWeight.classList.add('hidden');
  stateCategory.classList.remove('hidden');
  stateCategory.classList.add('active');
});

// 4. Category Selection Logic (Save & Transition to State A)
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const category = e.target.innerText;
    
    // Save to local array
    pendingData.push({
      timestamp: new Date().toISOString(),
      weight: parseFloat(currentWeight),
      category: category
    });
    
    updateCount();
    resetToWeightState();
    startUndoTimer(); // Trigger the undo window
  });
});

function updateCount() {
  itemCountDisplay.innerText = `${pendingData.length} Items Pending`;
  // In the real app, you would also sync pendingData to localStorage here:
  // localStorage.setItem('intakeData', JSON.stringify(pendingData));
}

function resetToWeightState() {
  currentWeight = "";
  weightDisplay.innerText = currentWeight;
  stateCategory.classList.remove('active');
  stateCategory.classList.add('hidden');
  stateWeight.classList.remove('hidden');
  stateWeight.classList.add('active');
}

// 5. The Undo Timer Mechanism
function startUndoTimer() {
  delBtn.classList.add('undo-mode');
  delBtn.innerText = 'UNDO (3s)';
  
  let timeLeft = 3;
  undoTimeout = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      delBtn.innerText = `UNDO (${timeLeft}s)`;
    } else {
      clearUndoTimer();
    }
  }, 1000);
}

function clearUndoTimer() {
  clearInterval(undoTimeout);
  delBtn.classList.remove('undo-mode');
  delBtn.innerText = 'DEL';
}