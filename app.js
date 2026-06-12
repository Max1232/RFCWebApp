// Data & DOM Elements
let pendingData = [];
let currentWeight = "";
let undoTimeout = null;

const weightDisplay = document.getElementById('weight-display');
const itemCountDisplay = document.getElementById('item-count');
const stateWeight = document.getElementById('state-weight');
const stateCategory = document.getElementById('state-category');
const delBtn = document.getElementById('del-btn');

// Numpad Input Handling
document.querySelectorAll('.num').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Prevent multiple decimals
    if (e.target.innerText === '.' && currentWeight.includes('.')) return; 
    currentWeight += e.target.innerText;
    weightDisplay.innerText = currentWeight;
  });
});

// Delete and Undo Logic
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

// Enter Button: Transition to Category Selection
document.getElementById('enter-btn').addEventListener('click', () => {
  if (!currentWeight || currentWeight === ".") return;
  stateWeight.classList.remove('active');
  stateWeight.classList.add('hidden');
  stateCategory.classList.remove('hidden');
  stateCategory.classList.add('active');
});

// Category Selection: Save Data and Reset
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const category = e.target.innerText;
    
    // Save to local array
    const now = new Date();
    const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear().toString().slice(-2)}`;
    
    pendingData.push({
      Date: date,
      Category: category,
      Amount: parseFloat(currentWeight)
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

// Undo Timer and Button State
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

// Sync to Google Sheets
const syncBtn = document.getElementById('sync-btn');
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzEIJFnv6nQ2u6aUeyvwyX3S1MV4xfk1Szmg8C2NnEXXiDxsfvmuMN5rtPLnJHV_Qxo3g/exec";

syncBtn.addEventListener('click', async () => {
  if (pendingData.length === 0) {
    alert("No items to sync!");
    return;
  }

  // Change button text to show activity
  const originalText = syncBtn.innerText;
  syncBtn.innerText = "Syncing...";
  syncBtn.disabled = true;

  try {
    // We send as plain text to avoid strict Google CORS preflight checks
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(pendingData),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    });

    const result = await response.json();

    if (result.status === "success") {
      // Clear the local data array
      pendingData = [];
      updateCount();
      alert(`Success! Synced to sheet: ${result.sheet}`);
    } else {
      throw new Error(result.message || "Unknown error");
    }

  } catch (error) {
    console.error("Sync failed:", error);
    alert("Sync failed. Are you connected to the internet? Your data is still saved locally.");
  } finally {
    // Reset button
    syncBtn.innerText = originalText;
    syncBtn.disabled = false;
  }
});