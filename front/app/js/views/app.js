// imports
var BB = require('backbone');
var d3 = require('d3');
BB.$ = window.$;
var QueryView = require('../views/query');

var AppView = BB.View.extend({

	el: '#main',

	initSubViews: function () {
		this.queryView = new QueryView();
		this.$el.find('#controls').append(this.queryView.$el);
		this.$el.on('click', '.info-button', this.makeInfoToggler());
		this.$el.on('click', '.feedback-button', this.makeFeedbackToggler());
		this.$el.on('click', this.closeOnHTMLClick());

	},


    initialize: function () {
	    // bind events, 
		// render self, 
		// then initialize children
		this.initSubViews();
	},

	makeInfoToggler: function(){
		var html = $('html');
		var panel = $("#info");
		var states = { isOpen: false };
		var p = d3.selectAll("#info p");
		p.style("color", "#fff");
		return function(e){
			e.stopPropagation();
			panel.slideToggle(300);
			if( states.isOpen ){
				console.log("goodbye", states);
				p.transition()
					.duration(500)
					.style("color", "white");
				states.isOpen = false;
			} else {
				console.log("hello", states);
				p.transition()
					.duration(1400)
					.style("color", "black");
				states.isOpen = true;
			}
		};
	}, 
	
	makeFeedbackToggler: function(){
		var panel = $("#feedback");
		var states = { isOpen: false };
		var p = d3.selectAll("#feedback p");
		p.style("color", "#fff");
		return function(e){
			e.stopPropagation();
			panel.slideToggle(300);
			if( states.isOpen ){
				console.log("goodbye", states);
				p.transition()
					.duration(500)
					.style("color", "white");
				states.isOpen = false;
			} else {
				console.log("hello", states);
				p.transition()
					.duration(1400)
					.style("color", "black");
				states.isOpen = true;
			}
			panel.click(function(event){
			    event.stopPropagation();
			});

		};
	},

	closeOnHTMLClick: function(){
		var infoPanel = $("#info");
		var feedbackPanel = $("#feedback");
		var infoStates = { isOpen: false };
		var feedbackStates = { isOpen: false };
		var pInfo = d3.selectAll("#info p");
		var pFeedback = d3.selectAll("#feedback p");

		return function(e){
			console.log("click");
			infoPanel.slideUp(300);
			if( infoStates.isOpen ){
				console.log("goodbye", infoStates);
				pInfo.transition()
					.duration(500)
					.style("color", "white");
				infoStates.isOpen = false;
			} 
			feedbackPanel.slideUp(300);
			if( feedbackStates.isOpen ){
				console.log("goodbye", feedbackStates);
				pFeedback.transition()
					.duration(500)
					.style("color", "white");
				feedbackStates.isOpen = false;
			}
		};

	}

});

module.exports = AppView;
