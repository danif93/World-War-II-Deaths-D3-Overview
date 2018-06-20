var WWII_casualties;
var events
var projection;


function drawMap (world) {

    var path = d3.geoPath();
    d3.select("#map").selectAll("path")
                     .data(topojson.feature(world, world.objects.April_1943).features)
                     .enter()
                     .append("path")
                     .attr("d", path)
                     .attr('id', function(d){
                       return d.properties.name;
                     })
                     .attr("fill", function(d){

                      var curr_status = d.properties.status;

                      if (curr_status == "Axis" )
                         return "#BF360C";
                      else
                        if (curr_status == "Axis-occupied")
                          return "#EF5350";
                        else
                          if (curr_status == "Allies")
                            return "#0277BD";
                          else
                            return "#B0BEC5";

                     })
}














function clearMap() {

    // ******* TODO: PART V*******
    //Clear the map of any colors/markers; You can do this with inline styling or by
    //defining a class style in styles.css

    //Hint: If you followed our suggestion of using classes to style
    //the colors and markers for hosts/teams/winners, you can use
    //d3 selection and .classed to set these classes on and off here.

    d3.select("#points").selectAll("circle").remove();

    d3.select("#map").selectAll(".host").classed("host", false)
    d3.select("#map").selectAll(".team").classed("team", false)
}


/**
 * Update Map with info for a specific FIFA World Cup
 * @param the data for one specific world cup
 */
function updateMap(worldcupData) {

    //Clear any previous selections;
    clearMap();


    // ******* TODO: PART V *******

    // Add a marker for the winner and runner up to the map.
    var winner_pos = projection(worldcupData.win_pos);
    var ru_pos = projection(worldcupData.ru_pos);
    var host = worldcupData.host_country_code;
    var teams_iso = worldcupData.teams_iso;

    var points = d3.select("#points");

    //Hint: remember we have a conveniently labeled class called .winner
    // as well as a .silver. These have styling attributes for the two
    //markers.

    points.data([winner_pos])
          .append("circle")
          .attr('cx', function(d){
                       return d[0];
                     })
          .attr('cy', function(d){
                       return d[1]
                     })
          .attr('class', "gold")
          .attr("r", "7px")

    points.data([ru_pos])
          .append("circle")
          .attr('cx', function(d){
                       return d[0];
                     })
          .attr('cy', function(d){
                       return d[1]
                     })
          .attr('class', "silver")
          .attr("r", "7px")


    //Select the host country and change it's color accordingly.
    d3.select("#"+ host).classed('host', true)
    //Iterate through all participating teams and change their color as well.
    teams_iso.forEach(function(team) {
      if (team != host)
        d3.select("#"+ team).classed('team', true)
    })
    //We strongly suggest using classes to style the selected countries.

}




















//function loadMap (year) {
  //al posto di April_1938 ci andrà year
  d3.json("../datasets/TopoJsonFinal/April_1943.json", function (error, world) {
      if (error) {
          console.log(error);
  	throw error;
      }
    console.log(world);
    drawMap(world);
  });
//}


d3.csv("../datasets/events.csv", function (error, csv) {
    if (error) {
        console.log(error);
	throw error;
    }
    csv.forEach(function (d) {
      d.event_pos = [+d.LAT, +d.LON];
    });
    // Store csv data in a global variable
    events = csv;
    console.log(events);
});


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

    //createBarChart('attendance');
    console.log(WWII_casualties);
});
