d3.csv("csvdata.csv").then(d => chart(d))

function chart(csv) {

    var keys = csv.columns.slice(2);

    var verb = [...new Set(csv.map(d => d.Verb))]
    var states = [...new Set(csv.map(d => d.WindowSize))]

    verb.sort(function (a, b) {
        return a.localeCompare(b);
    })

    var d3_category20 = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']
    var colors = [
        'saddlebrown', 'navy', 'black', 'lightskyblue',
        'orangered', 'gold', 'darkgreen', 'lightgreen',
        'cornflower', 'hotpink', 'mediumpurple', 'silver',
        'aqua',' lime','magenta','plum','peachpuff','firebrick',
        'teal','blue','goldenrod','slategray'
    ]
    var color_scheme = []
    keys.forEach(function(cx, i) {
        var color = d3.interpolateTurbo(i/(keys.length + 1))
        color_scheme.push(color)
    })
    // console.log(color_scheme)
    color_scheme = color_scheme.sort(() => Math.random() - 0.5)
    var z =
        d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemePaired)


    var options = d3.select("#verb").selectAll("option")
        .data(verb)
        .enter().append("option")
        .text(d => d)

    var svg = d3.select("#chart"),
        margin = { top: 35, left: 35, bottom: 0, right: 70 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .range([margin.left, width - 100 - margin.right])
        .padding(0.1)

    var y = d3.scaleLinear()
        .rangeRound([height - margin.bottom, margin.top])

    var xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("class", "x-axis")

    var yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "y-axis")


    var startingverb = 'помочь'
    d3.select('#verb').property('value', startingverb);
    update(startingverb,0)

    function update(input, speed) {
        d3.json('jsondata/' + input + '.json').then(sentdata => withSentences(sentdata))
        function withSentences(sentencedata) {

            d3.select('#verblabel').text(input)

            var data = csv.filter(f => f.Verb == input)

            data.forEach(function (d) {
                d.total = d3.sum(keys, k => +d[k])
                return d
            })

            var cxxObj = new Object()
            data.forEach(function (w) {
                for (const [key, value] of Object.entries(w)) {
                    if (value > 0 && !(['WindowSize', 'total'].includes(key))) {
                        cxxObj[key] = 0
                    }
                }
            })
            data.forEach(function (w) {
                for (const [key, value] of Object.entries(w)) {
                    if (value > 0 && !(['WindowSize', 'total'].includes(key))) {
                        cxxObj[key] += +value
                    }
                }
            })
            var cxxList = Object.entries(cxxObj);
            cxxList = cxxList.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
            cxx = cxxList.map(elt => elt[0]);

            y.domain([0, d3.max(data, d => d3.sum(keys, k => +d[k]))]).nice();

            svg.selectAll(".y-axis").transition().duration(speed)
                .call(d3.axisLeft(y).ticks(null, "s"))

            data.sort(d3.select("#sort").property("checked")
                ? (a, b) => b.total - a.total
                : (a, b) => states.indexOf(a.WindowSize) - states.indexOf(b.WindowSize))


            x.domain(data.map(d => d.WindowSize));

            svg.selectAll(".x-axis").transition().duration(speed)
                .call(d3.axisBottom(x).tickSizeOuter(0))

            var group = svg.selectAll("g.layer")
                .data(d3.stack().keys(keys)(data), d => d.key)
                .style('cursor', 'pointer')

            group.exit().remove()

            group.enter().append("g")
                // .classed("layer", true)
                .attr('class', function(d) {
                    return 'layer ' + formatKeyClass(d.key)
                })
                .attr("fill", d => z(d.key))
                // .attr('class', function(d) {return d.key});

            var bars = svg.selectAll("g.layer").selectAll("rect")
                .data(d => d, e => e.data.WindowSize)

            bars.exit().remove()

            bars.enter().append("rect")
                .attr("width", x.bandwidth())
                .merge(bars)
                .transition().duration(speed)
                .attr("x", function (d) { return x(d.data.WindowSize) })
                .attr("y", d => y(d[1]))
                .attr('stroke', 'white')
                .attr("height", d => y(d[0]) - y(d[1]))


            // Define the div for the tooltip
            const div = d3
                .select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            // need to create dictionary which maps from rectangle to window + cx
            d3.selectAll('g.layer')
                // cursor mouseover on rectangles
                .on('mouseover', d => {

                    d3.select('#cx').text(d.key)
                    div
                        .transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    div
                        .text(d.key)
                        .style('left', d3.event.pageX - 5 + 'px')
                        .style('top', d3.event.pageY - 20 + 'px');
                })
                .on('mouseout', () => {
                    div
                        .transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            // get windowsize, cx in order to display sentences
            d3.selectAll('rect').on('mouseover', function (d) {

                var thiscx = get_cx(d)
                var windowSize = d.data.WindowSize
                d3.selectAll('.sentence').remove()
                var sentences = sentencedata[windowSize][thiscx]

                sentences.forEach(function (sent) {
                    d3.select('#sentences')
                        .append('p')
                        .attr('class', 'sentence')
                        .text(sent)
                })

                var classSelection = d3.selectAll('.'+formatKeyClass(thiscx))
                d3.selectAll('g.layer').attr('opacity',.1)
                d3.selectAll('.legend').attr('opacity',.1)
                classSelection.attr('opacity',1)
            }).on('mouseout', function(d) {
                var thiscx = get_cx(d)
                var classSelection = d3.selectAll('.'+formatKeyClass(thiscx))
                d3.selectAll('g.layer').attr('opacity',1)
                d3.selectAll('.legend').attr('opacity',1)
                classSelection.attr('opacity',1)
            })

            function get_cx(d) {
                var windowSize = d.data.WindowSize
                var y0 = d[0]
                var y1 = d[1]
                // search through stack
                var thiscx = 'undefined'
                d3.stack().keys(keys)(data).forEach(function (cxarray) {
                    var cx = cxarray.key
                    cxarray.forEach(function (miniarray, i) {
                        if ((miniarray[0] == y0) && (miniarray[1] == y1)) {
                            var thisWindowSize = miniarray.data.WindowSize
                            if (thisWindowSize == windowSize) {
                                thiscx = cx
                            }
                        }
                    })
                })
                return thiscx
            }

            var text = svg.selectAll(".text")
                .data(data, d => d.WindowSize);

            text.exit().remove()

            text.enter().append("text")
                .attr("class", "text")
                .attr("text-anchor", "middle")
                .merge(text)
                .transition().duration(speed)
                .attr("x", d => x(d.WindowSize) + x.bandwidth() / 2)
                .attr("y", d => y(d.total) - 5)
                .text(d => d.total)

            var size = 20

            d3.selectAll('.legend').remove()

            // Add one dot in the legend for each name.
            var circles = svg.selectAll("mydots")
                .data(cxx)
            circles.exit().remove()
            circles
                .enter().append("circle")
                // .attr('class', function(d, i) {'legend'})
                .attr("cx", function(d, i) {
                    if (i > 16) {
                        return width - 20
                    }
                    return width - 140})
                .attr("cy", function (d, i) { 
                    if (i > 16) {
                        return 25 + i * 25 - 425
                    }
                    return 25 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("r", 7)
                .style("fill", function (d) { return z(d) })
                .attr('class',function(d,i) { return 'legend ' + formatKeyClass(d)})

            // Add one dot in the legend for each name.
            var labels = svg.selectAll("mylabels")
                .data(cxx)
            labels.exit().remove()
            labels.enter().append("text")
                // .attr('class', 'legend')
                .attr("x", function(d, i) {
                    if (i > 16) {
                        return width - 5
                    }
                    return width - 125})
                .attr("y", function (d, i) { 
                    if (i > 16) {
                        return 25 + i * 25 - 425
                    }
                    return 25 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function (d) { return z(d) })
                .text(function (d) { return d })
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .attr('class',function(d,i) { return 'legend ' + formatKeyClass(d)})

            d3.selectAll('circle').on('mouseover', function(d) {
                legendMouseover(d3.select(this))
            }).on('mouseout', function() {
                legendMouseout(d3.select(this))
            })
            d3.selectAll('text').on('mouseover', function(d) {
                legendMouseover(d3.select(this))
            }).on('mouseout', function() {
                legendMouseout(d3.select(this))
            })

            function legendMouseover(selected) {
                var thisclass = selected.attr('class').replace('legend ','').replace('layer ','')
                d3.selectAll('g.layer').attr('opacity',.1)
                d3.selectAll('.legend').attr('opacity',.1)
                d3.selectAll('.' + thisclass).attr('opacity',1)
            }
            function legendMouseout(selected) {
                var thisclass = selected.attr('class').replace('legend ','').replace('layer ','')
                d3.selectAll('g.layer').attr('opacity',1)
                d3.selectAll('.legend').attr('opacity',1)
                d3.selectAll('.' + thisclass).attr('opacity',1)
            }
            function formatKeyClass(key) {
                return key.replaceAll('+','').replaceAll(' ','').toLowerCase()
            }
        }
    }

    var select = d3.select("#verb")
        .on("change", function () {
            update(this.value, 750)
        })

    var checkbox = d3.select("#sort")
        .on("click", function () {
            update(select.property("value"), 750)
        })

}
