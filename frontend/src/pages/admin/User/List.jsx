import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Table,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { BASE_URL } from "../../../utils/config";
import { AuthContext } from "../../../context/AuthContext";

const UserList = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("🔁 UserList re-render");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/user`, {
        withCredentials: true,
      });

      const newUsers = res.data.data || [];
      console.log("Fetched users:", newUsers);

      setUsers(newUsers);
    } catch (err) {
      console.error("❌ Lỗi fetch users:", err.message);
      setError("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("useEffect fetchUsers chạy");
    fetchUsers();
  }, [fetchUsers]);

  const toggleRole = async (id, currentRole) => {
    if (user._id === id) {
      alert("Không thể tự hạ quyền chính mình");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await axios.put(
        `${BASE_URL}/user/${id}`,
        { role: newRole },
        { withCredentials: true }
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );
    } catch {
      alert("Cập nhật quyền thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá người dùng này?")) return;
    try {
      await axios.delete(`${BASE_URL}/user/${id}`, {
        withCredentials: true,
      });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert("Xoá người dùng thất bại!");
    }
  };

  const getAvatarDisplay = (photo) => {
    if (!photo) return <span className="text-muted">No Avatar</span>;
    if (photo.startsWith("http")) return photo;
    return `${BASE_URL}/uploads/${photo}`;
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, search, filterRole]);

  if (authLoading || loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-danger py-5">{error}</div>;
  }

  return (
    <div className="container py-3">
      <style>
        {`
          .title-3d {
            font-size: 2.5rem;
            font-weight: 700;
            color: #28a745;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3),
                        -2px -2px 4px rgba(255, 255, 255, 0.3);
            margin-bottom: 2rem;
          }

          .table-custom thead {
            background: linear-gradient(145deg, #28a745, #218838);
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
            box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3),
                       -3px -3px 6px rgba(255, 255, 255, 0.3);
          }

          .table-custom th, .table-custom td {
            padding: 1rem;
            vertical-align: middle;
            border: 1px solid rgba(0, 0, 0, 0.1);
            text-align: center;
          }

          .table-custom tbody tr {
            transition: all 0.3s ease;
            background-color: #fff;
          }

          .table-custom tbody tr:hover {
            background-color: #f1f8ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .filter-section {
            background-color: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
          }

          .table-container {
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .table-custom {
            border-collapse: collapse;
          }
        `}
      </style>

      <h3 className="title-3d">
        Quản lý Người dùng
      </h3>

      <div className="filter-section d-flex justify-content-between align-items-center mb-4">
        <Input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          style={{ maxWidth: "300px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Dropdown
          isOpen={dropdownOpen}
          toggle={() => setDropdownOpen(!dropdownOpen)}
        >
          <DropdownToggle caret>
            {filterRole === "all"
              ? "Tất cả"
              : filterRole === "admin"
              ? "Admin"
              : "User"}
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={() => setFilterRole("all")}>Tất cả</DropdownItem>
            <DropdownItem onClick={() => setFilterRole("admin")}>Admin</DropdownItem>
            <DropdownItem onClick={() => setFilterRole("user")}>User</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="table-container">
        <div className="table-responsive">
          <Table className="table table-custom">
            <thead>
              <tr>
                <th>#</th>
                <th>Avatar</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-muted text-center py-4">
                    Không có người dùng nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => (
                  <tr key={u._id}>
                    <td>{index + 1}</td>
                    <td>
                      {u.photo ? (
                        <img
                          src={getAvatarDisplay(u.photo)}
                          onLoad={(e) => (e.target.style.opacity = 1)}
                          onError={(e) => (e.target.style.display = "none")}
                          alt="avatar"
                          width="40"
                          height="40"
                          className="rounded-circle"
                          style={{ objectFit: "cover", opacity: 0, transition: "opacity 0.3s" }}
                        />
                      ) : (
                        <span className="text-muted">No Avatar</span>
                      )}
                    </td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          u.role === "admin" ? "danger" : "secondary"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        disabled={user._id === u._id}
                        onClick={() => toggleRole(u._id, u.role)}
                      >
                        {u.role === "admin" ? "Hạ quyền" : "Cấp quyền"}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(u._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(UserList);