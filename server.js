const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("サーバー動いてます！");
});

app.post("/voice", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("Server started");
});
