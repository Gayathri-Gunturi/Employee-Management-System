export default function Message({ type, text }) {
  if (!text) return null;
  return <div className={`message message-${type}`}>{text}</div>;
}
