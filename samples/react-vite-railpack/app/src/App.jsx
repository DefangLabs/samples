import { useState } from 'react'
import Header from './components/Header'
import defangLogo from '/defang.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://defang.io" target="_blank">
          <img src={defangLogo} className="logo" alt="Defang logo" />
        </a>
      </div>
      <Header title="Defang x React"/>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Times clicked: {count}
        </button>
        <p>
          Did you know that we have many <a href="https://defang.io/samples/">samples</a> for you to check out?
        </p>
      </div>
    </>
  )
}

export default App
