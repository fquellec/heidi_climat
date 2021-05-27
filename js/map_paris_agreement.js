// Define Default constants
dflt_config = {
  width               : 600,
  height              : 300,
  padding             : 0,
  colorScaleDomain    : ["Gravement insuffisant","Très insuffisant","Insuffisant","Compatible 2°C","Compatible 1.5°C (Accords de Paris)","Role modèle"],
  colorScaleRange     : ["#525A5E", "#EC4C25","#EF9D23","#F5E363","#A1C14C","#568C45"],
  borderColor         : ["white", "grey"],
  tooltip_format      : "Please define format",
  tooltip_width       : "300px",
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
		.defer(d3.csv, 'assets/climateActionTracker.csv', function (d) {
			return {
				iso_3: d['iso_3'].toUpperCase(),
				iso_2: d['iso_2'].toUpperCase(),
				name: d['pays'],  
				values: d['note'],
			}
		})
		.defer(d3.json, 'assets/countries.json')
		.awaitAll(initialize)

	function initialize(error, data){
	  if (error) { throw error }

	  // Get data  
	  const values  = data[0];
	  const geojson = data[1];

	  // Map values to country id
	  var valuesById = {};
	  values.forEach(function (d) {
		valuesById[d.iso_3] = {"name": d.name, "values": d.values};
	  });
		
	  // Define additional infos for tooltip // SPECIFIC TO THIS CHART
	  var infos = {};
	  infos["Gravement insuffisant"] = "Si tous les engagements nationaux se situaient dans cette fourchette, le réchauffement dépasserait <b>4°C</b> d'ici 2100.";
	  infos["Très insuffisant"] = "Si tous les engagements nationaux se situaient dans cette fourchette, le réchauffement atteindrait entre <b>3°C</b> et <b>4°C</b> d'ici 2100.";
	  infos["Insuffisant"] = "Si tous les engagements nationaux se situaient dans cette fourchette, le réchauffement atteindrait plus de <b>2°C</b> et jusqu'à <b>3°C</b> d'ici 2100.";
	  infos["Compatible 2°C"] = "Si tous les engagements nationaux se situaient dans cette fourchette, le réchauffement pourrait être maintenu en dessous de <b>2°C</b>, mais au dessus de <b>1,5°C</b>."
	  infos["Compatible 1.5°C (Accords de Paris)"] = "Les engagements nationaux de ce pays se situent dans la fourchette \"équitable\" : ils sont compatibles avec la limite de <b>1,5°C</b> de l'Accord de Paris."
	  infos["Role modèle"] = "Le plan climat de ce pays est plus ambitieux que ce qui est considéré comme une contribution \"équitable\" : il est plus que conforme à la limite de <b>1,5°C</b> de l'Accord de Paris."

	  // Map projection to compute coordinates 
	  const projection = d3.geoIdentity().reflectY(true).fitSize([width - padding*2, height - padding*2], geojson);
	  const path = d3.geoPath().projection(projection);
	  
	  const color = d3.scaleOrdinal()
		.domain(colorScaleDomain)
		.range(colorScaleRange);

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
					return color(valuesById[d.properties.ISO_A3]['values']);  
				}
				else {
					return '#F2F2F2';
				}
				     
			})
			.style("opacity", 0.9)
			.attr("d", path)
			.style("stroke", borderColor[0])
			.style("stroke-width", "0.5px")
			.style("stroke-opacity", "1")
	  		.on("mouseover", function(d){
				if (valuesById[d.properties.ISO_A3]){
					tooltip.style("opacity", 1)
					d3.select(this.parentNode.appendChild(this)).style('stroke', borderColor[1]);
				}
			})
			.on("mousemove", function(d){
				if (!valuesById[d.properties.ISO_A3]){return}
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

				var textToDisplay = "<b>" + valuesById[d.properties.ISO_A3]['name'] + "</b><br>" 
								  + "Le plan climat du pays est considéré comme <b>" + valuesById[d.properties.ISO_A3]['values'] + "</b>.<br>"
								  + "<i>" + infos[valuesById[d.properties.ISO_A3]['values']] + "</i>"
								  ;

				tooltip
					.html(textToDisplay)
					.style("left", leftPos + "px")
					.style("top", topPos + "px")
				})
				.on("mouseleave", function(d){
					if (valuesById[d.properties.ISO_A3]){
						tooltip.style("opacity", 0);
						d3.select(this).style('stroke', borderColor[0]);
					}
				});

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
			//.cells(3)
			.title(legend_title)
			.labelWrap(40)
			.titleWidth(60)
			.orient("vertical")
			.scale(color)
			.labelOffset(12);

		svg.select(".legendLinear")
			.call(colorLegend);
	}
}

drawMap("map_engagement")
