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
    COLUMN_WIDTH: 100,
    ROW_HEIGHT: 10,
//    ROW_HEIGHT: 2,
    EXTRA_ROW_HEIGHT: 20,
    HEADER_HEIGHT: 20,
    Y_MIN: 20,
    X_MIN: 0,
    TEXT_VISIBLE_HEIGHT: 15,
    NUM_ROWS_ONE_SIDE: 2
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
    zoom(actualval);
    $("#row-label").html("Row " + actualval + " from " + max);
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

    d3.csv(csv_file)
            .get(function (error, rows) {
//                console.log(rows);
                data = rows;
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
});

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
                .attr("x", getX(i))
                .attr("y", 0)
                .attr("width", JSTableLens.COLUMN_WIDTH)
                .attr("height", JSTableLens.ROW_HEIGHT)
                .style("fill", "none")
                .style("stroke", "black")
                .style("stroke-width", strokeWidth)
                ;
        var bar = rowGroup.append("rect")
                .attr("x", getX(i) + getBarMinX(cols[i], JSTableLens.COLUMN_WIDTH, row[cols[i]]))
                .attr("y", 0)
                .attr("width", getWidth(cols[i], JSTableLens.COLUMN_WIDTH, row[cols[i]]))
                .attr("height", JSTableLens.ROW_HEIGHT)
                .style("fill", "#71D670")
                .style("stroke", "black")
                .style("stroke-width", strokeWidth);

        var visiblity = "hidden";
        if (rectangle.attr("height") > JSTableLens.TEXT_VISIBLE_HEIGHT) {
            visiblity = "visible";
        }
        var text = rowGroup.append("text")
                .attr("x", getX(i) + 10)
                .attr("y", 9)
                .text(row[cols[i]])
                .attr("font-family", "sans-serif")
                .attr("font-size", "10px")
                .style("visibility", visiblity)
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
                ;

        sort_icon.on("click", function () {
            var test = 0;
            var icon = $(this).select("svg:image");
            var sortmode = icon.attr("sortmode");
            //reset all other icons
            console.log(d3.select(this.parentNode));
            console.log(sortmode);
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
function getWidth(col, width, value) {
//    console.log(col + "<>" + width + "<>" + value);
    if (metadata[col]["type"] == "number") {
        return Math.floor(((value - metadata[col]["min"]) / (metadata[col]["max"] - metadata[col]["min"])) * width);
    } else {
        var width_each = Math.floor(width / metadata[col].unique);
        return width_each;
    }
}

function fillMetadata() {
    metadata = {};
    _.each(cols, function (col) {
        metadata[col] = {};
        var values = _.pluck(data, col);
        if (!isNaN(+values[0])) {
            metadata[col].max = _.max(values);
            metadata[col].min = _.min(values);
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
    var newData = _.sortBy(data, col);
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
    d3.select("#g".concat(index)).selectAll("text").style("visibility", "visible");
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

