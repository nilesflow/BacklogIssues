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

    switch (action) {
      case 'load':
        app.load();
        break;

      case 'resize':
        app.resize();
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
  run('load')
}

/**
 * サイズリセット
 */
function resize() {
  run('resize')
}

/**
 * リセット
 */
function reset() {
  run('reset')
}
