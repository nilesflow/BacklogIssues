/**
 * Backlog API クラス
 */
function Backlog(param) {
  this.host = param.host;
  this.url = 'https://' + param.host;
  this.apiKey = param.apiKey;
  this.project = null; 

  this.oUrl = new Url();
}

/**
 * Hostを取得
 */
Backlog.prototype.getHost = function() {
  return this.host;
};


/**
 * Projectの設定
 * プロジェクトごとの処理を行うため
 */
Backlog.prototype.setProject = function(project) {
  this.project = project;
};

/**
 * スペースリンクの取得
 */
Backlog.prototype.buildUrlSpace = function() {
  return this.url + '/dashboard';
};

/**
 * Projectリンクの取得
 */
Backlog.prototype.buildUrlProject = function(projectKey) {
  var key = '';

  // 指定値優先
  if (projectKey !== undefined) {
    key = projectKey;
  }
  // 次に、インスタンス変数が有ったら
  else if (this.project.projectKey != null) {
    key = this.project.projectKey; 
  }
  else {
    throw new Error("projectKey が設定されていません。")
  }
  return this.url + '/projects/' + key;
};

/**
 * 課題リンクの取得
 */
Backlog.prototype.buildUrlIssue = function(issueKey) {
  return this.url + '/view/' + issueKey;
};

/**
 * カテゴリーリンクの取得
 * setProjectを先にコールする事
 */
Backlog.prototype.buildUrlCetegory = function(categoryId) {
  // インスタンス変数から
  if (this.project.projectKey == null) {
    throw new Error("this.projectKey が設定されていません。")
  }
  return this.url + '/find/' + this.project.projectKey + '?condition.componentId=' + categoryId;
};

/**
 * マイルストーンリンクの取得
 * setProjectを先にコールする事
 */
Backlog.prototype.buildUrlVersion = function(versionId) {
  // インスタンス変数から
  if (this.project.projectKey == null) {
    throw new Error("this.projectKey が設定されていません。")
  }
  return this.url + '/find/' + this.project.projectKey + '?condition.fixedVersionId=' + versionId;
};

/**
 * Backlogへのリクエスト共通関数
 * @protected
 * @see https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app
 */
Backlog.prototype.request = function(url, queryStrings) {
  if (queryStrings ===　undefined) {
    queryStrings = {};
  }
  queryStrings.apiKey = this.apiKey;
  var json = this.oUrl.fetch(url, queryStrings);
  return JSON.parse(json);
}

/**
 * スペース情報の取得
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-space/
 */
Backlog.prototype.getSpace = function(params) {
  var url = this.url + '/api/v2/space';
  return this.request(url);
};

/**
 * プロジェクト一覧の取得
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-project-list/
 */
Backlog.prototype.getProjects = function(params) {
  var url = this.url + '/api/v2/projects';
  return this.request(url, {
    archived: false, // 非アーカイブ
// 管理者権限の場合のみ、有効
//    all : true, // 全てのプロジェクト
  });
};

/**
 * 課題一覧の取得
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue-list/
 */
Backlog.prototype.getIssues = function(params) {
  var projectId = [];
  var url = this.url + '/api/v2/issues';

  // 指定値優先
  if (params.projectId !== undefined) {
    projectId = params.projectId;
  }
  // 無ければ設定された値
  else if (this.project.id !== undefined) {
    projectId.push(this.project.id);
  }
  
  return this.request(url, {
    projectId: projectId,
    order : params.order,
    statusId : params.statusId,
    offset : params.offset,
    count : params.count,
    updatedSince : params.updatedSince,
  });
};

/**
 * 課題情報の取得
 * @note not used
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-issue/
 */
Backlog.prototype.getIssue = function(issueIdOrKey) {
  var url = this.url + '/api/v2/issues/' + issueIdOrKey;
  return this.request(url);
};

/**
 * 課題コメントの取得
 * @see https://developer.nulab-inc.com/ja/docs/backlog/api/2/get-comment-list/
 */
Backlog.prototype.getIssueComments = function(issueIdOrKey, params) {
  var url = this.url + '/api/v2/issues/' + issueIdOrKey + '/comments';
  return this.request(url, {
    minId : null,
    maxId : null,
    count : params.count,
    order : params.order,
  });
};