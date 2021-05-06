d3.json('data.json', function (jsondata) {
    // initialize selection button
    var allVerbLabels = Object.keys(jsondata[0])
    // sort verbs
    allVerbLabels.sort(function (a, b) {
        return a.localeCompare(b);
    })
    // add the options to the button
    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allVerbLabels)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button
    
    var verblabel = 'верить'
    var verbdatal1 = jsondata[3][verblabel]
    var verbdatar1 = jsondata[5][verblabel]
    var verbdatar2 = jsondata[6][verblabel]
    var alldata = [verbdatal1, verbdatar1, verbdatar2]

});
