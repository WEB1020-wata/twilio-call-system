const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});

app.all("/voice", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">お電話ありがとうございます。ご用件を録音いたします。ピーという音のあとにお話しください。</Say>
  <Record
    action="/recording-finished"
    method="POST"
    maxLength="60"
    timeout="5"
    playBeep="true"
    trim="trim-silence"
  />
  <Say language="ja-JP">録音を終了しました。お電話ありがとうございました。</Say>
</Response>`;

  res.set("Content-Type", "text/xml; charset=utf-8");
  res.send(twiml);
});

app.post("/recording-finished", (req, res) => {
  console.log("録音完了:", req.body);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">録音を受け付けました。ありがとうございました。</Say>
</Response>`;

  res.set("Content-Type", "text/xml; charset=utf-8");
  res.send(twiml);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
