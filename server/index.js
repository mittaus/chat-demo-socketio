const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http, {cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"]
    }});
const mongoose = require("mongoose");
const port = 1337;
let users = [];
let messages = [];

mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://Vastec-Portatil:27017,Vastec-Portatil:27018,Vastec-Portatil:27019/chatdb?replicaSet=rs", { useNewUrlParser: true });

const ChatSchema = mongoose.Schema({
  username: String,
  msg: String,
});

const ChatModel = mongoose.model("chat", ChatSchema);

ChatModel.find((err, result) => {
  if (err) throw err;

  messages = result;
});

io.on("connection", (socket) => {
  socket.emit("loggedIn", {
    users: users.map((s) => s.username),
    messages: messages,
  });

  socket.on("newUser", (username) => {
    socket.username = username;

    users.push(socket);

    io.emit("userOnline", socket.username);
  });

  socket.on("msg", (msg) => {
    let message = new ChatModel({
      username: socket.username,
      msg: msg,
    });

    message.save((err, result) => {
      if (err) throw err;

      messages.push(result);

      io.emit("msg", result);
    });
  });

  socket.on("disconnect", () => {
    io.emit("userLeft", socket.username);
    users.splice(users.indexOf(socket), 1);
  });
});

http.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});


