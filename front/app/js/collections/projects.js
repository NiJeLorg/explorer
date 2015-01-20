var Related = require('../collections/related');
var Project = require('../models/project');

var Projects = Related.extend({

	menuName: 'Projects',
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
		// we need to assemble nodes and links
		data.nodes = this.models;
		data.links = [];
		data.facultyNodes = [];
		this.models.forEach(function(m){
			var facultySpans = m.getSpan('faculty', 'projects');
			facultySpans.forEach(function(s){
				
				console.log("s", s);
				if( s.bridges.length > 1 ){
					var link = {};
					link.target = s.related_item;
					link.source = m;
					link.bridges = s.bridges;
					data.links.push(link);
				}
			});
		});
		return data;
	},

});
module.exports = Projects;
