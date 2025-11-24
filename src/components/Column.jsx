import React from 'react'

const Column = ({ title, tasks }) => {
  return (
    <div className="column">
      <div className="column-header">
        <h3>{title}</h3>
        <span className="task-count">{tasks?.length || 0}</span>
      </div>
      <div className="column-tasks">
        {/* Tasks will be rendered here */}
      </div>
    </div>
  )
}

export default Column
