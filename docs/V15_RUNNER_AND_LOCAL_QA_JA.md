# 引継ぎ室 — v0.15 QA復旧記録

## 状態

- ゲーム本体：v0.14（新しいUI・物語・保存形式への変更なし）
- QA用ブランチ：`feature/handover-v15-local-qa-recovery`
- 自動テスト：**一部を独立実行環境で検証。GitHub Actionsの通常実行は未復旧。**
- 人手によるWindows試遊・正式MSIX・価格確認：未実施
- **販売判定：HOLD**

## 1. GitHub Actionsが開始できない問題

GitHub Actionsの以下の結果は、Linux、Windowsの両ジョブが実行ステップに入る前に失敗していることを示す。

- v0.14: [run 39012973345](https://github.com/shihuiarenjinba-png/game-new/actions/runs/39012973345)
- v0.14再実行（同一ラン）：依然としてFAILURE
- v0.15 QAブランチ: [run 39014261200](https://github.com/shihuiarenjinba-png/game-new/actions/runs/39014261200)

v0.15の結果：**2ジョブとも `runner_id=0`、`steps=[]`、開始から数秒でFAILURE**。すなわち `npm test` 自体の失敗、Windows Edge自動テストの失敗、コードの構文エラーと同一視しない。

このリポジトリは**非公開**。GitHub公式ドキュメントによれば、非公開リポジトリのホストランナーはActionsの利用枠、予算、支払い方法、ストレージ利用状況の影響を受ける。以前スクリーンショットのActionsアーティファクトアップロードが容量上限で失敗した経緯もある。ただし、**今回のランナー未割当の原因が課金にあると確定したわけではない**。

### GitHub所有者が確認する項目（料金設定は勝手に変更しない）

1. [失敗した実行ページ](https://github.com/shihuiarenjinba-png/game-new/actions/runs/39014261200)の最上部に、billing/spending limit/usage制限/支払いエラーのバナーや注記がないか確認。
2. [GitHub請求ページ](https://github.com/settings/billing)の**Budgets and alerts（予算とアラート）**を確認し、Actionsに対する使用停止条件や月間上限、利用枠超過の表示がないか調べる。**支払いや予算の変更は所有者自身が必要性と金額を判断すること**。
3. 明らかな請求問題がなければ、GitHub StatusまたはGitHub Supportで「private repository, ubuntu/windows runners fail in 2 seconds, no steps, runner_id=0」という情報を添えて問い合わせる。
4. 制限が解消した後、Actionsで失敗ジョブを再実行し、**Linux storyとWindows Edge両方がPASSになった場合だけCI完了と判定**する。

GitHub公式文書：

- https://docs.github.com/en/actions/how-tos/troubleshoot-workflows
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/billing/how-tos/set-up-budgets

## 2. GitHub Actionsに依存しないロジック検査の結果

GitHubのv0.14実ソースを別のJavaScript環境で評価（コードを読んだだけでなく実行）。

| 検査 | 結果 | 範囲と制約 |
| --- | --- | --- |
| 6大型ルート、72シード×3初期仮説×3見直し×3報告方針 | 1,944/1,944 PASS | 実際のstory/morning/arcs/deduction/結末コードを実行。証拠一覧の供給部だけ検査用アダプターを使用 |
| 同じ条件で関連性の低い証拠ペアを選択 | 1,944/1,944 PASS | 実際の真相判定ロジックでは回収しない |
| v0.14初期セーブの形式検証 | 72/72 PASS | 実際のsave-v14～v4までのチェーンを実行（一部推理ステージ評価は検査用アダプター） |
| v0.13初期セーブの引継ぎ | 72/72 PASS | 元のJSONデータを変更せず復元 |
| v0.9初期セーブの引継ぎ | 72/72 PASS | 元のJSONデータを変更せず復元 |

**この表をWindows GUIのPASSやnpm全テストのPASSと取り違えないこと。** 保存スクリプトの中間推理状態までの完全な全ケース検査も未完了。

**補足：** オフラインのJSONバックアップはデジタル署名付きではない。妥当な範囲内の事件seedを書換えるような意図的な改変を、現在の構造検証だけですべて検知することはできない。通常プレイではseedは開始時に固定され、選択履歴は再計算して検証される。意図的な編集データの完全な改変検知は別の受入項目として扱う。

## 3. 独立Windows PCで検査する安全な代替ルート

**新しいZIPを必ず既存作品とは別フォルダへ展開。** Windows 11、Node.js 22以上、Microsoft Edgeがインストール済みの端末を想定する。

PowerShellでそのフォルダを開き、以下を実行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-windows-local-qa.ps1
```

スクリプトは以下を順に実施する：

1. `npm test` — 物語・推理・旧セーブ・ランダム化・簡素化の回帰テスト
2. `npm run audit:story-volume` — 6大型ルートごとの表示文章量
3. `npm run test:edge:win` — Edgeで6ルートを通し、狭幅画面も確認
4. `npm run test:edge:accessibility:win` — Tab/Enter、表示倍率、実際のリロード、保存の継続
5. `npm run test:edge:save:win` — JSONのダウンロード・読み込み・壊れたデータの拒否・別事件の証拠混入防止

失敗したものも実行を継続し、独立した `qa-local-output/run-日付時刻/` フォルダに項目別ログと `qa-summary.json` を作成する。**検査スクリプトは既存作品を編集しない。自動インストール、課金設定変更、Git push、MSIXの作成・提出はしない。**

Windows EdgeなしでNodeの検査だけを実施する場合は `-SkipEdge` を追加できる。その場合、結果は **PARTIAL_NODE_ONLY**であり、WindowsテストPASSとはしない。

### ローカル出力の取り扱い

出力に再現ログや個人PCのパス名が含まれる可能性があるため、第三者へ送る場合は必要な範囲を確認すること。GitHubへの自動アップロードはしない。ローカル検査の成功だけで第三者の感想やMSIX販売可能性を保証しない。

## 4. 販売判定と次のゲート

- Actionsランナーを利用可能にして通常のLinux/Windows CIをPASSさせる
- 実Windows環境でのQAログを確認し、操作性・保存・UIを再監査する
- 第三者が6ルートを複数周回し、結末の納得感、人物の自然さ、重複・退屈、実プレイ時間を記録する
- Microsoft Storeの正式製品Identity・署名済MSIXの導入/更新/削除を検査
- 競合・価格・購入意思の検証を終えるまで**販売HOLD**

**変更禁止：** STRATEGY MARKET全系統、ほかの既存作品、`game-new` のmainと以前の開発ブランチは閲覧・編集・上書き・転用しない。ここで追加したのはv0.15専用ブランチのQA手順だけ。
