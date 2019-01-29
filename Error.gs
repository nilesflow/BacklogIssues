/**
 * @fileoverview 例外を集約
 */

/**
 * 正常終了
 */
function Exit(message) {
  Error.call(this, message);

  // 解決できないため。
  this.message = message;
}

Exit.prototype = Object.create(Error.prototype);
Exit.prototype.constructor = Exit;
