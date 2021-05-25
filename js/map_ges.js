function drawMap(id, column, config){
	// Create the SVG containing our map
	const svg = d3.select("#" + id)
				  .append('svg')
					.attr("preserveAspectRatio", "xMinYMin meet")
					.attr("viewBox", "0 0 " + config.width + " " + config.height);

	const map  = svg
				  .append('g')
					.attr("width", config.width)
					.attr("height", config.height)
					.attr('pointer-events', 'all');

	// create a tooltip
	const tooltip = d3.select("body")
	  .append("div")
		.style("opacity", 0)
		.attr("class", "tooltip")
		.style("font-family", "Open Sans")
		.style("font-size", "0.7rem")
		.style("background-color", "white")
		.style("border", "solid white")
		.style("border-width", "2px")
		.style("border-radius", "5px")
		.style("padding", "5px")
		.style("position", "absolute")
		.style("width", config.tooltip_width)
		.style("pointer-events", "none")
		.style("webkit-box-shadow", "0px 0px 10px grey")
		.style("moz-box-shadow",  "0px 0px 10px grey")
		.style("box-shadow", "0px 0px 10px grey");

	d3.queue()
		.defer(d3.csv, 'assets/ghg_world.csv', function (d) {
			return {
				id: d['iso_3'],
				name: d['Country_Name_fr'],  
				values: +d[column]
			}
		})
		.defer(d3.json, 'assets/countries.json')
		.awaitAll(initialize)

	function initialize(error, data){
	  if (error) { throw error }

	  // Get data  
	  const values  = data[0]
	  const geojson = data[1];

	  // Map values to country id
	  var valuesById = {};
	  values.forEach(function (d) {
		valuesById[d.id] = {"name": d.name, "values": +d.values};
	  });

	  // Map projection to compute coordinates 
	  const projection = d3.geoIdentity().reflectY(true).fitSize([config.width - config.padding*2, config.height - config.padding*2], geojson);
	  const path = d3.geoPath().projection(projection);

	  //const minValue = d3.min(values, function(d) { return +d.values; });
	  //const maxValue = d3.max(values, function(d) { return +d.values; });

	  const color = d3.scaleLinear()
		.domain(config.colorScaleDomain)
		.range(config.colorScaleRange);//#FFCE03 ["#67809f", "#FFCE03", "#F00505"]

	  // Draw the map
	  const countryPaths = map
		.attr("transform", "translate(" + config.padding + "," + config.padding + ")")
		.selectAll(".country")
		  .data(geojson.features)
		  .enter()
			.append("path")
			.attr('class', 'country')
			.attr("fill", function (d) {
				if (valuesById[d.properties.ISO_A3] && valuesById[d.properties.ISO_A3]['values'] != 0) {
				  return color(valuesById[d.properties.ISO_A3]['values'])
				} else {
				  return "#F2F2F2"
				}        
			})
			.style("opacity", 0.9)
			.attr("d", path)
			.style("stroke", config.borderColor[0])
			.style("stroke-width", "0.5px")
			.style("stroke-opacity", "1")
			.on("mouseover", function(d){
			  if (valuesById[d.properties.ISO_A3] && valuesById[d.properties.ISO_A3]['values'] != 0){
				tooltip.style("opacity", 1)
				d3.select(this.parentNode.appendChild(this)).style('stroke', "black");
			  }
			})
			.on("mousemove", function(d){
				if (!valuesById[d.properties.ISO_A3]){return}
			  const tooltipWidth = tooltip.node().getBoundingClientRect().width 
			  const tooltipHeight =  tooltip.node().getBoundingClientRect().height 
			  const mapWidth = svg.node().getBoundingClientRect().width 
			  const mapHeight = svg.node().getBoundingClientRect().height 

			  //var leftPos = d3.mouse(this)[0]
			  //var topPos = d3.mouse(this)[1]
			  var leftPos = event.pageX
			  var topPos = event.pageY

			  if (leftPos > mapWidth/2){
				leftPos = leftPos - tooltipWidth - 10
			  } else {
				leftPos = leftPos + 10
			  }

			  if (topPos > mapHeight/2){
				topPos = topPos - tooltipHeight -20
			  } else {
				topPos = topPos + 15
			  }

			  var textToDisplay = "<b>" + valuesById[d.properties.ISO_A3]['name'] + "</b><br><br>" 
								  + "<b>Émissions totales de GES: </b>" + Math.round(valuesById[d.properties.ISO_A3]['values'] * 100) / 100 + " "+ config.unit + " d’équivalent CO2<br>";
				
			  tooltip
				.html(textToDisplay)
				.style("left", leftPos + "px")
				.style("top", topPos + "px")
			})
			.on("mouseleave", function(d){
			  if (valuesById[d.properties.ISO_A3] && valuesById[d.properties.ISO_A3]['values'] != 0){
				tooltip.style("opacity", 0);
				d3.select(this).style('stroke', 'white');
			  }
			})


		// Add Legend
		svg.append("g")
			.attr("class", "legendLinear")
			.style("font-size", "0.5rem")
			.attr("transform", "translate(20,100)");

		var colorLegend = d3.legendColor()
			.labelFormat(d3.format(".0f"))
			.shapeWidth(5)
			//.shapePadding(0)
			.shapeHeight(20)
			.cells(5)
			.title(config.legend_title)
			.labelWrap(30)
			.titleWidth(60)
			.orient("vertical")
			.scale(color)
			.labelOffset(12);

		svg.select(".legendLinear")
			.call(colorLegend);

	}
}
// Define Default constants
config_global = {
  width               : 600,
  height              : 300,
  padding             : 0,
  colorScaleDomain    : [0, 10000],
  colorScaleRange     : ["#ececec", "#D6121E"],//"#4285F4"
  borderColor         : ["white", "grey"],
  tooltip_format      : "Please define format",
  tooltip_width       : "150px",
  legend_title        : "Émissions GES (Mt équ. CO2)",
  unit 			      : "MT"
};
// Define Default constants
config_per_capita = {
  width               : 600,
  height              : 300,
  padding             : 0,
  colorScaleDomain    : [0, 20],
  colorScaleRange     : ["#ececec", "#D6121E"],//"#4285F4"
  borderColor         : ["white", "grey"],
  tooltip_format      : "Please define format",
  tooltip_width       : "150px",
  legend_title        : "Émissions GES (tonnes équ. CO2)",
  unit 				  : "tonnes par habitant"
};


drawMap("map_global", "emission", config_global)

d3.select("#tab1").on("click", function(){
	d3.selectAll("svg").remove();
	drawMap("map_global", "emission", config_global)
});

d3.select("#tab2").on("click", function(){
	d3.selectAll("svg").remove();
	drawMap("map_global", "ghg_per_capita_in_tonnes", config_per_capita)
});