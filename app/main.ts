/// <reference path="require.d.ts"/>

import * as d3 from "d3";
const data = require("./data.json");

const svg = d3.select("body")
  .append("svg")
    .attr("width", 7016)
    .attr("height", 9933)
    .append("g");

console.log(data)
