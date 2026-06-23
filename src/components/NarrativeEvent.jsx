export default function NarrativeEvent({ event, onChoice }) {
  if (!event) return null

  return (
    <div className="cmap-event-overlay">
      <div className="cmap-event narrative-event" onClick={e => e.stopPropagation()}>
        <h3 className="cmap-event-title">{event.title}</h3>
        <p className="narrative-text">{event.text}</p>
        <div className="narrative-choices">
          {event.choices.map((choice, i) => (
            <button
              key={i}
              className="narrative-choice"
              onClick={() => onChoice(event, choice)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
