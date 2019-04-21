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
  new Properties().setPrintSpaceProject("true");
  loadMenu();
}

/**
 * スペース／プロジェクト行を表示しない
 */
function unsetPrintSpaceProject() {
  new Properties().setPrintSpaceProject("false");
  loadMenu();
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
  new Properties().setWrap(true);
  loadMenu();

  run('setWraps');
}

/**
 * 行の高さを最小に
 */
function unsetWraps() {
  new Properties().setWrap(false);
  loadMenu();

  run('unsetWraps');
}

/**
 * リセット
 */
function reset() {
  run('reset');
}

/**
 * Aboutの表示
 */
function about() {
  var output = HtmlService.createHtmlOutputFromFile('About');
  SpreadsheetApp.getUi().showModalDialog(output, "このスプレッドシートについて");
}

/**
 * メニューを設定
 */
function loadMenu() {
  var ui = SpreadsheetApp.getUi();
  var props = new Properties();

  // 開発中はライブラリではなく、自身の関数を読み込むため
  var prefix = (props.getOwner() === true) ? "" : "BacklogIssuesLibrary.";

  var subMenu = ui.createMenu("スペース／プロジェクト行の表示...");
  if (props.getPrintSpaceProject()) {
    subMenu.addItem("✔　表示する", prefix + "setPrintSpaceProject")
    subMenu.addItem("　　表示しない", prefix + "unsetPrintSpaceProject")
  }
  else {
    subMenu.addItem("　　表示する", prefix + "setPrintSpaceProject")
    subMenu.addItem("✔　表示しない", prefix + "unsetPrintSpaceProject")
  }

  var subMenu2 = ui.createMenu("「状況」列の高さを調整...");
  if (props.getWrap()) {
    subMenu2.addItem("✔　テキストを折り返す", prefix + "setWraps")
    subMenu2.addItem("　　テキストを折り返さない", prefix + "unsetWraps")
  }
  else {
    subMenu2.addItem("　　テキストを折り返す", prefix + "setWraps")
    subMenu2.addItem("✔　テキストを折り返さない", prefix + "unsetWraps")
  }

  ui.createMenu('Backlog')
  .addItem('Backlogから課題情報を読み込み', prefix + 'load')
  .addSeparator()
  .addSubMenu(subMenu)
  .addSeparator()
  .addItem('行、列のサイズをリセット', prefix + 'resize')
  .addSubMenu(subMenu2)
  .addItem('シートの内容を全てクリア', prefix + 'reset')
  .addSeparator()
  .addItem('このスプレッドシートについて..', prefix + 'about')
  .addToUi()
}
