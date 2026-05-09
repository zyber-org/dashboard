"use client"

import { CheckIcon, CirclePlusIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export type FacetedOption = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

type Props = {
  title: string
  options: FacetedOption[]
  selected: string[]
  onChange: (next: string[]) => void
  /** Pass true to allow only one option at a time. */
  singleSelect?: boolean
}

export function DataTableFacetedFilter({
  title,
  options,
  selected,
  onChange,
  singleSelect = false,
}: Props) {
  const selectedSet = new Set(selected)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 border-dashed" />
        }
      >
        <CirclePlusIcon className="mr-1 size-3.5" />
        {title}
        {selected.length > 0 ? (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge
              variant="secondary"
              className="rounded-sm px-1 font-normal lg:hidden"
            >
              {selected.length}
            </Badge>
            <div className="hidden gap-1 lg:flex">
              {selected.length > 2 ? (
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {selected.length} selected
                </Badge>
              ) : (
                options
                  .filter((o) => selectedSet.has(o.value))
                  .map((o) => (
                    <Badge
                      key={o.value}
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {o.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        ) : null}
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (singleSelect) {
                        onChange(isSelected ? [] : [option.value])
                        return
                      }
                      const next = new Set(selected)
                      if (isSelected) next.delete(option.value)
                      else next.add(option.value)
                      onChange(Array.from(next))
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className="size-3" />
                    </div>
                    {option.icon ? (
                      <option.icon className="mr-2 size-4 text-muted-foreground" />
                    ) : null}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    <XIcon className="mr-1 size-3.5" />
                    Clear
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
