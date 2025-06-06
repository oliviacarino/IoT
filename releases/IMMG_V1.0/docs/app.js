const canvas = document.getElementById("draw-canvas");
const ctx = canvas.getContext("2d");
const thicknessInput = document.getElementById("thickness");

let drawing = false;
let tool = "draw";
let lastPos = { x: 0, y: 0 };

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
const firebaseRef = database.ref("images");

function initCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
initCanvas();

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
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
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
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

function sendImage() {
  const dataURL = canvas.toDataURL("image/png");
  const messageRef = firebaseRef.push();
  messageRef
    .set({ image: dataURL, timestamp: Date.now() })
    .then(() => showToast("Message sent!"))
    .catch(() => showToast("Failed to send."));
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);

canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stopDrawing, { passive: false });
