'use strict';

app.factory('ClickFactory', function($timeout){ 
	 
	var ClickFactory = {
		
		buttonReact: function(elem) {
			elem.addClass('pressed');
			$timeout(function() {
		        elem.removeClass('pressed');
		    }, 500);
		},

		linkReact: function(elem) {
			elem.addClass('bold');
			$timeout(function() {
		        elem.removeClass('bold');
		    }, 500);
		},

		mapLinkReact: function(elem) {
			elem.addClass('map-link');
			$timeout(function() {
		        elem.removeClass('map-link');
		    }, 500);
		},

	};

	return ClickFactory;
});