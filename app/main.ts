/// <reference path="require.d.ts"/>
require("./style.scss");

import * as _ from "lodash";
import * as d3 from "d3";
import {scaleLinear} from "d3-scale";
import {axisLeft} from "d3-axis";

import drawPiece from "./draw-piece";
const data: Object = require("./data.json");

const PAGE_WIDTH = 7016, PAGE_HEIGHT = 9933;
const data_entry_number = _.keys(data).length;
const population = _
  .chain(data)
  .values()
  .flatMap(obj => obj["population"])
  .value();
const medal_counts = _
  .chain(data)
  .values()
  .flatMap(obj => obj["medals"])
  .value();

const svg = d3.select("body")
  .append("svg")
    .attr("width", PAGE_WIDTH)
    .attr("height", PAGE_HEIGHT)
    .append("g")
      .attr("transform", "translate(50, 20)");

const GRAPH_HEIGHT = 1600;

const medalScale = scaleLinear<number>()
  .range([0, GRAPH_HEIGHT / 2])
  .domain([0, _.max(medal_counts)]);

const scale = scaleLinear<number>()
  .range([GRAPH_HEIGHT, 0])
  .domain([0, _.max(population) + 1500000000]);

const formatNumber = d3.format(".1f");
const y_axis = axisLeft(scale)
  .tickFormat(x => {
    const v = Math.abs(x);
    return (v >= .9995e9 ? x => formatNumber(x / 1e9) + "B"
        : v >= .9995e6 ? x => formatNumber(x / 1e6) + "M"
        : x => formatNumber(x / 1e3) + "k")(x);
  });

svg.append("g")
  .attr("class", "y axis")
  .call(y_axis)
  .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "1em")
    .attr("fill", "#000")
    .style("test-anchor", "end")
    .text("Population");

const piece_width = PAGE_WIDTH / 2 / data_entry_number;
_(data)
.values()
.sortBy((v) => _.mean(v["population"]))
.map(v => drawPiece({
  data: {
    country: v["country_name"],
    variable: v["population"],
    variableScale: d => scale(d),
    medal_count: v["medals"],
    medalScale
  },
  width: piece_width,
  height: GRAPH_HEIGHT
}))
.each((elm, i) => {
  svg.append(() => elm).attr("transform", `translate(${i * piece_width}, 0)`);
});
