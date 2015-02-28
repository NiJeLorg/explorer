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

	var maxFacultyPad = this.data.max[0].maxFaculty + 0.5;
	var maxProjectsPad = this.data.max[0].maxProjects + 1.2;
	var maxTopicsPad = this.data.max[0].maxTopics + 1;

	var horizontal = d3.scale.ordinal().domain(d3.range(3)).rangePoints([-(w / 3.5), (w / 3.5)]),
		facultyVertical = d3.scale.linear().domain([0, maxFacultyPad]).range([-(h / 2.5), (h / 3)]);
		projectVertical = d3.scale.linear().domain([0, maxProjectsPad]).range([-(h / 2.08), (h / 2.5)]);
		topicVertical = d3.scale.linear().domain([0, maxTopicsPad]).range([-(h / 3), (h / 3.5)]);
		

	var line = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate(function(points) { return points.join("A 782,782 0 0 0 "); });
	

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

	// create a clickable box under the nodes and links that will clear any mouseover interaction stuff
	svg.append('rect')
		.attr('width', w)
		.attr('height', h)
		.attr('transform', 'translate(-'+halfw+',-'+halfh+')' )
		.attr("class", "rect")
		.on("click", mouseout);


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
	    .attr("class", "link active")
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
	    // links to faculty webpages, modals for all other objects
	    .on('click', function(d, i){
	    	if (d.attributes.flag == 'faculty') {
				var url = d.attributes.home_page;
		        window.open(url, '_blank');
			} else {
				me.showModal(d.cid); 				
			}
			
		})
  	  	.on("mouseover", nodeMouseover);
        //.on("mouseout", mouseout);


	// text initial parameters
	var wrapWidthProjects = w / 4;
	var wrapWidthFacTopics = w / 6;
	var horiCenterProject = 12;
	var horiCenterFacTopic = 6;

	// height set to crop title to one line
	var chopTitleHeight = 700;
	var chopTitleLengthProject = parseInt(w / 30);
	var chopTitleLengthTopic = parseInt(w / 40);



	svg.selectAll(".textNames")
	    .data(nodes)
	  .enter().append('foreignObject')
		.attr("class", "textNames")
	  	.attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
	    .attr("id", function(d) {
	    	return d.cid;
	    })
	    .attr("y", function(d) { 
	    	if (d.attributes.flag == 'faculty') {
	    		return facultyVertical(d.attributes.y) - horiCenterFacTopic;
	    	} else if (d.attributes.flag == 'topic') {
	    		return topicVertical(d.attributes.y) - horiCenterFacTopic;
	    	} else {
	    	}
	    })
	    .attr("x", function(d) { 
	    	if (d.attributes.flag == 'faculty') {
	    		return horizontal(d.attributes.x) - (15 + wrapWidthFacTopics);
	    	} else if (d.attributes.flag == 'topic') {
	    		return horizontal(d.attributes.x) + 15;
	    	} else {
	    	}
	    })
        .attr('width', wrapWidthFacTopics)
        .attr('height', 100)
        .append('xhtml:div')
        .append('p')
        .attr("class", function(d) {
        	if (d.attributes.flag == 'faculty') {
        		return 'text-right hoverNormal';
        	} else {
        		return 'hoverNormal';
        	}
        })
	    .html(function(d) {
	    	var textName, len, curr, prev, input, output;
	    	if (d.attributes.flag == 'faculty') {
	    		textName = d.attributes.full_name;
	    	} else if (d.attributes.flag == 'topic') {
	    		textName = d.attributes.name;
	    		if (h < chopTitleHeight && textName.length >= chopTitleLengthTopic) {
					len = chopTitleLengthTopic;
					curr = len; 
					prev = 0;
					input = textName;
					output = [];
					while(input[curr]) {
					  if(input[curr++] == ' ') {
						output.push(input.substring(prev,curr));
						prev = curr;
						curr += len;
					  }
					}
					output.push(input.substr(prev));
					textName = output[0] + '...';								
				} 
	    	} else {
	    		textName = '';
	    	}

	    	return textName;


		})
	    // links to faculty webpages, modals for all other objects
	    .on('click', function(d, i){
	    	if (d.attributes.flag == 'faculty') {
				var url = d.attributes.home_page;
		        window.open(url, '_blank');
			} else {
				me.showModal(d.cid); 				
			}
			
		});




    // Highlight the node and connected links on mouseover.
    function nodeMouseover(d) {
    	// hide faculty and topic text
    	$(".textNames").hide();

    	// remove all other items from other mouse overs
    	svg.selectAll(".active").classed("active", false);
		svg.selectAll(".activeMouseover").classed("activeMouseover", false);
		svg.selectAll(".node").attr("r", 3);
		svg.selectAll(".hoverTextProjectsRight").remove();
		svg.selectAll(".hoverTextProjectsLeft").remove();
		svg.selectAll(".hoverTextFaculty").remove();
		svg.selectAll(".hoverTextTopics").remove();

		// bulid related nodes to class links and nodes as active
		var relatedNodes = [];
		// add node moused over
		relatedNodes.push(d);

		// get first order relations
		$.each(links, function( i, j ) {
			if ((j.source.attributes.x === d.attributes.x && j.source.attributes.y === d.attributes.y) || (j.target.attributes.x === d.attributes.x && j.target.attributes.y === d.attributes.y)) {
				if (j.source.attributes.x === d.attributes.x && j.source.attributes.y === d.attributes.y) {
					relatedNodes.push(j.target);
				} else if (j.target.attributes.x === d.attributes.x && j.target.attributes.y === d.attributes.y) {
					relatedNodes.push(j.source);
				}
			}
		});

		// if moused over d is a faculty node or a topic node, get second order relations
		if (d.attributes.flag == 'faculty') {
			// get topic relations to related nodes
			$.each(relatedNodes, function( g, h ) {
				$.each(links, function( i, j ) {
					if ((j.source.attributes.x === h.attributes.x && j.source.attributes.y === h.attributes.y) && j.target.attributes.flag == 'topic') {
						relatedNodes.push(j.target);
					}
				});
			});
		} else if (d.attributes.flag == 'topic') {
			// get faculty relations to related nodes
			$.each(relatedNodes, function( g, h ) {
				$.each(links, function( i, j ) {
					if ((j.source.attributes.x === h.attributes.x && j.source.attributes.y === h.attributes.y) && j.target.attributes.flag == 'faculty') {
						relatedNodes.push(j.target);
					}
				});
			});
		}

		// create unique relatedNodes
		relatedNodes = _.uniq(relatedNodes, function(n){
			return n.cid;
		});

		svg.selectAll(".link").classed("active", function(p) { 
			var nodeCount = 0;
			$.each(relatedNodes, function( i, j ) {
				if (j.attributes.flag == 'faculty') {
					targetVert = facultyVertical(j.attributes.y);
				} else if (j.attributes.flag == 'project') {
					targetVert = projectVertical(j.attributes.y);
				} else {
					targetVert = topicVertical(j.attributes.y);
				}
				var check = {x: horizontal(j.attributes.x), y: targetVert};
				if ((p[0].x === check.x && p[0].y === check.y) || (p[1].x === check.x && p[1].y === check.y)) {
					nodeCount++;	
				} 
			});

			if (nodeCount >= 1) {
				return true;
			} else {
				return false;
			}

		});



		// hover text collectors
		var hoverTextProjectsRight = [];
		var hoverTextProjectsLeft = [];
		var hoverTextFaculty = [];
		var hoverTextTopics = [];


		console.log(relatedNodes);

		// set related nodes to active and display text amking sure that the active moused over node is big and bold
		$.each(relatedNodes, function( i, j ) {
			// set each node to active class and r = 8
			var selector = "#" + j.cid;

			// is this the moused over node?
			var mo, chop;
			if (j == d) {
				mo = true;
				chop = false;
				svg.select(selector).classed("activeMouseover", true).attr("r", 10);
				horiCenterProject = 12;
				horiCenterFacTopic = 12;
			} else {
				mo = false;
				chop = true;
				svg.select(selector).classed("active", true).attr("r", 8);
				horiCenterProject = 6;
				horiCenterFacTopic = 6;
			}

			// set text postion, size and chop text for selected nodes
			var hori, vert, text;
			var len, curr, prev, input, output, printName, chopTitleLength;

			if (j.attributes.flag == 'faculty') {
				printName = j.attributes.full_name;
				chopTitleLength = chopTitleLengthTopic;
			} else if (j.attributes.flag == 'project') {
				printName = j.attributes.title;
				chopTitleLength = chopTitleLengthProject;
			} else {
				printName = j.attributes.name;
				chopTitleLength = chopTitleLengthTopic;
			}

			if (typeof printName !== "undefined") {
				// if the window height is too small, then keep project titles to one line
				if (h < chopTitleHeight && printName.length >= chopTitleLength && chop === true) {
					len = chopTitleLength;
					curr = len; 
					prev = 0;
					input = printName;
					output = [];
					while(input[curr]) {
					  if(input[curr++] == ' ') {
						output.push(input.substring(prev,curr));
						prev = curr;
						curr += len;
					  }
					}
					output.push(input.substr(prev));
					printName = output[0] + '...';								
				} 
				if (j.attributes.flag == 'project') {
					vert = projectVertical(j.attributes.y) - horiCenterProject;
					text = printName;
					if ((j.attributes.y % 2) == 1) {
						hori = horizontal(j.attributes.x) + 15;
						hoverTextProjectsRight.push({id: j.cid, text: text, hori: hori, vert: vert, mo: mo});
					} else {
						hori = horizontal(j.attributes.x) - (15 + wrapWidthProjects);
						hoverTextProjectsLeft.push({id: j.cid, text: text, hori: hori, vert: vert, mo: mo});
					}
					 
				} else if (j.attributes.flag == 'faculty') {
					hori = horizontal(j.attributes.x) - (15 + wrapWidthFacTopics);
					vert = facultyVertical(j.attributes.y) - horiCenterFacTopic;
					text = printName;
					hoverTextFaculty.push({id: j.cid, text: text, hori: hori, vert: vert, mo: mo});
				} else {
					hori = horizontal(j.attributes.x) + 15;
					vert = topicVertical(j.attributes.y) - horiCenterFacTopic;
					text = printName;
					hoverTextTopics.push({id: j.cid, text: text, hori: hori, vert: vert, mo: mo}); 
				}

			}


		});

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
		svg.selectAll(".link").classed("active", true);
		svg.selectAll(".activeMouseover").classed("activeMouseover", false);
		svg.selectAll(".node").attr("r", 3);
		svg.selectAll(".hoverTextProjectsRight").remove();
		svg.selectAll(".hoverTextProjectsLeft").remove();
		svg.selectAll(".hoverTextFaculty").remove();
		svg.selectAll(".hoverTextTopics").remove();
		// show normal faculty and topic text
		$(".textNames").show();

    }


},

showModal: function(index){
	var modalId = '#modal' + index;
	$(modalId).modal('show');
},


});

module.exports = HiveView;
