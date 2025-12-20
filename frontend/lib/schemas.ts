import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export const RegisterSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(30, '用户名太长了'),
  password: z.string().min(6, '密码长度不能少于6位'),
  confirmPassword: z.string().min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
