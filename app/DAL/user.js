require('dotenv').config();
const dateFormat = require('dateformat');
var path = require('path');
const excelToJson = require('convert-excel-to-json');

const getUsers = async () => {
  try {
    var xlsxDB = path.join(__dirname, '../../DB/ARMS.xls');

    const result = excelToJson({
      sourceFile: xlsxDB
    });

    const users = result.EmpMst.map(x => {
      return {
        empCode: x.A,
        cardNo: x.B,
        name: x.C,
      }
    });
    return users.filter(y => y.empCode != "EmpCode");

  } catch (error) {
    console.error(error);
  }
}

const getUserAttendence = async (empCode) => {
  try {
    var xlsxDB = path.join(__dirname, '../../DB/ARMS.xls');

    const result = excelToJson({
      sourceFile: xlsxDB
    });

    let attendance = result.MmmYyyyTrn.map(x => {
      return {
        empCode: x.A,
        cardNo: x.B,
        dateTrn: x.C,
        entryReq: x.D,
        entryMade: x.E,
        shift: x.F,
        catId: x.G,
        arrTim: x.H,
        depTim: x.M,
        wrkHrs: x.O,
        Present: x.AN,
        Absent: x.AO,
        Paid_Lv: x.AQ,
        UnPaid_Lv: x.AR,
        Deptid: x.AZ,
        ActBreak: x.L,
        OvTim: x.P,
      }
    });
    //remove columns row
    attendance = attendance.filter(y => y.empCode != "EmpCode");
    const empAttendances = attendance.filter(y => y.empCode == empCode);
    const aryAttendance = [];
    for (const attendance of empAttendances) {
      const arrivalTime = timeConverter(attendance.arrTim);
      const departureTime = timeConverter(attendance.depTim);
      const workingHours = timeConverter(attendance.wrkHrs);
      const objAttendance = {
        dateTrn: dateFormat(new Date(attendance.dateTrn), 'mediumDate'),
        arrivalTime,
        departureTime,
        workingHours,
      };
      aryAttendance.push(objAttendance);
    }
    const sundayCount = await sundayCountInMonth(2019, 07);
    return {
      empAttendances: aryAttendance,
      sundayCount,
    };
  } catch (error) {
    console.error(error);
  }
}

const timeConverter = (arrTim) => {
  let newArrivalTime;
  if (arrTim.toLowerCase().indexOf('+') > -1) {
    const aryTime = arrTim.split('+');
    let initialTime = aryTime[0];
    if(initialTime.indexOf('e') > -1){
      initialTime = initialTime.substring(0, initialTime.length - 1);
    }
    const number = parseInt(aryTime[1]);
    if (number > 0) {
      let multipotent = 1;
      for (let i = 1; i <= number; i += 1) {
        multipotent = multipotent * 10;
      }
      newArrivalTime = initialTime * multipotent;
      return newArrivalTime.toFixed(2);
    }
  }
  if (arrTim.toLowerCase().indexOf('-') > -1) {
    const aryTime = arrTim.split('-');
    let initialTime = aryTime[0];
    if(initialTime.indexOf('e') > -1){
      initialTime = initialTime.substring(0, initialTime.length - 1);
    }
    const number = parseInt(aryTime[1]);
    if (number > 0) {
      let divident = 1;
      for (let i = 1; i <= number; i += 1) {
        divident = divident * 10;
      }

      newArrivalTime = initialTime / divident;
      return newArrivalTime.toFixed(2);
    }
  }
  if(arrTim.indexOf('e') > -1){
    const aryTime = arrTim.split('e');
    return Number(aryTime[0]).toFixed(2);
  }
  return arrTim.toFixed(2);
}

const sundayCountInMonth = async (year, month) => {
  let day = 1;
  let counter = 0;
  let date = new Date(year, month, day);
  while (date.getMonth() === month) {
    if (date.getDay() === 0) { // Sun=0, Mon=1, Tue=2, etc.
      counter += 1;
    }
    day += 1;
    date = new Date(year, month, day);
  }
  return counter;
}

module.exports = {
  getUsers,
  getUserAttendence,
};