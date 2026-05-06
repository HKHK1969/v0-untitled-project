import Link from "next/link"
import { AlertTriangle, Clock, Calendar, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"

// Mock urgent data - in real app this would come from your data source
const URGENT_ITEMS = {
  criticalTasks: [
    { id: 1, title: "Review PO #12345 specifications", customer: "Nike", daysOverdue: 2 },
    { id: 2, title: "Approve sample for Style ABC123", customer: "Adidas", daysOverdue: 1 },
  ],
  nearingDeadlines: [
    { id: 1, title: "Sample delivery for Style XYZ789", customer: "Under Armour", daysLeft: 1 },
    { id: 2, title: "PO #67890 ex-factory date", customer: "Reebok", daysLeft: 2 },
  ],
  delayedOrders: [
    { id: 1, orderNumber: "SO-2024-001", customer: "Nike", daysDelayed: 5 },
    { id: 2, orderNumber: "PO-2024-045", customer: "Adidas", daysDelayed: 3 },
  ],
  urgentRequests: [
    { id: 1, title: "Rush sample request", customer: "Puma" },
    { id: 2, title: "Expedite shipping", customer: "Under Armour" },
  ],
}

export default function Home() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Urgent Items Grid - fills remaining space */}
        <div className="flex-1 p-4 grid grid-cols-4 gap-3 overflow-hidden">
          {/* Overdue Tasks */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-900">Overdue Tasks</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {URGENT_ITEMS.criticalTasks.map((task) => (
                <div key={task.id} className="p-2 bg-red-100 rounded text-xs">
                  <p className="font-medium text-red-900 truncate">{task.title}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-red-700">{task.customer}</span>
                    <Badge variant="destructive" className="text-[10px] h-4">{task.daysOverdue}d</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/tables/tasks" className="text-xs text-red-700 hover:underline mt-2 shrink-0">
              View all tasks
            </Link>
          </div>

          {/* Nearing Deadlines */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <Clock className="h-4 w-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-orange-900">Nearing Deadlines</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {URGENT_ITEMS.nearingDeadlines.map((item) => (
                <div key={item.id} className="p-2 bg-orange-100 rounded text-xs">
                  <p className="font-medium text-orange-900 truncate">{item.title}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-orange-700">{item.customer}</span>
                    <Badge variant="outline" className="text-[10px] h-4 border-orange-300 text-orange-700">{item.daysLeft}d left</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/tables/sampleOrders" className="text-xs text-orange-700 hover:underline mt-2 shrink-0">
              View all orders
            </Link>
          </div>

          {/* Delayed Orders */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <h3 className="text-sm font-semibold text-yellow-900">Delayed Orders</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {URGENT_ITEMS.delayedOrders.map((order) => (
                <div key={order.id} className="p-2 bg-yellow-100 rounded text-xs">
                  <p className="font-medium text-yellow-900 truncate">{order.orderNumber}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-yellow-700">{order.customer}</span>
                    <Badge variant="outline" className="text-[10px] h-4 border-yellow-300 text-yellow-700">{order.daysDelayed}d</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/tables/customerPOs" className="text-xs text-yellow-700 hover:underline mt-2 shrink-0">
              View all POs
            </Link>
          </div>

          {/* Urgent Requests */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900">Urgent Requests</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {URGENT_ITEMS.urgentRequests.map((request) => (
                <div key={request.id} className="p-2 bg-blue-100 rounded text-xs">
                  <p className="font-medium text-blue-900 truncate">{request.title}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-blue-700">{request.customer}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/tables/customers" className="text-xs text-blue-700 hover:underline mt-2 shrink-0">
              View all customers
            </Link>
          </div>
        </div>


      </main>
    </div>
  )
}
