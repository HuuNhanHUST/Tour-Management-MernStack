import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/config';
import { Table } from 'reactstrap';

const LoginHistory = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user/login-history`, {
          withCredentials: true
        });
        setLogs(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải lịch sử đăng nhập");
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="container py-4">
      <h3 className="mb-4">📋 Lịch sử đăng nhập</h3>

      {error && <p className="text-danger">{error}</p>}

      {logs.length === 0 ? (
        <p className="text-muted">Không có dữ liệu.</p>
      ) : (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Tài khoản</th>
              <th>Email</th>
              <th>IP</th>
              <th>Thiết bị</th>
              <th>Thời gian</th>
              <th>Cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={log._id}>
                <td>{index + 1}</td>
                <td>{log.userId?.username || "?"}</td>
                <td>{log.userId?.email || "?"}</td>
                <td>{log.ipAddress}</td>
                <td>{log.userAgent.slice(0, 40)}</td>
                <td>{new Date(log.loginAt).toLocaleString("vi-VN")}</td>
                <td>
                  {log.isSuspicious ? (
                    <span className="badge bg-danger">Bất thường</span>
                  ) : (
                    <span className="badge bg-secondary">Bình thường</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default LoginHistory;
