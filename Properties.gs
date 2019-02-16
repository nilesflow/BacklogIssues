/**
 * プロパティ管理クラス
 */
function Properties() {
  this.props = PropertiesService.getDocumentProperties();  
}

/**
 * スペース／プロジェクトの表示
 */
Properties.prototype.getPrintSpaceProject = function() {
  var prop = this.props.getProperty("isPrintSpaceProject");
  if (prop == "true") {
    return true
  }
  return false;
};

/**
 * スペース／プロジェクトの表示
 */
Properties.prototype.setPrintSpaceProject = function(isPrint) {
  this.props.setProperty("isPrintSpaceProject", isPrint.toString());
};

/**
 * 行の最大サイズ
 * ※未使用
 */
Properties.prototype.getMaxRowSize = function() {
  var prop = this.props.getProperty("maxRowSize");
  return prop;
};

/**
 * 行の最大サイズ
 * ※未使用
 */
Properties.prototype.setMaxRowSize = function(size) {
  this.props.setProperty("maxRowSize", size);
};

/**
 * 行の折り返し
 */
Properties.prototype.getWrap = function() {
  var prop = this.props.getProperty("wrap");
  if (prop == "true") {
    return true
  }
  return false;
};

/**
 * 行の折り返し
 */
Properties.prototype.setWrap = function(isWrap) {
  this.props.setProperty("wrap", isWrap.toString());
};
