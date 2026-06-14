import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Home from './views/Home.tsx';
import Profile from './views/ViewProfile.tsx';

import NavigationMenuComponent  from './components/NavigationMenu.js';
import Signup from './views/Signup.tsx';
import Login from './views/Login.tsx';
import EditProfile from './views/ProfileForm.jsx'


function App() {

  return (
    <BrowserRouter>
      <NavigationMenuComponent />
      <Routes> 
        <Route path="/login" element={< Login />} />
        <Route path="/signup" element={< Signup />} />
        <Route path="/" element={< Home />} />
        <Route path="/profile" element={< Profile />} />
        <Route path="/profile/edit" element={< EditProfile mode="edit" />} />
        <Route path="/profile/create" element={< EditProfile mode="create" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
