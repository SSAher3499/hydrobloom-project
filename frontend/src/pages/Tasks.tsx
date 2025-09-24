import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { PlusIcon, UserCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  category?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const Tasks: React.FC = () => {
  const { t } = useTranslation();

  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'open',
      title: t('tasks.open'),
      tasks: [
        {
          id: '1',
          title: 'Check pH levels in Zone A',
          description: 'Monitor and adjust pH levels in the hydroponic system',
          assignee: { id: '1', name: 'John Doe' },
          dueDate: '2025-09-25',
          category: 'Monitoring',
          priority: 'HIGH',
        },
        {
          id: '2',
          title: 'Harvest lettuce batch #23',
          description: 'Ready for harvest in polyhouse 2',
          assignee: { id: '2', name: 'Jane Smith' },
          dueDate: '2025-09-24',
          category: 'Harvest',
          priority: 'URGENT',
        },
      ],
    },
    {
      id: 'in_progress',
      title: t('tasks.in_progress'),
      tasks: [
        {
          id: '3',
          title: 'Install new sensors in Zone B',
          description: 'Setting up temperature and humidity sensors',
          assignee: { id: '3', name: 'Mike Johnson' },
          dueDate: '2025-09-26',
          category: 'Installation',
          priority: 'MEDIUM',
        },
      ],
    },
    {
      id: 'in_review',
      title: t('tasks.in_review'),
      tasks: [
        {
          id: '4',
          title: 'Weekly maintenance report',
          description: 'Review and submit maintenance activities',
          assignee: { id: '1', name: 'John Doe' },
          dueDate: '2025-09-23',
          category: 'Reporting',
          priority: 'MEDIUM',
        },
      ],
    },
    {
      id: 'closed',
      title: t('tasks.closed'),
      tasks: [
        {
          id: '5',
          title: 'Clean water reservoirs',
          description: 'Monthly cleaning completed',
          assignee: { id: '2', name: 'Jane Smith' },
          dueDate: '2025-09-20',
          category: 'Maintenance',
          priority: 'LOW',
        },
      ],
    },
  ]);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    if (sourceColumn === destColumn) {
      const newTasks = Array.from(sourceColumn.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newColumns = columns.map(col =>
        col.id === sourceColumn.id ? { ...col, tasks: newTasks } : col
      );

      setColumns(newColumns);
    } else {
      const sourceTasks = Array.from(sourceColumn.tasks);
      const destTasks = Array.from(destColumn.tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) {
          return { ...col, tasks: sourceTasks };
        }
        if (col.id === destColumn.id) {
          return { ...col, tasks: destTasks };
        }
        return col;
      });

      setColumns(newColumns);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('tasks.title')}</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <PlusIcon className="h-4 w-4 mr-2" />
          {t('tasks.create')}
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
            >
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">{column.title}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={clsx(
                        'space-y-3 min-h-[200px] transition-colors',
                        snapshot.isDraggingOver ? 'bg-gray-100 rounded-md p-2' : ''
                      )}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={clsx(
                                'bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer transition-shadow hover:shadow-md',
                                snapshot.isDragging ? 'shadow-lg rotate-3' : ''
                              )}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                                    {task.title}
                                  </h4>
                                  <span
                                    className={clsx(
                                      'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
                                      getPriorityColor(task.priority)
                                    )}
                                  >
                                    {task.priority}
                                  </span>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                {task.category && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                    {task.category}
                                  </span>
                                )}

                                <div className="flex items-center justify-between">
                                  {task.assignee && (
                                    <div className="flex items-center space-x-2">
                                      {task.assignee.avatar ? (
                                        <img
                                          src={task.assignee.avatar}
                                          alt={task.assignee.name}
                                          className="w-6 h-6 rounded-full"
                                        />
                                      ) : (
                                        <UserCircleIcon className="w-6 h-6 text-gray-400" />
                                      )}
                                      <span className="text-xs text-gray-600">
                                        {task.assignee.name}
                                      </span>
                                    </div>
                                  )}

                                  {task.dueDate && (
                                    <div
                                      className={clsx(
                                        'flex items-center space-x-1 text-xs',
                                        isOverdue(task.dueDate)
                                          ? 'text-red-600'
                                          : 'text-gray-500'
                                      )}
                                    >
                                      <ClockIcon className="w-4 h-4" />
                                      <span>{formatDate(task.dueDate)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Tasks;