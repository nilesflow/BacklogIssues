/**
 * @fileoverview イベントハンドラ群
 * @see https://developers.google.com/apps-script/guides/triggers/
 */

/**
 * Simple Triggers
 * @see https://developers.google.com/apps-script/guides/triggers/
 */

/**
 * ファイルを開いたときのイベントハンドラ
 * @callback
 * @see https://developers.google.com/apps-script/guides/triggers/#onopene
 */
function onOpen() {
  new Properties().setOwner(true); // 自分自身の呼び出しを指定
  loadMenu();
}

/**
 * Installable Triggers
 * @see https://developers.google.com/apps-script/guides/triggers/installable
 */
/**
 * Spraedsheet Based
 * @see https://developers.google.com/apps-script/reference/script/spreadsheet-trigger-builder
 */
/**
 * ファイルを開いたときのイベントハンドラ
 * @callback
 * @param {Event} e The onEdit event.
 */
function onEditSheet(e) {
  editSheet(e);
}

/**
 * Time Based
 * @see https://developers.google.com/apps-script/reference/script/clock-trigger-builder
 */
/**
 * 自動読み込み
 * @callback
 */
function onAutoLoad() {
  autoLoad(true);
}

/**
 * 自動読み込み処理実体
 * @callback
 */
function onAutoLoadNext() {
  autoLoadNext();
}

/**
 * 自動バックアップ
 * @callback
 */
function onAutoBackup() {
  backup();
}
