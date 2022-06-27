// io는 자동적으로 backend socket.io와 연결해주는 함수
// io가 알아서 socket.io를 실행하고 있는 서버를 찾은 것이다.
const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;
let roomName;
function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  // 어떤 event의 이름이든 쓸 수 있음. 또한 string으로 바꿔서 전송할 필요없음.
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
