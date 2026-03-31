import { useMemo, useState } from "react";
import { ConduktProvider } from "@condukt/react";
import { createDemoEngine } from "./engine";
import { ToastContainer } from "./components/Toast";
import { StatePanel } from "./components/StatePanel";
import { SaveDemo } from "./demos/SaveDemo";
import { FormDemo } from "./demos/FormDemo";
import { TableDemo } from "./demos/TableDemo";
import { ErrorDemo } from "./demos/ErrorDemo";

// ── Navigation items ────────────────────────────
interface NavItem {
  id: string;
  label: string;
  icon: string;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "Save", label: "Save Flow", icon: "\u25b6", section: "Scenarios" },
  { id: "Form", label: "Form Validation", icon: "\u25c7", section: "Scenarios" },
  { id: "Table", label: "Table & Detail", icon: "\u25a4", section: "Scenarios" },
  { id: "Error", label: "Error & Cross-Flow", icon: "\u26a0", section: "Scenarios" },
];

const PAGE_MAP: Record<string, React.ComponentType> = {
  Save: SaveDemo,
  Form: FormDemo,
  Table: TableDemo,
  Error: ErrorDemo,
};

// ── Navigation ──────────────────────────────────
function Navigation({ current, onNavigate }: { current: string; onNavigate: (id: string) => void }) {
  const sections = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <nav className="demo-nav">
      {Object.entries(sections).map(([section, items]) => (
        <div key={section} className="demo-nav__section">
          <div className="demo-nav__section-title">{section}</div>
          {items.map((item) => (
            <button
              key={item.id}
              className={`demo-nav__item ${current === item.id ? "demo-nav__item--active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="demo-nav__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

// ── Header ──────────────────────────────────────
function Header() {
  return (
    <header className="demo-header">
      <span className="demo-header__title">Condukt</span>
      <span className="demo-header__version">MVP</span>
      <span className="demo-header__separator" />
      <div className="demo-header__status">
        <span>Event-driven UI orchestration runtime</span>
      </div>
    </header>
  );
}

// ── App ─────────────────────────────────────────
export default function App() {
  const engine = useMemo(() => createDemoEngine(), []);
  const [currentPage, setCurrentPage] = useState("Save");

  const PageComponent = PAGE_MAP[currentPage] ?? SaveDemo;

  return (
    <ConduktProvider engine={engine}>
      <div className="demo-layout">
        <Header />
        <Navigation current={currentPage} onNavigate={setCurrentPage} />
        <main className="demo-content">
          <PageComponent />
        </main>
        <StatePanel />
        <ToastContainer />
      </div>
    </ConduktProvider>
  );
}
