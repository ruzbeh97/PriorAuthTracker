import { useState } from 'react'
import MultiSelectDropdown from './MultiSelectDropdown'
import { DIAGNOSIS_CODE_OPTIONS } from '../data/diagnosisOptions'
import './DiagnosisCodesComponent.css'

interface DiagnosisCodesComponentProps {
  onRemove?: () => void
  orderDiagnosisCodes?: string[]
  selectedValues?: string[]
  onChange?: (values: string[]) => void
}

export {
  parseDiagnosisOption,
  diagnosisToIcd10Options,
  buildIcd10OptionDescriptions,
  buildIcd10OptionLabels,
  findDiagnosisByIcd10,
  mergeDiagnosisCodes,
  DIAGNOSIS_CODE_OPTIONS,
} from '../data/diagnosisOptions'


function DiagnosisCodesComponent({
  onRemove,
  orderDiagnosisCodes = [],
  selectedValues,
  onChange,
}: DiagnosisCodesComponentProps) {
  const [internalValues, setInternalValues] = useState<string[]>([])
  const values = selectedValues ?? internalValues
  const handleChange = onChange ?? setInternalValues
  const additionalOptions = DIAGNOSIS_CODE_OPTIONS.filter(opt => !orderDiagnosisCodes.includes(opt))

  return (
    <div className="diagnosis-codes-component">
      <div className="diagnosis-codes-header">
        <h3 className="diagnosis-codes-title">Diagnosis Codes</h3>
        {onRemove && (
          <button 
            className="diagnosis-codes-delete-button" 
            aria-label="Delete"
            onClick={onRemove}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 5H17.5M15.8333 5V16.6667C15.8333 17.1269 15.4602 17.5 15 17.5H5C4.53976 17.5 4.16667 17.1269 4.16667 16.6667V5M6.66667 5V3.33333C6.66667 2.8731 7.03976 2.5 7.5 2.5H12.5C12.9602 2.5 13.3333 2.8731 13.3333 3.33333V5" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      
      <div className="diagnosis-codes-content">
        <div className="diagnosis-codes-field">
          <label className="diagnosis-codes-field-label">Orders &amp; Order Sets</label>
          <MultiSelectDropdown
            placeholder="No diagnosis codes from orders"
            selectedValues={orderDiagnosisCodes}
            onChange={() => {}}
            options={orderDiagnosisCodes}
            disabled
          />
        </div>
        <div className="diagnosis-codes-field">
          <label className="diagnosis-codes-field-label">Additional Diagnosis Codes</label>
          <MultiSelectDropdown
            placeholder="Select diagnosis codes"
            selectedValues={values}
            onChange={handleChange}
            options={additionalOptions}
          />
        </div>
      </div>
    </div>
  )
}

export default DiagnosisCodesComponent
