import React from 'react'

const Task = ({ task }) => {
  return (
    <div className="task-card">
      <h4>{task.title}</h4>
      {task.description && <p>{task.description}</p>}
      <div className="task-meta">
        <span className={`priority priority-${task.priority}`}>
          {task.priority}
        </span>
      </div>
    </div>
  )
}

export default Task
