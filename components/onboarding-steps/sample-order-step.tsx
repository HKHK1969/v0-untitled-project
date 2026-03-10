"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ShoppingCart, CalendarIcon, Package2, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface SampleOrderStepProps {
  onNext: (data: any) => void
  onSkip: () => void
  stepData: any
  user: any
}

export function SampleOrderStep({ onNext, onSkip, stepData }: SampleOrderStepProps) {
  const [formData, setFormData] = useState({
    orderName: stepData.sampleOrder?.orderName || "",
    supplier: stepData.sampleOrder?.supplier || "",
    product: stepData.sampleOrder?.product || "",
    quantity: stepData.sampleOrder?.quantity || "",
    expectedDelivery: stepData.sampleOrder?.expectedDelivery || null,
    priority: stepData.sampleOrder?.priority || "medium",
    specifications: stepData.sampleOrder?.specifications || "",
    notes: stepData.sampleOrder?.notes || "",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    onNext({ sampleOrder: formData })
  }

  const isFormValid = formData.orderName && formData.supplier && formData.product && formData.quantity

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Create Your First Sample Order
          </CardTitle>
          <CardDescription>
            Start tracking your supply chain by creating a sample order. This will help you monitor progress and manage
            timelines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-name">Order Name *</Label>
              <Input
                id="order-name"
                placeholder="e.g., Summer Collection Samples"
                value={formData.orderName}
                onChange={(e) => handleInputChange("orderName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Input
                id="supplier"
                placeholder="e.g., ABC Textiles Ltd."
                value={formData.supplier}
                onChange={(e) => handleInputChange("supplier", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center gap-2">
                <Package2 className="h-4 w-4" />
                Product *
              </Label>
              <Input
                id="product"
                placeholder="e.g., Cotton T-Shirt"
                value={formData.product}
                onChange={(e) => handleInputChange("product", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Sample Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 5"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Expected Delivery Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expectedDelivery && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expectedDelivery ? format(formData.expectedDelivery, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expectedDelivery}
                    onSelect={(date) => handleInputChange("expectedDelivery", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Priority Level
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specifications">Product Specifications</Label>
            <Textarea
              id="specifications"
              placeholder="Detailed specifications, colors, sizes, materials, etc..."
              value={formData.specifications}
              onChange={(e) => handleInputChange("specifications", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or requirements..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!isFormValid}>
          Continue
        </Button>
      </div>
    </div>
  )
}
