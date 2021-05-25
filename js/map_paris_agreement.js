// Define Default constants
dflt_config = {
  width               : 600,
  height              : 300,
  padding             : 0,
  colorScaleDomain    : [0, 2],
  colorScaleRange     : ["#ececec", "#87d37c"],
  borderColor         : ["white", "grey"],
  tooltip_format      : "Please define format",
  tooltip_width       : "200px",
  legend_title        : "",
};

function drawMap(id, column, config){
	// Define default or provided config
	if (isNaN(config)){
		config = {}
	}
	const width  			= isNaN(config.width) ? dflt_config.width : config.width;
	const height 			= isNaN(config.height) ? dflt_config.height : config.height;
	const padding 			= isNaN(config.padding) ? dflt_config.padding : config.padding;
	const colorScaleDomain 	= isNaN(config.colorScaleDomain) ? dflt_config.colorScaleDomain : config.colorScaleDomain;
	const colorScaleRange 	= isNaN(config.colorScaleRange) ? dflt_config.colorScaleRange : config.colorScaleRange;
	const borderColor 		= isNaN(config.borderColor) ? dflt_config.borderColor : config.borderColor;
	const tooltip_format 	= isNaN(config.tooltip_format) ? dflt_config.tooltip_format : config.tooltip_format;
    const tooltip_width 	= isNaN(config.tooltip_width) ? dflt_config.tooltip_width : config.tooltip_width;
	const legend_title 		= isNaN(config.legend_title) ? dflt_config.legend_title : config.legend_title;
	
	
	// Create the SVG containing our map
	const svg = d3.select("#" + id)
				  .append('svg')
					.attr("preserveAspectRatio", "xMinYMin meet")
					.attr("viewBox", "0 0 " + width + " " + height);

	const map  = svg
				  .append('g')
					.attr("width", width)
					.attr("height", height)
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
		.style("width", tooltip_width)
		.style("pointer-events", "none")
		.style("webkit-box-shadow", "0px 0px 10px grey")
		.style("moz-box-shadow",  "0px 0px 10px grey")
		.style("box-shadow", "0px 0px 10px grey");
	
	// Load dataset and geojson
	d3.queue()
		.defer(d3.csv, 'assets/paris_agreement_ndc.csv', function (d) {
			return {
				iso_3: d['iso_3'],
				iso_2: d['iso_2'],
				name: d['Country_Name_fr'],  
				values: +d['Share of 2012 GHG'],
				engagement: d['Summary of the I/NDC'],
			}
		})
		.defer(d3.json, 'assets/countries.json')
		.defer(d3.csv, 'assets/countries_centroids.csv', function (d) {
			return {
				iso_2: d['country'],
				lat: +d['latitude'],
				lon: +d['longitude'],  
			}
		})
		.awaitAll(initialize)

	function initialize(error, data){
	  if (error) { throw error }

	  // Get data  
	  const values  = data[0];
	  const geojson = data[1];
	  const centroids = data[2];
		
	  // Map centroids to country id 
	  centroidsById = {};	
	  centroids.forEach(function (d) {
		centroidsById[d.iso_2] = {"lat": +d.lat, "lon": +d.lon};
	  });

	  // Map values to country id
	  var valuesById = {};
	  values.forEach(function (d) {
		valuesById[d.iso_3] = {"name": d.name, "values": +d.values, "engagement": d.engagement};
	  });

	  // Map projection to compute coordinates 
	  const projection = d3.geoIdentity().reflectY(true).fitSize([width - padding*2, height - padding*2], geojson);
	  const path = d3.geoPath().projection(projection);

	  const color = d3.scaleOrdinal()
		.domain(colorScaleDomain)
		.range(colorScaleRange);//#FFCE03 ["#67809f", "#FFCE03", "#F00505"]

	  // Draw the map
	  const countryPaths = map
		.attr("transform", "translate(" + padding + "," + padding + ")")
		.selectAll(".country")
		  .data(geojson.features)
		  .enter()
			.append("path")
			.attr('class', 'country')
			.attr("fill", function (d) {
				if (valuesById[d.properties.ISO_A3]){
					return color(2);  
				}
				else {
					return color(0);
				}
				     
			})
			.style("opacity", 0.9)
			.attr("d", path)
			.style("stroke", borderColor[0])
			.style("stroke-width", "0.5px")
			.style("stroke-opacity", "1");

		// Add Legend
		svg.append("g")
			.attr("class", "legendLinear")
			.style("font-size", "0.5rem")
			.attr("transform", "translate(20,100)");

		var colorLegend = d3.legendColor()
			.labelFormat(d3.format(".0f"))
			.shapeWidth(15)
			//.shapePadding(0)
			.shapeHeight(10)
			.cells(3)
			.title(legend_title)
			.labelWrap(30)
			.titleWidth(60)
			.orient("vertical")
			.scale(color)
			.labelOffset(12);

		svg.select(".legendLinear")
			.call(colorLegend);
		
		const minValue = d3.min(values, function(d) { return +d.values; });
	    const maxValue = d3.max(values, function(d) { return +d.values; });
		
		// Add a scale for bubble size
		var size = d3.scaleLinear()
			.domain([minValue, maxValue])
			.range([ 1, 40]);
		
		// Draw bubbles 
		var bubbles = map
		  .selectAll(".bubble")
		  .data(values);
		
		bubbles
		  .enter()
		  .append("circle")
		  	.attr('class', 'bubble')
		    .attr("cx", function(d){ 
				c = centroidsById[d.iso_2]
				if(c){
					return projection([c.lon, c.lat])[0] 
				} else {
					//console.log("No centroid for ", d);
					return -100;
				}
			})
		    .attr("cy", function(d){ 
				c = centroidsById[d.iso_2]
				if(c){
					return projection([c.lon, c.lat])[1] 
				} else {
					//console.log("No centroid for ", d);
					return -100;
				} 
			})
		    .attr("r", function(d){ return size(+d.values) })
		    .style("fill", function(d){ return  '#000000' })
		    .attr("stroke", function(d){ return  "white" })
		    .attr("stroke-width", 1)
		    .attr("fill-opacity", .4)
			.on("mouseover", function(d){
				if (valuesById[d.iso_3] && valuesById[d.iso_3]['values'] != 0){
					tooltip.style("opacity", 1)
					d3.select(this).style('stroke', "black");//.parentNode.appendChild(this)
				}
			})
			.on("mousemove", function(d){
				if (!valuesById[d.iso_3]){return}
				const tooltipWidth = tooltip.node().getBoundingClientRect().width 
				const tooltipHeight =  tooltip.node().getBoundingClientRect().height 
				const mapWidth = svg.node().getBoundingClientRect().width 
				const mapHeight = svg.node().getBoundingClientRect().height 

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

				var textToDisplay = "<b>" + valuesById[d.iso_3]['name'] + "</b><br><br>" 
								  + "Pourcentage des émissions mondiale du pays : <b>" + valuesById[d.iso_3]['values'] + "%</b><br><br>"
								  + "Engagements: " + valuesById[d.iso_3]['engagement'];

				tooltip
					.html(textToDisplay)
					.style("left", leftPos + "px")
					.style("top", topPos + "px")
				})
				.on("mouseleave", function(d){
					if (valuesById[d.iso_3] && valuesById[d.iso_3]['values'] != 0){
						tooltip.style("opacity", 0);
						d3.select(this).style('stroke', 'white');
					}
				})
		
		
		// add text in circles
		bubbles
			.enter()
			.append("text")
			.attr("class", "cases_text")
			.attr("text-anchor","middle")
			.attr("alignment-baseline", "middle")
			.attr("x", function(d){ 
				c = centroidsById[d.iso_2]
				if(c){
					return projection([c.lon, c.lat])[0] 
				} else {
					console.log("No centroid for ", d);
					return -100;
				} 		
			})
			.attr("y", function(d){ 
				c = centroidsById[d.iso_2]
				if(c){
					return projection([c.lon, c.lat])[1] 
				} else {
					console.log("No centroid for ", d);
					return -100;
				} 
			})// + 4
			.attr("fill", "white")
			.attr("font-size", function(d){
				let val = size(+d['values']);
				return val*0.5;
			})
			.attr("font-weight", "600")
			.text(function(d){ return d['values'] + "%"})
			.style("pointer-events", "none"); //Click through

	}
}

drawMap("map_engagement")
