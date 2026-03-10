"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Building2 } from "lucide-react"

interface ProfileSetupStepProps {
  onNext: (data?: any) => void
  onSkip?: () => void
  stepData: any
  user: any
}

export function ProfileSetupStep({ onNext, stepData }: ProfileSetupStepProps) {
  const [companyName, setCompanyName] = useState(stepData.companyName || "")
  const [role, setRole] = useState(stepData.role || "")
  const [companySize, setCompanySize] = useState(stepData.companySize || "")
  const [industry, setIndustry] = useState(stepData.industry || "")
  const [description, setDescription] = useState(stepData.description || "")

  const handleNext = () => {
    onNext({
      companyName,
      role,
      companySize,
      industry,
      description,
    })
  }

  const isValid = companyName.trim() && role && companySize

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Tell us about your business</h3>
        <p className="text-muted-foreground">This helps us customize your experience</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="company-name">Company Name *</Label>
          <Input
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter your company name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="role">Your Role *</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner/Founder</SelectItem>
              <SelectItem value="sourcing-manager">Sourcing Manager</SelectItem>
              <SelectItem value="production-manager">Production Manager</SelectItem>
              <SelectItem value="supply-chain-manager">Supply Chain Manager</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
              <SelectItem value="merchandiser">Merchandiser</SelectItem>
              <SelectItem value="quality-manager">Quality Manager</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="company-size">Company Size *</Label>
          <Select value={companySize} onValueChange={setCompanySize}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-1000">201-1000 employees</SelectItem>
              <SelectItem value="1000+">1000+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="industry">Industry Focus</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select primary industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fashion">Fashion & Apparel</SelectItem>
              <SelectItem value="sportswear">Sportswear & Activewear</SelectItem>
              <SelectItem value="luxury">Luxury Goods</SelectItem>
              <SelectItem value="fast-fashion">Fast Fashion</SelectItem>
              <SelectItem value="sustainable">Sustainable Fashion</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="footwear">Footwear</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Brief Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more about your business..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!isValid} className="flex items-center gap-2">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
