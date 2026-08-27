import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Home />
      </main>
      <ToastContainer 
        position="top-right" 
        autoClose={1500} 
        hideProgressBar={false} 
        closeOnClick 
        pauseOnHover 
        style={{ marginTop: '80px' }} 
      />
    </div>
  );
}
