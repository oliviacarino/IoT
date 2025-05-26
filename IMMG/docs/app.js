// Get canvas and context
const canvas = document.getElementById("draw-canvas");
const ctx = canvas.getContext("2d");
const thicknessInput = document.getElementById("thickness");

let drawing = false;
let tool = "draw";
let lastPos = { x: 0, y: 0 };

function initCanvas() {
  ctx.fillStyle = "white"; // Fill background white for erasing to work
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
initCanvas();

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", (e) => startDrawing(e.touches[0]), { passive: false });
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchmove", (e) => draw(e.touches[0]), { passive: false });

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function startDrawing(e) {
  e.preventDefault();
  drawing = true;

  const pos = getCanvasPos(e);
  lastPos = pos;

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);

  ctx.strokeStyle = (tool === "erase") ? "white" : "black";
  ctx.lineWidth = (tool === "erase") ? 20 : thicknessInput.value;
  ctx.lineCap = "round";  // smooth line ends
  ctx.lineJoin = "round"; // smooth line joins
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();

  const pos = getCanvasPos(e);

  const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
  const steps = Math.ceil(dist / 2); // adjust 2 for smoothness (smaller = smoother)

  for (let i = 1; i <= steps; i++) {
    const x = lastPos.x + ((pos.x - lastPos.x) * i) / steps;
    const y = lastPos.y + ((pos.y - lastPos.y) * i) / steps;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastPos = { x, y };
  }
}

function stopDrawing(e) {
  e.preventDefault();
  drawing = false;
  ctx.beginPath();
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

function clearCanvas() {
  initCanvas();
}

function addText() {
  const text = document.getElementById("text-input").value.trim();
  if (!text) return;

  ctx.font = "20px sans-serif";
  ctx.fillStyle = "black";
  ctx.fillText(text, 10, canvas.height - 20);
  document.getElementById("text-input").value = "";
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function sendImage() {
  const dataURL = canvas.toDataURL("image/png");
  fetch("https://your-backend-or-storage.com/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataURL }),
  })
  .then(() => showToast("Message sent!"))
  .catch(() => showToast("Failed to send message."));
}

// Firebase config for middleware (replace with your own config)
const firebaseConfig = {
  apiKey: "AIzaSyDrGnVzr3nvLSF0C9JUYdmNLlQPcFGxLtk",
  authDomain: "immg-eb767.firebaseapp.com",
  databaseURL: "https://immg-eb767-default-rtdb.firebaseio.com",
  projectId: "immg-eb767",
  storageBucket: "immg-eb767.firebasestorage.app",
  messagingSenderId: "407794462813",
  appId: "1:407794462813:web:cd56f4aadde9ec4b199db4"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
