var u = require("utility");




exports.createSimplePickerWindow = function(options) {
	// light-weight window로 popup을 오픈한다 (ANDROID)
	var win = Ti.UI.createWindow({
		backgroundColor: "transparent",
		opacitiy: 1,
	});
	
	var container = Ti.UI.createView(_.defaults(options.pickerStyle || {}, {
		borderWidth: 1,
		borderColor: "#eee",
		backgroundColor: "#fff",
		width: 240,
		height: Ti.UI.SIZE,
	}));
	win.add(container);
	
	var table = Ti.UI.createTableView({
		separatorColor: "#eee",
	});
	container.add(table);
	
	var rows = [];
	_.each(options.items, function(item) {
		var isCurrent = item[1] == options.value;
		var row = Ti.UI.createTableViewRow({
			height: 48,
		});
		var optionText = Ti.UI.createLabel({
			text: item[0],
			font: { fontSize: 18, fontWeight: isCurrent ? "bold" : "normal" },
			color: isCurrent ? "#393" : "#000",
		});
		row.add(optionText);
		
		rows.push(row);
	});
	table.setData(rows);
	
	table.addEventListener("click", function(e) {
		if (_.isNumber(e.index)) {
			var item = options.items[e.index];
			_.isFunction(options.onUpdate) && options.onUpdate(item);
		}
	});
	
	win.addEventListener("click", function(e) {
		win.close(); // window를 touch하면 무조건 닫는다.
	});
	
	win.addEventListener("androidback", function(e) {
		win.close();
	});
	
	return win;
}








