
// This class will contain the main document and cytoscape functionality
function getURLParameter(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

//URLS provided by web service outputting JSON data strings
var gid = getURLParameter('gid');
var ajaxNodesURL = "/ords/u1/hr/n/2";
var ajaxEdgesURL = "/ords/u1/hr/e/2";

"use strict";
document.addEventListener('DOMContentLoaded', function () {

	// Get exported JSON Nodes from Cytoscape desktop via ajax
	var graphNodes = $.ajax({
			url: ajaxNodesURL,
			type: 'GET'
		});

	// Get exported JSON Edges from Cytoscape desktop via ajax
	var graphEdges = $.ajax({
			url: ajaxEdgesURL,
			type: 'GET'
		});

	//Receive all data before populating Cytoscape graph
	Promise.all([graphNodes, graphEdges]).then(initCy);

	//Initialize Cytoscape

	function initCy(then) {

		var nodes = then[0];
		var edges = then[1];

		var cy = window.cy = cytoscape({
				container: document.getElementById('cy'),
				style: graphStyle
			});

		cy.startBatch();

		createGraph();

		cy.endBatch();

		//Will fade any node not connected to the selected Node
		cy.on('tap', 'node', function (e) {
			var node = e.cyTarget;

			cy.elements().addClass('faded');
			node.removeClass('faded');
		});

		cy.on('tap', function (e) {
			if (e.cyTarget === cy) {
				cy.elements().removeClass('faded');
			}
		});

		//Add the Nodes to our Cytoscape interface
		function getNodes() {

			for (var i = 0; i < nodes.items.length; i++) {
				cy.add([{
							group: "nodes",
							data: {
								id: nodes.items[i].node_id,
								label: nodes.items[i].node_label,
								backGroundColor: nodes.items[i].node_color,
								shape: nodes.items[i].node_shape,
								strength: 100
							},
							position: {
								x: nodes.items[i].x,
								y: nodes.items[i].y
							}
						}
					]);
			}
		};

		//Add the edges to our Cytoscape interface
		function getEdges() {

			for (var i = 0; i < edges.items.length; i++) {
				cy.add([{
							group: "edges",
							data: {
								id: edges.items[i].rel_id,
								source: edges.items[i].node_start,
								target: edges.items[i].node_end
							}
						}
					])
			}
		};

		//Add Buttons to Nodes Via QTIP
		function createQtip() {

			cy.nodes().forEach(function (ele) {

				ele.qtip({
					content: {
						text: function () {

							//Create QTIP Buttons

							var $div = $('<div> </div>');
							var $remove = $('<button class="qtip-buttons" id="removeButton"> Remove </button></br>');
							var $getChildren = $('<button class ="qtip-buttons" id="getChildrenButton">Show Children</button></br>');
							var $getParents = $('<button class="qtip-buttons" id="getParentsButton">Show Parents</button>');

							//Creates the QTIP Remove button that will delete a node.
							$remove.on('click', function () {
								var n = cy.$('node:selected');
								var id = ele.data('id');

								processDeleteRecord(n, id);

								n.qtip('api').hide();
								console.log("nice it did work!");

							});

							//Get Children of current Node
							$getChildren.on('click', function () {
								var node = cy.$('node:selected');
								var neighborhood = node.successors().add(node);

								cy.elements().addClass('faded');
								neighborhood.removeClass('faded');
							});

							//Get Parents of current Node
							$getParents.on('click', function () {
								var node = cy.$('node:selected');
								var neighborhood = node.predecessors().add(node);

								cy.elements().addClass('faded');
								neighborhood.removeClass('faded');
							})

							return $div.append(
								$remove,
								$getChildren,
								$getParents);
						},
						title: ele.data('label')
					},
					style: {
						classes: 'qtip-bootstrap'
					},
					position: {
						my: 'bottom center',
						at: 'top center',
						target: cy
					}

				});

			})
		}

		function doneLoading() {
			var loading = document.getElementById('loading');
			loading.classList.add('loaded');
		}

		function createGraph() {
			getNodes(nodes);
			getEdges(edges);
			createQtip();
			console.log('after qtip');
			cy.layout({
				name: 'preset',
				fit: true
			});
			console.log('done layout');
			doneLoading();
			console.log('after loading');
		}

		//Removes the selected node from the current instance of the interface
		//And updates the database

		function removeNode(node, id) {
			cy.remove(node);

			$.ajax({
				url: '/ords/u1/hr/n/' + id,
				type: 'DELETE',
				contentType: "application/vnd.oracle.adf.resourceitem+json"
			})
		}

		function processDeleteRecord(n, id) {
			alertify.confirm("Do you want to really delete your Product ?", function (e) {

					if (e) {
						removeNode(n, id);
						alertify.success("Your Product is succefully delete");
					}
				});
		}

	}
});

//---FILE LINKS---//

//Create png of current viewport
$("#save-as-png").click(function (e) {
	var png64 = cy.png({
			bg: '#B8B9BA'
		});
	var a = $('<a>').attr('href', png64).attr('download', 'img.png').appendTo('body');

	a[0].click();
	a.remove();
});

//Save updated graph positions(x, y) to database
/*$("#save-file").click(function(e){
$("#removeButton").click(function(e){
cy.nodes().forEach(function (ele) {

var rpos = ele.position();

var posx = rpos.x;
var posy = rpos.y;

var id = ele.data('id');


$.ajax({
url: ajaxNodesURL,
data: '{"NodeId": ' + id + ', "X": ' + posx + ', "Y": ' + posy + '}',
//url:  '/ords/u1/hr/n/' + id,
type: 'DELETE',
contentType: "application/vnd.oracle.adf.resourceitem+json"
})

});
});
 */

//---LAYOUT LINKS---/

function changeLayout(layout) {
	cy.layout(layout)
}

var layout = {
	name: "preset"
};
$("#breadthfirst").click(function (e) {
	layout = {
		name: "breadthfirst"
	};
	changeLayout(layout);
});
$("#concentric").click(function (e) {
	layout = {
		name: "concentric"
	};
	changeLayout(layout);
});
$("#circle").click(function (e) {
	layout = {
		name: "circle"
	};
	changeLayout(layout);
});
$("#dagre").click(function (e) {
	layout = {
		name: "dagre",
		nodeSep: 10,
		edgeSep: 10,
		rankSep: 100,
		minLen: 3,
		edgeWeight: 1
	};

	changeLayout(layout);
});
$("#cola").click(function (e) {
	layout = {
		name: "cola",
		flow: {
			axis: 'y',
			minSeparation: 300
		},
		nodeSpacing: 30,
		edgeLength: 600,
		maxSimulationTime: 10000
	};
	changeLayout(layout);
});
$("#random").click(function (e) {
	layout = {
		name: "preset"
	};
	changeLayout(layout);
});

//---SLIDERS---//

/*var params = {
name: 'cola',
nodeSpacing: 5,
edgeLengthVal: 45,
animate: true,
randomize: false,
maxSimulationTime: 1500
};

var sliders = [
{
label: 'Edge length',
param: 'edgeLengthVal',
min: 1,
max: 200
},

{
label: 'Node spacing',
param: 'nodeSpacing',
min: 1,
max: 50
}
];

var $config = $('#config');
sliders.forEach( makeSlider );

function makeLayout( opts ){
params.randomize = false;
params.edgeLength = function(e){ return params.edgeLengthVal / e.data('Weight'); };

for( var i in opts ){
params[i] = opts[i];
}

return cy.makeLayout( params );
}



function makeSlider( opts ){
var $input = $('<input></input>');
var $param = $('<div class="param"></div>');

$param.append('<span class="label label-default">'+ opts.label +'</span>');
$param.append( $input );

$config.append( $param );

var p = $input.slider({
min: opts.min,
max: opts.max,
value: params[ opts.param ]
}).on("slide", _.throttle( function(){
params[ opts.param ] = p.getValue();

layout.stop();
layout = makeLayout();
layout.run();
}, 16 ) ).data('slider');
}*/