# 引継ぎ室 v0.17 — ロゴ候補・MSIX正式化前ゲート・他作品の販売監査

**判定：Release HOLD。データ消去・Store提出・既存作品上書きは実施していない。**

## 今回の成果

1. `scripts/make-brand-assets.cjs`：開いた扉と記録の抽象ロゴをMSIX必須4サイズ（50/44/150/310）でオフライン生成。既存PNGは自動上書きしない。`npm run make:logos`で候補PNGを作る。
2. `STORE_BRAND_APPROVED=YES`が無ければ商用MSIXビルドを止める。PNGがあることと、正式商用ロゴとして承認済みであることを区別。
3. Node下限を**22.12.0**に更新。v27 betaのMSIXターゲットと整合。
4. `tests/brand-release-v17.test.cjs`：4種類のPNGの正しいヘッダ・CRC32・画像寸法・展開データ・再現性・上書き防止を検査。
5. `scripts/store-release-audit.cjs`：既存全Node回帰・6ルート文章量・UI構造・ブランドPNG・MSIXゲート・Store未完了項目を監査し、`qa-local-output/V17_RELEASE_AUDIT.json`に結果を書く。`npm run audit:store-release`で実行。
6. `docs/V17_STORE_LISTING_DRAFT_JA.md`：有料Store商品のタイトル・紹介文・必要スクリーンショット・プライバシー・サポート・年齢等級の下書き。
7. `docs/V17_OTHER_PRODUCTS_SALES_AUDIT_JA.md`：STRATEGY MARKETを除くGitHubの77repo中の代表作品を読み取り監査、有料ソフト候補順位とLite無料候補2つに分類。
8. `docs/V17_WINDOWS_MSIX_ACCEPTANCE_RUNBOOK_JA.md`：正式Identity確認→ブランド承認→Windows実MSIX生成→Manifest/WACK/インストール・更新・削除→商品準備の受入手順。

**いまの正式Store Package Identityは不明です。** Partner Centerに登録済みのDocument Version Audit等のIdentityを、引継ぎ室に流用してはいけません。

## 再現するコマンド

Windows 11 + Node.js 22.12以上で、新ブランチの独立した作業フォルダから：

```powershell
npm run make:logos
npm test
npm run audit:story-volume
npm run audit:store-release
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-windows-local-qa.ps1
```

正式な製品Identityとブランド承認がそろった**あと**に限り、Partner Centerの値を環境変数へ与える：

```powershell
npm run audit:msix
npm run build:msix
npm run verify:msix:win
```

正式値の設定方法と実機検査の詳しい説明は`docs/V17_WINDOWS_MSIX_ACCEPTANCE_RUNBOOK_JA.md`に記載。

## 今回の独立検証で言える範囲

- 新規ストア準備関連JavaScript 5ファイルの構文検査：PASS。
- 新しいUI進捗表示の**72事件設定×初夜仮説3×見直し3×報告方針3＝1,944の完了状態**について、14/14・結末と表示されること：PASS。
- MSIXビルドゲートがブランド承認を要求し、実ロゴを要求すること：PASS（実ビルドではなくゲート単体の評価）。
- indexにアクティブなゲーム本体が1つで、ゲームより前に進行案内が読み込まれること：PASS。
- 過去のv0.14では正しい証拠照合1,944経路／弱い証拠照合1,944経路の検査を実行していた。ただしこの旧結果を**v0.17のNode全回帰PASSとは扱わない**。
- ロゴ候補の配布用ZIPに収録した実PNGの寸法：50×50、44×44、150×150、310×150を確認。GitHubの生成コマンドはWindowsで未実行。
- Actionsのランナー未割当が継続しているため、**v0.17のNode全回帰・Windows Edge GUI・実MSIXのビルドテストは未実施**。検査コマンドを追加しただけでは完了にしない。

## 最終的な大規模エラーチェックの判定

**CODE: PARTIAL／MSIX: BLOCKED／STORE: HOLD／COMMERCIAL: HOLD**

まだ検証が必要：Node全回帰の実行、Windows Edgeの6ルート・倍率・キー操作、旧v13の中間セーブ、MSIXの生成/認証、Store Identity/Publisher/PFN、ログの安全性、WACK、Windows MSIX起動/更新/削除、試遊と価格・著作権・商品ページ。

今回、失敗したテストを消したりスキップしてPASSにしたりしていない。

## 商用上の次の優先度

- 第一段階：引継ぎ室のIdentityと商用ロゴの承認。コードと販売文書準備は進行済み。
- 第二段階：Windows本番MSIX・Store用MSIXUPLOADの実生成と内部のIdentity照合。
- 第三段階：Windows QA、WACK、第三者試遊、実機保存・更新・削除。
- 第四段階：Store商品の最終価格・画像・説明・年齢等級・サポートとプライバシーURLの確認。
- 別系統：Document Version Audit（先行合意980円）等の有料事務系ツールの販売準備を優先。Freeは基本Lite 1～2本のみ。

## 作品保護

STRATEGY MARKETおよび他の既存事務系作品を今回変更していない。編集は`game-new`専用新規ブランチ`feature/handover-v17-brand-store-audit`に限定。ゲームのmainも変更していない。
