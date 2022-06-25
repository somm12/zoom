const socket = new WebSocket(`ws://${window.location.host}`);
// 여기서 socket은 서버로의 연결을 뜻한다.
socket.addEventListener("open", () => {
  console.log("connected to Server✅");
});

socket.addEventListener("message", (message) => {
  console.log("Just got this", message.data, "from the server");
});

socket.addEventListener("close", () => {
  console.log("disconnected to Server❌");
});
