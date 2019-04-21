/**
 * 状態管理クラス
 * どのプロジェクトまで読み込んだかの管理
 */
function Status(param) {
  this.COLUMNS = {
    HOST : 0,
    PROJECT : 1,
    STATUS : 2,
  };

  this.lenColumn = Object.keys(this.COLUMNS).length;
  this.sheet = SpreadsheetApp.getActive().getSheetByName(param.sheet);
  
  // 起点
  this.index = this.sheet.getRange(1, 1);

  // 初期化
  this.statuses = [];
  this.projects = {};
}

/**
 * シート未設定なら、プロジェクトの情報でシートを初期化
 * @protected
 */
Status.prototype.initialize = function() {
  if (this.projects.length == 0) {
    throw new Error('プロジェクト情報が設定されていません');
  }

  var projects;
  var statuses = [];

  // 値があるかどうかをチェック
  var rowLast = this.sheet.getDataRange().getLastRow();
  var range = this.index.offset(0, 0, rowLast, 2)
  if (range.isBlank()) {
    // 無ければ初期化
    for (var host in this.projects) {
      projects = this.projects[host];
      for (var projectKey in projects) {
        statuses.push([host, projectKey]);
      }
    }
    this.index.offset(0, 0, statuses.length, (this.lenColumn - 1)).setValues(statuses);
  }
};

/**
 * スペース配列に状態を読み込み
 * @protected
 */
Status.prototype.load = function() {
  // シートの内容を読み込み
  var rowLast = this.sheet.getDataRange().getLastRow();
  this.statuses = this.index.offset(0, 0, rowLast, this.lenColumn).getValues();
};

/**
 * 該当プロジェクトのfind関数
 * @protected
 * @return コールバックの戻り値をそのまま返却
 */
Status.prototype.findStatus = function(host, projectKey) {
  var status;

  for (var i in this.statuses) {
    status = this.statuses[i];

    if (status[this.COLUMNS.PROJECT] == projectKey) {
      if (status[this.COLUMNS.HOST] == host) {
        return status;
      }
    }
  };

  return undefined;
};

/**
 * 状態配列を key -> status の連想配列形式を取得
 * @protected
 */
Status.prototype.getHashStatus = function() {
  var self = this;
  var statuses = {};

  this.statuses.forEach(function(status) {
    // 全て1なら読み込み済み判定
    statuses[status[self.COLUMNS.HOST]] = status[self.COLUMNS.STATUS];    
  });
  return statuses;
};

/**
 * 指定状態のスペースを返却
 * @protected
 */
Status.prototype.getSpaces = function(isMarked) {
  var spaces = [];

  // 状態配列を連想配列にしたものを取得
  var statuses = this.getHashStatus();

  // スペースを検索
  for (var host in statuses) {
    // 処理済み
    if (isMarked && statuses[host] == 1) {
      spaces.push(host);
    }
    else if (statuses[host] != 1) {
      spaces.push(host);
    }
  }
  
  return spaces;
};


/**
 * 指定スペース／状態のプロジェクトを返却
 * @protected
 */
Status.prototype.getProjects = function(host, isMarked) {
  var status;
  var projects = [];

  for (var i in this.statuses) {
    status = this.statuses[i];

    if (status[this.COLUMNS.HOST] == host) {
      // 処理済み
      if (isMarked && status[this.COLUMNS.STATUS] == 1) {
        projects.push(status[this.COLUMNS.PROJECT]);
      }
      // 未処理
      else if (status[this.COLUMNS.STATUS] != 1) {
        projects.push(status[this.COLUMNS.PROJECT]);
      }
    }
  }

  return projects;
};

/**
 * プロジェクトkey情報を保持
 */
Status.prototype.setProjects = function(host, keys) {
  this.projects[host] = keys;
};

/**
 * 状態配列にシートから状態を読み込んで同期
 * @note setProjects が呼ばれていること
 */
Status.prototype.sync = function() {
  // なければ初期化
  this.initialize();

  // シート読み込み
  this.load();
};

/**
 * シート状態とconfig状態のプロジェクト一致確認
 * @note setProjects が呼ばれていること
 */
Status.prototype.equalProject = function() {
  var host, project, status;

  // シートだけにあるか、configに存在しないならエラー
  for (var i in this.statuses) {
    status = this.statuses[i];

    host = status[this.COLUMNS.HOST];
    project = status[this.COLUMNS.PROJECT];
    if (this.projects[host][project] === undefined) {
      return false;
    }
  }

  return true;
};

/**
 * 対象スペースが処理済みかどうかを判定
 */
Status.prototype.isMarkedSpace = function(host) {
  // 状態配列を連想配列にしたものを取得
  var statuses = this.getHashStatus();

  // 未処理のスペース
  if (statuses[host] != 1) {
    // 無ければ未処理
    return false;
  }

  // 処理済み
  return true;
};

/**
 * 対象プロジェクトが処理済みかどうかを判定
 */
Status.prototype.isMarkedPrject = function(host, projectKey) {
  // 該当プロジェクトを検索
  var status = this.findStatus(host, projectKey);
  if (status != undefined) {
    // 状態を判定
    if (status[this.COLUMNS.STATUS] == 1) {
      // 処理済み
      return true;
    }
  }
};

/**
 * 指定状態のスペース件数を返却
 */
Status.prototype.getCountSpace = function(isMarked) {
  var spaces = this.getSpaces(isMarked);
  return spaces.length;
};

/**
 * 指定スペース／状態のプロジェクト件数を返却
 */
Status.prototype.getCountProject = function(host, isMarked) {
  var projects = this.getProjects(host, isMarked);
  return projects.length;
};

/**
 * 全て読み込み済みかどうか
 * @return 0 全て未処理
 * @return 1 読み込み中
 * @return 2 全て読み込み済み
 * @return -1 それ以外（データが無い等）
 */
Status.prototype.getStatus = function() {
  var isSet = false;
  var isUnset = false;
  var result = -1;

  for (var i in this.statuses) {
    if (this.statuses[i][this.COLUMNS.STATUS] == 1) {
      isSet = true;
    }
    else {
      isUnset = true;
    }
  };

  if (isSet && isUnset) {
    result = 1;
  }
  else if (isSet) {
    result = 2;
  }
  else if (isUnset) {
    result = 0;
  }

  return result;
};

/**
 * 初回の読み込みかどうか
 * = 全て未読み込みかどうかを判定
 */
Status.prototype.isFirst = function() {
  for (var i in this.statuses) {
    if (this.statuses[i][this.COLUMNS.STATUS] == 1) {
      return false;
    }
  };

  return true;
};

/**
 * 全て読み込み済みかどうか
 */
Status.prototype.isComplete = function() {
  for (var i in this.statuses) {
    if (this.statuses[i][this.COLUMNS.STATUS] == 0) {
      return false;
    }
  };

  return true;
};

/**
 * プロジェクトに処理完了済みを設定
 */
Status.prototype.mark = function(host, projectKey) {
  // 該当プロジェクトを検索
  var status = this.findStatus(host, projectKey);
  if (status != undefined) {
    // 状態を変更して、シートに同期
    status[this.COLUMNS.STATUS] = 1;
    this.index.offset(0, 0, this.statuses.length, this.lenColumn).setValues(this.statuses);
  }
};

/**
 * 初期化。シートをまっさらにする。
 */
Status.prototype.reset = function() {
  // 一旦、シートをクリアにする
  this.sheet.clear();
  this.statuses = [];
};
