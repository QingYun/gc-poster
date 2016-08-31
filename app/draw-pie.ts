const echarts: any = require("echarts");
import * as _ from "lodash";

interface ItemType {
  name: string;
  independent: number[];
  medals: number[];
}

interface SerieData {
  value: number;
  name: string;
}

interface SerieItem {
  name: string;
  type: string;
  radius: [string, string];
  data: SerieData[];
}

interface Spliter {
  inRange: (independent: number) => Boolean;
  label: string;
}

function toSeries(items: ItemType[], medal_spliters: Spliter[], indie_spliters: Spliter[]): SerieItem[] {
  const radius = 100 / medal_spliters.length;
  const radius_width = radius * (4 / 5);
  return _(items)
    .flatMap((item) => _.zip(item.independent, item.medals))
    .reduce<number[][]>((groups, [independent, medals]) => {
      medal_spliters.forEach(({inRange}, i) => {
        if (inRange(medals)) {
          groups[i].push(independent);
        }
      });
      return groups;
    }, _.times(medal_spliters.length, () => new Array()))
    .map<number[][]>((group, j) =>
      _.reduce(group, (groups, v) => {
          indie_spliters.forEach(({inRange, label}, i) => {
            if (v && inRange(v)) {
              groups[i].push(v);
              if (i == 0) console.log(v, label, medal_spliters[j].label)
            }
          });
          return groups;
      }, _.times(indie_spliters.length, () => new Array()))
    )
    .map<SerieItem>((segments, i) => ({
      name: medal_spliters[i].label,
      type: "pie",
      radius: [`${i * radius}%`, `${i * radius + radius_width}%`],
      label: { normal: { show: false } },
      data: segments.map((s, i) => ({
        value: s.length,
        name: indie_spliters[i].label})
      ).filter((d) => d.value > 0)
    }));
}

export default function drawPie(elm_target: HTMLElement, options) {
  const { title, font_base, items, medal_spliters, indie_spliters } = options;
  const chart = echarts.init(elm_target);
  const series = toSeries(items, medal_spliters, indie_spliters);
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
    legend: {
      orient: "vertical",
      x: "right",
      padding: [font_base * 2, font_base],
      itemWidth: font_base * 2,
      itemHeight: font_base,
      textStyle: {
        fontWeight: "bold",
        fontSize: font_base
      },
      data: _.map(indie_spliters, "label")
    },
    series
  });
}
