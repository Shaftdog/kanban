/**
 * Type definitions for the Kanban application
 */

/**
 * @typedef {Object} Task
 * @property {string} id - Unique identifier for the task
 * @property {string} title - Task title
 * @property {string} description - Task description
 * @property {string} status - Current status (e.g., 'todo', 'in-progress', 'done')
 * @property {string} priority - Priority level (e.g., 'low', 'medium', 'high')
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Column
 * @property {string} id - Unique identifier for the column
 * @property {string} title - Column title
 * @property {Task[]} tasks - Tasks in this column
 * @property {number} order - Display order
 */

/**
 * @typedef {Object} Board
 * @property {string} id - Unique identifier for the board
 * @property {string} title - Board title
 * @property {Column[]} columns - Columns in this board
 */

export {}
