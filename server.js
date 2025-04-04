const express = require('express');
const fs = require('fs');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const path = require('path');

// Google Cloud Speech-to-Textクライアントの初期化
const speechClient = new SpeechClient();

// Expressアプリケーションの初期化
const app = express();
const port = 3000;

// 静的ファイルの提供 (フロントエンド)
app.use(express.static(path.join(__dirname, 'public')));

// Multerで音声ファイルのアップロードを設定
const upload = multer({ dest: 'uploads/' });

// 音声認識APIエンドポイント
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const audioFilePath = req.file.path;

    // 音声ファイルをバイナリ形式で読み込む
    const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

    // Google Cloud Speech-to-Text APIリクエスト構成
    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: 'WEBM_OPUS', // 音声形式に応じて変更 (例: MP3, WEBM_OPUSなど)
        sampleRateHertz: 48000,
        languageCode: 'ja-JP',
        enableAutomaticPunctuation: true,
      },
    };

    // 音声認識リクエスト送信
    const [response] = await speechClient.recognize(request);

    // 認識結果を取得
    const transcription =
      response.results
        .map((result) => result.alternatives[0].transcript)
        .join('\n') || '認識結果がありません';

    // アップロードされたファイルを削除
    fs.unlinkSync(audioFilePath);

    // 認識結果を返す
    res.json({ transcript: transcription });
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).json({ error: '音声認識中にエラーが発生しました' });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
