/**
 * 日時変換クラス
 * 0詰め対応
 * @override
 */
function DateEx(date) {
  if (date === undefined) {
    this.d = new Date();
  }
  else {
    this.d = new Date(date);
  }
}

DateEx.prototype.getFullYear = function() {
  return this.d.getFullYear();
};

DateEx.prototype.getMonth = function() {
  return ((this.d.getMonth() + 1).toString().length == 1) ? ('0' + (this.d.getMonth() + 1)) : (this.d.getMonth() + 1);
};

DateEx.prototype.getDate = function() {
  return (this.d.getDate().toString().length == 1) ? ('0' + this.d.getDate()) : this.d.getDate();
};

DateEx.prototype.getHours = function() {
  return (this.d.getHours().toString().length == 1) ? ('0' + this.d.getHours()) : this.d.getHours();
};

DateEx.prototype.getMinutes = function() {
  return (this.d.getMinutes().toString().length == 1) ? ('0' + this.d.getMinutes()) : this.d.getMinutes();
};

DateEx.prototype.getSeconds = function() {
  return (this.d.getSeconds().toString().length == 1) ? ('0' + this.d.getSeconds()) : this.d.getSeconds();
};

/**
 * 年月日文字列を取得
 */
DateEx.prototype.getDateStr = function(sep) {
  if (sep === undefined) {
    sep = '/';
  }
  return this.getFullYear() + sep + this.getMonth() + sep + this.getDate();
};

/**
 * 時分秒文字列を取得
 */
DateEx.prototype.getTimeStr = function(sep) {
  if (sep === undefined) {
    sep = ':';
  }
  return this.getHours() + sep + this.getMinutes() + sep + this.getSeconds();
};