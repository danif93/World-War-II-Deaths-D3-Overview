var WWII_casualties


function selectCountry () {
  return d3.map(WWII_casualties, function(d){
    return d.COUNTRY;
  }).keys()
}

function setCountries () {

  var countries = d3.select("#countries")
  var svgBounds = countries.node().getBoundingClientRect();

  var setColor = d3.scaleSequential(d3.interpolateRainbow)
                   .domain([0,30])

  console.log(selectCountry ());
  console.log(setColor('Italy'));

  var bar = d3.select("#rect")
            .selectAll("rect")
            .data([0,1,2,3,4,])
            .enter()
            .append("rect")
            .attr("x", 10)
            .attr("y", 20)
            .attr("width", "10px")
            .attr("height", "10px")
            .attr("fill", function(d) {
                            return setColor(d);
                          })

  var country = d3.select("#coun")
                  .data(selectCountry())
                  .enter()
                  .append("text")
                  .attr("x", 10)
                  .attr("y", 20)
                  .text(function(d){
                    return d
                  });


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
