import { useMemo, useState } from 'react';

const initialTranscript = 'Show me the channels with the strongest recommendation opportunities.';

function VoiceResponseComposer() {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [draft, setDraft] = useState(initialTranscript);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [turns, setTurns] = useState([]);

  const status = useMemo(() => {
    if (isEditing) return 'Paused while you edit the transcription';
    if (isSpeaking) return 'Listening to your response';
    return 'Ready to submit the next turn';
  }, [isEditing, isSpeaking]);

  const handleStopTalking = () => {
    setIsSpeaking(false);
  };

  const handleStartEditing = () => {
    setDraft(transcript);
    setIsEditing(true);
    setIsSpeaking(false);
  };

  const handleCancelEdit = () => {
    setDraft(transcript);
    setIsEditing(false);
  };

  const handleSubmit = () => {
    const cleanedDraft = draft.trim();
    if (!cleanedDraft) return;

    setTranscript(cleanedDraft);
    setTurns(currentTurns => [
      ...currentTurns,
      {
        id: `${Date.now()}-${currentTurns.length}`,
        text: cleanedDraft,
      },
    ]);
    setDraft(cleanedDraft);
    setIsEditing(false);
    setIsSpeaking(true);
  };

  return (
    <section className="box" aria-labelledby="voice-response-heading">
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <div>
            <p className="heading mb-1">Voice agent</p>
            <h2 id="voice-response-heading" className="subtitle mb-0">
              Review spoken response
            </h2>
          </div>
        </div>
        <div className="level-right">
          <span className={`tag ${isEditing ? 'is-warning' : 'is-success'}`}>{status}</span>
        </div>
      </div>

      <p className="has-text-grey mb-3">
        The pencil edit button lets you correct the speech-to-text transcription before submitting. The interaction pauses while edits are open and resumes on the next turn after submit.
      </p>

      <div className="field">
        <label className="label" htmlFor="voice-transcript">
          Speech-to-text transcription
        </label>
        {isEditing ? (
          <textarea
            id="voice-transcript"
            className="textarea"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            rows="3"
            autoFocus
          />
        ) : (
          <div id="voice-transcript" className="notification is-light mb-0" aria-live="polite">
            {transcript}
          </div>
        )}
      </div>

      <div className="buttons">
        <button className="button is-danger is-light" type="button" onClick={handleStopTalking} disabled={!isSpeaking || isEditing}>
          Stop talking
        </button>
        <button className="button is-info is-light" type="button" onClick={handleStartEditing} disabled={isEditing} aria-label="Edit transcribed response">
          <span aria-hidden="true">✏️</span>
          <span>Edit</span>
        </button>
        {isEditing && (
          <>
            <button className="button is-success" type="button" onClick={handleSubmit} disabled={!draft.trim()}>
              Submit edited response
            </button>
            <button className="button is-light" type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          </>
        )}
      </div>

      {turns.length > 0 && (
        <div className="content mt-4">
          <p className="has-text-weight-semibold mb-2">Submitted turns</p>
          <ol>
            {turns.map(turn => (
              <li key={turn.id}>{turn.text}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

export default VoiceResponseComposer;
