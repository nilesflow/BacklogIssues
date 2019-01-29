/**
 * コンフィグクラス
 */
function Config(param) {
  this.sheet = SpreadsheetApp.getActive().getSheetByName(param.sheet);
}

/**
 * ↓方向にkeyを検索
 * @protected
 */
Config.prototype.downNext = function(range) {
  var rowLast = this.sheet.getDataRange().getLastRow();
  var next = null;
  
  do {
    // 次のkeyを発見した時点で終わり
    next = range.offset(1, 0);
    if (! next.isBlank()) {
      break;
    }
    range = next;

    // 最終行まで検索したら終わり
  } while (range.getRow() <= rowLast);
  
  return next;
};

/**
 * →方向にendを検索
 * @protected
 */
Config.prototype.rightEnd = function(range) {
  var columnLast = this.sheet.getDataRange().getLastColumn();
  var next = null;
  
  do {
    // 連続した値の終わりを検索
    next = range.offset(0, 1);
    if (next.isBlank()) {
      break;
    }
    range = next;

    // 最終列まで検索したら終わり
  } while (range.getColumn() <= columnLast);

  return range;
};

/**
 * 複数列形式 -> 配列形式
 * @protected
 */
Config.prototype.parseColumns = function(range, width) {
  var values = range.offset(0, 0, 1, width).getValues();
  return values.pop();
};

/**
 * 値の取得
 * セル背景色の取得に対応
 * @protected
 */
Config.prototype.getValue = function(range, row, column) {
  var target = range.offset(row, column);
  var value;

  var color = target.getBackground();
  if (target.isBlank() && color != '#ffffff') {
    value = color;
  }
  else {
    value = target.getValue();
  }
  return value;
};

/**
 * keyが縦方向に並んでいる形式かを判定
 * key - value のキーワードがあったら
 * @protected
 */
Config.prototype.isVertical = function(range) {
  var ret = false;

  var key = range.offset(0, 0).getValue();
  var value = range.offset(0, 1).getValue();
  if (key == 'key' && value == 'value') {
    ret = true;
  }
  return ret;
};

/**
 * 縦方向テーブル形式 -> オブジェクト
 * @protected
 */
Config.prototype.parseVertical = function(range, height, width) { 
  var o = {};
  var key, value;

  for (var row = 1; row < height; row ++) {
    // 1行全て空白だったら
    if (range.offset(row, 0, 1, width).isBlank()) {
      break;
    }
    // keyが無ければ無効
    if (range.offset(row, 0).isBlank()) {
      continue;
    }

    key = range.offset(row, 0).getValue();
    value = this.getValue(range, row, 1)
    o[key] = value;
  }
  return o;
};

/**
 * テーブル形式 -> オブジェクトの配列形式
 * @protected
 */
Config.prototype.parseTable = function(range, height, width) {
  var getHeader = function(range, row, col) {
    return range.offset(0, col).getValue();
  };

  var objects = [];
  for (var row = 1; row < height; row ++) {
    // 1行全て空白だったら
    if (range.offset(row, 0, 1, width).isBlank()) {
      break;
    }
    var o = {};
    for (var col = 0; col < width; col ++) {
      o[getHeader(range, 0, col)] = this.getValue(range, row, col);
    }
    objects.push(o);
  }

  return objects;
};

/**
 * コンフィグ情報の読み込み
 */
Config.prototype.load = function() {
  var config = {};
  var key;
  var next, range, right;
  var rowNext, width, height
 
  var rowLast = this.sheet.getDataRange().getLastRow();
  var index = this.sheet.getRange(1, 1);

  do {
    // 次のkeyを検索
    next = this.downNext(index);
    if (next == null) {
      break;
    }

    key = index.getValue();     // key値にする
    range = index.offset(0, 1); // その横一つ目を起点
    right = this.rightEnd(range); // 連続した再右のセル

    rowNext = next.getRow();
    height = rowNext - range.getRow();   
    width =  right.getColumn() - (range.getColumn() - 1);

    if (height == 1) {
      if (width == 1) {
        config[key] = this.getValue(range, 0, 0);
      }
      else {
        config[key] = this.parseColumns(range, width);
      }
    }
    else if (this.isVertical(range)) {
      config[key] = this.parseVertical(range, height, width);
    }
    else {
      config[key] = this.parseTable(range, height, width);
    }
    index = next;

  } while (rowNext <= rowLast);

  return config;
};

/**
 * テストコード
 */
function test() {
  var c = new Config({
    sheet : 'config',
  });
  c.load();
}
