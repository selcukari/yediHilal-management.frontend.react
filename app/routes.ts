import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/member.tsx"), route("login", "routes/login.tsx"), route("users", "routes/user.tsx"), route("communication-mails", "routes/communication/mail.tsx"),
  route("communication-sms", "routes/communication/sms.tsx"), route("stocks", "routes/stock/stock.tsx"), route("stockExpenses", "routes/stock/stockUsedExpense.tsx"),
  route("stockDeposits", "routes/stock/stockUsedDeposit.tsx"), route("projects", "routes/project.tsx"), route("finances", "routes/finance.tsx"),
  route("meetings", "routes/meeting.tsx"), route("vehicles", "routes/vehicle/vehicle.tsx"), route("vehicleDeposits", "routes/vehicle/vehicleDeposits.tsx"),
  route("communication-automaticSmsManagement", "routes/communication/automaticSmsManagement.tsx"), route("communication-automaticMailManagement", "routes/communication/automaticMailManagement.tsx"),
  route("branches", "routes/branch.tsx"), route("university-branches", "routes/universityBranch.tsx"), route("settings-userDuty", "routes/settings/userDuty.tsx"), route("settings-meetingType", "routes/settings/meetingType.tsx"),
  route("memberCreate", "routes/memberCreate.tsx"), route("documentTrackings", "routes/documentTracking.tsx"), route("phoneCallTrackings", "routes/phoneCallTracking.tsx"),
  route("privacyPolicy", "routes/privacyPolicy.tsx"), route("report-head", "routes/reports/branchReports/headReport.tsx"), route("report-uni-head", "routes/reports/universityReports/universityHeadReport.tsx"), route("report-officer", "routes/reports/branchReports/officerReport.tsx"),
  route("report-uni-officer", "routes/reports/universityReports/universityOfficerReport.tsx"),
] satisfies RouteConfig;

