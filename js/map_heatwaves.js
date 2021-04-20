// Define Default constants
const config = {
	width               : d3.select('#map').node().getBoundingClientRect().width,
	height              : d3.select('#map').node().getBoundingClientRect().width*1.12,
	padding             : 0,
	colorScaleDomain    : [0, 100],
	colorScaleRange     : ["#ececec", "#4285F4"],
	borderColor         : ["white", "grey"],
	dataField           : "value",
	tooltip             : true,
	tooltip_format      : "Please define format",
	tooltip_width       : "150px",
	legend              : true,
	legend_title        : "",
	legend_labels       : [0, 25, 50, 75, 100],
	legend_square_size  : 20,
};


// Create the SVG containing our map
var svg = d3.select("#map")
	.append('svg')
	.attr("preserveAspectRatio", "xMinYMin meet")
	.attr("viewBox", "0 0 " + config.width + " " + config.height);

const map  = svg
	.append('g')
	.attr("width", config.width)
	.attr("height", config.height)
	.attr('pointer-events', 'all');

// Map projection to compute coordinates 
const projection = d3.geoMercator()
	.center([0,53])
	.scale(550)
	.translate([ config.width/2, config.height/2 ]);

const path = d3.geoPath().projection(projection);

// Heatmap
var canvasLayer = d3.select("#heatmap")
	.append("canvas")
	.attr("width", config.width)
	.attr("height", config.height)

var canvas = canvasLayer.node(),
	ctx    = canvas.getContext("2d");

// Load Data for countries borders
d3.queue()
	.defer(d3.json, 'assets/europe.geojson')
	.awaitAll(initializeMap);

// Load data for heatmap separately for loading time
d3.queue()
	.defer(d3.csv, 'assets/test_heatmap.csv', function (d) {
		return {
			date: d['time'],
			lat: +d['lat'],  
			lon: +d['lon'],
			values: +d['days']
		}
	})
	.awaitAll(initializeHeatMap)

///////////////////////////////////////////
////////////////////MAP////////////////////
///////////////////////////////////////////
function initializeMap(error, data){
	if (error) { throw error }

	// Get data  
	const geojson = data[0];

	var g = svg.append("g")
	g.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
		.attr("fill", function (d) {
			return '#f9f9f9';
		})
		.attr("d", d3.geoPath().projection(projection))
		.style("stroke", "#abb7b7")
		.style("stroke-width", "1px")
		.on('mouseover', function(d) {
			d3.select(this).style('stroke', 'black');
			d3.event.preventDefault();
		}).on('mouseout', function(d) {
			d3.select(this).style('stroke', '#abb7b7');
		}).on("click", function(d) {

		})
		.style("opacity", .6)
		.exit()
		.transition().duration(200)
		.attr("r", 1)
		.remove();
}
	

///////////////////////////////////////////
/////////////////HEATMAP//////////////////
///////////////////////////////////////////

// Define color scale and gradients
var domain = [0, 10, 20, 30, 40];
var max_value = domain[domain.length - 1];
var myColor = d3.scaleLinear()
				.domain(domain)
				.range(["#e8ecf1", "#8b9dc3", "#f5e653", "#ff8100", "#f03434"]);

var grad = {0: myColor(0), 
			0.25: myColor(0.25*max_value), 
			0.50: myColor(0.50*max_value), 
			0.75: myColor(0.75*max_value), 
			1: myColor(1*max_value)}

// Add Legend
svg.append("g")
	.attr("class", "legendLinear")
	.attr("transform", "translate(20," + (config.height/2).toString() + ")");

var colorLegend = d3.legendColor()
	.labelFormat(d3.format(".0f"))
	.shapeWidth(5)
	.shapePadding(0)
	.shapeHeight(20)
	.cells(9)
	.title("Nombre de jours")
	.titleWidth(100)
	.orient("vertical")
	.scale(myColor)
	.labelOffset(12);

svg.select(".legendLinear")
	.call(colorLegend);

function initializeHeatMap(error, data){
	if (error) { throw error }
	
	const values  = data[0];
	
	// Map coordinates with projection
	values.forEach(d => {d.coords=projection([d.lon, d.lat]); })
	
	// Draw HeatMap
	var displayHeat = function(data){
		var heat = simpleheat(canvas);
		heat.data(data.map(d => { return [d.coords[0], d.coords[1], +d.values]}));
		heat.radius(1, 1);
		heat.max(max_value);
		heat.gradient(grad);
		heat.draw(0.05);
	}

	// Add Play Pause Button
	var playButton = d3.select("#play-button");
	var moving = false;
	var start_date = 1990;
	var current_value = 2000;
	var target_value = 2070;
	
	playButton
		.on("click", function() {
		var button = d3.select(this);
		if (moving == true) {
			moving = false;
			clearInterval(timer);
			// timer = 0;
			button.html('<i class="fas fa-play"></i>');
		} else {
			moving = true;
			timer = setInterval(step, 1000);
			button.html('<i class="fas fa-pause"></i>');
		}
	})
	
	// Add Label 
	var label = svg.append("text")  
		.attr("class", "label")
		.attr("text-anchor", "middle")
		.attr("transform", "translate(150,20)");

	function step() {
		update(current_value);
		current_value = current_value + 10;
		if (current_value > target_value) {
			moving = false;
			current_value = start_date;
			clearInterval(timer);
			// timer = 0;
			playButton.html('<i class="fas fa-play"></i>');
		}
	}
	
	function update(h) {
		console.log("Updating years : ", h);
		
		// update text of label according to slider scale
		label.text(h.toString() + " - " + (h + 10).toString());

		// filter data set and redraw heatmap
		var newData = values.filter(function(d) {
			return d.date == h;
		})

		displayHeat(newData);
	}
	
	update(1990);
}



	

	
