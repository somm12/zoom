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

// 여기서 socket은 연결된 브라우저를 뜻한다.
wss.on("connection", (socket) => {
  socket.send("hello!!");
  console.log("connected to Browser✅");
});

server.listen(3000, handleListen);
