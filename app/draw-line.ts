const echarts: any = require("echarts");
import * as _ from "lodash";

interface ItemType {
  name: string;
  independent: number[][];
  medals: number[];
}

const item_style = {
  showSymbol: false,
  lineStyle: {
    normal: {
      width: 20
    }
  }
};

function toSeries(items: ItemType[]) {
  return _(items)
    .flatMap<number[]>(d => d.independent)
    .filter((data: number[]) => data !== undefined)
    .map(data => ({
      type: "line",
      data
    }))
    .map(item => _.assign(item, item_style))
    .value();
}

export default function drawLine(elm_target: HTMLElement, options) {
  const { title, font_base, items, categories } = options;

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

  const series = toSeries(items);
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
    xAxis: _.merge({
      type: "category",
      boundaryGap: false,
      data: categories
    }, axis_style),
    yAxis: _.merge({
      type: "value",
    }, axis_style),
    series
  });
}
