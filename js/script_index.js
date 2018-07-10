var monthMap = {"Jan":"January_","Feb":"February_","Mar":"March_","Apr":"April_","May":"May_","Jun":"June_",
                "Jul":"July_","Aug":"August_","Sep":"September_","Oct":"October_","Nov":"November_","Dec":"December_"}
var months_list = [];
var events;
var pad = 20;
var xScale;
var invXScale;

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
  invXScale = d3.scaleQuantize()
              .range(warMonths)
              .domain([pad, timeLineBounds.width-pad])

  svg.select("#xAxis")

            .attr("transform", "translate(0,"+(timeLineBounds.height/5)+")")
            .call(d3.axisBottom(xScale))
  svg.select("#xAxis")
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 25)
            .attr("transform", "rotate(90)")
            .on("click", function(d){
                          xScale = d3.scaleBand()
                                      .range([pad, timeLineBounds.width-pad])
                                      .domain(months_list)

                          var arr = d.split(" ");
                          var date = monthMap[arr[0]]+"19"+arr[1];
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

                          d3.select("#drag")
                            .transition()
                            .duration(1000)
                            .attr("x", xScale(d))

                          loadMap(date);

                          updateOutEvents(list_events_outside);
                          updateEventMap(list_events_inside);
                        })

  var dragrect = svg.select("#drag")
      .attr("x", pad)
      .attr("y", 0)
      .attr("height", timeLineBounds.height/3)
      .attr("width", xScale.bandwidth())

  dragrect.call(drag);
}

function dragmove(d, elem) {
  elem.attr("x", d.x = Math.max(pad+10, Math.min(timeLineBounds.width-pad, d3.event.x))-elem.attr("width")/2)
}

function dragend(d, elem){

  var dateDict = invXScale(elem.attr('x'))
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

                          d3.select("#tooltip").transition().duration(200).style("opacity", 1);

                          d3.select("#tooltip").style("left", (x+15)+"px")
                                 .style("top", y+"px")
                                 .html("<h4><i>"+ ev.SUMMARY + "</i></h4>" + ev.DETAILED_INFORMATION)
                          })
          .on("mouseout", function(d) {
                          d3.select(this).attr("r", 6)
                          d3.select("#tooltip").transition().duration(200).style("opacity", 0);
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
