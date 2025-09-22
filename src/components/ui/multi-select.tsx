"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleSelect = (currentValue: string) => {
    if (selected.includes(currentValue)) {
      onChange(selected.filter((item) => item !== currentValue))
    } else {
      onChange([...selected, currentValue])
    }
    setSearch("")
  }

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selected.length > 0 ? (
            selected.map((item) => {
              const option = options.find((option) => option.value === item)
              return (
                <Badge
                  variant="secondary"
                  key={item}
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  {option?.label}
                  <X className="ml-1 h-3 w-3 cursor-pointer" />
                </Badge>
              )
            })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
          <Input
            placeholder="Search genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No genre found.</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    selected.includes(option.value)
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}