# 引継ぎ室 v0.16 — 操作導線・MSIX提出前監査

**対象：** `game-new / feature/handover-v16-clear-ui-msix-readiness` のみ
**商用判定：HOLD。正式なMSIXファイルはまだ生成・提出していない。**

## 1. 誰でも順番を想像できる操作

### 実際の進行

```
第一夜：調査5回
  ↓
初夜の仮説を選ぶ
  ↓
翌朝：聞き取り3回
  ↓
仮説を見直す
  ↓
最終推理：焦点→証拠2件の照合→解釈
  ↓
報告方針を決める
  ↓
事件の結末 → 別の事件／同じ事件の再調査
```

画面を増やさず、既存の一画面・通常の3択・折りたたみ証拠欄を維持。

- 進行行は `現在：...` → `次：...` 相当の短い案内を示す。残りの判断を直感的に把握できる。
- 進行ゲージは新規v0.14モードでは**実際の14判断**をもとに計算。初夜5、仮説1、翌朝3、見直し1、推理3、最終報告1。旧モードは**12判断**の別計算。さらに初期旧版から復元した推理パートのない完了済み事件は**9/9**として表示する。従来の9/11カウントは推理3段階を含んでおらず、実際の総数として不適切だった。
- 選択肢の「↗」を「→」に変更。外部のウェブサイトへ飛ぶという誤解を避ける。
- 「手がかりを見る（実際に見つけた件数）」で証拠欄へスクロールし、証拠欄の「選択肢に戻る」で今の選択画面に戻る。追加のタブ・独立したステータス画面は作らない。
- ジャンプ後は証拠欄の見出しへキーボードフォーカスを移す。折りたたみの手がかりは従来どおり操作できる。
- デスクトップの証拠欄は第二のスクロール領域にしない。視線移動と操作の複雑さを抑える。
- 情報量が増えても文字を細かくしない。標準本文は15px以上を目安にする。

## 2. MSIX形式は必須、ただし実ファイル完成ではない

既存の `npm run build:msix` は `electron-builder` のWindows x64 MSIXターゲットを使用し、Store向けの `.msixupload` も生成する設定のまま維持。

**新しく追加した停止条件：**

- Partner Centerの正式な `STORE_IDENTITY_NAME`（パッケージIdentity.Name）
- 同ページの正式 `STORE_PUBLISHER`（CNで始まる発行者の全体表記）
- 正式な発行者表示名 `STORE_PUBLISHER_DISPLAY_NAME`
- 実際にPartner Center情報を照合した場合だけ設定する `STORE_IDENTITY_CONFIRMED=YES`
- `STORE_PACKAGE_VERSION`：例 `1.0.0.0`。先頭は1以上、最後の項目は0。現在の `package.json` はMSIX向けの技術的バージョン `1.0.0` に合わせた。**これは販売開始を意味しない。**
- `build/appx/` 内の正式PNG（1x基準）：`StoreLogo.png` 50×50、`Square44x44Logo.png` 44×44、`Square150x150Logo.png` 150×150、`Wide310x150Logo.png` 310×150。存在とIHDR寸法を点検。商用品質の見た目や画像形式の詳細までは自動保証しない。
- `game-v16.js` と `journey-v16.js` が完成パッケージの収録リストに入るよう変更。
- Electron起動時の `jp.handoverroom.prototype` という古いWindows識別子を削除し、MSIXの正式マニフェストの識別を優先。

ビルド終了コード0だけを信用せず、`scripts/verify-msix.ps1` が実際のMSIX内の `AppxManifest.xml` からIdentity.Name、Publisher、Version、x64を読み取りPartner Center値と比較する。また `.msixupload` のZIP内部にパッケージがあること、生成結果が前回の古いファイルでないことを確認する。

実行後は `dist-msix` 内の `.msix`、`.msixupload`、`MSIX_BUILD_AUDIT.json` を確認する。**ただしビルドをこのチャットから実行・署名・Partner Centerへ提出したわけではない。**

## 3. Windows PCで実際にMSIXを生成する手順

PowerShellで**独立したv0.16の作業フォルダ**を開く。既存アプリは上書きしない。正式ロゴを配置し、Partner Centerの値で以下を設定：

```powershell
$env:STORE_IDENTITY_NAME = "PartnerCenterで確認した正式Name"
$env:STORE_PUBLISHER = "Partner Centerの正式Publisher DN"
$env:STORE_PUBLISHER_DISPLAY_NAME = "正式な発行者表示名"
$env:STORE_PACKAGE_VERSION = "1.0.0.0"
$env:STORE_IDENTITY_CONFIRMED = "YES"

npm install
npm run audit:msix
npm run build:msix
npm run verify:msix:win
```

**注意：** コード中の説明文字列をそのまま値にしても作成できるという意味ではない。正式Identityとの一致・表示名・有効な証明書要件を必ず確認する。依存関係のインストールは開発PCの作業フォルダだけで実施。ゲーム通常版の実行にネット接続は不要。

### 提出とローカルMSIXの違い

- Microsoft Store経由のMSIXパッケージは、審査通過後にStore側が署名する。Store提出のために有料のコード署名証明書を購入する必要は通常ない。
- Store外でローカルMSIXをインストールしてテストする場合は、開発者モード・署名・証明書の信頼設定などが必要なことがある。**未署名のMSIXがそのまま通常のユーザーPCでインストールできるとは主張しない**。
- WACK（Windows App Certification Kit）、実機起動・更新・削除・ショートカット・セーブの維持は別途合格が必要。

参考：
- Microsoft: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements
- Microsoft: https://learn.microsoft.com/en-us/windows/msix/package/sign-msix-package-guide
- electron-builder: https://www.electron.build/docs/msix/

## 4. 残る変更と最終リリース基準

| 優先 | 項目 | 現在 |
|---|---|---|
| 最重要 | 正式な製品名予約・Identity/PFN/Publisherの取得 | 未提示・未照合 |
| 最重要 | 商用ロゴPNG4種＋高DPIアイコン＋必要ならWindows ICO | 未配置（GitHubのbuild/appxを確認できない） |
| 最重要 | Windows PCで実際のMSIXをビルド・内部Identityを検証 | 未実施 |
| 最重要 | MSI/NSIS/ZIPの提出ではなく、MSIXまたはStore用MSIXUPLOADの提出物を検査 | 未生成 |
| 高 | Windows App Certification Kit、実機の署名・更新・削除・自動保存 | 未実施 |
| 高 | 390px幅、125/150% DPI、キーボード、手がかり→選択肢の戻り | v16コード追加、実画面QA未実施 |
| 高 | GitHub Actionsランナー未割当問題 | 未解決。前工程と同様にCIステップ開始前に停止する可能性 |
| 高 | 第三者の6ルート周回試遊・文章の自然さ・価格に対するボリューム | 未実施 |
| 提出前 | Store商品説明・スクリーンショット・年齢レーティング・サポート/プライバシー情報・市場/価格設定 | 未完了 |
| 提出前 | ゲーム専用の有料販売ライセンスおよび著作権・アセット権利確認 | 未完了 |

**品質判定：HOLD。** ユーザー向けの操作は単純にするが、販売条件や安全性チェックは省略しない。

**既存作品の保護：** この作業は `game-new` の新規 `feature/handover-v16-clear-ui-msix-readiness` ブランチのみ。STRATEGY MARKET、日本版・米国版ほかの既存作品、game-new main/旧開発ブランチは変更しない。
