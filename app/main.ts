/// <reference path="require.d.ts"/>
require("./style.scss");

import * as _ from "lodash";
import * as d3 from "d3";
import {scaleLinear} from "d3-scale";
import {axisLeft} from "d3-axis";

import drawPiece from "./draw-piece";
const data: Object = require("./data.json");

const PAGE_WIDTH = 7016, PAGE_HEIGHT = 9933;
const population = _
  .chain(data)
  .values()
  .flatMap(obj => obj["population"])
  .value();

const y_scale = scaleLinear<number>()
  .range([800, 0])
  .domain([_.min(population), _.max(population)]);

const elm_piece = drawPiece({
  data: {
    country: data["AUS"]["country_name"],
    variable: data["AUS"]["population"],
    getY: d => y_scale(d)
  },
  width: 800,
  height: 800
});

const svg = d3.select("body")
  .append("svg")
    .attr("width", PAGE_WIDTH)
    .attr("height", PAGE_HEIGHT)
    .append("g")
      .attr("transform", "translate(50, 20)");

const formatNumber = d3.format(".0f");
const y_axis = axisLeft(y_scale)
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

svg.append(() => elm_piece);
