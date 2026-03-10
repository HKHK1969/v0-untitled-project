export class AccessibilityManager {
  private static announcements: string[] = []
  private static liveRegion: HTMLElement | null = null

  static initialize(): void {
    if (typeof window === "undefined") return

    // Create live region for screen reader announcements
    this.liveRegion = document.createElement("div")
    this.liveRegion.setAttribute("aria-live", "polite")
    this.liveRegion.setAttribute("aria-atomic", "true")
    this.liveRegion.className = "sr-only"
    this.liveRegion.id = "accessibility-announcements"
    document.body.appendChild(this.liveRegion)
  }

  static announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    if (!this.liveRegion) this.initialize()

    this.announcements.push(message)
    if (this.liveRegion) {
      this.liveRegion.setAttribute("aria-live", priority)
      this.liveRegion.textContent = message

      // Clear after announcement
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = ""
        }
      }, 1000)
    }
  }

  static announceError(error: string): void {
    this.announce(`Error: ${error}`, "assertive")
  }

  static announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, "polite")
  }

  static announceLoading(message = "Loading"): void {
    this.announce(`${message}...`, "polite")
  }

  static announceLoadingComplete(message = "Content loaded"): void {
    this.announce(message, "polite")
  }
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = []

  static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement)
    }
  }

  static restoreFocus(): void {
    const lastFocused = this.focusStack.pop()
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus()
    }
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener("keydown", handleTabKey)

    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }

    // Return cleanup function
    return () => {
      container.removeEventListener("keydown", handleTabKey)
    }
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  static handleArrowNavigation(
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void,
  ): void {
    let newIndex = currentIndex

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        newIndex = (currentIndex + 1) % items.length
        break
      case "ArrowUp":
      case "ArrowLeft":
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
        break
      case "Home":
        newIndex = 0
        break
      case "End":
        newIndex = items.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    onIndexChange(newIndex)
    items[newIndex]?.focus()
  }

  static handleEscapeKey(e: KeyboardEvent, onEscape: () => void): void {
    if (e.key === "Escape") {
      e.preventDefault()
      onEscape()
    }
  }
}

// Color contrast utilities
export class ContrastChecker {
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  static getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const lum1 = this.getLuminance(...color1)
    const lum2 = this.getLuminance(...color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  }

  static meetsWCAGAA(color1: [number, number, number], color2: [number, number, number]): boolean {
    return this.getContrastRatio(color1, color2) >= 4.5
  }

  static meetsWCAGAAA(color1: [number, number, number], color2: [number, number, number]): boolean {
    return this.getContrastRatio(color1, color2) >= 7
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  static addAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute("aria-label", label)
  }

  static addAriaDescription(element: HTMLElement, description: string): void {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`
    const descElement = document.createElement("div")
    descElement.id = descId
    descElement.className = "sr-only"
    descElement.textContent = description
    document.body.appendChild(descElement)
    element.setAttribute("aria-describedby", descId)
  }

  static markAsButton(element: HTMLElement): void {
    element.setAttribute("role", "button")
    element.setAttribute("tabindex", "0")
  }

  static markAsRegion(element: HTMLElement, label: string): void {
    element.setAttribute("role", "region")
    element.setAttribute("aria-label", label)
  }
}
