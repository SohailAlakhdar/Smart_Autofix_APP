import { Router } from "express";
const router = Router();
/**
 *
5. Tow Truck Module — /api/tow-trucks
Method	Endpoint	Description	Auth
GET	/api/tow-trucks	كل الأونشات	Public
GET	/api/tow-trucks/nearby	أقرب ونش حسب الموقع (geo query + distanceKm)	Private
GET	/api/tow-trucks/:id	تفاصيل ونش معين	Public
POST	/api/tow-trucks	إضافة ونش جديد	Admin
PUT	/api/tow-trucks/:id	تعديل بيانات ونش	Admin
DELETE	/api/tow-trucks/:id	حذف ونش	Admin
POST	/api/tow-trucks/:id/request	طلب ونش مباشرة (بدون كتابة عطل)	Private
PUT	/api/tow-trucks/:id/availability	تحديث حالة التوفر (متاح/مشغول)	Technician/Admin

Tow Truck fields: name, phone, location {lat, lng}, isAvailable, freezedBy
 */





export default router;
