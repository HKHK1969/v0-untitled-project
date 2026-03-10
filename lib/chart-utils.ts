/**
 * Chart utilities for the apparel supply chain tracker
 */

// Utility function to generate sample sales data
export function generateSalesData(timeRange = "quarter") {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
    { id: "c5", name: "Gap" },
    { id: "c6", name: "Uniqlo" },
  ]

  const periods = {
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    quarter: ["Q1", "Q2", "Q3", "Q4"],
    year: ["2020", "2021", "2022", "2023"],
  }

  const selectedPeriods = periods[timeRange] || periods.quarter

  return customers.map((customer) => {
    let totalValue = 0
    let totalUnits = 0

    const periodData = selectedPeriods.map((period) => {
      const value = Math.floor(Math.random() * 100000)
      const units = Math.floor(Math.random() * 1000)
      totalValue += value
      totalUnits += units
      return { period, value, units }
    })

    const avgPrice = totalUnits > 0 ? totalValue / totalUnits : 0

    return {
      id: customer.id,
      name: customer.name,
      periodData,
      totalValue,
      totalUnits,
      avgPrice,
    }
  })
}

// Utility function to generate sample shipment data
export function generateShipmentData(timeRange = "quarter") {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
    { id: "c5", name: "Gap" },
    { id: "c6", name: "Uniqlo" },
  ]

  const periods = {
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    quarter: ["Q1", "Q2", "Q3", "Q4"],
    year: ["2020", "2021", "2022", "2023"],
  }

  const selectedPeriods = periods[timeRange] || periods.quarter

  return customers.map((customer) => {
    let totalValue = 0
    let totalUnits = 0

    const periodData = selectedPeriods.map((period) => {
      const value = Math.floor(Math.random() * 80000)
      const units = Math.floor(Math.random() * 800)
      totalValue += value
      totalUnits += units
      return { period, value, units }
    })

    const avgPrice = totalUnits > 0 ? totalValue / totalUnits : 0

    return {
      id: customer.id,
      name: customer.name,
      periodData,
      totalValue,
      totalUnits,
      avgPrice,
    }
  })
}

// Utility function to generate sample profitability data
export function generateProfitabilityData(timeRange = "quarter") {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
    { id: "c5", name: "Gap" },
    { id: "c6", name: "Uniqlo" },
  ]

  const periods = {
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    quarter: ["Q1", "Q2", "Q3", "Q4"],
    year: ["2020", "2021", "2022", "2023"],
  }

  const selectedPeriods = periods[timeRange] || periods.quarter

  return customers.map((customer) => {
    let totalRevenue = 0
    let totalProfit = 0

    const periodData = selectedPeriods.map((period) => {
      const value = Math.floor(Math.random() * 100000)
      const profit = value * (0.1 + Math.random() * 0.2) // Profit margin between 10% and 30%
      totalRevenue += value
      totalProfit += profit
      const margin = value > 0 ? profit / value : 0
      return { period, value, profit, margin }
    })

    const avgMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0

    return {
      id: customer.id,
      name: customer.name,
      periodData,
      totalRevenue,
      totalProfit,
      avgMargin,
    }
  })
}

// Utility function to generate sample conversion data
export function generateConversionData() {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
    { id: "c5", name: "Gap" },
    { id: "c6", name: "Uniqlo" },
  ]

  return customers.map((customer) => {
    const totalSamples = Math.floor(Math.random() * 100) + 50 // 50-150 samples
    const totalConverted = Math.floor(Math.random() * totalSamples) // Up to totalSamples converted
    const overallConversionRate = totalSamples > 0 ? totalConverted / totalSamples : 0

    const sampleTypes = ["Proto", "Fit", "PP", "Size Set", "Color", "Marketing"]
    const typeData = sampleTypes.map((type) => {
      const totalTypeSamples = Math.floor(Math.random() * (totalSamples / sampleTypes.length))
      const convertedSamples = Math.floor(Math.random() * totalTypeSamples)
      const conversionRate = totalTypeSamples > 0 ? convertedSamples / totalTypeSamples : 0
      return { type, totalSamples: totalTypeSamples, convertedSamples, conversionRate }
    })

    return {
      id: customer.id,
      name: customer.name,
      totalSamples,
      totalConverted,
      overallConversionRate,
      typeData,
    }
  })
}

// Utility function to generate sample growth data
export function generateGrowthData() {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
    { id: "c5", name: "Gap" },
    { id: "c6", name: "Uniqlo" },
  ]

  const years = [2019, 2020, 2021, 2022, 2023]

  return customers.map((customer) => {
    let previousValue = Math.floor(Math.random() * 500000) + 500000 // Initial value between 500k and 1M

    const yearsData = years.map((year) => {
      const growthRate = Math.random() * 0.2 - 0.1 // Growth rate between -10% and 10%
      const value = previousValue * (1 + growthRate)
      previousValue = value
      return { year, value, growthRate }
    })

    // Calculate CAGR
    const startValue = yearsData[0].value
    const endValue = yearsData[yearsData.length - 1].value
    const numYears = yearsData.length - 1
    const cagr = Math.pow(endValue / startValue, 1 / numYears) - 1

    // Calculate average growth rate
    const totalGrowthRate = yearsData.slice(1).reduce((sum, year) => sum + year.growthRate, 0)
    const avgGrowthRate = totalGrowthRate / (yearsData.length - 1)

    return {
      id: customer.id,
      name: customer.name,
      years: yearsData,
      cagr,
      avgGrowthRate,
      currentValue: endValue,
    }
  })
}

// Utility function to generate sample lead time data
export function generateSampleLeadTimeData() {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
  ]

  const suppliers = [
    { id: "s1", name: "Supplier A" },
    { id: "s2", name: "Supplier B" },
    { id: "s3", name: "Supplier C" },
  ]

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Generate overall average lead time
  const overall = Math.random() * 45 + 15 // 15-60 days

  // Generate lead time by customer
  const byCustomer = customers.map((customer) => ({
    customer: customer.name,
    averageLeadTime: Math.random() * 40 + 20, // 20-60 days
  }))

  // Generate lead time by supplier
  const bySupplier = suppliers.map((supplier) => ({
    supplier: supplier.name,
    averageLeadTime: Math.random() * 50 + 10, // 10-60 days
  }))

  // Generate lead time evolution over time
  const evolution = months.map((month, index) => ({
    monthYear: `${month} 2023`,
    averageLeadTime: 30 + Math.sin(index / 6) * 10, // Sinusoidal variation
  }))

  // Generate sample delays by supplier
  const delays = suppliers.map((supplier) => ({
    supplier: supplier.name,
    averageDelay: Math.random() * 15, // 0-15 days delay
  }))

  return {
    overall,
    byCustomer,
    bySupplier,
    evolution,
    delays,
  }
}

// Utility function to generate purchase order data
export function generatePurchaseOrderData() {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
  ]

  const suppliers = [
    { id: "s1", name: "Supplier A" },
    { id: "s2", name: "Supplier B" },
    { id: "s3", name: "Supplier C" },
  ]

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Generate overall average lead time
  const overall = Math.random() * 60 + 30 // 30-90 days

  // Generate lead time by customer
  const byCustomer = customers.map((customer) => ({
    customer: customer.name,
    averageLeadTime: Math.random() * 50 + 40, // 40-90 days
  }))

  // Generate lead time by supplier
  const bySupplier = suppliers.map((supplier) => ({
    supplier: supplier.name,
    averageLeadTime: Math.random() * 60 + 20, // 20-80 days
  }))

  // Generate lead time evolution over time
  const evolution = months.map((month, index) => ({
    monthYear: `${month} 2023`,
    averageLeadTime: 45 + Math.sin(index / 6) * 15, // Sinusoidal variation
  }))

  // Generate purchase order delays by supplier
  const delays = suppliers.map((supplier) => ({
    supplier: supplier.name,
    averageDelay: Math.random() * 20, // 0-20 days delay
  }))

  return {
    overall,
    byCustomer,
    bySupplier,
    evolution,
    delays,
  }
}

// Utility function to generate order size data
export function generateOrderSizeData() {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
  ]

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Generate average order size by customer (units)
  const byCustomerUnits = customers.map((customer) => ({
    customer: customer.name,
    averageSize: Math.floor(Math.random() * 500) + 100, // 100-600 units
  }))

  // Generate average order value by customer
  const byCustomerValue = customers.map((customer) => ({
    customer: customer.name,
    averageValue: Math.floor(Math.random() * 50000) + 10000, // $10k-$60k
  }))

  // Generate order size evolution over time (units)
  const evolutionUnits = months.map((month, index) => ({
    monthYear: `${month} 2023`,
    averageSize: 250 + Math.sin(index / 6) * 50, // Sinusoidal variation
  }))

  // Generate order value evolution over time
  const evolutionValue = months.map((month, index) => ({
    monthYear: `${month} 2023`,
    averageValue: 25000 + Math.sin(index / 6) * 5000, // Sinusoidal variation
  }))

  return {
    byCustomerUnits,
    byCustomerValue,
    evolutionUnits,
    evolutionValue,
  }
}

// Utility function to generate product category data
export function generateProductCategoryData() {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
    { id: "c5", name: "Gap" },
    { id: "c6", name: "Uniqlo" },
  ]

  const categories = [
    { id: "cat1", name: "T-Shirts" },
    { id: "cat2", name: "Jeans" },
    { id: "cat3", name: "Dresses" },
    { id: "cat4", name: "Jackets" },
    { id: "cat5", name: "Sweaters" },
    { id: "cat6", name: "Activewear" },
    { id: "cat7", name: "Underwear" },
    { id: "cat8", name: "Accessories" },
  ]

  // Generate overall category data
  const categoryData = categories.map((category) => {
    const units = Math.floor(Math.random() * 100000) + 20000 // 20K-120K units
    const value = units * (Math.random() * 20 + 10) // $10-$30 per unit

    return {
      ...category,
      units,
      value,
    }
  })

  // Calculate totals
  const totalUnits = categoryData.reduce((sum, data) => sum + data.units, 0)
  const totalValue = categoryData.reduce((sum, data) => sum + data.value, 0)

  // Add percentages
  const categoryDataWithPercentages = categoryData.map((category) => ({
    ...category,
    unitsPercentage: (category.units / totalUnits) * 100,
    valuePercentage: (category.value / totalValue) * 100,
  }))

  // Generate customer-specific category data
  const customerCategoryData = customers.map((customer) => {
    const customerCategories = categories.map((category) => {
      const units = Math.floor(Math.random() * 20000) + 5000 // 5K-25K units
      const value = units * (Math.random() * 20 + 10) // $10-$30 per unit

      return {
        ...category,
        units,
        value,
      }
    })

    // Calculate customer totals
    const customerTotalUnits = customerCategories.reduce((sum, data) => sum + data.units, 0)
    const customerTotalValue = customerCategories.reduce((sum, data) => sum + data.value, 0)

    // Add percentages
    const customerCategoriesWithPercentages = customerCategories.map((category) => ({
      ...category,
      unitsPercentage: (category.units / customerTotalUnits) * 100,
      valuePercentage: (category.value / customerTotalValue) * 100,
    }))

    return {
      ...customer,
      categories: customerCategoriesWithPercentages,
      totalUnits: customerTotalUnits,
      totalValue: customerTotalValue,
    }
  })

  return {
    categoryData: categoryDataWithPercentages,
    customerCategoryData,
    totalUnits,
    totalValue,
  }
}

// Formatting utilities
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (isNaN(num)) return "$0.00"
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

export function formatNumber(number: number | string): string {
  const num = typeof number === "string" ? Number.parseFloat(number) : number
  if (isNaN(num)) return "0"
  return num.toLocaleString()
}

export function formatPercent(decimal: number): string {
  if (isNaN(decimal)) return "0%"
  return (decimal * 100).toFixed(1) + "%"
}

// Chart color palette
export const chartColors = [
  "#2563eb", // Indigo
  "#059669", // Emerald
  "#ca8a04", // Amber
  "#dc2626", // Red
  "#9333ea", // Violet
  "#06b6d4", // Cyan
  "#f472b6", // Rose
  "#eab308", // Yellow
  "#64748b", // Gray
  "#3b82f6", // Blue
]
