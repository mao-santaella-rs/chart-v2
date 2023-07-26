<template>
  <div id="app">
    <chartA :chart-data="chartData" :reference-lines="referenceLines" />
    <chartA
      :chart-data="chartData"
      :reference-lines="referenceLines"
      format="currency"
      type="bars"
    />
    <!-- <chartA :chart-data="chartData" :reference-lines="referenceLines" />
    <chartA :chart-data="chartData" :reference-lines="referenceLines" />
    <chartA :chart-data="chartData" :reference-lines="referenceLines" />
    <chartA :chart-data="chartData" :reference-lines="referenceLines" />
    <chartA :chart-data="chartData" :reference-lines="referenceLines" /> -->
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
          color: '#28A9C280',
          data: [522212, 13310, 212435, 231250, 12550, 30312],
          // data: [302400, 302400, 302400, 302400, 302400, 302400],
        },
        {
          text: 'YouTube',
          color: '#C4503670',
          data: [340000, 90323, 303312, 84032, 50123, 134330],
        },
        {
          text: 'Others',
          color: '#C9999970',
          data: [340000, 703423, 303312, 84032, 50123, 334330],
        },
        {
          text: 'YouOthers',
          color: '#C1111170',
          data: [350000, 949323, 393312, 824032, 520123, 184330],
        },
      ],
    },
    referenceLines: [
      // {
      //   title: 'Your Rate:',
      //   value: 197500,
      //   color: '#1B8659',
      // },
      // {
      //   title: 'New reference:',
      //   value: 297500,
      //   color: '#9BA100',
      // },
    ],
  }),
}
</script>

<style lang="scss">
#app {
  margin-top: 60px;
}
</style>
