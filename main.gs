/**
 * @fileoverview エントリポイント関数群
 * trigger.gs のメニューに割当てられる関数
 */

var params = {
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
    var app = new BacklogIssues(params);
    var props = new Properties();

    switch (action) {
      case 'load':
        app.load({
          isPrintProjectRow : props.getPrintSpaceProject(),
          isWrap: props.getWrap(),
          isBackground: false,
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

      case 'setAutoLoad':
        app.setAutoLoad(true);
        break;

      case 'unsetAutoLoad':
        app.setAutoLoad(false);
        break;

      case 'autoLoad':
        app.autoLoad({
          isPrintProjectRow : props.getPrintSpaceProject(),
          isWrap: props.getWrap(),
          isFirst: true,
        });
        break;

      case 'autoLoadNext':
        app.autoLoad({
          isPrintProjectRow : props.getPrintSpaceProject(),
          isWrap: props.getWrap(),
          isFirst: false,
        });
        break;

      case 'setAutoBackup':
        app.setAutoBackup(true);
        break;

      case 'unsetAutoBackup':
        app.setAutoBackup(false);
        break;

      case 'backup':
        app.backup();
        break;

      case 'reset':
        app.reset(true);
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
 * 自動読み込み設定ON
 */
function setAutoLoad() {
  new Properties().setAutoLoad(true);
  loadMenu();

  run('setAutoLoad');
}

/**
 * 自動読み込み設定OFF
 */
function unsetAutoLoad() {
  new Properties().setAutoLoad(false);
  loadMenu();

  run('unsetAutoLoad');
}

/**
 * 自動読み込み
 */
function autoLoad() {
  run('autoLoad');
}

/**
 * 自動読み込み（残り）
 */
function autoLoadNext() {
  run('autoLoadNext');
}

/**
 * 自動バックアップON
 */
function setAutoBackup() {
  new Properties().setAutoBackup(true);
  loadMenu();

  run('setAutoBackup');
}

/**
 * 自動バックアップOFF
 */
function unsetAutoBackup() {
  new Properties().setAutoBackup(false);
  loadMenu();

  run('unsetAutoBackup');
}

/**
 * 自動バックアップ
 */
function backup() {
  run('backup');
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
 * 各シート実体のイベントハンドラからのエントリポイント
 * 呼び出し元：onOpen()
 */
function loadMenu() {
  var ui = SpreadsheetApp.getUi();
  var props = new Properties();

  // 開発中はライブラリではなく、自身の関数を読み込むため
  var prefix = (props.getOwner() === true) ? "" : "BacklogIssuesLibrary.";

  var subStyle = ui.createMenu("スペース／プロジェクト行の表示...");
  if (props.getPrintSpaceProject()) {
    subStyle.addItem("✔　表示する", prefix + "setPrintSpaceProject")
    subStyle.addItem("　　表示しない", prefix + "unsetPrintSpaceProject")
  }
  else {
    subStyle.addItem("　　表示する", prefix + "setPrintSpaceProject")
    subStyle.addItem("✔　表示しない", prefix + "unsetPrintSpaceProject")
  }

  var subHeight = ui.createMenu("「状況」列の高さを調整...");
  if (props.getWrap()) {
    subHeight.addItem("✔　テキストを折り返す", prefix + "setWraps")
    subHeight.addItem("　　テキストを折り返さない", prefix + "unsetWraps")
  }
  else {
    subHeight.addItem("　　テキストを折り返す", prefix + "setWraps")
    subHeight.addItem("✔　テキストを折り返さない", prefix + "unsetWraps")
  }

  var subMenuAuto = ui.createMenu("自動読み込み...");
  if (props.getAutoLoad()) {
    subMenuAuto.addItem("✔　有効にする", prefix + "setAutoLoad")
    subMenuAuto.addItem("　　無効にする", prefix + "unsetAutoLoad")
  }
  else {
    subMenuAuto.addItem("　　有効にする", prefix + "setAutoLoad")
    subMenuAuto.addItem("✔　無効にする", prefix + "unsetAutoLoad")
  }

  var subBackup = ui.createMenu("自動バックアップ...");
  if (props.getAutoBackup()) {
    subBackup.addItem("✔　有効にする", prefix + "setAutoBackup")
    subBackup.addItem("　　無効にする", prefix + "unsetAutoBackup")
  }
  else {
    subBackup.addItem("　　有効にする", prefix + "setAutoBackup")
    subBackup.addItem("✔　無効にする", prefix + "unsetAutoBackup")
  }

  ui.createMenu('Backlog')
  .addItem('Backlogから課題情報を読み込み', prefix + 'load')
  .addSeparator()
  .addSubMenu(subStyle)
  .addSeparator()
  .addItem('行、列のサイズをリセット', prefix + 'resize')
  .addSubMenu(subHeight)
  .addItem('シートの内容を全てクリア', prefix + 'reset')
  .addItem('シートをバックアップ', prefix + 'backup')
  .addSeparator()
  .addSubMenu(subMenuAuto)
  .addSubMenu(subBackup)
  .addSeparator()
  .addItem('このスプレッドシートについて..', prefix + 'about')
  .addToUi()

  // プロジェクトで利用するトリガーの設定
  var trigger = new TriggerUtil();
  if (! trigger.isSet('onEditSheet')) {
    trigger.setOnEdit('onEditSheet');
  }
}

/**
 * onEditイベントを処理
 * ・configシートの変更を処理
 * 各シート実体のイベントハンドラからのエントリポイント
 * 呼び出し元：トリガー
 */
function editSheet(e) {
  var props = new Properties();

  // 開発中はライブラリではなく、自身の関数を読み込むため
  var prefix = (props.getOwner() === true) ? "" : "BacklogIssuesLibrary.";

  // configファイルの場合
  if (e.range.getSheet().getName() == params.sheets.config) {
    // 自動読み込みONの場合は、時刻を再設定
    if (props.getAutoLoad()) {
      run('setAutoLoad');
    }
    // 自動バックアップONの場合は、時刻を再設定
    if (props.getAutoBackup()) {
      run('setAutoBackup');
    }
  }
}
