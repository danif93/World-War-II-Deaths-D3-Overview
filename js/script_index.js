var warMonths;
var events;

function setYear(year){
  var pad = 50;
  var list_months = []

  warMonths.forEach(function(d){
                if (d.year == year)
                  list_months.push(d.MONTHS)
                })

  var xScale = d3.scaleBand()
                .domain(list_months.map(function(d){
                                return d
                              }))
                .range([pad, d3.select("#timeline").node().getBoundingClientRect().width - 1]);

  return d3.axisBottom(xScale)
}



function createLegend (){

  var g = d3.select('#legend')

  var status = [{s:"Axis", c:"#BF360C"},{s:"Axis occupied", c:"#EF5350"}, {s:"Allies", c:"#0277BD"}, {s:"Neutral", c:"#d9d9d9"}];

  var newgr = g.selectAll("g")
               .data(status)
               .enter()
               .append("g")

  newgr.append("rect")
       .attr("x", 12 )
       .attr("y", function(d,i) {
                    return 40 + (i * 25)
                  })
       .attr("width", 15)
       .attr("height", 15)
       .style("fill", function(d){
                        return d.c
                      });

  newgr.append("text")
       .attr("x", 37)
       .attr("y", function(d,i) {
                    return 47 + (i * 25)
                  })
       .attr("dy", ".35em")
       .style("text-anchor", "first")
       .text(function(d){
                return d.s
              });

}

function drawMap (world, year) {

  d3.select('#map').selectAll("path").remove();

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

  var pad = 50;
  var list_events_inside = []
  var list_events_outside = []

  var xScale = d3.scaleBand()
                 .domain(warMonths.map(function(d){
                                return d.year
                              }))
                 .range([pad, d3.select("#timeline").node().getBoundingClientRect().width - 1])

  var timeline = d3.select("#timeline");

  timeline.call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("y", 20)
      .attr("x", 0)
      .attr("dy", ".35em")
      .attr("cursor", "pointer")
      .on("click", function(d) {

        timeline.call(setYear(d));

        d3.event.stopPropagation();

        timeline.selectAll("text")
            .attr("cursor", "pointer")
            .on("click", function(f){

              var year = f + "_" + d;

              events.forEach(function(ev){

                if (ev.DATE == year) {
                  if (ev.event_pos[0] != 0){
                    list_events_inside.push(ev)
                  }
                  else {
                    list_events_outside.push(ev)
                  }
                }
              })

              loadMap(year);

              setTimeout(function () {
                updateOutEvents(list_events_outside,d);
                updateMap(list_events_inside);
                list_events_inside = []
                list_events_outside = []

              }, 20);

              setimeLine()
            })
      })

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
            .attr("cursor", "pointer")
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
                                       .html("<h4><i>"+ ev.SUMMARY + "</i></h4>" + ev.DETAILED_INFORMATION)

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


function updateOutEvents(list_events, year) {

  d3.selectAll('ul').remove();
  var title = d3.select("#event_outside")

  if (list_events.length > 0) {

    var ul = title.append("ul");

    list_events.forEach(function(ev){
      ul.append("li")
        .attr('class', 'events_outside_info')
        .html("<h4><i>"+ev.SUMMARY+"</i></h4><p>"+ev.DETAILED_INFORMATION+"</p>");
    })
  }



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
    var res = year.split("_")
    d3.select("#title").html("<h2>"+res[1]+", "+res[0]+"</h2>")
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

    events = csv_events;
});


d3.csv("../datasets/warMonths.csv", function (error, csv_year) {
    if (error) {
        console.log(error);
	throw error;
    }
    csv_year.forEach(function (d) {
      d.year = +d.YEAR;
    });
    warMonths = csv_year;

    setimeLine()
});


window.onload = () => {
  loadMap("February_1938")
  createLegend()
}
