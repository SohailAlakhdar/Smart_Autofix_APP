import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import * as dotenv from "dotenv";
const envFile = process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev";
dotenv.config({ path: path.join("./src/config/" + envFile) });

import mongoose from "mongoose";
import bootstrap from "../src/app.controller.js";
import { UserModel, roleEnum } from "../src/DB/models/User.model.js";
import { ServiceCenterModel } from "../src/DB/models/ServiceCenter.model.js";
import { TowTruckModel } from "../src/DB/models/TowTruck.model.js";
import { FaultReportModel } from "../src/DB/models/FaultReport.model.js";
import { generateHash } from "../src/utils/security/hash.security.js";

const TEST_PORT = 3699;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let serverInstance;
let testUserToken;
let testUserRefreshToken;
let testUserId;
let adminToken;
let adminId;
let createdServiceCenterId;
let createdTowTruckId;
let createdFaultId;

const rand = Date.now().toString().slice(-6);
const testUserEmail = `suite_user_${rand}@example.com`;
const testUserPhone = `010${rand}999`;
const adminEmail = `suite_admin_${rand}@example.com`;
const adminPhone = `011${rand}888`;

const api = async (endpoint, options = {}) => {
    const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
    const headers = { ...(options.headers || {}) };
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, headers: res.headers, data };
};

describe("Smart Autofix App — Comprehensive Test Suite", () => {
    before(async () => {
        const { server } = await bootstrap(TEST_PORT);
        serverInstance = server;

        // Clean up any stale test accounts
        await UserModel.deleteMany({ email: { $in: [testUserEmail, adminEmail] } });

        // Seed an Admin user directly in DB
        const adminDoc = await UserModel.create({
            name: "Super Admin",
            email: adminEmail,
            phone: adminPhone,
            password: generateHash({ plaintext: "AdminPass123!" }),
            role: roleEnum.admin,
            location: { type: "Point", coordinates: [31.2357, 30.0444] },
        });
        adminId = adminDoc._id.toString();

        // Login as Admin
        const loginRes = await api("/auth/login", {
            method: "POST",
            body: { email: adminEmail, password: "AdminPass123!" },
        });
        assert.equal(loginRes.status, 200, "Admin login should succeed");
        adminToken = loginRes.data?.data?.accessToken;
        assert.ok(adminToken, "Admin access token must be returned");
    });

    after(async () => {
        // Cleanup test data
        try {
            await UserModel.deleteMany({ email: { $in: [testUserEmail, adminEmail] } });
            if (createdServiceCenterId) {
                await ServiceCenterModel.deleteOne({ _id: createdServiceCenterId });
            }
            if (createdTowTruckId) {
                await TowTruckModel.deleteOne({ _id: createdTowTruckId });
            }
            if (createdFaultId) {
                await FaultReportModel.deleteOne({ _id: createdFaultId });
            }
        } catch (e) {
            console.error("Cleanup error:", e);
        }

        if (serverInstance) {
            serverInstance.close();
        }
        await mongoose.disconnect();
    });

    // 1. Health and Routing
    describe("1. Server Health & Routing", () => {
        test("GET / should return 200 Hello World!", async () => {
            const res = await api("/");
            assert.equal(res.status, 200);
            assert.equal(res.data, "Hello World!");
        });

        test("GET /non-existent-route should return 404 In-valid app routing", async () => {
            const res = await api("/non-existent-route");
            assert.equal(res.status, 404);
            assert.equal(res.data?.message, "In-valid app routing");
        });
    });

    // 2. Authentication & Signup
    describe("2. Authentication Module", () => {
        test("POST /auth/signup should fail if required fields are missing", async () => {
            const res = await api("/auth/signup", {
                method: "POST",
                body: { name: "Incomplete" },
            });
            assert.equal(res.status, 400);
            assert.equal(res.data?.message, "Validation Error");
        });

        test("POST /auth/signup should fail if confirmPassword does not match", async () => {
            const res = await api("/auth/signup", {
                method: "POST",
                body: {
                    name: "Mismatch User",
                    email: "mismatch@example.com",
                    phone: "01099990000",
                    password: "password123",
                    confirmPassword: "differentPassword",
                    location: { type: "Point", coordinates: [31.2, 30.0] },
                },
            });
            assert.equal(res.status, 400);
            assert.equal(res.data?.message, "Validation Error");
        });

        test("POST /auth/signup should register a new user successfully", async () => {
            const res = await api("/auth/signup", {
                method: "POST",
                body: {
                    name: "Suite Test User",
                    email: testUserEmail,
                    phone: testUserPhone,
                    password: "TestPassword123!",
                    confirmPassword: "TestPassword123!",
                    location: { type: "Point", coordinates: [31.2357, 30.0444] },
                },
            });
            assert.equal(res.status, 201);
            assert.ok(res.data?.data?.accessToken, "Should return accessToken");
            assert.ok(res.data?.data?.refreshToken, "Should return refreshToken");
            testUserToken = res.data.data.accessToken;
            testUserRefreshToken = res.data.data.refreshToken;
        });

        test("POST /auth/signup should reject duplicate email or phone (409)", async () => {
            const res = await api("/auth/signup", {
                method: "POST",
                body: {
                    name: "Duplicate User",
                    email: testUserEmail,
                    phone: testUserPhone,
                    password: "TestPassword123!",
                    confirmPassword: "TestPassword123!",
                    location: { type: "Point", coordinates: [31.2357, 30.0444] },
                },
            });
            assert.equal(res.status, 409);
        });

        test("POST /auth/login with wrong password should return 401", async () => {
            const res = await api("/auth/login", {
                method: "POST",
                body: { email: testUserEmail, password: "WrongPassword" },
            });
            assert.equal(res.status, 401);
        });

        test("POST /auth/login with valid credentials should succeed", async () => {
            const res = await api("/auth/login", {
                method: "POST",
                body: { email: testUserEmail, password: "TestPassword123!" },
            });
            assert.equal(res.status, 200);
            assert.ok(res.data?.data?.accessToken);
            testUserToken = res.data.data.accessToken;
            testUserRefreshToken = res.data.data.refreshToken;
        });

        test("POST /auth/refresh-token should generate a new access token", async () => {
            const res = await api("/auth/refresh-token", {
                method: "POST",
                body: { refreshToken: testUserRefreshToken },
            });
            assert.equal(res.status, 200);
            assert.ok(res.data?.data?.accessToken);
            testUserToken = res.data.data.accessToken;
        });

        test("POST /auth/forgot-password with valid email should return 200", async () => {
            const res = await api("/auth/forgot-password", {
                method: "POST",
                body: { email: testUserEmail },
            });
            assert.equal(res.status, 200);
        });

        test("POST /auth/forgot-password with non-existent email should return 401", async () => {
            const res = await api("/auth/forgot-password", {
                method: "POST",
                body: { email: "nonexistent_email_404@example.com" },
            });
            assert.equal(res.status, 401);
        });
    });

    // 3. User Profile & Authorization
    describe("3. User Profile & Account Management", () => {
        test("GET /user (or /api/users/profile) should return own profile", async () => {
            const res = await api("/user", {
                headers: { Authorization: `Bearer ${testUserToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.user?.email, testUserEmail);
            testUserId = res.data?.data?.user?._id;
            assert.ok(testUserId);
        });

        test("PATCH /user/update should update profile fields", async () => {
            const res = await api("/user/update", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${testUserToken}` },
                body: { name: "Updated Suite Name" },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.name, "Updated Suite Name");
        });

        test("PATCH /user/password should fail with incorrect old password", async () => {
            const res = await api("/user/password", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${testUserToken}` },
                body: {
                    oldPassword: "WrongPassword99!",
                    password: "NewPassword123!",
                    confirmPassword: "NewPassword123!",
                },
            });
            assert.equal(res.status, 400);
        });

        test("PATCH /user/password should update password successfully", async () => {
            const res = await api("/user/password", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${testUserToken}` },
                body: {
                    oldPassword: "TestPassword123!",
                    password: "NewPassword123!",
                    confirmPassword: "NewPassword123!",
                },
            });
            assert.equal(res.status, 200);

            // Re-login with new password to refresh token
            const reLogin = await api("/auth/login", {
                method: "POST",
                body: { email: testUserEmail, password: "NewPassword123!" },
            });
            assert.equal(reLogin.status, 200);
            testUserToken = reLogin.data?.data?.accessToken;
        });

        test("Regular user should be forbidden (403) from Admin user list", async () => {
            const res = await api("/user/users", {
                headers: { Authorization: `Bearer ${testUserToken}` },
            });
            assert.equal(res.status, 403);
        });

        test("Admin can view all users via GET /user/users", async () => {
            const res = await api("/user/users", {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.data?.data?.users));
            assert.ok(res.data.data.users.length > 0);
        });

        test("Admin can view single user details via GET /user/users/:userId", async () => {
            const res = await api(`/user/users/${testUserId}`, {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.user?._id, testUserId);
        });

        test("Admin can freeze account via DELETE /user/freeze-account/:userId", async () => {
            const res = await api(`/user/freeze-account/${testUserId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.ok(res.data?.data?.freezedAt != null);
        });

        test("Frozen user login is blocked with 403", async () => {
            const res = await api("/auth/login", {
                method: "POST",
                body: { email: testUserEmail, password: "NewPassword123!" },
            });
            assert.equal(res.status, 403);
            assert.match(res.data?.message, /frozen/i);
        });

        test("Admin can unfreeze account via PATCH /user/unfreeze-account/:userId", async () => {
            const res = await api(`/user/unfreeze-account/${testUserId}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);

            // Re-login succeeds now
            const reLogin = await api("/auth/login", {
                method: "POST",
                body: { email: testUserEmail, password: "NewPassword123!" },
            });
            assert.equal(reLogin.status, 200);
            testUserToken = reLogin.data?.data?.accessToken;
        });
    });

    // 4. Service Centers Module
    describe("4. Service Centers Module", () => {
        test("Public GET /service-centers should list active centers", async () => {
            const res = await api("/service-centers");
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
            assert.ok(Array.isArray(res.data?.data));
        });

        test("Public GET /service-centers/nearby should return nearby centers with distanceKm", async () => {
            const res = await api("/service-centers/nearby?lat=30.0444&lng=31.2357");
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
            assert.ok(Array.isArray(res.data?.data));
        });

        test("Admin POST /service-centers creates a new service center", async () => {
            const res = await api("/service-centers", {
                method: "POST",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: {
                    name: "Suite Auto Service Hub",
                    phone: "01012345678",
                    location: {
                        coordinates: [31.2357, 30.0444],
                    },
                    specialties: ["brakes", "mechanic"],
                    workingHours: "8:00 AM - 10:00 PM",
                },
            });
            assert.equal(res.status, 201);
            createdServiceCenterId = res.data?.data?._id;
            assert.ok(createdServiceCenterId);
        });

        test("Public GET /service-centers/:id gets center details", async () => {
            const res = await api(`/service-centers/${createdServiceCenterId}`);
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.name, "Suite Auto Service Hub");
        });

        test("Admin PUT /service-centers/:id updates center details", async () => {
            const res = await api(`/service-centers/${createdServiceCenterId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: {
                    name: "Suite Auto Service Hub Updated",
                },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.name, "Suite Auto Service Hub Updated");
        });

        test("User POST /service-centers/:id/rate rates center successfully", async () => {
            const res = await api(`/service-centers/${createdServiceCenterId}/rate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${testUserToken}` },
                body: { rating: 5 },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.rating, 5);
            assert.equal(res.data?.data?.ratingsCount, 1);
        });

        test("Admin DELETE /service-centers/:id freezes the service center", async () => {
            const res = await api(`/service-centers/${createdServiceCenterId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.match(res.data?.message, /frozen/i);
        });

        test("Frozen service center is hidden from public GET /service-centers/:id (404)", async () => {
            const res = await api(`/service-centers/${createdServiceCenterId}`);
            assert.equal(res.status, 404);
        });

        test("Admin PATCH /service-centers/:id/unfreeze restores the service center", async () => {
            const res = await api(`/service-centers/${createdServiceCenterId}/unfreeze`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.match(res.data?.message, /unfrozen/i);

            // Re-fetch should now succeed (200)
            const getRes = await api(`/service-centers/${createdServiceCenterId}`);
            assert.equal(getRes.status, 200);
        });
    });

    // 5. Tow Trucks Module
    describe("5. Tow Trucks Module", () => {
        test("Public GET /tow-trucks should list active tow trucks", async () => {
            const res = await api("/tow-trucks");
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
            assert.ok(Array.isArray(res.data?.data));
        });

        test("Public GET /tow-trucks/nearby should return nearby trucks with distanceKm", async () => {
            const res = await api("/tow-trucks/nearby?lat=30.0444&lng=31.2357");
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
            assert.ok(Array.isArray(res.data?.data));
        });

        test("Admin POST /tow-trucks creates a new tow truck", async () => {
            const res = await api("/tow-trucks", {
                method: "POST",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: {
                    name: "Suite Quick Tow",
                    phone: "01199991111",
                    location: {
                        coordinates: [31.2357, 30.0444],
                    },
                },
            });
            assert.equal(res.status, 201);
            createdTowTruckId = res.data?.data?._id;
            assert.ok(createdTowTruckId);
        });

        test("Public GET /tow-trucks/:id gets tow truck details", async () => {
            const res = await api(`/tow-trucks/${createdTowTruckId}`);
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.name, "Suite Quick Tow");
        });

        test("Admin PUT /tow-trucks/:id updates tow truck details", async () => {
            const res = await api(`/tow-trucks/${createdTowTruckId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${adminToken}` },
                body: {
                    name: "Suite Quick Tow Updated",
                },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.name, "Suite Quick Tow Updated");
        });

        test("User POST /tow-trucks/:id/rate rates tow truck successfully", async () => {
            const res = await api(`/tow-trucks/${createdTowTruckId}/rate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${testUserToken}` },
                body: { rating: 4 },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.rating, 4);
            assert.equal(res.data?.data?.ratingsCount, 1);
        });

        test("Admin DELETE /tow-trucks/:id freezes tow truck", async () => {
            const res = await api(`/tow-trucks/${createdTowTruckId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.match(res.data?.message, /frozen/i);
        });

        test("Frozen tow truck is hidden from public GET /tow-trucks/:id (404)", async () => {
            const res = await api(`/tow-trucks/${createdTowTruckId}`);
            assert.equal(res.status, 404);
        });

        test("Admin PATCH /tow-trucks/:id/unfreeze restores tow truck", async () => {
            const res = await api(`/tow-trucks/${createdTowTruckId}/unfreeze`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.match(res.data?.message, /unfrozen/i);

            const getRes = await api(`/tow-trucks/${createdTowTruckId}`);
            assert.equal(getRes.status, 200);
        });
    });

    // 6. Fault Diagnosis Module (AI & History)
    describe("6. Fault Diagnosis Module", () => {
        test("POST /fault/diagnose analyzes car problem using AI and auto-attaches assistance if hard", async () => {
            const res = await api("/fault/diagnose", {
                method: "POST",
                headers: { Authorization: `Bearer ${testUserToken}` },
                body: {
                    faultType: "text",
                    faultText: "Car engine overheating, high temperature gauge and smoke coming from under the hood",
                    lng: 31.2357,
                    lat: 30.0444,
                },
            });
            assert.equal(res.status, 201);
            assert.equal(res.data?.success, true);
            const report = res.data?.data;
            assert.ok(report?._id);
            createdFaultId = report._id;

            // Verify AI Result schema
            assert.ok(report.aiResult?.faultName);
            assert.ok(["easy", "hard"].includes(report.aiResult?.difficulty));
            assert.ok(Array.isArray(report.aiResult?.requiredTools));
            assert.ok(Array.isArray(report.aiResult?.steps));
            assert.ok(Array.isArray(report.aiResult?.safetyTips));

            // If difficulty is hard, nearest assistance is attached
            if (report.aiResult.difficulty === "hard") {
                assert.ok(report.nearestServiceCenter != null);
                assert.ok(report.nearestTowTruck != null);
            }
        });

        test("GET /fault/history returns the user's diagnosis history", async () => {
            const res = await api("/fault/history", {
                headers: { Authorization: `Bearer ${testUserToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
            assert.ok(Array.isArray(res.data?.data));
            assert.ok(res.data.data.length >= 1);
        });

        test("GET /fault/:id returns specific fault report details", async () => {
            const res = await api(`/fault/${createdFaultId}`, {
                headers: { Authorization: `Bearer ${testUserToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?._id, createdFaultId);
        });

        test("POST /fault/:id/feedback saves user diagnosis feedback", async () => {
            const res = await api(`/fault/${createdFaultId}/feedback`, {
                method: "POST",
                headers: { Authorization: `Bearer ${testUserToken}` },
                body: {
                    wasHelpful: true,
                    rating: 5,
                    comment: "Accurate diagnosis and helpful safety tips",
                },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.data?.userFeedback?.rating, 5);
        });

        test("Admin GET /fault lists all faults across all users", async () => {
            const res = await api("/fault", {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
            assert.ok(Array.isArray(res.data?.data));
        });

        test("Admin GET /fault/stats/common returns aggregated diagnosis statistics", async () => {
            const res = await api("/fault/stats/common", {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
            assert.ok(Array.isArray(res.data?.data));
        });

        test("DELETE /fault/:id allows user to delete their diagnosis", async () => {
            const res = await api(`/fault/${createdFaultId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${testUserToken}` },
            });
            assert.equal(res.status, 200);
            assert.match(res.data?.message, /deleted/i);
            createdFaultId = null; // already deleted
        });
    });

    // 7. Admin Dashboard
    describe("7. Admin Dashboard Module", () => {
        test("GET /admin/dashboard returns comprehensive stats and recent lists", async () => {
            const res = await api("/admin/dashboard", {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);

            const stats = res.data?.data?.stats;
            assert.ok(typeof stats?.users?.total === "number");
            assert.ok(typeof stats?.serviceCenters?.total === "number");
            assert.ok(typeof stats?.towTrucks?.total === "number");
            assert.ok(typeof stats?.faultReports?.total === "number");
            assert.ok(typeof stats?.faultReports?.byDifficulty?.hard === "number");
            assert.ok(typeof stats?.faultReports?.byDifficulty?.easy === "number");

            const recent = res.data?.data?.recent;
            assert.ok(Array.isArray(recent?.users));
            assert.ok(Array.isArray(recent?.serviceCenters));
            assert.ok(Array.isArray(recent?.towTrucks));
            assert.ok(Array.isArray(recent?.faultReports));
        });
    });

    // 8. API Aliases (/api/...)
    describe("8. API Aliases (/api/...) Compliance", () => {
        test("GET /api/service-centers works identically to /service-centers", async () => {
            const res = await api("/api/service-centers");
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
        });

        test("GET /api/tow-trucks works identically to /tow-trucks", async () => {
            const res = await api("/api/tow-trucks");
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
        });

        test("GET /api/admin/dashboard works identically to /admin/dashboard", async () => {
            const res = await api("/api/admin/dashboard", {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data?.success, true);
        });
    });
});
