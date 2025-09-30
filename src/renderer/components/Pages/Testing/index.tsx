import { text } from "stream/consumers";

export default function TestingPage() {
  const handleTestClick = async () => {
    const result = await window.electronAPI.cuaActions({
      action: "double_click",
      params: {
        text: "Hello, World!",
      },
    });
    console.log("CUA Actions Result:", result);
  };
  return (
    <div style={{ margin: "auto" }}>
      <button onClick={handleTestClick}>test simulation</button>
    </div>
  );
}
