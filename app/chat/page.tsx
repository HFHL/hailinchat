'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, LogOut, Plus, MessageSquare } from 'lucide-react'
import { supabase, type User, type Conversation, type Message } from '@/lib/supabase'
import { AI_MODELS, type ModelId } from '@/lib/models'
import MessageContent from '@/components/MessageContent'

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelId>('gpt-4-0125-preview')
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    setCurrentUser(user)
    fetchConversations(user.id)
  }, [router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function fetchConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
      
      if (data && data.length > 0) {
        setCurrentConversation(data[0])
        setSelectedModel(data[0].model as ModelId)
        fetchMessages(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at')

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  async function createNewConversation() {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: currentUser.id,
          title: 'New Conversation',
          model: selectedModel
        })
        .select()
        .single()

      if (error) throw error
      
      const newConversation = data as Conversation
      setConversations(prev => [newConversation, ...prev])
      setCurrentConversation(newConversation)
      setMessages([])
      setShowSidebar(false)
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  async function selectConversation(conversation: Conversation) {
    setCurrentConversation(conversation)
    setSelectedModel(conversation.model as ModelId)
    await fetchMessages(conversation.id)
    setShowSidebar(false)
  }

  async function sendMessage() {
    if (!inputMessage.trim() || !currentConversation || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)
    const tempAiMessageId = (Date.now() + 1).toString()

    try {
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversation.id,
          role: 'user',
          content: userMessage
        })

      if (userMessageError) throw userMessageError

      const newUserMessage: Message = {
        id: Date.now().toString(),
        conversation_id: currentConversation.id,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, newUserMessage])

      const tempAiMessage: Message = {
        id: tempAiMessageId,
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: '',
        model: selectedModel,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, tempAiMessage])

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let aiContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  aiContent += data.content
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === tempAiMessageId 
                        ? { ...msg, content: aiContent }
                        : msg
                    )
                  )
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (aiContent) {
        const { error: aiMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: currentConversation.id,
            role: 'assistant',
            content: aiContent,
            model: selectedModel
          })

        if (aiMessageError) console.error('Error saving AI message:', aiMessageError)

        await supabase
          .from('conversations')
          .update({
            updated_at: new Date().toISOString(),
            title: userMessage.slice(0, 50)
          })
          .eq('id', currentConversation.id)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessageId))
    } finally {
      setIsLoading(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function logout() {
    localStorage.removeItem('currentUser')
    router.push('/login')
  }

  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50">
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className={`
        fixed md:relative z-20 md:z-0
        w-80 h-full bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{currentUser.avatar}</span>
                <span className="font-medium text-gray-800">{currentUser.display_name}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <LogOut size={18} />
              </button>
            </div>
            <button
              onClick={createNewConversation}
              className="w-full flex items-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={18} />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={`
                  w-full p-4 text-left hover:bg-gray-100 border-b border-gray-100
                  ${currentConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                `}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare size={16} className="text-gray-400" />
                  <span className="font-medium text-sm text-gray-800 truncate">
                    {conversation.title}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {AI_MODELS.find(m => m.id === conversation.model)?.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <MessageSquare size={20} />
          </button>
          
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelId)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {AI_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] p-3 rounded-lg
                  ${message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-200 text-gray-800'
                  }
                `}
              >
                <MessageContent content={message.content} role={message.role} />
                {message.role === 'assistant' && message.model && (
                  <div className="text-xs text-gray-500 mt-2">
                    {AI_MODELS.find(m => m.id === message.model)?.name}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span>AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}