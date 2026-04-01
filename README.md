# BONSAI BOX

箱と直方体だけで盆栽を描く、3D 盆栽ビューア兼ミニジェネレータです。  
開発は Vite、描画は Three.js を使い、配布時は `dist/` を静的ホスティングに載せるだけで動きます。

## 何を作ったか

- ボクセル風の 3D 盆栽ビューア
- 4 つの盆栽プリセット: 直幹 / 斜幹 / 吹き流し / 半懸崖
- seed ベースの再現可能なランダム生成
- 回転、ズーム、自動回転、PNG 保存、seed 指定

## 起動方法

1. 開発サーバを使う場合

```bash
npm install
npm run dev
```

表示されたローカル URL をブラウザで開きます。

2. 本番ビルドを確認する場合

```bash
npm run build
npm run preview
```

`dist/` が生成され、`npm run preview` で本番相当の表示確認ができます。

## テスト

```bash
npm test
```

## ファイル構成

- `index.html`: Vite の HTML エントリ
- `src/main.js`: Three.js シーン、カメラ、ライト、InstancedMesh 描画、操作連携
- `src/styles.css`: レイアウト、配色、レスポンシブ、静かな展示物としての見た目
- `src/bonsaiGenerator.js`: seed ベースの盆栽形状生成ロジック
- `src/ui.js`: UI のイベント委譲、表示更新、localStorage 永続化
- `tests/`: generator と UI のユニットテスト
- `dist/`: `npm run build` で生成される配布物

## メモ

- 静的ホスティングへは `dist/` の中身を配置します。
- GitHub Pages / Netlify / S3 などの静的配信で動作します。
