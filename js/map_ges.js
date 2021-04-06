// Define Default constants
const config = {
  width               : window.innerWidth,
  height              : window.innerWidth/2,
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
const svg = d3.select("#map")
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

// Color scales
//const colorScale = d3.scaleLinear()
//  .domain(config.colorScaleDomain)
//  .range(config.colorScaleRange);
d3.queue()
    .defer(d3.csv, 'assets/API_EN.ATM.GHGT.KT.CE_DS2_fr_csv_v2_2168730.csv', function (d) {
        return {
            id: d['Country Code'],
            name: d['Country Name'],  
            values: +d['2010']
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
  const projection = d3.geoIdentity().reflectY(true).fitSize([config.width - config.padding*2, config.height - config.padding*2], geojson);//translate([config.width/2, config.height/2]).scale(2)
  const path = d3.geoPath().projection(projection);


  const minValue = d3.min(values, function(d) { return +d.values; });
  const maxValue = d3.max(values, function(d) { return +d.values; });
  console.log(minValue, maxValue)
  
  const color = d3.scalePow()
    .exponent(0.5)
    .domain([minValue, maxValue])
    .range(["#FFCE03", "#F00505"]);

  // Draw the map
  const countryPaths = map
    //.attr("transform", "translate(" + config.padding + "," + config.padding + ")")
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
        .on("mouseover", function(d){
          if (valuesById[d.properties.ISO_A3]){
            tooltip.style("opacity", 1)
            d3.select(this.parentNode.appendChild(this)).style('stroke', "black");
          }
        })
        .on("mousemove", function(d){
          const tooltipWidth = tooltip.node().getBoundingClientRect().width 
          const tooltipHeight =  tooltip.node().getBoundingClientRect().height 
          const mapWidth = svg.node().getBoundingClientRect().width 
          const mapHeight = svg.node().getBoundingClientRect().height 
          
          //var leftPos = d3.mouse(this)[0]
          //var topPos = d3.mouse(this)[1]
          var leftPos = event.pageX
          var topPos = event.pageY
          console.log(leftPos, topPos, tooltipWidth, tooltipHeight, mapWidth/2, mapHeight/2)

  
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
        })
        .on("mouseleave", function(d){
          if (valuesById[d.properties.ISO_A3]){
            tooltip.style("opacity", 0);
            d3.select(this).style('stroke', 'white');
          }
        })

}