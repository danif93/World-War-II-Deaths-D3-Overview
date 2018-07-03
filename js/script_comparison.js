var WWII_casualties
var allYear
var months = {"1":"Jan", "2":"Feb", "3":"Mar", "4":"Apr", "5":"May", "6":"Jun", "7":"Jul", "8":"Aug",
            "9":"Sep", "10":"Oct", "11":"Nov", "12":"Dec"};
var svgBounds = d3.select("#linechart").node().getBoundingClientRect()
var xpad = 30
var ypad = 55
var setColor
var list_of_months = []
var xScale
var yScale

var stateDeaths = {}
var currentMaxDeaths = 0

////////////////////////////  LOAD FILE   //////////////////////////////////////
window.onload = () => {
  d3.csv("../datasets/AllYear.csv", function (error, csv_year) {
    if (error) {
        console.log(error);
	throw error;
    }
    csv_year.forEach(function (d) {
      d.year = +d.YEAR;
    });
    allYear = csv_year;
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
      setCountries();

      setColor = d3.scaleSequential(d3.interpolateRainbow)
                       .domain([0,selectCountry().length])

      allYear.forEach(function(d){
                        if (d.YEAR >= 1939)
                          list_of_months.push(d.MONTHS.substring(0,3) + " " + d.YEAR.substring(2,4));
                      })

      xScale = d3.scaleBand()
                     .range([xpad, svgBounds.width - 20])
                     .domain(list_of_months)

      yScale = d3.scaleLinear()
                     .range([svgBounds.height -ypad, 0])
                     .domain([0, d3.max(WWII_casualties, function(d) {
                                                            return d["deathsfinal"]
                                                          })]);

      createLineChart();
  });
}
////////////////////////////  END LOAD   //////////////////////////////////////





function selectCountry () {
  return d3.map(WWII_casualties, function(d){
    return d.COUNTRY;
  }).keys()
}


function setCountries () {

  array = []
  for (var i = 0; i<31; i++)
    array.push(i)

  array.sort(function(a, b){return 0.5 - Math.random()});

  var countries = d3.select("#countries")

  var setColor = d3.scaleSequential(d3.interpolateRainbow)
                   .domain([0,30])

  var newgr = countries.selectAll("g")
                        .data(selectCountry())
                        .enter()
                        .append("g")


  newgr.append("rect")
       .attr("width", "18px")
       .attr("height", "18px")
       .attr("fill", function(d, i) {
                       return setColor(array[i]);
                    })
       .attr("opacity", 0.3)
       .attr("id", function(d , i){
         return "r" + i
       })


  newgr.append("text")
      .attr("x", 30)
      .attr("dy", "1.05em")
      .style("text-anchor", "first")
      .text(function(d){
                return d
            })
      .attr("cursor", "pointer")
      .on("click", function(d, i){
        //d3.select("#lines").select("#"+d).remove("path")
        d3.select("#r"+i).classed("selected", !d3.select("#r"+i).classed("selected"))
        addLine(d, array[i])
      })

  countries.selectAll("g").data(selectCountry()).attr("transform", (d,i) => {return 'translate(0,'+ i*19.5+ ')'})
}


function getValue(state, l) {
  var avgDeath_list = [];
  var maxDeathValue = 0

  var index = 0
  var index_months = {}

  l.forEach(function(m){
    avgDeath_list.push({"month":m, "deaths":0})
  })

  l.forEach(function(m){
    index_months[m] = index++;
  })


  WWII_casualties.forEach(function(d) {
    if (d.COUNTRY == state && d.TAGS != "holocaust-jewish") {

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
  //console.log(avgDeath_list);
  return [avgDeath_list, maxDeathValue];
}

function createLineChart(){

  d3.select("#linechart").select("#xAxis")
                        .attr("transform", "translate(0," + (svgBounds.height-ypad) + ")")
                        .transition()
                        .duration(1000)
                        .call(d3.axisBottom(xScale)
                          .ticks(list_of_months.length))
                        .selectAll("text")
                        .attr("y", 0)
                        .attr('x', 25)
                        .attr("dy", ".3em")
                        .attr("transform", "rotate(90)")



  d3.select("#linechart").select("#yAxis")
                        .attr("transform", "translate(" + xpad + ",0)")
                        .transition()
                        .duration(1000)
                        .call(d3.axisLeft(yScale)
                          .ticks(30, "s"));

}

function addLine(state, color){

  [avgDeaths_list, maxDeathValue] = getValue(state, list_of_months)

  stateDeaths[state] = avgDeaths_list

  if (maxDeathValue > currentMaxDeaths) {
    
     currentMaxDeaths = maxDeathValue

    yScale = d3.scaleLinear()
                   .range([svgBounds.height -ypad, 0])
                   .domain([0, maxDeathValue+(0.1*maxDeathValue)]);

    d3.select("#linechart").select("#yAxis")
                          .attr("transform", "translate(" + xpad + ",0)")
                          .transition(1000)
                          .call(d3.axisLeft(yScale).ticks(30, "s"));


    /////// TO BE DONE: ADJUST EXISTENT LINES TO THE NEW SCALE


  }




  var LineGenerator = d3.line()
    .x(function(d) {
      return xScale(d.month)
    })
    .y(function(d) {
      return yScale(d.deaths);
    });

    d3.select("#lines").append("path")
                       .attr('id',state)
                       .attr('stroke', setColor(color))
                       .transition()
                       .duration(1000)
                       .attr("d", LineGenerator(avgDeaths_list))



}
