import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Common/modules/Sidebar";
import ProjectGuard from "./components/Common/modules/ProjectGuard";
import Format from "./components/Format/modules/Format";
import Layer from "./components/Layer/modules/Layer";
import Synth from "./components/Synth/modules/Synth";
import Composite from "./components/Composite/modules/Composite";
import Fulfillment from "./components/Fulfillment/modules/Fulfillment";
import About from "./components/About/modules/About";
import Activity from "./components/Activity/modules/Activity";
import Sell from "./components/Sell/modules/Sell";
import Pattern from "./components/Pattern/modules/Pattern";
function App() {
  return (
    <Router>
      <div className="flex h-screen bg-black selection:text-black selection:bg-azul">
        <Sidebar />
        <div className="relative w-full h-full flex p-2 sm:p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Format />} />
            <Route path="/Layer" element={<Layer />} />
            <Route path="/Synth" element={<ProjectGuard><Synth /></ProjectGuard>} />
            <Route path="/Composite" element={<ProjectGuard><Composite /></ProjectGuard>} />
            <Route path="/Fulfillment" element={<ProjectGuard><Fulfillment /></ProjectGuard>} />
            <Route path="/Sell" element={<Sell />} />
            <Route path="/About" element={<About />} />
            <Route path="/Activity" element={<Activity />} />
            <Route path="/Pattern" element={<ProjectGuard><Pattern /></ProjectGuard>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
export default App;
