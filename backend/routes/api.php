<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\AdminController;

// ✅ Public routes (no authentication needed)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/departments', [DepartmentController::class, 'index']);
Route::post('/forgot-password', [AuthController::class, 'sendResetOTP']);
Route::post('/verify-otp', [AuthController::class, 'verifyResetOTP']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// ✅ Authenticated routes (JWT protected)
Route::middleware('auth:api')->group(function () {
    // General user info
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // Student-only routes
    Route::middleware('role:student')->group(function () {
        Route::get('/student/dashboard', function () {
            return response()->json(['message' => 'Welcome Student']);
        });
    });

    // Supervisor-only routes
    Route::middleware('role:supervisor')->group(function () {
        Route::get('/supervisor/dashboard', function () {
            return response()->json(['message' => 'Welcome Supervisor']);
        });
    });

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', function () {
            return response()->json(['message' => 'Welcome Admin']);
        });

        // ✅ Admin user approval routes
        Route::get('/admin/pending-users', [AdminController::class, 'listPendingUsers']);
        Route::post('/admin/approve-user/{id}', [AdminController::class, 'approveUser']);
        Route::delete('/admin/reject-user/{id}', [AdminController::class, 'rejectUser']);
    });
});




