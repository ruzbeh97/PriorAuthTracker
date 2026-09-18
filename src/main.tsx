import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ensureSnippetsSeeded } from './preferences/utils/seedSnippets'
import { ensureUserGroupsSeeded } from './assignees'
import { ensureAuthStatesSeeded } from './authStates'

// The visit note reads snippets from storage while it renders, so seed before the
// first paint instead of waiting for the Preferences page to be opened.
ensureSnippetsSeeded()
ensureUserGroupsSeeded()
ensureAuthStatesSeeded()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
