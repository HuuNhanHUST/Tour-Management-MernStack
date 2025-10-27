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

export const sendCancellationEmail = async (to, orderId, tourName, username, reason = "auto-timeout") => {
  const now = new Date();
  const timeString = now.toLocaleTimeString("vi-VN");
  const dateString = now.toLocaleDateString("vi-VN");

  const reasonText = reason === "auto-timeout" 
    ? "Đơn đặt tour của bạn đã bị hủy tự động do không hoàn thành thanh toán trong thời gian quy định (15 phút)."
    : "Đơn đặt tour của bạn đã bị hủy.";

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
    subject: "❌ Đơn đặt tour đã bị hủy",
    html: `
      <div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;max-width:600px;margin:auto;">
        <h2 style="color:#dc3545">❌ Đơn đặt tour đã bị hủy</h2>
        <p>Xin chào ${username},</p>
        <p style="color:#666;">${reasonText}</p>

        <table style="width:100%;margin-top:20px;background:#f8f9fa;padding:15px;border-radius:5px;">
          <tr>
            <td><strong>Mã đơn hàng:</strong></td>
            <td>${orderId}</td>
          </tr>
          <tr>
            <td><strong>Tour:</strong></td>
            <td>${tourName}</td>
          </tr>
          <tr>
            <td><strong>Thời gian hủy:</strong></td>
            <td>${timeString} ${dateString}</td>
          </tr>
        </table>

        <p style="margin-top:20px;color:#444;">💡 <strong>Bạn có thể đặt lại tour bất cứ lúc nào!</strong></p>
        <p style="color:#666;">Chúng tôi luôn sẵn sàng phục vụ bạn. Hãy đặt tour và hoàn thành thanh toán trong vòng 15 phút để đảm bảo chỗ của bạn.</p>
        
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

export const sendPaymentWarningEmail = async (to, orderId, tourName, username, minutesLeft) => {
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
    subject: "⚠️ Nhắc nhở: Hoàn thành thanh toán đặt tour",
    html: `
      <div style="font-family:sans-serif;padding:20px;border:1px solid #ffc107;border-radius:8px;max-width:600px;margin:auto;background:#fff9e6;">
        <h2 style="color:#ff9800">⏰ Thời gian thanh toán sắp hết!</h2>
        <p>Xin chào ${username},</p>
        <p style="color:#666;">Đơn đặt tour của bạn đang chờ thanh toán. Bạn còn <strong style="color:#dc3545;">${minutesLeft} phút</strong> để hoàn thành thanh toán.</p>

        <table style="width:100%;margin-top:20px;background:#fff;padding:15px;border-radius:5px;">
          <tr>
            <td><strong>Mã đơn hàng:</strong></td>
            <td>${orderId}</td>
          </tr>
          <tr>
            <td><strong>Tour:</strong></td>
            <td>${tourName}</td>
          </tr>
          <tr>
            <td><strong>Thời gian còn lại:</strong></td>
            <td style="color:#dc3545;font-weight:bold;">${minutesLeft} phút</td>
          </tr>
        </table>

        <div style="margin-top:20px;padding:15px;background:#fff;border-left:4px solid #dc3545;border-radius:5px;">
          <p style="margin:0;color:#dc3545;font-weight:bold;">⚠️ Lưu ý quan trọng:</p>
          <p style="margin:5px 0 0 0;color:#666;">Nếu bạn không hoàn thành thanh toán trong ${minutesLeft} phút, đơn đặt tour sẽ tự động bị hủy để giải phóng chỗ cho khách hàng khác.</p>
        </div>

        <p style="margin-top:20px;color:#444;">💡 <strong>Vui lòng hoàn thành thanh toán ngay để đảm bảo chỗ của bạn!</strong></p>
        
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
