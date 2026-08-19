import { useEffect, useRef, useState } from "react";
import { Search, Send, MoreVertical, Phone, Video, Paperclip, Smile, MessageCircle } from "lucide-react";

import "./chat.scss";
import {
  getConversation,
  getConversationMessages,
  getUsers,
} from "../apis/api";

function ChatScreen() {
  const loggedInUserId = Number(localStorage.getItem("id"));
  const token = localStorage.getItem("token");

  const [conversations, setConversations] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(false);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [chatPageNumber, setChatPageNumber] = useState(0);

  const [selectedChat, setSelectedChat] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef(null);
  const socket = useRef(null);
  const selectedChatRef = useRef(null);

  const messagesContainerRef = useRef(null);

  // =========================================================
  // LOAD CONVERSATIONS
  // =========================================================

  const loadConversation = async () => {
    try {
      setLoadingConversations(true);

      const response = await getConversation();
      const data = response.data;

      if (data.code === 200) {
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  const loadMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);

      const response = await getConversationMessages(
        conversationId,
        chatPageNumber
      );

      const data = response.data;

      if (data.code === 200) {
        setMessages(data.data.content || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversation();
  }, []);

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async (searchValue, pageNumber = 0) => {
    try {
      setLoadingUsers(true);

      const response = await getUsers(
        searchValue,
        pageNumber
      );

      const data = response.data.data;

      setSearchUsers(data.content || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      setSearchUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // =========================================================
  // SEARCH USERS
  // =========================================================

  useEffect(() => {
    const searchValue = search.trim();

    if (!searchValue) {
      setSearchUsers([]);
      return;
    }

    const timeout = setTimeout(() => {
      loadUsers(searchValue, 0);
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [search]);

  // =========================================================
  // CREATE SELECTED CHAT
  // =========================================================

  const createSelectedChatFromConversation = (
    conversation
  ) => {
    /*
     * Currently group chat is not handled
     * in this individual-chat screen.
     */

    if (
      conversation.type !== "INDIVIDUAL" ||
      !conversation.receiverUserId
    ) {
      return null;
    }

    return {
      conversationId: conversation.conversationId,

      receiverUserId: conversation.receiverUserId,

      username: conversation.receiverUsername || "",

      displayName:
        conversation.receiverDisplayName ||
        conversation.receiverUsername ||
        "",

      profilePicUrl: conversation.receiverProfilePic,

      online: conversation.receiverIsOnline || false,
    };
  };

  // =========================================================
  // SELECT CONVERSATION
  // =========================================================

  const selectConversation = (conversation) => {
    const chat =
      createSelectedChatFromConversation(conversation);

    if (!chat) {
      return;
    }

    setSelectedChat(chat);

    setConversations((prev) =>
      prev.map((item) => {
        if (
          item.conversationId ===
          conversation.conversationId
        ) {
          return {
            ...item,
            unreadCount: 0,
          };
        }

        return item;
      })
    );

    setSearch("");
    setSearchUsers([]);

    if (conversation.conversationId) {
      loadMessages(conversation.conversationId);
    } else {
      setMessages([]);
    }
  };

  // =========================================================
  // SELECT SEARCH USER
  // =========================================================

  // when serach users and first time go to chat or if its already conversation its also manage
  const selectSearchUser = (user) => {
    const existingConversation =
      conversations.find(
        (conversation) =>
          conversation.type === "INDIVIDUAL" &&
          conversation.receiverUserId === user.id &&
          conversation.conversationId !== null
      );

    if (existingConversation) {
      selectConversation(existingConversation);
      return;
    }

    const newChat = {
      conversationId: null,

      receiverUserId: user.id,

      username: user.username,

      displayName:
        user.displayName || user.username,

      profilePicUrl: user.profilePicUrl,

      online: user.online || false,
    };

    setSelectedChat(newChat);

    setMessages([]);

    const temporaryConversation = {
      conversationId: null,

      type: "INDIVIDUAL",

      receiverUserId: user.id,

      receiverUsername: user.username,

      receiverDisplayName: user.displayName || user.username,

      receiverProfilePic: user.profilePicUrl,

      receiverIsOnline: user.online || false,

      lastMessage: null,

      lastMessageType: null,

      lastMessageTime: null,

      lastMessageSenderId: null,

      unreadCount: 0,
    };

    setConversations((prev) => {
      const filtered = prev.filter(
        (conversation) =>
          conversation.receiverUserId !== user.id
      );

      return [
        temporaryConversation,
        ...filtered,
      ];
    });

    setSearch("");
    setSearchUsers([]);
  };

  const getMessagePreview = (msg) => {
    switch (msg.messageType) {
      case "IMAGE":
        return msg.content || "📷 Image";

      case "VIDEO":
        return msg.content || "🎥 Video";

      case "AUDIO":
        return msg.content || "🎵 Audio";

      case "FILE":
        return msg.content || "📎 File";

      default:
        return msg.content || "";
    }
  };

  const updateConversationAfterMessage = (receivedMessage) => {
    if (!receivedMessage.sender) {
      return;
    }

    let receiverUserId = null;

    if (receivedMessage.sender === loggedInUserId) {
      receiverUserId = selectedChat?.receiver || null;
    } else {
      receiverUserId = receivedMessage.sender;
    }

    if (!receiverUserId) {
      return;
    }
    
    setConversations((prev) => {
      const existing = prev.find(
        (conversation) =>
          conversation.receiverUserId === receiverUserId
      );
      console.log("existing ->", existing);

      if (existing) {
        const updated = {
          ...existing,

          conversationId:
            receivedMessage.conversationId ||
            existing.conversationId,

          lastMessage:
            getMessagePreview(receivedMessage),

          lastMessageType:
            receivedMessage.messageType,

          lastMessageTime:
            receivedMessage.createdAt,

          lastMessageSenderId:
            receivedMessage.senderId,

          unreadCount:
            selectedChat?.userId === receiverUserId
              ? 0
              : receivedMessage.senderId ===
                loggedInUserId
                ? 0
                : existing.unreadCount + 1,
        };

        const remaining = prev.filter(
          (conversation) =>
            conversation.receiverUserId !== receiverUserId
        );

        return [
          updated,
          ...remaining,
        ];
      } else{
        const newConversation = {
          conversationId:
            receivedMessage.conversationId,

          type: "INDIVIDUAL",

          receiverUserId:receiverUserId,

          receiverUsername:receivedMessage?.username,

          receiverDisplayName:receivedMessage?.displayName,

          receiverProfilePic:receivedMessage?.profilePicUrl,

          receiverIsOnline:receivedMessage?.isonline,

          lastMessage:getMessagePreview(receivedMessage),

          lastMessageType:receivedMessage.messageType,

          lastMessageTime:receivedMessage.createdAt,

          lastMessageSenderId:receivedMessage.sender,

          unreadCount: 0,
        };

        return [
          newConversation,
          ...prev,
        ];
      }

      return prev;
    });

    // if (
    //   selectedChat &&
    //   selectedChat.userId === receiverUserId &&
    //   receivedMessage.conversationId
    // ) {
    //   setSelectedChat((prev) => {
    //     if (!prev) {
    //       return prev;
    //     }

    //     return {
    //       ...prev,

    //       conversationId:
    //         receivedMessage.conversationId,
    //     };
    //   });
    // }
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = () => {
    const messageText = message.trim();
    console.log("selectedChat ", selectedChat);
    
    if (!messageText) {
      return;
    }

    if (!selectedChat) {
      return;
    }

    if (
      !socket.current ||
      socket.current.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "❌ WebSocket is not connected"
      );

      return;
    }

    const chatMessage = {
      sender: Number(localStorage.getItem("id")),
      receiver: selectedChat.receiverUserId,
      messageType: "TEXT",
      message: messageText,
      username:selectedChat?.username,
      displayname:selectedChat?.displayName
    };

    console.log("📤 Sending:", chatMessage);

    socket.current.send(
      JSON.stringify(chatMessage)
    );

    setMessage("");
  };

  // =========================================================
  // WEBSOCKET
  // =========================================================

  useEffect(() => {
    selectedChatRef.current = selectedChat;

    console.log("selected chat updated:", selectedChat);
  }, [selectedChat]);

  useEffect(() => {
    if (!token) {
      console.error("❌ Token not found");
      return;
    }

    console.log("Connecting WebSocket...");

    const ws = new WebSocket(
      `ws://localhost:8086/chat?token=${token}`
    );

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event, selectedChat) => {
      console.log("📩 Received: 1", event.data);
      const currentChat = selectedChatRef.current;


      try {
        const receivedMessage = JSON.parse(event.data);
        
        if (!receivedMessage) {
          return;
        }
        
        if(currentChat?.conversationId === receivedMessage?.conversationId){
            setMessages((prev) => {
              /*
               * Prevent duplicate message.
               */

              const alreadyExists =
                prev.some(
                  (msg) =>
                    msg.id ===
                    receivedMessage.id
                );

              if (alreadyExists) {
                return prev;
              }

              return [
                ...prev,
                receivedMessage,
              ];
            });
        } else {
          
        }

        /*
         * Update sidebar.
         */

        updateConversationAfterMessage(
          receivedMessage
        );
      } catch (error) {
        console.error(
          "❌ Invalid message received:",
          event.data,
          error
        );
      }
    };

    ws.onerror = (error) => {
      console.error(
        "❌ WebSocket error:",
        error
      );
    };

    ws.onclose = () => {
      console.log(
        "🔴 WebSocket disconnected"
      );
    };

    socket.current = ws;

    /*
     * IMPORTANT:
     *
     * WebSocket should only be created once.
     *
     * Don't put selectedChat in dependency array.
     */

    return () => {
      ws.close();

      if (socket.current === ws) {
        socket.current = null;
      }
    };
  }, [token]);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    const container =
      messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop =
      container.scrollHeight;
  }, [messages]);

  // =========================================================
  // FORMAT LAST MESSAGE TIME
  // =========================================================

  const formatLastMessageTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    return messageDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // FORMAT MESSAGE TIME
  // =========================================================

  const formatMessageTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // RENDER MESSAGE CONTENT
  // =========================================================

  const renderMessageContent = (msg) => {
    switch (msg.messageType) {
      case "TEXT":
        return (
          <p>
            {msg.content}
          </p>
        );

      case "IMAGE":
        return (
          <div className="message-image">
            {msg.fileUrl && (
              <img
                src={msg.fileUrl}
                alt={
                  msg.content || "Image"
                }
              />
            )}

            {msg.content && (
              <p>
                {msg.content}
              </p>
            )}
          </div>
        );

      case "VIDEO":
        return (
          <div className="message-video">
            <video
              controls
              src={msg.fileUrl || ""}
              poster={
                msg.thumbnailUrl ||
                undefined
              }
            />

            {msg.content && (
              <p>
                {msg.content}
              </p>
            )}
          </div>
        );

      case "AUDIO":
        return (
          <div className="message-audio">
            <audio
              controls
              src={msg.fileUrl || ""}
            />

            {msg.content && (
              <p>
                {msg.content}
              </p>
            )}
          </div>
        );

      case "FILE":
        return (
          <div className="message-file-wrapper">
            <a
              href={
                msg.fileUrl || "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="message-file"
            >
              📎{" "}
              {msg.content ||
                msg.fileType ||
                "Download file"}
            </a>
          </div>
        );

      default:
        return (
          <p>
            {msg.content}
          </p>
        );
    }
  };

  // =========================================================
  // MESSAGE STATUS
  // =========================================================

  const renderMessageStatus = (msg) => {
    if (msg.senderId !== loggedInUserId) {
      return null;
    }

    switch (msg.status) {
      case "READ":
        return (
          <span className="message-status read">
            ✓✓
          </span>
        );

      case "DELIVERED":
        return (
          <span className="message-status delivered">
            ✓✓
          </span>
        );

      case "SENT":
        return (
          <span className="message-status sent-status">
            ✓
          </span>
        );

      case "FAILED":
        return (
          <span className="message-status failed">
            !
          </span>
        );

      default:
        return null;
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.clear();

    window.location.href = "/login";
  };

  // =========================================================
  // CLICK OUTSIDE MENU
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div className="chat-container">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="chat-sidebar">

        <div
          className="sidebar-header"
          ref={menuRef}
        >

          <h2>
            Chats
          </h2>

          <button onClick={handleLogout}>
            logout
          </button>

          <div className="header-actions">

            <button
              className="icon-button"
              onClick={() =>
                setShowMenu(
                  (value) => !value
                )
              }
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="dropdown-menu">

                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

        {/* SEARCH */}

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

        {/* =================================================
            SEARCH RESULTS
        ================================================= */}

        {search.trim() ? (

          <div className="chat-users">

            {loadingUsers ? (

              <div className="users-loading">
                Searching...
              </div>

            ) : searchUsers.length === 0 ? (

              <div className="no-users">
                No users found
              </div>

            ) : (

              searchUsers.map((user) => (

                <div
                  key={user.id}
                  className="chat-user"
                  onClick={() =>
                    selectSearchUser(user)
                  }
                >

                  <div className="avatar">

                    {(user.displayName ||
                      user.username)
                      .charAt(0)
                      .toUpperCase()}

                    {user.online && (
                      <span className="online-dot" />
                    )}

                  </div>

                  <div className="user-info">

                    <div className="user-name-row">

                      <strong>
                        {user.displayName ||
                          user.username}
                      </strong>

                      <span>
                        {user.online
                          ? "Online"
                          : ""}
                      </span>

                    </div>

                    <p>
                      @{user.username}
                    </p>

                  </div>

                </div>

              ))

            )}

          </div>

        ) : (

          /* =================================================
             CONVERSATIONS
          ================================================= */

          <div className="chat-users">

            {loadingConversations ? (

              <div className="users-loading">
                Loading conversations...
              </div>

            ) : conversations.length === 0 ? (

              <div className="no-users">
                No conversations
              </div>

            ) : (

              conversations.map(
                (conversation, index) => {

                  const isSelected = selectedChat?.userId === conversation.receiverUserId;

                  const name = conversation.receiverDisplayName || conversation.receiverUsername || conversation.groupName || "Unknown";

                  return (
                    <div
                      key={
                        conversation.conversationId ?? `temporary-${conversation.receiverUserId}-${index}`
                      }
                      className={`chat-user ${isSelected ? "active" : "" }`} onClick={() => selectConversation(conversation) }
                    >

                      {/* AVATAR */}

                      <div className="avatar">

                        {name
                          .charAt(0)
                          .toUpperCase()}

                        {conversation.receiverIsOnline && (
                          <span className="online-dot" />
                        )}

                      </div>

                      {/* USER INFO */}

                      <div className="user-info">

                        <div className="user-name-row">

                          <strong>
                            {name}
                          </strong>

                          <span>
                            {formatLastMessageTime(
                              conversation.lastMessageTime
                            )}
                          </span>

                        </div>

                        <p>
                          {conversation.lastMessage ||
                            "No messages yet"}
                        </p>

                      </div>

                      {/* UNREAD COUNT */}

                      {conversation.unreadCount >
                        0 && (
                          <span className="unread-count">
                            {conversation.unreadCount}
                          </span>
                        )}

                    </div>
                  );
                }
              )

            )}

          </div>

        )}

      </aside>

      {/* =================================================
          MAIN CHAT
      ================================================= */}

      <main className="chat-main">

        {!selectedChat ? (

          <div className="empty-chat">

            <div className="empty-chat-icon">

              <MessageCircle size={60} />

            </div>

            <h2>
              Welcome to Chat
            </h2>

            <p>
              Select a conversation
              to start messaging
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                CHAT HEADER
            ================================================= */}

            <header className="chat-header">

              <div className="selected-user">

                <div className="avatar">

                  {selectedChat.displayName
                    .charAt(0)
                    .toUpperCase()}

                  {selectedChat.online && (
                    <span className="online-dot" />
                  )}

                </div>

                <div>

                  <h3>
                    {selectedChat.displayName}
                  </h3>

                  <span>
                    {selectedChat.online
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

            {/* =================================================
                MESSAGES
            ================================================= */}

            <div
              className="messages-container"
              ref={messagesContainerRef}
            >

              {loadingMessages ? (

                <div className="no-messages">
                  <p>
                    Loading messages...
                  </p>
                </div>

              ) : messages.length === 0 ? (

                <div className="no-messages">

                  <MessageCircle size={40} />

                  <p>
                    No messages yet
                  </p>

                  <span>
                    Send a message to
                    start the conversation
                  </span>

                </div>

              ) : (

                messages.map(
                  (msg, index) => {

                    const isSent =
                      msg.senderId ===
                      loggedInUserId;

                    return (
                      <div
                        key={
                          msg.id ??
                          `message-${index}`
                        }
                        className={`message-wrapper ${isSent
                          ? "sent"
                          : "received"
                          }`}
                      >

                        <div className="message">

                          {/* REPLY PREVIEW */}

                          {msg.replyToMessageId && (
                            <div className="reply-preview">
                              Replying to message
                            </div>
                          )}

                          {/* MESSAGE CONTENT */}

                          {renderMessageContent(
                            msg
                          )}

                          {/* MESSAGE META */}

                          <div className="message-meta">

                            <span>
                              {formatMessageTime(
                                msg.createdAt
                              )}
                            </span>

                            {renderMessageStatus(
                              msg
                            )}

                          </div>

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

            {/* =================================================
                MESSAGE INPUT
            ================================================= */}

            <div className="message-input-container">

              <button className="input-icon">
                <Paperclip size={20} />
              </button>

              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {

                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
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

          </>

        )}

      </main>

    </div>
  );
}

export default ChatScreen;

