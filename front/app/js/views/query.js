var $ = window.$;
var BB = require('../../../node_modules/backbone/backbone.js');
var MenuView = require('../views/menu'); 
var ChordView = require('../views/chord');
var GlobeView = require('../views/globe');
var ColumnsView = require('../views/columns');
var HiveView = require('../views/hive');
var ModalView = require('../views/modal');
var CountryModalView = require('../views/modal_country');
var Events = require('../event_manager'); 
var Data = require('../data_manager');

var QueryView = BB.View.extend({

	className: 'btn-group',

	initialize: function () {
		// this should initialize once
		// it should then handle the creation and destruction of menus,
		// but shouldn't render them, and shouldn't rerender itself
		var me = this;
		Events.on('foreignKeysReplaced', function(){
			me.createDefaultMenus();
		});
		Events.on('menuItemChosen', function(item, menu){
			console.log("menu item", item);
			me.handleMenuChoice(item, menu);
		});		
		this.chart = null;
		this.menus = [];
		this.initViews();
		console.log("loading query");
		Data.initializeCollections();
		this.resizeListener();
		this.feedbackForm();
	},
	
	resizeListener: function(){
		$(window).resize(function() {
			var w = ($( window ).width());
			var h = ($( window ).height() - 40);
			if ($('.resize-chart').length) {
				$('.resize-chart').attr("width", w).attr("height", h);
			}
			if ($('#globe').length) {
				var canvas = document.querySelector('canvas');
				var width = window.innerWidth;
				canvas.style.top = '20px';
				if (width < 1200) {
					var ratio = canvas.height/canvas.width;
					var height = width * ratio;
					canvas.style.width = width+'px';
					canvas.style.height = height+'px';
				} else {
					canvas.style.width = '1200px';
					canvas.style.height = '600px';
				}											
			}
		});
	},

	randomChoice: function(arr){
		return arr[Math.floor(Math.random()*arr.length)];
	},

	handleMenuChoice: function(item, menu){
		if ( menu === this.menus[0]){
			//hide all modals
			$('.modal').modal('hide');
			console.log("a new collection was chosen", item.menuName);
			this.handleSelectedCollection(item);
			this.populateInfoPane(item.menuName);
		} else if ( menu === this.menus[1] ){
			console.log("a collection option was chosen", item);
		}
	},

	createDefaultMenus: function(){
		console.log("creating default menus");
		// choose one collection randomly
		var keys = ['facultys', 'projects', 'topics', 'locations'];
		var randomChoiceKey  = this.randomChoice(keys);
		var randomChoice = Data.collections.get(randomChoiceKey);
		// get the default collections
		var choices = keys.map(function(key){ return Data.collections.get(key); });
		// add a menu with the item chosen, the possible itemsm and a handler for
		// the choice
		this.addMenu({
			choice: randomChoice,
			menuItems: choices,
		}).chooseItem('FACULTY');
	},

	feedbackForm: function(){
		console.log("setting up the feedback form");
		// hide honeypot
		$('#Address').hide();

		$('#feedback-form').on('submit', function(event){
		    event.preventDefault();
		    feedback_form_submit();
		});

		// AJAX for posting
		function feedback_form_submit() {
			var csrftoken = getCookie('csrftoken');

		    var dataString = '&name=' + $('input[id=Name]').val() + 
		    				 '&email=' + $('input[id=Email]').val() +
		    				 '&address=' + $('input[id=Address]').val() +
		    				 '&comments=' + $('textarea[id=Comments]').val() +

			
			$.ajaxSetup({
			    beforeSend: function(xhr, settings) {
			        if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
			            // Send the token to same-origin, relative URLs only.
			            // Send the token only if the method warrants CSRF protection
			            // Using the CSRFToken value acquired earlier
			            xhr.setRequestHeader("X-CSRFToken", csrftoken);
			        }
			    }
			});


			$.ajax({
		        type: "POST",
		        url: "/feedback/",
		        data: dataString,
		        success: function(data) {
		        	// clear form
		        	$('input[id=Name]').val('');
		        	$('input[id=Email]').val('');
		        	$('input[id=Address]').val('');
		            $('textarea[id=Comments]').val('');
		            // alert that form has been submitted
		            if (data.success) {
		        		alert(data.success);
		        	} else {
		        		alert(data.error);
		        	}

		        }   
		     }); 
		     return false;

		}

		// using jQuery
		function getCookie(name) {
		    var cookieValue = null;
		    if (document.cookie && document.cookie !== '') {
		        var cookies = document.cookie.split(';');
		        for (var i = 0; i < cookies.length; i++) {
		            var cookie = jQuery.trim(cookies[i]);
		            // Does this cookie string begin with the name we want?
		            if (cookie.substring(0, name.length + 1) == (name + '=')) {
		                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
		                break;
		            }
		        }
		    }
		    return cookieValue;
		}

		function csrfSafeMethod(method) {
		    // these HTTP methods do not require CSRF protection
		    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
		}
		function sameOrigin(url) {
		    // test that a given url is a same-origin URL
		    // url could be relative or scheme relative or absolute
		    var host = document.location.host; // host + port
		    var protocol = document.location.protocol;
		    var sr_origin = '//' + host;
		    var origin = protocol + sr_origin;
		    // Allow absolute or scheme relative URLs to same origin
		    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
		        (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
		        // or any other URL that isn't scheme relative or absolute i.e relative.
		        !(/^(\/\/|http:|https:).*/.test(url));
		}

	},

	handleSelectedCollection: function(coll){
		// remove any existing chart
		console.log("handling choice", coll);
		if( this.chart ){
			this.chart.$el.remove();
			console.log("removedChart");
		}
		if( coll.viewOptions ){
			// if this collection has multiple view options
			// then select one at random and add a menu of the different options
			var randomChoice = this.randomChoice(coll.viewOptions);
			this.addMenu({
				choice: randomChoice,
				menuItems: coll.viewOptions,
			}).chooseItem(randomChoice);
			// currently there is no handler for view options
		} else {
			if( coll.key == 'locations' ){
				console.log("rendering globe view with", coll.globeData());
				this.renderGlobeView(coll.globeData());
				this.renderCountryModalView(coll);
				console.log("viewport listener initiated");
				this.resizeListener(coll.globeData());
			} else if( coll.key == 'works' ){
				this.renderColumnsView(coll);
			} else if( coll.key == 'projects' ){
				console.log("rendering project view with", coll.graphData());
				this.renderProjectView(coll.graphData());
				this.renderModalView(coll.dataForModal());
				console.log("viewport listener initiated");
				this.resizeListener(coll.graphData());
			} else {
				console.log("rendering chord view with", coll.graphData());
				this.renderChordView(coll.graphData());
				this.renderModalView(coll);
				console.log("viewport listener initiated");
				this.resizeListener(coll.graphData());
			}
		}
		
	},


	addMenu: function (options) {
		// append a new menu
		// ensure that the menus are aware of each other
		var rightMostMenu = this.menus[this.menus.length - 1];
		var newMenu = new MenuView(options, rightMostMenu);
		if( rightMostMenu !== undefined ) {
			rightMostMenu.right = newMenu;
		}
		this.menus.push(newMenu);
		this.$el.append(newMenu.$el);
		return newMenu;
	},

	removeMenu: function (slot) {
	},

	initViews: function(){
		this.views = {
			'globe': new GlobeView(),
		};
	},

	renderGlobeView: function(data){
		var view = this.views.globe;
		this.chart = view;
		$("#chart").append(view.$el);
		console.log("appended", view);
		view.render(data);
		var canvas = document.querySelector('canvas');
		var width = window.innerWidth;
		canvas.style.top = '20px';
		if (width < 1200) {
			var ratio = canvas.height/canvas.width;
			var height = width * ratio;
			canvas.style.width = width+'px';
			canvas.style.height = height+'px';			
		} else {
			canvas.style.width = '1200px';
			canvas.style.height = '600px';
		}
		
	},

	renderChordView: function(data){
		var view = new ChordView(data);
		this.chart = view;
		$("#chart").append(view.$el);
		console.log("appended", view);
		view.chord();
	},
	
	renderProjectView: function(data){
		var view = new HiveView(data);
		this.chart = view;
		$("#chart").append(view.$el);
		console.log("appended", view);
		view.hive();
	},

	renderColumnsView: function(data){
		var view = new ColumnsView(data);
		this.chart = view;
		$("#chart").append(view.$el);
		console.log("appended", view);
		view.render(data);
	},
	
	renderModalView: function(data){
		var modals = new ModalView(data);
		$("#modals").append(modals.$el);
		console.log("appended chord modals", modals);
		modals.render(data);
	},
	
	renderCountryModalView: function(data){
		var countryModals = new CountryModalView(data);
		$("#modals").append(countryModals.$el);
		console.log("appended country modals", countryModals);
		countryModals.render(data);
	},
	
	populateInfoPane: function(choice){
		if (choice === 'FACULTY') {
			$('#info').html('<div class="container"><div class="row"><div class="col-sm-8"><div id="onboarding-gif"><img src="/static/gifs/dusp-faculty-chord.gif" alt="Faculty Chord GIF" /></div></div><div class="col-sm-4"><div id="onboarding-text"><p><strong>DUSP EXPLORER</strong> is an online, interactive visualization of MIT’s Department of Urban Studies & Planning. Here you can find information about our current faculty, where we work, and how our projects intersect with each other and connect with the central themes of urban planning and design.</p><p>Using the drop-down menu at the top of the page, you can begin to explore our department using the following lenses:</p><p><strong>Faculty:</strong> By default, the circumference of the Explorer displays all of our nearly 30 full-time professors. Hover over a name and you can see the intellectual connections that link that person with others in the department. By moving the mouse closer into the circle, you can trace any one of these links and drop the others. You can also rotate the Explorer by clicking and holding the mouse and dragging the diagram around the circumference. Finally, you can see a detailed view of each faculty member and their projects, publications, and collaborations by clicking on the faculty member\'s name.</p></div></div></div></div>');

		} else if (choice === 'TOPICS') {
			$('#info').html('<div class="container"><div class="row"><div class="col-sm-6"><div id="onboarding-text"><p><strong>Topics:</strong> “Themes” are displayed around the circumference, and the individual faculty become the “links” between them. Hover over a topic and the Explorer will highlight connections with other themes, displaying the names of the faculty working at the intersections in the center of the circle. Clicking on the topic name will also show you a detialed list of all projects, publications, and faculty working within this topic.</p></div></div></div></div>');
		} else if (choice === 'COUNTRIES') {
			$('#info').html('<div class="container"><div class="row"><div class="col-sm-6"><div id="onboarding-text"><p><strong>Countries:</strong> An interactive globe with project locations shown in blue. The globe can be rotated by dragging the mouse. When you click on the country names at the left, the Explorer will display list of projects, publications, and faculty working in that country.</p></div></div></div></div>');		
		} else if (choice === 'PROJECTS') {
			$('#info').html('<div class="container"><div class="row"><div class="col-sm-6"><div id="onboarding-text"><p><strong>Projects:</strong> The projects view shows the linkages between projects, faculty, and topics. Hover over any project dot and see the links between that project and the faculty and topics involved. Hover over the faculty or topic dots to see which projects are associated.</p></div></div></div></div>');
		} else {}
	},

});

module.exports = QueryView;
