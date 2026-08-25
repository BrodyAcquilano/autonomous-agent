import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import NavigationTabs from "./Components/NavigationTabs/NavigationTabs";

import Analytics from "./Pages/Analytics/Analytics";
import Console from "./Pages/Console/Console";
import Memory from "./Pages/Memory/Memory";
import Models from "./Pages/Models/Models";
import Output from "./Pages/Output/Output";
import Resources from "./Pages/Resources/Resources";

import "./App.css";


function App() {
  return (
    <div className="app">
      <div className="app-pages">
        <Routes>
          <Route
            path="/console"
            element={
              <Console />
            }
          />

          <Route
            path="/models"
            element={
              <Models />
            }
          />

          <Route
            path="/resources"
            element={
              <Resources />
            }
          />

          <Route
            path="/memory"
            element={
              <Memory />
            }
          />

          <Route
            path="/output"
            element={
              <Output />
            }
          />

          <Route
            path="/analytics"
            element={
              <Analytics />
            }
          />

          <Route
            path="/"
            element={
              <Navigate
                to="/console"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/console"
                replace
              />
            }
          />
        </Routes>
      </div>

      <div className="app-navigation">
        <NavigationTabs />
      </div>
    </div>
  );
}


export default App;
