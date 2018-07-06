var WWII_casualties;
var months = {"1":"Jan", "2":"Feb", "3":"Mar", "4":"Apr", "5":"May", "6":"Jun",
              "7":"Jul", "8":"Aug", "9":"Sep", "10":"Oct", "11":"Nov", "12":"Dec"};
var svgBounds = d3.select("#linechart").node().getBoundingClientRect();
var xpad = 30;
var ypad = 60;
var colorScale;
var xScale;
var yScale = d3.scaleLinear()
            .range([svgBounds.height-ypad, ypad-20])
            .domain([0, 100000]);
var months_list = [];
var LineGenerator = d3.line()
                      .x(function(d) { return xScale(d.month) })
                      .y(function(d) { return yScale(d.deaths); });
var stateDeaths = {};
var currentMaxDeaths = 0;

////////////////////////////  LOAD FILE & INTIALISE SVG  ////////////////////////////
window.onload = () => {
  d3.csv("../datasets/warMonths.csv", function (error, csv_year) {
    if (error) {
      console.log(error);
	    throw error;
    }
    //csv_year.forEach(function (d) { d.year = +d.YEAR; });
    warMonths = csv_year;
  });

  d3.csv("../datasets/WWII_casualties.csv", function (error, csv_wwii) {
      if (error) {
        console.log(error);
  	    throw error;
      }
      csv_wwii.forEach(function (d) {
        d.startdate = +d.STARTDATE
        d.endate = +d.ENDATE
        d.deathsfinal = +d.DEATHSFINAL;
        d.civilianrate = +d.CIVILIANRATE;
      });

      WWII_casualties = csv_wwii;

      colorScale = d3.scaleSequential(d3.interpolateRainbow)
                    .domain([0,distinctCountries().length-1])

      warMonths.forEach(function(d){
                        if (d.YEAR >= 1939)
                          months_list.push(d.MONTHS.substring(0,3)+" "+d.YEAR.substring(2,4));
                      })

      xScale = d3.scaleBand()
                  .range([xpad, svgBounds.width-xpad])
                  .domain(months_list)

      setCountriesLegend();
      createLineChart();
  });
}
////////////////////////////  END LOAD & INITIALISATION  ////////////////////////////

function distinctCountries() {
  return d3.map(WWII_casualties, function(d){ return d.COUNTRY; }).keys()
}

function setCountriesLegend () {
  array = []
  for (i=0; i<distinctCountries().length; i++)
    array.push(i)
  array.sort(function(a, b){return 0.5 - Math.random()});

  var countries = d3.select("#countries")

  var newGr = countries.selectAll("g")
                        .data(distinctCountries())
                        .enter()
                        .append("g")
                        .attr("transform", function(d,i) { return "translate(0,"+i*20+")" })

  newGr.append("rect")
       .attr("width", "18px")
       .attr("height", "18px")
       .attr("fill", function(d, i) { return colorScale(array[i]); })
       .attr("opacity", 0.2)
       .attr("id", function(d, i){ return "r"+i })

  newGr.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .text(function(d) { return d })
      .attr("cursor", "pointer")
      .on("click", function(d, i){
        d3.select("#r"+i).classed("selected", !d3.select("#r"+i).classed("selected"))
        if (d3.select("#r"+i).classed("selected"))
          addLine(d, array[i])
        else
          removeLine(d)
      })
}

function createLineChart(){

  d3.select("#linechart").select("#xAxis")
                        .attr("transform", "translate(-5,"+(svgBounds.height-ypad)+")")
                        .transition()
                        .duration(1000)
                        .call(d3.axisBottom(xScale).ticks(months_list.length))
                        .selectAll("text")
                        .attr("y", 0)
                        .attr("x", 10)
                        .attr("dy", ".3em")
                        .attr("transform", "rotate(90)")

  d3.select("#linechart").select("#yAxis")
                        .attr("transform", "translate("+xpad+",0)")
                        .transition()
                        .duration(1000)
                        .call(d3.axisLeft(yScale).ticks(30, "s"));

  d3.select("#linechart").select("#grid").selectAll("line")
    .data(months_list)
    .enter()
    .append("line")
    .attr("x1", function(d) { return xScale(d); })
    .attr("x2", function(d) { return xScale(d); })
    .attr("y1", ypad-20)
    .attr("y2", svgBounds.height-ypad)
}

function getStateDeaths(state) {
  var avgDeath_list = [];
  var maxDeathValue = 0

  var index = 0

  months_list.forEach(function(m) { avgDeath_list.push({"month":m, "deaths":0}) })

  WWII_casualties.forEach(function(d) {
    if (d.COUNTRY == state /*&& d.TAGS != "air-firebomb"*/) {

      var count_month = 0
      var startdate = d.STARTDATE
      var endate = d.ENDATE

      var split_startdate = startdate.match(/.{1,2}/g)
      var split_endate = endate.match(/.{1,2}/g)

      count_month += parseInt(split_endate[3])-parseInt(split_startdate[3])
      if (count_month > 0) {
        if (count_month > 1)
          count_month = (count_month - 1) * 12

        count_month += 13 - parseInt(split_startdate[1])
        count_month += parseInt(split_endate[1])
      }
      else{
        count_month += parseInt(split_endate[1])-parseInt(split_startdate[1]) + 1
      }

      var month = parseInt(split_startdate[1]);
      var year = parseInt(split_startdate[3])

      for (i=0; i<count_month; i++) {
        avgDeath_list.forEach(function(dict){
          if (dict.month == months[String(month)]+" "+String(year)){
            dict.deaths += parseInt(d.DEATHSFINAL/count_month)}
            if (dict.deaths > maxDeathValue) maxDeathValue = dict.deaths
        })
        month++
        if (month==13) {
          month = 1
          year++
        }
      }
    }
  })
  return [avgDeath_list, maxDeathValue];
}

function addLine(state, colorIdx){
  [avgDeaths_list, maxDeathValue] = getStateDeaths(state)

  if (maxDeathValue > currentMaxDeaths) {
     currentMaxDeaths = maxDeathValue
     rescaleLinechart()
  }

  stateDeaths[state] = [avgDeaths_list, maxDeathValue]

  d3.select("#lines").append("path")
                    .attr("id", state.replace(" ", ""))
                    .attr("stroke", colorScale(colorIdx))
                    .attr("d", LineGenerator(avgDeaths_list))
                    .attr("opacity", 0)
                    .transition()
                    .duration(1000)
                    .attr("opacity", 1)
}

function removeLine(state){
  d3.select("#lines").select("#"+state.replace(" ", ""))
    .transition()
    .duration(1000)
    .attr("opacity", 0)
    .remove()

  var delStateDeath = stateDeaths[state][1]
  delete stateDeaths[state]
  if (currentMaxDeaths == delStateDeath) {
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
                        .transition()
                        .duration(1000)
                        .call(d3.axisLeft(yScale).ticks(30, "s"));

  Object.keys(stateDeaths).forEach(function(s){
    d3.select("#lines").select("#"+s.replace(" ", ""))
    .transition()
    .duration(1000)
    .attr("d", LineGenerator(stateDeaths[s][0]))
  })
}
