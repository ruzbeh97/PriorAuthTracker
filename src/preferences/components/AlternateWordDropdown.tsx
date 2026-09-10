import { useState, useRef, useEffect } from 'react'
import Switch from './Switch'
import './AlternateWordDropdown.css'

interface AlternateWord {
  id: string
  word: string
  isDefault: boolean
}

interface AlternateWordDropdownProps {
  position: { top: number; left: number }
  onClose: () => void
  onAddWord: (word: string, isDefault: boolean) => void
  existingWords: AlternateWord[]
  onDeleteWord: (id: string) => void
  onReorderWords: (reorderedWords: AlternateWord[]) => void
  // onUpdateWord is passed but not used in this component
  onUpdateWord?: (id: string, word: string, isDefault: boolean) => void
}

function AlternateWordDropdown({
  position,
  onClose,
  onAddWord,
  existingWords,
  onDeleteWord,
  onReorderWords,
  onUpdateWord: _onUpdateWord // Prefix with underscore to indicate intentionally unused
}: AlternateWordDropdownProps) {
  const [newWord, setNewWord] = useState('')
  const [enableDefault, setEnableDefault] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const infoButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Check if default is enabled (topmost word is default)
  const isDefaultEnabled = existingWords.length > 0 && existingWords[0]?.isDefault

  const handleAddWord = () => {
    if (newWord.trim()) {
      // If enableDefault is true, we'll set the new word as default
      // and the component will handle setting the topmost as default
      onAddWord(newWord.trim(), enableDefault)
      setNewWord('')
      setEnableDefault(false)
    }
  }

  const handleEnableDefaultChange = (checked: boolean) => {
    setEnableDefault(checked)
    if (checked && existingWords.length > 0) {
      // Set the topmost word as default
      const updatedWords = existingWords.map((word, index) => ({
        ...word,
        isDefault: index === 0
      }))
      onReorderWords(updatedWords)
    } else if (!checked) {
      // Remove default from all words
      const updatedWords = existingWords.map(word => ({
        ...word,
        isDefault: false
      }))
      onReorderWords(updatedWords)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddWord()
    }
  }

  const handleDragStart = (e: React.DragEvent, wordId: string) => {
    setDraggedId(wordId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', wordId)
  }

  const handleDragOver = (e: React.DragEvent, wordId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId && draggedId !== wordId) {
      setDragOverId(wordId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIndex = existingWords.findIndex(w => w.id === draggedId)
    const targetIndex = existingWords.findIndex(w => w.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      return
    }

    const newWords = [...existingWords]
    const [removed] = newWords.splice(draggedIndex, 1)
    newWords.splice(targetIndex, 0, removed)

    // If default is enabled (topmost word was default), set the new topmost word as default
    const wasDefaultEnabled = existingWords.length > 0 && existingWords[0]?.isDefault
    if (wasDefaultEnabled) {
      newWords.forEach((word, index) => {
        word.isDefault = index === 0
      })
    }

    onReorderWords(newWords)
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div
      ref={dropdownRef}
      className="alternate-word-dropdown"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <div className="alternate-word-dropdown-header">
        <div className="alternate-word-dropdown-input-wrapper">
          <input
            type="text"
            className="alternate-word-dropdown-input"
            placeholder="Field Settings"
            value="Field Settings"
            readOnly
          />
          <div className="alternate-word-dropdown-arrow">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="alternate-word-dropdown-content">
        <div className="alternate-word-add-section">
          <div className="alternate-word-add-input-wrapper">
            <input
              type="text"
              className="alternate-word-add-input"
              placeholder="Add an alternative word"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="alternate-word-add-button"
              onClick={handleAddWord}
              aria-label="Add word"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="#1132ee" strokeWidth="1.5"/>
                <path d="M10 6V14M6 10H14" stroke="#1132ee" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          <div className="alternate-word-default-section">
            <span className="alternate-word-default-label">Enable default word</span>
            <Switch
              checked={isDefaultEnabled}
              onChange={handleEnableDefaultChange}
            />
            <div className="alternate-word-info-wrapper" ref={tooltipRef}>
              <button 
                ref={infoButtonRef}
                className="alternate-word-info-button" 
                aria-label="Info"
                onMouseEnter={() => {
                  if (infoButtonRef.current) {
                    const rect = infoButtonRef.current.getBoundingClientRect()
                    setTooltipPosition({
                      top: rect.top + window.scrollY - 8,
                      left: rect.left + window.scrollX + rect.width / 2
                    })
                  }
                  setShowTooltip(true)
                }}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => {
                  if (infoButtonRef.current) {
                    const rect = infoButtonRef.current.getBoundingClientRect()
                    setTooltipPosition({
                      top: rect.top + window.scrollY - 8,
                      left: rect.left + window.scrollX + rect.width / 2
                    })
                  }
                  setShowTooltip(!showTooltip)
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13.3333V10M10 6.66667H10.0083" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {showTooltip && tooltipPosition && (
              <div 
                className="alternate-word-tooltip"
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="alternate-word-tooltip-arrow"></div>
                <div className="alternate-word-tooltip-content">
                  <p className="alternate-word-tooltip-text">
                    When enabled, the topmost word in the list will be set as the default word. 
                    Reordering words will automatically update the default to the new topmost word.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="alternate-word-divider"></div>

        <div className="alternate-word-list">
          {existingWords.map((word) => (
            <div 
              key={word.id} 
              className={`alternate-word-item ${draggedId === word.id ? 'alternate-word-item-dragging' : ''} ${dragOverId === word.id ? 'alternate-word-item-drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, word.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, word.id)}
            >
              <span className="alternate-word-text">{word.word}</span>
              {word.isDefault && (
                <span className="alternate-word-default-badge">Set as default</span>
              )}
              <button
                className="alternate-word-item-delete"
                onClick={() => onDeleteWord(word.id)}
                aria-label={`Delete ${word.word}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 5H17.5M15.8333 5V16.6667C15.8333 17.1269 15.4602 17.5 15 17.5H5C4.53976 17.5 4.16667 17.1269 4.16667 16.6667V5M6.66667 5V3.33333C6.66667 2.8731 7.03976 2.5 7.5 2.5H12.5C12.9602 2.5 13.3333 2.8731 13.3333 3.33333V5" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="alternate-word-item-drag" 
                aria-label="Drag"
                draggable
                onDragStart={(e) => handleDragStart(e, word.id)}
                onDragEnd={handleDragEnd}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 5H12.5M7.5 10H12.5M7.5 15H12.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AlternateWordDropdown

