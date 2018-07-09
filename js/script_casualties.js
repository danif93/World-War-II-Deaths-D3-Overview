var WWII_casualties;
var warYear = [];
var bubbleBounds = d3.select("#bubble").node().getBoundingClientRect();
var stackBounds = d3.select("#stack").node().getBoundingClientRect();
var sunburstBounds = d3.select("#sunburst").node().getBoundingClientRect();

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

      //createSunburst()

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
  var zoomable_layer = svg.append("g");

  zoom = d3.zoom().scaleExtent([1, 60]).on('zoom', function() {
    return zoomable_layer.attr("transform", d3.event.transform);
  });

  svg.call(zoom);

  var bubble = d3.pack()
    .size([bubbleBounds.width, bubbleBounds.height])
    .padding(1.5);

  var nodes = d3.hierarchy( {children: dictParseCSV()} )
                .sum(function(d) { return d.count; });

  var node = zoomable_layer.selectAll("g")
                .data(bubble(nodes).descendants())
                .enter()
                .filter(function(d) { return !d.children })
                .append("g")
                .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; })
                .on("click", function (d, i) {
                  [yearList, dictDeathRatio] = getYearsDeathRatio(d.data.name)
                  d3.select("#rects").selectAll("g").remove()
                  d3.select("#chart").selectAll("path").remove()
                  console.log(yearList);
                  console.log(dictDeathRatio);
                  fillStack(yearList, i);
                  fillSunburst(dictDeathRatio, i);
                });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .attr("fill", function(d,i) { return colorScale(i); });

  node.append("text")
      .text(function(d) { return d.data.name; })
      .attr("font-size", function(d) { return d.r/5; })

  node.append("text")
      .attr("dy", "1em")
      .text(function(d) { return d.data.count; })
      .attr("font-size", function(d) { return d.r/5; })

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

function fillStack(yearList, i) {

  var maxRatio = d3.max(yearList, function(dict) { return dict.civilian+dict.military; })
  yScale = yScale.domain([0, maxRatio+(0.1*maxRatio)]);
  d3.select("#yAxis")
    .transition().duration(1000)
    .call(d3.axisLeft(yScale));

  var svgR = d3.select("#rects");

  var newGr = svgR.selectAll("g")
                  .data(yearList)
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

function fillSunburst(dictDeathRatio, i) {

  // Variables
  var width = sunburstBounds.width;
  var height = sunburstBounds.height;
  var radius = Math.min(width, height) / 2;
  var color = d3.scaleOrdinal(d3.schemeCategory20b);

  // Create primary <g> element
  var g = d3.select('#sunburst')
      .select("#chart")
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

  // Data strucure
  var partition = d3.partition()
      .size([2 * Math.PI, radius]);

  // Find data root
  var root = d3.hierarchy(dictDeathRatio)
      .sum(function (d) { return d.size});

  // Size arcs
  partition(root);
  var arc = d3.arc()
      .startAngle(function (d) { return d.x0; })
      .endAngle(function (d) { return d.x1; })
      .innerRadius(function (d) { return d.y0; })
      .outerRadius(function (d) { return d.y1; });

  // Put it all together
  g.selectAll('path')
      .data(root.descendants())
      .enter().append('path')
      .attr("display", function (d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill", colorScale(i))
      .attr("opacity", function (d) { return ((d.children ? d : d.parent).data.name)=="Civilian"? 0.5 : 1; });
}

function getYearsDeathRatio(state) {
  var dictDeathRatio = {
      "name": state, "children": [{
          "name": "Civilian",
          "children": [{"name": "Population", "size": 0}, {"name": "Jews", "size": 0}]
      }, { "name": "Military", "size": 0 }]};

  var yearList = [];
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
      if (d.TAGS=="holocaust-jewish")   dictDeathRatio["children"][0]["children"][1]["size"] += +d.DEATHSFINAL
      else                              dictDeathRatio["children"][0]["children"][0]["size"] += +d.DEATHSFINAL
      dictDeathRatio["children"][1]["size"] += (+d.DEATHSFINAL)*(1-(+d.CIVILIANRATE))
    }
  })
  return [yearList, dictDeathRatio];
}
