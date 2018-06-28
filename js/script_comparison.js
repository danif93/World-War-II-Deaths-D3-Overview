var WWII_casualties


function selectCountry () {
  return d3.map(WWII_casualties, function(d){
    return d.COUNTRY;
  }).keys()
}

function randomArray(){
  array = []
  for (var i = 0; i<31; i++)
    array.push(i)

  return array.sort(function(a, b){return 0.5 - Math.random()});


}

function setCountries () {

  var countries = d3.select("#countries")
  var svgBounds = countries.node().getBoundingClientRect();

  var setColor = d3.scaleSequential(d3.interpolateRainbow)
                   .domain([0,30])

  var rect = d3.select("#rect");

  var newgr = rect.selectAll("g")
                  .data(selectCountry())
                  .enter()
                  .append("g")

  newgr.append("rect")
      .attr("width", "22px")
      .attr("height", "22px")
      .attr("fill", function(d, i) {
                      return setColor(i);
                    })


  newgr.append("text")
      .attr("x", 30)
      .attr("dy", "1.20em")
      .style("text-anchor", "first")
      .text(function(d){
                return d
            })
      .attr("cursor", "pointer")

  rect.selectAll("g").data(selectCountry()).attr("transform", (d,i) => {return 'translate(0,'+ i*27+ ')'})
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////  LOAD FILE   //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

d3.csv("../datasets/WWII_casualties.csv", function (error, csv_wwii) {
    if (error) {
        console.log(error);
	throw error;
    }
    csv_wwii.forEach(function (d) {
      d.deathsfinal = +d.DEATHSFINAL;
      d.civilianrate = +d.CIVILIANRATE;
    });

    WWII_casualties = csv_wwii;
    setCountries();

});
