import { createContext, useReducer, useEffect } from "react";

// Tạo context
export const AuthContext = createContext();

// Khởi tạo state ban đầu
const INITIAL_STATE = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  loading: false,
  error: null,
};

// Reducer xử lý các action
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

// Provider
export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  // Lưu user vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(state.user));
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
