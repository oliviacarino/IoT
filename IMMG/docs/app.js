const canvas = document.getElementById("draw-canvas");
const ctx = canvas.getContext("2d");
const thicknessInput = document.getElementById("thickness");

// Firebase config (unchanged, put your config here)
const firebaseConfig = {
  apiKey: "AIzaSyDrGnVzr3nvLSF0C9JUYdmNLlQPcFGxLtk",
  authDomain: "immg-eb767.firebaseapp.com",
  databaseURL: "https://immg-eb767-default-rtdb.firebaseio.com",
  projectId: "immg-eb767",
  storageBucket: "immg-eb767.appspot.com",
  messagingSenderId: "407794462813",
  appId: "1:407794462813:web:cd56f4aadde9ec4b199db4"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const firebaseRef = database.ref("images");

// Auth State Listener (unchanged)
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
  } else {
    document.getElementById("login-container").style.display = "block";
    document.getElementById("app-container").style.display = "none";
  }
});

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => showToast("Logged in!"))
    .catch((err) => showToast("Login failed: " + err.message));
}

function logout() {
  firebase.auth().signOut()
    .then(() => showToast("Logged out!"))
    .catch((err) => showToast("Logout error: " + err.message));
}

// --- Drawing Logic ---
let drawing = false;
let tool = "draw";
let lastPos = { x: 0, y: 0 };

function initCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
initCanvas();

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

// Store strokes for redraw
let strokes = [];

// Store texts for drag/draw
let texts = [];

// Undo/Redo stacks
let undoStack = [];
let redoStack = [];

// Push current state to undo stack (snapshot)
function pushState() {
  // Save deep copies of strokes and texts
  const strokesCopy = JSON.parse(JSON.stringify(strokes));
  const textsCopy = JSON.parse(JSON.stringify(texts));
  undoStack.push({ strokes: strokesCopy, texts: textsCopy });
  // Clear redo stack when new action happens
  redoStack = [];
}

// Call this when new user action occurs
function saveState() {
  pushState();
}

// Drawing events
function startDrawing(e) {
  if (tool !== "draw" && tool !== "erase") return;
  e.preventDefault();
  drawing = true;
  const pos = getCanvasPos(e);
  lastPos = pos;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.strokeStyle = (tool === "erase") ? "white" : "black";
  ctx.lineWidth = (tool === "erase") ? 20 : thicknessInput.value;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Start a new stroke object
  strokes.push({
    tool: tool,
    lineWidth: ctx.lineWidth,
    points: [pos]
  });

  // Save state before starting new stroke
  saveState();
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();
  const pos = getCanvasPos(e);
  const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
  const steps = Math.ceil(dist / 2);
  for (let i = 1; i <= steps; i++) {
    const x = lastPos.x + ((pos.x - lastPos.x) * i) / steps;
    const y = lastPos.y + ((pos.y - lastPos.y) * i) / steps;
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos = { x, y };
    // Append point to current stroke
    strokes[strokes.length - 1].points.push({ x, y });
  }
}

function stopDrawing(e) {
  e && e.preventDefault();
  drawing = false;
  ctx.beginPath();
}

// Redraw entire canvas from strokes and texts
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // redraw strokes
  for (const stroke of strokes) {
    ctx.beginPath();
    ctx.strokeStyle = stroke.tool === "erase" ? "white" : "black";
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (stroke.points.length > 0) {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }

  // redraw texts
  ctx.fillStyle = "black";
  ctx.font = "20px Comic Neue, Comic Sans MS, cursive, sans-serif";
  for (const t of texts) {
    ctx.fillText(t.text, t.x, t.y);
  }
}

function setTool(selected) {
  tool = selected;
  document.getElementById("draw-btn").classList.remove("active");
  document.getElementById("erase-btn").classList.remove("active");
  document.getElementById(`${selected}-btn`).classList.add("active");
}

thicknessInput.addEventListener("input", () => {
  if (tool === "draw") {
    ctx.lineWidth = thicknessInput.value;
  }
});

// Clear canvas plus reset strokes/texts
function clearCanvas() {
  saveState(); // save before clearing
  strokes = [];
  texts = [];
  initCanvas();

  const messageRef = firebaseRef.push();
  messageRef.set({ clear: true, timestamp: Date.now() })
    .then(() => showToast("Canvas cleared!"))
    .catch(() => showToast("Failed to clear remotely."));
}

// Dragging Text Logic
let draggingTextIndex = null;
let dragOffset = { x: 0, y: 0 };

function isPointInText(textObj, x, y) {
  // Simple box collision using text width/height
  const padding = 4;
  const textWidth = ctx.measureText(textObj.text).width;
  const textHeight = 20; // approx font size

  return (
    x >= textObj.x - padding &&
    x <= textObj.x + textWidth + padding &&
    y >= textObj.y - textHeight - padding &&
    y <= textObj.y + padding
  );
}

function startDragText(e) {
  if (tool !== "draw") return; // Only draggable in draw mode
  e.preventDefault();
  const pos = getCanvasPos(e);

  // Check texts from top to bottom (last added on top)
  for (let i = texts.length - 1; i >= 0; i--) {
    if (isPointInText(texts[i], pos.x, pos.y)) {
      draggingTextIndex = i;
      dragOffset.x = pos.x - texts[i].x;
      dragOffset.y = pos.y - texts[i].y;
      canvas.style.cursor = "grabbing";
      return;
    }
  }
}

function dragText(e) {
  if (draggingTextIndex === null) return;
  e.preventDefault();
  const pos = getCanvasPos(e);

  texts[draggingTextIndex].x = pos.x - dragOffset.x;
  texts[draggingTextIndex].y = pos.y - dragOffset.y;

  redrawCanvas();
}

function stopDragText(e) {
  if (draggingTextIndex === null) return;
  e && e.preventDefault();
  draggingTextIndex = null;
  canvas.style.cursor = "default";

  // Save state after drag ended
  saveState();

  redrawCanvas();
}

// Add Text Function - add new draggable text
function addText() {
  const textInput = document.getElementById("text-input");
  const text = textInput.value.trim();
  if (!text) {
    showToast("Please enter some text");
    return;
  }

  // Start text roughly in center
  const x = canvas.width / 4;
  const y = canvas.height / 2;

  // Add text object
  texts.push({ text, x, y });

  saveState(); // Save state after adding text

  redrawCanvas();

  textInput.value = "";
}

// Undo function
function undo() {
  if (undoStack.length === 0) {
    showToast("Nothing to undo");
    return;
  }
  // Save current state to redo stack
  const strokesCopy = JSON.parse(JSON.stringify(strokes));
  const textsCopy = JSON.parse(JSON.stringify(texts));
  redoStack.push({ strokes: strokesCopy, texts: textsCopy });

  // Restore last undo state
  const prevState = undoStack.pop();
  strokes = JSON.parse(JSON.stringify(prevState.strokes));
  texts = JSON.parse(JSON.stringify(prevState.texts));

  redrawCanvas();
}

// Redo function
function redo() {
  if (redoStack.length === 0) {
    showToast("Nothing to redo");
    return;
  }
  // Save current state to undo stack
  const strokesCopy = JSON.parse(JSON.stringify(strokes));
  const textsCopy = JSON.parse(JSON.stringify(texts));
  undoStack.push({ strokes: strokesCopy, texts: textsCopy });

  // Restore last redo state
  const nextState = redoStack.pop();
  strokes = JSON.parse(JSON.stringify(nextState.strokes));
  texts = JSON.parse(JSON.stringify(nextState.texts));

  redrawCanvas();
}

// Send image to Firebase
function sendImage() {
  // Convert canvas to e-paper friendly B&W image before sending
  // Simple dithering or threshold to B&W:

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale avg
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const bw = avg > 128 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = bw;
  }
  ctx.putImageData(imageData, 0, 0);

  const dataURL = canvas.toDataURL("image/png");

  // Redraw original colors for user
  redrawCanvas();

  const messageRef = firebaseRef.push();
  messageRef
    .set({ image: dataURL, timestamp: Date.now() })
    .then(() => showToast("Message sent!"))
    .catch(() => showToast("Failed to send."));
}

// Paste image support from clipboard (Ctrl+V)
window.addEventListener("paste", (event) => {
  const items = event.clipboardData.items;
  for (const item of items) {
    if (item.type.indexOf("image") !== -1) {
      const blob = item.getAsFile();
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        // Draw image on canvas in black and white
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to B&W
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const bw = avg > 128 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = bw;
        }
        ctx.putImageData(imageData, 0, 0);

        // Add this drawing as a stroke so it will be saved and redrawn properly
        // For now, just add a single stroke with tool 'image'
        strokes.push({ tool: "image", imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) });

        saveState(); // Save after paste

        redrawCanvas();

        URL.revokeObjectURL(url);
      };
      img.src = url;
      break;
    }
  }
});

// Event listeners for drawing
canvas.addEventListener("mousedown", (e) => {
  // First check drag text start
  startDragText(e);
  // If not dragging text, start drawing
  if (draggingTextIndex === null) startDrawing(e);
});
canvas.addEventListener("mousemove", (e) => {
  if (draggingTextIndex !== null) dragText(e);
  else draw(e);
});
canvas.addEventListener("mouseup", (e) => {
  stopDrawing(e);
  stopDragText(e);
});
canvas.addEventListener("mouseout", (e) => {
  stopDrawing(e);
  stopDragText(e);
});

canvas.addEventListener("touchstart", (e) => {
  startDragText(e);
  if (draggingTextIndex === null) startDrawing(e);
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  if (draggingTextIndex !== null) dragText(e);
  else draw(e);
}, { passive: false });
canvas.addEventListener("touchend", (e) => {
  stopDrawing(e);
  stopDragText(e);
}, { passive: false });

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
