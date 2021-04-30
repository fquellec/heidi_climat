function DotMatrixChart(dataset,options){

    var dotRadius = options.dot_radius;
    var noOfCirclesInARow = options.no_of_circles_in_a_row;
    var dotPaddingLeft = options.dot_padding_left;
    var dotPaddingRight = options.dot_padding_right;
    var dotPaddingTop = options.dot_padding_top;
    var dotPaddingBottom = options.dot_padding_bottom;
	var noOfGroupsInARow = options.no_of_groups_in_a_row;

    if(isNaN(dotRadius)){
        throw new Error("dot_radius must be a Number");
    }
    if(isNaN(noOfCirclesInARow)){
        throw new Error("no_of_circles_in_a_row must be a Number");
    }
    if(isNaN(dotPaddingLeft)){
        throw new Error("dot_padding_left must be a Number");
    }
    if(isNaN(dotPaddingRight)){
        throw new Error("dot_padding_right must be a Number");
    }
    if(isNaN(dotPaddingTop)){
        throw new Error("dot_padding_top must be a Number");
    }
    if(isNaN(dotPaddingBottom)){
        throw new Error("dot_padding_bottom must be a Number");
    }
	if(isNaN(noOfGroupsInARow)){
        throw new Error("no_of_groups_in_a_row must be a Number");
    }


    var flags = [], uniqueCategories = [], uniqueGroups=[], l = dataset.length, i;
	
    for( i=0; i<l; i++) {
        if( flags[dataset[i].category]) continue;
        flags[dataset[i].category] = true;
        uniqueCategories.push(dataset[i].category);
    }
	
    flags = [];
    for( i=0; i<l; i++) {
        if( flags[dataset[i].group]) continue;
        flags[dataset[i].group] = true;
        uniqueGroups.push(dataset[i].group);
    }

    var sumOfEveryGroup = {};
    for(var i=0;i<dataset.length;i++){
        if(sumOfEveryGroup[dataset[i]['group']] == null){
            sumOfEveryGroup[dataset[i]['group']] = 0;
        }
        sumOfEveryGroup[dataset[i]['group']] += dataset[i]['count'];
    }

    var maxNoOfLinesInGroup = 0;
    for(var group in sumOfEveryGroup){
        if(sumOfEveryGroup[group]/noOfCirclesInARow > maxNoOfLinesInGroup){
            maxNoOfLinesInGroup = Math.ceil(sumOfEveryGroup[group]/noOfCirclesInARow);
        }
    }
	
	function factorialize(num) {
	  if (num < 0) 
			return -1;
	  else if (num == 0) 
		  return 1;
	  else {
		  return (num * factorialize(num - 1));
	  }
	}

	var numberOfGroupInColumn = Math.ceil(uniqueGroups.length/noOfGroupsInARow);
	var numberOfColumns = noOfGroupsInARow*noOfCirclesInARow + (noOfGroupsInARow-1)*3;
    var numberOfLines = maxNoOfLinesInGroup * numberOfGroupInColumn + (numberOfGroupInColumn-1)*3;
		
    var groupScale = d3.scalePoint().domain(uniqueGroups).range([0, uniqueGroups.length-1]);
    var categoryScale = d3.scalePoint().domain(uniqueCategories).range([0, uniqueCategories.length]);
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    // Set the dimensions of the canvas / graph
    var	margin = {top: dotRadius*10, right: dotRadius*10, bottom: dotRadius*10, left: dotRadius*10};
    //var	margin = {top: 0, right: 0, bottom: 0, left: 0};

    height = numberOfLines * (dotRadius*2 + dotPaddingBottom + dotPaddingTop);
    width = numberOfColumns * (dotRadius*2 + dotPaddingLeft + dotPaddingRight);
	
    // Set the ranges
    var	xScale = d3.scaleLinear().range([margin.left, width]);
    var	yScale = d3.scaleLinear().range([height, margin.bottom]);
	
	var xAxis = d3.axisBottom(xScale).tickFormat(function(d){ return d.x;});//.tickFormat(function(d){ return d.x;});
				//.tickFormat(function (d) {
				//	return uniqueGroups[d];
				//})
				//.ticks(uniqueGroups.length)
            	//.tickSize(-width+margin.left-(dotRadius*2), 0, 0);
	
	var yAxis = d3.axisLeft(yScale);		
	
    xScale.domain([0,numberOfColumns]);
    yScale.domain([0,numberOfLines]);

    //Create SVG element
    var svg = d3.select("#DotMatrix")
                .append("svg")
				.attr('viewBox', '0 0 600 600')
				.append('g')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	
	
    var globalLineNoForGroup = {};
    var globalLineSizeForGroup = {};
    var globalDotXPosition = {};
	
    function generate_array(d){
		
        if(globalLineSizeForGroup[d.group] == null){
            globalLineSizeForGroup[d.group] = 0;
			
        }
        if(globalLineNoForGroup[d.group] == null){
            globalLineNoForGroup[d.group] = 0;
        }
        if(globalDotXPosition[d.group] == null){
            globalDotXPosition[d.group] = 0;
        }
		
		var delim_y = Math.floor(groupScale(d.group)/noOfGroupsInARow) * 3;
						
		var delim_x = groupScale(d.group)%noOfGroupsInARow * 3;
			
        var arr = new Array(d.count);
        for(var i=0;i<d.count;i++){

            if(globalLineSizeForGroup[d.group]!=0 && globalLineSizeForGroup[d.group] % noOfCirclesInARow == 0){
                globalLineNoForGroup[d.group] += 1;
                globalDotXPosition[d.group]= 1;
            }else{
                globalDotXPosition[d.group]+=1;
            }

			const x = delim_x + (globalDotXPosition[d.group]-1) + (groupScale(d.group)%noOfGroupsInARow)*noOfCirclesInARow
			const y = delim_y + Math.floor(groupScale(d.group)/noOfGroupsInARow)*maxNoOfLinesInGroup + globalLineNoForGroup[d.group]

			arr[i] = {y:y,x: x, group:d.group,category:d.category, value: d.count};
            globalLineSizeForGroup[d.group] += 1;
        }
        return arr;
    }

    var groups = svg
       .selectAll("g.group")
       .data( dataset )
        .enter()
        .append('g')
        .attr("class", "group");

    var circleArray = groups.selectAll("g.circleArray")
    .data(function(d) {return generate_array(d);});

    circleArray.enter()
    .append('g')
    .attr("class", "circleArray")
    .append("circle")
    .style("fill",function(d){return color(d.category);})
    .attr("r", dotRadius)
    .attr("cx", function(d,i) {return xScale(d.x); })
    .attr("cy", function(d,i) {return yScale(d.y); });

		
	// add labels
	var labels = svg
    .selectAll(".legend")
    .data(uniqueGroups)
		.enter()
		.append("g");
	
	labels.append('text')
		.text( function(d){return d;})
		.attr("x", function(d,i){return xScale(i%noOfGroupsInARow * (noOfCirclesInARow+3));})
		.attr("y", function(d,i){return yScale((Math.floor(i/noOfGroupsInARow+1)) * (maxNoOfLinesInGroup));});
	
    // add legend
    var legend = svg
    .selectAll(".legend")
    .data(uniqueCategories)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + 0  + "," + (margin.top+dotRadius) + ")");

    legend
      .append("circle")
      .attr("cx", dotRadius*4)//width + dotRadius*4
      .attr("cy", function(d,i){return height + i*dotRadius*4;})
      .attr("r", dotRadius)
      .style("fill", function(d) {
        return color(d);
      })

    legend
      .append("text")
      .attr("x", dotRadius*4 + dotRadius*3)//width + dotRadius*4 + dotRadius*3
      .attr("text-anchor",'start')
      .attr("y", function(d,i){return height + i*dotRadius*4 + dotRadius;})
      .style("font-size", dotRadius*3 + "px")
      .text(function(d){return d});

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

    tooltip.append('div')
    .attr('class', 'group');
    tooltip.append('div')
    .attr('class', 'category');
	tooltip.append('div')
    .attr('class', 'species');

    svg.selectAll(".group")
    .on('mouseover', function(d,i) {
		d3.select(this)
		  .style("opacity", 0.5);
		
        tooltip.select('.group').html("<b>" + d.group + "</b>");
		tooltip.select('.species').html("Nombre d'espèces <b>" + d.category + "</b> : " + d.count + "");

        tooltip.style('display', 'block');
        tooltip.style('opacity',2);

    })
    .on('mousemove', function(d) {
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

		tooltip
		.style("left", leftPos + "px")
		.style("top", topPos + "px")

    })
    .on('mouseout', function() {
		d3.select(this).style("opacity", 1);
        tooltip.style('display', 'none');
        tooltip.style('opacity',0);
    });
}