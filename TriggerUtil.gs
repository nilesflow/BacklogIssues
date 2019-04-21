/**
 * Triggerユーティリティー
 */
function TriggerUtil(param) {
};

/**
 * 時間指定
 * @see https://developers.google.com/apps-script/reference/script/clock-trigger-builder#nearminuteminute
 */
TriggerUtil.prototype.setEveryTime = function(name, hour, minute) {
  // 入力チェック
  if (hour != Number(hour) || minute != Number(minute)) {
    return false;
  }
  hour = Number(hour);
  minute = Number(minute);

  // トリガーを設定
  ScriptApp.newTrigger(name)
  .timeBased()
  .atHour(hour)
  .nearMinute(minute)
  .everyDays(1)
  .create();

  Logger.log(hour);
  Logger.log(minute);

  return true;
};

/**
 * 曜日指定
 * @see https://developers.google.com/apps-script/reference/script/clock-trigger-builder#onweekdayday
 */
TriggerUtil.prototype.setEveryWeek = function(name, weekday, hour, minute) {
  // 入力チェック
  if (hour != Number(hour) || minute != Number(minute) || weekday in ScriptApp.WeekDay) {
    return false;
  }
  hour = Number(hour);
  minute = Number(minute);

  // トリガーを設定
  ScriptApp.newTrigger(name)
  .timeBased()
  .atHour(hour)
  .nearMinute(minute)
  .onWeekDay(weekday)
  .create();

  Logger.log(weekday);
  Logger.log(hour);
  Logger.log(minute);

  return true;
};

/**
 * 指定ms後
 * @see https://developers.google.com/apps-script/reference/script/clock-trigger-builder#afterdurationmilliseconds
 */
TriggerUtil.prototype.setAfter = function(name, ms) {
  ScriptApp.newTrigger(name)
  .timeBased()
  .after(ms)
  .create();
};

/**
 * イベントトリガー：onEdit
 * @see https://developers.google.com/apps-script/reference/script/spreadsheet-trigger-builder#onedit
 */
TriggerUtil.prototype.setOnEdit = function(name) {
  var sheet = SpreadsheetApp.getActive();
  ScriptApp.newTrigger(name)
  .forSpreadsheet(sheet)
  .onEdit()
  .create();
};

/**
 * トリガーの検索
 */
TriggerUtil.prototype.isSet = function(name) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i in triggers) {
    if (triggers[i].getHandlerFunction() == name) {
      return true;
    }
  }

  return false;
};

/**
 * トリガーの削除
 * @see https://developers.google.com/apps-script/reference/script/script-app#deletetriggertrigger
 */
TriggerUtil.prototype.deleteAll = function(name) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i in triggers) {
    if (triggers[i].getHandlerFunction() == name) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
};
