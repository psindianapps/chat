import commonAxios from "./commonAxios";



export const register = (formData) => {
  return commonAxios.post("/public/register", formData);
};

export const login = (formData) => {
  return commonAxios.post("/public/login", formData);
};
