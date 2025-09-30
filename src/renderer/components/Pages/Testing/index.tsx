export default function TestingPage() {
  const handleTestClick = async () => {
    const result = await window.electronAPI.cuaActions({
      action: "right_click",
      params: {},
    });
    console.log("CUA Actions Result:", result);
  };
  return (
    <div style={{ margin: "auto" }}>
      <button onClick={handleTestClick}>test simulation</button>
    </div>
  );
}
