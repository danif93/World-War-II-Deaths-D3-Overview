var months_list = [];
var events;
var pad = 20;
var xScale

var drag = d3.drag()
    .on("drag", function() { dragmove(this, d3.select('#drag')); })
    .on("end", function() { dragend(this, d3.select('#drag')); });

var timeLineBounds = d3.select("#timeline").node().getBoundingClientRect()

////////////////////////////  LOAD FILE   ////////////////////////////
window.onload = () => {
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
      warMonths = csv_year;
      warMonths.forEach(function(d){
        months_list.push(d.MONTHS.substring(0,3)+" "+d.YEAR.substring(2,4));
      })
      setTimeLine();
  });

  loadMap("February_1938");
  createLegend();

}
////////////////////////////  END LOADING   ////////////////////////////

function createLegend (){

  var g = d3.select("#legend")

  var status = ["Axis","Axis-occupied","Allies","Neutral"];

  var newgr = g.selectAll("g")
               .data(status)
               .enter()
               .append("g")

  newgr.append("rect")
       .attr("y", function(d,i) { return 40+(i*25) })
       .attr("width", 15)
       .attr("height", 15)
       .attr("class", function(d){ return d; });

  newgr.append("text")
       .attr("x", 25)
       .attr("y", function(d,i) { return 47+(i*25) })
       .attr("dy", ".35em")
       .text(function(d){ return d.replace("-", " ")});

}

function setTimeLine() {

  var svg = d3.select("#timeline");

  xScale = d3.scaleBand()
              .range([pad, timeLineBounds.width-pad])
              .domain(months_list)

  svg.select("#xAxis")
            .attr("transform", "translate(0,"+(timeLineBounds.height/5)+")")
            .transition().duration(1000)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 25)
            .attr("dy", "-.2em")
            .attr("transform", "rotate(90)")

  var dragrect = svg.select("#drag")
      .attr("x", pad+5)
      .attr("y", 0)
      .attr("height", timeLineBounds.height/3)
      .attr("width", xScale.bandwidth())

  xScale = d3.scaleQuantize()
              .range(warMonths)
              .domain([pad, timeLineBounds.width-pad])

  dragrect.call(drag);
}

function dragmove(d, elem) {
  elem.attr("x", d.x = Math.max(pad+10, Math.min(timeLineBounds.width-pad, d3.event.x))-elem.attr("width")/2)
}

function dragend(d, elem){
  var dateDict = xScale(elem.attr('x'))
  var date = dateDict.MONTHS+"_"+dateDict.YEAR

  var list_events_inside = []
  var list_events_outside = []

  events.forEach(function(ev){
    if (ev.DATE == date) {
      if (ev.event_pos[0] != 0)
        list_events_inside.push(ev)
      else
        list_events_outside.push(ev)
    }
  })

  loadMap(date);

  updateOutEvents(list_events_outside);
  updateEventMap(list_events_inside);
}

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

function drawMap (world, year) {

  d3.select("#map").selectAll("path").remove();

  d3.select("#map").selectAll("path")
                   .data(topojson.feature(world, world.objects[year]).features)
                   .enter()
                   .append("path")
                   .attr("d", d3.geoPath())
                   .classed("countries", true)
                   .attr("class", function(d) { return d3.select(this).attr("class")+" "+d.properties.status; })
}

function clearPoints() {
  d3.select("#points").selectAll("circle").remove();
}

function updateEventMap(list_events) {

  clearPoints();

  var tooltip = d3.select("#my_tooltip")
  	.attr("class", "tooltip")
  	.style("opacity", 0);

  list_events.forEach(function(ev){

    var point_pos = ev.event_pos;

    var points = d3.select("#points");

    points.data([point_pos])
          .append("circle")
          .attr("cx", function(d){ return d[0]; })
          .attr("cy", function(d){ return d[1]; })
          .attr("class", "gold")
          .attr("r", "6px")
          .on("mouseover", function(d) {
                          var x = d3.event.pageX
                          var y = d3.event.pageY

                          d3.select(this).attr("r", 9)

                          tooltip.transition().duration(200).style("opacity", 1);

                          tooltip.style("left", (x+10)+"px")
                                 .style("top", y+"px")
                                 .html("<h4><i>"+ ev.SUMMARY + "</i></h4>" + ev.DETAILED_INFORMATION)
                          })
          .on("mouseout", function(d) {
                          d3.select(this).attr("r", 6)
                          tooltip.transition().duration(200).style("opacity", 0);
                          })
  })
}

function updateOutEvents(list_events) {

  d3.selectAll("ul").remove();

  var title = d3.select("#event_outside");

  if (list_events.length > 0) {

    var ul = title.append("ul");

    list_events.forEach(function(ev){
      ul.append("li")
        .attr("class", "events_outside_info")
        .html("<h4><i>"+ev.SUMMARY+"</i></h4><p>"+ev.DETAILED_INFORMATION+"</p>");
    })
  }
}
