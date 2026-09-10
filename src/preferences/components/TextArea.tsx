import { useState, useEffect } from 'react'
import './TextArea.css'

interface TextAreaProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  maxLength?: number
}

function TextArea({ placeholder, value, onChange, maxLength }: TextAreaProps) {
  const [characterCount, setCharacterCount] = useState(0)

  useEffect(() => {
    setCharacterCount(value.length)
  }, [value])

  return (
    <div className="text-area">
      <div className="text-area-container">
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          className="text-area-element"
        />
        {maxLength && (
          <div className="text-area-character-count">
            {characterCount}
          </div>
        )}
      </div>
    </div>
  )
}

export default TextArea

