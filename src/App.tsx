import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ArchivePage } from './pages/ArchivePage'
import { DiaryPage } from './pages/DiaryPage'
import { HomePage } from './pages/HomePage'
import { NoteDetailPage } from './pages/NoteDetailPage'
import { NotesPage } from './pages/NotesPage'
import { SettingsPage } from './pages/SettingsPage'
import { WritePage } from './pages/WritePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/notes/:id" element={<NoteDetailPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
