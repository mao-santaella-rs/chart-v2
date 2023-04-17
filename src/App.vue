<template>
  <div id="app">
    <chartA :chart-data="chartData" :reference-lines="referenceLines" />
  </div>
</template>

<script>
import chartA from './components/chartA.vue'

export default {
  name: 'App',
  components: {
    chartA,
  },
  data: () => ({
    // this is a sample data taken from brand-ui chart
    chartData: {
      labels: ['Sep.1', 'Sep.2', 'Sep.3', 'Sep.4', 'Sep.5', 'Sep.6'],
      dataSets: [
        {
          text: 'LTK',
          color: '#28A9C2',
          data: [512, 13310, 212435, 231250, 12550, 30312],
        },
        {
          text: 'YouTube',
          color: '#C45036',
          data: [340000, 90323, 303312, 84032, 50123, 634330],
        },
      ],
    },
    referenceLines: [
      {
        title: 'Your Rate:',
        value: 197500,
        color: '#1B8659',
      },
      {
        title: 'New reference:',
        value: 297500,
        color: '#9BA100',
      },
    ],
  }),
}
</script>

<style lang="scss">
#app {
  margin-top: 60px;
}
</style>
