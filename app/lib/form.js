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

function Form(_model, _config) {
	var model = _model;
	var config = _config;
	
	this.updateModel = function() {
		var attrs = {};
		_.each(config, function(v, k) {
			attrs[k] = v.getValue();
		});
		if (model) {
			model.set(attrs, { silent: true });
		}
		return attrs;
	};
	this.updateView = function(attrs) {
		_.each(config, function(v, k) {
			var val;
			if (attrs) {
				val = attrs[k];
			} else {
				if (_.isFunction(model[k])) {
					val = model[k]();
				} else if (model.get) {
					val = model.get(k);
				} else {
					val = model[k];
				}
			}
			v.setValue(val);
		});
	};
	this.validate = function(options) {
		var error = [];// array of validation error: [columnName, ruleName, guideValue, ...]
		_.each(options, function(rules, k) {
			var input = config[k];
			if (!input) return;
			
			var val = input.getValue();
			
			_.each(rules, function(guide, key) {
				switch (key) {
					case "presence":
						if (guide && _.isEmpty(val)) {
							error.push([k, key, guide]);
						}
						break;
					case "minLength":
						if (!val || guide > val.length) {
							error.push([k, key, guide]);
						}
						break;
					case "maxLength":
						if (!val || guide < val.length) {
							error.push([k, key, guide]);
						}
						break;
					default:
						Ti.API.warn("invalid form validation scheme - " + key + " " + guide);
				}
			});
		});
		
		return error.length == 0 ? undefined : error;
	};
}

exports.builder = function(model, config) {
	var f = new Form(model, config);
	return f;
}






