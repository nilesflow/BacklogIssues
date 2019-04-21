/**
 * @fileoverview イベントハンドラ群
 * @see https://developers.google.com/apps-script/guides/triggers/
 */

/**
 * ファイルを開いたときのイベントハンドラ
 * @callback
 */
function onOpen() {
  new Properties().setOwner(true); // 自分自身の呼び出しを指定
  loadMenu();
}
