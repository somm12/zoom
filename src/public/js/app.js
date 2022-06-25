const socket = new WebSocket(`ws://${window.location.host}`);
// 여기서 socket은 서버로의 연결을 뜻한다.

function handleOpen() {
  console.log("connected to Server✅");
}
socket.addEventListener("open", handleOpen);

socket.addEventListener("message", (message) => {
  console.log("New message: ", message.data);
});

socket.addEventListener("close", () => {
  console.log("disconnected to Server❌");
});

setTimeout(() => {
  socket.send("hello from the browser");
}, 10000);
