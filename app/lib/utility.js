var _ = require("alloy/underscore")._;
var moment = require("alloy/moment");





/***********************************************
  ALLOY CONTROLLER
***********************************************/
exports.releaseController = function($) {
	var keys = _.keys($.__views);
	var keyLen = keys.length;
	for(var k=0; k<keyLen; k++) {
		if ($[keys[k]].__iamalloy) {
			// widget 또는 controller인 경우에는
			// 각 모듈의 release()에서 해제해야한다.
			if ($[keys[k]].release) $[keys[k]].release();
		} else {
			if ($[keys[k]].parent) $[keys[k]].parent.remove($[keys[k]]);
			if ($[keys[k]].image) $[keys[k]].image = '';
			if ($[keys[k]].images) $[keys[k]].images = [];
			if ($[keys[k]].backgroundImage) $[keys[k]].backgroundImage = '';
		}
		$[keys[k]] = undefined;
	}
	$._win = undefined;
	$.__views = [];
}

exports.initStyleProperty = function(wrapper, args) {
	for (var k in args) {
		if (_.contains(["width", "height", "top", "left", "bottom", "right", "backgroundColor", "color", "borderColor", "borderWidth", "borderRadius", "visible"], k)) {
			wrapper[k] = _.isString(args[k]) && args[k].match(/^Ti/) ? eval(args[k]) : args[k];
		}
	}
}




/***********************************************
  LAYOUTS
***********************************************/
var WIDTH_DP = Math.min(Ti.Platform.displayCaps.platformWidth, Ti.Platform.displayCaps.platformHeight) / Ti.Platform.displayCaps.logicalDensityFactor;
var WIDTH_DP_RATIO = WIDTH_DP / 320;


exports.resized_value = function(n) {
	return WIDTH_DP_RATIO * n;
}

var dpi = Ti.Platform.displayCaps.dpi;

exports.dpToPX = function (val) {
    if (!OS_ANDROID) {
        return val;
    }
    return val * dpi / 160;
}

exports.pxToDP = function (val) {
    if (!OS_ANDROID) {
        return val;
    }
    return val / dpi * 160;
}

function resizeView(view, options) {
	if (WIDTH_DP_RATIO == 1) return;
	
	_.each(['width', 'height', 'borderWidth'], function(attr) {
		if (_.isNumber(view[attr])) {
			view[attr] = exports.resized_value( view[attr] );
		}
	});
	_.each(['top', 'bottom', 'left', 'right'], function(attr) {
		if (_.isNumber(view[attr])) {
			view[attr] = exports.resized_value( view[attr] );
		}
	});
	if (options.font) {
		if (view.font) {
			if (_.isNumber(view.font.fontSize)) {
				_.extend(view.font, { fontSize: exports.resized_value( view.font.fontSize ) });
			}
		} else {
			view.font = { fontSize: exports.resized_value( 12 ) };
		}
	}
}

function resizeListTemplate(template) {
	// properties 조정
	resizeView(template.properties, { width: true, height: true, top: true, left: true, right: true, bottom: true, font: true, borderWidth: true });
	
	// childTemplates에 대해
	if (_.isArray(template.childTemplates)) {
		_.each(template.childTemplates, function(child) {
			resizeListTemplate(child);
		});
	}
}

exports.make_layout_fit = function(controller, options) {
	if (OS_ANDROID) {
		var views = [], rootViews = [];
		if (_.isArray(controller)) {
			views = controller;
		} else {
			// controller인 경우
			if (controller.__iamalloy) {
				views = controller.getViews();
				
				// top-level views에서
				// list template의 경우 properties를 조정해야한다. childTemplates에 대해 iteration해야함.
				rootViews = controller.getTopLevelViews();
				
			} else {
				views = [controller];
			}
		}
		
		_.each(views, function(view, id) {
			if (!view) return;
			switch (view.resizeMode) {
				case 'none':
					break;
				case 'content':
					break;
				case 'position':
					break;
				case 'all':
					break;
				default:
					resizeView(view, { width: true, height: true, top: true, left: true, right: true, bottom: true, font: true, borderWidth: true });
			}
		});

		_.each(rootViews, function(root) {
			// list template인 경우
			if (root.properties || root.childTemplates) {
				resizeListTemplate(root);
			}
		});
		
	}
}


/***********************************************
  Image: content mode
***********************************************/
exports.fill_to_container = function(container, preview) {
	var arContainer = container.width / container.height;
	var arPreview = preview.width / preview.height;
	
	// Ti.API.info("fill > arPreview : arContainer = " + arPreview + " : " + arContainer);
	
	if (arContainer > arPreview) {
		// container is 'wider' than preview
		preview.width = container.width;
		preview.height = preview.width / arPreview;

		preview.top = (preview.height - container.height) / 2 * -1;
		preview.left = 0;
	}
	else{
		// container is 'taller' than preview
		preview.height = container.height;
		preview.width = preview.height * arPreview;

		preview.top = 0;
		preview.left = (preview.width - container.width) / 2 * -1;
	}
}

exports.fill_width_to_container = function(container, preview) {
	var arContainer = container.width / container.height;
	var arPreview = preview.width / preview.height;
	
	// Ti.API.info("fill_width > arPreview : arContainer = " + arPreview + " : " + arContainer);

	preview.width = container.width;
	preview.height = preview.width / arPreview;

	preview.top = (preview.height - container.height) / 2 * -1;
	preview.left = 0;
}

exports.fit_to_container = function(container, preview) {
	var arContainer = container.width / container.height;
	var arPreview = preview.width / preview.height;
	
	// Ti.API.info("fit > arPreview : arContainer = " + arPreview + " : " + arContainer);

	if (arContainer > arPreview) {
		// container is 'wider' than preview
		preview.height = container.height;
		preview.width = preview.height * arPreview;

		preview.top = 0;
		preview.left = (preview.width - container.width) / 2 * -1;
	}
	else{
		// container is 'taller' than preview
		preview.width = container.width;
		preview.height = preview.width / arPreview;

		preview.top = (preview.height - container.height) / 2 * -1;
		preview.left = 0;
	}
}

































