const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

app.post("/voice", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">お電話ありがとうございます。テストは成功です。</Say>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

app.get("/", (req, res) => {
  res.send("サーバー動いてます！");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started");
});
