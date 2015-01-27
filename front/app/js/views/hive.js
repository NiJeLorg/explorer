var _  = require('underscore');
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
		div = d3.select(this.el),
		me = this;

	var links = this.data.links;
	var nodes = this.data.nodes;

	var maxFacultyPad = this.data.max[0].maxFaculty;
	var maxProjectsPad = this.data.max[0].maxProjects;
	var maxTopicsPad = this.data.max[0].maxTopics;

	var horizontal = d3.scale.ordinal().domain(d3.range(3)).rangePoints([-(w / 3.5), (w / 3.5)]),
		facultyVertical = d3.scale.linear().domain([0, maxFacultyPad]).range([-(h / 2.5), (h / 3)]);
		projectVertical = d3.scale.linear().domain([0, maxProjectsPad]).range([-(h / 2.08), (h / 2.5)]);
		topicVertical = d3.scale.linear().domain([0, maxTopicsPad]).range([-(h / 3), (h / 3.5)]);
		

	var line = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate(function(points) { return points.join("A 500,500 0 0 0 "); });
	

	// create array of x,y pairs for source and target links
	var pairs = [];
	var targetVert;
	$.each(links, function( i, d ) {
		if (d.target.attributes.flag == 'faculty') {
    		targetVert = facultyVertical(d.target.attributes.y);
    	} else if (d.target.attributes.flag == 'project') {
    		targetVert = projectVertical(d.target.attributes.y);
    	} else {
    		targetVert = topicVertical(d.target.attributes.y);
    	}

		pairs.push([{x: horizontal(d.source.attributes.x), y: projectVertical(d.source.attributes.y)}, {x: horizontal(d.target.attributes.x), y: targetVert}]);
	});

	// defines the three bottom axis positions and text
	var axisObj = [
		{axis: 'Faculty', x: 0, y: maxFacultyPad, x1:-150, x2:5 },
		{axis: 'Research Projects', x: 1, y: maxProjectsPad, x1:-150, x2:5 },
		{axis: 'Topics', x: 2, y: maxTopicsPad, x1:-5, x2:150 }
	];
	var halfw = w / 2;
	var halfh = h / 2;
	var svg = div.append('svg')
		.attr("preserveAspectRatio", "xMidYMid meet")
		.attr("viewBox", "0 0 " + w + " " + h)
		.attr('class', 'resize-chart')
		.attr('width', w)
		.attr('height', h)
		.append('g')
		.attr('class', 'svg-chart')
		.attr('transform', 'translate('+halfw+','+halfh+')' );

	svg.selectAll(".axis")
	    .data(axisObj)
	  .enter().append("line")
	    .attr("class", "axis")
		.attr("transform", function(d) {
			var vert;
	    	if (d.axis == 'Faculty') {
	    		vert = facultyVertical(d.y);
	    	} else if (d.axis == 'Research Projects') {
	    		vert = projectVertical(d.y);
	    	} else {
	    		vert = topicVertical(d.y);
	    	}			 
			return "translate(" + horizontal(d.x) + ", " + vert + ")"; 
		})
	    .attr("x1", function(d) { return d.x1; })
	    .attr("x2", function(d) { return d.x2; });

	svg.selectAll(".text")
	    .data(axisObj)
	  .enter().append("text")
		.attr("class", "axisText")
		.attr("transform", function(d) {
			var hori;
			var vert;
	    	if (d.axis == 'Faculty') {
	    		hori = horizontal(d.x) - 150;
	    		vert = facultyVertical(d.y) + 18;
	    	} else if (d.axis == 'Research Projects') {
	    		hori = horizontal(d.x) - 150;
	    		vert = projectVertical(d.y) + 18;
	    	} else {
	    		hori = horizontal(d.x) + 108;
	    		vert = topicVertical(d.y) + 18;
	    	}
			return "translate(" + hori + ", " + vert + ")"; 
		})
	    .text(function(d) { 
	    	return d.axis;
		});
	
	svg.selectAll(".link")
	    .data(pairs)
	  .enter().append("path")
	    .attr("class", "link")
		.attr("d", line);
	
	svg.selectAll(".node")
	    .data(nodes)
	  .enter().append("circle")
	    .attr("class", "node")
	    .attr("id", function(d) { 
	    	return d.cid;
	    })
	    .attr("cy", function(d) { 
	    	if (d.attributes.flag == 'faculty') {
	    		return facultyVertical(d.attributes.y);
	    	} else if (d.attributes.flag == 'project') {
	    		return projectVertical(d.attributes.y);
	    	} else {
	    		return topicVertical(d.attributes.y);
	    	}
	    })
	    .attr("cx", function(d) { return horizontal(d.attributes.x); })
	    .attr("r", 3)
	    .on('click', function(d, i){
	    	console.log(d);			
			me.showModal(d.cid); 
		})
  	  	.on("mouseover", nodeMouseover)
        .on("mouseout", mouseout);

    // Highlight the node and connected links on mouseover.
    function nodeMouseover(d) {
    	//console.log(d);
		svg.selectAll(".link").classed("active", function(p) { 
			if (d.attributes.flag == 'faculty') {
				targetVert = facultyVertical(d.attributes.y);
			} else if (d.attributes.flag == 'project') {
				targetVert = projectVertical(d.attributes.y);
			} else {
				targetVert = topicVertical(d.attributes.y);
			}
			var check = {x: horizontal(d.attributes.x), y: targetVert};
			return (p[0].x === check.x && p[0].y === check.y) || (p[1].x === check.x && p[1].y === check.y); 
		});

		// hover text collectors
		var hoverTextProjectsRight = [];
		var hoverTextProjectsLeft = [];
		var hoverTextFaculty = [];
		var hoverTextTopics = [];

		// width of box for wrapping
		var wrapWidthProjects = w / 4;
		var wrapWidthFacTopics = w / 6;
		var horiCenterProject;
		var horiCenterFacTopic;

		// height set to crop title to one line
		var chopTitleHeight = 700;
		var chopTitleLengthProject = parseInt(w / 30);
		var chopTitleLengthTopic = parseInt(w / 40);

		// iterate through linkages and find those that are related to d; set those to active
		$.each(links, function( i, j ) {
			if ((j.source.attributes.x === d.attributes.x && j.source.attributes.y === d.attributes.y) || (j.target.attributes.x === d.attributes.x && j.target.attributes.y === d.attributes.y)) {
				// set class active for selected sources and targets
				var sourceSelector = "#" + j.source.cid;
				svg.select(sourceSelector).classed("active", true).attr("r", 8);
				var targetSelector = "#" + j.target.cid;
				svg.select(targetSelector).classed("active", true).attr("r", 8);

				// mark as moused over
				var moSource;
				var moTarget;
				var chopSource;
				var chopTarget;

				if ((j.source.attributes.x === d.attributes.x && j.source.attributes.y === d.attributes.y)) {
					moSource = true;
					horiCenterProject = 12;
					chopSource = false;
				} else {
					moSource = false;
					horiCenterProject = 6;
					chopSource = true;
				}

				if ((j.target.attributes.x === d.attributes.x && j.target.attributes.y === d.attributes.y)) {
					moTarget = true;
					horiCenterFacTopic = 12;
					chopTarget = false;
				} else {
					moTarget = false;
					horiCenterFacTopic = 6;
					chopTarget = true;
				}

				// write out text for selected nodes
				var hori, vert, text;
				var len, curr, prev, input, output, sourceName, targetName;

				sourceName = j.source.attributes.title;
				if (typeof sourceName !== "undefined") {
					// if the window height is too small, then keep project titles to one line
					if (h < chopTitleHeight && sourceName.length >= chopTitleLengthProject && chopSource === true) {
						len = chopTitleLengthProject;
						curr = len; 
						prev = 0;
						input = sourceName;
						output = [];
						while(input[curr]) {
						  if(input[curr++] == ' ') {
							output.push(input.substring(prev,curr));
							prev = curr;
							curr += len;
						  }
						}
						output.push(input.substr(prev));
						sourceName = output[0] + '...';								
					} 
				}

				if (j.target.attributes.flag == 'faculty') {
					targetName = j.target.attributes.full_name;
				} else {
					targetName = j.target.attributes.name;
				}

				if (typeof targetName !== "undefined" && j.target.attributes.flag == 'topic') {
					if (h < chopTitleHeight && targetName.length >= chopTitleLengthTopic && chopTarget === true) {
						len = chopTitleLengthTopic;
						curr = len;
						prev = 0;
						input = targetName;
						output = [];
						while(input[curr]) {
						  if(input[curr++] == ' ') {
							output.push(input.substring(prev,curr));
							prev = curr;
							curr += len;
						  }
						}
						output.push(input.substr(prev)); 
						targetName = output[0] + '...';								
					} 					
				}

				// source on hover text
				// set text anchor if even or odd
				if ((j.source.attributes.y % 2) == 1) {
					hori = horizontal(j.source.attributes.x) + 15;
					vert = projectVertical(j.source.attributes.y) - horiCenterProject;
					text = sourceName;
					hoverTextProjectsRight.push({id: j.source.cid, text: text, hori: hori, vert: vert, mo: moSource}); 
				} else {
					hori = horizontal(j.source.attributes.x) - (15 + wrapWidthProjects);
					vert = projectVertical(j.source.attributes.y) - horiCenterProject;
					text = sourceName;
					hoverTextProjectsLeft.push({id: j.source.cid, text: text, hori: hori, vert: vert, mo: moSource}); 
				}

				// target on hover text
				if (j.target.attributes.flag == 'faculty') {
					hori = horizontal(j.target.attributes.x) - (15 + wrapWidthFacTopics);
					vert = facultyVertical(j.target.attributes.y) - horiCenterFacTopic;
					text = targetName;
					hoverTextFaculty.push({id: j.target.cid, text: text, hori: hori, vert: vert, mo: moTarget});
				} else {
					hori = horizontal(j.target.attributes.x) + 15;
					vert = topicVertical(j.target.attributes.y) - horiCenterFacTopic;
					text = targetName;
					hoverTextTopics.push({id: j.target.cid, text: text, hori: hori, vert: vert, mo: moTarget}); 
				}


			}
		});

		d3.select(this).classed("activeMouseover", true).attr("r", 10);

		// remove duplicates from hover text
		hoverTextProjectsRight = _.uniq(hoverTextProjectsRight, function(n){
			return n.id;
		});

		hoverTextProjectsLeft = _.uniq(hoverTextProjectsLeft, function(n){
			return n.id;
		});

		hoverTextFaculty = _.uniq(hoverTextFaculty, function(n){
			return n.id;
		});

		hoverTextTopics = _.uniq(hoverTextTopics, function(n){
			return n.id;
		});

     	// add text
		svg.selectAll(".hoverTextProjectsRight")
			.data(hoverTextProjectsRight)
		  .enter().append('foreignObject')
		    .attr("class", "hoverTextProjectsRight")
		  	.attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
		  	.attr('x', function(d) {
				return d.hori; 
			})
            .attr('y', function(d) {
				return d.vert; 
			})
            .attr('width', wrapWidthProjects)
            .attr('height', 100)
            .append('xhtml:div')
            .append('p')
            .attr("class", function(d) { 
            	if (d.mo === true) {
            		return "hoverBigBold";
            	} else {
            		return 'hoverNormal';
            	}
			})
		    .html(function(d) { 
		    	return d.text;
			});


		svg.selectAll(".hoverTextProjectsLeft")
			.data(hoverTextProjectsLeft)
		  .enter().append('foreignObject')
			.attr("class", "hoverTextProjectsLeft")
		  	.attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
		  	.attr('x', function(d) {
				return d.hori; 
			})
            .attr('y', function(d) {
				return d.vert; 
			})
            .attr('width', wrapWidthProjects)
            .attr('height', 100)
            .append('xhtml:div')
            .append('p')
            .attr("class", function(d) { 
            	if (d.mo === true) {
            		return "text-right hoverBigBold";
            	} else {
            		return 'text-right hoverNormal';
            	}
			})
		    .html(function(d) { 
		    	return d.text;
			});

		svg.selectAll(".hoverTextFaculty")
			.data(hoverTextFaculty)
		  .enter().append('foreignObject')
			.attr("class", "hoverTextFaculty")
		  	.attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
		  	.attr('x', function(d) {
				return d.hori; 
			})
            .attr('y', function(d) {
				return d.vert; 
			})
            .attr('width', wrapWidthFacTopics)
            .attr('height', 100)
            .append('xhtml:div')
            .append('p')
            .attr("class", function(d) { 
            	if (d.mo === true) {
            		return "text-right hoverBigBold";
            	} else {
            		return 'text-right hoverNormal';
            	}
			})
		    .html(function(d) { 
		    	return d.text;
			});

		svg.selectAll(".hoverTextTopics")
			.data(hoverTextTopics)
		  .enter().append('foreignObject')
		    .attr("class", "hoverTextTopics")
		  	.attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
		  	.attr('x', function(d) {
				return d.hori; 
			})
            .attr('y', function(d) {
				return d.vert; 
			})
            .attr('width', wrapWidthFacTopics)
            .attr('height', 100)
            .append('xhtml:div')
            .append('p')
            .attr("class", function(d) { 
            	if (d.mo === true) {
            		return "hoverBigBold";
            	} else {
            		return 'hoverNormal';
            	}
			})
		    .html(function(d) { 
		    	return d.text;
			});

    }

    // Clear any highlighted nodes or links.
    function mouseout() {
      svg.selectAll(".active").classed("active", false);
      svg.selectAll(".activeMouseover").classed("activeMouseover", false);
      svg.selectAll(".node").attr("r", 3);
      svg.selectAll(".hoverTextProjectsRight").remove();
      svg.selectAll(".hoverTextProjectsLeft").remove();
      svg.selectAll(".hoverTextFaculty").remove();
      svg.selectAll(".hoverTextTopics").remove();
    }


},

showModal: function(index){
	var modalId = '#modal' + index;
	$(modalId).modal('show');
},


});

module.exports = HiveView;
