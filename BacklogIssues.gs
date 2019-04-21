/**
 * BacklogのIssueを取得するクラス
 */
function BacklogIssues(params) {
  // configシートの管理
  var config = new Config({
    sheet : params.sheets.config,
  }).load();

  // 実行時間管理
  this.settings = config.settings;
  this.startProcess();
  this.isTimeout();

  // シート表示制御クラス
  this.view = new BacklogIssuesView({
    attributes : config.attributes,
    sheet : params.sheets.issues,
    colors : config.colors,
    comments : config.comments,
    view : config.view,
    issues : config.issues,
  });

  // シート情報を保持
  this.sheets = params.sheets;

  // コンフィグをそのまま保持
  this.config = {
    comments : config.comments,
    issues : config.issues
  }

  // statusシートの管理
  this.status = new Status({
    sheet : params.sheets.status,
  });

  // Backlog APIクラス生成
  this.backlogs = this.createBacklog(config.spaces);

  // トリガー操作クラス
  this.trigger = new TriggerUtil();

  // サイドバー表示クラス
  this.sidebar = null;
}

/**
 * 曜日変換
 * @protected
 */
BacklogIssues.prototype.getWeekday = function(str) {
  var matrix = {
    "月曜日" : ScriptApp.WeekDay.MONDAY,
    "火曜日" : ScriptApp.WeekDay.TUESDAY,
    "水曜日" : ScriptApp.WeekDay.WEDNESDAY,
    "木曜日" : ScriptApp.WeekDay.THURSDAY,
    "金曜日" : ScriptApp.WeekDay.FRIDAY,
    "土曜日" : ScriptApp.WeekDay.SATURDAY,
    "日曜日" : ScriptApp.WeekDay.SUNDAY,
  };

  return matrix[str];
};

/**
 * 処理時間計測Start用
 * @protected
 */
BacklogIssues.prototype.startProcess = function() {
  this.dateStart = new Date();
};

/**
 * 処理時間計測チェック
 * @protected
 */
BacklogIssues.prototype.time = function() {
  var dateNow = new Date();
  // ミリ秒
  var diff = (dateNow.getTime() - this.dateStart.getTime()) / 1000;
  Logger.log("実行時間:" + diff);

  return diff;
};

/**
 * 処理時間計測チェック
 * @protected
 */
BacklogIssues.prototype.isTimeout = function() {
  var diff = this.time();
  if (diff > this.settings.secTimeout) {
    // 制限時間超過
    return true;
  }

  // 制限時間超えていない
  return false;
};

/**
 * スペース情報から、Backlog APIインスタンス生成
 * @protected
 */
BacklogIssues.prototype.createBacklog = function(spaces) {
  var backlog;
  var backlogs = [];

  spaces.forEach(function(space) {
    backlog = new Backlog({
      host : space.host,
      apiKey : space.apiKey,
    });
    backlogs.push(backlog);
  });

  return backlogs;
};

/**
 * プロジェクトkey連想配列を生成
 * Statusクラスにそのまま渡せるように
 * @protected
 */
BacklogIssues.prototype.makeProjectKeys = function(projects) {
  var projectKeys = {};

  projects.forEach(function(project) {
    projectKeys[project.projectKey] = true;
  });

  return projectKeys;
};

/**
 * 進捗表示：開始
 * @protected
 */
BacklogIssues.prototype.tellBegin = function() {
  this.sidebar.log("begin.");
  this.sidebar.log("各スペースのプロジェクト情報を読み込み中です。");
};

/**
 * 進捗表示：スペース情報
 * @protected
 */
BacklogIssues.prototype.tellSpaces = function() {
  this.sidebar.log("対象スペース：" + this.backlogs.length + "件");
  this.sidebar.log("未処理のスペース：" + this.status.getCountSpace(false) + "件");
};

/**
 * 進捗表示：スペーススキップ
 * @protected
 */
BacklogIssues.prototype.tellSpaceSkip = function(name) {
  this.sidebar.log("スペース " + name + " は処理済みのため Skip します.");  
};

/**
 * 進捗表示：スペース状況
 * @protected
 */
BacklogIssues.prototype.tellSpace = function(current, name, host) {
  this.sidebar.log("(" + current + "/" + this.backlogs.length + ") スペース " + name + " を処理中...");
};

/**
 * 進捗表示：プロジェクト情報
 * @protected
 */
BacklogIssues.prototype.tellProjects = function(host, length) {
  this.sidebar.log("プロジェクト数：" + length + "件");
  this.sidebar.log("未処理のプロジェクト：" + this.status.getCountProject(host, false) + "件");
};

/**
 * 進捗表示：プロジェクトスキップ
 * @protected
 */
BacklogIssues.prototype.tellProjectSkip = function(name) {
  this.sidebar.log("プロジェクト " + name + " は処理済みのため Skip します.");
};

/**
 * 進捗表示：プロジェクト状況
 * @protected
 */
BacklogIssues.prototype.tellProject = function(current, length, name) {
  this.sidebar.log("(" + current + "/" + length + ") プロジェクト " + name + " を処理中...");
};

/**
 * 進捗表示：上限超過
 * @protected
 */
BacklogIssues.prototype.tellTimeout = function() {
  this.sidebar.log("設定されたタイムアウト時間" + this.settings.secTimeout + "秒を超えたので読み込みを停止します。");  
};

/**
 * 進捗表示：終了
 * @protected
 */
BacklogIssues.prototype.tellEnd = function() {
  this.sidebar.log("実行時間：" + this.time() + "秒");
  this.sidebar.log("end.");
};

/**
 * 進捗表示：終了
 * @protected
 */
BacklogIssues.prototype.tellExit = function(message) {
  if (this.sidebar == null) {
    return;
  }
  this.sidebar.log(message);
  this.tellEnd();
};

/**
 * 進捗表示：エラー終了
 * @protected
 */
BacklogIssues.prototype.tellError = function() {
  if (this.sidebar == null) {
    return;
  }
  this.sidebar.log("エラーが発生しました。");
  this.tellEnd();
};

/**
 * 課題の検索条件を返却
 * 完了が直近、非完了が全て、に近いことを想定して、2パターンに分けて取得するための条件を返却
 * @protected
 */
BacklogIssues.prototype.getupdateDates = function() {
  var updateDates = [];

  var active = this.config.issues.dayHideActive;
  var completed = this.config.issues.dayHideCompleted;
  
  var day = dayLast = null;
  var ids = idsLast = [1, 2, 3]; // 完了以外
  var idsComp = [4]; // 完了

  // 過去X日 -> 日時変換関数
  var toDate = function(day) {
    if (day == null) {
      return day;
    }
    var d = new Date();
    d = new DateEx(d.getTime() - (day * 24 * 60 * 60 * 1000));
    return d.getDateStr('-');
  };

  // 非完了タスクはデフォルト全読み込み、指定日が有る場合に指定する
  if (active === Number(active)) {
    day = active;
  }

  // 完了タスクはデフォルト読み込み無し、指定日が有る場合に取得される
  if (completed === Number(completed)) {
    // 完了タスクも対象にする
    ids = ids.concat(idsComp);

    if (active === Number(active)) {
      // 非完了日付が古ければ、1回目：完了の指定日まで。2回目：非完了の指定日まで。
      if (active > completed) {
        day = completed;
        dayLast = active;
      }
      // 完了日付が古ければ、1回目：非完了の指定日まで。2回目：完了の指定日まで。
      else if (completed > active) {
        dayLast = completed;
        idsLast = idsComp;
      }
      // 同日なら、1回：完了／非完了両方。
    }
    // 非完了の指定日がなければ、1回目：完了の指定日まで。2回目：完了で指定日無し
    else {
      day = completed;
      dayLast = null;
    }
  }

  // 前半
  updateDates.push({updatedSince : toDate(day), updatedUntil : null, statusId : ids});
  // 2つに分かれる場合は後半の条件を設定（完了指定があり、完了／非完了の指定日が同日ではない場合）
  if (active != completed && (day == completed || dayLast == completed)) {
    updateDates.push({updatedSince : toDate(dayLast), updatedUntil : toDate(day + 1), statusId : idsLast});
  }
  return updateDates;
};

/**
 * 課題表示の実行
 * @protected
 */
BacklogIssues.prototype.printIssues = function(backlog, issues) {
  var issue, comments;
  var categoryUrls = {};   // idが大きくなるのでオブジェクトで
  var milestoneUrls = {};  // idが大きくなるのでオブジェクトで

  // プロジェクト毎に課題一覧を取得
  var offset;
  var count = 100; // 最大値で指定
  var updateDates = this.getupdateDates();
  var sort = backlog.getSortKey(this.config.issues.sort);  // 項目名から検索用キーに変換

  // 完了／非完了の日付を考慮して分けて取得する
  for (var cnt in updateDates) {
    dates =  updateDates[cnt];
    offset = 0;

    do {
      issues = backlog.getIssues({
        // projectIDは事前に設定
        order : this.config.issues.order,
        sort : sort,
        offset : offset,
        count : count,
        statusId : dates.statusId,
        updatedSince : dates.updatedSince,
        updatedUntil : dates.updatedUntil,
      });
      offset += count;

      for (var i in issues) {
        issue = issues[i];

        // 課題毎のURLを生成
        url = backlog.buildUrlIssue(issue.issueKey);

        // カテゴリURLの生成
        issue.category.forEach(function(category) {
          categoryUrls[category.id] = backlog.buildUrlCetegory(category.id);
        });

        // マイルストーンURLの生成
        issue.milestone.forEach(function(milestone) {
          milestoneUrls[milestone.id] = backlog.buildUrlVersion(milestone.id);
        });

        // コメントはBacklogから取得
        comments = backlog.getIssueComments(issue.issueKey, {
          count : Math.min(this.config.comments.maxRequest, 100),
          order : 'desc',
        });

        // 課題を表示
        this.view.printIssue(issue, url, comments, categoryUrls, milestoneUrls);
      }
      
      // 取得数と同じ（=残りがある可能性がある）場合に、再読み込み
    } while (issues.length == count);
  }
};

/**
 * プロジェクト表示の実行
 * @protected
 */
BacklogIssues.prototype.printProjects = function(backlog) {
  var project, issues;
  var host = backlog.getHost();

  // プロジェクト一覧
  projects = backlog.getProjects({
    archived : this.settings.archived, // 全て or 非アーカイブ
  });

  // サイドバー表示
  this.tellProjects(host, projects.length);

  for (var i in projects) {
    project = projects[i];
    
    // 読み込み済みかどうかをチェック
    if (this.status.isMarkedPrject(host, project.projectKey)) {
      // サイドバー表示
      this.tellProjectSkip(project.name);
      continue;
    }

    // サイドバー表示
    this.tellProject(Number(i) + 1, projects.length, project.name);
    
    // マイルストーンのURLを生成するため、等
    backlog.setProject(project);
    url = backlog.buildUrlProject();
    
    // プロジェクト情報の描画
    this.view.setProject(project, url);
    this.view.printProject();
    
    // 課題の表示処理
    this.printIssues(backlog, issues);

    this.view.finishProject();

    // プロジェクトの完了をマーク
    this.status.mark(host, project.projectKey);
    
    // 制限時間超過チェック
    if (this.isTimeout() ) {
      // 超えていたらループ抜ける
      return false;
    }
  }

  return true;
};

/**
 * スペース表示の実行
 * @protected
 */
BacklogIssues.prototype.printSpaces = function() {
  var backlog, space, host, url;
  var ret;

  // スペースごとに処理
  for (var i in this.backlogs) {
    backlog = this.backlogs[i];
    host = backlog.getHost();
    space = backlog.getSpace();

    // 処理済み判定   
    if (this.status.isMarkedSpace(host)) {
      // サイドバー表示
      this.tellSpaceSkip(space.name);
      continue;
    }

    // サイドバー表示
    this.tellSpace(Number(i) + 1, space.name);

    // スペース情報の描画
    url = backlog.buildUrlSpace();
    this.view.setSpace(space, url);
    this.view.printSpace();

    // プロジェクト表示の実行
    ret = this.printProjects(backlog);
    
    // 制限時間超過チェック
    if (!ret) {
      // 超えていたらループ抜ける
      this.tellTimeout();
      return false;
    }
  }

  return true;
};

/**
 * 課題取得の実行
 * main.gs からコールされる
 */
BacklogIssues.prototype.load = function(param) {
  var self = this;

  // 進捗表示サイドバー
  this.sidebar = new SidebarProgress({
    isBackground: param.isBackground,
  });
  this.tellBegin();

  // スペース／プロジェクト行の表示有無
  this.view.setPrintProjectRow(param.isPrintProjectRow);
  // テキストの折り返し
  this.view.setWrap(param.isWrap);

  // スペース毎のプロジェクト情報を読み込み
  this.backlogs.forEach(function(backlog) {
    // プロジェクト一覧を取得
    projects = backlog.getProjects({
      archived : self.settings.archived, // 全て or 非アーカイブ
    });

    // 状態管理クラスに設定
    self.status.setProjects(
      backlog.getHost(),
      self.makeProjectKeys(projects)
    );
  });

  // クラス状態と状態管理シートを同期
  this.status.sync();

  // 設定したプロジェクト情報の一致を確認
  if (param.isBackground !== true) {
    if (! this.status.equalProject()) {
      var text = Browser.msgBox("スペース／プロジェクト情報が更新されています。リセットしますか？", Browser.Buttons.OK_CANCEL);
      if (text == "ok") {
        // リセット処理
        this.reset();
      }
      throw new Exit('スペース／プロジェクト情報が更新されているので、終了します。');
    }
  }

  // サイドバー表示
  this.tellSpaces();
  
  // ヘッダーは、複数読み込み時の初回のみ描画
  if (this.status.isFirst()) {
    this.view.printHeader();
  }

  // スペース表示の実行
  this.printSpaces();

  // 最後に調整
  this.view.finalize();

  // サイドバー表示
  this.tellEnd();
};

/**
 * 高さ、幅の調整
 * main.gs からコールされる
 */
BacklogIssues.prototype.resize = function() {
  this.view.resize();
};

/**
 * 行の高さを調節するため、折り返しを設定
 * main.gs からコールされる
 */
BacklogIssues.prototype.setWraps = function(isWrap) {
  this.view.setWraps(isWrap);
};

/**
 * 行の最大サイズを設定
 * main.gs からコールされる
 * ※未使用
 */
BacklogIssues.prototype.setMaxRowSize = function(size) {
  this.view.resizeRows(size);
};

/**
 * 全リセット
 * 関連シートを全てクリアする
 * main.gs からコールされる
 */
BacklogIssues.prototype.reset = function(isConfirm) {
  if (isConfirm === true) {
    var text = Browser.msgBox("シートの情報をクリアしますか？", Browser.Buttons.OK_CANCEL);
    if (text != "ok") {
      // リセット処理
      return;
    }
  }

  this.view.reset();
  this.status.reset();

  // リサイズもしてしまう
  this.view.resize();
};

/**
 * 自動読み込み設定
 * main.gs からコールされる
 */
BacklogIssues.prototype.setAutoLoad = function(isAuto) {
  this.trigger.deleteAll("onAutoLoad");
  this.trigger.deleteAll("onAutoLoadNext");

  // 有効化
  if (isAuto) {
    // コンフィグから指定時間を取得
    var autoRead = this.settings.autoLoad;
    // セル内は日付型
    var d = new DateEx(autoRead);
    var hour = d.getHours();
    var minute = d.getMinutes();

    // トリガーを設定
    this.trigger.setEveryTime("onAutoLoad", hour, minute);
  }
  // 無効化
};

/**
 * 自動読み込み
 * main.gs からコールされる
 */
BacklogIssues.prototype.autoLoad = function(params) {
  // 初回のみ初期化
  if (params.isFirst) {
    // 確認無しで初期化
    this.reset(false);
  }

  // 確認無しで読み込み
  params.isBackground = true;
  this.load(params);

  // 全て読み込み済み？
  if (! this.status.isComplete()) {
    // トリガーを設定
    this.trigger.setAfter("onAutoLoadNext", 1 * 1000); // 1s
  }
};

/**
 * 自動バックアップ設定
 * main.gs からコールされる
 */
BacklogIssues.prototype.setAutoBackup = function(isBackup) {
  this.trigger.deleteAll("onAutoBackup");

  // 有効化
  if (isBackup) {
    // コンフィグから指定時間を取得
    var strWeekday = this.settings.autoBackup;
    var weekday = this.getWeekday(strWeekday);

    // トリガーを設定
    this.trigger.setEveryWeek("onAutoBackup", weekday, 0, 0);
  }
  // 無効化

};

/**
 * 自動バックアップ
 * main.gs からコールされる
 */
BacklogIssues.prototype.backup = function() {
  // シート名を持っているクラスで処理
  this.view.backup(Object.keys(this.sheets).length);
};