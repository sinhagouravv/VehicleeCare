import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">VehicleeCare Frontend</h1>
        <p className="text-gray-700">Welcome to your vehicle service application.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Get Started
        </button>
      </div>
    </div>
  )
}

export default App
