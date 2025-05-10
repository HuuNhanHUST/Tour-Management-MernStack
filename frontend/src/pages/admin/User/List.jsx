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
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Load dữ liệu người dùng
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/user`, {
        withCredentials: true,
      });
      setUsers(res.data.data || []);
    } catch (err) {
      setError("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ✅ Đổi quyền user ↔ admin
  const toggleRole = async (id, currentRole) => {
    if (user._id === id) {
      alert("Không thể tự hạ quyền chính mình");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await axios.put(`${BASE_URL}/user/${id}`, { role: newRole }, { withCredentials: true });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );
    } catch {
      alert("Cập nhật quyền thất bại");
    }
  };

  // ✅ Xoá user
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá người dùng này?")) return;
    try {
      await axios.delete(`${BASE_URL}/user/${id}`, { withCredentials: true });
      setUsers(users.filter((u) => u._id !== id));
    } catch {
      alert("Xoá người dùng thất bại!");
    }
  };

  // ✅ Avatar fallback
  const getAvatar = (photo) => {
    if (!photo) return "/default-avatar.png";
    if (photo.startsWith("http")) return photo;
    return `${BASE_URL}/uploads/${photo}`;
  };

  // ✅ Lọc danh sách user
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, search, filterRole]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return <div className="text-center text-danger py-5">{error}</div>;
  }

  return (
    <div>
      <h2 className="mb-4">👤 Quản lý Người dùng</h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          style={{ maxWidth: "300px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Dropdown isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
          <DropdownToggle caret>
            {filterRole === "all" ? "Tất cả" : filterRole === "admin" ? "Admin" : "User"}
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={() => setFilterRole("all")}>Tất cả</DropdownItem>
            <DropdownItem onClick={() => setFilterRole("admin")}>Admin</DropdownItem>
            <DropdownItem onClick={() => setFilterRole("user")}>User</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
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
              <td colSpan="6" className="text-center">Không có người dùng nào</td>
            </tr>
          ) : (
            filteredUsers.map((u, index) => (
              <tr key={u._id}>
                <td>{index + 1}</td>
                <td>
                  <img
                    src={getAvatar(u.photo)}
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                    alt="avatar"
                    width="40"
                    height="40"
                    className="rounded-circle"
                    style={{ objectFit: "cover" }}
                  />
                </td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge bg-${u.role === "admin" ? "danger" : "secondary"}`}>
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
                    Xoá
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default UserList;
