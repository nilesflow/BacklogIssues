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

  // 進捗表示サイドバー
  this.sidebar = new SidebarProgress();
}

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
  this.sidebar.log(message);
  this.tellEnd();
};

/**
 * 進捗表示：エラー終了
 * @protected
 */
BacklogIssues.prototype.tellError = function() {
  this.sidebar.log("エラーが発生しました。");
  this.tellEnd();
};

/**
 * 進捗表示：エラー終了
 * @protected
 */
BacklogIssues.prototype.getUpdatedSince = function() {
  var issues = this.config.issues;
  var max = Math.max(issues.dayHideCompleted, issues.dayHideActive);

  var d = new Date();
  d = new DateEx(d.getTime() - (max * 24 * 60 * 60 * 1000));
  
  return d.getDateStr('-');
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
  var offset = 0;
  var count = 100; // 最大値で指定
  var updatedSince = this.getUpdatedSince();

  do {
    issues = backlog.getIssues({
      // projectIDは事前に設定
      order : 'asc',
      // statusId : [1, 2, 3], // 完了も含める
      offset : offset,
      count : count,
      updatedSince : updatedSince
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
};

/**
 * プロジェクト表示の実行
 * @protected
 */
BacklogIssues.prototype.printProjects = function(backlog) {
  var project, issues;
  var host = backlog.getHost();

  // プロジェクト一覧
  projects = backlog.getProjects();

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
    this.view.setProject(project);
    this.view.printProject(url);
    
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
    this.view.setSpace(space);
    url = backlog.buildUrlSpace();
    this.view.printSpace(url);

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
 */
BacklogIssues.prototype.load = function() {
  var self = this;

  // サイドバー表示
  this.tellBegin();

  // スペース毎のプロジェクト情報を読み込み
  this.backlogs.forEach(function(backlog) {
    // プロジェクト一覧を取得
    projects = backlog.getProjects();    

    // 状態管理クラスに設定
    self.status.setProjects(
      backlog.getHost(),
      self.makeProjectKeys(projects)
    );
  });

  // クラス状態と状態管理シートを同期
  this.status.sync();

  // 設定したプロジェクト情報の一致を確認
  if (! this.status.equalProject()) {
    var text = Browser.msgBox("スペース／プロジェクト情報が更新されています。リセットしますか？", Browser.Buttons.OK_CANCEL);
    if (text == "ok") {
      // リセット処理
      this.reset();
    }
    throw new Exit('スペース／プロジェクト情報が更新されているので、終了します。');
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
 */
BacklogIssues.prototype.resize = function() {
  this.view.resize();
};

/**
 * 全リセット
 * 関連シートを全てクリアする
 */
BacklogIssues.prototype.reset = function() {
  var text = Browser.msgBox("シートの情報をクリアしますか？", Browser.Buttons.OK_CANCEL);
  if (text != "ok") {
    // リセット処理
    return;
  }

  this.view.reset();
  this.status.reset();

  this.sidebar.reset();
  this.sidebar.log("シートの内容と読み込み状態をクリアしました。");
};