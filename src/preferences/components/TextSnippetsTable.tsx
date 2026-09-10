import './TextSnippetsTable.css'
import type { SnippetOrder } from '../data/snippetOrders'
import type { OrderDiagnosisMap, ProcedureCodeConfig, SnippetServiceGroup, SnippetServiceRow } from '../data/snippetServices'
import type { SnippetConfigItemType } from '../utils/snippetDraft'

export type { ProcedureCodeConfig, SnippetOrder, SnippetServiceGroup, SnippetServiceRow, OrderDiagnosisMap }

export interface TableRow {
  id: string
  phrase: string
  procedureDoc: string
  users: string
  section: string
  groupName: string
  appointmentType: string
  useForEHRScribe: boolean
  diagnosisCodes?: string[]
  manualDiagnosisCodes?: string[]
  orderDiagnosisCodes?: OrderDiagnosisMap
  orderSelections?: string[]
  snippetOrders?: SnippetOrder[]
  procedureCodeConfig?: ProcedureCodeConfig[]
  snippetServiceGroups?: SnippetServiceGroup[]
  configItemTypes?: SnippetConfigItemType[]
  textSnippetData?: {
    html: string
    alternateWordDropdowns: Array<{
      id: string
      words: Array<{
        id: string
        word: string
        isDefault: boolean
      }>
      position?: { top: number; left: number } | null
    }>
  }
}

interface TextSnippetsTableProps {
  onAddClick: () => void
  rows: TableRow[]
  onRowsChange: (rows: TableRow[]) => void
  onEdit?: (rowId: string) => void
  onDuplicate?: (rowId: string) => void
  onDelete?: (rowId: string) => void
}

function TextSnippetsTable({ onAddClick, rows, onEdit, onDuplicate, onDelete }: TextSnippetsTableProps) {
  return (
    <div className="text-snippets-page">
      <div className="page-header">
        <h1 className="page-title">Text Snippets</h1>
        <div className="page-header-actions">
          <div className="search-container">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14L11.1 11.1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input type="text" placeholder="Search" className="search-input" />
            <button className="search-clear-btn" aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <button className="add-text-snippet-button" onClick={onAddClick}>
            + Add Text Snippet
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="text-snippets-table">
          <thead>
            <tr className="table-header-row">
              <th className="table-header-cell col-phrase">Phrase/Trigger</th>
              <th className="table-header-cell col-doc">Documentation</th>
              <th className="table-header-cell col-section">Note Section</th>
              <th className="table-header-cell col-group">Group Name</th>
              <th className="table-header-cell col-appt">Appointment Type</th>
              <th className="table-header-cell col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="table-row">
                <td className="table-cell col-phrase">
                  <span className="cell-truncate">{row.phrase}</span>
                </td>
                <td className="table-cell col-doc">
                  <div
                    className="procedure-doc-link"
                    dangerouslySetInnerHTML={{
                      __html: row.textSnippetData?.html || row.procedureDoc
                    }}
                  />
                </td>
                <td className="table-cell col-section">
                  <span className="cell-truncate">{row.section}</span>
                </td>
                <td className="table-cell col-group">
                  <span className="cell-truncate">{row.groupName}</span>
                </td>
                <td className="table-cell col-appt">
                  <span className="cell-truncate">{row.appointmentType}</span>
                </td>
                <td className="table-cell col-actions table-cell-actions">
                  <div className="action-icons">
                    <button
                      className="icon-button"
                      aria-label="Edit"
                      onClick={() => onEdit && onEdit(row.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.3333 2.00004C11.5084 1.82493 11.7163 1.68605 11.9447 1.59131C12.1731 1.49658 12.4173 1.44775 12.6667 1.44775C12.916 1.44775 13.1602 1.49658 13.3886 1.59131C13.617 1.68605 13.8249 1.82493 14 2.00004C14.1751 2.17515 14.314 2.38306 14.4087 2.61146C14.5034 2.83986 14.5523 3.08407 14.5523 3.33337C14.5523 3.58268 14.5034 3.82689 14.4087 4.05529C14.314 4.28369 14.1751 4.4916 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Duplicate"
                      onClick={() => onDuplicate && onDuplicate(row.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.33334 9.33333H4.00001C3.26363 9.33333 2.66667 8.73638 2.66667 8V4C2.66667 3.26362 3.26363 2.66667 4.00001 2.66667H8.00001C8.73638 2.66667 9.33334 3.26362 9.33334 4V5.33333M12 6.66667H8.00001C7.26363 6.66667 6.66667 7.26362 6.66667 8V12C6.66667 12.7364 7.26363 13.3333 8.00001 13.3333H12C12.7364 13.3333 13.3333 12.7364 13.3333 12V8C13.3333 7.26362 12.7364 6.66667 12 6.66667Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Delete"
                      onClick={() => onDelete && onDelete(row.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2762C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2762C3.47381 14.0261 3.33334 13.687 3.33334 13.3333V4M5.33334 4V2.66667C5.33334 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33334 6.66667 1.33334H9.33334C9.68696 1.33334 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TextSnippetsTable
