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

function kFormatter(num) {
  return num > 999 ? (num/1000).toFixed(1) + 'k' : parseInt(num)
}

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
      setCountriesLegend();
    });
}
////////////////////////////  END LOAD & INITIALISATION  ////////////////////////////

function distinctCountries() {
  return d3.map(WWII_casualties, function(d) { return d.COUNTRY; }).keys()
}

function setCountriesLegend() {

  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

  var selRadious;
  var selCountry;

  var legend = d3.select("#countries-legend")

  var tooltip = d3.select("#my_tooltip")
  	.attr("class", "tooltip")
  	.style("opacity", 0);

  var newGr = legend.selectAll("g")
                        .data(distinctCountries())
                        .enter()
                        .append("g")
                        .attr("transform", function(d,i) { return "translate(0,"+i*20+")" })

  newGr.append("rect")
       .attr("width", "18px")
       .attr("height", "18px")
       .attr("fill", function(d, i) { return colorScale(i); })
       .attr("opacity", 0.2)
       .attr("id", function(d, i){ return "r"+i })

  newGr.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .text(function(d) { return d })
      .attr("cursor", "pointer")
      .on("click", function(d, i) {
                  d3.select("#rects").selectAll("g").remove()
                  d3.select("#chart").selectAll("path").remove()

                  d3.selectAll(".selected").classed("selected", false)
                  d3.select("#r"+i).classed("selected", true)
                  d3.select("#"+d.replace(" ", "")).selectAll("circle").classed("selected", true)

                  setCountryInfo(d, i);
      })
      .on("mouseover", function(d,i) {
                  selCountry = d3.select("#"+d.replace(" ", ""))

                  if (selCountry.select("circle").attr("r") < 70) {
                    selCountry.select("circle")
                      .transition().duration(1000)
                      .attr("opacity", 1)
                      .attr("r", 70)
                    selCountry.selectAll("text")
                      .transition().duration(1000)
                      .attr("font-size", 15)

                    selCountry.moveToFront();

                  }
                  else
                    selCountry.select("circle")
                      .transition().duration(1000)
                      .attr("opacity", 1)
                  })
      .on("mouseout", function(d) {
                  selCountry.select("circle")
                    .transition().duration(1000)
                    .attr("opacity", 0.3)
                    .attr("r", function(d) {return d.r;})
                  selCountry.selectAll("text")
                    .transition().duration(1000)
                    .attr("font-size", function(d) { return d.r/5; })
                  })
}

function createBubbleChart() {

  var svg = d3.select("#bubble");
  var zoomable_layer = svg.append("g");

  zoom = d3.zoom().scaleExtent([1, 60]).on('zoom', function() {
    return zoomable_layer.attr("transform", d3.event.transform);
  });

  svg.call(zoom);

  var bubble = d3.pack()
    .size([bubbleBounds.width-xpad, bubbleBounds.height-ypad])
    .padding(1.5);

  var nodes = d3.hierarchy( {children: dictParseCSV()} )
                .sum(function(d) { return d.count; });

  var node = zoomable_layer.selectAll("g")
                .data(bubble(nodes).descendants())
                .enter()
                .filter(function(d) { return !d.children })
                .append("g")
                .attr("id", function(d){ return d.data.name.replace(" ", "")})
                .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; })
                .on("click", function (d, i) {

                  d3.select("#rects").selectAll("g").remove()
                  d3.select("#chart").selectAll("path").remove()

                  d3.selectAll(".selected").classed("selected", false)
                  d3.select(this).select("circle").classed("selected", true)
                  d3.select("#r"+i).classed("selected", true)

                  setCountryInfo(d.data.name, i);
                });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .attr("opacity", 0.3)
      .attr("fill", function(d, i) { return colorScale(i); })

  node.append("text")
      .text(function(d) { return d.data.name; })
      .attr("font-size", function(d) { return d.r/5; })

  node.append("text")
      .attr("dy", "1.3em")
      .text(function(d) { return d.data.count; })
      .attr("font-size", function(d) { return d.r/5; })
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

function setCountryInfo(state, idx) {
  [yearList, dictDeathRatio] = getYearsDeathRatio(state)

  var info = d3.select("#stack").select("#stack-legend");
  info.selectAll("g").remove();
  d3.select("#title").html(state);

  var milG = info.append("g").attr("transform", "translate("+stackBounds.width/5+","+stackBounds.height/50+")");;
  milG.append("rect")
      .attr("width", "18px")
      .attr("height", "18px")
      .attr("fill", colorScale(idx))
  milG.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .classed("selected", true)
      .text("Military")
      .on("click", function(){
        var rects = d3.select("#stack").select("#rects");
        info.selectAll("text").classed("selected", false);
        info.selectAll(".selected-container").classed("selected-container", false);
        d3.select(this).classed("selected", true);
        milG.select("#milContainer").classed("selected-container", true);

        rects.selectAll(".civilian")
            .transition().duration(1000)
            .attr("y",0)
            .attr("height", function(d) { return yScale(d.military)-yScale(d.military+d.civilian); })
        rects.selectAll(".military")
            .transition().duration(1000)
            .attr("y", function(d) { return yScale(0)-yScale(d.civilian); })
            .attr("height", function(d) { return yScale(0)-yScale(d.military); })
      })
    milG.append("rect")
        .attr("x", -5)
        .attr("y", -5)
        .attr("height", function(){ return milG.node().getBBox().height+10; })
        .attr("width", function(){ return milG.node().getBBox().width+10; })
        .attr("fill", "none")
        .attr("id", "milContainer")
        .classed("selected-container", true)

  var civG = info.append("g").attr("transform", "translate("+stackBounds.width/1.7+","+stackBounds.height/50+")");
  civG.append("rect")
      .attr("width", "18px")
      .attr("height", "18px")
      .attr("fill", colorScale(idx))
      .attr("opacity", 0.5)
  civG.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .text("Civilian")
      .on("click", function(d) {
        var rects = d3.select("#stack").select("#rects");
        info.selectAll("text").classed("selected", false);
        info.selectAll(".selected-container").classed("selected-container", false);
        d3.select(this).classed("selected", true);
        civG.select("#civContainer").classed("selected-container", true);
        rects.selectAll(".military")
            .transition().duration(1000)
            .attr("y",0)
            .attr("height", function(d) { return yScale(d.civilian)-yScale(d.military+d.civilian); })
        rects.selectAll(".civilian")
            .transition().duration(1000)
            .attr("y", function(d) { return yScale(0)-yScale(d.military); })
            .attr("height", function(d) { return yScale(0)-yScale(d.civilian); })
      })
  civG.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("height", function() { return civG.node().getBBox().height+10; })
      .attr("width", function() { return civG.node().getBBox().width+12; })
      .attr("id", "civContainer")
      .attr("fill", "none")

  fillStack(yearList, idx);
  fillSunburst(dictDeathRatio, idx);
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
                  .on("mouseover", function(d) {
                                    var x = d3.event.pageX
                                    var y = d3.event.pageY
                                    var tt = d3.select("#tooltip")
                                    tt.html("<h4><b><i>"+d.year+"</i></b></h4>"+
                                              "<h5>Total Deaths: <i>"+kFormatter(d.total)+"</i></h5>"+
                                              "<h6 style='padding-left:10px;'>Civilian Deaths: <i>"+kFormatter(d.civilian)+"</i></h6>"+
                                              "<h6 style='padding-left:10px;'>Military Deaths: <i>"+kFormatter(d.military)+"</i></h6>")
                                      .style("left", (x-d3.select("#tooltip").node().getBoundingClientRect().width)+"px")
                                      .style("top", (y-d3.select("#tooltip").node().getBoundingClientRect().height)+"px")
                                      .transition().duration(200)
                                      .style("opacity", 1);
                                  })
                  .on("mouseout", function(d){
                                    d3.select("#tooltip").transition().duration(200).style("opacity", 0);
                                  })
                  .attr("transform", function(d) {
                    return "translate("+xScale(d.year)+","+yScale(d.military+d.civilian)+")";
                  })

  newGr.append("rect")
      .classed("civilian", true)
      .transition().duration(1000)
      .attr("width", xScale.bandwidth())
      .attr("fill", colorScale(i))
      .attr("height", function(d) { return yScale(d.military)-yScale(d.military+d.civilian); })

  newGr.append("rect")
      .classed("military", true)
      .transition().duration(1000)
      .attr("width", xScale.bandwidth())
      .attr("fill", colorScale(i))
      .attr("y", function(d) { return yScale(0)-yScale(d.civilian); })
      .attr("height", function(d) { return yScale(0)-yScale(d.military); })
}

function fillSunburst(dictDeathRatio, idx) {

  var width = sunburstBounds.width;
  var height = sunburstBounds.height;
  var radius = Math.min(width-xpad, height-ypad)/2;

  var g = d3.select('#sunburst')
      .select("#chart")
      .attr('transform', 'translate('+(width-xpad)/2+','+(height-ypad)/2+')');

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
      .on("mouseover", function(d) {
                      var g = d3.select("#percentage");
                      g.selectAll("text").remove()

                      g.append("text")
                      .text(d.data.name+":")

                      g.append("text")
                      .text(((d.value*100)/root.value).toFixed(1)+"%")
                      .attr("dy", "1em")

                      g.append("text")
                      .text("of "+kFormatter(root.value))
                      .attr("dy", "2em");

                      g.attr('transform', 'translate('+(((width-xpad)/2)-(g.node().getBBox().width/2))+','+(((height-ypad)/2)-(g.node().getBBox().height/4))+')')
                      })
      .on("mouseout", function(d) {
                      d3.select("#percentage").selectAll("text").remove()
      })
      .attr("display", function (d) { return d.depth ? null : "none"; })
      .transition().duration(1000)
      .attr("d", arc)
      .attr("fill", colorScale(idx))
      .attr("opacity", function (d) { return ((d.children? d:d.parent).data.name)=="Civilian"? 0.5:1; })

  }

function getYearsDeathRatio(state) {
  var dictDeathRatio = {
      "name": state, "children": [{
          "name": "Civilian",
          "children": [{"name": "Non-Jews", "size": 0}, {"name": "Jews", "size": 0}]
      }, { "name": "Military", "size": 0 }]};

  var yearList = [];
  warYear.forEach(function(yr) { yearList.push({"year":yr, "civilian":0, "military": 0, "total":0}); })

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
            yearList[idx].total += (+d.DEATHSFINAL)/year_count
          }
        })
        startYear++;
      }
      if (d.TAGS=="holocaust-jewish")   dictDeathRatio["children"][0]["children"][1]["size"] += (+d.DEATHSFINAL*(+d.CIVILIANRATE))
      else                              dictDeathRatio["children"][0]["children"][0]["size"] += (+d.DEATHSFINAL*(+d.CIVILIANRATE))
      dictDeathRatio["children"][1]["size"] += (+d.DEATHSFINAL)*(1-(+d.CIVILIANRATE))
    }
  })
  return [yearList, dictDeathRatio];
}
