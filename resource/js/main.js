var svgContainer;
var data;
var posIdMap;
var idPosMap;
var cols;
var magnifiedPos;
var metadata;
var unfilteredData;
var csv_file = "resource/data/sample-dataset.csv";
var strokeWidth = 1;

var JSTableLens = {
    WIDTH: 800,
    HEIGHT: 450,
    ROWS: 200,
    COLUMNS: 6,
    COLUMN_WIDTH: 130,
    ROW_HEIGHT: 2,
//  ROW_HEIGHT: 2,
    EXTRA_ROW_HEIGHT: 18,
    HEADER_HEIGHT: 20,
    Y_MIN: 20,
    X_MIN: 0,
    TEXT_VISIBLE_HEIGHT: 20,
    NUM_ROWS_ONE_SIDE: 2,
    CURRENT_SORT_COL: "",
    FONT_SIZE: "14px"
}

function initSlider() {
    var selector = "#slider";
    $(selector).slider("option", "min", 0);
    $(selector).slider("option", "max", JSTableLens.ROWS);
    $(selector).slider("option", "value", JSTableLens.ROWS);
    setSliderNonzoom();
}


function setSliderZoomed() {
    $("#slider").css("height", (JSTableLens.ROW_HEIGHT * JSTableLens.ROWS + 10) + "px");
}

function setSliderNonzoom() {
    $("#slider").css("height", (JSTableLens.ROW_HEIGHT * JSTableLens.ROWS - 90) + "px");
}

function updateZoomArea(val) {
    var max = $("#slider").slider("option", "max");
    var actualval = max - val;
    actualval = Math.max(actualval, JSTableLens.NUM_ROWS_ONE_SIDE);
    actualval = Math.min(actualval, JSTableLens.ROWS - JSTableLens.NUM_ROWS_ONE_SIDE);
    zoom(actualval);
    $("#row-label").html("Row " + (actualval - JSTableLens.NUM_ROWS_ONE_SIDE) + " to " + (actualval + JSTableLens.NUM_ROWS_ONE_SIDE) + " out of " + max);
    setSliderZoomed();
}


function updateZoomAreaForFiltering() {
    var max = $("#slider").slider("option", "max");
    $("#row-label").html("Row " + 1 + " from " + max);
    setSliderZoomed();
}

$(document).ready(function () {

    $("#slider").slider({
        orientation: "vertical",
        min: 0,
        max: 100,
        value: 100,
        slide: function (event, ui) {
//            $("#amount").val(ui.value);
            updateZoomArea(ui.value);
        }
    });
//    $("#amount").val($("#slider-vertical").slider("value"));

    $('#query').on('input', function () {
//        alert($(this).val());
        var q = $(this).val();
        console.log("query: " + q + " " + q.length);
        if (q.length == 0) {
            clearFilter();
            updateZoomAreaForFiltering();
        } else {

            filterData(q);
            updateZoomAreaForFiltering();
        }
    });

    $("#clear-filter-link").click(function () {
        $('#query').val("");
        clearFilter();
        updateZoomAreaForFiltering();
    });


    $("#reset-link").click(function () {
        $('#query').val("");
        resetData();
        updateZoomAreaForFiltering();
    });


    $("#import-button").click(function () {
//        alert("Hello");
//        console.log(csv_file);
//        console.log($("#url").text());
        d3.select("#container").remove();
        var url = $("#url").text();
        importData(url);
//        alert("import " + csv_file);
        $('#query').val("");
//        resetData();
//        updateZoomAreaForFiltering();
    });

    $("#plus-button").click(function () {
        var val = $("#slider").slider("value");
        var newval = Math.max(val - 1, 0);
        $("#slider").slider("value", newval);
        console.log($("#slider").slider("value"));
        updateZoomArea(newval);
    });


    $("#minus-button").click(function () {
        var val = $("#slider").slider("value");
        var max = $("#slider").slider("option", "max");
        var newval = Math.min(val + 1, max);
        $("#slider").slider("value", newval);
        console.log($("#slider").slider("value"));
        updateZoomArea(newval);
    });

    if (getParam("ds") != "") {
        csv_file = "resource/data/" + getParam("ds") + ".csv";
    }
    if (getParam("h") != "") {
        JSTableLens.ROW_HEIGHT = getParam("h");
    }
    importData(csv_file);


});


function importData(file) {
    d3.csv(file)
            .get(function (error, rows) {
//                console.log(rows);
                data = rows;
                console.log(data);
                unfilteredData = null;
                cols = Object.keys(rows[0]);
                fillMetadata();
                posIdMap = {};
                idPosMap = {};
                magnifiedPos = [-1, -1];
                JSTableLens.ROWS = data.length;
                JSTableLens.COLUMNS = Object.keys(data[0]).length;
                JSTableLens.WIDTH = JSTableLens.COLUMN_WIDTH * JSTableLens.COLUMNS;
                JSTableLens.HEIGHT = JSTableLens.ROW_HEIGHT * JSTableLens.ROWS + JSTableLens.EXTRA_ROW_HEIGHT * (JSTableLens.NUM_ROWS_ONE_SIDE * 2 + 1);
                createTable("#container");
                initSlider();
                for (var i = 0; i < data.length; i++) {
                    createRow(data[i], i);
                    data[i].id = i;
                    posIdMap[i] = i;
                    idPosMap[i] = i;
                }
            });
}

function createTable(selector) {
    //Make an SVG Container
    svgContainer = d3.select(selector).append("svg")
            .attr("width", JSTableLens.WIDTH + JSTableLens.X_MIN)
            .attr("height", JSTableLens.HEIGHT + JSTableLens.Y_MIN);
    createHeader(cols);
//    Draw the Rectangle
//    var rectangle = svgContainer.append("rect")
//            .attr("x", JSTableLens.X_MIN)
//            .attr("y", JSTableLens.Y_MIN)
//            .attr("width", JSTableLens.WIDTH)
//            .attr("height", JSTableLens.HEIGHT)
////            .attr("color", "blue")
//            .attr("fill-opacity", "0")
//            .attr("stroke", "grey");
}

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


function createRow(row, index) {
    var rowGroup = svgContainer.append("g").attr("id", "g".concat(index))
            .attr("transform", ("translate(0,".concat(getY(index))).concat(")"))
            .on("click", function () {
                var test = 0;
                console.log($(this));

            });
    for (var i = 0; i < cols.length; i++) {
        //Draw the Rectangle

        var rectangle = rowGroup.append("rect")
                .attr("id", "outerrrect")
                .attr("x", getX(i))
                .attr("y", 0)
                .attr("width", JSTableLens.COLUMN_WIDTH)
                .attr("height", JSTableLens.ROW_HEIGHT)
                .style("fill", "none")
                .style("stroke", "none")
                .style("stroke-width", 0)
                ;

        var rgb = hslToRgb(Math.floor((300 * i) / cols.length) / 360, 1, getLuminance(cols[i], 90, 55, row[cols[i]]) / 100);
        var bar = rowGroup.append("rect")
                .attr("x", getX(i) + getBarMinX(cols[i], JSTableLens.COLUMN_WIDTH, row[cols[i]]))
                .attr("y", 0)
                .attr("width", getWidth(cols[i], JSTableLens.COLUMN_WIDTH, row[cols[i]]))
                .attr("height", JSTableLens.ROW_HEIGHT)
                .style("fill", rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16))
                .style("stroke", "none")
                .style("stroke-width", 0);

        var visiblity = "hidden";
        if (rectangle.attr("height") > JSTableLens.TEXT_VISIBLE_HEIGHT) {
            visiblity = "visible";
        }

        var text = rowGroup.append("text")
                .attr("x", getX(i) + JSTableLens.COLUMN_WIDTH / 2)
                .attr("y", (JSTableLens.ROW_HEIGHT + JSTableLens.EXTRA_ROW_HEIGHT) / 2)
                .text(row[cols[i]])
                .attr("font-family", "sans-serif")
                .attr("font-size", JSTableLens.FONT_SIZE)
                .style("visibility", visiblity)
                .style("text-anchor", "middle")
                .style("alignment-baseline", "middle")
                ;
    }
}


function createHeader() {
    var rowGroup = svgContainer.append("g").attr("id", "header")
            .on("click", function () {
                var test = 0;
                console.log($(this));
            }
            );

    for (var i = 0; i < cols.length; i++) {
        var rectangle = rowGroup.append("rect")
                .attr("x", getX(i))
                .attr("y", 0)
                .attr("width", JSTableLens.COLUMN_WIDTH)
                .attr("height", JSTableLens.HEADER_HEIGHT)
                .attr("class", "table-header")
                .style("fill", "none")
                .style("stroke", "black")
                .style("stroke-width", "1")
                ;

        var text = rowGroup.append("text")
                .attr("x", getX(i) + 10)
                .attr("y", 15)
                .text(cols[i])
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("class", "table-header-text")
                ;

        var sort_icon = rowGroup.append("svg:image")
                .attr("xlink:href", "resource/images/sort_both.png")
                .attr("x", getX(i) + JSTableLens.COLUMN_WIDTH - 20)
                .attr("y", 3)
                .attr("sortmode", "none")
                .attr("col", cols[i])
                .attr("width", "14")
                .attr("height", "14")
                .attr("class", "table-header-sort-button")
                .attr("id", "sort_icon_".concat(i))
                ;

        sort_icon.on("click", function () {
            var test = 0;
            var icon = $(this).select("svg:image");
            var sortmode = icon.attr("sortmode");
            //reset all other icons
            console.log(d3.select(this.parentNode));
            console.log(sortmode);
            if (JSTableLens.CURRENT_SORT_COL != "") {
                var old_icon = d3.select("#".concat(JSTableLens.CURRENT_SORT_COL))
                        .attr("sortmode", "none")
                        .attr("href", "resource/images/sort_both.png");
            }
            JSTableLens.CURRENT_SORT_COL = icon.attr("id");
            if (sortmode == "none" || sortmode == "desc") {
                icon.attr("sortmode", "asc");
                icon.attr("href", "resource/images/sort_asc.png");
                sortData(icon.attr("col"), true);
            } else {
                icon.attr("sortmode", "desc");
                icon.attr("href", "resource/images/sort_desc.png");
                sortData(icon.attr("col"), false);
            }
            setSliderNonzoom();
        });

    }
}

function getX(index) {
    return JSTableLens.X_MIN + index * JSTableLens.COLUMN_WIDTH;
}

function getY(index) {
    return JSTableLens.Y_MIN + index * JSTableLens.ROW_HEIGHT;
}

function getBarMinX(col, width, value) {
    if (metadata[col]["type"] == "number") {
        return 0;
    } else {
        var width_each = Math.floor(width / metadata[col].unique);
        return  metadata[col]["map"][value] * width_each;
    }
}

function getLuminance(col, max_value, min_value, value) {
    var luminance;
    if (metadata[col]["type"] == "number") {
        luminance = max_value - Math.floor(((value - metadata[col]["min"]) / (metadata[col]["max"] - metadata[col]["min"])) * (max_value - min_value));
    } else {
        luminance = Math.floor((max_value + min_value) / 2);
    }
    if (luminance < 0) {
        console.log(col + "<>" + luminance + "<>" + value);
        luminance = 0.0;
    }
    return luminance;
}

function getWidth(col, total_width, value) {
    var width;
    if (metadata[col]["type"] == "number") {
        width = Math.floor(((value - metadata[col]["min"]) / (metadata[col]["max"] - metadata[col]["min"])) * total_width);
    } else {
        var width_each = Math.floor(total_width / metadata[col].unique);
        width = width_each;
    }
    if (width < 0) {
        console.log(col + "<>" + width + "<>" + value);
        width = 0.0;
    }
    return width;
}

function fillMetadata() {
    metadata = {};
    _.each(cols, function (col) {
        metadata[col] = {};
        var values = _.pluck(data, col);
        if (!isNaN(+values[0])) {
            metadata[col].max = Math.max.apply(Math, values);
            metadata[col].min = Math.min.apply(Math, values);
            metadata[col].type = "number";
        } else {
            var uniqueValues = _.uniq(values);
            uniqueValues.sort();
            metadata[col].unique = _.size(uniqueValues);
            metadata[col].type = "categorical";
            metadata[col].map = _.object(uniqueValues, _.range(_.size(uniqueValues)))
        }
    });
}

function translateRow(index, pos) {
    var rowGroup = d3.select("#g".concat(index)).attr("transform", ("translate(0,".concat(getY(pos))).concat(")"));
    d3.select("#g".concat(index)).selectAll("text").style("visibility", "hidden");
}

function translateRowWithOffset(index, pos, offset) {
    var rowGroup = d3.select("#g".concat(index)).attr("transform", ("translate(0,".concat(getY(pos) + offset)).concat(")"));
    d3.select("#g".concat(index)).selectAll("text").style("visibility", "hidden");
}

function sortData(col, ascending) {
    // var newData = _.sortBy(data, col);
    var newData = _.sortBy(data,
            function (o) {
                if (metadata[col].type === "number") {
                    return parseFloat(o[col]);
                } else {
                    return o[col];
                }
            });
//    var newData = _.sortBy(data, function (obj) {
//        var cc = [], s = obj[col];
//        for (var i = 0, c; c = s.charAt(i); i++)
//            c == +c ? cc.push(+c) : cc.push(c.charCodeAt(0));
//        return +cc.join('');
//    });
// http://stackoverflow.com/questions/25101038/underscore-js-sort-an-array-of-objects-alphanumerically
    if (!ascending)
        newData.reverse();
    var translations = [];
    for (var i = 0; i < newData.length; i++) {
        var row = newData[i];
        var translation = {};
        translation.id = row.id;
        translation.pos = i;
        idPosMap[row.id] = i;
        posIdMap[i] = row.id;
        translations.push(translation);
    }
    data = newData;

    _.each(translations, function (translation) {
        if (translation.id !== translation.newpos)
            translateRow(translation.id, translation.pos);
    });
}

function resetData() {
    d3.csv(csv_file)
            .get(function (error, rows) {
                data = rows;
                unfilteredData = null;
                reloadRows();
            });
}

function reloadRows() {
    d3.select("#container").selectAll("*").remove();
    createTable("#container");

    JSTableLens.ROWS = data.length;
    JSTableLens.COLUMNS = Object.keys(data[0]).length;
    JSTableLens.WIDTH = JSTableLens.COLUMN_WIDTH * JSTableLens.COLUMNS;
    JSTableLens.HEIGHT = JSTableLens.ROW_HEIGHT * JSTableLens.ROWS + JSTableLens.EXTRA_ROW_HEIGHT * (JSTableLens.NUM_ROWS_ONE_SIDE * 2 + 1);

    for (var i = 0; i < data.length; i++) {
        createRow(data[i], i);
        data[i].id = i;
        posIdMap[i] = i;
        idPosMap[i] = i;
    }
    magnifiedPos = [-1, -1];
    initSlider();
}

function magnifyRow(index) {
    var currentTransform = d3.select("#g".concat(index)).attr("transform");
    var rowGroup = d3.select("#g".concat(index)).attr("transform", currentTransform.concat(" ".concat(("scale(1,".concat(1 + JSTableLens.EXTRA_ROW_HEIGHT / JSTableLens.ROW_HEIGHT)).concat(")"))));
    rowGroup.selectAll("text").style("visibility", "visible");
    rowGroup.selectAll("text").attr("transform", "scale(1,".concat(JSTableLens.ROW_HEIGHT / (JSTableLens.ROW_HEIGHT + JSTableLens.EXTRA_ROW_HEIGHT)).concat(")"));
    rowGroup.selectAll("#outerrect").style("stroke", "black");
    rowGroup.selectAll("#outerrect").style("strokeWidth", strokeWidth);
    rowGroup.selectAll("#outerrect").attr("transform", "scale(1,".concat(JSTableLens.ROW_HEIGHT / (JSTableLens.ROW_HEIGHT + JSTableLens.EXTRA_ROW_HEIGHT)).concat(")"));
//    var text = rowGroup.append("text")
//            .attr("x", 10)
//            .attr("y", 9)
//            .text("Hello")
//            .attr("font-family", "sans-serif")
//            .attr("font-size", "10px")
//            .style("visibility", "visible")
//            ;
}

function filterData(text) {
    if (unfilteredData == null) {
        unfilteredData = data.slice(0);
    }
    data = _.filter(unfilteredData, function (row) {
        var match = _.some(_.values(row), function (val) {
            var match = val.toString().indexOf(text) != -1;
            return match;
        });
        return match;
    });
    reloadRows();
}

function clearFilter() {
    if (unfilteredData == null) {
        resetData();
    } else {
        data = unfilteredData.slice(0);
        unfilteredData = null;
        reloadRows();
    }
}

function zoom(index) {
    if (index < JSTableLens.NUM_ROWS_ONE_SIDE)
        index = JSTableLens.NUM_ROWS_ONE_SIDE;
    if (index > (JSTableLens.ROWS - JSTableLens.NUM_ROWS_ONE_SIDE - 1))
        index = JSTableLens.ROWS - JSTableLens.NUM_ROWS_ONE_SIDE - 1;
    console.log("zoom: " + index);
    var startZoomIndex = index - JSTableLens.NUM_ROWS_ONE_SIDE;
    var endZoomIndex = index + JSTableLens.NUM_ROWS_ONE_SIDE;
    if (startZoomIndex < 0)
        startZoomIndex = 0;
    if (endZoomIndex >= JSTableLens.ROWS)
        endZoomIndex = JSTableLens.ROWS - 1;
    var numMagnifiedRows = endZoomIndex - startZoomIndex + 1;
    if (magnifiedPos[0] == -1) {
        // Nothing is magnified so far
        for (var i = endZoomIndex + 1; i < JSTableLens.ROWS; i++) {
            var id = posIdMap[i];
            translateRowWithOffset(id, i, JSTableLens.EXTRA_ROW_HEIGHT * numMagnifiedRows);
        }

        for (var i = endZoomIndex; i >= startZoomIndex; i--) {
            var id = posIdMap[i];
            translateRowWithOffset(id, i, JSTableLens.EXTRA_ROW_HEIGHT * (i - startZoomIndex));
            magnifyRow(id);
        }

        magnifiedPos[0] = startZoomIndex;
        magnifiedPos[1] = endZoomIndex;
    } else {
        // Something is already magnified
        for (var i = magnifiedPos[0]; i <= magnifiedPos[1]; i++) {
            var id = posIdMap[i];
            translateRow(id, i);
        }

        for (var i = magnifiedPos[1]; i <= startZoomIndex; i++) {
            var id = posIdMap[i];
            translateRow(id, i);
        }

        for (var i = endZoomIndex; i <= magnifiedPos[1]; i++) {
            var id = posIdMap[i];
            translateRowWithOffset(id, i, JSTableLens.EXTRA_ROW_HEIGHT * numMagnifiedRows);
        }

        for (var i = endZoomIndex; i >= startZoomIndex; i--) {
            var id = posIdMap[i];
            translateRowWithOffset(id, i, JSTableLens.EXTRA_ROW_HEIGHT * (i - startZoomIndex));
            magnifyRow(id);
        }

        magnifiedPos[0] = startZoomIndex;
        magnifiedPos[1] = endZoomIndex;
    }
}


function getParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

