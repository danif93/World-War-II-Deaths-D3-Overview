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

function numFormatter(num) {
  if (num > 999999) return (num/1000000).toFixed(1)+'M';
  else if (num > 999) return (num/1000).toFixed(1)+'k';
  return parseInt(num)
}

////////////////////////////  LOAD FILE & INTIALISE SVG  ////////////////////////////
window.onload = () => {
  d3.csv("../datasets/warMonths.csv", function (error, csv_year) {
    if (error) {
      console.log(error);
	    throw error;
    }

    // we know that we have deaths only for all the periods starting from 1939
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

  // append the selected node as last child of the parent element in order to have not overlapping elements on focus;
  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

  var selCountry;

  var legend = d3.select("#countries-legend");

  var newGr = legend.selectAll("g")
                    .data(distinctCountries())
                    .enter()
                    .append("g")
                    .attr("transform", function(d,i) { return "translate(0,"+i*20+")" })

  newGr.append("rect")
       .attr("fill", function(d, i) { return colorScale(i); })
       .attr("opacity", 0.2)
       .attr("id", function(d, i){ return "r"+i })

  newGr.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .text(function(d) { return d })
      .on("click", function(d, i) {
                  // new selection: clean stacked barchart and sunburst diagram
                  d3.select("#stack").select("#rects").selectAll("g").remove()
                  d3.select("#sunburst").select("#chart").selectAll("path").remove()

                  // change the opacity for the new selection
                  d3.selectAll(".selected").classed("selected", false)
                  d3.select("#r"+i).classed("selected", true)
                  d3.select("#"+d.replace(" ", "")).select("circle").classed("selected", true)

                  setCountryInfo(d, i);
      })
      .on("mouseover", function(d,i) {
                  selCountry = d3.select("#"+d.replace(" ", ""))

                  // resize the circle if its too small...
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
                  // ... otherwise just highlight it with opacity change
                  else
                    selCountry.select("circle")
                      .transition().duration(1000)
                      .attr("opacity", 1)
                  })
      .on("mouseout", function(d) {
                  // restore the original attributes when out of focus
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

  // define the bubblechart area and space between circles
  var bubble = d3.pack()
    .size([bubbleBounds.width-xpad, bubbleBounds.height-ypad])
    .padding(1.5);

  // shallow tree: big bubble containing all the dataset (rendered circles, leaves)
  var nodes = d3.hierarchy( {children: dictParseCSV()} ).sum(function(d) { return d.count; });

  var node = zoomable_layer.selectAll("g")
                .data(bubble(nodes).descendants())
                .enter().filter(function(d) { return !d.children }) // render only the leaves (dataset)
                .append("g")
                .attr("id", function(d) { return d.data.name.replace(" ", "")})
                .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; })
                .on("click", function (d, i) {
                              // new selection: clean stacked barchart and sunburst diagram
                              d3.select("#stack").select("#rects").selectAll("g").remove()
                              d3.select("#sunburst").select("#chart").selectAll("path").remove()

                              // change the opacity for the new selection
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
      .attr("font-size", function(d) { return d.r/5; })
      .text(function(d) { return d.data.name; })

  node.append("text")
      .attr("dy", "1em")
      .attr("font-size", function(d) { return d.r/5; })
      .text(function(d) { return d.data.count; })
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

function dictParseCSV () {
  dictList = [];
  var state;
  var count;
  WWII_casualties.forEach(function(d) {
    if (state) { // 2 round or more...
      if (state==d.COUNTRY){  // current row refers to the same country of the previous one, keep adding...
        count += +d.DEATHSFINAL;
      }
      else { // current row refers to a new country, push the result and initialise
        dictList.push({"name":state, "count":count});
        state = d.COUNTRY;
        count = +d.DEATHSFINAL;
      }
    }
    else { // first round
      state = d.COUNTRY;
      count = +d.DEATHSFINAL;
    }
  });
  dictList.push({"name":state, "count":count});
  return dictList;
}

function setCountryInfo(state, idx) { // fill both the stacked barchart and the sunburst diagram
  // [0]: stacked barchart dataset
  // [1]: sunburst diagram dataset
  [yearList, dictDeathRatio] = getYearsDeathRatio(state)

  var info = d3.select("#stack").select("#stack-legend");
  // clear old legend
  info.selectAll("g").remove();

  // fill the legend with the new info
  d3.select("#title").html(state);
  var milG = info.append("g")
                  .attr("transform", "translate("+stackBounds.width/5+","+stackBounds.height/50+")")
                  .on("click", function() { // when military is selected...
                    var rects = d3.select("#stack").select("#rects");
                    // ... clear civilian focus...
                    info.selectAll("text").classed("selected", false);
                    info.selectAll(".selected-container").classed("selected-container", false);
                    // ... add military focus...
                    d3.select(this).select("text").classed("selected", true);
                    milG.select("#milContainer").classed("selected-container", true);
                    // ... and bring the military rects to the barchart base
                    rects.selectAll(".civilian")
                        .transition().duration(1000)
                        .attr("y",0)
                        .attr("height", function(d) { return yScale(d.military)-yScale(d.military+d.civilian); })
                    rects.selectAll(".military")
                        .transition().duration(1000)
                        .attr("y", function(d) { return yScale(0)-yScale(d.civilian); })
                        .attr("height", function(d) { return yScale(0)-yScale(d.military); })
                  });
  milG.append("rect")
      .attr("width", "18px")
      .attr("height", "18px")
      .attr("fill", colorScale(idx))
  milG.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .classed("selected", true)
      .text("Military")
  milG.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("height", function(){ return milG.node().getBBox().height+10; })
      .attr("width", function(){ return milG.node().getBBox().width+10; })
      .attr("fill", "none")
      .attr("id", "milContainer")
      .classed("selected-container", true)

  var civG = info.append("g")
                  .attr("transform", "translate("+stackBounds.width/1.7+","+stackBounds.height/50+")")
                  .on("click", function(d) { // when civilian is selected...
                    var rects = d3.select("#stack").select("#rects");
                    // ... clear military focus...
                    info.selectAll("text").classed("selected", false);
                    info.selectAll(".selected-container").classed("selected-container", false);
                    // ... add civilian focus...
                    d3.select(this).select("text").classed("selected", true);
                    civG.select("#civContainer").classed("selected-container", true);
                    // ... and bring the civilian rects to the barchart base
                    rects.selectAll(".military")
                        .transition().duration(1000)
                        .attr("y",0)
                        .attr("height", function(d) { return yScale(d.civilian)-yScale(d.military+d.civilian); })
                    rects.selectAll(".civilian")
                        .transition().duration(1000)
                        .attr("y", function(d) { return yScale(0)-yScale(d.military); })
                        .attr("height", function(d) { return yScale(0)-yScale(d.civilian); })
                  });
  civG.append("rect")
      .attr("width", "18px")
      .attr("height", "18px")
      .attr("fill", colorScale(idx))
      .attr("opacity", 0.5)
  civG.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .text("Civilian")
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
  // pick the highest value for rescaling the barchart
  var maxRatio = d3.max(yearList, function(dict) { return dict.total; })
  yScale = yScale.domain([0, maxRatio+(0.1*maxRatio)]);
  d3.select("#yAxis").transition().duration(1000).call(d3.axisLeft(yScale));

  var svgR = d3.select("#stack").select("#rects");

  var newGr = svgR.selectAll("g")
                  .data(yearList)
                  .enter()
                  .append("g")
                  .on("mouseover", function(d) {
                                    var x = d3.event.pageX
                                    var y = d3.event.pageY
                                    var tt = d3.select("#tooltip")
                                    tt.html("<h4><b><i>"+d.year+"</i></b></h4>"+
                                            "<h5>Total Deaths: <i>"+numFormatter(d.total)+"</i></h5>"+
                                            "<h6 style='padding-left:10px;'>Civilian Deaths: <i>"+numFormatter(d.civilian)+"</i></h6>"+
                                            "<h6 style='padding-left:10px;'>Military Deaths: <i>"+numFormatter(d.military)+"</i></h6>")
                                      .style("left", (x-d3.select("#tooltip").node().getBoundingClientRect().width)+"px")
                                      .style("top", (y-d3.select("#tooltip").node().getBoundingClientRect().height)+"px")
                                      .transition().duration(200)
                                      .style("opacity", 1);
                                  })
                  .on("mouseout", function(d){
                                    d3.select("#tooltip").transition().duration(200).style("opacity", 0);
                                  })
                  .attr("transform", function(d) {
                                    return "translate("+xScale(d.year)+","+yScale(d.total)+")";
                  })

  newGr.append("rect")
      .classed("civilian", true)
      .transition().duration(1000)
      .attr("width", xScale.bandwidth())
      .attr("fill", colorScale(i))
      .attr("height", function(d) { return yScale(d.military)-yScale(d.total); })

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

  var g = d3.select('#sunburst').select("#chart")
            .attr('transform', 'translate('+(width-xpad)/2+','+(height)/2+')');

  // Coordinate shift: cartesian -> polar
  var partition = d3.partition().size([2*Math.PI, radius]);

  // hierarchical dataset with an added property (size)
  var root = d3.hierarchy(dictDeathRatio).sum(function (d) { return d.size });

  partition(root);

  // curved path generator
  var arc = d3.arc()
      .startAngle(function (d) { return d.x0; })
      .endAngle(function (d) { return d.x1; })
      .innerRadius(function (d) { return d.y0; })
      .outerRadius(function (d) { return d.y1; });

  g.selectAll('path')
      .data(root.descendants())
      .enter().append('path')
      .on("mouseover", function(d) {
                      var g = d3.select("#percentage");
                      g.selectAll("text").remove();

                      g.append("text").text(d.data.name+":")

                      g.append("text")
                      .text(((d.value*100)/root.value).toFixed(1)+"%")
                      .attr("dy", "1em")

                      g.append("text")
                      .text("of "+numFormatter(root.value))
                      .attr("dy", "2em");

                      g.attr('transform', 'translate('+
                              (((width-xpad)/2)-(g.node().getBBox().width/2))+
                              ','+
                              (((height)/2)-(g.node().getBBox().height/4))+
                              ')');
                      })
      .on("mouseout", function(d) {
                      var g = d3.select("#percentage");
                      g.selectAll("text").remove();
                      g.append("text").text("Hover me")
                      g.attr('transform', 'translate('+
                              (((width-xpad)/2)-(g.node().getBBox().width/2))+
                              ','+
                              ((height)/2)+
                              ')');
      })
      .attr("display", function (d) { return d.depth ? null : "none"; })
      .transition().duration(1000)
      .attr("d", arc)
      .attr("fill", colorScale(idx))
      .attr("opacity", function (d) { return ((d.children? d:d.parent).data.name)=="Civilian"? 0.5:1; });

      var g = d3.select("#percentage");
      g.selectAll("text").remove()
      g.append("text").text("Hover me")
      g.attr('transform', 'translate('+
              (((width-xpad)/2)-(g.node().getBBox().width/2))+
              ','+
              ((height)/2)+
              ')')
        .attr("opacity", 0)
        .transition().duration(1000)
        .attr("opacity", 1);

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

      // fill the stacked barchart dataset
      var startYear = +(d.STARTDATE.substr(d.STARTDATE.length - 4));
      var endYear = +(d.ENDATE.substr(d.ENDATE.length - 4));
      // ex. 1941-1939 = 2 (+1 considered years)
      var year_count = endYear-startYear+1;
      // ex. fill 3 years
      for (i=0; i<year_count; i++) {
        // scan the dictionary list until you find the correspondent year
        yearList.some(function(dict, idx) {
          if (dict.year==startYear) {
            yearList[idx].civilian += ((+d.DEATHSFINAL)/year_count)*(+d.CIVILIANRATE);
            yearList[idx].military += ((+d.DEATHSFINAL)/year_count)*(1-(+d.CIVILIANRATE));
            yearList[idx].total += (+d.DEATHSFINAL)/year_count;
            return dict.year===startYear
          }
        })
        // once filled, move to the next year
        startYear++;
      }

      // fill the sunburst diagram dataset
      if (d.TAGS=="holocaust-jewish")   dictDeathRatio["children"][0]["children"][1]["size"] += (+d.DEATHSFINAL*(+d.CIVILIANRATE))
      else                              dictDeathRatio["children"][0]["children"][0]["size"] += (+d.DEATHSFINAL*(+d.CIVILIANRATE))
      dictDeathRatio["children"][1]["size"] += (+d.DEATHSFINAL)*(1-(+d.CIVILIANRATE))
    }
  })
  return [yearList, dictDeathRatio];
}
