import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminHome, ClientHome, Gate, Login, Recover } from './portal'
import { About, Article, Contact, Home, Insights, Legal, Missing, Services, Site } from './site'
import { PortalProvider } from './store'

export default function App() {
  return (
    <PortalProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Site />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="insights" element={<Insights />} />
            <Route path="insights/:slug" element={<Article />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Legal name="privacy" />} />
            <Route path="terms" element={<Legal name="terms" />} />
          </Route>
          <Route path="login" element={<Login />} />
          <Route path="recover" element={<Recover />} />
          <Route path="portal" element={<Gate role="client"><ClientHome /></Gate>} />
          <Route path="admin" element={<Gate role="admin"><AdminHome /></Gate>} />
          <Route path="admin/clients/:id" element={<Gate role="admin"><AdminHome /></Gate>} />
          <Route element={<Site />}>
            <Route path="*" element={<Missing />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PortalProvider>
  )
}
