const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

app.post("/voice", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">Test success.</Say>
</Response>`;

  res.type("text/xml; charset=utf-8");
  res.send(twiml);
});

app.get("/", (req, res) => {
  res.send("server is running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started");
});
