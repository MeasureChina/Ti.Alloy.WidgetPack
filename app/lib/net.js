/**
 *  HTTP Client wrapper
 * 
 */
exports.http = function(options, callback) {
	// testing code
	if (options.stub) {
		callback({
			success: true,
			code: 200,
			responseText: options.stub,
			responseJSON: options.stub,
		});
		return;
	}
	
	if (Ti.Network.online) {
		var xhr = Ti.Network.createHTTPClient({
			timeout : options.timeout || 7000
		});

		var url = options.url;
		if (options.ssl) {
			url = url.replace(/^http:\/\//, "https://");
			xhr.validatesSecureCertificate = false;
		}
		xhr.open(options.method, url);

		xhr.onload = function() {
			callback({
				success: true,
				code: xhr.status,
				responseText: xhr.responseText || null,
			});
		};
		xhr.onerror = function() {
			Ti.API.error("API ERROR:  " + xhr.status);
			Ti.API.error(xhr.responseText);
			
			callback({
				success: false,
				code: xhr.status,
				responseText: xhr.responseText || null,
			});
		};


		// authentication token
		if (options.useAuthToken) {
			var authToken = Alloy.Globals.readFromSession && Alloy.Globals.readFromSession("auth_token");
			if (authToken) {
				xhr.setRequestHeader("X-Auth-Token", authToken);
			}
		}
		if (options.useLanguageFlag) {
			// current language
			xhr.setRequestHeader("X-Language", Ti.Locale.currentLanguage);
		}
		// custom
		for (var header in options.headers) {
			xhr.setRequestHeader(header, options.headers[header]);
		}
		
		xhr.send(options.data || null);
    }
	else {
		// offline
		callback({
			success: false,
			responseText: null,
			offline: true
		});
	}
	
	return xhr;
}
