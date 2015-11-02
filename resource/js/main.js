var svgContainer;
var data;
var posIdMap;
var idPosMap;
var cols;
var magnifiedPos;
var metadata;
var unfilteredData;

var JSTableLens = {
    WIDTH: 800,
    HEIGHT: 450,
    ROWS: 200,
    COLUMNS: 6,
    COLUMN_WIDTH: 100,
    ROW_HEIGHT: 20,
    HEADER_HEIGHT: 20,
    Y_MIN: 20,
    X_MIN: 0,
    TEXT_VISIBLE_HEIGHT: 15
}


$(document).ready(function () {
    d3.csv("resource/data/small.csv")
    .get(function (error, rows) {
        console.log(rows);
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
        JSTableLens.HEIGHT = JSTableLens.ROW_HEIGHT * JSTableLens.ROWS;
        createTable("#container");
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
            .attr("transform" , ("translate(0,".concat(getY(index))).concat(")"))
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
                .style("stroke-width", "1")
                ;
        var bar = rowGroup.append("rect")
                .attr("x", getX(i) + getBarMinX(cols[i], JSTableLens.COLUMN_WIDTH, row[cols[i]]))
                .attr("y", 0)
                .attr("width", getWidth(cols[i], JSTableLens.COLUMN_WIDTH, row[cols[i]]))
                .attr("height", JSTableLens.ROW_HEIGHT)
                .style("fill", "#71D670")
                .style("stroke", "black")
                .style("stroke-width", "1")
                ;

        if (rectangle.attr("height") > JSTableLens.TEXT_VISIBLE_HEIGHT) {
            var text = rowGroup.append("text")
                    .attr("x", getX(i) + 10)
                    .attr("y", 15)
                    .text(row[cols[i]])
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "10px")
                    ;
        }
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
                .attr("width", "14")
                .attr("height", "14")
                .attr("class", "table-header-sort-button")
                ;

        sort_icon.on("click", function () {
            var test = 0;
            var img_svg = $(this).select("svg:image");
            var sortmode = img_svg.attr("sortmode");

            console.log(sortmode);
            if (sortmode == "none" || sortmode == "desc") {
//                TODO
                img_svg.attr("sortmode", "asc");
                img_svg.attr("href", "resource/images/sort_asc.png")
            } else {
                img_svg.attr("sortmode", "desc");
                img_svg.attr("href", "resource/images/sort_desc.png")

            }

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
    console.log(col + "<>" + width + "<>" + value);
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
    var rowGroup = d3.select("#g".concat(index)).attr("transform" , ("translate(0,".concat(getY(pos))).concat(")"));
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

    _.each(translations, function(translation) {
        if (translation.id !== translation.newpos)
            translateRow(translation.id, translation.pos);
    });
}

function resetData() {
    d3.csv("resource/data/small.csv")
    .get(function (error, rows) {
        data = rows;
        unfilteredData = null;
        reloadRows();
    });
}

function reloadRows() {
    svgContainer.selectAll("*").remove();
    for (var i = 0; i < data.length; i++) {
        createRow(data[i], i);
        data[i].id = i;
        posIdMap[i] = i;
        idPosMap[i] = i;
    }
}

function filterData(text) {
    if (unfilteredData == null) {
        unfilteredData = data.slice(0);
    }
    data = _.filter(unfilteredData, function(row) {
        var match = _.some(_.values(row), function(val) {
            var match = val.toString().indexOf(text)!=-1;
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


