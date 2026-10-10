 
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAPI() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/health"
        );

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error("Backend connection error:", error);
        setMessage("Unable to connect to the backend.");
      } finally {
        setLoading(false);
      }
    }

    checkAPI();
  }, []);

  return (
    <main style={{ fontFamily: "Arial", padding: "40px" }}>
      <h1>TaskFlow</h1>
      <p>Your project management workspace.</p>

      <h2>Backend Connection</h2>
      <p>{loading ? "Checking..." : message}</p>
    </main>
  );
}

export default App;
