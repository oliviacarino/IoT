const canvas = document.getElementById("draw-canvas");
const ctx = canvas.getContext("2d");
const thicknessInput = document.getElementById("thickness");

let drawing = false;
let tool = "draw";
let lastPos = { x: 0, y: 0 };

function initCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
initCanvas();

canvas.addEventListener("mousedown", (e) => {
  startDrawing(e);
});
canvas.addEventListener("mousemove", (e) => {
  draw(e);
});
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

// Touch support
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (e.touches.length > 0) startDrawing(e.touches[0]);
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (e.touches.length > 0) draw(e.touches[0]);
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  stopDrawing();
}, { passive: false });

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function startDrawing(e) {
  drawing = true;
  const pos = getCanvasPos(e);
  lastPos = pos;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.strokeStyle = tool === "erase" ? "white" : "black";
  ctx.lineWidth = tool === "erase" ? 20 : thicknessInput.value;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function draw(e) {
  if (!drawing) return;
  const pos = getCanvasPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  lastPos = pos;
}

function stopDrawing() {
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

// Firebase config
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
