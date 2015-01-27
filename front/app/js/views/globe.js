var Events = require('../event_manager');
var Data = require('../data_manager');
var BB = require('backbone');
var d3 = require('d3');
var topojson = require('../../../node_modules/topojson/topojson.js');
var workTemplate = require('../templates/list/work_short.hbs');

var GlobeView = BB.View.extend({


className: 'chart globe',

initialize: function(data){
	this.data = data;
	var me = this;
},

drawGlobe: function(){
	var me = this;
	
	var c = this.context;
	// this is meant to be called initially, and by tweens
	// clear the canvas context
	c.clearRect(0, 0, this.w, this.h);
	// fill for all the unselected countries
	this.drawFill("#aaa", this.land);
	// fill for the selected country
	this.data.forEach(function (d){
		// get corresponding color
		var fill;
		if( me.selectedCountry == d ){
			fill = '#ff4010';
		} else {
			fill = me.colorScale(d.get('works').length);
		}
		me.drawFill( fill, d.feature );
	});
	// This next line will break
	this.drawStroke("#fff", 0.5, this.borders);
	// outline for the globe itself
	this.drawStroke("#888", 1, this.globe);

},

initCanvas: function(){

	var w = 1200;
	var h = 600;
	this.w = w;
	this.h = h;
	
    this.projection = d3.geo.orthographic()
        .scale(248)
        .clipAngle(90);

    var yawScale = d3.scale.linear()
        .domain([-(w/2), w/2])
        .range([-210, 210]);

    var pitchScale = d3.scale.linear()
        .domain([-(h/2), h/2])
        .range([60, -60]);

	var div = d3.select(this.el);
	this.canvas = div.append('canvas')
		.attr('width', w)
		.attr('height', h)
		.attr('id', 'globe')
		.classed('draggable', true);

	this.context = this.canvas.node().getContext('2d');	
	
	var me = this;

	this.drag = d3.behavior.drag()
		.on('drag', function(d){
			if ( me.mouseStart ) {
				var mouse = d3.mouse(me.canvas.node());
				var dx = mouse[0] - me.mouseStart[0];
				var dy = mouse[1] - me.mouseStart[1];

				var yaw = me.currentRotation[0] + yawScale(dx);
				var pitch = me.currentRotation[1] + pitchScale(dy);
				me.projection.rotate([yaw, pitch, 0]);
				me.drawGlobe();
			}
		}).on('dragstart', function(d){
			me.currentRotation = me.projection.rotate();
			me.mouseStart = d3.mouse(me.canvas.node());
			me.canvas.classed({'dragging': true, 'draggable': false});
		}).on('dragend', function(){
			me.canvas.classed({'draggable': true, 'dragging': false});
		});


	this.canvas.call(this.drag);

	// this doesn't currently work. Why not?
	this.canvas.on('click', function(d){
		var mouse = d3.mouse(me.canvas.node());
		var lonlat = me.projection.invert(mouse);
	});
	
},

updateCountryColors: function(){
	var me = this;
	d3.selectAll('.country')
		.style('color', function(d){
			return me.colorScale(d.get('works').length);
		});
},

renderCountryList: function(){
	var me = this;
	var chart = d3.select(this.el);
	var menu = chart.append('div').classed('countryMenu', true);
	
	// copy the data before sorting.
	var data = this.data.slice(0);

	var countries = menu.selectAll('div').data(data)
		.enter().append('div')
		.classed('country', true)
		.text(function(d){
			return d.get('name');
		})
		.style('color', function(d){
			return me.colorScale(d.get('works').length);
		})
		.on('click', function(d){
			me.selectCountry(d);
			d3.selectAll('.country').classed('selected',
				function(c){
					return c === d;
				});
			Events.trigger('countrySelected', d);
		});

},

render: function(data){
	var me = this;

	this.colorStart = '#A3CAD9';
	this.colorEnd = '#0D3647';

	this.colorScale = d3.scale.linear()
		.domain([1, 6])
		.clamp(true)
		.range([this.colorStart, this.colorEnd]);

	this.$el.find('canvas').remove();

	this.initCanvas();


	var world = Data.globe;

    this.path = d3.geo.path()
        .projection(this.projection)
		.pointRadius(5)
        .context(this.context);

    this.globe = {type: "Sphere"};

    this.land = topojson.feature(world, world.objects.land);
	this.countries = topojson.feature( world, world.objects.countries );
    this.borders = topojson.mesh(world, world.objects.countries, 
			function(a, b) { return a.id !== b.id; });
	this.data = data;

	this.linkCountries();

	this.drawGlobe();

	this.renderCountryList();
	
},

drawFill: function( color, pathItems){
	var c = this.context;
	c.fillStyle = color;
	c.beginPath();
	this.path(pathItems);
	c.fill();
},

drawStroke: function drawStroke( color, strokeWidth, pathItems ){
	var c = this.context;
	c.strokeStyle = color;
	c.lineWidth = strokeWidth;
	c.beginPath();
	this.path(pathItems);
	c.stroke();
},

selectCountry: function (d){
	this.selectedCountry = d;
	this.transitionToCountry(d);
	//this.displayCountryProjects(d);
	this.showCountryModal(d.id);
},

showCountryModal: function(index){
	// remove all other country modals
	$('.modal').modal('hide');
	// show modal with country list and globe enable
	var modalId = '#countryModal' + index;
	$(modalId).modal({
		backdrop: false,
		keyboard: false
	});
	$(modalId).modal('show');
	// ensure modal backdrop doesn't grey out the background
	$('.modal-backdrop').remove();
},

// previous list of projects that display next to the country globe. No longer in use

displayCountryProjects: function(d){
	var me = this;
	var chart = d3.select(this.el);
	chart.selectAll('.works').remove();
	var listing = chart.append('div')
		.classed({
			'works': true,
			'right': true
		});
	var data = d.get('works');
	listing.selectAll('div')
		.data(data).enter().append('div')
		.html(function(d){ 
			return workTemplate(d.attributes);
		})
		.classed('work', true);

},


linkCountries: function(){
	var me = this;
	this.data.forEach(function(d){
		var found = false,
			i = 0;
		if( d.get('official_id') == 702 ){
			d.feature = {
				id: 702,
				type: "Feature",
				properties: {},
				geometry: {
					type: "Point",
					coordinates: [103.8, 1.3],
				}
			};
			found = true;
		}
		while(!found && i < me.countries.features.length){
			var c = me.countries.features[i];
			if( d.get('official_id') === c.id ){
				d.feature = c;
				found = true;
			}
			i++;
		}
	});
},

tweenToPoint: function(point){
	var me = this;
	return function(){
		// This function returns a tweening function for rotating the globe
		var rotator = d3.interpolate(me.projection.rotate(), 
				[-point[0], -point[1]]
				);

		return function(t) {
			me.projection.rotate(rotator(t));
			me.drawGlobe();
		};
	};
},

getCountryPoint: function(d){
	console.log(d.feature); // undefined for the U.S. -- no geo features are getting packaged for U.S.
	return d3.geo.centroid(d.feature);
},

transitionToCountry: function(d){
	var p = this.getCountryPoint(d);
	d3.transition()
		.duration(800)
		.tween('rotate', this.tweenToPoint(p));
},

});

module.exports = GlobeView;
