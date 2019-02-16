# BacklogIssues

本ソースは Google App Scripts の ライブラリとして存在している。  
対応するスプレッドシートから本ライブラリの main.gs の各関数をコールしている。  

## スプレッドシートの使い方
- 下記のスプレッドシートをコピー  
https://docs.google.com/spreadsheets/d/1qa8MxYjjgXQ-aV1UEHGKFI77a6rF581RlBSknV7xFQ4/edit#gid=1194134501

- 「config」シートに backlog の host, APIキー を入力  
※APIキーは、backlogの「個人設定」「API」「新しいAPIキーを発行」から「登録」で作成

- 必要に応じて、「config」シートの各値を修正

- スプレッドシートの「Backlog」メニューができるので、  
「Backlogから課題情報を読み込み」

## アプリケーションの更新
スプレッドシートコピー後のバージョンアップの方法は、 

### スプレッドシートの更新
下記のファイルの更新は手動で変更する必要がある  
main.js  
trigger.js  

### ライブラリの更新
上記以外のライブラリ側の更新は、ライブラリのバージョン指定で更新。

- スクリプトエディタを開く  
  スプレッドシートの「ツール」「スクリプトエディタ」

- ライブラリを開く  
  スクリプトエディタの「リソース」「ライブラリ」

- ライブラリを更新   
   「BacklogIssuesLibrary」の「バージョン」を変更
