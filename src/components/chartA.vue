<template>
  <div>
    <div class="chart-container"></div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { debounce } from 'debounce'
import { numberFormat } from '@/util/numberFormat'

export default {
  name: 'PerformanceChart',
  props: {
    chartData: {
      type: Object,
      default: () => ({}),
    },
    referenceLines: {
      type: Array,
      default: () => [],
    },
    height: {
      type: Number,
      default: 300,
    },
    aspectRatio: {
      type: Number,
      default: 1.77,
    },
    margins: {
      type: Object,
      default: () => ({
        top: 20,
        right: 20,
        bottom: 20,
        left: 50,
      }),
    },
    fullGrid: {
      type: Boolean,
      default: false,
    },
    format: {
      type: String,
      default: 'decimal',
      validator: (value) =>
        ['decimal', 'currency', 'percent', 'unit'].includes(value),
    },
    type: {
      type: String,
      default: 'lines',
      validator: (value) => ['lines', 'bars'].includes(value),
    },
    dotSize: {
      type: Number,
      default: 4,
    },
  },
  data: () => ({
    listenerController: new AbortController(), // for window resize event
  }),
  computed: {
    computedData() {
      return this.chartData.dataSets.map((dataSet) =>
        dataSet.data.map((d, i) => ({
          text: dataSet.text,
          label: this.chartData.labels[i],
          value: d,
          valueFormated: this.numberFormat(d, this.format),
          color: dataSet.color,
        })),
      )
    },
    verticalLabels() {
      // We get all the data from each point in the chart.
      const allData = this.chartData.dataSets.reduce(
        (acc, curr) => acc.concat(curr.data),
        [],
      )
      const referenceLines = this.referenceLines.map((line) => line.value)
      // We get the maximum number in the chart data.
      const maxNumber = Math.round(Math.max(...allData, ...referenceLines, 10))
      // We get the number of digits in the maximum number.
      const numOfDigits = maxNumber.toString().length - 2
      // We create the multiplier for the steps.
      const multiplier = 5 * Math.pow(10, numOfDigits < 0 ? 0 : numOfDigits)
      // We get the last label.
      const lastLabel = Math.ceil(maxNumber / multiplier) * multiplier
      // We get the steps value.
      let stepsVal = lastLabel / 5
      // We check that the steps value is not 1.
      if (stepsVal < 1) {
        stepsVal = 0.2
      } else if (stepsVal === 1 && maxNumber < 5) {
        stepsVal = 0.5
      }
      // We create the steps array.
      const steps = []
      for (let count = 0; count <= lastLabel; count += stepsVal) {
        steps.push(count)
      }
      return {
        lastLabel,
        steps: steps,
      }
    },
  },
  mounted() {
    // This function renders the chart with an animation.
    this.renderChart({ animated: true })
    // This function adds the window resize event listener.
    const { signal } = this.listenerController
    window.addEventListener('resize', debounce(this.renderChart, 150), {
      signal,
    })
  },
  beforeDestroy() {
    // This function removes the window resize event listener.
    this.listenerController.abort()
  },
  methods: {
    numberFormat,
    getScales(sizes) {
      const { width, height } = sizes
      const { labels } = this.chartData
      return {
        scaleX: d3.scaleBand().domain(labels).range([0, width]),
        // .padding(0.2),
        scaleY: d3
          .scaleLinear()
          .domain([0, this.verticalLabels.lastLabel])
          .range([height, 0]),
      }
    },
    addAxisLines(svg, scales, sizes) {
      const { scaleX, scaleY } = scales
      const { height } = sizes
      const { labels } = this.chartData
      const { steps } = this.verticalLabels

      const xAxis = d3
        .axisBottom(scaleX)
        .tickValues(labels)
        .tickFormat((d) => d)

      const yAxis = d3
        .axisLeft(scaleY)
        .tickValues(steps)
        .tickFormat((d) => {
          if (d < 1000) {
            return this.numberFormat(d, this.format)
          } else if (d < 1000000) {
            return `${this.numberFormat(d / 1000, this.format)}k`
          } else {
            return `${this.numberFormat(d / 1000000, this.format)}m`
          }
        })

      const axisGroup = svg.append('g').attr('class', 'axis')

      const axisElmX = (g) =>
        g.attr('transform', `translate(0,${height})`).call(xAxis)
      const axisElmY = (g) => g.attr('transform', `translate(0,0)`).call(yAxis)

      axisGroup.append('g').attr('class', 'axis-y').call(axisElmY)
      axisGroup.append('g').attr('class', 'axis-x').call(axisElmX)
    },
    addGridLines(svg, scales, sizes) {
      const { scaleX, scaleY } = scales
      const { width, height } = sizes
      const { steps } = this.verticalLabels
      const { labels } = this.chartData

      const gridGroup = svg.append('g').attr('class', 'grid-lines')
      // This function adds the y lines to the grid.
      const gridLinesY = (g) =>
        g
          .selectAll('.grid-line-y')
          .data(steps)
          .join('line')
          .attr('class', 'line grid-line-y')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', (d) => scaleY(d))
          .attr('y2', (d) => scaleY(d))
      gridGroup.call(gridLinesY)

      if (this.fullGrid) {
        // This function adds the x lines to the grid.
        const gridLinesX = (g) => {
          const offset = scaleX.bandwidth() / 2
          g.selectAll('.grid-line-x')
            .data(labels)
            .join('line')
            .attr('class', 'line grid-line-x')
            .attr('x1', (d) => scaleX(d) + offset)
            .attr('x2', (d) => scaleX(d) + offset)
            .attr('y1', 0)
            .attr('y2', height)
        }
        // This function adds the closed x lines to the grid.
        const closedLines = (g) => {
          g.selectAll('.grid-line-x-closed')
            .data([0, width])
            .join('line')
            .attr('class', 'line grid-line-x-closed')
            .attr('x1', (d) => d)
            .attr('x2', (d) => d)
            .attr('y1', 0)
            .attr('y2', height)
        }
        gridGroup.call(gridLinesX).call(closedLines)
      }
    },
    addReferenceLines(svg, scales, sizes) {
      // We check if there are reference lines.
      if (!this.referenceLines.length) return
      const { scaleY } = scales
      const { width } = sizes
      const referenceGroup = svg.append('g').attr('class', 'reference')

      // We add the reference lines.
      this.referenceLines.forEach((line) => {
        const linePosY = scaleY(line.value)
        const group = referenceGroup.append('g')
        // We add the line.
        group
          .append('line')
          .attr('class', 'line')
          .attr('stroke', line.color)
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', linePosY)
          .attr('y2', linePosY)

        // We add the title.
        group
          .append('text')
          .attr('fill', line.color)
          .attr('x', 0)
          .attr('y', linePosY - 5)
          .attr('text-anchor', 'left')
          .text(line.title)
        // get the width of the title
        const textElm = group.select('text')
        const textWidth = textElm.node().getComputedTextLength()

        // We add the amount.
        group
          .append('text')
          .attr('fill', line.color)
          .attr('class', 'reference-amount')
          .attr('x', textWidth + 4)
          .attr('y', linePosY - 5)
          .attr('text-anchor', 'left')
          .text(this.numberFormat(line.value, this.format))
      })
    },
    addTooltip(svg, sizes) {
      const { width, height } = sizes
      const tooltipGroup = svg
        .append('g')
        .attr('class', 'tooltip')
        .attr('opacity', 0)
      // We add the tooltip rect("card")
      tooltipGroup
        .append('rect')
        .attr('class', 'tooltip-rect')
        .attr('rx', 8)
        .attr('x', width / 2)
        .attr('y', height / 2)
      // We add the tooltip text
      tooltipGroup
        .append('text')
        .attr('class', 'tooltip-text')
        .attr('x', width / 2)
        .attr('y', height / 2)

      tooltipGroup
        .append('circle')
        .attr('class', 'tooltip-dot')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', this.dotSize)
    },
    getEventHandlers(scales, sizes) {
      const {
        left: marginLeft,
        top: marginTop,
        right: marginRight,
        bottom: marginBottom,
      } = this.margins
      const { scaleX, scaleY } = scales
      const { width, height } = sizes

      const containerSelection = d3.select(this.$el)
      const toolTipGroupSelected = containerSelection.select('.tooltip')
      const textSelected = containerSelection.select('.tooltip-text')
      const rectSelected = containerSelection.select('.tooltip-rect')
      const dotSelected = containerSelection.select('.tooltip-dot')
      const type = this.type
      const dotSize = {
        radius: this.dotSize,
        padding: 10,
      }

      // This function returns the position of the tooltip.
      const getPosInRange = (position, min, max) =>
        Math.min(Math.max(position, min), max)

      const mouseover = function (e, d) {
        const padding = 20

        textSelected.text(`${d.text}: ${d.valueFormated}`)
        const textBCR = textSelected.node().getBoundingClientRect()

        const xPosition = scaleX(d.label) + scaleX.bandwidth() / 2
        const yPosition = scaleY(d.value) - 10

        // Text position
        const text = {
          x:
            xPosition -
            textBCR.width / 2 +
            dotSize.radius +
            dotSize.padding / 2,
          y: yPosition - textBCR.height / 2,
          minPosX: padding / 2 - marginLeft,
          maxPosX: width - textBCR.width - padding / 2 + marginRight,
          minPosY: textBCR.height - marginTop + 3,
          maxPosY: height - padding / 2 + marginBottom,
        }
        textSelected
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr('x', getPosInRange(text.x, text.minPosX, text.maxPosX))
          .attr('y', getPosInRange(text.y, text.minPosY, text.maxPosY))

        // Rect position
        const rect = {
          x: xPosition - textBCR.width / 2 - padding / 2,
          y: yPosition - textBCR.height - padding / 2,
          width: textBCR.width + padding + dotSize.radius + dotSize.padding / 2,
          height: textBCR.height + padding / 2 + 1,
          minPosX: -marginLeft,
          maxPosX:
            width -
            (textBCR.width + padding + dotSize.radius + dotSize.padding / 2) +
            marginRight,
          minPosY: -marginTop,
          maxPosY: height - (textBCR.height + padding / 2) + marginBottom,
        }
        rectSelected
          .attr('width', rect.width)
          .attr('height', rect.height)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr('x', getPosInRange(rect.x, rect.minPosX, rect.maxPosX))
          .attr('y', getPosInRange(rect.y, rect.minPosY, rect.maxPosY))
          .attr('border-color', d.color)

        // Dot position
        const dot = {
          x: rect.x + 10,
          y: rect.y + rect.height / 2,
          minPosX: rect.minPosX + 10,
          maxPosX: rect.maxPosX + 10,
          minPosY: rect.minPosY + rect.height / 2,
          maxPosY: rect.maxPosY + rect.height / 2,
        }
        dotSelected
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr('cx', getPosInRange(dot.x, dot.minPosX, dot.maxPosX))
          .attr('cy', getPosInRange(dot.y, dot.minPosY, dot.maxPosY))
          .attr('fill', d.color)

        // Show tooltip
        toolTipGroupSelected
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style('opacity', 1)

        // Dot expands
        const thisElm = d3.select(this)
        if (type === 'lines') {
          thisElm.transition().duration(300).ease(d3.easeCubicOut).attr('r', 9)
        }

        // Bring element to the front
        const thisElmParent = thisElm.select(function () {
          return this.parentNode
        })
        thisElmParent.raise()
      }
      const mouseleave = function () {
        // Hide tooltip
        toolTipGroupSelected
          .transition()
          .delay(400)
          .duration(300)
          .ease(d3.easeCubicOut)
          .style('opacity', 0)

        // Dot shrink
        if (type === 'lines') {
          d3.select(this)
            .transition()
            .duration(300)
            .ease(d3.easeCubicOut)
            .attr('r', 5)
        }
      }
      return {
        mouseover,
        mouseleave,
      }
    },
    renderChart({ animated = false }) {
      const container = this.$el
      const svgChart = container.querySelector('svg.chart')
      if (svgChart) {
        svgChart.remove()
      }
      const { width: containerWidth } = container.getBoundingClientRect()
      const containerHeight =
        containerWidth > this.height * this.aspectRatio
          ? this.height
          : containerWidth / this.aspectRatio
      const sizes = {
        width: containerWidth - this.margins.left - this.margins.right,
        height: containerHeight - this.margins.top - this.margins.bottom,
      }
      const { height } = sizes
      const scales = this.getScales(sizes)
      const { scaleX, scaleY } = scales

      const svg = d3
        .select(container)
        .append('svg')
        .attr('class', 'chart')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr(
          'transform',
          `translate(${this.margins.left}, ${this.margins.top})`,
        )
      // AXIS LINES
      this.addAxisLines(svg, scales, sizes)

      // GRID LINES
      this.addGridLines(svg, scales, sizes)

      // REFERENCE LINES
      this.addReferenceLines(svg, scales, sizes)

      const contentGroup = svg.append('g').attr('class', 'content')

      // TOOL TIP
      this.addTooltip(svg, sizes)

      // CONTENT GROUP
      const { mouseover, mouseleave } = this.getEventHandlers(scales, sizes)

      if (this.type === 'lines') {
        const lineFlat = d3
          .line()
          .curve(d3.curveCardinal.tension(0))
          .x((d) => scaleX(d.label) + scaleX.bandwidth() / 2)
          .y(height)
        const line = d3
          .line()
          .curve(d3.curveCardinal.tension(1))
          .x((d) => scaleX(d.label) + scaleX.bandwidth() / 2)
          .y((d) => scaleY(d.value))

        // CHART LINES
        this.computedData.forEach((dataSet) => {
          const group = contentGroup.append('g')
          const color = dataSet[0].color
          group
            .append('path')
            .attr('stroke', color)
            .datum(dataSet)
            .attr('class', 'line')
            .attr('d', lineFlat)
            .transition()
            .duration(animated ? 1500 : 0)
            .ease(d3.easeCubicOut)
            .attr('d', line)
          group
            .selectAll('dot')
            .data(dataSet)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', (d) => scaleX(d.label) + scaleX.bandwidth() / 2)
            .attr('cy', height)
            .attr('r', 5)
            .style('fill', color)
            .style('pointer-events', 'none')
            .on('mouseover', mouseover)
            .on('mouseleave', mouseleave)
            .transition()
            .duration(animated ? 1500 : 0)
            .ease(d3.easeCubicOut)
            .attr('cy', (d) => scaleY(d.value))
            .transition()
            .duration(1)
            .style('pointer-events', 'all')
        })
      } else if (this.type === 'bars') {
        this.computedData.forEach((dataSet, idx) => {
          const barWidth = scaleX.bandwidth() / 2 / this.computedData.length
          const group = contentGroup.append('g')
          const xPosFn = (d) => {
            const basePos = scaleX(d.label) + scaleX.bandwidth() / 2
            return this.computedData.length > 1
              ? basePos -
                  (barWidth * this.computedData.length) / 2 +
                  idx * barWidth
              : basePos - barWidth / 2
          }
          group
            .attr('class', `bar-group bar-group-${idx}`)
            .selectAll('.bar')
            .data(dataSet)
            .enter()
            .append('rect')
            .attr('class', (d, i) => `bar bar-${idx}-${i}`)
            .attr('x', xPosFn)
            .attr('width', barWidth)
            .attr('fill', (d) => d.color)
            .attr('y', height)
            .attr('height', 0)
            .on('mouseover', mouseover)
            .on('mouseleave', mouseleave)
            .transition()
            .duration(animated ? 1500 : 0)
            .ease(d3.easeCubicOut)
            .delay((d, i) => (animated ? i * 150 : 0))
            .attr('y', (d) => scaleY(d.value))
            .attr('height', (d) => height - scaleY(d.value))
        })
      }

      // CHART LINES
    },
  },
}
</script>

<style lang="sass">
.chart-container
  font-family: Avenir, Helvetica, Arial, sans-serif
  position: relative

.line
  fill: none
  stroke-width: 2px


.axis
  & path, & line
    fill: none
    stroke: transparent
    shape-rendering: crispEdges

  & text
    font-family: sans-serif
    font-size: 10px


.grid-lines
  line
    fill: none
    stroke: lightgrey
    shape-rendering: crispEdges

  @media screen and (max-width: 600px)
    line
      stroke-width: 1px

.reference
  line
    fill: none
    shape-rendering: crispEdges
    stroke-dasharray: 4, 4

  & text
    font-family: sans-serif
    font-size: 12px

  .reference-amount
    font-weight: bold


.tooltip
  z-index: 100
  pointer-events: none


  .tooltip-text
    display: inline
    fill: black
    font-weight: bold
    font-size: 12px
    line-height: 1em

  .tooltip-rect
    fill: white
    stroke: lightgrey
</style>
