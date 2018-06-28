var WWII_casualties


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
      .attr("dy", "1.10em")
      .style("text-anchor", "first")
      .text(function(d){
                return d
            })
      .attr("cursor", "pointer")
      .on("click", function(d, i){
        d3.select("#r"+i).classed("selected", !d3.select("#r"+i).classed("selected"))
      })

  countries.selectAll("g").data(selectCountry()).attr("transform", (d,i) => {return 'translate(0,'+ i*19.5+ ')'})
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
