# 引継ぎ室 v0.15 — QA復旧作業用ブランチ

**ゲーム本体はv0.14のままです。** 本工程では画面、脚本、機能、保存形式の追加・変更はしていません。GitHub Actionsのジョブが始まらない問題を切り分け、Windows PCで同じ品質検査を一括実行する方法を追加しました。

## 確認できた事実

- リポジトリはprivateです。
- GitHub ActionsではLinuxとWindowsの両ジョブが約2秒で失敗し、runner_id=0、steps=[]のため、NodeテストやEdgeテストまで到達していません。
- 失敗ジョブの再実行も同じ結果です。**今回CIは未復旧、PASSではありません。**
- v0.14の本物の事件・推理コードを別のJavaScript環境で動かし、正常な伏線回収1,944通り・不適切な照合1,944通りが想定どおりでした。証拠一覧の供給部は代替しているため、Node全回帰検査の代用にはしません。
- v0.14/v0.13/v0.9の初期セーブ72種について、形式検証または旧版からの取込みを直接確認しました。

## Windowsで検査する

新しいブランチをZIPで取得し、既存作品と**別のフォルダ**へ解凍します。Node 22以上とMicrosoft Edgeがインストールされていれば、PowerShellから次のコマンドを実行できます。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-windows-local-qa.ps1
```

このコマンドは物語・ロジック・証拠・セーブ・Edge GUIを一括検査し、`qa-local-output/run-日付時刻/` にログと `qa-summary.json` を保存します。結果がFAILならその項目をFAILのまま残します。**ゲームの公開、課金、GitHubへのpush、MSIXの作成は行いません。**

Edgeをまだ用意できない端末では、最後に `-SkipEdge` を付ければNodeだけを実行できますが、その場合は全自動検査の合格ではありません。

## CIの復旧条件

GitHub所有者側で[失敗実行](https://github.com/shihuiarenjinba-png/game-new/actions/runs/39014261200)の上部バナーと[請求・利用枠](https://github.com/settings/billing)のActions向け「Budgets and alerts」を確認してください。予算の変更や有料利用の有効化は行っていません。

原因はまだ確定していません。利用枠に問題がなければGitHub Supportの確認が必要です。

詳細な調査結果、ローカル実行手順、QAの判定基準：
`docs/V15_RUNNER_AND_LOCAL_QA_JA.md`

**商用販売：HOLD。** Windows PCでの実行結果、第三者試遊、正式MSIX、価格・需要は未検証です。

**変更範囲：** `game-new / feature/handover-v15-local-qa-recovery` のみ。mainと過去のブランチ、STRATEGY MARKET、ほかの既存作品には変更を加えていません。
