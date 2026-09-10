import './Switch.css'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

function Switch({ checked, onChange }: SwitchProps) {
  return (
    <div 
      className={`switch ${checked ? 'switch-checked' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <div className="switch-handle" />
    </div>
  )
}

export default Switch

