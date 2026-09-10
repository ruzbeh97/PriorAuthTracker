import './TextField.css'

interface TextFieldProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function TextField({ placeholder, value, onChange }: TextFieldProps) {
  return (
    <div className="text-field">
      <div className="text-field-input">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="text-field-input-element"
        />
      </div>
    </div>
  )
}

export default TextField

