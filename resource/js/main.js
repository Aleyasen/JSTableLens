var svgContainer;

var JSTableLens = {
    WIDTH: 800,
    HEIGHT: 450,
    ROWS: 200,
    COLUMNS: 6,
    COLUMN_WIDTH: 100,
    ROW_HEIGHT: 20,
    Y_MIN: 0,
    X_MIN: 0,
    TEXT_VISIBLE_HEIGHT: 15
}


$(document).ready(function () {
    d3.csv("resource/data/small.csv")
//                .row(function (d) {
//                    createRow(d);
//                })
            .get(function (error, rows) {
                console.log(rows);
                JSTableLens.ROWS = rows.length;
                JSTableLens.COLUMNS = Object.keys(rows[0]).length;
                JSTableLens.WIDTH = JSTableLens.COLUMN_WIDTH * JSTableLens.COLUMNS;
                JSTableLens.HEIGHT = JSTableLens.ROW_HEIGHT * JSTableLens.ROWS;

                createTable("#container");
                for (var i = 0; i < rows.length; i++) {
                    createRow(rows[i], i);
                }
            });
});

function createTable(selector) {
    //Make an SVG Container
    svgContainer = d3.select(selector).append("svg")
            .attr("width", JSTableLens.WIDTH)
            .attr("height", JSTableLens.HEIGHT);
//            .attr("preserveAspectRatio", "none")
//            .attr("viewBox", "0 0 ".concat(JSTableLens.COLUMNS).concat(" ").concat(JSTableLens.ROWS));

    //Draw the Rectangle
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
    //Make an SVG Container
    var rowGroup = svgContainer.append("g");

    rowGroup.on("click", function (d) {
//            last_clicked_element = $(this);
        console.log($(this));
        d3.event.stopPropagation();
    });
    var keys = Object.keys(row);
    for (var i = 0; i < keys.length; i++) {
        //Draw the Rectangle
        var rectangle = rowGroup.append("rect")
                .attr("x", getX(i))
                .attr("y", getY(index))
                .attr("width", JSTableLens.COLUMN_WIDTH)
                .attr("height", JSTableLens.ROW_HEIGHT)
//                .attr("vector-effect", "non-scaling-stroke")
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", "1")
                ;

        if (rectangle.attr("height") > JSTableLens.TEXT_VISIBLE_HEIGHT) {
            var text = rowGroup.append("text")
                    .attr("x", getX(i) + 10)
                    .attr("y", getY(index) + 15)
                    .text(row[keys[i]])
//                .attr("svg:title", original_text)
//                .attr("id", listIndex + "-" + isSource + "-" + i)
//                .attr("data-isSource", isSource)
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "10px")
//                .attr("text-anchor", "middle")
//                .attr("alignment-baseline", "middle")
//                .attr("fill", "black")
                    ;
        }
    }
}

function getX(index) {
    return JSTableLens.X_MIN + index * JSTableLens.COLUMN_WIDTH;
}
function getY(index) {
    return JSTableLens.Y_MIN + index * JSTableLens.ROW_HEIGHT;
}