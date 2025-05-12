import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendSuccessEmail = async (to, orderId, amount, username) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString("vi-VN");
  const dateString = now.toLocaleDateString("vi-VN");

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Tour Booking App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Đặt tour thành công!",
    html: `
      <div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;max-width:600px;margin:auto;">
        <h2 style="color:green">✅ Cảm ơn ${username} đã đặt tour tại <span style="color:#007bff;">Tour Booking App!</span></h2>
        <p style="color:purple">Chúng tôi đã nhận được thanh toán của bạn. Dưới đây là thông tin đơn hàng:</p>

        <table style="width:100%;margin-top:20px;">
          <tr>
            <td><strong>Mã đơn hàng:</strong></td>
            <td>${orderId}</td>
          </tr>
          <tr>
            <td><strong>Số tiền đã thanh toán:</strong></td>
            <td style="color:green">${amount.toLocaleString()}₫</td>
          </tr>
          <tr>
            <td><strong>Ngày thanh toán:</strong></td>
            <td>${timeString} ${dateString}</td>
          </tr>
        </table>

        <p style="margin-top:20px;color:#444;">🌍 Chúng tôi sẽ liên hệ bạn sớm để xác nhận chi tiết hành trình.</p>
        <hr style="margin:20px 0" />
        <p style="font-size:14px;color:#888;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ:<br/>
        Email: <a href="mailto:support@tourapp.com">support@tourapp.com</a><br/>
        Hotline: <strong>1900 9999</strong></p>
        <p style="text-align:center;font-size:12px;color:#aaa;">© 2025 Tour Booking App</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
