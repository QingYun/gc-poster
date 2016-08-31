/// <reference path="require.d.ts"/>
require("./style.scss");
const echarts: any = require("echarts");
const numbro: any = require("numbro");
import * as _ from "lodash";

const data = require("./data.json");
import drawScatter from "./draw-scatter";
import drawPie from "./draw-pie";
import drawLine from "./draw-line";

enum GraphType { ScatterPlot, PieChart, LineChart };

interface GraphOptions {
  name: string;
  column: string;
  type: GraphType;
  options: any;
};

interface GraphNode extends GraphOptions {
  elm: HTMLDivElement;
}

interface RendererMap {
  [index: number]: (target: HTMLElement, options: any) => void;
}

const renderers: RendererMap = {
  [GraphType.ScatterPlot]: drawScatter,
  [GraphType.PieChart]: drawPie,
  [GraphType.LineChart]: drawLine,
};

function createElm(tag, attr) {
  const elm = document.createElement(tag);
  _.toPairs(attr).forEach(([k, v]) => {
    elm.setAttribute(k, v);
  });
  return elm;
}

const inRange = (min, max?) => (v) => {
  if (v >= min) {
    if (!max || v < max) {
      return true;
    }
  }
  return false;
};

const medal_spliters = [
  { inRange: inRange(0, 6), label: "0 ~ 5 Medals" },
  { inRange: inRange(5, 16), label: "5 ~ 15 Medals" },
  { inRange: inRange(15, 36), label: "15 ~ 35 Medals" },
  { inRange: inRange(35), label: "35+ Medals" },
];

const subgraphs: GraphNode[] = [
  {
    name: "Population",
    column: "population",
    type: GraphType.ScatterPlot,
    options: {
      formatter: n => numbro(n).format("0a")
    }
  },
  {
    name: "GDP per capita",
    column: "GDP_per_capita",
    type: GraphType.ScatterPlot,
    options: {
      formatter: n => numbro(n).format("0a")
    }
  },
  {
    name: "education",
    column: "primary_school_enrolment_rate",
    type: GraphType.PieChart,
    options: {
      medal_spliters,
      indie_spliters: [
        { inRange: inRange(0, 65), label: "< 65%" },
        { inRange: inRange(65, 95), label: "65% ~ 95%" },
        { inRange: inRange(95), label: "> 95%" },
      ]
    }
  },
  {
    name: "health",
    column: "life_expectancy",
    type: GraphType.PieChart,
    options: {
      medal_spliters,
      indie_spliters: [
        { inRange: inRange(0, 60), label: "< 60" },
        { inRange: inRange(60, 70), label: "60 ~ 70" },
        { inRange: inRange(70, 80), label: "70 ~ 80" },
        { inRange: inRange(80), label: "> 80" },
      ]
    }
  },
  {
    name: "urbanization",
    column: "urban_population",
    type: GraphType.ScatterPlot,
    options: {
      formatter: n => numbro(n).format("0a"),
      x_type: "value"
    }
  },
  {
    name: "information",
    column: "radio_receivers_per_1000",
    type: GraphType.ScatterPlot,
    options: {
      formatter: n => numbro(n).format("0a"),
    }
  },
  {
    name: "Host",
    column: "host",
    type: GraphType.LineChart,
    options: {
      categories: ["-8 year", "-4 year", "hosting year", "+4 year", "+8 year"]
    }
  }
].map((graph: GraphOptions): GraphNode => {
  const elm = document.createElement("div");
  elm.setAttribute("class", `graph`);
  return <GraphNode>_.assign({ elm }, graph);
});

const elm_root = createElm("div", { "class": "container" });
const elm_main = createElm("div", { "class": "graph-main" });
const elm_title = createElm("h1",  { "class": "title" });

elm_root.appendChild(elm_main);
elm_root.appendChild(elm_title);
subgraphs.forEach((g) => elm_root.appendChild(g.elm));
document.body.appendChild(elm_root);

subgraphs.forEach((g) => {
  renderers[g.type](g.elm, _.assign({
    title: `${g.name} vs. Medal`,
    items: _.toPairs(data).map(([k, v]) => {
      return {
        name: v["country_name"],
        independent: v[g.column],
        medals: v["medals"]
      };
    }),
  }, g.options));
});

/*
const dataBJ = [
    [55,9,56,0.46,18,6,1],
    [25,11,21,0.65,34,9,2],
    [56,7,63,0.3,14,5,3],
    [33,7,29,0.33,16,6,4],
    [42,24,44,0.76,40,16,5],
    [82,58,90,1.77,68,33,6],
    [74,49,77,1.46,48,27,7],
    [78,55,80,1.29,59,29,8],
    [267,216,280,4.8,108,64,9],
    [185,127,216,2.52,61,27,10],
    [39,19,38,0.57,31,15,11],
    [41,11,40,0.43,21,7,12],
    [64,38,74,1.04,46,22,13],
    [108,79,120,1.7,75,41,14],
    [108,63,116,1.48,44,26,15],
    [33,6,29,0.34,13,5,16],
    [94,66,110,1.54,62,31,17],
    [186,142,192,3.88,93,79,18],
    [57,31,54,0.96,32,14,19],
    [22,8,17,0.48,23,10,20],
    [39,15,36,0.61,29,13,21],
    [94,69,114,2.08,73,39,22],
    [99,73,110,2.43,76,48,23],
    [31,12,30,0.5,32,16,24],
    [42,27,43,1,53,22,25],
    [154,117,157,3.05,92,58,26],
    [234,185,230,4.09,123,69,27],
    [160,120,186,2.77,91,50,28],
    [134,96,165,2.76,83,41,29],
    [52,24,60,1.03,50,21,30],
    [46,5,49,0.28,10,6,31]
].map(a => [a[0], a[5], a[4], a[3]]);

echarts.init(elm_main).setOption({
  radar: {
    indicator: [
      {name: "GDP Per Capita", max: 400},
      {name: "Education", max: 100},
      {name: "Population", max: 200},
      {name: "Public Information", max: 5}
    ],
    name: {
      show: false,
      textStyle: {
        fontSize: 64
      }
    },
    startAngle: 45,
    shape: "circle",
    splitArea: {
      show: false
    },
    axisLine: {
      lineStyle: {
        width: 5,
        opacity:.5
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
  },
  series: [{
    type: "radar",
    lineStyle: {
      normal:{
        width: 0,
        opacity: .05
      }
    },
    data: dataBJ,
    symbol: "none",
    itemStyle: {
      normal: {
        color: "#00A8E8"
      }
    },
    areaStyle: {
      normal: {
        opacity: 0.05
      }
    }
  }]
});

*/
