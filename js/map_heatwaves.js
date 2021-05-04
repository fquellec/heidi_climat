// Define Default constants
const config = {
	width               : 500,//d3.select('#map').node().getBoundingClientRect().width,
	height              : 560,//d3.select('#map').node().getBoundingClientRect().width*1.12,
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
	.attr("transform", "translate(20," + (320).toString() + ")")//config.height/2
	.style("font-size", "0.5rem");

var colorLegend = d3.legendColor()
	.labelFormat(d3.format(".0f"))
	.shapeWidth(5)
	.shapePadding(1)
	.shapeHeight(20)
	.cells(9)
	.title("Nombre de jours caniculaire par année")
	.titleWidth(70)
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

	
	var valuesSlider = [1990, 2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070]
					
	// Add Play Pause Button
	var playButton = d3.select("#slider-container")
          .append("button")
			  .attr("type","button")
			  .attr("id","play-btn")
	playButton.append("i").attr("class","fas fa-play");	
	
	var moving = false;
	var current_index = 0;
	var next_index = 1;
	
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
					
	valuesSlider.forEach((v, i)=> {
		d3.select("#slider-container")
          .append("button")
          .attr("type","button")
          .attr("class","slider-btn")
          .attr("id","btn-" + v)
		  .on("click", function() {
			moving = false;
			if (!(isNaN(timer))){
				clearInterval(timer);
			}	
			// timer = 0;
			playButton.html('<i class="fas fa-play"></i>');
			
			current_index = i;
			next_index = i+1 >= valuesSlider.length ? 0 : i+1;
			update(v);
			d3.selectAll('.slider-btn').classed('activated',false);
			d3.select(this).classed('activated',true);	
		   })
          .append("div")
          .attr("class","label")
          .text(v + "'")
	}) 
	
	function step() {
		current_index = next_index;
		update(valuesSlider[next_index]);
		next_index = current_index + 1;
		if (next_index >= valuesSlider.length) {
			moving = false;
			next_index = 0;
			clearInterval(timer);
			// timer = 0;
			playButton.html('<i class="fas fa-play"></i>');
		}
	}

	function update(h) {
		console.log("Updating years : ", h);
		d3.selectAll('.slider-btn').classed('activated',false);
		d3.select('#btn-' + h).classed('activated',true);
		// update text of label according to slider scale
		//label.text(h.toString() + " - " + (h + 10).toString());

		// filter data set and redraw heatmap
		var newData = values.filter(function(d) {
			return d.date == h;
		})

		displayHeat(newData);
	}   
	
	update(1990);
}



	

	
