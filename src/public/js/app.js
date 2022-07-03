const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("section");
call.style.display = "none";
let myStream;
let muted = true;
let cameraOff = false;
let roomName;
let myPeerConnection;
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}
async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
}
function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  const icon = muteBtn.querySelector("i");
  if (!muted) {
    icon.className = "fas fa-volume-up";
    muted = true;
  } else {
    icon.className = "fas fa-volume-mute";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  const icon = cameraBtn.querySelector("i");
  if (cameraOff) {
    icon.className = "fas fa-video-slash";
    cameraOff = false;
  } else {
    icon.className = "fas fa-video";
    cameraOff = true;
  }
}
async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  // the code for replace camera in peer side screen when I replace camera.
  if (myPeerConnection) {
    // when I change the camera automatically videotrack is changed in my side.
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const room = document.getElementById("room");
let nickname;
room.hidden = true;

async function initCall() {
  welcome.style.display = "none";
  call.style.display = "flex";
  await getMedia();
  makeConnection();
}
function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  const nickname = document.createElement("h4");
  const messageBox = document.createElement("div");

  li.className = message.split(":")[0];
  if (message.split(":").length === 2) {
    nickname.innerText = message.split(":")[0];
    messageBox.innerText = message.split(":")[1];
    li.appendChild(nickname);
    li.appendChild(messageBox);
  } else {
    messageBox.innerText = message.split(":")[0];
    li.appendChild(messageBox);
  }

  ul.insertBefore(li, ul.firstChild);
}
// 여기서 addMessage는 (msg)=> {addMessage(msg)} 와 같음.
socket.on("new_message", addMessage);
socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} arrived!`);
});
socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount}명)`;
  addMessage(`${left} left`);
});
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.appendChild(li);
  });
});

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}
function showRoom() {
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;

  const msgForm = room.querySelector("#msg");

  msgForm.addEventListener("submit", handleMessageSubmit);
}
async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const roomInput = welcomeForm.querySelector("#roomName");
  const nicknameInput = document.querySelector("#nickname");
  nickname = nicknameInput.value;
  socket.emit("nickname", nicknameInput.value);
  nicknameInput.value = "";

  await initCall();
  socket.emit("join_room", roomInput.value, showRoom);
  roomName = roomInput.value;
  roomInput.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);
// Socket Code
// peerA
socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});
//peer B
socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});
//peer A
socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});
//------

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun.l.google.com:19302",
          "stun:stun.l.google.com:19302",
          "stun:stun.l.google.com:19302",
          "stun:stun.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}
