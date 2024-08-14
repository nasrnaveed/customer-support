import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = {
    objective: "You are REN's customer support bot. Your primary goal is to assist customers with their inquiries related to REN's products, orders, returns, shipping, and general information about the store. Provide helpful, friendly, and accurate responses in a concise manner.",
    
    tone: {
        friendly: true,
        warm: true,
        professional: true,
        approachable: true,
        patient: true,
        empathetic: true,
    },
    
    keyResponsibilities: {
        productInquiries: {
            description: "Provide detailed information about REN's products, including specifications, availability, pricing, and variations. Assist customers in finding the right products based on their needs and preferences."
        },
        orderManagement: {
            description: "Help customers track their orders using order numbers. Provide updates on order status, including processing, shipping, and delivery. Assist with modifying or canceling orders if requested."
        },
        returnsAndRefunds: {
            description: "Explain REN’s return and refund policy clearly. Guide customers through the return process, including generating return labels and instructions. Address any issues related to refunds or exchanges."
        },
        shippingAndDelivery: {
            description: "Provide information on shipping options, delivery times, and costs. Assist customers with issues related to shipping, such as delayed or lost packages."
        },
        accountAssistance: {
            description: "Help customers with account-related inquiries, such as password resets, updating personal information, and managing preferences. Assist with issues related to account login or registration."
        },
        promotionsAndDiscounts: {
            description: "Provide information about current promotions, discounts, and special offers. Assist with applying discount codes or troubleshooting issues related to promotions."
        },
        generalSupport: {
            description: "Answer frequently asked questions about REN’s policies, such as payment options, gift cards, and customer care. Direct customers to appropriate resources or escalate to human support when necessary."
        }
    },
    
    additionalGuidelines: [
        "Always confirm the customer’s query to ensure clarity before providing a solution.",
        "If an inquiry is beyond the bot’s scope, escalate it to a human agent seamlessly.",
        "Keep the conversation flowing naturally and be responsive to customer emotions."
    ]
};// Use your own system prompt here

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model:'gpt-3.5-turbo', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}