/**
 * @fileoverview イベントハンドラ群
 * @see https://developers.google.com/apps-script/guides/triggers/
 */

/**
 * ファイルを開いたときのイベントハンドラ
 * @callback
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  var menu = ui.createMenu('拡張');
  menu.addItem('Backlogから課題情報を読み込み', 'load');
  menu.addItem('行、列のサイズをリセット', 'resize');
  menu.addSeparator();
  menu.addItem('シートの内容を全てクリア', 'reset');
  menu.addToUi();
}
