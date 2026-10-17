# 引継ぎ室 v0.18 — Node全回帰・Windows Edge GUI・MSIX実機検証の受入記録

**状態：検証自動化とテスト修正をGitHubへ実装済み。Windows実機／正式MSIXの受入はまだ実行していない。販売HOLD。**

## 1. 今回、実コードで発見した不具合

`scripts/windows-edge-accessibility.cjs` の実リロード判定だけ、旧セーブキー `handover-room-prototype-v13` を固定で参照していた。現在の画面／保存形式はv14であり、変数 `KEY` は `handover-room-prototype-v14`。

そのため、Windows Edgeの途中再読み込みテストを実行すると、実際のゲームが正しく保存されていてもタイムアウトする可能性があった。**画面の検査スクリプトを `KEY` 参照へ変更**し、v13の文字列が混入していないことを確認する `tests/triple-acceptance-v18.test.cjs` を追加した。

この修正は**テストの誤判定を防ぐもの**。実Windows GUIでの操作完走が終わったという意味ではない。

## 2. 今回新しく追加したテストと運用

- `scripts/run-triple-acceptance-win.ps1`：Windows実機用の**三重検査ランナー**。
  - Node `npm test`（全テストファイル）
  - `npm run audit:story-volume`（6大型ルートの表示文章量）
  - Edge実画面 `npm run test:edge:win`（6ルート）、`npm run test:edge:accessibility:win`（キー操作、倍率、リロード）、`npm run test:edge:save:win`（JSON保存と読込）
  - 正式Identityとロゴ承認、ローカルelectron-builderが揃っている場合だけ `npm run audit:msix` → `npm run build:msix` → `npm run verify:msix:win`
  - `-RunWack` はWindows App Certification Kitを明示的に使用するオプション。**テストコマンドの終了コード0だけでは合格とせず**、出力XMLの `REPORT/@OVERALL_RESULT=PASS`、`PARTIAL_RUN`が真でないこと、Identity／Versionを照合。
- `scripts/inspect-install-signed-msix.ps1`：実MSIXの内部Identityと署名状態、現在のWindowsの同名パッケージを**閲覧のみ**。明示的に `-InstallSigned` を指定し、さらにWindowsの確認画面で `YES`を入力しなければアプリはインストールしない。既存の同名アプリがあれば**更新・上書きせず停止**。
- `tests/triple-acceptance-v18.test.cjs`：旧セーブキーの混入、Windows Edgeの本体JS、復元時のキー一致、MSIX審査のHOLD条件、WACK XML判定、安全な運用を回帰検査する。

## 3. Windows PCで進める方法

既存作品を上書きしないように、`feature/handover-v18-windows-acceptance-triple-gate`を**独立した新フォルダ**へ展開。Node 22.12以降、Edgeを確認。

```powershell
# Node回帰＋Edge GUI＋MSIX可否をすべて項目別ログとして記録
npm run test:triple:win
```

正式Identityや承認済み4種ロゴ、electron-builderが未導入の場合、MSIXの項目は**BLOCKED**として記録し、Node／Edgeの結果は失われない。

ログは`qa-local-output/acceptance-年月日-時刻/`内。最終`acceptance-summary.json`の `gates` が真の実行結果。全て0件・未実施の場合はPASSではない。

※Windows Node/npmの自動インストール、`npm install`、Git push、Store提出、証明書の信頼登録、既存アプリ削除などは**このスクリプトでは行わない**。

### 正式MSIXビルド前提

Partner Centerで**引継ぎ室固有の正式値**を確認し、候補ロゴを承認して4サイズ生成してから：

```powershell
npm run make:logos
$env:STORE_IDENTITY_NAME="Partner Centerの正式なName"
$env:STORE_PUBLISHER="Partner Centerの正式なPublisher DN"
$env:STORE_PUBLISHER_DISPLAY_NAME="正式なPublisher表示名"
$env:STORE_PACKAGE_VERSION="1.0.0.0"
$env:STORE_IDENTITY_CONFIRMED="YES"
$env:STORE_BRAND_APPROVED="YES"
npm install
npm run test:triple:win
```

上記の**説明用文字列のままで値をセットしてはいけない**。実際のPartner Center値が未入手の場合はMSIXゲートHOLDを維持。

WACKを実行する場合は、Windows SDKのApp Certification Kitをインストールし、管理者権限と対話セッションが必要になる場合がある。追加の `-RunWack` 指定時だけ実行する。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-triple-acceptance-win.ps1 -RunWack
```

### 署名済みMSIXの実機検査

仮Identityを**本物のStore Identityとして流用しない**。Storeが署名する前の正式MSIXを端末にインストールするには、適切な開発用署名・信頼証明書が必要になる場合がある。Windows 11には特別な発行者OIDを持つ未署名パッケージを `-AllowUnsigned` でテストする仕組みもあるが、**通常の正式Identityを持つ未署名MSIXへ一律に適用できるわけではない**。開発署名の作成は別工程。

署名済MSIXが用意できた場合はまず読み取り検証：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-install-signed-msix.ps1 `
  -PackagePath ".\dist-msix\<正式MSIXファイル名>.msix" `
  -ExpectedIdentity "<正式Name>" `
  -ExpectedPublisher "<正式Publisher DN>"
```

`-InstallSigned`の指定は、**所有者が内容を確認しWindowsにインストールすることを明示的に選ぶ場合のみ**。スクリプトは既存の同名パッケージを検出すると停止。**更新・アンインストールは実行しない。**

インストール後に実機で、ゲームの起動・終了、保存→再起動、6ルート、倍率、証拠ジャンプ、インストールしたWindowsバージョンの情報を確認する。更新とアンインストールの検証は別のテスト環境で計画的に実施する。実際のスクリーンショットとログが必要。

## 4. 現時点の機械検査結果

| 項目 | 今回確認できたこと | 未完了 |
| --- | --- | --- |
| Node全回帰 | 新規v18テストの構文、過去の推理交差検証とテスト構成を確認 | **GitHub Actionsの実行が止まっており全件未実行** |
| Windows Edge GUI | 古い保存キーのバグを修正。GUI検査スクリプトの構文を確認 | **Windows Edge実ブラウザのv18完走未実行** |
| MSIXファイル | MSIX生成用ゲート／内部Manifest検査・WACK XML評価・署名チェックを実装 | **正式Identity不明／正式MSIX未生成／実機インストール未実行** |
| WACK | 終了コード0だけでは成功としない設計。XML結果の検証を追加 | **実WACK未実行** |
| 人間による試遊 | 受入観点とログ保護を整備 | **未実施** |

GitHub Actionsは前工程から、Linux、Windowsとも `runner_id=0` `steps=[]` のまま停止している。アプリ側のNodeテストが失敗したというログではない。非公開リポジトリのGitHub Actions予算・支払い・制限を所有者が確認し、復旧後に再試験が必要。

## 5. 完了の定義

販売へ進むには `npm test`、Windows Edge各種、正式MSIX生成・内部検査、WACK XMLのPASS、署名済/Storeテスト配布MSIXの実機起動・保存・更新・アンインストール、第三者の6ルート試遊とStore画面準備の**すべて**が必要。

**現判定：CODE PARTIAL / WINDOWS EDGE NOT RUN / OFFICIAL MSIX BLOCKED / STORE HOLD**

今回の変更は`game-new`の新しいv18専用ブランチだけ。STRATEGY MARKET等の他の既存作品やmain・過去のブランチを変更していない。

Microsoft公式：
- https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-app-certification-kit
- https://learn.microsoft.com/en-us/windows/msix/package/unsigned-package
- https://learn.microsoft.com/en-us/windows/msix/package/sign-msix-package-guide
