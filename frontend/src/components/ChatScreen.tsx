import { useEffect, useRef, useState } from "react";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  MessageCircle,
} from "lucide-react";

import "./chat.scss";
import {
  getConversation,
  getConversationMessages,
  getUsers,
} from "../apis/apis";

/* =========================================================
   DTO TYPES
========================================================= */

interface Conversation {
  conversationId: number | null;
  type: string;

  groupName?: string | null;
  groupIconUrl?: string | null;

  otherUserId?: number | null;
  otherUsername?: string | null;
  otherDisplayName?: string | null;
  otherProfilePic?: string | null;
  otherIsOnline?: boolean;

  lastMessage?: string | null;
  lastMessageType?: string | null;
  lastMessageTime?: string | null;
  lastMessageSenderId?: number | null;

  unreadCount: number;
}

interface ChatUser {
  id: number;
  username: string;
  displayName?: string | null;
  profilePicUrl?: string | null;
  online?: boolean;
}

interface SelectedChat {
  conversationId: number | null;

  userId: number;

  username: string;

  displayName: string;

  profilePicUrl?: string | null;

  online: boolean;
}

/*
 * Backend MessageResponseDTO
 */
interface Message {
  id: number;

  conversationId: number;

  senderId: number;

  senderUsername?: string | null;

  senderDisplayName?: string | null;

  messageType: string;

  content?: string | null;

  mediaId?: number | null;

  fileUrl?: string | null;

  thumbnailUrl?: string | null;

  fileType?: string | null;

  durationSeconds?: number | null;

  replyToMessageId?: number | null;

  status?: string | null;

  createdAt: string;
}

/*
 * WebSocket request DTO
 *
 * This is intentionally different from Message response DTO.
 */
interface SendMessageRequest {
  conversationId?: number;

  receiverId: number;

  messageType: string;

  content?: string;

  mediaId?: number;

  replyToMessageId?: number;
}

/* =========================================================
   COMPONENT
========================================================= */

function ChatScreen() {
  /* =======================================================
     AUTH
  ======================================================= */

  const currentUserId = Number(
    localStorage.getItem("id")
  );

  const token = localStorage.getItem("token");

  /* =======================================================
     SIDEBAR STATE
  ======================================================= */

  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [
    searchUsers,
    setSearchUsers,
  ] = useState<ChatUser[]>([]);

  const [search, setSearch] = useState("");

  const [
    loadingConversations,
    setLoadingConversations,
  ] = useState(false);

  const [
    loadingUsers,
    setLoadingUsers,
  ] = useState(false);

  /* =======================================================
     CHAT STATE
  ======================================================= */

  const [
    selectedChat,
    setSelectedChat,
  ] = useState<SelectedChat | null>(null);

  /* =======================================================
     MESSAGE STATE
  ======================================================= */

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  /* =======================================================
     MENU
  ======================================================= */

  const [showMenu, setShowMenu] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  /* =======================================================
     WEBSOCKET
  ======================================================= */

  const socket =
    useRef<WebSocket | null>(null);

  /* =======================================================
     MESSAGE SCROLL
  ======================================================= */

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(null);

  /* =======================================================
     LOAD CONVERSATIONS
  ======================================================= */

  const loadConversation = async () => {
    try {
      setLoadingConversations(true);

      const response =
        await getConversation();

      const data = response.data;

      if (data.code === 200) {
        setConversations(
          data.data || []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load conversations:",
        error
      );
    } finally {
      setLoadingConversations(false);
    }
  };

  /* =======================================================
     LOAD MESSAGES
  ======================================================= */

  const loadMessages = async (
    conversationId: number
  ) => {
    try {
      setLoadingMessages(true);

      const response =
        await getConversationMessages(
          conversationId
        );

      const data = response.data;

      if (data.code === 200) {
        setMessages(
          data.data || []
        );
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error(
        "Failed to load messages:",
        error
      );

      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadConversation();
  }, []);

  /* =======================================================
     USER SEARCH
  ======================================================= */

  const loadUsers = async (
    searchValue: string,
    pageNumber = 0
  ) => {
    try {
      setLoadingUsers(true);

      const response =
        await getUsers(
          searchValue,
          pageNumber
        );

      const data =
        response.data.data;

      setSearchUsers(
        data.content || []
      );
    } catch (error) {
      console.error(
        "Failed to load users:",
        error
      );

      setSearchUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const searchValue =
      search.trim();

    if (!searchValue) {
      setSearchUsers([]);
      return;
    }

    const timeout =
      setTimeout(() => {
        loadUsers(
          searchValue,
          0
        );
      }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [search]);

  /* =======================================================
     CREATE SELECTED CHAT
  ======================================================= */

  const createSelectedChatFromConversation = (
    conversation: Conversation
  ): SelectedChat | null => {
    /*
     * Currently group chat is not handled
     * in this individual-chat screen.
     */
    if (
      conversation.type !==
        "INDIVIDUAL" ||
      !conversation.otherUserId
    ) {
      return null;
    }

    return {
      conversationId:
        conversation.conversationId,

      userId:
        conversation.otherUserId,

      username:
        conversation.otherUsername ||
        "",

      displayName:
        conversation.otherDisplayName ||
        conversation.otherUsername ||
        "",

      profilePicUrl:
        conversation.otherProfilePic,

      online:
        conversation.otherIsOnline ||
        false,
    };
  };

  /* =======================================================
     SELECT EXISTING CONVERSATION
  ======================================================= */

  const selectConversation = (
    conversation: Conversation
  ) => {
    const chat =
      createSelectedChatFromConversation(
        conversation
      );

    if (!chat) {
      return;
    }

    setSelectedChat(chat);

    /*
     * Clear unread count because
     * user opened the conversation.
     */
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

    /*
     * Clear search.
     */
    setSearch("");
    setSearchUsers([]);

    /*
     * Load conversation messages.
     */
    if (
      conversation.conversationId
    ) {
      loadMessages(
        conversation.conversationId
      );
    } else {
      setMessages([]);
    }
  };

  /* =======================================================
     SELECT SEARCH USER
  ======================================================= */

  const selectSearchUser = (
    user: ChatUser
  ) => {
    /*
     * First check if conversation
     * already exists.
     */
    const existingConversation =
      conversations.find(
        (conversation) =>
          conversation.type ===
            "INDIVIDUAL" &&
          conversation.otherUserId ===
            user.id &&
          conversation.conversationId !==
            null
      );

    /*
     * Existing conversation.
     */
    if (existingConversation) {
      selectConversation(
        existingConversation
      );

      return;
    }

    /*
     * New conversation.
     *
     * There is no conversationId yet.
     */
    const newChat: SelectedChat = {
      conversationId: null,

      userId: user.id,

      username:
        user.username,

      displayName:
        user.displayName ||
        user.username,

      profilePicUrl:
        user.profilePicUrl,

      online:
        user.online || false,
    };

    setSelectedChat(newChat);

    /*
     * No messages because
     * conversation doesn't exist.
     */
    setMessages([]);

    /*
     * Create temporary conversation
     * and put it at the top.
     */
    const temporaryConversation: Conversation = {
      conversationId: null,

      type: "INDIVIDUAL",

      otherUserId:
        user.id,

      otherUsername:
        user.username,

      otherDisplayName:
        user.displayName ||
        user.username,

      otherProfilePic:
        user.profilePicUrl,

      otherIsOnline:
        user.online || false,

      lastMessage: null,

      lastMessageType: null,

      lastMessageTime: null,

      lastMessageSenderId: null,

      unreadCount: 0,
    };

    setConversations((prev) => {
      const filtered =
        prev.filter(
          (conversation) =>
            conversation.otherUserId !==
            user.id
        );

      return [
        temporaryConversation,
        ...filtered,
      ];
    });

    /*
     * Clear search.
     */
    setSearch("");
    setSearchUsers([]);
  };

  /* =======================================================
     UPDATE SIDEBAR
     AFTER MESSAGE
  ======================================================= */

  const updateConversationAfterMessage = (
    receivedMessage: Message
  ) => {
    if (
      !receivedMessage.senderId
    ) {
      return;
    }

    /*
     * Determine other user.
     *
     * Message DTO doesn't contain receiverId,
     * so for received messages senderId is enough.
     *
     * For our own message we use selectedChat.
     */
    let otherUserId: number | null =
      null;

    if (
      receivedMessage.senderId ===
      currentUserId
    ) {
      otherUserId =
        selectedChat?.userId ||
        null;
    } else {
      otherUserId =
        receivedMessage.senderId;
    }

    if (!otherUserId) {
      return;
    }

    setConversations((prev) => {
      /*
       * Existing conversation.
       */
      const existing =
        prev.find(
          (conversation) =>
            conversation.otherUserId ===
            otherUserId
        );

      if (existing) {
        const updated: Conversation =
          {
            ...existing,

            /*
             * Important:
             *
             * If backend returned a real
             * conversationId, replace
             * temporary null ID.
             */
            conversationId:
              receivedMessage.conversationId ||
              existing.conversationId,

            lastMessage:
              getMessagePreview(
                receivedMessage
              ),

            lastMessageType:
              receivedMessage.messageType,

            lastMessageTime:
              receivedMessage.createdAt,

            lastMessageSenderId:
              receivedMessage.senderId,

            unreadCount:
              selectedChat?.userId ===
                otherUserId
                ? 0
                : receivedMessage.senderId ===
                  currentUserId
                ? 0
                : existing.unreadCount +
                  1,
          };

        const remaining =
          prev.filter(
            (conversation) =>
              conversation.otherUserId !==
              otherUserId
          );

        /*
         * Move latest conversation
         * to top.
         */
        return [
          updated,
          ...remaining,
        ];
      }

      /*
       * New conversation.
       *
       * This normally happens when
       * first message creates a conversation.
       */
      if (
        selectedChat &&
        selectedChat.userId ===
          otherUserId
      ) {
        const newConversation:
          Conversation = {
            conversationId:
              receivedMessage.conversationId,

            type: "INDIVIDUAL",

            otherUserId:
              selectedChat.userId,

            otherUsername:
              selectedChat.username,

            otherDisplayName:
              selectedChat.displayName,

            otherProfilePic:
              selectedChat.profilePicUrl,

            otherIsOnline:
              selectedChat.online,

            lastMessage:
              getMessagePreview(
                receivedMessage
              ),

            lastMessageType:
              receivedMessage.messageType,

            lastMessageTime:
              receivedMessage.createdAt,

            lastMessageSenderId:
              receivedMessage.senderId,

            unreadCount: 0,
          };

        return [
          newConversation,
          ...prev,
        ];
      }

      return prev;
    });

    /*
     * If this was a new conversation,
     * update selectedChat with the real
     * conversationId.
     */
    if (
      selectedChat &&
      selectedChat.userId ===
        otherUserId &&
      receivedMessage.conversationId
    ) {
      setSelectedChat((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,

          conversationId:
            receivedMessage.conversationId,
        };
      });
    }
  };

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage = () => {
    const messageText =
      message.trim();

    if (!messageText) {
      return;
    }

    if (!selectedChat) {
      return;
    }

    if (
      !socket.current ||
      socket.current.readyState !==
        WebSocket.OPEN
    ) {
      console.error(
        "❌ WebSocket is not connected"
      );

      return;
    }

    /*
     * WebSocket request.
     *
     * Don't send Message response DTO.
     */
    const chatMessage:
      SendMessageRequest = {
      /*
       * For existing conversation
       * conversationId is available.
       *
       * For new conversation it will
       * be undefined.
       */
      conversationId:
        selectedChat.conversationId ||
        undefined,

      receiverId:
        selectedChat.userId,

      messageType:
        "TEXT",

      content:
        messageText,
    };

    console.log(
      "📤 Sending:",
      chatMessage
    );

    /*
     * Send to Spring Boot.
     */
    socket.current.send(
      JSON.stringify(
        chatMessage
      )
    );

    /*
     * Don't add optimistic Message here.
     *
     * Backend will return MessageDTO
     * through WebSocket.
     *
     * This prevents duplicate messages.
     */
    setMessage("");
  };

  /* =======================================================
     WEBSOCKET
  ======================================================= */

  useEffect(() => {
    if (!token) {
      console.error(
        "❌ Token not found"
      );

      return;
    }

    console.log(
      "Connecting WebSocket..."
    );

    const ws = new WebSocket(
      `ws://localhost:8086/chat?token=${token}`
    );

    ws.onopen = () => {
      console.log(
        "✅ WebSocket connected"
      );
    };

    ws.onmessage = (event) => {
      console.log(
        "📩 Received:",
        event.data
      );

      try {
        const receivedMessage:
          Message =
          JSON.parse(
            event.data
          );

        /*
         * Validate basic message structure.
         */
        if (
          !receivedMessage ||
          !receivedMessage.id
        ) {
          return;
        }

        /*
         * Check whether this message
         * belongs to current conversation.
         */
        setSelectedChat(
          (currentChat) => {
            if (!currentChat) {
              return currentChat;
            }

            const belongsToCurrentChat =
              currentChat.conversationId !==
                null &&
              receivedMessage.conversationId ===
                currentChat.conversationId;

            /*
             * New conversation:
             *
             * We don't have conversationId
             * yet, so check sender.
             */
            const belongsToNewChat =
              currentChat.conversationId ===
                null &&
              (
                receivedMessage.senderId ===
                  currentChat.userId ||
                receivedMessage.senderId ===
                  currentUserId
              );

            if (
              belongsToCurrentChat ||
              belongsToNewChat
            ) {
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

                if (
                  alreadyExists
                ) {
                  return prev;
                }

                return [
                  ...prev,
                  receivedMessage,
                ];
              });

              /*
               * If backend generated a
               * conversation ID, update it.
               */
              if (
                receivedMessage
                  .conversationId &&
                currentChat.conversationId !==
                  receivedMessage.conversationId
              ) {
                return {
                  ...currentChat,

                  conversationId:
                    receivedMessage.conversationId,
                };
              }
            }

            return currentChat;
          }
        );

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
     * WebSocket should only be
     * created once.
     *
     * Don't put selectedChat in
     * dependency array.
     */
    return () => {
      ws.close();

      if (
        socket.current === ws
      ) {
        socket.current = null;
      }
    };
  }, [token]);

  /* =======================================================
     AUTO SCROLL MESSAGES
  ======================================================= */

  useEffect(() => {
    const container =
      messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop =
      container.scrollHeight;
  }, [messages]);

  /* =======================================================
     UPDATE SIDEBAR MESSAGE
  ======================================================= */

  const getMessagePreview = (
    msg: Message
  ): string => {
    switch (
      msg.messageType
    ) {
      case "IMAGE":
        return (
          msg.content ||
          "📷 Image"
        );

      case "VIDEO":
        return (
          msg.content ||
          "🎥 Video"
        );

      case "AUDIO":
        return (
          msg.content ||
          "🎵 Audio"
        );

      case "FILE":
        return (
          msg.content ||
          "📎 File"
        );

      default:
        return (
          msg.content ||
          ""
        );
    }
  };

  /* =======================================================
     FORMAT TIME
  ======================================================= */

  const formatLastMessageTime = (
    date?: string | null
  ) => {
    if (!date) {
      return "";
    }

    const messageDate =
      new Date(date);

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

  const formatMessageTime = (
    date?: string
  ) => {
    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

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

  /* =======================================================
     RENDER MESSAGE CONTENT
  ======================================================= */

  const renderMessageContent = (
    msg: Message
  ) => {
    switch (
      msg.messageType
    ) {
      /* ================= TEXT ================= */

      case "TEXT":
        return (
          <p>
            {msg.content}
          </p>
        );

      /* ================= IMAGE ================= */

      case "IMAGE":
        return (
          <div className="message-image">

            {msg.fileUrl && (
              <img
                src={
                  msg.fileUrl
                }
                alt={
                  msg.content ||
                  "Image"
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

      /* ================= VIDEO ================= */

      case "VIDEO":
        return (
          <div className="message-video">

            <video
              controls
              src={
                msg.fileUrl ||
                ""
              }
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

      /* ================= AUDIO ================= */

      case "AUDIO":
        return (
          <div className="message-audio">

            <audio
              controls
              src={
                msg.fileUrl ||
                ""
              }
            />

            {msg.content && (
              <p>
                {msg.content}
              </p>
            )}

          </div>
        );

      /* ================= FILE ================= */

      case "FILE":
        return (
          <div className="message-file-wrapper">

            <a
              href={
                msg.fileUrl ||
                "#"
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

      /* ================= DEFAULT ================= */

      default:
        return (
          <p>
            {msg.content}
          </p>
        );
    }
  };

  /* =======================================================
     MESSAGE STATUS
  ======================================================= */

  const renderMessageStatus = (
    msg: Message
  ) => {
    if (
      msg.senderId !==
      currentUserId
    ) {
      return null;
    }

    switch (
      msg.status
    ) {
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

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    localStorage.clear();

    window.location.href =
      "/login";
  };

  /* =======================================================
     OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="chat-container">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="chat-sidebar">

        {/* HEADER */}

        <div
          className="sidebar-header"
          ref={menuRef}
        >

          <h2>
            Chats
          </h2>

          <div className="header-actions">

            <button
              className="icon-button"
              onClick={() =>
                setShowMenu(
                  (value) =>
                    !value
                )
              }
            >
              <MoreVertical
                size={20}
              />
            </button>

            {showMenu && (
              <div className="dropdown-menu">

                <button
                  className="dropdown-item"
                  onClick={
                    handleLogout
                  }
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

        {/* SEARCH */}

        <div className="search-box">

          <Search
            size={18}
          />

          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(
              event
            ) =>
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

            ) : searchUsers.length ===
              0 ? (

              <div className="no-users">
                No users found
              </div>

            ) : (

              searchUsers.map(
                (user) => (

                  <div
                    key={
                      user.id
                    }
                    className="chat-user"
                    onClick={() =>
                      selectSearchUser(
                        user
                      )
                    }
                  >

                    <div className="avatar">

                      {(
                        user.displayName ||
                        user.username
                      )
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
                        @{
                          user.username
                        }
                      </p>

                    </div>

                  </div>
                )
              )

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

            ) : conversations.length ===
              0 ? (

              <div className="no-users">
                No conversations
              </div>

            ) : (

              conversations.map(
                (
                  conversation,
                  index
                ) => {

                  const isSelected =
                    selectedChat?.userId ===
                    conversation.otherUserId;

                  const name =
                    conversation.otherDisplayName ||
                    conversation.otherUsername ||
                    conversation.groupName ||
                    "Unknown";

                  return (
                    <div
                      key={
                        conversation.conversationId ??
                        `temporary-${conversation.otherUserId}-${index}`
                      }
                      className={`chat-user ${
                        isSelected
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        selectConversation(
                          conversation
                        )
                      }
                    >

                      {/* AVATAR */}

                      <div className="avatar">

                        {name
                          .charAt(0)
                          .toUpperCase()}

                        {conversation.otherIsOnline && (
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

        {/* =================================================
            NO CHAT SELECTED
        ================================================= */}

        {!selectedChat ? (

          <div className="empty-chat">

            <div className="empty-chat-icon">

              <MessageCircle
                size={60}
              />

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

          /* =================================================
             SELECTED CHAT
          ================================================= */

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
                  <Phone
                    size={20}
                  />
                </button>

                <button>
                  <Video
                    size={20}
                  />
                </button>

                <button>
                  <MoreVertical
                    size={20}
                  />
                </button>

              </div>

            </header>

            {/* =================================================
                MESSAGES
            ================================================= */}

            <div
              className="messages-container"
              ref={
                messagesContainerRef
              }
            >

              {loadingMessages ? (

                <div className="no-messages">

                  <p>
                    Loading messages...
                  </p>

                </div>

              ) : messages.length ===
                0 ? (

                <div className="no-messages">

                  <MessageCircle
                    size={40}
                  />

                  <p>
                    No messages yet
                  </p>

                  <span>
                    Send a message to
                    start the
                    conversation
                  </span>

                </div>

              ) : (

                messages.map(
                  (
                    msg,
                    index
                  ) => {

                    const isSent =
                      msg.senderId ===
                      currentUserId;

                    return (
                      <div
                        key={
                          msg.id ??
                          `message-${index}`
                        }
                        className={`message-wrapper ${
                          isSent
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

              <button
                className="input-icon"
              >
                <Paperclip
                  size={20}
                />
              </button>

              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {

                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    sendMessage();
                  }

                }}
              />

              <button
                className="input-icon"
              >
                <Smile
                  size={20}
                />
              </button>

              <button
                className="send-button"
                onClick={
                  sendMessage
                }
              >
                <Send
                  size={19}
                />
              </button>

            </div>

          </>
        )}

      </main>

    </div>
  );
}

export default ChatScreen;