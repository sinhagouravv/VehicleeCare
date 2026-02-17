import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-white">
        <h1 className="text-4xl font-bold text-green-500 mb-4">VehicleeCare Admin</h1>
        <p className="text-gray-300">Admin Dashboard System</p>
        <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
          Login
        </button>
      </div>
    </div>
  )
}

export default App
