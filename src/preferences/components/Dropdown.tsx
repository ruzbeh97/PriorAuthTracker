import { useState, useRef, useEffect } from 'react'
import { AssigneePickerPopover } from '../../components/AssigneePicker'
import './Dropdown.css'

interface DropdownProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  groupOptions?: string[]
  optionLabels?: Record<string, string>
  optionDescriptions?: Record<string, string>
  menuClassName?: string
  emptyMessage?: string
  disabled?: boolean
}

function Dropdown({
  placeholder,
  value,
  onChange,
  options,
  groupOptions,
  optionLabels,
  optionDescriptions,
  menuClassName,
  emptyMessage = 'No options available',
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  // Passing groupOptions marks this as an assignee field, which uses the shared picker.
  const isAssignee = Boolean(groupOptions)
  const catalog = options

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
  }

  const useRichOptions = Boolean(optionDescriptions)

  const renderOptionContent = (option: string) => {
    if (useRichOptions) {
      const description = optionDescriptions?.[option] ?? ''
      return (
        <>
          <span className="dropdown-option-code">{option}</span>
          {description ? <span className="dropdown-option-desc">{description}</span> : null}
        </>
      )
    }
    return optionLabels?.[option] ?? option
  }

  return (
    <div className={`dropdown ${disabled ? 'dropdown-disabled' : ''}`} ref={dropdownRef}>
      <div
        ref={triggerRef}
        className="dropdown-input"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-disabled={disabled}
      >
        <span className={`dropdown-value ${!value ? 'dropdown-placeholder' : ''}`}>
          {value || placeholder}
        </span>
        <div className="dropdown-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {isOpen && !disabled && isAssignee && (
        <AssigneePickerPopover
          anchorRef={triggerRef}
          align="left"
          selected={value ? [value] : []}
          extraIndividuals={options}
          onSelect={option => handleSelect(option)}
          onDismiss={() => setIsOpen(false)}
        />
      )}
      {isOpen && !disabled && !isAssignee && (
        <div className={`dropdown-menu ${menuClassName ?? ''}`.trim()}>
          {catalog.length === 0 ? (
            <div className="dropdown-option dropdown-option-empty">{emptyMessage}</div>
          ) : (
            catalog.map(option => (
              <div
                key={option}
                className={`dropdown-option ${useRichOptions ? 'dropdown-option-rich' : ''} ${value === option ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                {renderOptionContent(option)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Dropdown

