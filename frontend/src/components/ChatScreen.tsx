import { useState } from "react";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
} from "lucide-react";
import "./chat.scss"

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
  id: number;
  text: string;
  sender: "me" | "other";
  time: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Hey, how are you?",
    sender: "other",
    time: "10:28 AM",
  },
  {
    id: 2,
    text: "I'm good! How about you?",
    sender: "me",
    time: "10:29 AM",
  },
  {
    id: 3,
    text: "I'm doing great 👍",
    sender: "other",
    time: "10:30 AM",
  },
];

function ChatScreen() {
  const [selectedUser, setSelectedUser] = useState<ChatUser>(users[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: message,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
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
                selectedUser.id === user.id ? "active" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="avatar">
                {user.name.charAt(0)}
                {user.online && <span className="online-dot" />}
              </div>

              <div className="user-info">
                <div className="user-name-row">
                  <strong>{user.name}</strong>
                  <span>{user.time}</span>
                </div>

                <p>{user.message}</p>
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
              {selectedUser.online && <span className="online-dot" />}
            </div>

            <div>
              <h3>{selectedUser.name}</h3>
              <span>
                {selectedUser.online ? "Online" : "Offline"}
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

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-wrapper ${
                msg.sender === "me" ? "sent" : "received"
              }`}
            >
              <div className="message">
                <p>{msg.text}</p>
                <span>{msg.time}</span>
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
            onChange={(e) => setMessage(e.target.value)}
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