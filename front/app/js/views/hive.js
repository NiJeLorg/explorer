var BB = require('backbone');
var d3 = require('d3');

var HiveView = BB.View.extend({

className: 'chart',
initialize: function(data){
	this.data = data;
	this.render();
},

hive: function(){

	console.log("drawing hive with", this.data);
	
	var w = this.$el.width(),
	    h = this.$el.height(),
		div = d3.select(this.el);

	var horizontal = d3.scale.ordinal().domain(d3.range(3)).rangePoints([-(w / 3), (w / 3)]),
		vertical = d3.scale.linear().range([-(h / 2.5), (h / 2.2)]);
		
	var line = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate(function(points) { return points.join("A 500,500 0 0 0 "); });
		
	var nodes = [
	  {x: 0, y: 0.3},
	  {x: 0, y: 0.9},
	  {x: 1, y: 0.1},
	  {x: 1, y: 0.8},
	  {x: 2, y: 0.1},
	  {x: 2, y: 0.8}
	];

	var links = [
	  {source: nodes[2], target: nodes[0]},
	  {source: nodes[2], target: nodes[1]},
	  {source: nodes[2], target: nodes[4]},
	  {source: nodes[3], target: nodes[1]},
	  {source: nodes[3], target: nodes[4]},
	  {source: nodes[3], target: nodes[5]}
	];

	// create array of x,y pairs for source and target links
	var pairs = [];
	$.each(links, function( i, d ) {
		pairs.push([{x: horizontal(d.source.x), y: vertical(d.source.y)}, {x: horizontal(d.target.x), y: vertical(d.target.y)}]);
	});

	var svg = div.selectAll('svg')
		.data([{rotation:0, x: w / 2, y: h / 2}]).enter()
		.append('svg')
		.attr("preserveAspectRatio", "xMidYMid meet")
		.attr("viewBox", "0 0 " + w + " " + h)
		.attr('class', 'resize-chart')
		.attr('width', w)
		.attr('height', h)
		.append('g')
		.attr('class', 'svg-chart')
		.attr('transform', function(d){
			return 'translate('+d.x+','+d.y+')';}
			);

	svg.selectAll(".axis")
	    .data(d3.range(3))
	  .enter().append("line")
	    .attr("class", "axis")
		.attr("transform", function(d) { return "translate(" + horizontal(d) + "), rotate(-90)"; })
	    .attr("x1", vertical.range()[0])
	    .attr("x2", vertical.range()[1]);
	
	svg.selectAll(".link")
	    .data(pairs)
	  .enter().append("path")
	    .attr("class", "link")
		.attr("d", line);
	
	svg.selectAll(".node")
	    .data(nodes)
	  .enter().append("circle")
	    .attr("class", "node")
	    .attr("cy", function(d) { return vertical(d.y); })
	    .attr("cx", function(d) { return horizontal(d.x); })
	    .attr("r", 5)
  	  	.on("mouseover", nodeMouseover)
        .on("mouseout", mouseout);

    // Highlight the node and connected links on mouseover.
    function nodeMouseover(d) {
      svg.selectAll(".link").classed("active", function(p) { 
      	var check = {x: horizontal(d.x), y: vertical(d.y)};
      	return (p[0].x === check.x && p[0].y === check.y) || (p[1].x === check.x && p[1].y === check.y); 
      });

      d3.select(this).classed("active", true);
      //info.text(d.node.name);
    }

    // Clear any highlighted nodes or links.
    function mouseout() {
      svg.selectAll(".active").classed("active", false);
      //info.text(defaultInfo);
    }


},


});

module.exports = HiveView;
