require("dotenv").config();
import nodemailer from "nodemailer";

let sendSimpleEmail = async (dataSend) => {
	let transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.EMAIL_APP, // generated ethereal user
			pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
		},
	});

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"Phạm Đức Tịnh 👻" <phamductinh.t18@gmail.com>', // sender address
		to: dataSend.receiverEmail, // list of receivers
		subject: "Thông tin đặt lịch khám bệnh", // Subject line
		html: getBodyHTMLEmail(dataSend),
	});
};

let getBodyHTMLEmail = (dataSend) => {
	let result = "";
	if (dataSend.language === "vi") {
		result = `
        <h3>Xin chào ${dataSend.patientName}!</h3>
        <p>Bạn nhận được email này vì bạn đã đặt lịch khám bệnh online trên Bookingcare.vn</p>
        <p>Thông tin đặt lịch khám bệnh:</p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Bác sĩ: ${dataSend.doctorName}</b></div>

        <p>Vui lòng click vào đường link bên dưới để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh.</p>
        <div>
            <a href=${dataSend.redirectLink} target="_blank">Click here</a>
        </div>
        <div>Xin chân thành cảm ơn !</div>
    `; // html body
	}
	if (dataSend.language === "en") {
		result = `
        <h3>Dear ${dataSend.patientName}!</h3>
        <p>You received this email because you booked an online medical appointment on Bookingcare.vn</p>
        <p>Information to schedule an appointment:</p>
        <div><b>Time: ${dataSend.time}</b></div>
        <div><b>Name: ${dataSend.doctorName}</b></div>

        <p>Please click on the link below to confirm and complete the procedure to book an appontment.</p>
        <div>
            <a href=${dataSend.redirectLink} target="_blank">Click here</a>
        </div>
        <div>Sincerely thank !</div>
    `; // html body
	}
	return result;
};

module.exports = {
	sendSimpleEmail,
};
