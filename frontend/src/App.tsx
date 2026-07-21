import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Home from './views/Home.tsx';
import Profile from './views/ViewProfile.tsx';


import Signup from './views/Signup.tsx';
import Login from './views/Login.tsx';
import EditProfile from './views/ProfileForm.jsx'
import AddCertification from './views/AddCertification'
import Certifications from './views/Certifications'
import AddLab from './views/AddLab'
import TrainingForm from './views/ManageLabTabs/TrainingForm.tsx'
import CertificationView from './views/CertificationView'
import CertificationHistory from './views/CertificationHistory'
import Users from './views/Users.tsx'
import Lab from  './views/Labs.tsx';
import DeactivatedLabs from './views/DeactivatedLabs.tsx';
import LabManagement from './views/LabManagement.tsx'
import ViewTraining from './views/ManageLabTabs/ViewTraining.tsx'
import EmailForm from './views/EmailForm'
import VerifyEmail from './views/VerifyEmail'
import ForgotPassword from './views/ForgotPassword'
import ResetPassword from './views/ResetPassword'
import HeaderContext from './contexts/HeaderContext.tsx';
import Layout from './Layout';

import { useState } from 'react';
import DrawerContext from './contexts/DrawerContext.ts';

type Header = {
  title: string;
  actions: React.ReactNode;
};

function App() {
  const [header, setHeader] = useState<Header>({
      title: "",
      actions: null,
  });

  const [mobileOpen, setMobileOpen] = useState(false);


  
  return (
    <HeaderContext.Provider value={{ header, setHeader }}>
      <DrawerContext.Provider value={{ mobileOpen, setMobileOpen }}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/user" element={<Profile />} />
              <Route path="/user/:id" element={<Profile />} />
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/users" element={<Users />} />
              <Route path="/lab-management" element={<Lab />} />
              <Route path="/lab-management/deactivated" element={<DeactivatedLabs />} />
    
              <Route path="/user/:id/edit" element={<EditProfile mode="edit" />} />
              <Route path="/user/create" element={<EditProfile mode="create" />} />
              <Route path="/certifications/add" element={<AddCertification />} />
              <Route path="/certifications/:certificationId/edit" element={<AddCertification />} />
              <Route path="/certifications/:id" element={<CertificationView />} />
              <Route path="/certifications/:id/history" element={<CertificationHistory />} />
              <Route path="/certifications/:id/history/:historyId" element={<CertificationHistory />} />
              <Route path="/lab-management/lab/:labId" element={<LabManagement />} />
              <Route path="/lab-management/lab/add" element={<AddLab />} />
              <Route path="/lab-management/training/add" element={<TrainingForm mode="create" />} />
              <Route path="/lab-management/lab/:labId/training/:trainingId/edit" element={<TrainingForm mode="edit" />} />
              <Route path="/lab-management/lab/:labId/training/:trainingId" element={<ViewTraining />} />
            </Route>

            <Route path="/email" element={<EmailForm />} /> 
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </BrowserRouter>
      </DrawerContext.Provider>
    </HeaderContext.Provider>
  );
}

export default App

// End of App component

