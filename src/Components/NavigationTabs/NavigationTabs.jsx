import {
  useLocation,
  useNavigate,
} from "react-router";

import "./NavigationTabs.css";


const TABS = [
  {
    label: "Console",
    path: "/console",
  },
  {
    label: "Output",
    path: "/output",
  },
  {
    label: "Analytics",
    path: "/analytics",
  },
  {
    label: "Maintenance",
    path: "/maintenance",
  },
  {
    label: "Agents",
    path: "/agents",
  },
  {
    label: "Directory",
    path: "/directory",
  },
  {
    label: "Capabilities",
    path: "/capabilities",
  },
  {
    label: "System Diagram",
    path: "/system-diagram",
  },
];


function getTabClass(
  label,
) {
  return label
    .toLowerCase()
    .replaceAll(
      " ",
      "-",
    );
}


function NavigationTabs() {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  return (
    <nav
      className="navigation-tabs"
      aria-label="Primary navigation"
    >
      {TABS.map(
        (
          tab,
        ) => (
          <button
            key={
              tab.path
            }
            type="button"
            className={`navigation-tab ${getTabClass(
              tab.label,
            )} ${
              location.pathname ===
              tab.path
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate(
                tab.path,
              )
            }
          >
            {tab.label}
          </button>
        ),
      )}
    </nav>
  );
}


export default NavigationTabs;