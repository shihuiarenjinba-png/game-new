# 引継ぎ室 v0.18 — 3大検査の受入ワークフロー

**開発版。販売判定HOLD。Node全回帰・Windows GUI・正式MSIXがまだPASSになっていないことを明記しています。**

## 今回の修正

- Windows Edgeで再読み込みを検査するコードに残っていた **v13の古いローカル保存キー**を発見し、現在のv14保存キーを利用するよう修正。
- ローカルWindows PCのNode全回帰、Edgeの6ルート・キー操作・倍率・セーブ、MSIXの正式Identity／ロゴ／マニフェスト検証をまとめる一括スクリプトを追加。
- WACKの `REPORT OVERALL_RESULT=PASS`・部分テストの有無・Package Identity/Versionを評価。**終了コード0だけで合格扱いにしない**。
- 署名済みMSIXの内容を読むツールを追加。実インストールは利用者が明示的に指定し、さらにYESで確認した場合のみ。既存アプリの上書き・アンインストール、証明書登録はしない。
- 新規回帰テストで古いセーブキーの混入が再発しないように確認する。

## Windows 11での実行

独立したv18フォルダに展開後、Node.js 22.12.0以上とEdgeを用意。

```powershell
npm run test:triple:win
```

結果は `qa-local-output/acceptance-日時/acceptance-summary.json`に保存。Node・Edge・MSIXのどれかが不足すると**個別にBLOCKEDまたはFAIL**と記録される。MSIXのための資格情報や正式ロゴがない場合は、アプリ本体のテストだけ進行する。

```powershell
# WACKも明示的に検査する場合（Windows SDK、対話セッション等が必要）
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-triple-acceptance-win.ps1 -RunWack
```

Microsoft Storeの正式Product Identity・Publisher・Package Family Nameと、正式に承認した4サイズのPNGロゴが確定した場合のみ、`npm install`と正式MSIXのビルドを進める。**架空のIdentityを使って商用MSIXを生成したことにはしない。**

詳しい手順：[v18の受入・結果記録](docs/V18_TRIPLE_GATE_ACCEPTANCE_JA.md)。

## まだ未完了のこと

- GitHub Actionsは非公開リポジトリのジョブにランナーが割り当てられない（`runner_id=0`、`steps=[]`）。
- 正式Identityと商用ブランドが未確定のため、現時点で正式MSIX未生成。
- Windows実機でのNode全回帰・Edge GUI・正式MSIXの実行ログ、署名済みアプリのインストール・更新・削除、WACKの合格ログはまだない。
- 第三者試遊と有料ゲームとしての購入意思も未検証。

**今回変更したのは `game-new / feature/handover-v18-windows-acceptance-triple-gate` のみ。** STRATEGY MARKETや事務系既存作品、game-newのmainと過去のブランチには変更を加えていない。
