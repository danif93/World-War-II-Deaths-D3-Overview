var WWII_casualties
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

function selectCountry (dataset) {
  return d3.map(dataset, function(d){
    return d.COUNTRY;
  }).keys()
}

function setCountries () {

  var countries = d3.select("#countries")
  var svgBounds = countries.node().getBoundingClientRect();

  var setColor = d3.scaleSequential(d3.interpolateRainbow)
                   .domain([0,1,2,3,4,5,6])

  console.log(setColor(6));



 var bar = d3.select("#rect")
            .selectAll("rect")
            .data(selectCountry(WWII_casualties))
            .enter()
            .append("rect")
            .attr("x", "10px")
            .attr("y", function(d) {
                     return "20px"
                  })
            .transition()
            .attr("width", "10px")
            .attr("height", "10px")
            .attr("fill", function(d) {
                              //console.log(setColor.domain());
                             return setColor(d);
                           })
            .text(function(d){
              return d;
            })

}
