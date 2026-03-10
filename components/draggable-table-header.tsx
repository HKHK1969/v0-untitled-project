"use client"

import type React from "react"

import { useRef, useCallback, memo, useEffect } from "react"
import { useDrag, useDrop, type DropTargetMonitor } from "react-dnd"
import { TableHead } from "@/components/ui/table"

// Constants
const MIN_WIDTH = 100 // Recommendation 1: Configurable min width
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
  minWidth?: number // Recommendation 1: Configurable min width
  disabled?: boolean // Recommendation 1: Disable drag/resize
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
}: DraggableTableHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Drag and drop logic (Recommendation 3: Optimized with useCallback)
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !disabled, // Recommendation 1
  })

  const [, drop] = useDrop({
    accept: DRAG_TYPE,
    hover: useCallback(
      (item: { id: string; index: number }, monitor: DropTargetMonitor) => {
        if (!ref.current || disabled) return
        const dragIndex = item.index
        const hoverIndex = index
        if (dragIndex === hoverIndex) return
        moveColumn(dragIndex, hoverIndex)
        item.index = hoverIndex // Mutate item safely within hover
      },
      [index, moveColumn, disabled],
    ),
  })

  drag(drop(ref))

  // Resize logic with throttling (Recommendation 3)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return // Recommendation 1
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

  // Error handling for refs (Recommendation 2)
  useEffect(() => {
    if (!ref.current) {
      console.warn("DraggableTableHeader: ref is not attached to TableHead")
    }
    if (!resizeRef.current) {
      console.warn("DraggableTableHeader: resizeRef is not attached to resize handle")
    }
  }, [])

  return (
    <TableHead
      ref={ref}
      onClick={onClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
        width: `${width}px`,
        position: "relative",
        cursor: disabled ? "default" : "pointer",
      }}
      aria-label={`Column ${id}`} // Recommendation 4: Accessibility
    >
      {children}
      {!disabled && (
        <div
          ref={resizeRef}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/20"
          onMouseDown={handleMouseDown}
          aria-hidden="true" // Recommendation 4: Hidden from screen readers
        />
      )}
    </TableHead>
  )
})

// Default export for backward compatibility
export default DraggableTableHeader

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added minWidth and disabled props
// 2. Error Handling: Added ref checks with warnings
// 3. Performance: Memoized component, throttled resize, optimized hover
// 4. Accessibility: Added aria-label and aria-hidden
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., draggable-table-header.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders with default props
// 2. Test drag updates index via moveColumn
// 3. Test resize updates width via onResize
// 4. Test disabled prevents drag and resize
// 5. Test warnings for missing refs
// Example test file structure:
// import { render, screen } from "@testing-library/react"
// import { DndProvider } from "react-dnd"
// import { HTML5Backend } from "react-dnd-html5-backend"
// test("renders header", () => {
//   render(
//     <DndProvider backend={HTML5Backend}>
//       <DraggableTableHeader id="test" index={0} moveColumn={jest.fn()} onResize={jest.fn()}>
//         Test
//       </DraggableTableHeader>
//     </DndProvider>
//   )
//   expect(screen.getByText("Test")).toBeInTheDocument()
// })
// test("disabled prevents resize", () => {
//   const onResize = jest.fn()
//   render(
//     <DndProvider backend={HTML5Backend}>
//       <DraggableTableHeader id="test" index={0} moveColumn={jest.fn()} onResize={onResize} disabled>
//         Test
//       </DraggableTableHeader>
//     </DndProvider>
//   )
//   expect(screen.getByText("Test").querySelector(".cursor-col-resize")).not.toBeInTheDocument()
// })
