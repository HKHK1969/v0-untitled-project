"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Palette, Ruler, DollarSign } from "lucide-react"

interface FirstProductStepProps {
  onNext: (data: any) => void
  onSkip: () => void
  stepData: any
  user: any
}

export function FirstProductStep({ onNext, onSkip, stepData }: FirstProductStepProps) {
  const [formData, setFormData] = useState({
    name: stepData.firstProduct?.name || "",
    category: stepData.firstProduct?.category || "",
    description: stepData.firstProduct?.description || "",
    material: stepData.firstProduct?.material || "",
    colors: stepData.firstProduct?.colors || "",
    sizes: stepData.firstProduct?.sizes || "",
    targetPrice: stepData.firstProduct?.targetPrice || "",
    moq: stepData.firstProduct?.moq || "",
    notes: stepData.firstProduct?.notes || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    onNext({ firstProduct: formData })
  }

  const isFormValid = formData.name && formData.category && formData.description

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Your First Product
          </CardTitle>
          <CardDescription>
            Define your first product to start tracking its journey through your supply chain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="e.g., Cotton T-Shirt"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apparel">Apparel</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="footwear">Footwear</SelectItem>
                  <SelectItem value="bags">Bags & Luggage</SelectItem>
                  <SelectItem value="home-textiles">Home Textiles</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Product Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your product in detail..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                placeholder="e.g., 100% Cotton"
                value={formData.material}
                onChange={(e) => handleInputChange("material", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Available Colors
              </Label>
              <Input
                id="colors"
                placeholder="e.g., Black, White, Navy, Red"
                value={formData.colors}
                onChange={(e) => handleInputChange("colors", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sizes" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Available Sizes
              </Label>
              <Input
                id="sizes"
                placeholder="e.g., XS, S, M, L, XL"
                value={formData.sizes}
                onChange={(e) => handleInputChange("sizes", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Target Price (USD)
              </Label>
              <Input
                id="target-price"
                type="number"
                placeholder="e.g., 15.00"
                value={formData.targetPrice}
                onChange={(e) => handleInputChange("targetPrice", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
            <Input
              id="moq"
              type="number"
              placeholder="e.g., 500"
              value={formData.moq}
              onChange={(e) => handleInputChange("moq", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements, certifications, or notes..."
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
