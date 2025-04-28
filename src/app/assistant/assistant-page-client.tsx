"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/ui/page-header"
import { askGemini } from "@/lib/assistant"
import { Loader2, Send, Bot, Info, Lightbulb, HelpCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type SuggestedQuestion = {
  text: string
  category: string
}

export default function AssistantPageClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your POS Assistant powered by Google Gemini. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions: SuggestedQuestion[] = [
    { text: "How do I process an M-Pesa payment?", category: "Payments" },
    { text: "How can I add new products to inventory?", category: "Inventory" },
    { text: "How does the loyalty program work?", category: "Loyalty" },
    { text: "How do I view sales analytics?", category: "Analytics" },
    { text: "How can I configure system settings?", category: "Configuration" },
    { text: "How do I handle refunds?", category: "Orders" },
    { text: "How do I generate barcodes?", category: "Products" },
    { text: "How can I set up low stock alerts?", category: "Inventory" },
  ]

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await askGemini(input, messages)

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting response from Gemini:", error)
      toast.error('An error occured',{
        description: "Failed to get a response. Please try again later.",
      })

      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader title="AI Assistant" description="Get help and answers about using the POS system" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                  <AvatarFallback>
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">POS Assistant</CardTitle>
                  <CardDescription>Powered by Google Gemini</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="grow overflow-hidden pt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex flex-col max-w-[80%] rounded-lg p-4',
                        message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      <div className="text-sm font-medium mb-1">{message.role === 'user' ? 'You' : 'Assistant'}</div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-2 self-end">{message.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex flex-col max-w-[80%] rounded-lg p-4 bg-muted">
                      <div className="text-sm font-medium mb-1">Assistant</div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4">
              <div className="flex w-full items-center space-x-2">
                <Input
                  placeholder="Type your question here..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                <span>Suggested Questions</span>
              </CardTitle>
              <CardDescription>Click on any question to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto py-2 px-3 text-left"
                      onClick={() => handleSuggestedQuestion(question.text)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span>{question.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {question.category}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </TabsContent>

                <TabsContent value="inventory" className="space-y-2">
                  {suggestedQuestions
                    .filter(q => q.category === 'Inventory' || q.category === 'Products')
                    .map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto py-2 px-3 text-left"
                        onClick={() => handleSuggestedQuestion(question.text)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span>{question.text}</span>
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                </TabsContent>

                <TabsContent value="payments" className="space-y-2">
                  {suggestedQuestions
                    .filter(q => q.category === 'Payments' || q.category === 'Orders')
                    .map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto py-2 px-3 text-left"
                        onClick={() => handleSuggestedQuestion(question.text)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span>{question.text}</span>
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                </TabsContent>

                <TabsContent value="other" className="space-y-2">
                  {suggestedQuestions
                    .filter(q => !['Inventory', 'Products', 'Payments', 'Orders'].includes(q.category))
                    .map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto py-2 px-3 text-left"
                        onClick={() => handleSuggestedQuestion(question.text)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span>{question.text}</span>
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                <span>About the Assistant</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>What can I ask?</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  You can ask questions about any aspect of the POS system, including inventory management, payment
                  processing, loyalty programs, analytics, and system configuration.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Powered by AI</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  This assistant uses Google Gemini to provide intelligent responses based on the POS system&apos;s
                  features and functionality.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

