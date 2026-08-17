import { useEffect, useRef, useState } from "react";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
} from "lucide-react";
import "./chat.scss";

interface ChatUser {
  id: number;
  name: string;
  message: string;
  time: string;
  online: boolean;
}

const users: ChatUser[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    message: "Hey! How are you?",
    time: "10:30 AM",
    online: true,
  },
  {
    id: 2,
    name: "Priya Singh",
    message: "Hello 👋",
    time: "09:45 AM",
    online: true,
  },
  {
    id: 3,
    name: "Amit Kumar",
    message: "See you tomorrow",
    time: "Yesterday",
    online: false,
  },
];

interface Message {
  sender: string;
  receiver?: string;
  message: string;
  time?: string;
}

function ChatScreen() {
  const [selectedUser, setSelectedUser] = useState<ChatUser>(users[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const token = localStorage.getItem('token');
  // WebSocket reference
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log("Connecting WebSocket...");

    const ws = new WebSocket(
      `ws://localhost:8086/chat?token=${token}`
    );

    // Connection successful
    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    // Message received from Spring Boot
    ws.onmessage = (event) => {
      console.log("📩 Received:", event.data);

      try {
        const receivedMessage: Message =
          JSON.parse(event.data);

        setMessages((prev) => [
          ...prev,
          receivedMessage,
        ]);
      } catch (error) {
        console.error(
          "❌ Invalid message received:",
          event.data
        );
      }
    };

    // WebSocket error
    ws.onerror = (error) => {
      console.error(
        "❌ WebSocket error:",
        error
      );
    };

    // Connection closed
    ws.onclose = () => {
      console.log(
        "🔴 WebSocket disconnected"
      );
    };

    socket.current = ws;

    // Cleanup
    return () => {
      ws.close();
      socket.current = null;
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }

    // Check WebSocket connection
    if (
      !socket.current ||
      socket.current.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "❌ WebSocket is not connected"
      );
      return;
    }

    const chatMessage: Message = {
      sender: localStorage.getItem('username') == "aman" ? "aman" : "amit",
      receiver: localStorage.getItem('username') == "aman" ? "amit" : "aman",
      message: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    console.log(
      "📤 Sending:",
      chatMessage
    );

    // Send message to Spring Boot
    socket.current.send(
      JSON.stringify(chatMessage)
    );

    setMessage("");
  };

  return (
    <div className="chat-container">

      {/* Sidebar */}
      <aside className="chat-sidebar">

        <div className="sidebar-header">
          <h2>Chats</h2>

          <button className="icon-button">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search chats..."
          />
        </div>

        {/* Users */}
        <div className="chat-users">

          {users.map((user) => (
            <div
              key={user.id}
              className={`chat-user ${
                selectedUser.id === user.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSelectedUser(user)
              }
            >

              <div className="avatar">

                {user.name.charAt(0)}

                {user.online && (
                  <span className="online-dot" />
                )}

              </div>

              <div className="user-info">

                <div className="user-name-row">

                  <strong>
                    {user.name}
                  </strong>

                  <span>
                    {user.time}
                  </span>

                </div>

                <p>
                  {user.message}
                </p>

              </div>

            </div>
          ))}

        </div>

      </aside>

      {/* Chat Area */}
      <main className="chat-main">

        {/* Chat Header */}
        <header className="chat-header">

          <div className="selected-user">

            <div className="avatar">

              {selectedUser.name.charAt(0)}

              {selectedUser.online && (
                <span className="online-dot" />
              )}

            </div>

            <div>

              <h3>
                {selectedUser.name}
              </h3>

              <span>
                {selectedUser.online
                  ? "Online"
                  : "Offline"}
              </span>

            </div>

          </div>

          <div className="chat-actions">

            <button>
              <Phone size={20} />
            </button>

            <button>
              <Video size={20} />
            </button>

            <button>
              <MoreVertical size={20} />
            </button>

          </div>

        </header>

        {/* Messages */}
        <div className="messages-container">

          {messages.map((msg, index) => (

            <div
              key={index}
              className={`message-wrapper ${
                msg.sender === "aman"
                  ? "sent"
                  : "received"
              }`}
            >

              <div className="message">

                <p>
                  {msg.message}
                </p>

                <span>
                  {msg.time || "Now"}
                </span>

              </div>

            </div>

          ))}

        </div>

        {/* Message Input */}
        <div className="message-input-container">

          <button className="input-icon">
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {

              if (e.key === "Enter") {
                sendMessage();
              }

            }}
          />

          <button className="input-icon">
            <Smile size={20} />
          </button>

          <button
            className="send-button"
            onClick={sendMessage}
          >
            <Send size={19} />
          </button>

        </div>

      </main>

    </div>
  );
}

export default ChatScreen;