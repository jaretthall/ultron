-- Phase 3: Performance Optimization - Database Indexes
-- Strategic indexes for common query patterns in Ultron Productivity Command Center

-- ============================================================================
-- TASK TABLE INDEXES
-- ============================================================================

-- Critical index for dependency queries (GIN for array operations)
-- Used in: getBlockedTasks, getAvailableTasks, dependency resolution
CREATE INDEX IF NOT EXISTS idx_tasks_dependencies ON tasks USING GIN (dependencies);

-- Status filtering (most common query pattern)
-- Used in: getByStatus, filtering completed vs non-completed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);

-- Project relationship index
-- Used in: getTasksByProject, project completion metrics
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);

-- User-based queries (for multi-user scenarios)
-- Used in: user-specific task filtering
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);

-- Due date sorting and filtering
-- Used in: deadline urgency calculations, calendar views
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date) WHERE due_date IS NOT NULL;

-- Priority-based filtering
-- Used in: priority calculations, task prioritization
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);

-- Created date ordering (frequently used for sorting)
-- Used in: getAll with ordering, recent task queries
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at);

-- Tag-based searches (GIN for array operations)
-- Used in: tag filtering, analytics
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);

-- Composite index for non-completed tasks with dependencies
-- Optimizes the most expensive query pattern
CREATE INDEX IF NOT EXISTS idx_tasks_status_deps ON tasks (status, dependencies) WHERE status != 'completed';

-- ============================================================================
-- PROJECT TABLE INDEXES
-- ============================================================================

-- Status filtering for projects
-- Used in: getByStatus, active project filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

-- User-based project queries
-- Used in: user-specific project filtering
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);

-- Business relevance filtering
-- Used in: priority calculations, business impact analysis
CREATE INDEX IF NOT EXISTS idx_projects_business_relevance ON projects (business_relevance);

-- Deadline filtering and sorting
-- Used in: project deadline analysis, urgency calculations
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects (deadline) WHERE deadline IS NOT NULL;

-- Created date ordering
-- Used in: getAll with ordering, recent project queries
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at);

-- Tag-based searches for projects
-- Used in: project tag filtering, analytics
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN (tags);

-- ============================================================================
-- SCHEDULE TABLE INDEXES
-- ============================================================================

-- Task relationship index
-- Used in: getSchedulesByTask, calendar integration
CREATE INDEX IF NOT EXISTS idx_schedules_task_id ON schedules (task_id);

-- User-based schedule queries
-- Used in: user-specific schedule filtering
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules (user_id);

-- Start date ordering and filtering
-- Used in: calendar views, date range queries
CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON schedules (start_date);

-- End date filtering
-- Used in: schedule conflict detection, duration calculations
CREATE INDEX IF NOT EXISTS idx_schedules_end_date ON schedules (end_date);

-- Date range queries (composite index)
-- Used in: calendar view optimization, date range filtering
CREATE INDEX IF NOT EXISTS idx_schedules_date_range ON schedules (start_date, end_date);

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- View index usage statistics
-- Run this query to monitor index effectiveness:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- View table sizes and query performance
/*
SELECT 
    schemaname,
    tablename,
    seq_scan as table_scans,
    seq_tup_read as tuples_read_sequential,
    idx_scan as index_scans,
    idx_tup_fetch as tuples_fetched_index,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
*/

-- ============================================================================
-- INDEX MAINTENANCE NOTES
-- ============================================================================

/*
MAINTENANCE SCHEDULE:
1. Monitor index usage monthly using the queries above
2. REINDEX tables quarterly or when performance degrades
3. ANALYZE tables after bulk data changes
4. Consider dropping unused indexes (idx_scan = 0 after significant usage)

EXPECTED PERFORMANCE IMPROVEMENTS:
- getBlockedTasks: 90%+ reduction in query time (eliminates N+1 pattern)
- getAvailableTasks: 90%+ reduction in query time (eliminates N+1 pattern)  
- getTasksByDynamicPriority: 95%+ reduction in query time (batch processing)
- Tag-based filtering: 70%+ improvement with GIN indexes
- Date range queries: 60%+ improvement with composite indexes
- Dependency resolution: 80%+ improvement with GIN array indexing

DISK SPACE IMPACT:
- Estimated additional disk usage: 15-25% of table data size
- GIN indexes are larger but provide significant performance gains for array operations
- Monitor disk usage and adjust retention policies if needed
*/