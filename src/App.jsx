import { Suspense, lazy, useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PageBoundary, { PageLoader } from './components/PageBoundary.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Documents = lazy(() => import('./pages/Documents.jsx'))
const CreateInvoice = lazy(() => import('./pages/CreateInvoice.jsx'))
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail.jsx'))
const ExportPdf = lazy(() => import('./pages/ExportPdf.jsx'))
const Clients = lazy(() => import('./pages/Clients.jsx'))
const MasterServices = lazy(() => import('./pages/MasterServices.jsx'))
const MasterItems = lazy(() => import('./pages/MasterItems.jsx'))
const TemplateSettings = lazy(() => import('./pages/TemplateSettings.jsx'))
const SignatureSettings = lazy(() => import('./pages/SignatureSettings.jsx'))

export default function App() {
  const scrollRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app-frame">
      <div ref={scrollRef} id="app-scroll" className="app-scroll">
        <PageBoundary resetKey={pathname}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/lupa-kata-sandi" element={<ForgotPassword />} />
              <Route path="/verifikasi-otp" element={<VerifyOtp />} />
              <Route path="/dokumen" element={<Documents />} />
              <Route path="/invoice/baru" element={<CreateInvoice />} />
              <Route path="/invoice/:id" element={<InvoiceDetail />} />
              <Route path="/invoice/:id/edit" element={<CreateInvoice />} />
              <Route path="/invoice/:id/pdf" element={<ExportPdf />} />
              <Route path="/klien" element={<Clients />} />
              <Route path="/master/jasa" element={<MasterServices />} />
              <Route path="/master/item" element={<MasterItems />} />
              <Route path="/pengaturan" element={<Navigate to="/pengaturan/tanda-tangan" replace />} />
              <Route path="/pengaturan/template" element={<TemplateSettings />} />
              <Route path="/pengaturan/tanda-tangan" element={<SignatureSettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PageBoundary>
      </div>
    </div>
  )
}
