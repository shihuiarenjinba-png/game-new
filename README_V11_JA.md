# 引継ぎ室 v0.11 — キーボード操作・保存再開・画面倍率の検査

**開発版・有料販売HOLD。既存6つの大型ミステリーと72種の事件設定は維持しています。**

## 今回追加したもの

- Windows Edgeで**Tab・Enterをブラウザへ実際に入力し**、本編の選択肢から進行できることの検証。
- 事件の途中で画面を再読み込みし、選択履歴・事件番号・証拠が変わらないことの検証。
- 100%／125%／150%相当の表示倍率と、幅768px・1366px・**実際のCSS表示幅390px**の確認。
- 旧来の6大型ルートのクリックによる通し検査、推理・物語の組み合わせテストは維持。
- Microsoft Store向けのUIやシミュレーション内部情報を追加せず、ゲーム画面はv0.10と同じ簡潔なまま。

## 試す方法

この専用ブランチのZIPを独立したフォルダに展開し、`index.html` をEdge/Chromeで開きます。

Windows + Node.js 22以上 + Edgeがある場合は、以下の検査を実行できます。

```powershell
npm test
npm run test:edge:win
npm run test:edge:accessibility:win
```

ゲームの通常プレイにNode.jsや通信は不要です。上記のNodeコマンドは開発時のQA用です。

## 判定

- Windows GitHub-hosted Edgeの代表シナリオ：キーボード進行、再読み込み、正確なCSS幅390px、150%デバイス倍率を含めて**自動テストPASS**。
- **未実施**：実際のプレイヤーによるWindows試遊、Electron起動・MSIXインストール、JSONファイルのブラウザ操作確認、購入意向調査。
- **商品化はHOLD**。自動テストの成功を売れ行きや作品の面白さの保証とは扱いません。

詳細な検証記録：`docs/V11_WINDOWS_AUTOMATED_QA_JA.md`。
人間用の検証手順：`docs/V11_HUMAN_WINDOWS_ACCEPTANCE_JA.md`。

**変更の禁止範囲：** STRATEGY MARKET全系統、game-newのmain・旧ブランチ、ほかの既存作品には一切変更していません。
