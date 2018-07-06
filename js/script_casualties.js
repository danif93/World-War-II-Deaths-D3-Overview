var WWII_casualties;
var bubbleBounds = d3.select("#bubble").node().getBoundingClientRect();
var stackBounds = d3.select("#stack").node().getBoundingClientRect();

var pad = 20;
var colorScale;
var xScale;
var yScale = d3.scaleLinear()
            .range([stackBounds.height-pad, pad])
            .domain([0, 100000]);

////////////////////////////  LOAD FILE & INTIALISE SVG  ////////////////////////////
window.onload = () => {
  /* LOAD ONLY WAR YEAR FOR ADAPTIVE BUBBLECHART
  d3.csv("../datasets/warMonths.csv", function (error, csv_year) {
    if (error) {
      console.log(error);
	    throw error;
    }
    csv_year.forEach(function (d) { d.year = +d.YEAR; });
    warMonths = csv_year;
  }); */

  d3.csv("../datasets/WWII_casualties.csv", function (error, csv_wwii) {
      if (error) {
        console.log(error);
  	    throw error;
      }

      WWII_casualties = csv_wwii;

      colorScale = d3.scaleSequential(d3.interpolateRainbow)
                    .domain([0,distinctCountries().length-1])

      createBubbleChart();
      //setCountriesLegend();
    });
}
////////////////////////////  END LOAD & INITIALISATION  ////////////////////////////

function distinctCountries() {
  return d3.map(WWII_casualties, function(d){ return d.COUNTRY; }).keys()
}

function createBubbleChart() {

  var svg = d3.select("#bubble");

  var bubble = d3.pack()
    .size([bubbleBounds.width, bubbleBounds.height])
    .padding(1.5);

  var nodes = d3.hierarchy( {children: dictParseCSV()} )
                .sum(function(d) { return d.count; });

  var node = svg.selectAll("g")
                .data(bubble(nodes).descendants())
                .enter()
                .filter(function(d) { return !d.children })
                .append("g")
                .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; })

  node.append("title")
      .text(function(d) { return d.data.name+": "+d.data.count; });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .attr("fill", function(d,i) { return colorScale(i); });

  node.append("text")
      .text(function(d) { return d.data.name; })
      .attr("font-size", function(d){ return d.r/5; })

  node.append("text")
      .attr("dy", "1em")
      .text(function(d) { return d.data.count; })
      .attr("font-size", function(d){ return d.r/5; })
}

function dictParseCSV (/*year*/) {
  dictList = [];
  var state;
  var count;
  WWII_casualties.forEach(function(d) {
    if (state) {
      if (state==d.COUNTRY){
        count += +d.DEATHSFINAL;
      }
      else {
        dictList.push({"name":state, "count":count});
        state = d.COUNTRY;
        count = +d.DEATHSFINAL;
      }
    }
    else {
      state = d.COUNTRY;
      count = +d.DEATHSFINAL;
    }
  });
  dictList.push({"name":state, "count":count});
  return dictList;
}
