import React from 'react'

const Board = ({ title, columns }) => {
  return (
    <div className="board">
      <h2>{title}</h2>
      <div className="board-columns">
        {/* Columns will be rendered here */}
      </div>
    </div>
  )
}

export default Board
