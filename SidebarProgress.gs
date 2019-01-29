/**
 * サイドバーで進捗表示
 * @see https://developers.google.com/apps-script/reference/html/html-service
 * @see https://developers.google.com/apps-script/reference/html/html-output
 * @see https://developers.google.com/apps-script/reference/base/ui
 */
function SidebarProgress() {
  this.ui = SpreadsheetApp.getUi();

  this.template = HtmlService.createTemplateFromFile('Progress');
  this.initOutput();
}

/**
 * 初期状態表示
 * @protected
 */
SidebarProgress.prototype.initOutput = function() {
  this.output = this.template.evaluate();
  this.output.setTitle("進捗表示");
};

/**
 * ログ出力（画面の再表示）
 */
SidebarProgress.prototype.log = function(message) {
  var d = new DateEx();
  this.output.append('<div class="text">' + d.getTimeStr() + ' ' + message + '</div>');
  this.ui.showSidebar(this.output);  
};

/**
 * クリア処理
 */
SidebarProgress.prototype.reset = function() {
  this.initOutput();
};
