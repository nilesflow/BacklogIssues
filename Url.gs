/**
 * Urlクラス
 * @see https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app
 */
function Url(param) {
}

/**
 * Backlogへのリクエスト共通関数
 * @protected
 */
Url.prototype.serialize = function(queryStrings) {
  var strings = '';
  var first = true;
  for (var key in queryStrings) {
    var value = queryStrings[key];
    if (value == null) {
      continue;
    }

    if (first) {
      strings += '?';
      first = false;
    }
    else {
      strings += '&';
    }

    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i ++) {
        if (i != 0) {
          strings += '&';
        }
        strings += key + '[]=' + value[i];
      }
    }
    else {
      strings += key + '=' + value;
    }
  }
  return strings;
};

/**
 * Backlogへのリクエスト共通関数
 */
Url.prototype.fetch = function(url, queryStrings) {
  if (queryStrings != null) {
    url += this.serialize(queryStrings);
  }
  Logger.log(url);

  try {
    var res = UrlFetchApp.fetch(url); 
  }
  // include muteHttpExceptions
  catch (e) {
    Logger.log(e);
    throw new Error("リクエストに失敗");
  }
  var code = res.getResponseCode();
  if (code != 200) {
    throw new Error("リクエストに失敗： code = " + code);
  }
  return res.getContentText();
};