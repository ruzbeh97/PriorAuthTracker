import { useState, useRef, useEffect, useMemo } from 'react'
import './MultiSelectDropdown.css'

interface MultiSelectDropdownProps {
  placeholder?: string
  selectedValues: string[]
  onChange: (values: string[]) => void
  options: string[]
  disabled?: boolean
  allowCustom?: boolean
  searchPlaceholder?: string
}

function MultiSelectDropdown({
  placeholder,
  selectedValues,
  onChange,
  options,
  disabled = false,
  allowCustom = false,
  searchPlaceholder = 'Search or add...',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (isOpen && allowCustom) {
      searchRef.current?.focus()
    } else {
      setSearch('')
    }
  }, [isOpen, allowCustom])

  const allOptions = useMemo(() => {
    const merged = new Set([...options, ...selectedValues])
    return Array.from(merged)
  }, [options, selectedValues])

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allOptions
    return allOptions.filter(option => option.toLowerCase().includes(query))
  }, [allOptions, search])

  const trimmedSearch = search.trim()
  const canAddCustom = allowCustom
    && trimmedSearch.length > 0
    && !allOptions.some(option => option.toLowerCase() === trimmedSearch.toLowerCase())
    && !selectedValues.some(value => value.toLowerCase() === trimmedSearch.toLowerCase())

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option))
    } else {
      onChange([...selectedValues, option])
    }
  }

  const handleAddCustom = () => {
    if (!canAddCustom) return
    onChange([...selectedValues, trimmedSearch])
    setSearch('')
  }

  const handleRemoveBadge = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedValues.filter(v => v !== value))
  }

  return (
    <div className={`multi-select-dropdown ${disabled ? 'multi-select-disabled' : ''}`} ref={dropdownRef}>
      <div 
        className="multi-select-input"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-disabled={disabled}
      >
        {selectedValues.length === 0 ? (
          <span className="multi-select-placeholder">{placeholder}</span>
        ) : (
          <div className="multi-select-badges">
            {selectedValues.map((value) => (
              <span key={value} className="multi-select-badge">
                {value}
                {!disabled && (
                  <button
                    className="multi-select-badge-remove"
                    onClick={(e) => handleRemoveBadge(value, e)}
                    aria-label={`Remove ${value}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 3L3 9M3 3L9 9" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        <div className="multi-select-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {isOpen && !disabled && (
        <div className="multi-select-menu">
          {allowCustom && (
            <div className="multi-select-search">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7.3" cy="7.3" r="5.3" stroke="#9CA3AF" strokeWidth="1.5" />
                <path d="M14 14L11.1 11.1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                className="multi-select-search-input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustom()
                  }
                }}
              />
            </div>
          )}
          {filteredOptions.map((option) => {
            const checked = selectedValues.includes(option)
            return (
              <div
                key={option}
                className={`multi-select-option ${checked ? 'selected' : ''}`}
                onClick={() => handleToggle(option)}
              >
                <span className={`multi-select-checkbox ${checked ? 'checked' : ''}`}>
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span className="multi-select-option-label">{option}</span>
              </div>
            )
          })}
          {canAddCustom && (
            <div
              className="multi-select-option multi-select-option-create"
              onClick={handleAddCustom}
            >
              <span className="multi-select-option-label">Add &ldquo;{trimmedSearch}&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiSelectDropdown

