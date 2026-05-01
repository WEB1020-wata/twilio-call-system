const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});

// 最初の応答：話してもらう
app.all("/voice", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="ja-JP" action="/gather" method="POST" timeout="5" speechTimeout="auto">
    <Say language="ja-JP">お電話ありがとうございます。ご用件をお話しください。</Say>
  </Gather>
  <Say language="ja-JP">申し訳ございません。聞き取れませんでした。もう一度お願いいたします。</Say>
  <Redirect method="POST">/voice</Redirect>
</Response>`;

  res.set("Content-Type", "text/xml; charset=utf-8");
  res.send(twiml);
});

// 聞き取った内容に反応
app.post("/gather", (req, res) => {
  const speechResult = req.body.SpeechResult || "";

  if (!speechResult) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">申し訳ございません。聞き取れませんでした。もう一度お願いいたします。</Say>
  <Redirect method="POST">/voice</Redirect>
</Response>`;

    res.set("Content-Type", "text/xml; charset=utf-8");
    return res.send(twiml);
  }

  const safeText = speechResult
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">${safeText}、ですね。</Say>
  <Say language="ja-JP">続けて詳しい内容をお話しください。録音を開始します。</Say>
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

// 録音完了後
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
