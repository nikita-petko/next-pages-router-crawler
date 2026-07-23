export const chartContainerZIndex = 1;
export const annotationZIndex = chartContainerZIndex + 1;

/**
 * Set z-index to 20 (maximum allowed value) to ensure plot band visibility above data series
 * Reference: https://api.highcharts.com/highcharts/yAxis.plotBands.zIndex
 */
export const rangeAnnotationPlotBandZIndex = 20;
