import * as echarts from "echarts";

const PAGE_WIDTH = 7016, PAGE_HEIGHT = 9933;

const elm_chart = document.createElement("div");
elm_chart.setAttribute("style", `width: ${PAGE_WIDTH}px; height: ${PAGE_HEIGHT}px;`);
document.body.appendChild(elm_chart);
const chart = echarts.init(elm_chart);

const option = {
    title: {
        text: "ECharts 入门示例"
    },
    tooltip: {},
    legend: {
        data: ["销量"]
    },
    xAxis: {
        data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"]
    },
    yAxis: {},
    series: [{
        name: "销量",
        type: "bar",
        data: [5, 20, 36, 10, 10, 20]
    }]
};
chart.setOption(option);
