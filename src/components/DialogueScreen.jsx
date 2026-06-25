import { useState, useEffect, useRef, useCallback } from 'react'

const TYPE_SPEED = 25

export default function DialogueScreen({ chapter, story, onAdvance, onChoice, onSetName, onStartCombat, onComplete, onQuit }) {
  const [displayedText, setDisplayedText] = useState('')
  const [lineIndex, setLineIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [choiceDescription, setChoiceDescription] = useState(null)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  const sequence = chapter.sequences[story.sequenceId]
  const block = sequence?.blocks[story.blockIndex]

  useEffect(() => {
    setDisplayedText('')
    setLineIndex(0)
    setIsTyping(false)
    setShowChoices(false)
    setChoiceDescription(null)

    if (!block) return

    if (block.type === 'branch') {
      onAdvance()
      return
    }
    if (block.type === 'setCompanion') {
      onAdvance()
      return
    }
    if (block.type === 'combat') {
      onStartCombat(block.config)
      return
    }
    if (block.type === 'choice' || block.type === 'input') {
      setShowChoices(true)
      return
    }

    startTyping()
  }, [story.sequenceId, story.blockIndex])

  const getFullText = useCallback(() => {
    if (!block) return ''
    if (block.type === 'narration') {
      return block.lines[lineIndex] || ''
    }
    if (block.type === 'dialogue') {
      let text = block.text
      text = text.replace('%PLAYER_NAME%', story.choices.playerName || '???')
      text = text.replace('%COMPANION%', story.companion?.name || '???')
      return text
    }
    return ''
  }, [block, lineIndex, story.choices.playerName, story.companion])

  const startTyping = useCallback(() => {
    const full = getFullText()
    if (!full) return
    setDisplayedText('')
    setIsTyping(true)
    let i = 0
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      i++
      setDisplayedText(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(timerRef.current)
        timerRef.current = null
        setIsTyping(false)
      }
    }, TYPE_SPEED)
  }, [getFullText])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isTyping && !showChoices && block) {
      startTyping()
    }
  }, [lineIndex])

  const handleTap = useCallback(() => {
    if (showQuitConfirm || showChoices) return

    if (isTyping) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      setDisplayedText(getFullText())
      setIsTyping(false)
      return
    }

    if (block?.type === 'narration' && lineIndex < block.lines.length - 1) {
      setLineIndex(prev => prev + 1)
      return
    }

    onAdvance()
  }, [isTyping, showChoices, showQuitConfirm, block, lineIndex, getFullText, onAdvance])

  const [choiceConfirm, setChoiceConfirm] = useState(null)

  const handleChoice = useCallback((option, index) => {
    if (choiceDescription?.index === index && choiceConfirm) {
      choiceConfirm()
      return
    }
    setChoiceDescription(option.description ? { index, text: option.description } : { index, text: null })
    setChoiceConfirm(() => () => {
      onChoice(option)
      setChoiceDescription(null)
      setChoiceConfirm(null)
    })
  }, [onChoice, choiceDescription, choiceConfirm])

  const handleNameSubmit = useCallback(() => {
    if (nameInput.trim().length > 0) {
      onSetName(nameInput.trim())
    }
  }, [nameInput, onSetName])

  if (!sequence || !block) return null

  const speakerText = block.type === 'dialogue' && block.speaker
    ? block.speaker.replace('%COMPANION%', story.companion?.name || '???')
    : null

  return (
    <div className="story-screen" onClick={handleTap} ref={containerRef}>
      <button className="story-quit-btn" onClick={(e) => { e.stopPropagation(); setShowQuitConfirm(true) }}>
        ✕
      </button>

      <div className="story-content">
        {block.type === 'dialogue' && speakerText && (
          <div className="story-speaker">
            {block.speakerEmoji && <span className="story-speaker-emoji">{block.speakerEmoji}</span>}
            <span className="story-speaker-name">{speakerText}</span>
          </div>
        )}

        {block.type === 'dialogue' && !block.speaker && (
          <div className="story-voice-indicator">✦ ✦ ✦</div>
        )}

        {(block.type === 'narration' || block.type === 'dialogue') && (
          <div className={`story-text ${block.type === 'dialogue' && !block.speaker ? 'story-text-voice' : ''} ${block.type === 'dialogue' && block.speaker ? 'story-text-dialogue' : ''}`}>
            {displayedText}
            {isTyping && <span className="story-cursor">▌</span>}
          </div>
        )}

        {!isTyping && !showChoices && block.type !== 'choice' && block.type !== 'input' && (
          <div className="story-tap-hint">Appuyer pour continuer</div>
        )}

        {showChoices && block.type === 'choice' && (
          <div className="story-choices-area">
            {block.prompt && <div className="story-choice-prompt">{block.prompt}</div>}
            <div className="story-choices">
              {block.options.map((opt, i) => (
                <button
                  key={i}
                  className={`story-choice ${choiceDescription?.index === i ? 'story-choice-selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleChoice(opt, i) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {choiceDescription && (
              <div className="story-choice-desc">
                {choiceDescription.text && <p>{choiceDescription.text}</p>}
                <button className="story-choice-continue" onClick={(e) => { e.stopPropagation(); choiceConfirm && choiceConfirm() }}>
                  Continuer ▸
                </button>
              </div>
            )}
          </div>
        )}

        {showChoices && block.type === 'input' && (
          <div className="story-choices-area" onClick={(e) => e.stopPropagation()}>
            <div className="story-choice-prompt">{block.prompt}</div>
            <input
              className="story-name-input"
              type="text"
              placeholder={block.placeholder}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 16))}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
            <button
              className="story-choice story-name-confirm"
              disabled={nameInput.trim().length === 0}
              onClick={handleNameSubmit}
            >
              Confirmer
            </button>
          </div>
        )}
      </div>

      {showQuitConfirm && (
        <div className="story-quit-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="story-quit-modal">
            <p className="story-quit-text">Quitter l'histoire ?</p>
            <p className="story-quit-sub">Ta progression sera sauvegardée.</p>
            <div className="story-quit-actions">
              <button className="story-quit-cancel" onClick={() => setShowQuitConfirm(false)}>Rester</button>
              <button className="story-quit-confirm" onClick={onQuit}>Quitter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
