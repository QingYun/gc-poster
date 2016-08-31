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
      width: 10
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

const axis_style = {
  axisLine: {
    lineStyle: {
      width: 10
    }
  },
  axisLabel: {
    textStyle: {
      fontSize: 64
    }
  },
  splitLine: {
    lineStyle: {
      width: 2
    }
  }
};

export default function drawLine(elm_target: HTMLElement, options) {
  const { title, items, categories } = options;
  const series = toSeries(items);
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
      type: "value"
    }, axis_style),
    series
  });
}
