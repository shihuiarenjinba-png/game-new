# 引継ぎ室 v0.12 — 保存の安全性とストーリー量を検証

**開発用・Microsoft Store販売HOLD**

今回は新しい画面や選択を増やさず、販売前の品質確認を進めました。

## 実施した検査

- Windows版Edgeで、現在の事件セーブを実際にJSONとしてダウンロード
- 壊れたファイルの拒否、読込をキャンセルした場合の保護
- 有効なバックアップの読み込み・再起動後の同じ事件への復帰
- 別事件のファイルを読み込んだ場合に、前の証拠が残らないことの確認
- 全6ルートの代表経路の文章量を集計し、共通本文がどの程度存在するかを把握する基礎資料を作成

セーブのWindows Edge操作試験は3設定で成功。6ルートの代表経路では14場面・約2,800〜2,900文字の文章が表示される（**共通文章を含み、実プレイ時間ではない**）。

## ローカルで検査するコマンド

```powershell
npm test
npm run audit:story-volume
npm run test:edge:win
npm run test:edge:accessibility:win
npm run test:edge:save:win
```

Windows Edge試験はWindows＋Node 22以上＋Edgeが必要。通常のゲームプレイは `index.html` をEdge/Chromeで開く方式で、外部AI、通信や外部アカウントは不要です。

## 商用化に必要な次の改善

6本すべての共通構造がまだ大きいため、**次は各ルート固有の中間推理と、誤推理した場合の出来事**を増やすのが最優先。無条件にシナリオ数を増やすのではなく、証拠・人物の知識・時系列を固定したうえで改良します。

正式MSIXインストール、Windowsでの第三者試遊、販売価格・購入意思の調査は未実施。販売判定はHOLDのままです。

詳細：`docs/V12_SAVE_AND_STORY_VOLUME_AUDIT_JA.md`

**他作品保護：** STRATEGY MARKET全系統、game-newのmainと過去のブランチ、ほかの既存作品には変更を加えていません。
