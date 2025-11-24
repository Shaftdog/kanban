import React, { createContext, useContext, useState } from 'react'

const KanbanContext = createContext(null)

export const useKanban = () => {
  const context = useContext(KanbanContext)
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider')
  }
  return context
}

export const KanbanProvider = ({ children }) => {
  const [boards, setBoards] = useState([])
  const [activeBoard, setActiveBoard] = useState(null)

  const value = {
    boards,
    setBoards,
    activeBoard,
    setActiveBoard
  }

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  )
}
