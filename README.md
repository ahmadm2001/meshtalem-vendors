# مشتالم - بوابة الموردين

بوابة الموردين لمنصة مشتالم. واجهة كاملة باللغة العربية.

## الصفحات

| الصفحة | المسار |
|--------|--------|
| تسجيل الدخول | `/auth/login` |
| تسجيل مورد جديد | `/auth/register` |
| لوحة التحكم | `/dashboard` |
| قائمة المنتجات | `/products` |
| إضافة منتج | `/products/new` |
| تعديل منتج | `/products/[id]` |
| الطلبات | `/orders` |
| الملف الشخصي | `/profile` |

## التشغيل

```bash
npm install
cp .env.example .env.local
# عدّل .env.local وأضف عنوان الـ Backend
npm run dev
# يعمل على: http://localhost:3002
```

## ملاحظات

- جميع الصفحات باللغة العربية RTL
- يتطلب تشغيل meshtalem-backend أولاً
- الترجمة التلقائية للعبرية تتم على الـ Backend بواسطة OpenAI
