import { useState, useRef, useEffect, useMemo } from 'react'
import './SearchableDropdown.css'

interface SearchableDropdownProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  optionLabels?: Record<string, string>
  emptyMessage?: string
  searchPlaceholder?: string
}

function SearchableDropdown({
  placeholder,
  value,
  onChange,
  options,
  optionLabels,
  emptyMessage = 'No options available',
  searchPlaceholder = 'Search...',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus()
    } else {
      setSearch('')
    }
  }, [isOpen])

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(option => {
      const label = optionLabels?.[option] ?? option
      return option.toLowerCase().includes(q) || label.toLowerCase().includes(q)
    })
  }, [options, optionLabels, search])

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      <div className="searchable-dropdown-input" onClick={() => setIsOpen(o => !o)}>
        <span className={`searchable-dropdown-value ${!value ? 'searchable-dropdown-placeholder' : ''}`}>
          {value || placeholder}
        </span>
        <div className="searchable-dropdown-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {isOpen && (
        <div className="searchable-dropdown-menu">
          <div className="searchable-dropdown-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7.3" cy="7.3" r="5.3" stroke="#9CA3AF" strokeWidth="1.5" />
              <path d="M14 14L11.1 11.1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              className="searchable-dropdown-search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="searchable-dropdown-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-dropdown-option searchable-dropdown-option-empty">{emptyMessage}</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option}
                  className={`searchable-dropdown-option ${value === option ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {optionLabels?.[option] ?? option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableDropdown
