import { useState } from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Home from './views/Home.tsx';
import Profile from './views/Profile.tsx';

import NavigationMenuComponent  from './components/ui/NavigationMenu.jsx';
import Signup from './views/signup.tsx';
import Login from './views/login.tsx';



function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <NavigationMenuComponent />
      <Routes> 
        <Route path="/login" element={< Login />} />
        <Route path="/signup" element={< Signup />} />
        <Route path="/" element={< Home />} />
        <Route path="/profile/:id" element={< Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
