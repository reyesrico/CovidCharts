const legend = {
  enabled: false
};

const options = {
  chart: { height: 250, zoomType: 'x' },
  title: { text: '' },
  legend,
  xAxis: { type: 'datetime' },
  tooltip: { shared: true },
  credits: { enabled: false },
  plotOptions: {
    areaspline: { fillOpacity: 0.1 }
  }
};

export default options;
