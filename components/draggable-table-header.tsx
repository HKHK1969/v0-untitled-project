"use client"

import type React from "react"

import { useRef, useCallback, memo, useEffect } from "react"
import { useDrag, useDrop, type DropTargetMonitor } from "react-dnd"

// Constants
const MIN_WIDTH = 100
const RESIZE_HANDLE_WIDTH = 2
const DRAG_TYPE = "COLUMN"

// Type definitions
interface DraggableTableHeaderProps {
  id: string
  index: number
  moveColumn: (dragIndex: number, hoverIndex: number) => void
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLTableCellElement>) => void
  width?: number
  onResize: (newWidth: number) => void
  minWidth?: number
  disabled?: boolean
  column?: any
  sortColumn?: string
  sortDirection?: string
}

// Enhanced DraggableTableHeader
export const DraggableTableHeader = memo(function DraggableTableHeader({
  id,
  index,
  moveColumn,
  children,
  onClick,
  width = 150,
  onResize,
  minWidth = MIN_WIDTH,
  disabled = false,
  column,
  sortColumn,
  sortDirection,
}: DraggableTableHeaderProps) {
  const dragRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Drag and drop logic
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: id || column?.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !disabled,
  })

  const [, drop] = useDrop({
    accept: DRAG_TYPE,
    hover: useCallback(
      (item: { id: string; index: number }, monitor: DropTargetMonitor) => {
        if (!dragRef.current || disabled) return
        const dragIndex = item.index
        const hoverIndex = index
        if (dragIndex === hoverIndex) return

        // Get the bounding rectangle of the hovered element
        const hoverBoundingRect = dragRef.current.getBoundingClientRect()
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2
        const clientOffset = monitor.getClientOffset()

        if (!clientOffset) return

        const hoverClientX = clientOffset.x - hoverBoundingRect.left

        // Only perform the move when the mouse has crossed half of the items width
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return

        moveColumn(dragIndex, hoverIndex)
        item.index = hoverIndex
      },
      [index, moveColumn, disabled],
    ),
  })

  // Apply drag and drop refs
  useEffect(() => {
    if (dragRef.current) {
      drag(drop(dragRef.current))
    }
  }, [drag, drop])

  // Resize logic with throttling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()

      const startX = e.pageX
      const startWidth = width

      let lastUpdate = 0
      const THROTTLE_MS = 16 // ~60fps

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const now = Date.now()
        if (now - lastUpdate < THROTTLE_MS) return
        lastUpdate = now
        const newWidth = Math.max(minWidth, startWidth + (moveEvent.pageX - startX))
        onResize(newWidth)
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [width, onResize, minWidth, disabled],
  )

  // Return the draggable content with proper styling
  return (
    <div
      ref={dragRef}
      className="flex items-center justify-between w-full h-full relative"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? "default" : "move",
      }}
    >
      <div className="flex-1" onClick={onClick}>
        {children}
      </div>
      {!disabled && (
        <div
          ref={resizeRef}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/20 z-10"
          onMouseDown={handleMouseDown}
          aria-hidden="true"
        />
      )}
    </div>
  )
})

// Default export for backward compatibility
export default DraggableTableHeader
