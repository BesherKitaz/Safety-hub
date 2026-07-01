import { Route, Routes, BrowserRouter } from "react-router-dom";
import { Box } from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";

import GradientBox from "../components/ui/GradientBox";




const tabs = [
  { label: "Overview", path: "labs-overview" },
  { label: "Certifications", path: "certifications" },
  { label: "Activity", path: "activity" },
];

function ProfileLayout() {
  return (
    <div>
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "."}
              className={({ isActive }) =>
                `px-3 py-2 text-sm border-b-2 ${
                  isActive
                    ? "border-blue-600 text-blue-600 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}

const Labs = () => {
    return (
        <Box>
            <GradientBox>
                <h1>Labs</h1>
                <p>This is the Labs page.</p>
            </GradientBox>
        </Box>
    )
}

export default Labs;