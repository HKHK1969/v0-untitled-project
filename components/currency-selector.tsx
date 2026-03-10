"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { commonCurrencies, getCurrencySymbol } from "@/lib/currency-utils"

interface CurrencySelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CurrencySelector({
  value,
  onValueChange,
  placeholder = "Select currency...",
  disabled = false,
}: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCurrency = value ? commonCurrencies.find((currency) => currency === value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled}
          type="button"
        >
          {selectedCurrency ? (
            <span className="flex items-center gap-2">
              <span className="font-mono">{getCurrencySymbol(selectedCurrency)}</span>
              {selectedCurrency}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-60 overflow-auto">
          {commonCurrencies.map((currency) => (
            <div
              key={currency}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                value === currency && "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                onValueChange?.(currency)
                setOpen(false)
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", value === currency ? "opacity-100" : "opacity-0")} />
              <span className="font-mono mr-2">{getCurrencySymbol(currency)}</span>
              <span>{currency}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
