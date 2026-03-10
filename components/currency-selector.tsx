"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchCurrencies, commonCurrencies, currencySymbols } from "@/lib/currency-utils"

interface CurrencySelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CurrencySelector({
  value,
  onValueChange,
  placeholder = "Select currency",
  disabled = false,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>(commonCurrencies)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadCurrencies = async () => {
      setLoading(true)
      try {
        const fetchedCurrencies = await fetchCurrencies()
        setCurrencies(fetchedCurrencies)
      } catch (error) {
        console.error("Failed to load currencies:", error)
        // Fallback to common currencies
        setCurrencies(commonCurrencies)
      } finally {
        setLoading(false)
      }
    }

    loadCurrencies()
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? (
            <span>
              {currencySymbols[value] || ""} {value}
            </span>
          ) : (
            placeholder
          )}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {currencies.map((currency) => (
                <CommandItem
                  key={currency}
                  value={currency}
                  onSelect={() => {
                    onValueChange(currency)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === currency ? "opacity-100" : "opacity-0")} />
                  <span className="mr-2">{currencySymbols[currency] || ""}</span>
                  {currency}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
