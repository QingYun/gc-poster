const echarts: any = require("echarts");
import * as _ from "lodash";

function toSerieItem(d: { name: string, data: [[number, number]] }) {
  return _.assign({
    type: "scatter",
    symbolSize: 50
  }, d);
}

const axis_style = {
  axisLine: {
    lineStyle: {
      width: 10
    }
  },
  axisLabel: {
    textStyle: {
      fontSize: 48
    }
  },
  splitLine: {
    lineStyle: {
      width: 2
    }
  }
};

export default function drawScatter(elm_target: HTMLElement, options) {
  const { title, items, formatter } = options;
  const chart = echarts.init(elm_target);
  chart.setOption({
    title: {
      text: title,
      top: "top",
      left: "center",
      padding: 30,
      textStyle: {
        fontSize: 72,
        color: "rgba(0, 0, 0, .5)"
      }
    },
    tooltip: {},
    legend: {
      show: false
    },
    xAxis: _.merge({
      type: "value",
      min: -1,
      axisLabel: { formatter }
    }, axis_style),
    yAxis: _.merge({
      type: "log",
      min: 2000000,
      max: 3000000000,
      axisLabel: { formatter }
    }, axis_style),
    series: items.map(toSerieItem)
  });
};
