# Tabata Timer

ローラー台で **「次の何秒で何ギア / 何 W / レスト」 が一目で分かる**、 ブラウザだけで動く HIIT インターバルタイマー。

**▶ https://yuujikamura.github.io/tabata-timer/**

スマホ / PC のブラウザでそのまま開ける。 インストール不要、 アカウント不要、 サーバとの通信なし。

## できること

- **プリセット 4 種**
  - ローラー 20分メニュー (フル)
  - ローラー ピラミッドだけ
  - ローラー 高回転だけ
  - タバタ・プロトコル (オリジナル準拠、 田畑泉 1996)
- **進行中の見やすい画面** ── 大きな残秒数、 進行リング、 現在ギア / フォーム指示、 次フェーズプレビュー、 セットリスト
- **音** ── 毎秒チック / 残 3 秒カウントダウン / フェーズ切替 / 終了の 4 系統。 ミュート切替あり
- **Bluetooth センサー接続** (Chrome / Edge / Android Chrome)
  - FTMS 対応スマートトレーナー → パワー W / ケイデンス rpm
  - 心拍計 → BPM
- **GPX エクスポート** ── 終了後に「GPX をダウンロード」 で Strava にアップロード可能なファイル取得 (パワー / ケイデンス / 心拍 extensions 入り)

## キーボードショートカット

| キー | 動作 |
|---|---|
| `Space` | スタート / 一時停止 |
| `R` | リセット |

## ローカル開発

```sh
npm install
npm run dev          # http://localhost:5173/
npm run build        # build/ に静的サイト
npm run preview      # build/ を確認
```

## 由来

このリポジトリは [rubychi/tabata-timer](https://github.com/rubychi/tabata-timer) (MIT) の fork。 古い React 15 + Express + MongoDB の monorepo 実装は触らず履歴に残し、 新しく SvelteKit + adapter-static で書き直した。

Web Bluetooth ペアリングと FTMS パーサは [yuujikamura/fujihc-trainer](https://github.com/yuujikamura/fujihc-trainer) の `web/lib/ble_client.js` / `ftms_parse.js` を Tabata 用に簡素化したもの。

## スタック

- Svelte 5 (runes mode)
- SvelteKit + `@sveltejs/adapter-static`
- TypeScript
- Web Bluetooth (FTMS 0x1826 / Heart Rate 0x180D)
- Web Audio API
- GitHub Pages 自動デプロイ

## ライセンス

MIT (元 rubychi の LICENSE を継承)
