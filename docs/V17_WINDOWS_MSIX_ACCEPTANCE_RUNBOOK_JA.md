# v0.17 Windows実機・MSIX受入手順（未実施）

**この手順はPC所有者またはコード担当がWindows 11上で実施します。ChatGPT側から実機のインストール・署名・Microsoft Store提出をした記録はありません。**

## 0. 正式Identityを確認

Partner Centerの**引継ぎ室専用製品**が存在することを確認し、当該製品のProduct Identityに表示される次の値を控える。

- `Identity Name`：`STORE_IDENTITY_NAME`
- `Publisher`：`STORE_PUBLISHER`（必ず全体一致。例文のCN=...は使用しない）
- `Publisher Display Name`：`STORE_PUBLISHER_DISPLAY_NAME`
- `Package Family Name` とStore IDは監査記録へ保存し、他アプリの値を使わない。

正式値が分からなければ**ここでSTOP**。仮のIdentityを本番として書き換えない。

## 1. ブランドとソースの確認

`feature/handover-v17-brand-store-audit` のZIPを既存作品から離れた新しい作業フォルダへ展開し、最新ファイルが含まれていることを確認する。

```powershell
node --version
npm --version
npm run make:logos
npm test
npm run audit:story-volume
npm run audit:store-release
```

Node.jsは22.12.0以上を使用。ロゴは青黒色・アンティーク金の「開いた扉／記録紙」案。正式なブランド判断・商標確認は所有者が行う。既存のロゴファイルが存在すればスクリプトは上書きしない。別の正式ロゴを採用する場合は4サイズを同じ設計で生成してから検査。

`qa-local-output/V17_RELEASE_AUDIT.json` は、静的・Node検証が成功しても商用状態をHOLDと書く。

## 2. Windows向けMSIXのゲート

所有者がブランドを確認した場合のみ、以下の**正式値**をWindows PowerShellの当該セッションへ設定する。実際の値をGitへ直接コミットしない。

```powershell
$env:STORE_IDENTITY_NAME = "正式なPackage Identity Name"
$env:STORE_PUBLISHER = "正式なPublisherのDN"
$env:STORE_PUBLISHER_DISPLAY_NAME = "正式なPublisher Display Name"
$env:STORE_PACKAGE_VERSION = "1.0.0.0"
$env:STORE_IDENTITY_CONFIRMED = "YES"
$env:STORE_BRAND_APPROVED = "YES"
npm install
npm run audit:msix
```

`npm run audit:msix`が警告を出す場合は止める。**仮のIdentityやロゴ承認の設定を捏造して通過させない。**

## 3. パッケージを生成し、内部マニフェストを照合

```powershell
npm run build:msix
npm run verify:msix:win
```

成果物として`dist-msix/`にMSIX、Store用MSIXUPLOAD、`MSIX_BUILD_AUDIT.json`が新規生成されたことを確認。必須確認は**内部AppxManifest.xmlのIdentity.Name、Publisher、Version、ProcessorArchitecture=x64とMSIXUPLOAD内のパッケージの一致**。古い生成物、ゼロバイト、不整合は不合格。

**注意：** `electron-builder` v27のMSIX機能はbeta。Nodeバージョン、SDK、ログ、Manifest、実インストールをすべて確認。ZIP、EXE、NSISインストーラーが存在してもStore用成果物完成とは扱わない。

## 4. Windows端末でのテスト

- ゲーム起動：`index.html`で開くブラウザ版とMSIX/Electron版を別々に確認。
- WACK（Windows App Certification Kit）：Windows SDKの適切な版と対象パッケージで実行し、全項目PASSの証拠ログを保存。
- インストール：MSIXが署名され、信頼された適切なテスト環境で`Add-AppxPackage`等を利用。**未署名のMSIXを通常端末でそのままインストールできると決めつけない。**
- 実操作：Tab/Enter/Shift+Tab/Space、マウス、画面幅390/768/1366、DPI 100/125/150%、スクロール、閉じた証拠の開閉、仮説の見直し。
- 保存：中断→再起動→同じ事件へ戻る、JSON書き出し・読み込み、壊れたJSON拒否、旧v13の途中記録から復帰。
- ストレス：6ルート×各2周以上の手動試遊。正しい証拠と弱い証拠で異なる結果になるか、人物描写と出来事が矛盾しないか。
- 更新：1.0.0.0のテストパッケージから別ビルドへ更新し、セーブが保持されること（同じIdentity/Publisher、増分Version）。
- 削除：意図したWindowsアプリだけをアンインストールし、ファイルや保存方針を確認。既存アプリの削除、証明書ストアの無制限変更は禁止。

## 5. 商品登録へ進む判定

- 正式なIdentity/Publisher照合が完了
- ブランド／画像の所有権と文字の可読性が確認済み
- バージョンが正しいMSIX・MSIXUPLOADが実際に生成された
- Windows実機、WACK、インストール・起動・更新・削除が成功
- 全自動回帰・ユーザー試遊・6ルートの自然さ評価が成功
- 価格、ストア画像、説明文、サポートとプライバシーURLが確認済み

これらを満たすまでは**Storeに提出しない／正式公開しない。**

## QA報告に必要なもの

`qa-local-output`以下の結果、`dist-msix/MSIX_BUILD_AUDIT.json`、ビルドログ、WACKレポート、実機での起動・保存・更新・削除ログ、匿名化した画面画像。ユーザー識別子や個人パスは公開前に削除。

Microsoft公式：
- https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements
- https://learn.microsoft.com/en-us/windows/apps/publish/faq/get-started-with-the-microsoft-store
- https://learn.microsoft.com/en-us/windows/msix/package/sign-msix-package-guide

electron-builder：
- https://www.electron.build/docs/msix/

**他作品・研究用DBの変更禁止：** STRATEGY MARKET全系統、20製品の他リポジトリ、main、旧ブランチ、販売提出済みアプリ／MSIXは変更しない。
