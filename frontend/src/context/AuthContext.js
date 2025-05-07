import { createContext, useReducer, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const INITIAL_STATE = {
  user: null,
  loading: true,
  error: null,
};

const AuthReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { user: null, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return { user: action.payload, loading: false, error: null };
    case "LOGIN_FAILURE":
      return { user: null, loading: false, error: action.payload };
    case "REGISTER_SUCCESS":
      return { user: null, loading: false, error: null };
    case "LOGOUT":
      return { user: null, loading: false, error: null };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  // ✅ Khi app khởi chạy, lấy user từ localStorage hoặc từ cookie (nếu login bằng Facebook)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser) {
      dispatch({ type: "LOGIN_SUCCESS", payload: storedUser });
    } else {
      // 🆕 Gọi API /me nếu không có trong localStorage (login Facebook)
      const fetchUserFromCookie = async () => {
        try {
          const res = await axios.get("http://localhost:4000/api/v1/auth/me", {
            withCredentials: true,
          });

          if (res.data?.data) {
            dispatch({ type: "LOGIN_SUCCESS", payload: res.data.data });
          } else {
            dispatch({ type: "LOGOUT" });
          }
        } catch (err) {
          console.error("Không thể lấy user từ cookie:", err.message);
          dispatch({ type: "LOGOUT" });
        }
      };

      fetchUserFromCookie();
    }
  }, []);

  // ✅ Đồng bộ localStorage mỗi khi user thay đổi
  useEffect(() => {
    if (state.user) {
      localStorage.setItem("user", JSON.stringify(state.user));
    } else {
      localStorage.removeItem("user");
    }
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
