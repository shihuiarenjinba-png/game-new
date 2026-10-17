# STRATEGY MARKETを除く既存作品の販売候補監査 — 2026-10-17

**監査のみ。別作品のリポジトリ／既存main／既存販売成果物を変更しない。**
**評価の意味：GitHubのmainの存在・README・代表ファイル名からの一次判定。商用品質の動作保証、売上予測、権利監査ではない。**

## 既存資産の実態

GitHubにはアクセス可能な77リポジトリが確認されたが、77本の完成品を意味しない。今回実際にmainのファイル構成・READMEを調べた主なリポジトリ：

| 商品またはシリーズ | 現行コードの所在 | 観察した事実 | 販売前の判定 |
| --- | --- | --- | --- |
| Document Version Audit | `ai-context-builder` | `document_version_audit.py`、`app.py`、tests。PDF/DOCX/XLSX比較・差分監査のREADMEあり。Partner Centerには先行登録済みと共有済み | **有料最優先／販売HOLD** |
| Spreadsheet Merge & Integrity | `csv-excel-reconciliation-tool` | `reconciliation.py`、`integrity_audit.py`、統合GUI、tests。元数式の変更検出、請求書照合拡張 | **有料最優先／販売HOLD** |
| Excel Formula Integrity Auditor | `safe-folder-workflow` | `excel_formula_auditor.py`、GUI/Windows検証・testsあり。AI Structured Output Reviewも同repo内拡張 | **有料優先／販売HOLD** |
| Web Evidence Archiver | `web-evidence-archiver` | `archiver.py`、`app.py`、tests。URL/HTML/PDF/PNG/SHA256監査。Partner Centerに登録済みと共有済み | **有料優先／販売HOLD** |
| Scheduled API Exporter | `scheduled-api-exporter` | `exporter.py`、tests。許可HTTPS GET、制限付き定期取得、JSONL監査。Partner Centerに登録済みと共有済み | **有料優先／販売HOLD** |
| Data Contract & Schema Drift Auditor | `csv-import-validator` | `contract_auditor.py`、validator、GUI、tests。NULL・列構造・データ型の時間変化比較 | **有料優先／Lite無料候補も検討** |
| Invoice-to-Order Audit | `csv-excel-reconciliation-tool`内拡張 | `invoice_matcher_extension.py`／GUI。専用 `LocalInvoiceMatcher` repoはREADMEのみ | **Pro機能候補／独立の完成品と数えない** |
| AI Structured Output Review | `safe-folder-workflow`内拡張 | `ai_output_audit_extension.py`／GUI。専用 `AIOutputAuditor` repoはREADMEのみ | **Pro機能候補／独立の完成品と数えない** |
| PDF Privacy Toolkit | `-PDF-Privacy-Toolkit` | 現コードはAcroForm一括記入モジュール・GUI・tests中心。READMEが目標に掲げる安全なPDF sanitizerの完成は未立証 | **機密削除を売りにする販売はHOLD** |
| Folder Privacy Auditor / Storage Cause Analyzer | `-Folder-Privacy-Auditor` | 現コードに容量調査GUI/CLI、tests、QA手順。プライバシー自動検知本体の完成は未立証 | **容量解析はLite候補／プライバシーProはHOLD** |
| AI Upload Guard、Local Document Extractor、Excel/CSV Privacy Cleaner、Secure Share Packager | 同名の先頭ハイフンrepo | 今回確認したmainはREADMEのみ | **実装確認なし。製品として数えない** |
| NightOfficeAuditor、FactoryInspectionSimulator、UsedItemShopSimulator、SmallBusinessSimulator、finance-simulation | 同名repo | mainのルート一覧取得で空リポジトリの応答 | **販売候補の企画名段階／未実装** |
| `game`、`game-stadium` | 同名repo | 今回確認したmainはREADMEのみ。過去の別ブランチやローカル完成作品の存在は否定できない | **別ブランチ／実機成果物の調査待ち** |
| Document Version Audit for Mac、PDF Privacy Toolkit for Mac | それぞれ `-for-mac` repo | mainはREADMEのみ | **Mac移植は市場調査→商業性判定→独立新規ローカルrepo→開発の順。着手済み完成とは数えない** |
| 引継ぎ室 | `game-new` | 6大筋×72設定、推理・保存・単一画面の試作コードとMSIXゲートあり | **有料ゲーム候補／作品体験とMSIXのHOLD** |

※過去の販売棚卸しには計20製品について、READY_PENDING_OWNER 3件、AUTHORIZED_ENV待ち8件、GOOGLE_ACCEPTANCE待ち4件、OTHER HOLD 5件という監査結果があった。この区分は今回のGitHubコード存在確認や実際の販売READY判定と同一ではない。

## 販売に向けた優先順位と仮説価格

過去の方針に従いWindows Microsoft Storeの**一括買い切り**を中心にする。価格は日本円の初期テスト仮説であり、市場調査・手数料・税金・プレイ/作業節約時間の検証を経て決定する。

| ランク | 作品 | 仮説価格 | 商用差別化 | 最重要追加改良 |
| --- | --- | --- | --- | --- |
| A1 | Document Version Audit | **980円**（先行合意の初期価格） | Word/Excel/PDFの変更・数式差分と監査報告の同一UI | 一画面GUI、PDF段組精度、重大変更フィルタ、MSIX、実機・悪意あるファイル |
| A2 | Spreadsheet Merge & Integrity | **2,480～3,980円** | 多キー照合＋元Excelの数式保護＋差分監査レポート | 実行前プレビュー、列対応GUI、50MB超・式/書式保持・大量セルストレステスト |
| A3 | Excel Formula Integrity Auditor | **1,980～3,480円** | 数式の直打ち化・異常パターン・外部リンク・AI出力検算をローカルで監査 | 誤検知率、循環参照候補、重要セル指定、エビデンス付きHTML出力 |
| A4 | Web Evidence Archiver | **1,980～3,980円** | URL・取得時点・HTML/画像/PDF・SHA256をまとめた監査証跡 | Chromium同梱容量、JSページの再現性、差分プレビュー、リダイレクト例外 |
| A5 | Scheduled API Exporter | **1,980～3,980円** | 制限付きAPI取得・ジョブ監査・再試行・二重実行防止 | Windowsタスクスケジューラの導入/解除、資格情報保護、GUI設定、ネット断処理 |
| B1 | Schema Drift Auditor | **1,980～3,480円** | CSV/Excel契約違反・分布変化・入力差分の追跡 | Contract保存・再利用、欠測/文字化け/大容量と誤検知の実データ試験 |
| B2 | Invoice-to-Order Audit | **既存Spreadsheet商品のPro機能** | 金額差/重複/未照合の例外一覧 | 分割請求・返品・税区分、PDF非対応明示。別製品として二重販売は保留 |
| B3 | AI Structured Output Review | **既存Excel Integrity商品のPro機能** | AI生成CSV/XLSXの入力原本との数値・構造照合 | 照合対象列の明確化、精度試験、漏れた列はPASSにしない |
| B4 | PDF Privacy Toolkit | **安全性を再確認できた後に2,980～5,980円程度を再検討** | 真のredaction+再抽出検証 | 削除実装・隠しコンテンツ試験・第三者セキュリティレビューが必須 |
| C | 引継ぎ室 | **価格未定** | 大伏線回収と異なる報告結果を持つ小型心理ミステリー | 6ルート人手試遊・共通文章比率・周回時間・独立した大量ユーザー評価 |

**無料公開候補は1～2本に制限：**
- `CSV Import Validator Lite`：単一CSVの必須列、重複キー、列数、文字コードの基礎チェックのみ。Schema Driftや契約履歴などのPro機能は有料。
- `Storage Cause Analyzer Lite`：単発の容量ランキング（読み取り専用）のみ。差分比較・履歴・監査レポートの高度機能は有料。ただし既存 `-Folder-Privacy-Auditor` の別作成物を上書きしない。

## 競争環境と解釈

無料のWinMergeはファイル比較・マージができ、競合のBeyond Compare 5はStandard $35、Pro $70の買い切り。よってDocument Version Auditは単なるdiffの安売りではなく、**文書・計算式・責任追跡の監査報告を一回の操作で完了すること**が差別化条件。既存競合の価格だけで自作製品の販売数は推定しない。

- https://winmerge.io/index.html
- https://www.scootersoftware.com/shop/pricing
- https://www.araxis.com/merge/buy.ja

## 全製品に共通するStore販売前の改善（重要）

1. **配布物はWindows MSIXを正本**にし、Storeの製品Identity/PFN/Publisherと一致させる。Python GUIはPyInstallerで得た実行物をMSIXへ正しく梱包する別パイプラインが必要。EXEやZIPがあるだけでは完了ではない。
2. **作品ごとに独立したStore登録とMSIX Identity**が必要。既存の3作品のIdentityを別作品へ流用しない。
3. Windows 11 x64の実機GUI（100/125/150% DPI、キー操作、画面の崩れ）、UIの一貫性、データ保存の復元、アンインストール残留の検査。
4. コードのハードコードされたテストパス、認証情報、秘密鍵、個人情報、クラッシュ時のログ露出を確認。
5. 入力非上書き、CSV formula injection、シンボリックリンク、巨大ファイル・壊れたOffice/PDF、既存ファイル衝突と冪等性を検査。
6. 外部ライブラリ/フォント/画像と商標の利用権利確認、製品ごとのEULA・プライバシー表記、Storeメタデータ、価格、年齢等級、スクリーンショット。
7. 競合の無料版と機能比較し、「有料にしかない解決時間・再現性・監査証跡」を説明できるまで公開しない。
8. 当面は**既存作品を直接編集・上書きしない**。商用品質のアップグレードは読取監査→商業性判定→作品ごとの独立作業コピー／ブランチを作成してから実施。
9. Mac版は既存の商用成立条件を満たした場合に限って、独立した新規**ローカル**リポジトリで検討。Windows Store作業と混在させない。

## 結論

1. **販売価値は複数存在する**が、現状では保護・QA・MSIX・UI・ストア提出と、製品毎の再点検が必要。
2. まずDocument Version Audit（980円の既存計画）、次にSpreadsheet Merge & Integrity・Excel Formula Integrity Auditor・Web Evidence Archiver／Scheduled API Exporterを有料販売の柱として並べる。
3. 無料公開するならLite 1～2本だけ。高価値の契約監査・差分根拠・監査履歴・自動化機能を丸ごと無料化しない。
4. STRATEGY MARKET関連は本監査・編集の対象外。研究用Portfolio Auditを直ちに商売用の投資助言アプリとして売らない。

**未実施事項：** 全77リポジトリの全ブランチ・全テスト・ローカルWindows成果物を網羅した検査ではない。書類・コードの一次監査であり、販売READY判定ではない。
