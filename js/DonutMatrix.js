
function DonutMatrix(data, config){
	var dataByCategory = {};
	var totalByCategory = {};
	var dataByLabel = [];
	data.forEach((d) => {
		if (!(d.category in dataByCategory)) {
			dataByCategory[d.category] = [];
			totalByCategory[d.category] = 0;
		}
		if (!(dataByLabel[d.label])) {
			dataByLabel[d.label] = true;
		}
		dataByCategory[d.category].push(d);
		totalByCategory[d.category] += d.value;
	});
	
	const uniqueLabels = Object.keys(dataByLabel)
	const uniqueCategory = Object.keys(dataByCategory);
	const numberOfCategory = uniqueCategory.length;
	const numberOfDonutPerLine = Math.ceil(numberOfCategory/config.numberOfLines);
	
	console.log("Number of categories: ", numberOfCategory)
	console.log("Number of labels: ", uniqueLabels.length)
	console.log("Number of donuts per line: ", numberOfDonutPerLine)
	
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
	
	var svg = d3.select('#DonutMatrix').append('svg')
		.attr('viewBox', '0 0 ' + config.width + ' ' + config.height);
	
	var radius = Math.max(config.width, config.height) / (2*numberOfDonutPerLine);
	
	var labelScale = d3.scalePoint().domain(uniqueLabels).range([0, uniqueLabels.length-1]);
	var color = d3.scaleOrdinal(config.categoryColor);

	var pie = d3.pie()
		.sort(null)
		.value(function(d) { return d.value; });

	var path = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(radius - 70);

	var label = d3.arc()
		.outerRadius(radius - 40)
		.innerRadius(radius - 40);	
	
	
	function getPos(categoryName){
		const index = uniqueCategory.indexOf(categoryName);
		if (index == -1){
			console.log("Error, category '" + categoryName + "' not found.");
			return null;
		}
		
		const x = index%numberOfDonutPerLine
		const y = Math.floor(index/numberOfDonutPerLine);
		return [x, y];
	}
	
	function drawDonut(categoryName){
		var coords = getPos(categoryName);
		
		console.log(coords[0], coords[1])
		
		var center = [ (radius + coords[0]*radius*2),  (radius + coords[1]*radius*2) ]
		
		var g = svg.append("g")
			.attr("transform", "translate(" + center[0] + "," + center[1] + ")");
		
		var arc = g.selectAll(".arc")
			.data(pie(dataByCategory[categoryName]))
			.enter().append("g")
			.attr("class", "arc");

		arc.append("path")
			.attr("d", path)
			.attr("fill", function(d) {return color(labelScale(d.data.label)); })
			.style("stroke-width", "3px")
			.style('stroke', config.borderColor[0])
			.on("mouseover", function(d){
				tooltip.style("opacity", 1)
				d3.select(this).style('stroke-width', "0px");
			})
			.on("mouseleave", function(d){
				tooltip.style("opacity", 0)
				d3.select(this).style('stroke-width', "3px");
			})
			.on("mousemove", function(d){
			  const tooltipWidth = tooltip.node().getBoundingClientRect().width 
			  const tooltipHeight =  tooltip.node().getBoundingClientRect().height 
			  const svgWidth = svg.node().getBoundingClientRect().width 
			  const svgHeight = svg.node().getBoundingClientRect().height 

			  var leftPos = event.pageX
			  var topPos = event.pageY

			  if (leftPos > svgWidth/2){
				leftPos = leftPos - tooltipWidth - 10
			  } else {
				leftPos = leftPos + 10
			  }

			  if (topPos > svgHeight/2){
				topPos = topPos - tooltipHeight -20
			  } else {
				topPos = topPos + 15
			  }
			
			  var percent = d.data.value/totalByCategory[d.data.category]*100;
			  var textToDisplay = "<b>" + d.data.label + "</b><br><br>" 
								  + "<b>" + d.data.value + "/" + totalByCategory[d.data.category] + " <br>("+Math.round(percent * 100) / 100+"%)";
				
			  tooltip
				.html(textToDisplay)
				.style("left", leftPos + "px")
				.style("top", topPos + "px")
			});

		arc.append("text")
			.attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
			.attr("dy", "0.35em")
			.style("text-anchor", "middle")
			.text(function(d) { return d.value; });
		
		svg.append("text")
			.attr("transform", "translate(" + center[0] + "," + center[1] + ")")
			.attr("dy", "0.35em")
			.style("text-anchor", "middle")
			.text(categoryName);
	}
	
	uniqueCategory.forEach((d) => drawDonut(d));
}

DonutMatrix([
		{ category: 'Mammifères', label: 'Espèces non evaluées', value: 6513-5940 },
		{ category: 'Mammifères', label: 'Espèces non menacées actuellement', value: 5940-1323 },
		{ category: 'Mammifères', label: 'Espèces menacées', value: 1323 },
		
		{ category: 'Oiseaux', label: 'Espèces non evaluées', value: 11158-11158 },
		{ category: 'Oiseaux', label: 'Espèces non menacées actuellement', value: 11158-1481 },
		{ category: 'Oiseaux', label: 'Espèces menacées', value: 1481 },
	
		{ category: 'Reptiles', label: 'Espèces non evaluées', value: 11341-8492  },
		{ category: 'Reptiles', label: 'Espèces non menacées actuellement', value: 8492-1458 },
		{ category: 'Reptiles', label: 'Espèces menacées', value: 1458 },
	
		{ category: 'Amphibiens', label: 'Espèces non evaluées', value: 8309-7212 },
		{ category: 'Amphibiens', label: 'Espèces non menacées actuellement', value: 7212-2442 },
		{ category: 'Amphibiens', label: 'Espèces menacées', value: 2442 },
		
		{ category: 'Poissons', label: 'Espèces non evaluées', value: 35797-22005  },
		{ category: 'Poissons', label: 'Espèces non menacées actuellement', value: 22005-3210  },
		{ category: 'Poissons', label: 'Espèces menacées', value: 3210 },	  
	],
	{
		width				: 800,
		height				: 600,
		numberOfLines		: 2,
		borderColor         : ["white", "grey"],
		categoryColor 		: ["#e8e8e8", "#4daf7c", "#d64541"],
		tooltip_width       : "100px",
	}

)