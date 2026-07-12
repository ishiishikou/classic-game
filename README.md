# classic-game

スーファミ風の小さな横スクロールゲームです。外部ライブラリを使わず、Canvas APIで背景とキャラクターアニメーションを描画しています。

## キャラクター素材

- `assets/sprites/forest-runner-64.png`
- RGBA形式の透過PNG
- 1フレーム `64 x 64`
- 4列 x 2行、全8フレーム
- フレーム構成: 待機1、走行4、ジャンプ上昇1、頂点1、下降・着地1

## 操作

- 画面左側を押し続ける: 左へ走る
- 画面右側を押し続ける: 右へ走る
- ダブルタップ: ジャンプ
- PCでは左右キーまたは A / D、ジャンプは Space / ↑

## GitHub Pages

PRをマージ後、リポジトリの **Settings → Pages** で次のように設定します。

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

公開URLは通常 `https://ishiishikou.github.io/classic-game/` です。
