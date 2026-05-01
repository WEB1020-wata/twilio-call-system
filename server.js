const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  OPENAI_API_KEY,
  SMTP_USER,
  SMTP_PASS,
  MAIL_TO,
} = process.env;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

app.post("/recording-finished", async (req, res) => {
  res.set("Content-Type", "text/xml; charset=utf-8");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP">録音を受け付けました。ありがとうございました。</Say>
</Response>`);

  try {
    const recordingUrl = req.body.RecordingUrl;
    const from = req.body.From || "不明";
    const to = req.body.To || "不明";
    const duration = req.body.RecordingDuration || "不明";

    console.log("録音完了:", req.body);

    if (!recordingUrl) {
      throw new Error("RecordingUrl がありません");
    }

    const wavUrl = `${recordingUrl}.wav`;

    // Twilio側で録音ファイルの準備に少し時間がかかるため待つ
    await sleep(5000);

    const audioResp = await axios.get(wavUrl, {
      responseType: "arraybuffer",
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN,
      },
      timeout: 30000,
    });

    const form = new FormData();
    form.append("file", Buffer.from(audioResp.data), {
      filename: "call.wav",
      contentType: "audio/wav",
    });
    form.append("model", "whisper-1");
    form.append("language", "ja");

    const transcriptionResp = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        timeout: 60000,
      }
    );

    const transcript = transcriptionResp.data.text || "文字起こし結果なし";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 60000,
      greetingTimeout: 60000,
      socketTimeout: 60000,
    });

    await transporter.sendMail({
      from: `"Twilio Call System" <${SMTP_USER}>`,
      to: MAIL_TO,
      subject: "【電話録音・文字起こし】新しい着信がありました",
      text: [
        "電話の録音内容を文字起こししました。",
        "",
        `発信元: ${from}`,
        `着信先: ${to}`,
        `録音時間: ${duration}秒`,
        "",
        "【文字起こし内容】",
        transcript,
      ].join("\n"),
    });

    console.log("メール送信完了");
  } catch (error) {
    if (Buffer.isBuffer(error.response?.data)) {
      console.error("処理エラー:", error.response.data.toString("utf8"));
    } else {
      console.error("処理エラー:", error.response?.data || error.message);
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
