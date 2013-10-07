/***********************************************
  CONFIGURATIONS
***********************************************/
var mode = require('environment').mode;
var u = require('utility');

Alloy.Globals.host = 'http://app.bookmill.co.kr';
switch (mode) {
	case "dev":
		Alloy.Globals.host = "http://localhost:3000";
		break;
	case "localhost":
		Alloy.Globals.host = "http://172.20.10.2:3000";
		break;
	case "metacortex":
		Alloy.Globals.host = "http://10.1.2.231:3000";
		break;
	case "hiphapis":
		Alloy.Globals.host = "http://10.1.1.161:3333";
		break;
	case "vagrantinoz":
		// Alloy.Globals.host = "http://172.20.10.2:3000";
		// Alloy.Globals.host = "http://10.1.2.15:3000";
		Alloy.Globals.host = "http://192.168.1.2:3000";
		break;
	case "miriyas":
		Alloy.Globals.host = "http://10.1.1.160:3000";
		break;
	case "home":
		// Alloy.Globals.host = "http://192.168.1.43:3000";
		Alloy.Globals.host = "http://192.168.0.6:3000";
		// Alloy.Globals.host = "http://192.168.10.72:3000";
		break;
}

Ti.API.info("\n\n\n\n\n*********************************************************************************************************");
Ti.API.info(" APPLICATION STARTS!");
Ti.API.info("  - Ti.Locale.currentLanguage = " + Ti.Locale.currentLanguage);
Ti.API.info("  - Ti.Locale.currentLocale = " + Ti.Locale.currentLocale);
Ti.API.info("  - Alloy.Globals.host = " + Alloy.Globals.host);
Ti.API.info("\n\n");




/***********************************************
  GLOBAL VARIABLES & DELEGATES
***********************************************/
Alloy.Globals.application; // index window instance
Alloy.Globals.app; // app instance
Alloy.Globals.makeLayoutFit = require('utility').make_layout_fit;
Alloy.Globals.releaseController = require('utility').releaseController;





/***********************************************
  GLOBAL MODEL & COLLECTION
***********************************************/
// Alloy.Models.currentUser = Alloy.createModel(
// 	'User',
// 	Alloy.Globals.readFromSession('user_json') // 세션에 저장된 user_json으로 새로 만든다.
// );
// 
// Ti.API.info('CURRENT_USER initialized:');
// Ti.API.info(JSON.stringify(Alloy.Models.currentUser.toJSON()));
// 
// function onChangeCurrentUser(e) {
// 	Alloy.Globals.writeToSession('user_json', Alloy.Models.currentUser.toJSON());
// }
// 
// Alloy.Models.currentUser.on('change', onChangeCurrentUser); // TODO: should release event handler?

Alloy.Globals.isCurrentUser = function(user_id) {
	var cu = Alloy.Models.currentUser;
	return cu && (cu.id == user_id);
}
Alloy.Globals.isLoginWithFacebook = function() {
	var cu = Alloy.Models.currentUser;
	return cu && !!cu.get("facebook_id");
}

// Alloy.Collections.favorites = Alloy.createCollection('Favorite');
// Alloy.Collections.myLists = Alloy.createCollection('List');

// Alloy.Collections.trips.comparator = function(trip) {
// 	return -1 * parseInt(trip.id); // 최근 생성 역순으로 정렬
// }



// TODO: 글로벌 모델을 해제해야함. UserSession이 리셋되거나 Logout되는 경우에 필요한듯함.




/***********************************************
  GLOBAL NOTIFICATION
***********************************************/
// Alloy.Globals.Gcm = require('net.iamyellow.tigcm');
// var serviceIntent = Titanium.Android.createServiceIntent( { url: 'gcm.js' } );
// Alloy.Globals.notificationService = Titanium.Android.createService(serviceIntent);
// Alloy.Globals.Gcm.fireEventWhenInFg = false;




/***********************************************
  SESSION DATA
***********************************************/

var SESSION;
var SESSION_ATTRS = [
	//
	'id',
	'uid',
	// 'auth_token',
	'user_json',
	// oauth
	// 'foursquareAccessTokenKey',
	// 'twitterAccessTokenKey',
	// 'twitterAccessTokenSecret',
	// 'instagramAccessTokenKey',
	// 'instagramUserID',
	// flags
	'firstTime',
];

Alloy.Globals.createSession = function(data) {
	Ti.App.Properties.setString("user_id", data.id);
	
	// session data를 serialize하여 저장함.
	var s = _.reduce(SESSION_ATTRS, function(obj, key) { obj[key] = data[key]; return obj; }, {});
	s["user_json"] = data; // 회원가입했을때 user_json 저장함
	
	Ti.App.Properties.setObject("user_session", s);
	SESSION = s;
	
	// set current user
	if (data) {
		Alloy.Models.currentUser.set(data);
	}
	
	Ti.API.info('created SESSION:  used_id - ' + data.id);
}

Alloy.Globals.destroySession = function() {
	
	// facebook logout
	// Alloy.Facebook.logout();
	
	// clear oauth & http cache
	// Alloy.Globals.instagram.logout();
	// Alloy.Globals.twitter.logout();
	
	// destroy session
	Ti.App.Properties.removeProperty('user_session'); 
	Ti.App.Properties.removeProperty('user_id');
	
	SESSION = undefined;
	Ti.API.info('destroyed SESSION');
}

Alloy.Globals.getSession = function() {
	if (!SESSION) { // 초기화
		Ti.API.info('loading and initializing SESSION DATA...');

		var user_id = Ti.App.Properties.getString('user_id');
		if (user_id) {
			var user_session = Ti.App.Properties.getObject('user_session');
			if (user_session && (user_id == user_session.id)) {
				Ti.API.info('  - okay');
				SESSION = user_session;
			} else {
				Ti.API.info('  - user_id is not matched. use empty session.');
				SESSION = { id: user_id };
			}
		} else {
			SESSION = {};
		}
	}

	if (SESSION && SESSION.id) {
		SESSION.authenticated = true;
		Ti.API.info('  - authenticated:  ' + SESSION.auth_token);
	} else {
		SESSION.authenticated = false;
	}

	return SESSION;
}

Alloy.Globals.readFromSession = function(key) {
	var s = Alloy.Globals.getSession();
	return s[key];
}

Alloy.Globals.writeToSession = function(key, value) {
	var s = Alloy.Globals.getSession();
	
	if (_.contains(SESSION_ATTRS, key) || (key && key.match(/^popup_/))) {
		s[key] = value;
		
		Ti.App.Properties.setObject("user_session", s);
		SESSION = s;
		
		Ti.API.info('updated SESSION data:  ' + key);
	} else {
		Ti.API.info('failed updating SESSION data:  ' + key);
		throw 'failed updating SESSION data:  ' + key;
	}
	
	return s;
}



/***********************************************
  WINDOW MANAGEMENT
    - window를 open하면서 actionBar, navigationDrawer 세팅
    - window를 close할때 resource 해제
    - group 관리. string key 사용
***********************************************/
var $G = {};

$G._groups = [];
$G._currentGroup;

function getGroupDisplayName(g) { return g.name || g._name || '(anonymous)' }

$G.createNewGroup = function(group_name) {
	$G._currentGroup = [];
	$G._currentGroup.name = group_name;
	Ti.API.info('[GROUP] start new group: ' + getGroupDisplayName($G._currentGroup));
	return $G._currentGroup;
}
$G.releaseAllGroup = function() {
	var len = $G._groups.length;
	for (var i=0; i<len; i++) {
		$G.closeGroup();
	}
}
$G.getCurrentGroup = function() {
	return $G._currentGroup;
}
$G.findGroupByName = function(group_name) {
	var len = $G._groups.length;
	for (var i=0; i<len; i++) {
		var g = $G._groups[i];
		if (g.name == group_name) {
			return g;
		}
	}
}

$G.openWindowUsingGroup = function(win, group_name, options) {
	options = options || {}

	if ($G._currentGroup) {
		Ti.API.info('group exist: ' + getGroupDisplayName($G._currentGroup) + ' -> ' + $G._currentGroup.length);
		
		if ($G._currentGroup.name != group_name) {
			// 이름이 다르다면 새로 만들어야함
			// 이전 그룹은 stack에 push해서 보존
			$G.createNewGroup(group_name);
			$G._groups.push($G._currentGroup);
			Ti.API.info('  - pushed group to group stack: ' + getGroupDisplayName($G._currentGroup) + ', group stack size = ' + $G._groups.length);
		} else {
			Ti.API.info('reuse the existing group');
		}
	} else {
		$G.createNewGroup(group_name);
		$G._groups.push($G._currentGroup);
		Ti.API.info('  - pushed group to group stack: ' + getGroupDisplayName($G._currentGroup) + ', group stack size = ' + $G._groups.length);
	}
	
	//
	$G.openWindow(win, options);
}

$G.closeGroup = function(options) {
	options = options || {}
	
	if (OS_ANDROID && $G._currentGroup) {
		Ti.API.info('[CLOSE GROUP] closed: ' + getGroupDisplayName($G._currentGroup) + ', ' + $G._currentGroup.length + ' windows');
		
		if (!options.skipCloseAll) {
			// 현재그룹내 모든 window를 닫고
			_.each($G._currentGroup, function(w) {
				// window를 닫을때 재귀호출이 일어나지 않도록 상태 'closing' 설정
				w._closing = true;
				w.close();
			});
			// 현재 그룹 닫음
			$G._currentGroup = [];
		}
		
		// 이전 GROUP으로 되돌아간다.
		if ($G._groups.length > 0) {
			$G._groups.pop();
			$G._currentGroup = _.last($G._groups);
			
			if ($G._currentGroup) {
				Ti.API.info('  - popped the recent group: ' + getGroupDisplayName($G._currentGroup) + ', group stack size = ' + $G._groups.length);
			} else {
				Ti.API.info('  - popped the recent group: none');
			}
		}
		// GROUP이 없는 경우
		else {
			$G._currentGroup = undefined;
		}
		
	} else {
		Ti.API.info('close group - no group exists');
	}
}

$G.openWindow = function(win, options) {
	options = options || {}
	if (win._options) _.extend(options, win._options);
	
	if (OS_ANDROID) {
		// actionBar 추가
		var actionBar = Alloy.createWidget("com.tripvi.actionBar");
		actionBar.init(win, {
			useDrawerMenu: true,
			tabs: options.tabs,
			menu: options.menu,
			rootWindow: options.rootWindow,
			title: options.title,
		});
		win._actionBar = actionBar;
		
		function onActionbarhome() {
			if (options.onActionbarHome) {
				options.onActionbarHome();
			} else if (win.onActionbarHome) {
				win.onActionbarHome();
			} else {
				// default 동작은
				// root window이고 global app이 존재할경우 menu toggle
				// 그외의 경우는 그냥 창닫기
				if (options.rootWindow && Alloy.Globals.app && Alloy.Globals.app.toggleLeftDrawer) {
					Alloy.Globals.app.toggleLeftDrawer();
				} else {
					win.close();
				}
			}
		}
		win.addEventListener('actionbarhome', onActionbarhome);

		function onOpenWindow() {
			// activity는 window가 open된 이후에 접근 가능함
			// var activity = win.activity;
		}
		win.addEventListener('open', onOpenWindow);

		function onCloseWindow() {
			Ti.API.info('[CLOSE WINDOW] closed > ' + win.title);
			
			// release actionbar
			if (win._actionBar) {
				win._actionBar.release();
				win._actionBar = undefined;
			}
			
			// release events
			if (win._options) {
				win._options.onActionbarHome = undefined;
				win._options.menu = undefined;
				win._options = undefined;
			}
			win.onActionbarHome = undefined;
			options.onActionbarHome = undefined;
			
			win.removeEventListener('open', onOpenWindow);
			win.removeEventListener('actionbarhome', onActionbarhome);
			win.removeEventListener('close', onCloseWindow);
		}
		win.addEventListener('close', onCloseWindow);
		
		
		// open window
		Ti.API.info('[WINDOW] open > ' + win.title);
		win.open(_.pick(options, 'animated'));
		
		
		// group에 넣는 경우
		// window를 닫을때 그룹에서 빼야함
		if ($G._currentGroup) {
			$G._currentGroup.push(win);
			
			Ti.API.info('  - pushed to group: ' + getGroupDisplayName($G._currentGroup) + ', and size is ' + $G._currentGroup.length);
			
			function closeCurrentGroup() {
				if (win._closing) {
					// status가 closing인 경우
					
				} else if ($G._currentGroup) {
					// win._closing이 아닌 경우. Group에서 제거
					$G._currentGroup.pop();
					Ti.API.info('  - popped from group: ' + getGroupDisplayName($G._currentGroup) + ', and size is ' + $G._currentGroup.length);
					
					if ($G._currentGroup.length == 0) {
						Ti.API.info('group will be closing - the last window was closed.');
						$G.closeGroup({ skipCloseAll: true });
					}
				}
				win.removeEventListener('close', closeCurrentGroup);
			}
			win.addEventListener('close', closeCurrentGroup);
		}
	}
}

$G.closeWindow = function(win, options) {
	// 언제나 closeWindow를 호출할수있는것은 아니다. tabGroup, navigationGroup 등 window 관리를 sdk에서 하는 경우가 있어서
	// win.close()만으로 모든 리소스가 반환되어야함
	win.close();
}

_.extend(Alloy.Globals, $G);





