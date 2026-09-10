import { useState, useEffect, useRef } from 'react'
import AlternateWordDropdown from './AlternateWordDropdown'
import './TextSnippetComponent.css'

interface TextSnippetData {
  html: string
  alternateWordDropdowns: Array<{
    id: string
    words: AlternateWord[]
    position?: { top: number; left: number } | null
  }>
}

interface TextSnippetComponentProps {
  onRemove?: () => void
  onContentChange?: (content: string) => void
  onDataChange?: (data: TextSnippetData) => void
  initialContent?: string
  initialData?: TextSnippetData
}

interface AlternateWord {
  id: string
  word: string
  isDefault: boolean
}

interface AlternateWordDropdownData {
  id: string
  words: AlternateWord[]
  position: { top: number; left: number } | null
}

function TextSnippetComponent({ onRemove, onContentChange, onDataChange, initialContent, initialData }: TextSnippetComponentProps) {
  const [alternateWordDropdowns, setAlternateWordDropdowns] = useState<AlternateWordDropdownData[]>([])
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Track the last initialData to prevent unnecessary resets
  const lastInitialDataRef = useRef<string | undefined>(undefined)

  // The input listener is attached once, so it reads the fields from here rather than
  // from a closure that would still hold the empty list captured on mount.
  const dropdownsRef = useRef<AlternateWordDropdownData[]>(alternateWordDropdowns)
  dropdownsRef.current = alternateWordDropdowns

  // Set initial content when provided (only when initialData/initialContent actually changes)
  useEffect(() => {
    const currentInitialDataKey = initialData?.html || initialContent || undefined
    
    // Only initialize if this is a new initialData value
    if (currentInitialDataKey && currentInitialDataKey !== lastInitialDataRef.current && editorRef.current) {
      // Typing sends the editor's own markup up to the parent, which hands it straight
      // back as a prop. Rewriting the DOM with content it already has would collapse the
      // selection to the start of the field, so treat that round trip as a no-op.
      if (
        currentInitialDataKey === editorRef.current.innerHTML ||
        currentInitialDataKey === editorRef.current.innerText ||
        currentInitialDataKey === editorRef.current.textContent
      ) {
        lastInitialDataRef.current = currentInitialDataKey
        return
      }

      if (initialData && initialData.html) {
        // Restore HTML content and magic word dropdowns
        editorRef.current.innerHTML = initialData.html
        // Restore magic word dropdowns state
        if (initialData.alternateWordDropdowns && initialData.alternateWordDropdowns.length > 0) {
          // Map to ensure position is set (null if undefined) to match AlternateWordDropdownData type
          setAlternateWordDropdowns(initialData.alternateWordDropdowns.map(d => ({
            id: d.id,
            words: d.words,
            position: d.position !== undefined ? d.position : null
          })))
        }
        // Reattach click handlers to placeholders
        setTimeout(() => {
          if (editorRef.current) {
            const placeholders = editorRef.current.querySelectorAll('[data-dropdown-id]')
            placeholders.forEach((placeholder) => {
              const dropdownId = placeholder.getAttribute('data-dropdown-id')
              if (dropdownId) {
                (placeholder as HTMLElement).onclick = (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const rect = placeholder.getBoundingClientRect()
                  setAlternateWordDropdowns(prev => prev.map(d => 
                    d.id === dropdownId 
                      ? { 
                          ...d, 
                          position: { 
                            top: rect.bottom + window.scrollY, 
                            left: rect.left + window.scrollX 
                          } 
                        }
                      : d
                  ))
                  setActiveDropdownId(dropdownId)
                }
              }
            })
          }
        }, 0)
        lastInitialDataRef.current = currentInitialDataKey
      } else if (initialContent !== undefined) {
        // Fallback to text content for backward compatibility
        editorRef.current.textContent = initialContent
        lastInitialDataRef.current = currentInitialDataKey
      }
    } else if (currentInitialDataKey === undefined && lastInitialDataRef.current !== undefined && editorRef.current) {
      // Reset when both are removed
      editorRef.current.innerHTML = ''
      setAlternateWordDropdowns([])
      lastInitialDataRef.current = undefined
    }
  }, [initialContent, initialData])

  // Update content when editor changes
  useEffect(() => {
    if (editorRef.current && (onContentChange || onDataChange)) {
      const updateContent = () => {
        if (editorRef.current) {
          const html = editorRef.current.innerHTML || ''
          const text = editorRef.current.innerText || ''
          
          // Update text content for backward compatibility
          if (onContentChange) {
            onContentChange(text)
          }
          
          // Update full data including HTML and magic words
          if (onDataChange) {
            // Use current alternateWordDropdowns from state, excluding position for saved data
            onDataChange({
              html,
              alternateWordDropdowns: dropdownsRef.current.map(({ position, ...rest }) => rest)
            })
          }
        }
      }
      
      const editor = editorRef.current
      editor.addEventListener('input', updateContent)
      editor.addEventListener('paste', updateContent)
      
      return () => {
        editor.removeEventListener('input', updateContent)
        editor.removeEventListener('paste', updateContent)
      }
    }
  }, [onContentChange, onDataChange])

  // Update data when alternateWordDropdowns changes
  useEffect(() => {
    if (editorRef.current && onDataChange) {
      const html = editorRef.current.innerHTML || ''
      // Exclude position from saved data as it's UI state
      onDataChange({
        html,
        alternateWordDropdowns: alternateWordDropdowns.map(({ position, ...rest }) => rest)
      })
    }
  }, [alternateWordDropdowns, onDataChange])

  // Update placeholder text when default word changes
  useEffect(() => {
    alternateWordDropdowns.forEach(dropdown => {
      const defaultWord = dropdown.words.find(w => w.isDefault)
      const placeholder = editorRef.current?.querySelector(`[data-dropdown-id="${dropdown.id}"]`) as HTMLElement
      
      if (placeholder) {
        if (defaultWord) {
          placeholder.textContent = defaultWord.word
        } else {
          placeholder.textContent = 'Field'
        }
      }
    })
  }, [alternateWordDropdowns])

  const handleAddAlternateWordDropdown = () => {
    const dropdownId = Date.now().toString()
    const newDropdown: AlternateWordDropdownData = {
      id: dropdownId,
      words: [],
      position: null
    }
    setAlternateWordDropdowns(prev => [...prev, newDropdown])
    
    // Insert dropdown element in editor
    if (editorRef.current) {
      editorRef.current.focus()
      
      setTimeout(() => {
        const selection = window.getSelection()
        let range: Range | null = null
        
        // Check if selection is within the editor
        if (selection && selection.rangeCount > 0) {
          const currentRange = selection.getRangeAt(0)
          if (editorRef.current?.contains(currentRange.commonAncestorContainer)) {
            range = currentRange
          }
        }
        
        // If no valid range in editor, create one at the end
        if (!range && editorRef.current) {
          range = document.createRange()
          range.selectNodeContents(editorRef.current)
          range.collapse(false) // Collapse to end
          
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
        
        if (range) {
          const dropdownSpan = document.createElement('span')
          dropdownSpan.className = 'alternate-word-dropdown-placeholder'
          dropdownSpan.setAttribute('data-dropdown-id', dropdownId)
          dropdownSpan.textContent = 'Field'
          dropdownSpan.contentEditable = 'false'
          dropdownSpan.style.display = 'inline-block'
          dropdownSpan.style.padding = '2px 8px'
          dropdownSpan.style.margin = '0 2px'
          dropdownSpan.style.backgroundColor = '#f0f0f0'
          dropdownSpan.style.border = '1px dashed #ccc'
          dropdownSpan.style.borderRadius = '4px'
          dropdownSpan.style.cursor = 'pointer'
          dropdownSpan.onclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            const rect = dropdownSpan.getBoundingClientRect()
            setAlternateWordDropdowns(prev => prev.map(d => 
              d.id === dropdownId 
                ? { 
                    ...d, 
                    position: { 
                      top: rect.bottom + window.scrollY, 
                      left: rect.left + window.scrollX 
                    } 
                  }
                : d
            ))
            setActiveDropdownId(dropdownId)
          }
          
          range.insertNode(dropdownSpan)
          range.setStartAfter(dropdownSpan)
          range.collapse(true)
          
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
      }, 10)
    }
  }

  const handleAddAlternateWord = (dropdownId: string, word: string, isDefault: boolean) => {
    setAlternateWordDropdowns(prev => prev.map(d => {
      if (d.id === dropdownId) {
        const newWord = { id: Date.now().toString(), word, isDefault: false }
        let updatedWords: AlternateWord[]
        
        if (isDefault) {
          updatedWords = d.words.map(w => ({ ...w, isDefault: false }))
          updatedWords.unshift({ ...newWord, isDefault: true })
        } else {
          updatedWords = [...d.words, newWord]
        }
        return { ...d, words: updatedWords }
      }
      return d
    }))
  }

  const handleUpdateSingleAlternateWord = (dropdownId: string, wordId: string, updatedWord: string, updatedIsDefault: boolean) => {
    setAlternateWordDropdowns(prev => prev.map(d => {
      if (d.id === dropdownId) {
        let newWords = d.words.map(w => {
          if (w.id === wordId) {
            return { ...w, word: updatedWord, isDefault: updatedIsDefault }
          }
          // Unset other defaults if this one is set
          if (updatedIsDefault) {
            return { ...w, isDefault: false }
          }
          return w
        })
        return { ...d, words: newWords }
      }
      return d
    }))
  }

  const handleDeleteAlternateWord = (dropdownId: string, wordId: string) => {
    setAlternateWordDropdowns(prev => prev.map(d => 
      d.id === dropdownId ? { ...d, words: d.words.filter(w => w.id !== wordId) } : d
    ))
  }

  const handleReorderWords = (dropdownId: string, reorderedWords: AlternateWord[]) => {
    setAlternateWordDropdowns(prev => prev.map(d => 
      d.id === dropdownId ? { ...d, words: reorderedWords } : d
    ))
  }

  // Rich text editor commands
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleFormatBlock = (tag: string) => {
    executeCommand('formatBlock', tag)
  }
  return (
    <div className="text-snippet-component">
      <div className="text-snippet-header">
        <div className="text-snippet-title-row">
          <h3 className="text-snippet-title">Documentation</h3>
          <button className="text-snippet-info-button" aria-label="Info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13.3333V10M10 6.66667H10.0083" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {onRemove && (
            <button 
              className="text-snippet-delete-button" 
              aria-label="Delete"
              onClick={onRemove}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 5H17.5M15.8333 5V16.6667C15.8333 17.1269 15.4602 17.5 15 17.5H5C4.53976 17.5 4.16667 17.1269 4.16667 16.6667V5M6.66667 5V3.33333C6.66667 2.8731 7.03976 2.5 7.5 2.5H12.5C12.9602 2.5 13.3333 2.8731 13.3333 3.33333V5" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="text-snippet-editor-container">
        <div className="text-snippet-toolbar">
          <div className="toolbar-left">
            <div className="toolbar-group">
              {/* Text Style/Size Dropdown - Large T overlapping small t */}
              <button 
                className="toolbar-button"
                onClick={() => handleFormatBlock('p')}
                title="Text Style"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Large T */}
                  <path d="M4 4H10M7 4V12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Small t */}
                  <path d="M11 6H13M12 6V10" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="toolbar-divider"></div>
              {/* Bold - Capital B */}
              <button 
                className="toolbar-button"
                onClick={() => executeCommand('bold')}
                title="Bold"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 4V16M5 4H9C10.1046 4 11 4.89543 11 6C11 7.10457 10.1046 8 9 8H5M5 8H9.5C10.6046 8 11.5 8.89543 11.5 10C11.5 11.1046 10.6046 12 9.5 12H5M5 12V16" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* Italic - Capital I */}
              <button 
                className="toolbar-button"
                onClick={() => executeCommand('italic')}
                title="Italic"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4H11M9 4V16" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* Underline - Capital U with line beneath */}
              <button 
                className="toolbar-button"
                onClick={() => executeCommand('underline')}
                title="Underline"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 4V9C5 11.2091 6.79086 13 9 13C11.2091 13 13 11.2091 13 9V4" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 16H15" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {/* Strikethrough - Capital S with line through */}
              <button 
                className="toolbar-button"
                onClick={() => executeCommand('strikeThrough')}
                title="Strikethrough"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 6C5 5 5.89543 4 7 4H9C10.1046 4 11 5 11 6C11 7 10.1046 8 9 8H5M5 12C5 13 5.89543 14 7 14H9C10.1046 14 11 13 11 12C11 11 10.1046 10 9 10H5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H15" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="toolbar-divider"></div>
              {/* Alignment Dropdown - Four lines of varying lengths, left-aligned */}
              <button 
                className="toolbar-button"
                onClick={() => executeCommand('justifyLeft')}
                title="Text Alignment"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5H15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 8H12" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 11H14" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 14H10" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* Numbered List - 1, 2, 3 stacked with lines */}
              <button 
                className="toolbar-button"
                onClick={() => executeCommand('insertOrderedList')}
                title="Numbered List"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7.5H4.5M6 7.5H15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 11.5H4.5M6 11.5H15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 15.5H4.5M6 15.5H15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  {/* Number 1 */}
                  <path d="M3.5 5.5L3.5 7.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3.5 5.5L4.5 6.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  {/* Number 2 */}
                  <path d="M3.5 9.5L4.5 9.5L4.5 10.5L3.5 11.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Number 3 */}
                  <path d="M3.5 13.5L4.5 13.5M3.5 15.5L4.5 15.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3.5 14.5L4.5 14.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {/* Bulleted List - Three circles stacked with lines */}
              <button 
                className="toolbar-button"
                onClick={() => executeCommand('insertUnorderedList')}
                title="Bulleted List"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="4" cy="7.5" r="1.5" fill="#666"/>
                  <path d="M8 7.5H15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="4" cy="11.5" r="1.5" fill="#666"/>
                  <path d="M8 11.5H15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="4" cy="15.5" r="1.5" fill="#666"/>
                  <path d="M8 15.5H15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="toolbar-divider"></div>
              {/* Text Color - Capital A with thick line beneath */}
              <button 
                className="toolbar-button"
                onClick={() => {
                  const color = prompt('Enter color (e.g., #000000 or red):', '#000000')
                  if (color) executeCommand('foreColor', color)
                }}
                title="Text Color"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 16L8 4H12L15 16M6.5 12H13.5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 18H17" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* Highlight Color - Paint bucket with drop on line */}
              <button 
                className="toolbar-button"
                onClick={() => {
                  const color = prompt('Enter highlight color (e.g., #FFFF00 or yellow):', '#FFFF00')
                  if (color) executeCommand('backColor', color)
                }}
                title="Highlight Color"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Paint bucket */}
                  <path d="M8 4L12 8L8 12L4 8L8 4Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Drop */}
                  <path d="M8 4V2" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="2" r="1" fill="#666"/>
                  {/* Line beneath */}
                  <path d="M3 16H13" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="toolbar-right">
            <button 
              className="add-word-alternative-button"
              onClick={handleAddAlternateWordDropdown}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 2.91667V11.0833M2.91667 7H11.0833" stroke="#1132ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Field</span>
            </button>
          </div>
        </div>
        <div className="text-snippet-editor" style={{ position: 'relative' }}>
          <div
            ref={editorRef}
            className="text-snippet-textarea"
            contentEditable={true}
            suppressContentEditableWarning={true}
            data-placeholder="Add the text you would like to populate when the phrase or trigger word is used."
          />
          {activeDropdownId && (() => {
            const dropdown = alternateWordDropdowns.find(d => d.id === activeDropdownId)
            return dropdown && dropdown.position ? (
              <AlternateWordDropdown
                position={dropdown.position}
                onClose={() => setActiveDropdownId(null)}
                onAddWord={(word, isDefault) => handleAddAlternateWord(activeDropdownId, word, isDefault)}
                existingWords={dropdown.words}
                onUpdateWord={(id, word, isDefault) => handleUpdateSingleAlternateWord(activeDropdownId, id, word, isDefault)}
                onDeleteWord={(id) => handleDeleteAlternateWord(activeDropdownId, id)}
                onReorderWords={(reorderedWords) => handleReorderWords(activeDropdownId, reorderedWords)}
              />
            ) : null
          })()}
        </div>
      </div>
    </div>
  )
}

export default TextSnippetComponent

