"use client";
import Link from "next/link";
import CustomerNav from "@/app/components/CustomerNav";
export default function CheckoutPage(){return <main className="min-h-screen bg-slate-50 pb-24 text-slate-900"><CustomerNav/><div className="mx-auto max-w-2xl px-4 py-8 sm:px-6"><h1 className="text-4xl font-black">Thanh toán</h1><div className="mt-8 rounded-2xl bg-white p-6 shadow-sm"><p className="text-slate-600">Giao diện thanh toán đã được tạo. Bạn cần kết nối thêm API tạo đơn hàng và phương thức thanh toán của Backend.</p><Link href="/customer/cart" className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Quay lại giỏ hàng</Link></div></div></main>}
