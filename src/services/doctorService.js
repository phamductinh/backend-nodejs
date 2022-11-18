import db from "../models/index";
require("dotenv").config();
import _ from "lodash";

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

let getTopDoctorHome = (limitInput) => {
	return new Promise(async (resolve, reject) => {
		try {
			let users = await db.User.findAll({
				limit: limitInput,
				where: { roleId: "R2" },
				order: [["createdAt", "DESC"]],
				attributes: {
					exclude: ["password"],
				},
				include: [
					{
						model: db.Allcode,
						as: "positionData",
						attributes: ["valueEn", "valueVi"],
					},
					{
						model: db.Allcode,
						as: "genderData",
						attributes: ["valueEn", "valueVi"],
					},
				],
				raw: true,
				nest: true,
			});
			resolve({
				errCode: 0,
				data: users,
			});
		} catch (error) {
			reject(error);
		}
	});
};

let getAllDoctors = () => {
	return new Promise(async (resolve, reject) => {
		try {
			let doctors = await db.User.findAll({
				where: {
					roleId: "R2",
				},
				attributes: {
					exclude: ["password", "image"],
				},
			});
			resolve({
				errCode: 0,
				data: doctors,
			});
		} catch (error) {
			reject(error);
		}
	});
};

let saveDetailInforDoctor = (inputData) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (
				!inputData.doctorId ||
				!inputData.contentHTML ||
				!inputData.contentMarkdown ||
				!inputData.action ||
				!inputData.selectedPrice ||
				!inputData.selectedPayment ||
				!inputData.selectedProvince ||
				!inputData.nameClinic ||
				!inputData.addressClinic ||
				!inputData.note
			) {
				resolve({
					errCode: 1,
					errMessage: "Missing parameter !",
				});
			} else {
				if (inputData.action === "CREATE") {
					await db.Markdown.create({
						contentHTML: inputData.contentHTML,
						contentMarkdown: inputData.contentMarkdown,
						description: inputData.description,
						doctorId: inputData.doctorId,
					});
				} else if (inputData.action === "EDIT") {
					let doctorMarkdown = await db.Markdown.findOne({
						where: { doctorId: inputData.doctorId },
						raw: false,
					});
					if (doctorMarkdown) {
						doctorMarkdown.contentHTML = inputData.contentHTML;
						doctorMarkdown.contentMarkdown =
							inputData.contentMarkdown;
						doctorMarkdown.description = inputData.description;
						doctorMarkdown.createdAt = new Date();

						await doctorMarkdown.save();
					}
				}

				let doctorInfor = await db.Doctor_Infor.findOne({
					where: {
						doctorId: inputData.doctorId,
					},
					raw: false,
				});
				if (doctorInfor) {
					//update
					doctorInfor.doctorId = inputData.doctorId;
					doctorInfor.priceId = inputData.selectedPrice;
					doctorInfor.paymentId = inputData.selectedPayment;
					doctorInfor.provinceId = inputData.selectedProvince;
					doctorInfor.addressClinic = inputData.addressClinic;
					doctorInfor.nameClinic = inputData.nameClinic;
					doctorInfor.note = inputData.note;

					await doctorInfor.save();
				} else {
					//create
					await db.Doctor_Infor.create({
						doctorId: inputData.doctorId,
						priceId: inputData.selectedPrice,
						paymentId: inputData.selectedPayment,
						provinceId: inputData.selectedProvince,
						addressClinic: inputData.addressClinic,
						nameClinic: inputData.nameClinic,
						note: inputData.note,
					});
				}

				resolve({
					errCode: 0,
					errMessage: "Save infor doctor succeed !",
				});
			}
		} catch (error) {
			reject(error);
		}
	});
};

let getDetailDoctorById = (inputId) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!inputId) {
				resolve({
					errCode: 1,
					errMessage: "Missing required parameter",
				});
			} else {
				let data = await db.User.findOne({
					where: {
						id: inputId,
					},
					attributes: {
						exclude: ["password"],
					},
					include: [
						{
							model: db.Markdown,
							attributes: [
								"description",
								"contentHTML",
								"contentMarkdown",
							],
						},
						{
							model: db.Allcode,
							as: "positionData",
							attributes: ["valueEn", "valueVi"],
						},
						{
							model: db.Doctor_Infor,
							attributes: {
								exclude: ["id", "doctorId"],
							},
							include: [
								{
									model: db.Allcode,
									as: "priceTypeData",
									attributes: ["valueEn", "valueVi"],
								},
								{
									model: db.Allcode,
									as: "paymentTypeData",
									attributes: ["valueEn", "valueVi"],
								},
								{
									model: db.Allcode,
									as: "provinceTypeData",
									attributes: ["valueEn", "valueVi"],
								},
							],
						},
					],
					raw: false,
					nest: true,
				});

				if (data && data.image) {
					data.image = new Buffer(data.image, "base64").toString(
						"binary"
					);
				}

				if (!data) data = {};

				resolve({
					errCode: 0,
					data: data,
				});
			}
		} catch (error) {
			reject(error);
		}
	});
};

let bulkCreateSchedule = (data) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!data.arrSchedule || !data.doctorId || !data.formattedDate) {
				resolve({
					errCode: 1,
					arrMessage: "Missing required parameter !",
				});
			} else {
				let schedule = data.arrSchedule;
				if (schedule && schedule.length > 0) {
					schedule = schedule.map((item) => {
						item.maxNumber = MAX_NUMBER_SCHEDULE;
						return item;
					});
				}
				let existing = await db.Schedule.findAll({
					where: {
						doctorId: data.doctorId,
						date: data.formattedDate,
					},
					attributes: ["timeType", "date", "doctorId", "maxNumber"],
					raw: true,
				});

				let toCreate = _.differenceWith(schedule, existing, (a, b) => {
					return a.timeType === b.timeType && +a.date === +b.date;
				});

				if (toCreate && toCreate.length > 0) {
					await db.Schedule.bulkCreate(toCreate);
				}

				resolve({
					errCode: 0,
					errMessage: "Ok",
				});
			}
		} catch (error) {
			reject(error);
		}
	});
};

let getScheduleByDate = (doctorId, date) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!doctorId || !date) {
				resolve({
					errCode: 1,
					errMessage: "Missing required parameter !",
				});
			} else {
				let dataSchedule = await db.Schedule.findAll({
					where: {
						doctorId: doctorId,
						date: date,
					},
					include: [
						{
							model: db.Allcode,
							as: "timeTypeData",
							attributes: ["valueEn", "valueVi"],
						},
					],
					raw: false,
					nest: true,
				});
				if (!dataSchedule) dataSchedule = [];
				resolve({
					errCode: 0,
					data: dataSchedule,
				});
			}
		} catch (error) {
			reject(error);
		}
	});
};

module.exports = {
	getTopDoctorHome: getTopDoctorHome,
	getAllDoctors: getAllDoctors,
	saveDetailInforDoctor: saveDetailInforDoctor,
	getDetailDoctorById: getDetailDoctorById,
	bulkCreateSchedule: bulkCreateSchedule,
	getScheduleByDate: getScheduleByDate,
};
