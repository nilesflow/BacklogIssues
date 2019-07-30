/**
 * BacklogのIssue情報をシートに表示するクラス
 */
function BacklogIssuesView(params) {
  // 出力列情報
  this.attrs = this.getHashAttr(params.attributes);
  this.lenAttrs = Object.keys(this.attrs).length;

  this.colors = params.colors;
  this.comments = params.comments;
  this.view = params.view;
  this.issues = params.issues;

  // シート情報
  this.sheet = SpreadsheetApp.getActive().getSheetByName(params.sheet);

  // インデックス情報（無い時は-1）
  this.idxSpace = this.indexOfAttr("スペース");
  this.idxProject = this.indexOfAttr("プロジェクト");
  
  // 最終行に設定
  var rowLast = this.sheet.getDataRange().getLastRow();

  // 1行目はデータが有っても無くても1になる
  if (rowLast > 1) {
    rowLast += 1
  }
  // 順に表示するため
  this.iterator = this.sheet.getRange(rowLast, 1);
}

/**
 * 表示項目情報を連想配列で取得
 * @protected
 */
BacklogIssuesView.prototype.getHashAttr = function(attributes) {
  var hAttrs = {};
  var index = 0;

  attributes.forEach(function(attr) {
     // 表示対象のみ
    if (attr.visible) {
      hAttrs[attr.name] = {
        index: index,
        size: attr.size
      };
      index ++;
    }
  });
  return hAttrs;
};

/**
 * 指定属性のインデックスを取得
 * @protected
 * @return 表示対象外の場合は、-1
 */
BacklogIssuesView.prototype.indexOfAttr = function(name) {
  if (this.attrs[name] === undefined) {
    return -1;
  }

  return this.attrs[name].index;
};

/**
 * ハイパーリンクの生成
 * @protected
 */
BacklogIssuesView.prototype.toHiperlink = function(url, str) {
  return '=HYPERLINK(\"' + url + '\",\"' + str + '\")';
};

/**
 * 年月日に変換
 * @protected
 */
BacklogIssuesView.prototype.toDate = function(date) {
  if (date == null) {
    return "";
  }

  var d = new Date(date);
  var string = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  return string;
};

/**
 * 指定日数が経過しているかどうか
 * @protected
 */
BacklogIssuesView.prototype.isRecentDay = function(date, day) {
  var ret = false;

  if (date == null) {
    return ret;
  }
  // 数値かどうか（正しく計算できるか）を判定、できなければデフォルト表示
  if (day !== Number(day)) {
    return true;
  }

  var d = new Date(date);
  var dRecent = new Date(d.getTime() + day * 24 * 60 * 60 * 1000);
  var dNow = new Date();
  if (dNow < dRecent) {
    ret = true;
  }
  return ret;
};

/**
 * 更新日が最新表示に該当するかどうか
 * @protected
 */
BacklogIssuesView.prototype.isRecent = function(date) {
  return this.isRecentDay(date, this.view.dayRecent);
};

/**
 * （完了を対象に）非表示にする指定期間以内であるかどうか
 * @protected
 */
BacklogIssuesView.prototype.isRecentCompleted = function(date) {
  return this.isRecentDay(date, this.issues.dayHideCompleted);
};

/**
 * （非完了を対象に）更新日が非表示にする指定期間以内であるかどうか
 * @protected
 */
BacklogIssuesView.prototype.isRecentActive = function(date) {
  return this.isRecentDay(date, this.issues.dayHideActive);
};

/**
 * 期限日が指定期日以内かどうか
 * @protected
 */
BacklogIssuesView.prototype.isNearing = function(date) {
  return this.isRecentDay(date, this.view.dayNearing * -1) ? false : true;
};

/**
 * 期限日が過ぎているかどうか
 * @protected
 */
BacklogIssuesView.prototype.isExpired = function(date) {
  return this.isRecentDay(date, 0) ? false : true;
};

/**
 * 複数要素セルへのHYPERLINK設定
 * @protected
 * @note 対象オブジェクト（配列）は、id, name, displayOrderメンバを持っていること
 */
BacklogIssuesView.prototype.applyHiperLink = function(objects, urls) {
  var values = [];
  var value;
  var o;
  var url = null;
  
  // 既にならんでいるが、一応ソート
  objects.sort(function(a, b){
    if(a.displayOrder < b.displayOrder) return -1;
    if(a.displayOrder > b.displayOrder) return 1;
    return 0;
  });

  // 結合用文字列の抽出と、URLの抽出
  for (var i in objects) {
    o = objects[i];

    values.push(o.name);
  
    // urlは複数設定できないので、最初の一つだけ
    if (urls[o.id] && url == null) {
      url = urls[o.id]
    }
  }
  
  // HYPERLINKを設定
  if (url != null) {
    value = this.toHiperlink(url, values.join('\n'));
  }
  else {
    value = values.join('\n');
  }
  return value;
};

/**
 * コメントを指定文字数で切る
 * @protected
 */
BacklogIssuesView.prototype.substrComment = function(content) {
  if (content == null) {
    return "";
  }
  else if (content == "") {
    return content;
  }

  var max = this.comments.maxChar;
  if (!isNaN(max) && 0 < max) {
    // 最大値以上だったら切り詰め
    if (content.length > max) {
      content = content.substr(0, max) + "\n...（省略）";
    }
  }
  return content;
};

/**
 * 変更履歴1オブジェクトを整形
 * @protected
 */
BacklogIssuesView.prototype.makeChangeLog = function(changeLog) {
  var originalValue = (changeLog.originalValue == null) ? '未設定' : changeLog.originalValue;
  var newValue = (changeLog.newValue == null) ? '未設定' : changeLog.newValue;
  return originalValue + "→" + newValue;
}

/**
 * 変更履歴を整形
 * @protected
 */
BacklogIssuesView.prototype.makeChangeLogs = function(changeLogs) {
  var self = this;
  var logs = [];

  changeLogs.forEach(function(log) {
    switch (log.field) {
      case 'component':
        logs.push("[カテゴリー] " + self.makeChangeLog(log));
        break;
      case 'milestone':
        logs.push("[マイルストーン] " + self.makeChangeLog(log));
        break;
      case 'status':
        logs.push("[状態] " + self.makeChangeLog(log));
        break;
      case 'limitDate':
        logs.push("[期限日] " + self.makeChangeLog(log));
        break;
      case 'resolution':
        logs.push("[完了理由] " + self.makeChangeLog(log));
        break;
      case 'attachment':
        // 省略
        break;
      default:
        break;          
    }
  });

  return logs.join("\n");
};

/**
 * コメント情報の生成
 * @protected
 */
BacklogIssuesView.prototype.makeStatus = function(comments) {
  var contents = [];
  var header, changeLog, content;
  var values;
  var comment;
  var recent = false;

  for (var i in comments) {
    comment = comments[i];
    values = [];

    // 変更履歴？
    changeLog = this.makeChangeLogs(comment.changeLog);
    if (changeLog != "") {
      values.push(changeLog);
    }

    // コメントを最大表示文字数で切る
    content = this.substrComment(comment.content);
    if (content != "") {
      values.push(content);
    }

    // どちらも無ければ処理しない
    if (values.length == 0) {
      continue;
    }
    
    // コメント生成
    header = "(" + this.toDate(comment.updated) + " " + comment.createdUser.name + ")";
    values.unshift(header);
    contents.push(values.join("\n"));

    // 最新なら強調表示指定（セル単位でしか色変更できない）
    if (this.isRecent(comment.updated)) {
      recent = true;
    }

    // 最大表示コメント数判定
    if (contents.length >= this.comments.maxDisplay) {
      break;
    }
  }

  var status = contents.join("\n");
  return {status : status, recent: recent};
};

/**
 * スペース、プロジェクト行を表示するかどうか
 */
BacklogIssuesView.prototype.setPrintProjectRow = function(isPrint) {
  this.isPrintProjectRow = isPrint;
};

/**
 * 「状況」列の折り返しをするかどうか
 */
BacklogIssuesView.prototype.setWrap = function(isWrap) {
  this.isWrap = isWrap;
};

/**
 * ヘッダーの出力
 */
BacklogIssuesView.prototype.printHeader = function() {
  // 描画済みなら描画しない
  var range = this.sheet.getRange(1, 1);
  if (! range.isBlank()) {
    return;
  }

  var contents = [
    Object.keys(this.attrs)
  ];
  this.iterator.offset(0, 0, contents.length, contents[0].length)
  .setValues(contents)
  .setBackground(this.colors.header);
  this.iterator = this.iterator.offset(1, 0);
};

/**
 * スペース情報の設定
 */
BacklogIssuesView.prototype.setSpace = function(space, url) {
  this.space = space;
  this.urlSpace = url;
};

/**
 * スペース情報の出力
 */
BacklogIssuesView.prototype.printSpace = function() {
  // 行を表示するモードでなければ表示しない
  if (! this.isPrintProjectRow) {
    return;
  }

  // カラムが表示対象でなければ行も出力しない
  if (this.idxSpace == -1) {
    return;
  }

  this.iterator.offset(0, 0, 1, this.lenAttrs).setBackground(this.colors.space);
  this.iterator.offset(0, this.idxSpace).setValue(this.toHiperlink(this.urlSpace, this.space.name));
  this.iterator = this.iterator.offset(1, 0);
};

/**
 * プロジェクト情報の設定
 */
BacklogIssuesView.prototype.setProject = function(project, url) {
  this.project = project;
  this.urlProject = url;
};

/**
 * プロジェクト情報の出力
 */
BacklogIssuesView.prototype.printProject = function() {
  // 行を表示するモードでなければ表示しない
  if (! this.isPrintProjectRow) {
    return;
  }

  // カラムが表示対象でなければ行も出力しない
  if (this.idxProject == -1) {
    return;
  }

  // アーカイブ済みかどうかで背景色を変更
  var color = (this.project.archived) ? this.colors.completed : this.colors.project;
  this.iterator.offset(0, 0, 1, this.lenAttrs).setBackground(color);

  // スペース関連設定
  if (this.idxSpace != -1) {
    this.iterator.offset(0, this.idxSpace)
    .setFontColor(this.colors.project).setValue(this.space.name);
  }
  this.iterator.offset(0, this.idxProject).setValue(this.toHiperlink(this.urlProject, this.project.name));
  this.iterator = this.iterator.offset(1, 0);
};

/**
 * プロジェクト表示の終了処理
 */
BacklogIssuesView.prototype.finishProject = function(url) {
  SpreadsheetApp.flush();
};


/**
 * 課題情報の出力
 */
BacklogIssuesView.prototype.printIssue = function(issue, url, comments, categoryUrls, milestoneUrls) {
  // 表示列を抽出
  var rows = [];
  var columns = [];
  var idxStatus = -1;
  var idxUpdated = -1;
  var idxDueDate = -1;
  var color;
  var recentCreated = false;
  var recentUpdated = false;
  var recentCompleted = false;
  var recentActive = false;
  var recentCommented = false;
  var nearing = false;
  var expired = false;
  var completed = false;

  for (var name in this.attrs) {
    var attr = this.attrs[name];

    switch (name) {
      case "スペース":
        if (this.isPrintProjectRow) {
          columns[attr.index] = this.space.name;
        }
        else {
          columns[attr.index] = this.toHiperlink(this.urlSpace, this.space.name);;
        }
        break;
      case "プロジェクト":
        if (this.isPrintProjectRow) {
          columns[attr.index] = this.project.name;
        }
        else {
          columns[attr.index] = this.toHiperlink(this.urlProject, this.project.name);;
        }
        break;
      case "種別":
        columns[attr.index] = issue.issueType.name;
        break;
      case "キー":
        columns[attr.index] = this.toHiperlink(url, issue.issueKey);
        break;
      case "件名":
        columns[attr.index] = issue.summary;
        break;
      case "担当者":
        if (issue.assignee == null) {
          columns[attr.index] = "";
        }
        else {
          columns[attr.index] = issue.assignee.name;
        }
        break;
      case "状態":
        columns[attr.index] = issue.status.name;
        if (issue.status.id == 4) { // 完了
          completed = true;
        }
        break;
      case "完了理由":
        if (issue.resolution == null) {
          columns[attr.index] = "";
        }
        else {
          columns[attr.index] = issue.resolution.name;
        }
        break;
      case "優先度":
        columns[attr.index] = issue.priority.name;
        break;
      case "カテゴリー":
        // HYPERLINKの設定
        columns[attr.index] = this.applyHiperLink(issue.category, categoryUrls);
        break;
      case "マイルストーン":
        // HYPERLINKの設定
        columns[attr.index] = this.applyHiperLink(issue.milestone, milestoneUrls);
        break;
      case "登録日":
        recentCreated = this.isRecent(issue.created);
        columns[attr.index] = this.toDate(issue.created);
        break;
      case "期限日":
        columns[attr.index] = this.toDate(issue.dueDate);
        idxDueDate = attr.index;
        if (issue.dueDate != null) {
          nearing = this.isNearing(issue.dueDate);
          expired = this.isExpired(issue.dueDate);
        }
        break;
      case "更新日":
        recentUpdated = this.isRecent(issue.updated);
        recentCompleted = this.isRecentCompleted(issue.updated);
        recentActive = this.isRecentActive(issue.updated);
        columns[attr.index] = this.toDate(issue.updated);
        idxUpdated = attr.index;
        break;
      case "登録者":
        columns[attr.index] = issue.createdUser.name;
        break;
      case "状況":
        statuses = this.makeStatus(comments);
        recentCommented = statuses.recent;
        columns[attr.index] = statuses.status;
        idxStatus = attr.index;
        break;
      default:
        break;
    }
  }

  // 表示しない条件を判定
  if (completed) {
    // 完了で指定日以前
    if (!recentCompleted) {
      return;
    }
  }
  else {
    // 非完了で指定日以前
    if (!recentActive) {
      return;
    }
  }

  // setValues向けに行を設定
  rows.push(columns);

  // 上寄せ指定
  this.iterator.offset(0, 0, rows.length, columns.length)
  .setVerticalAlignment('top')
  // 折り返し
  .setWrap(true)
  // 表示形式のリセット（であるはず）
  .setNumberFormat("@")
  ;

  // 折り返しで行の高さを調節
  if (this.isWrap !== true) {
    this.iterator.offset(0, idxStatus, rows.length, 1).setWrap(false);
  }

  // 背景、完了を考慮
  var bgBase = 'white';
  var bgDueDate = null;
  var bgProject;
  if (completed) {
    bgBase = this.colors.completed;
    bgProject = bgBase;
  }
  else {
    if (expired) {
      bgDueDate = this.colors.expired;
    }
    else if (nearing) {
      bgDueDate = this.colors.nearing;
    }
    // アーカイブプロジェクトの表現
    bgProject = (this.project.archived) ? this.colors.completed : bgBase;
  }
  this.iterator.offset(0, 0, rows.length, columns.length).setBackground(bgBase);
  // 強調表示
  if (bgDueDate != null) {
    this.iterator.offset(0, idxDueDate, rows.length, 1).setBackground(bgDueDate);
  }

  // 文字色

  // 最新は強調表示
  if (recentCreated) {
    this.iterator.offset(0, 0, rows.length, columns.length).setFontColor(this.colors.recent);
  }
  if (recentUpdated) {
    this.iterator.offset(0, idxUpdated, rows.length, 1).setFontColor(this.colors.recent);
  }
  if (recentCommented) {
    this.iterator.offset(0, idxStatus, rows.length, 1).setFontColor(this.colors.recent);
  }
  // スペース／プロジェクトは異なる制御
  if (this.isPrintProjectRow) {
    // 文字列の折り返しが対象外の列
    // フィルタ用文字は背景色と同じ
    if (this.idxSpace >= 0) {
      this.iterator.offset(0, this.idxSpace, rows.length, 1)
      .setWrap(false).setFontColor(bgBase);
    }
    if (this.idxProject >= 0) {
      this.iterator.offset(0, this.idxProject, rows.length, 1)
      .setWrap(false).setFontColor(bgBase);
    }
  }
  else {
    // アーカイブの表現
    if (this.idxProject >= 0) {
      this.iterator.offset(0, this.idxProject, rows.length, 1)
      .setWrap(false).setBackground(bgProject);
    }
  }

  // 最後に値を表示
  this.iterator.offset(0, 0, rows.length, columns.length).setValues(rows);

  this.iterator = this.iterator.offset(1, 0);
};

/**
 * シートの高さ、幅をconfigの設定値でリサイズする
 */
BacklogIssuesView.prototype.resize = function() {
  // 列
  // 不足列を追加
  var maxColumns = this.sheet.getMaxColumns(); // 現シートの最大を取得
  var numColumns = this.lenAttrs - maxColumns;
  if (numColumns > 0) {
    this.sheet.insertColumnsAfter(maxColumns, numColumns);
  }

  for (var name in this.attrs) {
    attr = this.attrs[name];
    this.sheet.setColumnWidth((1 + attr.index), attr.size);
  }
  // 日本語が小さくリサイズされる
  // this.sheet.autoResizeColumns(1, this.attrs.length - 1);

  // 行
  this.sheet.autoResizeRows(1, this.sheet.getDataRange().getLastRow());
};

/**
 * 行の高さを調整するため、必要な列の折り返しを制御する
 * ・「状況」列
 */
BacklogIssuesView.prototype.setWraps = function(isWrap) {
  var numRows = this.sheet.getDataRange().getLastRow() - 1; // ヘッダ分
  // データ行が無ければ何もしない
  if (numRows < 1) {
    return;
  }

  var column = this.indexOfAttr("状況") + 1; // 0 origin
  var wraps = [];
  for (var i = 0; i < numRows; i ++) {
    wraps.push([ isWrap ]);
  }
  var range = this.sheet.getRange(2, column, numRows, 1);
  range.setWraps(wraps);
};

/**
 * シートの高さを指定値で1行ずつリサイズする
 * ※正常に動作しない
 * @see https://issuetracker.google.com/issues/121054553
 */
BacklogIssuesView.prototype.resizeRows = function(size) {
  var range = this.sheet.getRange(2, 1);
  var last = this.sheet.getDataRange().getLastRow();
  while (true) {
    var row = range.getRow();
    if (row >= last) {
      break;
    }
    var height = this.sheet.getRowHeight(row);
    if (height > size) {
      this.sheet.setRowHeight(row, size);
    }

    range = range.offset(1, 0);
  }
};

/**
 * 表示調整
 */
BacklogIssuesView.prototype.finalize = function() {
  SpreadsheetApp.flush();
  this.sheet.setFrozenRows(1);
};

/**
 * 初期化。シートをまっさらにする。
 */
BacklogIssuesView.prototype.reset = function() {
  // 一旦、シートをクリアにする
  this.sheet.clear();
};

/**
 * バックアップ
 * 対象シートから日付毎にコピー
 */
BacklogIssuesView.prototype.backup = function(pos) {
  // 現在のスプレッドシートの取得
  var spread = SpreadsheetApp.getActiveSpreadsheet();

  // 年月でシート名生成
  var d = new DateEx();
  var date = d.getDateStr('');
  var suffix = 0;

  do {
    name = (suffix ==  0) ? date : date + '-' + suffix;
    var sheet = spread.getSheetByName(name);
    suffix ++;
  } while(sheet != null);

  // コピー（名前指定不可）&名前変更
  var sheetNew = this.sheet.copyTo(spread);
  sheetNew.setName(name);
  sheetNew.activate();
  spread.moveActiveSheet(1 + pos);
};
