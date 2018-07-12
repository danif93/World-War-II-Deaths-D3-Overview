var WWII_casualties;
var months = {"1":"Jan", "2":"Feb", "3":"Mar", "4":"Apr", "5":"May", "6":"Jun",
              "7":"Jul", "8":"Aug", "9":"Sep", "10":"Oct", "11":"Nov", "12":"Dec"};
var svgBounds = d3.select("#linechart").node().getBoundingClientRect();
var xpad = 30;
var bottomPad = 60;
var topPad = 40;
var colorScale;
var xScale;
var yScale = d3.scaleLinear()
            .range([svgBounds.height-bottomPad, topPad])
            .domain([0, 100000]);
var months_list = [];
var LineGenerator = d3.line()
                      .x(function(d) { return xScale(d.month); })
                      .y(function(d) { return yScale(d.deaths); });
var stateDeaths = {};
var currentMaxDeaths = 0;

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
    csv_year.forEach(function(d) {
                        if (d.YEAR >= 1939)
                          months_list.push(d.MONTHS.substring(0,3)+" "+d.YEAR.substring(2,4));
                      })
    xScale = d3.scaleBand()
                .range([xpad, svgBounds.width-xpad])
                .domain(months_list)

    createLineChart();
  });

  d3.csv("../datasets/WWII_casualties.csv", function (error, csv_wwii) {
      if (error) {
        console.log(error);
  	    throw error;
      }

      WWII_casualties = csv_wwii;

      colorScale = d3.scaleSequential(d3.interpolateRainbow)
                    .domain([0,distinctCountries().length-1])

      setCountriesLegend();
  });
}
////////////////////////////  END LOAD & INITIALISATION  ////////////////////////////

function distinctCountries() {
  return d3.map(WWII_casualties, function(d){ return d.COUNTRY; }).keys()
}

function setCountriesLegend () {
  var countries = d3.select("#countries")

  var newGr = countries.selectAll("g")
                        .data(distinctCountries())
                        .enter()
                        .append("g")
                        .attr("transform", function(d,i) { return "translate(0,"+i*20+")" })

  newGr.append("rect")
       .attr("fill", function(d, i) { return colorScale(i); })
       .attr("opacity", 0.3)
       .attr("id", function(d, i){ return "r"+i })

  newGr.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .text(function(d) { return d })
      .on("click", function(d, i) {
        // toggle
        d3.select("#r"+i).classed("selected", !d3.select("#r"+i).classed("selected"))
        if (d3.select("#r"+i).classed("selected"))    addInfo(d, i)
        else  removeInfo(d)
      })
}

function createLineChart(){
  var svg = d3.select("#linechart");

  svg.select("#xAxis")
      .attr("transform", "translate(-5,"+(svgBounds.height-bottomPad)+")")
      .transition().duration(1000)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 10)
      .attr("dy", ".3em")
      .attr("transform", "rotate(90)")

  svg.select("#yAxis")
      .attr("transform", "translate("+xpad+",0)")
      .transition().duration(1000)
      .call(d3.axisLeft(yScale));

  svg.select("#grid").selectAll("line")
    .data(months_list)
    .enter()
    .append("line")
    .attr("x1", function(d) { return xScale(d); })
    .attr("x2", function(d) { return xScale(d); })
    .attr("y1", topPad)
    .attr("y2", svgBounds.height-bottomPad)
}

function getStateDeaths(state, colorIdx) {
  var avgDeaths_list = [];
  var maxDeathValue = 0

  var index = 0

  // color and state variables inside the dictionary are just used for the tooltip filling
  months_list.forEach(function(m) { avgDeaths_list.push({"month":m, "deaths":0, "civ":0, "mil":0, "state":state, "color":colorIdx}) })

  WWII_casualties.forEach(function(d) {
    if (d.COUNTRY == state) {

      var count_month = 0

      // divide the string in group of 2 numbers
      var split_startdate = d.STARTDATE.match(/.{1,2}/g)
      var split_endate = d.ENDATE.match(/.{1,2}/g)

      // how many yeat from startdate to enddate
      count_month += parseInt(split_endate[3])-parseInt(split_startdate[3])
      if (count_month > 0) { // if the period is not in the same year
        if (count_month > 1) // if there's a full year in between
          count_month = (count_month - 1) * 12
        // remaining months of the first year
        count_month += 13 - parseInt(split_startdate[1])
        // passed months of the last year
        count_month += parseInt(split_endate[1])
      }
      else // period in the same year
        count_month += parseInt(split_endate[1])-parseInt(split_startdate[1]) + 1;

      // we start counting from...
      var month = parseInt(split_startdate[1]);
      var year = parseInt(split_startdate[3])

      for (i=0; i<count_month; i++) {
        avgDeaths_list.some(function(dict) {
          if (dict.month == months[String(month)]+" "+String(year)) {
            dict.deaths += +d.DEATHSFINAL/count_month
            dict.civ += (+d.DEATHSFINAL/count_month)*(+d.CIVILIANRATE)
            dict.mil += +d.DEATHSFINAL/count_month*(1-(+d.CIVILIANRATE))

            if (dict.deaths > maxDeathValue) maxDeathValue = dict.deaths
            // once found skip the remaining cicles
            return dict.month === months[String(month)]+" "+String(year)
          }
        })
        month++
        if (month==13) {
          month = 1
          year++
        }
      }
    }
  })
  return [avgDeaths_list, maxDeathValue];
}

function addInfo(state, colorIdx){
  [avgDeaths_list, maxDeathValue] = getStateDeaths(state, colorIdx);

  if (maxDeathValue > currentMaxDeaths) { // if the line exit the chart scope...
     currentMaxDeaths = maxDeathValue;
     rescaleLinechart();
  }

  stateDeaths[state] = [avgDeaths_list, maxDeathValue];

  d3.select("#lines").append("path")
                    .attr("id", "l"+state.replace(" ", ""))
                    .attr("stroke", colorScale(colorIdx))
                    .attr("d", LineGenerator(avgDeaths_list))
                    .attr("opacity", 0)
                    .transition().duration(1000)
                    .attr("opacity", 1)

  d3.select("#points").append("g")
      .attr("id", "c"+state.replace(" ", ""))
      .selectAll("circle")
      .data(avgDeaths_list)
      .enter()
      .append("circle")
      .attr("cx", function(d) { return xScale(d.month); })
      .attr("cy", function(d) { return yScale(d.deaths); })
      .attr("r", xScale.bandwidth()/2)
      .attr("fill", colorScale(colorIdx))
      .on("mouseover", function() {
                        var x = d3.event.pageX
                        var y = d3.event.pageY
                        var tt = d3.select("#tooltip")
                        // select all the overlapping circles in that position
                        var elems = d3.selectAll(document.elementsFromPoint(d3.event.x, d3.event.y)).filter("circle")
                        var edge = Math.floor(Math.sqrt(elems._groups[0].length))
                        // if it is not a perfect square...
                        if (edge != elems._groups[0].length ) edge += 1
                        // fill the table with infos
                        for (i=0; i<edge; i++) {
                          var tr = tt.append("tr");
                          for (j=0; j<edge; j++) {
                            if (i*edge+j == elems._groups[0].length) break;
                            tr.append("td")
                              .html("<h4 style='color:"+colorScale(elems._groups[0][i*edge+j].__data__.color)+"'><b><i>"+elems._groups[0][i*edge+j].__data__.state+"</i></b></h4>"+
                                    "<h5>Period: <i>"+elems._groups[0][i*edge+j].__data__.month+"</i></h5>"+
                                    "<h5>Total Deaths: <i>"+numFormatter(elems._groups[0][i*edge+j].__data__.deaths)+"</i></h5>"+
                                    "<h6>Civilian Deaths: <i>"+numFormatter(elems._groups[0][i*edge+j].__data__.civ)+"</i></h6>"+
                                    "<h6>Military Deaths: <i>"+numFormatter(elems._groups[0][i*edge+j].__data__.mil)+"</i></h6>")
                            }
                          if (i*edge+j == elems._groups[0].length) break;
                        }
                        tt.style("left", (x-d3.select("#tooltip").node().getBoundingClientRect().width*(0.8))+"px")
                          .style("top", (y-d3.select("#tooltip").node().getBoundingClientRect().height)+"px")
                        tt.transition().duration(500).style("opacity", 1);
                      })
      .on("mouseout", function(d){
                        d3.select("#tooltip").style("opacity", 0);
                        d3.select("#tooltip").selectAll("tr").remove()
                      })
}

function removeInfo(state){
  d3.select("#lines").select("#l"+state.replace(" ", ""))
    .transition().duration(1000)
    .attr("opacity", 0)
    .remove()

  d3.select("#points").select("#c"+state.replace(" ", ""))
    .remove()

  var delStateDeath = stateDeaths[state][1]
  delete stateDeaths[state]
  if (currentMaxDeaths == delStateDeath) { // if it's removed the highest line...
    deaths = Object.values(stateDeaths)
    if (deaths.length!=0) {
      currentMaxDeaths = d3.max(deaths, function(a) {return a[1]} )
      rescaleLinechart()
    }
    else
      currentMaxDeaths = 0
  }
}

function rescaleLinechart() {
  yScale = yScale.domain([0, currentMaxDeaths+(0.1*currentMaxDeaths)]);

  d3.select("#linechart").select("#yAxis")
                        .transition().duration(1000)
                        .call(d3.axisLeft(yScale));

  Object.keys(stateDeaths).forEach(function(s){
    d3.select("#lines").select("#l"+s.replace(" ", ""))
      .transition().duration(1000)
      .attr("d", LineGenerator(stateDeaths[s][0]))

    d3.select("#points").select("#c"+s.replace(" ", ""))
      .selectAll("circle")
      .transition().duration(1000)
      .attr("cy", function(d){ return yScale(d.deaths); })
  })
}
