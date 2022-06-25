import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

// http와 ws 서버 둘다 작동.
const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
// http server 위에 websocket 서버를 올림 => localhost가 동일 포트에서 http, ws request 모두 처리할 수 있다.

function onSocketClose() {
  console.log("Disconnected from the Browser ❌");
}
function onSocketMessage(message) {
  console.log(message.toString("utf-8"));
}

// 여기서 socket은 연결된 브라우저를 뜻한다.
wss.on("connection", (socket) => {
  console.log("connected to Browser✅");
  socket.on("close", onSocketClose);
  socket.on("message", onSocketMessage);
  socket.send("hello!!");
});

server.listen(3000, handleListen);
