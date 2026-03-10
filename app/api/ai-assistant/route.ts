import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Create a comprehensive mock response system
function getAIResponse(query: string): { content: string } {
  // Normalize the query for easier matching
  const normalizedQuery = query.toLowerCase().trim()

  // Static responses for common queries
  const responses: Record<string, string> = {
    // Order related queries
    "show me all delayed orders":
      "📦 **Delayed Orders**\n\nBased on the available data, here are the delayed orders:\n\n- Order #12345: Customer A, 5 days delayed\n- Order #67890: Customer B, 2 days delayed\n- Order #24680: Customer C, 1 day delayed\n\nTotal: 3 delayed orders",

    "which orders are due for delivery this week":
      "📅 **Orders Due This Week**\n\nBased on the available data, these orders are due this week:\n\n- Order #54321: Customer C, Due on Wednesday\n- Order #98765: Customer D, Due on Friday\n- Order #13579: Customer E, Due on Thursday\n\nTotal: 3 orders due this week",

    "list the most recent orders placed":
      "🆕 **Recent Orders**\n\n1. Order #24680: Customer F, Placed yesterday\n2. Order #13579: Customer G, Placed 2 days ago\n3. Order #97531: Customer H, Placed 3 days ago\n\nAll recent orders are currently in processing status.",

    "what's the status of our open orders":
      "📊 **Open Orders Status**\n\n- Processing: 5 orders\n- Ready for Shipment: 3 orders\n- In Transit: 2 orders\n\nTotal Open Orders: 10",

    // Supplier related queries
    "rank our suppliers by performance":
      "🏭 **Supplier Performance Ranking**\n\n1. Supplier X: 95% on-time delivery, 0.5% defect rate\n2. Supplier Y: 87% on-time delivery, 1.2% defect rate\n3. Supplier Z: 76% on-time delivery, 2.1% defect rate\n\nTop performer: Supplier X has maintained consistent quality and delivery times.",

    "which suppliers have the most late deliveries":
      "⏰ **Late Delivery Analysis**\n\n1. Supplier Z: 24% late deliveries\n2. Supplier Y: 13% late deliveries\n3. Supplier X: 5% late deliveries\n\nRecommendation: Schedule a review meeting with Supplier Z to address ongoing delivery issues.",

    "compare lead times across our top suppliers":
      "⏱️ **Supplier Lead Time Comparison**\n\n- Supplier X: Average 12 days\n- Supplier Y: Average 18 days\n- Supplier Z: Average 22 days\n\nSupplier X consistently provides the shortest lead times across all product categories.",

    "list suppliers added in the last 3 months":
      "✨ **New Suppliers (Last 3 Months)**\n\n1. Supplier A - Added 2 months ago\n2. Supplier B - Added 6 weeks ago\n3. Supplier C - Added 3 weeks ago\n\nAll new suppliers are currently in the probationary period.",

    // Production related queries
    "which styles are behind production schedule":
      "👕 **Styles Behind Schedule**\n\n1. Style #ABC123: 5 days behind, currently in cutting phase\n2. Style #DEF456: 3 days behind, currently in sewing phase\n3. Style #GHI789: 2 days behind, currently in QC phase\n\nMain reason for delays: Material shortages from Supplier Z",

    "summarize recent quality issues by supplier":
      "🔍 **Quality Issues Summary**\n\n- Supplier X: Minor color variation in batch #45678\n- Supplier Y: Inconsistent stitching in style #DEF456\n- Supplier Z: Wrong button size on style #JKL012\n\nMost critical: Supplier Y's stitching issues require immediate attention.",

    "what's the status of our sample requests":
      "📋 **Sample Request Status**\n\n- Pending Approval: 3 requests\n- In Production: 5 requests\n- Completed: 2 requests\n- Rejected: 1 request\n\nUrgent: Customer A's sample request #SR001 needs approval by tomorrow.",

    "identify production timeline risks":
      "⚠️ **Production Timeline Risks**\n\n1. High Risk: Style #MNO345 - Material shortage\n2. Medium Risk: Style #PQR678 - Labor constraints\n3. Low Risk: Style #STU901 - Minor QC issues\n\nRecommended Action: Expedite alternative material sourcing for Style #MNO345",

    // Report related queries
    "generate a monthly supply chain performance report":
      "📈 **Monthly Supply Chain Performance Report**\n\n**1. Order Fulfillment**\n- On-time delivery rate: 85%\n- Average processing time: 3.2 days\n- Order accuracy: 98.5%\n\n**2. Supplier Performance**\n- Top performer: Supplier X\n- Most improved: Supplier Y\n- Needs attention: Supplier Z\n\n**3. Production Timeline**\n- On-schedule rate: 78%\n- Average delay: 2.3 days\n- Main delay causes: Material shortages (40%), Labor constraints (30%)\n\n**4. Quality Issues**\n- Defect rate: 1.8%\n- Return rate: 0.5%\n- Most common issue: Stitching quality\n\n**5. Cost Analysis**\n- Average cost per unit: $12.35\n- Cost variance: +2.1% vs. last month\n- Cost-saving opportunities: Bulk ordering, Supplier consolidation",

    "analyze production costs across different product lines":
      "💰 **Production Cost Analysis**\n\n**T-Shirts**\n- Average cost: $8.25/unit\n- Main cost driver: Materials (65%)\n\n**Jeans**\n- Average cost: $15.40/unit\n- Main cost driver: Labor (55%)\n\n**Dresses**\n- Average cost: $22.75/unit\n- Main cost driver: Materials (48%)\n\nHighest margin product line: T-Shirts (42% margin)",

    "report on delivery performance by supplier":
      "🚚 **Delivery Performance Report**\n\n**Supplier X**\n- On-time rate: 95%\n- Average delay when late: 1.2 days\n\n**Supplier Y**\n- On-time rate: 87%\n- Average delay when late: 2.5 days\n\n**Supplier Z**\n- On-time rate: 76%\n- Average delay when late: 4.8 days\n\nOverall on-time delivery rate: 86%",

    "summarize order patterns by customer":
      "👥 **Customer Order Patterns**\n\n**Customer A**\n- Order frequency: Weekly\n- Average order size: 500 units\n- Preferred products: T-shirts, Hoodies\n\n**Customer B**\n- Order frequency: Bi-weekly\n- Average order size: 1,200 units\n- Preferred products: Jeans, Shorts\n\n**Customer C**\n- Order frequency: Monthly\n- Average order size: 2,500 units\n- Preferred products: Dresses, Skirts\n\nLargest customer by volume: Customer C",
  }

  // Check for exact matches first
  if (responses[normalizedQuery]) {
    return { content: responses[normalizedQuery] }
  }

  // Check for partial matches
  for (const [key, response] of Object.entries(responses)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return { content: response }
    }
  }

  // Keywords matching for more flexible responses
  const keywords = {
    order: ["order", "delivery", "shipment", "package"],
    supplier: ["supplier", "vendor", "manufacturer", "factory"],
    production: ["production", "manufacturing", "make", "produce", "timeline"],
    quality: ["quality", "defect", "issue", "problem"],
    cost: ["cost", "price", "expense", "budget"],
    report: ["report", "summary", "analysis", "overview"],
  }

  // Check for keyword matches
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => normalizedQuery.includes(word))) {
      // Return a generic response based on the category
      switch (category) {
        case "order":
          return {
            content:
              "📦 **Order Information**\n\nBased on the available data, we have 10 active orders in the system. 7 are on schedule, and 3 are delayed. The most common product categories in current orders are T-shirts (40%), Jeans (35%), and Dresses (25%).",
          }
        case "supplier":
          return {
            content:
              "🏭 **Supplier Overview**\n\nWe currently work with 5 main suppliers. Supplier X has the best overall performance with 95% on-time delivery. Supplier Z needs attention due to consistent delays and quality issues.",
          }
        case "production":
          return {
            content:
              "👕 **Production Status**\n\nCurrent production capacity is at 85%. We have 12 styles in active production, with 3 styles behind schedule. The main bottleneck is in the cutting department.",
          }
        case "quality":
          return {
            content:
              "🔍 **Quality Overview**\n\nOverall defect rate is 1.8%. The most common quality issues are related to stitching (40%), color consistency (30%), and sizing (20%). Supplier Y has shown the most quality improvements in the last month.",
          }
        case "cost":
          return {
            content:
              "💰 **Cost Analysis**\n\nAverage production cost is $12.35 per unit across all product lines. T-shirts have the highest profit margin at 42%. Recent material price increases have affected the jeans category the most.",
          }
        case "report":
          return {
            content:
              "📊 **Performance Summary**\n\nThis month's key metrics:\n- On-time delivery: 85%\n- Quality compliance: 98.2%\n- Cost efficiency: 91%\n- Supplier reliability: 87%\n\nOverall performance is up 3% compared to last month.",
          }
      }
    }
  }

  // Default response if no matches
  return {
    content:
      "I don't have specific information about that query in my current dataset. I can help with questions about orders, suppliers, production status, quality issues, costs, or generate reports based on the available supply chain data. Would you like information on any of these topics?",
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { messages } = await req.json()

    // Get the most recent user message
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()

    if (!lastUserMessage) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 })
    }

    // Get the AI response using our local function
    const response = getAIResponse(lastUserMessage.content)

    // Return the response
    return NextResponse.json({
      role: "assistant",
      content: response.content,
    })
  } catch (error) {
    console.error("AI Assistant error:", error)
    return NextResponse.json({
      role: "assistant",
      content: "Sorry, I encountered an error processing your request. Please try again.",
      error: true,
    })
  }
}
