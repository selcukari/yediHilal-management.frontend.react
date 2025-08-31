import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/member.tsx"), route("login", "routes/login.tsx"), route("users", "routes/user.tsx"), route("mails", "routes/mail.tsx"),
  route("sms", "routes/sms.tsx"), route("stocks", "routes/stock.tsx"), route("stockExpenses", "routes/stockUsedExpense.tsx"),
  route("stockDeposits", "routes/stockUsedDeposit.tsx"), route("projects", "routes/project.tsx"), route("finances", "routes/finance.tsx"),
  route("meetings", "routes/meeting.tsx"), route("vehicles", "routes/vehicle.tsx")
] satisfies RouteConfig;

