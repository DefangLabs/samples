import { useState } from 'react'
import axios from 'axios'

function App() {
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debate, setDebate] = useState(null)
  const [error, setError] = useState(null)

  const startDebate = async () => {
    if (!topic.trim()) {
      setError('Please enter a debate topic')
      return
    }

    setIsLoading(true)
    setError(null)
    setDebate(null)

    try {
      const response = await axios.post(`/debate`, {
        topic: topic.trim()
      })
      
      setDebate(response.data)
    } catch (err) {
      console.error('Debate error:', err)
      const errorMessage = err.response?.data?.detail || 
                          (err.code === 'ERR_NETWORK' ? 'Cannot connect to server. Make sure the backend is running on port 3000.' : 
                           'Failed to start debate. Please try again.')
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      startDebate()
    }
  }

  const getAgentDisplayName = (role) => {
    switch (role) {
      case 'ProAgent':
        return '🤖 Pro Agent'
      case 'ConAgent':
        return '🤖 Con Agent'
      case 'User':
        return '👤 Moderator'
      default:
        return role
    }
  }

  const getAgentClass = (role) => {
    switch (role) {
      case 'ProAgent':
        return 'pro-agent'
      case 'ConAgent':
        return 'con-agent'
      case 'User':
        return 'user-agent'
      default:
        return ''
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">AI Debate Club</h1>
        <p className="subtitle">
          Enter a debatable topic and watch two AI agents argue for and against it
        </p>
      </div>

      <div className="input-section">
        <input
          type="text"
          className="topic-input"
          placeholder="Enter a debate topic (e.g., 'Is AI dangerous?')"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <br />
        <button
          className="start-button"
          onClick={startDebate}
          disabled={isLoading || !topic.trim()}
        >
          {isLoading ? 'Starting Debate...' : 'Start Debate'}
        </button>
        
        <div className="example-topics">
          <strong>Example topics:</strong> "Should social media be regulated?", 
          "Is remote work better than office work?", "Should college be free?"
        </div>
      </div>

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>AI agents are preparing their arguments...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {debate && (
        <div className="debate-container">
          <h3>Debate: "{debate.topic}"</h3>
          {debate.messages.map((message, index) => (
            <div key={index} className="message">
              <div className="message-header">
                <span className={`message-role ${getAgentClass(message.role)}`}>
                  {getAgentDisplayName(message.role)}
                </span>
              </div>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App 
