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
import Blender from "./components/Blender/modules/Blender";
import Header from "./components/Common/modules/Header";
function App() {
  return (
    <Router>
      <div className="flex h-screen w-screen bg-black selection:text-black selection:bg-azul overflow-auto">
        <div className="flex min-w-[1028px] min-h-[768px] w-full h-full">
          <Sidebar />
          <div className="relative w-full h-full flex flex-col p-2 sm:p-4 md:p-8 gap-4">
            <div className="flex-shrink-0">
              <Header />
            </div>
            <div className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Format />} />
                <Route path="/Layer" element={<Layer />} />
                <Route
                  path="/Synth"
                  element={
                    <ProjectGuard>
                      <Synth />
                    </ProjectGuard>
                  }
                />
                <Route
                  path="/Composite"
                  element={
                    <ProjectGuard>
                      <Composite />
                    </ProjectGuard>
                  }
                />
                <Route
                  path="/Fulfill"
                  element={
                    <ProjectGuard>
                      <Fulfillment />
                    </ProjectGuard>
                  }
                />
                <Route
                  path="/Blender"
                  element={
                    <ProjectGuard>
                      <Blender />
                    </ProjectGuard>
                  }
                />
                <Route
                  path="/Sell"
                  element={
                    <ProjectGuard>
                      <Sell />
                    </ProjectGuard>
                  }
                />
                <Route path="/About" element={<About />} />
                <Route path="/Activity" element={<Activity />} />
                <Route
                  path="/Pattern"
                  element={
                    <ProjectGuard>
                      <Pattern />
                    </ProjectGuard>
                  }
                />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}
export default App;
