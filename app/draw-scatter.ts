const echarts: any = require("echarts");
import * as _ from "lodash";

const toSerieItem = (font_base) => (d) => {
  return _.assign({
    type: "scatter",
    symbolSize: font_base * 1.5,
    itemStyle: {
      normal: {
        // color: "rgba(0, 0, 0, .5)"
      }
    },
    data: _.zip(d.independent, d.medals)
  }, d);
};

export default function drawScatter(elm_target: HTMLElement, options) {
  const { title, font_base, items, formatter, x_type } = options;

  const axis_style = {
    axisLine: {
      lineStyle: {
        width: font_base / 6
      }
    },
    axisLabel: {
      margin: font_base,
      textStyle: {
        fontSize: font_base * 1.5
      }
    },
    splitLine: {
      lineStyle: {
        width: 2
      }
    }
  };

  const chart = echarts.init(elm_target);
  chart.setOption({
    title: {
      text: title,
      top: "top",
      left: "center",
      padding: 0,
      textStyle: {
        fontSize: font_base * 2,
        color: "rgba(0, 0, 0, .5)"
      }
    },
    grid: {
      show: true,
      containLabel: true,
    },
    legend: {
      show: false
    },
    yAxis: _.merge({
      type: "value",
      axisLabel: { formatter }
    }, axis_style),
    xAxis: _.merge({
      type: x_type || "log",
      axisLabel: { formatter }
    }, axis_style),
    series: items.map(toSerieItem(font_base))
  });
};
