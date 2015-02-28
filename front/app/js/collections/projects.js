var _  = require('underscore');
var Related = require('../collections/related');
var Project = require('../models/project');

var Projects = Related.extend({

	menuName: 'PROJECTS',
	key: 'projects',
	comparator: 'title',
	model: Project,

	parse:function( response ){
		return response;
	}, 

	initialize: function(){
		Related.prototype.initialize.apply(this, arguments);
		this.defineRelations();
	},

	defineRelations: function(){
		// args: (           att_name,     targetCollection[, reverse_att_name] )
		this.defineRelation( 'faculty',    'facultys',        'projects' );
		this.defineRelation( 'topics',     'topics',          'projects' );
		this.defineRelation( 'locations',  'locations',       'projects' );
	},


	graphData: function(){
		var data = {};
		// for the hive plot we need groups of nodes and links 
		// ordinal x and list y coordinates for nodes
		// source and target gorups of nodes for links  
		data.links = [];
		data.nodes = [];
		data.max = [];
		var facultyNodes = [];
		var topicsNodes = [];

		// ensure nodes are sorted by project title
		this.models = _.sortBy(this.models, function(n) {
			return n.attributes.title;
		});


		// loop through project models and pull faculty and topic nodes
		this.models.forEach(function(m, i){
			// add x,y to nodes
			m.attributes.flag = 'project';
			m.attributes.x = 1;
			m.attributes.y = i;
			data.nodes.push(m);

			// collect faculty nodes 
			var facultyNode = m.getCommonRelations(m, 'faculty');
			facultyNode.forEach(function(d) {
				facultyNodes.push(d);
			});
			
			// collect topic nodes 
			var topicsNode = m.getCommonRelations(m, 'topics');
			topicsNode.forEach(function(d) {
				topicsNodes.push(d);
			});

		});

		// get unique faculty nodes array
		var uniqueFacultyNodes = _.uniq(facultyNodes, function(n){
			return n.id;
		});

		// get unique topics nodes array
		var uniqueTopicsNodes = _.uniq(topicsNodes, function(n){
			return n.id;
		});

		// sort faculty and topics nodes so they're in alphabetical order
		uniqueFacultyNodes = _.sortBy(uniqueFacultyNodes, function(n) {
			var name = n.attributes.full_name.trim();
			var name_split = name.split(' ');
			return name_split[name_split.length-1];
		});

		uniqueTopicsNodes = _.sortBy(uniqueTopicsNodes, function(n) {
			return n.attributes.name;
		});

		// iterate though faculty nodes and add in x, y coordinates and add to nodes
		uniqueFacultyNodes.forEach(function(n, i) {
			n.attributes.flag = 'faculty';
			n.attributes.x = 0;
			n.attributes.y = i;		
			data.nodes.push(n);
		});
		
		// iterate though topics nodes and add in x, y coordinates
		uniqueTopicsNodes.forEach(function(n, i) {
			n.attributes.flag = 'topic';
			n.attributes.x = 2;
			n.attributes.y = i;
			data.nodes.push(n);
		});


		// loop through projects and create links array with sources and targets
		this.models.forEach(function(m, i){
			console.log("project model!", m);

			var facultyNodes = m.getCommonRelations(m, 'faculty');
			facultyNodes.forEach(function(s){
				console.log("relations!",s);
				var link = {};
				link.target = s;
				link.source = m;
				data.links.push(link);
			});

			var topicsNodes = m.getCommonRelations(m, 'topics');
			topicsNodes.forEach(function(s){
				var link = {};
				link.target = s;
				link.source = m;
				data.links.push(link);
			});


		});

		// add in max number of Topics, Faculty and Projects for d3 scales
		data.max.push({maxFaculty: uniqueFacultyNodes.length, maxTopics: uniqueTopicsNodes.length, maxProjects: this.models.length});

		return data;
	},

	dataForModal: function(){
		var data = {};
		// for the hive plot modals we need to create a collection of all models and the total length
		data.models = [];
		var facultyNodes = [];
		var topicsNodes = [];

		// loop through project models and pull faculty and topic nodes
		this.models.forEach(function(m, i){
			data.models.push(m);

			// collect faculty nodes 
			var facultyNode = m.getCommonRelations(m, 'faculty');
			facultyNode.forEach(function(d) {
				facultyNodes.push(d);
			});
			
			// collect topic nodes 
			var topicsNode = m.getCommonRelations(m, 'topics');
			topicsNode.forEach(function(d) {
				topicsNodes.push(d);
			});

		});

		// get unique faculty nodes array
		var uniqueFacultyNodes = _.uniq(facultyNodes, function(n){
			return n.id;
		});

		// get unique topics nodes array
		var uniqueTopicsNodes = _.uniq(topicsNodes, function(n){
			return n.id;
		});

		// iterate though faculty nodes and add in x, y coordinates and add to nodes
		uniqueFacultyNodes.forEach(function(n, i) {
			data.models.push(n);
		});
		
		// iterate though topics nodes and add in x, y coordinates
		uniqueTopicsNodes.forEach(function(n, i) {
			data.models.push(n);
		});

		// get length of models
		data.length = data.models.length;

		return data;
	},

});
module.exports = Projects;
