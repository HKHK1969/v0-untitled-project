"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, Play, Star, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { userTestingService, type TaskCompletion } from "@/lib/user-testing"
import { toast } from "@/components/ui/use-toast"

export function TestingDashboard() {
  const [user, setUser] = useState<any>(null)
  const [pilotUser, setPilotUser] = useState<any>(null)
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([])
  const [currentTask, setCurrentTask] = useState<TaskCompletion | null>(null)
  const [progress, setProgress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const initializeTesting = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Get or create pilot user
      let pilotUserData = await userTestingService.getPilotUser(user.id)
      if (!pilotUserData) {
        pilotUserData = await userTestingService.createPilotUser({
          user_id: user.id,
          email: user.email!,
          status: "active",
          testing_phase: "phase1",
        })
      }
      setPilotUser(pilotUserData)

      if (pilotUserData) {
        // Assign tasks if none assigned
        if (!pilotUserData.assigned_tasks || pilotUserData.assigned_tasks.length === 0) {
          await userTestingService.assignTasksToUser(user.id, pilotUserData.testing_phase)
        }

        // Load task completions and progress
        const [completions, userProgress] = await Promise.all([
          userTestingService.getUserTaskCompletions(user.id),
          userTestingService.getUserProgress(user.id),
        ])

        setTaskCompletions(completions)
        setProgress(userProgress)

        // Find current task (first incomplete required task)
        const currentIncompleteTask = completions.find((tc) => tc.status === "assigned" && tc.task?.is_required)
        setCurrentTask(currentIncompleteTask || null)
      }

      setIsLoading(false)
    }

    initializeTesting()
  }, [supabase])

  const startTask = async (taskCompletion: TaskCompletion) => {
    setCurrentTask(taskCompletion)
    setTaskStartTime(Date.now())

    await userTestingService.updateTaskCompletion(user.id, taskCompletion.task_id, {
      status: "in_progress",
      started_at: new Date().toISOString(),
    })

    // Refresh data
    const updatedCompletions = await userTestingService.getUserTaskCompletions(user.id)
    setTaskCompletions(updatedCompletions)

    toast({
      title: "Task Started",
      description: `Started working on: ${taskCompletion.task?.name}`,
    })
  }

  const completeTask = async (
    taskCompletion: TaskCompletion,
    difficultyRating: number,
    notes: string,
    issues: string,
    suggestions: string,
  ) => {
    const timeSpent = taskStartTime ? Math.floor((Date.now() - taskStartTime) / (1000 * 60)) : 0

    await userTestingService.updateTaskCompletion(user.id, taskCompletion.task_id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      time_spent_minutes: timeSpent,
      difficulty_rating: difficultyRating,
      completion_notes: notes,
      issues_encountered: issues,
      suggestions: suggestions,
    })

    // Refresh data
    const [updatedCompletions, updatedProgress] = await Promise.all([
      userTestingService.getUserTaskCompletions(user.id),
      userTestingService.getUserProgress(user.id),
    ])

    setTaskCompletions(updatedCompletions)
    setProgress(updatedProgress)
    setCurrentTask(null)
    setTaskStartTime(null)

    toast({
      title: "Task Completed",
      description: `Completed: ${taskCompletion.task?.name}`,
    })
  }

  const skipTask = async (taskCompletion: TaskCompletion, reason: string) => {
    await userTestingService.updateTaskCompletion(user.id, taskCompletion.task_id, {
      status: "skipped",
      completion_notes: reason,
    })

    // Refresh data
    const updatedCompletions = await userTestingService.getUserTaskCompletions(user.id)
    setTaskCompletions(updatedCompletions)
    setCurrentTask(null)

    toast({
      title: "Task Skipped",
      description: `Skipped: ${taskCompletion.task?.name}`,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading testing dashboard...</div>
      </div>
    )
  }

  if (!pilotUser) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Pilot Program!</h2>
          <p>Setting up your testing environment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Testing Dashboard</h1>
          <p className="text-muted-foreground">Help us improve Sourcing Ninja by completing testing tasks</p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {pilotUser.testing_phase.toUpperCase()}
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Progress
          </CardTitle>
          <CardDescription>Track your testing progress and contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{progress?.tasksCompleted || 0}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(progress?.completionRate || 0)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progress?.totalTimeSpent || 0}m</div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progress?.averageDifficulty?.toFixed(1) || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Avg Difficulty</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {progress?.tasksCompleted || 0} of {progress?.tasksAssigned || 0} tasks
              </span>
            </div>
            <Progress value={progress?.completionRate || 0} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Current Task */}
      {currentTask && (
        <CurrentTaskCard
          taskCompletion={currentTask}
          onStart={() => startTask(currentTask)}
          onComplete={completeTask}
          onSkip={skipTask}
          isActive={currentTask.status === "in_progress"}
        />
      )}

      {/* All Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Tasks</CardTitle>
          <CardDescription>Complete these tasks to help us improve the product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taskCompletions.map((taskCompletion) => (
              <TaskCard
                key={taskCompletion.id}
                taskCompletion={taskCompletion}
                onStart={() => startTask(taskCompletion)}
                isCurrent={currentTask?.id === taskCompletion.id}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Current Task Card Component
function CurrentTaskCard({
  taskCompletion,
  onStart,
  onComplete,
  onSkip,
  isActive,
}: {
  taskCompletion: TaskCompletion
  onStart: () => void
  onComplete: (tc: TaskCompletion, rating: number, notes: string, issues: string, suggestions: string) => void
  onSkip: (tc: TaskCompletion, reason: string) => void
  isActive: boolean
}) {
  const [showCompletion, setShowCompletion] = useState(false)
  const [difficultyRating, setDifficultyRating] = useState(3)
  const [notes, setNotes] = useState("")
  const [issues, setIssues] = useState("")
  const [suggestions, setSuggestions] = useState("")
  const [skipReason, setSkipReason] = useState("")

  const task = taskCompletion.task!

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Current Task: {task.name}
            </CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
          <Badge variant={task.is_required ? "default" : "secondary"}>
            {task.is_required ? "Required" : "Optional"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.instructions && (
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-medium mb-2">Instructions:</h4>
            <p className="text-sm">{task.instructions}</p>
          </div>
        )}

        {task.success_criteria && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium mb-2 text-green-800">Success Criteria:</h4>
            <p className="text-sm text-green-700">{task.success_criteria}</p>
          </div>
        )}

        {!isActive && !showCompletion && (
          <div className="flex gap-2">
            <Button onClick={onStart} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Task
            </Button>
            {!task.is_required && (
              <Button variant="outline" onClick={() => setSkipReason("")}>
                Skip Task
              </Button>
            )}
          </div>
        )}

        {isActive && !showCompletion && (
          <div className="flex gap-2">
            <Button onClick={() => setShowCompletion(true)} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </Button>
            <Button variant="outline" onClick={() => setShowCompletion(false)}>
              Continue Working
            </Button>
          </div>
        )}

        {showCompletion && (
          <div className="space-y-4 p-4 bg-white rounded-lg border">
            <h4 className="font-medium">Task Completion</h4>

            <div>
              <Label>Difficulty Rating (1-5)</Label>
              <Select
                value={difficultyRating.toString()}
                onValueChange={(v) => setDifficultyRating(Number.parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Easy</SelectItem>
                  <SelectItem value="2">2 - Easy</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Difficult</SelectItem>
                  <SelectItem value="5">5 - Very Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Completion Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did the task go? Any observations?"
              />
            </div>

            <div>
              <Label>Issues Encountered (Optional)</Label>
              <Textarea
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                placeholder="Did you encounter any problems or bugs?"
              />
            </div>

            <div>
              <Label>Suggestions (Optional)</Label>
              <Textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="How could this feature be improved?"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => onComplete(taskCompletion, difficultyRating, notes, issues, suggestions)}>
                Complete Task
              </Button>
              <Button variant="outline" onClick={() => setShowCompletion(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Task Card Component
function TaskCard({
  taskCompletion,
  onStart,
  isCurrent,
}: {
  taskCompletion: TaskCompletion
  onStart: () => void
  isCurrent: boolean
}) {
  const task = taskCompletion.task!

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-600" />
      case "skipped":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "skipped":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className={`p-4 rounded-lg border ${isCurrent ? "border-blue-200 bg-blue-50/30" : "border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(taskCompletion.status)}
          <div>
            <h4 className="font-medium">{task.name}</h4>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            {task.estimated_time_minutes && (
              <p className="text-xs text-muted-foreground mt-1">
                Estimated time: {task.estimated_time_minutes} minutes
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(taskCompletion.status)}>{taskCompletion.status.replace("_", " ")}</Badge>
          {task.is_required && <Badge variant="outline">Required</Badge>}
          {taskCompletion.status === "assigned" && !isCurrent && (
            <Button size="sm" onClick={onStart}>
              Start
            </Button>
          )}
        </div>
      </div>

      {taskCompletion.status === "completed" && taskCompletion.difficulty_rating && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Difficulty:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= taskCompletion.difficulty_rating! ? "text-yellow-400 fill-current" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          {taskCompletion.time_spent_minutes && (
            <span className="text-xs text-muted-foreground ml-2">({taskCompletion.time_spent_minutes}m)</span>
          )}
        </div>
      )}
    </div>
  )
}
