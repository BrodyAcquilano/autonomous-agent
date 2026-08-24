import "./BottomTabs.css";


function getTabClass(
  tab,
) {
  return tab
    .toLowerCase()
    .replaceAll(
      " ",
      "-",
    );
}


function BottomTabs({
  tabs,
  activeTab,
  setActiveTab,
}) {
  return (
    <nav
      className="bottom-tabs"
      aria-label="Jarvis navigation"
    >
      {tabs.map(
        (tab) => (
          <button
            key={tab}
            type="button"
            className={`bottom-tab ${getTabClass(
              tab,
            )} ${
              activeTab ===
              tab
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                tab,
              )
            }
          >
            {tab}
          </button>
        ),
      )}
    </nav>
  );
}


export default BottomTabs;