import { BrowserRouter, Routes, Route } from "react-router";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ManageDemand from "./pages/ManageDemand";
import ManageService from "./pages/ManageService";
import ServiceDetail from "./pages/ServiceDetail";
import DemandDetail from "./pages/DemandDetail";
import ServicePostEditor from "./pages/post/ServicePostEditor";
import DemandPostEditor from "./pages/post/DemandPostEditor";
import AuthLayout from "./layouts/ProtectedLayout";
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd';
import './index.css'

// Orange theme configuration
const theme = {
  token: {
    colorPrimary: '#f5770b',
    colorLinkHover: '#d45e00',
    colorLink: '#f5770b',
    colorPrimaryBg: '#fff9f0',
    colorBgContainer: '#ffffff',
    colorBorderSecondary: '#ffd8a8',
    colorPrimaryBorder: '#ff8a24',
    colorPrimaryHover: '#d45e00',
    colorPrimaryActive: '#d45e00',
    colorPrimaryText: '#f5770b',
    colorPrimaryTextHover: '#d45e00',
    colorPrimaryTextActive: '#d45e00',
  },
};

createRoot(document.getElementById('root')).render(
  <ConfigProvider theme={theme}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/manage-demand" element={<ManageDemand />} />
          <Route path="/manage-service" element={<ManageService />} />
          <Route path="/manage-service/:id" element={<ServiceDetail />} />
          <Route path="/manage-demand/:id" element={<DemandDetail />} />
          <Route path="/manage-service/:id/post" element={<ServicePostEditor />} />
          <Route path="/manage-demand/:id/post" element={<DemandPostEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
)
