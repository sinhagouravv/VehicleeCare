import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f9ff] text-[#011023] p-6">
      <h1 className="text-4xl font-black tracking-tight mb-4 text-[#052558]">Restaurants Store</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e6f0fa] flex flex-col items-center">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors mb-4"
        >
          Count is {count}
        </button>
        <p className="text-sm text-gray-500 font-medium">
          Edit <code className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-xs">src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App
