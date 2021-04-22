function CircularWorldCalendar(data, config){
	
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

	function doyToDegrees(doy) {
	  return doy / 366 * 360;
	}

	function DegToRadians(degrees) {
	  return degrees * Math.PI / 180 - Math.PI / 2;
	}

	function addArch(arc, className, classNameAsId) {
	  const visible = !className || className.split('_')[0] == "day"
	  const g = svg_c.append('g');
	  const path = g.append('path')
		.attr('class', className)
		.attr('d', arc)
		.style('fill', "#67809f")
		.style("stroke", visible ? "#F9F9F9":"transparent")
		.style("stroke-width", "2px")
		.style("stroke-opacity", "1")
		.attr("transform", "translate(" + config.width / 2 + "," + config.height / 2 + ")")
		.on("mouseover", function(d) {
		  if (className){
		  	d3.select(this).style('stroke', "transparent");// TODO higlight country
		  }
		})
		.on("mouseleave", function(d) {
			if (className){
		  		d3.select(this).style('stroke', "#F9F9F9");
			}
		});

	  if (classNameAsId) {
		path.attr('id', className.split(' ')[0]);
	  }
	}

	function drawArc(start, end, innerPosition, outerPosition, className, classNameAsId) {
	   var arc = d3.arc()
		.innerRadius(config.arcPosition + innerPosition)
		.outerRadius(config.arcPosition + outerPosition)
		.startAngle(DegToRadians(doyToDegrees(start)) + Math.PI / 2)
		.endAngle(DegToRadians(doyToDegrees(end)) + Math.PI / 2)

	   addArch(arc, className, classNameAsId);
	}
	
	let months = [
	  { className: 'Mars', start: '2017-03-01', end: '2017-04-01' },
	  { className: 'Avril', start: '2017-04-01', end: '2017-05-01' },
	  { className: 'Mai', start: '2017-05-01', end: '2017-06-01' },
	  { className: 'Juin', start: '2017-06-01', end: '2017-07-01' },
	  { className: 'Juillet', start: '2017-07-01', end: '2017-08-01' },
	  { className: 'Août', start: '2017-08-01', end: '2017-09-01' },
	  { className: 'Septembre', start: '2017-09-01', end: '2017-10-01' },
	  { className: 'Octobre', start: '2017-10-01', end: '2017-11-01' },
	  { className: 'Novembre', start: '2017-11-01', end: '2017-12-01' },
	  { className: 'Decembre', start: '2017-12-01', end: '2017-12-31' },
	  { className: 'Janvier', start: '2017-01-01', end: '2017-02-01' },
	  { className: 'Février', start: '2017-02-01', end: '2017-03-01' },
	];
	
	// Create svg
	d3.select("#CircularCalendar").style("position", "relative")
	var svg_c = d3.select("#CircularCalendar").append("svg")
	  .attr("viewBox", '0 0 ' + config.width + ' ' + config.height);
	
	// Create centered circle (world)
	svg_c.append("circle")
		.attr('cx', config.width/2 )
		.attr('cy', config.width/2 )
		.attr('r', config.width/4 )
		.style('fill', '#34495e');

	// Add labels for months
	svg_c.selectAll('.monthText')
		.data(months)
		.enter()
		  .append("text")
			.attr("class", "monthText")
			.attr("x", 58)   //Move the text from the start angle of the arc
			.attr("dy", '0.5em') //Move the text down
		  .append("textPath")
			.attr("xlink:href", d => `#${d.className}`)
			.text(d => d.className.slice(0,3));	

	// Add days, months and dataset
	months = months.map(d => ({
		className: d.className,
		start: new Date(d.start).getDOY(),
		end: new Date(d.end).getDOY(),
	}));

	let days = [];
	for(let i = 1; i <= 366; i++) {
	  const dayClassName = months.find(d => { 
			return i >= d.start && i <= d.end + 1; 
		}).className;

	  days[i-1] = { 
		  data: i, 
		  className: `${dayClassName} day ${i}`  ,
		}; 
	}
	
	
	days.forEach((d) => drawArc(d.data, d.data+1, 30, 50, ""));//d.className
	months.forEach((d) => drawArc(
	  d.start + (d.className === 'january' ? -1 : 0), 
	  d.end + (d.className === 'december' ? 1 : 0),
	  20, 
	  20, 
	  `${d.className} month`, 
		true));

	// Map values to country id
  	var dataByIso = {};
	var dataByDate = {};
	
	data.forEach((d) => {
		const startDate = new Date(d.date);
		const endDate = new Date(startDate.getTime());
		endDate.setDate(startDate.getDate() + 1);
	  
		const className = "day_" + (startDate.getMonth() + 1).toString() + "_" + startDate.getDate();
		dataByIso[d.iso] = {"country": d.country, "value": +d.value, "date":className, "angleR": DegToRadians(doyToDegrees(startDate.getDOY()))};
	    dataByDate[d.date] = {"country": d.country, "value": +d.value, "iso":d.iso};
		drawArc(
			startDate.getDOY(),
			endDate.getDOY(),
			30,
			50,//+ (d.special ? 4 : 0),
			className,
		)});

	svg_c.append('text')
		.classed('middle', true)
		.attr("text-anchor", "middle")
		.attr("transform", "translate(" + config.width / 2+ "," + config.height / 3 + ")")
		.attr("dy", "0.33em")
		.style("font-size", '1.6rem')
		.style("fill", "#FFFFFF")
		.style("stroke", "#FFFFFF")
		.text('2021')


	// create a tooltip
	const tooltip = d3.select("#CircularCalendar")
	  .append("div")
		.style("opacity", 0)
		.attr("class", "tooltip")
		.style("font-family", "Open Sans")
		.style("font-size", "0.7rem")
		.style("background-color", "#F9F9F9")
		.style("border-top", "solid #FFCE03")
		.style("border-top-width", "2px")
		//.style("border-radius", "5px")
		.style("padding", "5px")
		.style("position", "absolute")
		.style("width", config.tooltip_width)
		.style("pointer-events", "none")
		//.style("webkit-box-shadow", "0px 0px 10px grey")
		//.style("moz-box-shadow",  "0px 0px 10px grey")
		//.style("box-shadow", "0px 0px 10px grey");

	d3.queue()
		.defer(d3.csv, 'assets/API_EN.ATM.GHGT.KT.CE_DS2_fr_csv_v2_2168730.csv', function (d) {
			return {
				id: d['Country Code'],
				name: d['Country Name'],  
				values: +d['2010']
			}
		})
		.defer(d3.json, 'assets/countries_vandg4.json')
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
	  const projection = d3.geoIdentity().reflectY(true).fitSize([config.width/2, config.height/2], geojson)
	  const path = d3.geoPath().projection(projection);


	  const minValue = d3.min(values, function(d) { return +d.values; });
	  const maxValue = d3.max(values, function(d) { return +d.values; });

	  const color = d3.scalePow()
		.exponent(0.5)
		.domain([minValue, maxValue])
		.range(["#FFCE03", "#F00505"]);
	  function polarToCartesian(r , theta){
		  const x = r * Math.cos(theta);
		  const y = r * Math.sin(theta);
		  return [x, y];
	  }
	  // Draw the map
	  const countryPaths = svg_c
		.selectAll(".country")
		  .data(geojson.features)
		  .enter()
			.append("path")
			//.filter(function(d) { return d.properties.ISO_A3 != 'CHE' })
			.attr('class', 'country')
			.attr("fill", function (d) {
				if (valuesById[d.properties.ISO_A3]) {
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
	  		.attr("transform", "translate(" + config.width / 4 + "," + config.height / 4 + ")")
			.on("mouseover", function(d){
				
				if (dataByIso[d.properties.ISO_A3]){
					d3.select(this.parentNode.appendChild(this)).style('stroke', "black");
					d3.selectAll("." + dataByIso[d.properties.ISO_A3]['date']).style('fill', "#FFCE03");
					//string = d3.select("." + dataByIso[d.properties.ISO_A3]['date']).attr("transform");
					//transform = string.substring(string.indexOf("(")+1, string.indexOf(")")).split(",")
					
					//var that = d3.select("." + dataByIso[d.properties.ISO_A3]['date']);
					//d3.select(that.parentNode.appendChild(that)).style("fill", "black");
					
					var textToDisplay = "<b>" + valuesById[d.properties.ISO_A3]['name'] + "</b><br><br>" 
								  + "<b>Émissions totales de GES : </b>" + valuesById[d.properties.ISO_A3]['values'] + " kT d’équivalent CO2<br>";
					
					const coordinates = polarToCartesian(svg_c.node().getBoundingClientRect().width/4 + 45, dataByIso[d.properties.ISO_A3]['angleR'])
					const svg_width = svg_c.node().getBoundingClientRect().width;
					const svg_height = svg_c.node().getBoundingClientRect().height; 
					const tooltipWidth = tooltip.node().getBoundingClientRect().width;
					var left = coordinates[0] + svg_width/2;
					var top = coordinates[1] + svg_height/2;
					
					if (left < svg_width/2){
						left = left - tooltipWidth - 2;
						left = 0;
					} else {
						left = svg_width - tooltipWidth - 2
					}
					
					
					
					tooltip
						.html(textToDisplay)
						.style("left", left + "px")
						.style("top", top + "px");	
					tooltip.style("opacity", 1);
				}
			  
			  /*
			  if (valuesById[d.properties.ISO_A3]){
				tooltip.style("opacity", 1)
				
			  }
			  */
			})
			.on("mousemove", function(d){
				/*
			  const tooltipWidth = tooltip.node().getBoundingClientRect().width 
			  const tooltipHeight =  tooltip.node().getBoundingClientRect().height 
			  const mapWidth = svg_c.node().getBoundingClientRect().width 
			  const mapHeight = svg_c.node().getBoundingClientRect().height 

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
								  + "<b>Émissions totales de GES : </b>" + valuesById[d.properties.ISO_A3]['values'] + " kT d’équivalent CO2<br>";

			  tooltip
				.html(textToDisplay)
				.style("left", leftPos + "px")
				.style("top", topPos + "px")
			*/
			})
			.on("mouseleave", function(d){
				if (dataByIso[d.properties.ISO_A3]){
					d3.select(this).style('stroke', 'white');
					d3.selectAll("." + dataByIso[d.properties.ISO_A3]['date']).style('fill', "#67809f");
					tooltip.style("opacity", 0);
				}
				/*
			  if (valuesById[d.properties.ISO_A3]){
				tooltip.style("opacity", 0);
				d3.select(this).style('stroke', 'white');
			  }
			  */
			})

	}
}

CircularWorldCalendar([
	  { date: new Date().toString(), country: 'Suisse', iso: 'CHE', value: 6, special: true},
	  { date: '2021-01-21', country: 'France', iso:'FRA', value: 5},
	  { date: '2021-03-01', country: 'Etats-Unis', iso:'USA', value: 4},
	  { date: '2021-06-01', country: 'Belgique', iso:'BEL', value: 3},
	  { date: '2021-08-01', country: 'Chine', iso:'CHN', value: 0.9},
	  { date: '2021-10-01', country: 'Maroc', iso:'MAR', value: 1.2},
	  { date: '2021-02-31', country: 'Italie', iso:'ITA', value: 3.5},
	  { date: '2021-12-01', country: 'Espagne', iso:'ESP', value: 2},
	  { date: '2021-11-01', country: 'Grande-Bretagne', iso:'GBR', value: 1.5},
	],
	{
		width				: 800,
		height				: 800,
		arcPosition 		: 200,
		borderColor         : ["white", "grey"],
		tooltip_width       : "100px",
	}

)