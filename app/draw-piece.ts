import * as _ from "lodash";
import * as d3 from "d3";
import {scaleLinear} from "d3-scale";
import {axisBottom} from "d3-axis";

const years = _.range(1992, 2012 + 1, 4);

function createElm(tag: string): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

export default ({ data: { country, variable, variableScale, medal_count, medalScale }, width, height }): SVGElement => {

  const scale = scaleLinear<number>()
    .range([0, width])
    .domain([years[0] - 4, years[years.length - 1] + 4]);

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

  const getHeight = (_, i): number => Math.max(medalScale(medal_count[i]), 1);
  const getY = (d, i): number => variableScale(d) - (_.ceil(medal_count[i] / 5) + 1) * (medalScale(5) + 1);
  const zeroMedal = (t, f) =>
    (d, i) => (medalScale(medal_count[i]) === 0) ? t(d, i) : f(d, i);
  const fromAttr = (attr, transformer) =>
    function () {
      return transformer(d3.select(this).attr(attr));
    };
  ;

  function drawBarSegments(medals) {
    const segments = _.times(medals / 5, () => 5);
    if (medals % 5 !== 0)
      segments.push(medals % 5);

    const segment_height = medalScale(5);
    const total_height = segment_height * segments.length + (segments.length - 1) * 1;

    const elm_g = createElm("g");
    d3.select(elm_g)
      .attr("class", "bar")
      .selectAll(".bar-segments")
      .data(segments)
      .enter().append("rect")
        .attr("class", "bar-segments")
        .attr("x", 0)
        .attr("width", 20)
        .attr("transform", "translate(-10, 0)")
        .attr("height", medalScale)
        .attr("y", (d, i) => total_height - i * (segment_height + 1) + segment_height - medalScale(d));

    return elm_g;
  }

  const elm_bars = createElm("g");
  d3.select(elm_bars)
    .attr("transform", "translate(0, 0)")
    .selectAll(".bar")
    .data(variable)
    .enter().append(zeroMedal(() => createElm("line"), (d, i) => drawBarSegments(medal_count[i])))
      .attr("class", zeroMedal(() => "dashed-line", () => "bar"))
      .attr("x", (_, i): number => scale(years[i]))
      .attr("y", getY)
      .attr("transform", (d, i) => `translate(${scale(years[i])}, ${getY(d, i)})`)
      .filter((d, i) => medalScale(medal_count[i]) === 0)
        .attr("x1", fromAttr("x", x => x))
        .attr("y1", d => variableScale(d) - 1)
        .attr("x2", fromAttr("x", x => parseFloat(x) + 20))
        .attr("y2", d => variableScale(d) - 1)
        .attr("transform", "translate(-10, 0)");

  const elm_piece = createElm("g");
  elm_piece.appendChild(elm_year_axis);
  elm_piece.appendChild(elm_bars);
  return elm_piece;
};
