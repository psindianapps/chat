import commonAxios from "./commonAxios";



export const register = (formData) => {
  return commonAxios.post("/public/register", formData);
};

export const login = (formData) => {
  return commonAxios.post("/public/login", formData);
};


export const getUsers = (search = "", page = 0) => {
    return commonAxios.get("/chat/users", {
        params: {
            search: search,
            page
        }
    });
};

export const getConversation = () => {
    return commonAxios.get("/chat/conversations", {
        params: {
        }
    });
};
export const getConversationMessages = (conversationId=0) => {
    return commonAxios.get("/chat/messages/"+ conversationId, {
        params: {
        }
    });
};
