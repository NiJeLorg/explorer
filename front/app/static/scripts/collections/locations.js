define([
'appconfig',
'jquery',
'underscore',
'backbone',
'collections/related',
'models/location'
], function (config, $, _, BB, Related, Location) {
var Locations = Related.extend({
	menuName: 'countries',
	comparator: 'name',
    key: 'locations',
	url: config.api('location/'),

	initialize: function(){
		Related.prototype.initialize.apply(this, arguments);
	},

	parse: function( response ){
		return response;
	},

	model: Location,
	spans: {
		'related_topics': {
			'bridge_attribute': 'works',
			'other_attribute': 'topics',
		},
		'related_faculty': {
			'bridge_attribute': 'works',
			'other_attribute': 'authors',
		},
		'related_locations': {
			'bridge_attribute': 'works',
			'other_attribute': 'locations',
		},
	},

	globeData: function(){
		return this.filter(function (m){
			//return m.get('works').length > 0;
			return m.get('works').length > 0 &&
				m.get('official_id') !== 840;
		});
	},
});
return Locations;
});
