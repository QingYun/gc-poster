import * as _ from "lodash";
import * as d3 from "d3";
import {scaleLinear} from "d3-scale";
import {axisBottom} from "d3-axis";

const years = _.range(1992, 2012 + 1, 4);

function createElm(tag: string): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

export default ({ data: { country, variable, getY }, width, height }): SVGElement => {

  const scale = scaleLinear<number>()
    .range([0, width])
    .domain([years[0], years[years.length - 1]]);

  const axis = axisBottom(scale)
    .tickValues(years)
    .tickFormat(d3.format("d"));

  const elm_year_axis = createElm("g");
  d3.select(elm_year_axis)
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`)
    .call(axis)
    .append("text")
      .attr("class", "label")
      .attr("x", width / 2)
      .attr("y", "2em")
      .attr("fill", "#000")
      .style("text-anchor", "middle")
      .text(country);

  const elm_dots = createElm("g");
  d3.select(elm_dots)
    .attr("transform", "translate(0, 0)")
    .selectAll(".dot")
    .data(variable)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", (_, i): number => scale(years[i]))
      .attr("cy", getY);

  const elm_piece = createElm("g");
  elm_piece.appendChild(elm_year_axis);
  elm_piece.appendChild(elm_dots);
  return elm_piece;
};
