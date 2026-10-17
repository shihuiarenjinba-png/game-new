# 引継ぎ室 v0.16 — 分かりやすい操作導線・MSIX提出準備

**開発ブランチ：** `feature/handover-v16-clear-ui-msix-readiness`
**状態：UI改良のコードを追加・静的/進捗チェック実施／Windows実機テスト・MSIX実ファイル生成はHOLD**

## どこを押すと何が起こるか

第一夜の調査5回 → 初夜の仮説1回 → 翌朝の聞き取り3回 → 仮説の見直し1回 → 最終推理3段階 → 報告方針1回 → 結末。全14判断の正しい進行度を表示します（旧版セーブは通常12段階、推理のない旧版完了済み記録は9段階）。

- 画面上部の短い案内に「現在の場面 → 次の場面」を表示。
- これまでどおり、一画面で3つの選択肢を選ぶだけです。
- 次へ進む矢印を「→」に統一。
- 「手がかりを見る（件数）」→確認→「選択肢に戻る」で戻れます。
- 記録は自動保存されます。「記録の管理」からJSONで書き出し可能。
- 新しいタブ・追加の会話AI・アカウント・サーバー・課金UIは作っていません。

## MSIX生成への変更

`npm run build:msix` のWindows x64 MSIXとMicrosoft Store用MSIXUPLOADを使用し続けます。ZIP／NSIS／EXEをStore提出用の代替としません。

`npm run audit:msix` で、正式Package Identity・Publisher・パッケージ版番号・PNGロゴ4種の寸法を確認します。**正式な値が未設定・正式ロゴが不足している場合は停止する設計です。**

正式版情報がそろえば、Windowsで `npm run build:msix` を実行し、`scripts/verify-msix.ps1` で実際のMSIX内部のManifestとMSIXUPLOADの構造を点検する構成です。生成された成果物は `dist-msix/` に置かれる設計です。**このチャットからビルドを成功させたわけではありません。**

必要なPNG画像：
`build/appx/StoreLogo.png`（50×50）、
`Square44x44Logo.png`（44×44）、
`Square150x150Logo.png`（150×150）、
`Wide310x150Logo.png`（310×150）。
画質・商用ロゴ・高DPIの追加デザインは別途必要です。

## 実行コマンド

独立した作業フォルダで：

```powershell
npm test
npm run audit:story-volume
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-windows-local-qa.ps1

# 正式Identity・版番号・商用ロゴを設定した後だけ
npm run audit:msix
npm run build:msix
npm run verify:msix:win
```

GitHub Actionsは前工程からランナー未割当の問題が続くため、**Node全回帰・Edge実機自動試験・MSIXファイルをPASSと断定しません**。保存/推理の論理を壊さない回帰試験コードを維持しています。

追加の受入項目と不足物：
`docs/V16_UI_MSIX_ACCEPTANCE_JA.md`

**販売はHOLD**。Partner Center正式identity、正式ロゴ、WindowsでのMSIX生成・WACK、実機インストール、第三者試遊、販売価格や商用ページの検証が必要です。

**保護：** STRATEGY MARKET、日本版・米国版、他作品、game-newのmainと以前のブランチには変更を加えていません。
