/**
 * @fileoverview エントリポイント関数群
 * trigger.gs のメニューに割当てられる関数
 */

var param = {
  // シート名称
  sheets: {
    config : 'config',
    issues : 'issues',
    status : 'status',
  }
};

/**
 * エラー処理共通関数
 * @protected
 */
function run(action) {
  try {
    var app = new BacklogIssues(param);
    var props = new Properties();

    switch (action) {
      case 'load':
        app.load({
          isPrintProjectRow : props.getPrintSpaceProject(),
          isWrap: props.getWrap(),
        });
        break;

      case 'resize':
        app.resize();
        break;

      case 'setWraps':
        app.setWraps(true);
        break;

      case 'unsetWraps':
        app.setWraps(false);
        break;

      case 'reset':
        app.reset();
        break;

      default:
        break;
    }
  }
  // エラー表示して終了
  catch (e if e instanceof Exit) {
    if (app !== undefined) {
      app.tellExit(e.message);
    }
  }
  catch (e) {
    if (app !== undefined) {
      app.tellError();
    }
    Logger.log(e.message);
    Logger.log(e.stack);
    throw Error(e.message + " " + e.stack.split(/\n/)[0]); // 想定外エラーは通知してしまう
  }
}

/**
 * 読み込み実行
 */
function load() {
  run('load');
}

/**
 * スペース／プロジェクト行を表示
 */
function setPrintSpaceProject() {
  var props = new Properties();
  props.setPrintSpaceProject("true");
  setMenu();
}

/**
 * スペース／プロジェクト行を表示しない
 */
function unsetPrintSpaceProject() {
  var props = new Properties();
  props.setPrintSpaceProject("false");
  setMenu();
}


/**
 * サイズリセット
 */
function resize() {
  run('resize');
}

/**
 * 行の高さを最小に
 */
function setWraps() {
  var props = new Properties();
  props.setWrap(true);

  setMenu();
  run('setWraps');
}

/**
 * 行の高さを最小に
 */
function unsetWraps() {
  var props = new Properties();
  props.setWrap(false);

  setMenu();
  run('unsetWraps');
}

/**
 * リセット
 */
function reset() {
  run('reset');
}

/**
 * メニューを設定
 */
function setMenu() {
  var ui = SpreadsheetApp.getUi();
  var props = new Properties();

  var subMenu = ui.createMenu("スペース／プロジェクト行の表示...");
  if (props.getPrintSpaceProject()) {
    subMenu.addItem("✔　表示する", "setPrintSpaceProject")
    subMenu.addItem("　　表示しない", "unsetPrintSpaceProject")
  }
  else {
    subMenu.addItem("　　表示する", "setPrintSpaceProject")
    subMenu.addItem("✔　表示しない", "unsetPrintSpaceProject")
  }

  var subMenu2 = ui.createMenu("「状況」列の高さを調整...");
  if (props.getWrap()) {
    subMenu2.addItem("✔　テキストを折り返す", "setWraps")
    subMenu2.addItem("　　テキストを折り返さない", "unsetWraps")
  }
  else {
    subMenu2.addItem("　　テキストを折り返す", "setWraps")
    subMenu2.addItem("✔　テキストを折り返さない", "unsetWraps")
  }

  ui.createMenu('Backlog')
  .addItem('Backlogから課題情報を読み込み', 'load')
  .addSeparator()
  .addSubMenu(subMenu)
  .addSeparator()
  .addItem('行、列のサイズをリセット', 'resize')
  .addSubMenu(subMenu2)
  .addItem('シートの内容を全てクリア', 'reset')
  .addToUi()
}
