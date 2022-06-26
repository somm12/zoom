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

const sockets = [];
// 여기서 socket은 연결된 브라우저를 뜻한다.
wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anon"; //익명 소켓을 위함(아직 별명정하기 전 사람들을 위한)
  console.log("connected to Browser✅");
  socket.on("close", onSocketClose);
  // back end는 js object를 이해 X
  socket.on("message", (msg) => {
    const message = JSON.parse(msg);
    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload.toString()}`)
        );
      case "nickname":
        socket["nickname"] = message.payload;
      //누구인지 구분하기 위해서 객체인 socket에 nickname property를 추가함
    }
  });
});
// brave 브라우저와 firefox 브라우저 모두에게 메세지를 보낼 수 있게함.

server.listen(3000, handleListen);
