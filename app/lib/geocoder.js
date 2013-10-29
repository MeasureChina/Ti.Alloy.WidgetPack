/***********************************************
  GOOGLE GEOCODER API
***********************************************/

// callback(location_data)
//		country_name
//		country_code
//		country_lat
//		country_lon
//		city_name
//		city_short_name
//		city_state
//		city_state_full
//		city_county
//		city_county_full
//		city_lat
//		city_lon
//
exports.googleReverseGeocoder = function(location, callback) {
	var lat = location.lat || location.latitude;
	var lon = location.lon || location.longitude || location.lng;
	var language = location.language || Ti.Locale.currentLanguage;
	
	Ti.API.info('google reverseGeocoder: ' + lat + ', ' + lon + '   language: ' + language);
	
	require('net').http({
		url: 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lon + '&sensor=true&language=' + language,
		method: 'GET',
	}, function(resp) {
		var data = {};
		if (resp.success) {
			var d = JSON.parse(e.responseText);
			var addresses = d.results;

			// parse: country location
			var country_loc = _.last(_.select(addresses, function(address) { return address['types'][0] == 'country' }));
			if (country_loc) {
				if (country_loc['geometry'] && country_loc['geometry']['location']) {
					data.country_lat = country_loc['geometry']['location']['lat'];
					data.country_lon = country_loc['geometry']['location']['lng'];
				}
				if (country_loc['address_components'] && country_loc['address_components'][0]) {
					data.country_name = country_loc['address_components'][0]['long_name'];
					data.country_code = country_loc['address_components'][0]['short_name'];
				}
			}
			else if (addresses[0]) {
				// full address_component에서 country name만 가져온다.
				var c = _.last(_.select(addresses[0].address_components, function(address) { return address['types'][0] == 'country' }));
				if (c) {
					data.country_name = c['long_name'];
					data.country_code = c['short_name'];
				} else {
					// 결국 없음
					Ti.API.warn('  geocoding: no country found');
				}
			}
			
			// parse: city location
			var city_loc = _.last(_.select(addresses, function(address) { return address['types'][0] == 'locality' }));
			if (city_loc) {
				if (city_loc['geometry'] && city_loc['geometry']['location']) {
					data.city_lat = city_loc['geometry']['location']['lat'];
					data.city_lon = city_loc['geometry']['location']['lng'];
				}
				if (city_loc['address_components'] && city_loc['address_components'][0]) {
					data.city_name = city_loc['address_components'][0]['long_name'];
					data.city_short_name = city_loc['address_components'][0]['short_name'];
				}
				// parse: state name
				var state = _.find(city_loc['address_components'], function(c) { return c['types'][0] == 'administrative_area_level_1' });
				if (state) {
					data.city_state = state['short_name'];
					data.city_state_full = state['long_name'];
				}
				// parse: county name
				var county = _.find(city_loc['address_components'], function(c) { return c['types'][0] == 'administrative_area_level_2' });
				if (county) {
					data.city_county = county['short_name'];
					data.city_county_full = county['long_name'];
				}
			}
			else if (addresses[0]) {
				// full address_component에서 city name만 가져온다.
				var c = _.last(_.select(addresses[0].address_components, function(address) { return address['types'][0] == 'locality' }));
				if (c) {
					data.city_name = c['long_name'];
					data.city_short_name = c['short_name'];
				} else {
					// administrative_area_level_1, administrative_area_level_2을 가져온다.
					var c = _.last(_.select(addresses[0].address_components, function(address) {
						return address['types'][0] == 'administrative_area_level_1' || address['types'][0] == 'administrative_area_level_2';
					}));
					if (c) {
						data.city_name = c['long_name'];
						data.city_short_name = c['short_name'];
					} else {
						// 결국 없음
						Ti.API.warn('  geocoding: no city found');
					}
				}
			}

			// parse: address
			data.address = (addresses[0] ? addresses[0]['formatted_address'] : undefined);

			Ti.API.info('  ' + data.address);
		} else {
			Ti.API.info('google geocode error: ' + lat + ', ' + lon);
		}
		
		_.isFunction(callback) && callback(data);
	});
}




