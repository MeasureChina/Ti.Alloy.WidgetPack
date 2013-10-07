var MODE = "application";
// var MODE = "test";

// URL Scheme & Data 체크
// - VIEWER MODE인지 체크
function checkUrlSchemeAndData() {
	var activity = Ti.Android.currentActivity;
	var intent = activity.intent;
	var data = intent.data;
	
	// if (data) {
	// 	var tokens = data.replace("tripvi://", "").split('/');
	// 	if (tokens.length >= 2) {
	// 		// 최소 resource name, id의 2개가 존재해야함
	// 		$._data = data;
	// 		$._dataTokens = tokens;
	// 		return true;
	// 	}
	// }
}
if (checkUrlSchemeAndData()) MODE = "viewer";



/***********************************************
  APPLICATION WRAPPER
***********************************************/
function openTopMostWindow() {
	if ($._topMostWindow) return;

	Ti.API.info("\n\n\n\n\n\n\n\n");
	Ti.API.info(" _______                       __           __       __  __  __  __  ");
	Ti.API.info("/       \\                     /  |         /  \\     /  |/  |/  |/  |");
	Ti.API.info("$$$$$$$  |  ______    ______  $$ |   __    $$  \\   /$$ |$$/ $$ |$$ |");
	Ti.API.info("$$ |__$$ | /      \\  /      \\ $$ |  /  |   $$$  \\ /$$$ |/  |$$ |$$ |");
	Ti.API.info("$$    $$< /$$$$$$  |/$$$$$$  |$$ |_/$$/    $$$$  /$$$$ |$$ |$$ |$$ | ");
	Ti.API.info("$$$$$$$  |$$ |  $$ |$$ |  $$ |$$   $$<     $$ $$ $$/$$ |$$ |$$ |$$ | ");
	Ti.API.info("$$ |__$$ |$$ \\__$$ |$$ \\__$$ |$$$$$$  \\    $$ |$$$/ $$ |$$ |$$ |$$ | ");
	Ti.API.info("$$    $$/ $$    $$/ $$    $$/ $$ | $$  |   $$ | $/  $$ |$$ |$$ |$$ | ");
	Ti.API.info("$$$$$$$/   $$$$$$/   $$$$$$/  $$/   $$/    $$/      $$/ $$/ $$/ $$/  ");
	Ti.API.info("                                         ");
	Ti.API.info("                                         ");

	Ti.API.info("******************************   APPLICATION OPEN():  as " + MODE);
	Ti.API.info("******************************                        data  =>  " + $._data);

	$._topMostWindow = Ti.UI.createWindow({ exitOnClose: true, navBarHidden: true, backgroundColor: "transparent" });
	$._topMostWindow.open();
}

function closeTopMostWindow() {
	if ($._topMostWindow) {
		Ti.API.info("******************************   APPLICATION EXIT()\n\n\n\n");
		// App 종료
		Alloy.Globals.application = undefined;
		$._topMostWindow.close();
	}
}



/***********************************************
  MAIN APPLICATION WINDOW
***********************************************/
exports.openMainWindow = function(options) {
	$._mainController = Alloy.createController('main');
	// Alloy.Globals.openWindow($._mainController.getView(), options);
	$._mainController.getView().open({ animated: false });
	
	$._mainController.on('exit', function() {
		// exit 이벤트가 떨어지면 App 종료
		Ti.API.info("EXIT signal from:  main");
		setTimeout(closeTopMostWindow, 200);
		$._mainController.off();
	});
}

exports.closeMainWindow = function() {
	if ($._mainController) {
		$._mainController.off();
		$._mainController.win.close();
		$._mainController = undefined;
	}
}

exports.exit = function() {
	exports.closeMainWindow();
	setTimeout(closeTopMostWindow, 200);
}

exports.openLandingPage = function(options) {
	// TODO: remove
	exports.openMainWindow(options);
	return;
	
	var c = Alloy.createController('account/landing', { exit_event: true });
	Alloy.Globals.openWindow(c.getView(), options);
	
	c.on('login', function() {
		// 로그인이된 경우 main window 오픈
		exports.openMainWindow();
		c.off();
	});
	
	c.on('exit', function() {
		// exit 이벤트가 떨어지면 App 종료
		Ti.API.info("EXIT signal from:  account/landing");
		setTimeout(closeTopMostWindow, 200);
		c.off();
	});
}

exports.moveMainPage = function() {
	if ($ && $._mainController) {
		$._mainController.menu.openMenuByName('home');
	}
}

exports.movePeoplePage = function() { // 명사 메뉴로 이동
	if ($ && $._mainController) {
		$._mainController.menu.openMenuByName('person_index');
	}
}

exports.movePopularPage = function() { // Top100 메뉴로 이동
	if ($ && $._mainController) {
		$._mainController.menu.openMenuByName('popular_index');
	}
}

// exports.moveThemePage = function() { // 테마 메뉴로 이동
// 	if ($ && $._mainController) {
// 		$._mainController.menu.openMenuByName('home');
// 	}
// }
// 
// exports.moveSpecialPage = function() { // 스페셜 메뉴로 이동
// 	if ($ && $._mainController) {
// 		$._mainController.menu.openMenuByName('home');
// 	}
// }

Alloy.Globals.application = exports;




/**	
 *	Booting: Test
 *
 */
if (MODE == 'test') {
	(function() {
		
		openTopMostWindow(); // top most window
		
		
		var c = Alloy.createController('unit_test');
		c.getView().open();
		// exitOnClose 에뮬레이트
		c.win.addEventListener('close', exports.exit);

	})();
}
/**	
 *	Booting: Viewer Mode
 *
 */
else if (MODE == 'viewer') {
	
}
/**	
 *	Booting: Application
 *
 */
else {
	(function() {
		
		openTopMostWindow(); // top most window
		
		// Login되어있으면 바로 MainWindow를 띄운다.
		var session = Alloy.Globals.getSession();
		if (session.authenticated) {
			exports.openMainWindow({ animated: false });
		} else {
			// 아니면 landing페이지 오픈한다.
			exports.openLandingPage({ animated: false });
		}
		
	})();
}
