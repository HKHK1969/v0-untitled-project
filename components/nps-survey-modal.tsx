"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { feedbackService } from "@/lib/supabase/feedback"

interface NPSSurveyModalProps {
  isOpen: boolean
  onClose: () => void
  surveyType?: "periodic" | "feature-specific" | "onboarding" | "exit"
  context?: any
}

export function NPSSurveyModal({ isOpen, onClose, surveyType = "periodic", context = {} }: NPSSurveyModalProps) {
  const [user, setUser] = useState<any>(null)
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || score === null) return

    setIsSubmitting(true)
    try {
      const result = await feedbackService.submitNPSSurvey({
        user_id: user.id,
        score,
        feedback: feedback.trim() || undefined,
        survey_type: surveyType,
        context,
      })

      if (result) {
        toast({
          title: "Thank You!",
          description: "Your feedback helps us improve the product.",
        })
        onClose()
      } else {
        throw new Error("Failed to submit survey")
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getScoreLabel = (score: number) => {
    if (score <= 6) return "Not likely"
    if (score <= 8) return "Neutral"
    return "Very likely"
  }

  const getScoreColor = (score: number) => {
    if (score <= 6) return "text-red-600"
    if (score <= 8) return "text-yellow-600"
    return "text-green-600"
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quick Survey</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>How likely are you to recommend our supply chain tracker to a colleague?</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
              <div className="grid grid-cols-11 gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setScore(num)}
                    className={`
                      aspect-square rounded text-sm font-medium transition-colors
                      ${score === num ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {score !== null && (
                <p className={`text-sm mt-2 font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="feedback">What's the main reason for your score? (Optional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what we could do better..."
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || score === null} className="flex-1">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Skip
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
