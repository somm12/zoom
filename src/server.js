import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// http위에 socket io 서버
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});
// publicroom 채팅방 찾는 함수
function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  //roomName 찾을 수도 있고 아닐 수도 있음.
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName); // 채팅 방에 참가하려면 join만 쓰면 됨. 새로운 socket id 생성
    done();
    // 같은 room에 있는 나 이외의 사람들 모두에게 메세지를 보낼 수 있다.
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    // 모든 socket에 room개수 변경 메세지 보내기
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    // 창을 닫을 때 방에 있는 모두에게 bye라고 메세지를 보낸다.
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});
// http server 위에 socket io 서버를 올림 => localhost가 동일 포트에서 http, ws request 모두 처리할 수 있다.

// const wss = new WebSocket.Server({ server });
//const sockets = [];
// // 여기서 socket은 연결된 브라우저를 뜻한다.
// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon"; //익명 소켓을 위함(아직 별명정하기 전 사람들을 위한)
//   console.log("connected to Browser✅");
//   socket.on("close", onSocketClose);
//   // back end는 js object를 이해 X
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}: ${message.payload.toString()}`)
//         );
//       case "nickname":
//         socket["nickname"] = message.payload;
//       //누구인지 구분하기 위해서 객체인 socket에 nickname property를 추가함
//     }
//   });
// });
// brave 브라우저와 firefox 브라우저 모두에게 메세지를 보낼 수 있게함.

httpServer.listen(3000, handleListen);
