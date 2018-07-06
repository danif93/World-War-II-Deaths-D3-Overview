var WWII_casualties;
var warYear = [];
var bubbleBounds = d3.select("#bubble").node().getBoundingClientRect();
var stackBounds = d3.select("#stack").node().getBoundingClientRect();

var xpad = 40;
var ypad = 40;

var colorScale;
var xScale;
var yScale = d3.scaleLinear()
                .domain([0, 1000000])
                .range([stackBounds.height-ypad, ypad]);

////////////////////////////  LOAD FILE & INTIALISE SVG  ////////////////////////////
window.onload = () => {
  d3.csv("../datasets/warMonths.csv", function (error, csv_year) {
    if (error) {
      console.log(error);
	    throw error;
    }
    warYear = d3.map(csv_year, function(d) { if(+d.YEAR > 1938) return d.YEAR; else return 1939; }).keys()

    xScale = d3.scaleBand()
                .domain(warYear)
                .range([xpad, stackBounds.width-xpad])
                .padding(0.1)

    createStackChart();
  });

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
  return d3.map(WWII_casualties, function(d) { return d.COUNTRY; }).keys()
}


function createStackChart() {
  var svg = d3.select("#stack")

  svg.select("#xAxis")
      .attr("transform", "translate(0,"+(stackBounds.height-ypad)+")")
      .transition().duration(1000)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 20)
      .attr("dy", ".3em")
      .attr("transform", "rotate(90)")

  svg.select("#yAxis")
      .attr("transform", "translate("+xpad+",0)")
      .transition().duration(1000)
      .call(d3.axisLeft(yScale));
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
                .attr("id", function(d) { return d.data.name.replace(" ",""); })
                .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; })
                .on("click", function (d, i) {
                  d3.select("#rects").selectAll("g").remove()
                  fillStack(d.data.name, i);
                });

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

function fillStack(state, i) {

  var yearsRatio = getYearsDeathRatio(state);

  var maxRatio = d3.max(yearsRatio, function(dict) { return dict.civilian+dict.military; })
  yScale = yScale.domain([0, maxRatio+(0.1*maxRatio)]);
  d3.select("#yAxis")
    .transition().duration(1000)
    .call(d3.axisLeft(yScale));

  var svgR = d3.select("#rects");

  var newGr = svgR.selectAll("g")
                  .data(yearsRatio)
                  .enter()
                  .append("g")
                  .attr("transform", function(d) {
                    return "translate("+xScale(d.year)+","+yScale(d.military+d.civilian)+")";
                  })

  newGr.append("rect")
      .attr("width", xScale.bandwidth())
      .attr("fill", colorScale(i))
      .attr("height", function(d) { return yScale(d.military)-yScale(d.military+d.civilian); })
      .style("opacity", 0)
      .transition().duration(1000)
      .style("opacity", 0.5)


  newGr.append("rect")
      .attr("width", xScale.bandwidth())
      .attr("y", function(d) { return yScale(0)-yScale(d.civilian); })
      .attr("fill", colorScale(i))
      .attr("height", function(d) { return yScale(0)-yScale(d.military); })
      .style("opacity", 0)
      .transition().duration(1000)
      .style("opacity", 1)


}

function getYearsDeathRatio(state) {
  var yearList = []
  warYear.forEach(function(yr) { yearList.push({"year":yr, "civilian":0, "military": 0}); })

  WWII_casualties.forEach(function(d) {
    if (d.COUNTRY==state) {
      var startYear = +(d.STARTDATE.substr(d.STARTDATE.length - 4));
      var endYear = +(d.ENDATE.substr(d.ENDATE.length - 4));
      var year_count = endYear-startYear+1;
      for (i=0; i<year_count; i++) {
        yearList.forEach(function(dict, idx) {
          if (dict.year==startYear) {
            yearList[idx].civilian += ((+d.DEATHSFINAL)/year_count)*(+d.CIVILIANRATE)
            yearList[idx].military += ((+d.DEATHSFINAL)/year_count)*(1-(+d.CIVILIANRATE))
          }
        })
        startYear++;
      }
    }
  })
  return yearList;
}
