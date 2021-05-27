// Defaults parameters
const dflt = {
	'divID' 				: 'CircularCalendar',
	'worldColor' 			: '#34495e',
	'mapColorRange' 		: ['#FFCE03', '#F00505'],
	'borderColor'			: ["white", "grey"],
	'arcsColor' 			: '#67809f',
	'arcsHighlightColor' 	: '#D6121E',//'#FFCE03',
	'backgroundColor'		: '#F9F9F9'
}

function CircularWorldCalendar(config){
	const width = 800,
		height = 500,
		arcPosition = 180;
	
	// Set defaults or config parameters
	if (isNaN(config)){
		config = {};
	}
	
	const divID 				= !isNaN(config.divID) ? config.divID : dflt.divID;
	const worldColor 			= !isNaN(config.worldColor) ? config.worldColor : dflt.worldColor;
	const mapColorRange 		= !isNaN(config.mapColorRange) ? config.mapColorRange : dflt.mapColorRange;
	const arcsColor 			= !isNaN(config.arcsColor) ? config.arcsColor : dflt.arcsColor;
	const arcsHighlightColor 	= !isNaN(config.arcsHighlightColor) ? config.arcsHighlightColor : dflt.arcsHighlightColor;
	const backgroundColor 		= !isNaN(config.backgroundColor) ? config.backgroundColor : dflt.backgroundColor;
	const borderColor 			= !isNaN(config.borderColor) ? config.borderColor : dflt.borderColor;
	
	// Create svg
	var svg = d3.select('#CircularCalendar').append('svg')
	  .attr('viewBox', '0 0 ' + width + ' ' + height);
	
	// Create centered circle (world)
	var circle = svg.append('circle')
		.attr('cx', width/2 )
		.attr('cy', height/2 )
		.attr('r', width/5 )
		.style('fill', worldColor);
	
	// Draw days arcs
	[...Array(366)].forEach((_,i)=>drawArc(i, i+1, 30, 50, "", true))
	
	// Add labels for months
	svg.selectAll('.monthText')
		.data(months)
		.enter()
		  .append("text")
			.attr("class", "monthText")
			.attr("x", 58)   //Move the text from the start angle of the arc
			.attr("dy", '0.8em') //Move the text down
		  .append("textPath")
			.text(d => d.className.slice(0,3))	
			.attr("xlink:href", d => '#' + d.className);
			
	
	// Draw months invisibles arcs in order to put label on it
	months.forEach((d) => drawArc(
		d.start + (d.className === 'Janvier' ? -1 : 0), 
		d.end + (d.className === 'Decembre' ? 1 : 0),
		20, 
		20, 
		`${d.className}`, 
		false
	));
	
	
	// Add Centered text
	svg.append('text')
		.classed('middle', true)
		.attr('text-anchor', 'middle')
		.attr('transform', 'translate(' + width / 2+ ',' + 150 + ')')
		.attr('dy', '0.33em')
		.style('font-size', '1.6rem')
		.style('fill', '#FFFFFF')
		.style('stroke', '#FFFFFF')
		.text('2021')
	
	// create a tooltip
	d3.select('#' + divID).style('position', 'relative')
	const tooltip_width = 100;//svg.node().getBoundingClientRect().width/4;
	const tooltip = d3.select('#' + divID)
	  .append('div')
		.style('opacity', 0)
		.attr('class', 'tooltip')
		.style('font-family', 'Open Sans')
		.style('font-size', '0.7rem')
		.style('background-color', backgroundColor)
		.style('border-top', 'solid ' + arcsHighlightColor)
		.style('border-top-width', '2px')
		.style('padding', '5px')
		.style('position', 'absolute')
		.style('width', tooltip_width + "px")
		.style('pointer-events', 'none')
	
	// Load geojson for the map + data from csv
	d3.queue()
		.defer(d3.csv, 'assets/NFA_2021_public_data_package.csv', function (d) {
			return {
				iso: d['alpha3'].toUpperCase(),
				name: d['name'],  
				value: +d['nb_earths'],
				date: d['overshoot_day']
			}
		})
		.defer(d3.json, 'assets/countries_vandg4.json')
		.defer(d3.json, 'https://cdn.jsdelivr.net/npm/d3-time-format@3/locale/fr-FR.json') // for date format
		.awaitAll(initialize)

	function initialize(error, data){
		if (error) { throw error }

		// Get data  
		const values  = data[0].filter(function(d) { return d.value > 1 });
		
		const geojson = data[1];
		d3.timeFormatDefaultLocale(data[2]);
		formatTime = d3.timeFormat("%d %B %Y");
		parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
		
		// Map values to country id and date
		var valuesByIso = {};
		var valuesByDate = {};

		values.forEach((d) => {
			
			const startDate = parseTime(d.date.slice(0,-4));
			const endDate = new Date(startDate.getTime());
			endDate.setDate(startDate.getDate() + 1);

			const className = "day_" + (startDate.getMonth() + 1).toString() + "_" + startDate.getDate();
			
			valuesByIso[d.iso] = {
				"name": d.name, 
				"value": +d.value, 
				"date":startDate, 
				"className": className, 
				"angleR": DegToRadians(doyToDegrees(startDate.getDOY()))
			};
			valuesByDate[d.date] = {"name": d.name, "value": +d.value, "iso":d.iso};
			
			// Draw another arc for each data in dataset
			if (!isNaN(startDate)){
				drawArc(
					startDate.getDOY(),
					endDate.getDOY(),
					30,
					50,//+ (d.special ? 4 : 0),
					className,
					true
				)
			}
			
		});
		
		// Pythagore to find biggest square in circle
		//var width_map = Math.pow(Math.pow(2*width/5, 2)/2, 0.5)
		
		// Map projection to compute coordinates on map
		const projection = d3.geoIdentity().reflectY(true).fitSize([320, 270], geojson)
		const path = d3.geoPath().projection(projection);

		// Define color scale
		const minValue = d3.min(values, function(d) { return +d.value; });
		const maxValue = d3.max(values, function(d) { return +d.value; });
		
		const color = d3.scalePow()
			.exponent(0.5)
			.domain([minValue, maxValue])
			.range(mapColorRange);
		
		// Draw the map
		const g = svg.append('g');
		
		const countryPaths = g
			.selectAll('.country')
			  .data(geojson.features)
			  .enter()
				.append('path')
				.attr('class', 'country')
				.attr('fill', function (d) {
					if (valuesByIso[d.properties.ISO_A3]) {
					  return color(valuesByIso[d.properties.ISO_A3]['value'])
					} else {
					  return "#F2F2F2"
					}        
				})
				.style("opacity", 0.9)
				.attr("d", path)
				.style("stroke", borderColor[0])
				.style("stroke-width", "0.5px")
				.style("stroke-opacity", "1")
				.attr("transform", "translate(" + 240 + "," + height/4 + ")")
				.on("mouseover", function(d){
				
					if (valuesByIso[d.properties.ISO_A3] && valuesByIso[d.properties.ISO_A3]['date']){
						d3.select(this.parentNode.appendChild(this)).style('stroke', "black");
						d3.selectAll("." + valuesByIso[d.properties.ISO_A3]['className'])
							.style('fill', arcsHighlightColor)
							//.style('stroke', arcsHighlightColor)
							.style("stroke-width", "0.5px");
						var textToDisplay = "<b>" + valuesByIso[d.properties.ISO_A3]['name'] + "</b><br>" 
								  + formatTime(valuesByIso[d.properties.ISO_A3]['date']) + "<br>"
								  + "<b>Nombre de planètes nécéssaires: </b>" + Math.round(valuesByIso[d.properties.ISO_A3]['value'] * 100) / 100;
						
						const svg_width = svg.node().getBoundingClientRect().width;
						const svg_height = svg.node().getBoundingClientRect().height; 
						const tooltipWidth = tooltip.node().getBoundingClientRect().width;
						const tooltipHeight = tooltip.node().getBoundingClientRect().height;
						const coordinates = polarToCartesian(svg_width/4 + 50, valuesByIso[d.properties.ISO_A3]['angleR'])
						
						
						var left = coordinates[0] + svg_width/2;
						var top = coordinates[1] + svg_height/2;
						if (coordinates[0] < 0){
							left = 0;
						} else {
							left = svg_width - tooltipWidth - 2
						}
						
						if (top < 0){
							top = 0;
						} else if(top + tooltipHeight> svg_height){
							top = svg_height - tooltipHeight;
						}

						tooltip
							.html(textToDisplay)
							.style("left", left + "px")
							.style("top", top + "px");	
						tooltip.style("opacity", 1);
					}
				})
				.on("mouseleave", function(d){
					if (valuesByIso[d.properties.ISO_A3]){
						d3.select(this).style('stroke', 'white');
						d3.selectAll("." + valuesByIso[d.properties.ISO_A3]['className']).style('fill', arcsColor)
							.style('stroke', 'white')
							.style("stroke-width", "2px");
						tooltip.style("opacity", 0);
					}
				})
		
		// initiate zoom
		/*
		const zoom = d3.zoom()
		  .scaleExtent([1, 8])
		  .on('zoom', zoomed);

		g.call(zoom);

		function zoomed() {
		  g
			.selectAll('path') // To prevent stroke width from scaling
			//.attr("transform", "translate(" + width / 4 + "," + height / 4 + ")")
			.attr('transform', d3.event.transform)
			
		}
		
		*/

	}

	function drawArc(start, end, innerPosition, outerPosition, className, visible) {
		var arc = d3.arc()
			.innerRadius(arcPosition + innerPosition)
			.outerRadius(arcPosition + outerPosition)
			.startAngle(DegToRadians(doyToDegrees(start)) + Math.PI / 2)
			.endAngle(DegToRadians(doyToDegrees(end)) + Math.PI / 2);
		
	   	const g = svg.append('g');
		
		const path = g.append('path')
			.attr('class', className)
			.attr("d", arc)
			.attr("id", className)
			.style("fill", arcsColor)
			.style("opacity", 1)
			.style("stroke", visible ? backgroundColor : "transparent")
			.style("stroke-width", visible ? "2px" : "0px")
			.style("stroke-opacity", visible ? "1" : "0")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
			.on("mouseover", function(d) {
				
			})
			.on("mouseleave", function(d) {
			
			});
	}
}



//////////////////////////////////////////////////////////////////
///////////////////// UTILITY FUNCTIONS //////////////////////////
//////////////////////////////////////////////////////////////////
Date.prototype.isLeapYear = function() {
	var year = this.getFullYear();
	if((year & 3) != 0) return false;
	return ((year % 100) != 0 || (year % 400) == 0);
};

// Get Day of Year
Date.prototype.getDOY = function() {
	var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	var mn = this.getMonth();
	var dn = this.getDate();
	var dayOfYear = dayCount[mn] + dn;
	if(mn > 1 && this.isLeapYear()) dayOfYear++;
	return dayOfYear;
};

// Convert Day of Year in Degrees
function doyToDegrees(doy) {
  return doy / 366 * 360;
}

// Convert Deg in radians
function DegToRadians(degrees) {
  return degrees * Math.PI / 180 - Math.PI / 2;
}

// Polar coordinates to cartesian
function polarToCartesian(r , theta){
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  return [x, y];
}

let months = [
  { className: 'Mars', start: new Date('2017-03-01').getDOY(), end: new Date('2017-04-01').getDOY() },
  { className: 'Avril', start: new Date('2017-04-01').getDOY(), end: new Date('2017-05-01').getDOY() },
  { className: 'Mai', start: new Date('2017-05-01').getDOY(), end: new Date('2017-06-01').getDOY() },
  { className: 'Juin', start: new Date('2017-06-01').getDOY(), end: new Date('2017-07-01').getDOY() },
  { className: 'Juillet', start: new Date('2017-07-01').getDOY(), end: new Date('2017-08-01').getDOY() },
  { className: 'Août', start: new Date('2017-08-01').getDOY(), end: new Date('2017-09-01').getDOY() },
  { className: 'Septembre', start: new Date('2017-09-01').getDOY(), end: new Date('2017-10-01').getDOY() },
  { className: 'Octobre', start: new Date('2017-10-01').getDOY(), end: new Date('2017-11-01').getDOY() },
  { className: 'Novembre', start: new Date('2017-11-01').getDOY(), end: new Date('2017-12-01').getDOY() },
  { className: 'Decembre', start: new Date('2017-12-01').getDOY(), end: new Date('2017-12-31').getDOY() },
  { className: 'Janvier', start: new Date('2017-01-01').getDOY(), end: new Date('2017-02-01').getDOY() },
  { className: 'Février', start: new Date('2017-02-01').getDOY(), end: new Date('2017-03-01').getDOY() },
];

CircularWorldCalendar();