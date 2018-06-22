var WWII_casualties;
var Events;
var projection;


function drawMap (world, year) {
  var path = d3.geoPath();
  d3.select("#map").selectAll("path")
                   .data(topojson.feature(world, world.objects[year]).features)
                   .enter()
                   .append("path")
                   .attr("d", path)
                   .attr("class", "countries")
                   .attr('id', function(d){
                     return d.properties.status
                   });
}




function setimeLine(){

//tutta sta parte deve andare dentro un onClick()
  var list_events_inside = []
  var list_events_outside = []

  Events.forEach(function(ev){
    if (ev.DATE == year) {
      if (ev.event_pos[0] != 0){
        list_events_inside.push(ev)
      }
      else {
        list_events_outside.push(ev)
      }
    }
  })

  //loadMap(year)
  updateMap(list_events_inside)
  updateOutEvents(list_events_outside)

}







function clearMap() {
    d3.select("#points").selectAll("circle").remove();

    d3.select("#map").selectAll(".axis").classed("axis", false)
    d3.select("#map").selectAll(".axis_occupied").classed("axis_occupied", false)
    d3.select("#map").selectAll(".allies").classed("allies", false)
    d3.select("#map").selectAll(".neutral").classed("neutral", false)
}

function updateMap(list_events) {

    clearMap();

    var tooltip = d3.select("#my_tooltip")
    	.attr("class", "tooltip")
    	.style("opacity", 0);

    list_events.forEach(function(ev){

      var point_pos = ev.event_pos;

      var points = d3.select("#points");

      points.data([point_pos])
            .append("circle")
            .attr('cx', function(d){
                         return d[0];
                       })
            .attr('cy', function(d){
                         return d[1]
                       })
            .attr('class', "gold")
            .attr("r", "7px")
            .on("mouseover", function(d) {

                                var x = d3.event.pageX
                                var y = d3.event.pageY

                                d3.select(this)
                                  .attr("r", 9)

                                tooltip.transition()
                                       .duration(200)
                                       .style("opacity", .9);

                                tooltip.style("left", (x + 10) + "px")
                                       .style("top", y + "px")
                                       .style('display', "inline")
                                       .html(ev.SUMMARY + ".<br>" + ev.DETAILED_INFORMATION)

                              })
            .on("mouseout", function(d) {
                            d3.select(this)
                              .attr("r", 6)
                              tooltip.transition()
                                     .duration(200)
                                     .style("opacity", 0);
                          })
    })

    d3.select("#map").selectAll("#Axis").classed('axis', true);
    d3.select("#map").selectAll("#Axis-occupied").classed('axis_occupied', true);
    d3.select("#map").selectAll("#Allies").classed('allies', true);
    d3.select("#map").selectAll("#Neutral").classed('neutral', true);

}


function updateOutEvents(list_events) {

}



////////////////////////////////////////////////////////////////////////////////
////////////////////////////  LOAD FILE   //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function loadMap (year) {
  d3.json("../datasets/TopoJsonFinal/"+year+".json", function (error, world) {
      if (error) {
          console.log(error);
  	throw error;
      }
    drawMap(world, year);
  });
}


d3.csv("../datasets/events.csv", function (error, csv_events) {
    if (error) {
        console.log(error);
	throw error;
    }
    csv_events.forEach(function (d) {
      d.event_pos = [+d.LAT, +d.LON];
    });

    Events = csv_events;

});


/*

d3.csv("../datasets/WWII_casualties.csv", function (error, csv) {
    if (error) {
        console.log(error);
	throw error;
    }
    csv.forEach(function (d) {
      d.deathsFinal = +d.DEATHSFINAL;
      d.civilianRate = +d.CIVILIANRATE;
    });
    // Store csv data in a global variable
    WWII_casualties = csv;


});

*/


window.onload = () => {
  loadMap("April_1938")
}
