import { createContext, useReducer, useEffect, useMemo } from "react";
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

  useEffect(() => {
    let isMounted = true;
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser) {
      dispatch({ type: "LOGIN_SUCCESS", payload: storedUser });
    } else {
      const fetchUserFromCookie = async () => {
        try {
          const res = await axios.get("http://localhost:4000/api/v1/auth/me", {
            withCredentials: true,
          });

          if (res.data?.data && isMounted) {
           const rawUser = res.data?.data;

if (!rawUser || (!rawUser._id && !rawUser.id)) {
  dispatch({ type: "LOGOUT" });
  return;
}

const fixedUser = {
  ...rawUser,
  _id: rawUser._id ?? rawUser.id
};

            dispatch({ type: "LOGIN_SUCCESS", payload: fixedUser });
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

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem("user", JSON.stringify(state.user));
    } else {
      localStorage.removeItem("user");
    }
  }, [state.user]);

  // Chỉ memo các giá trị state, không đưa dispatch vào
  const contextValue = useMemo(() => ({
    user: state.user,
    loading: state.loading,
    error: state.error,
  }), [state.user, state.loading, state.error]);

  return (
    <AuthContext.Provider value={{ ...contextValue, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
