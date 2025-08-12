<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProfileController;

/*
|--------------------------------------------------------------------------
| Public routes (no authentication)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::get('/departments', [DepartmentController::class, 'index']);

Route::post('/forgot-password', [AuthController::class, 'sendResetOTP']);
Route::post('/verify-otp', [AuthController::class, 'verifyResetOTP']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
| Authenticated routes (JWT protected via HttpOnly cookie)
| NOTE: requires 'jwt.cookie' alias registered in Kernel:
|   'jwt.cookie' => \App\Http\Middleware\AppendJwtFromCookie::class,
|--------------------------------------------------------------------------
*/
Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {

    // General user info
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // ===== My Profile (for any authenticated user) =====
    Route::get('/profile',        [ProfileController::class, 'show']);
    Route::put('/profile',        [ProfileController::class, 'update']);
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']); // NEW: upload avatar

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

        // ===== Admin user & directories routes =====
        Route::get('/admin/students',      [AdminController::class, 'listApprovedStudents']); // All Students
        Route::get('/admin/supervisors',   [AdminController::class, 'listApprovedSupervisors']);
        Route::get('/admin/admins',        [AdminController::class, 'listApprovedAdmins']);
        Route::get('/admin/pending-users', [AdminController::class, 'listPendingUsers']);
        Route::get('/semesters/current', [AdminController::class, 'current']);
        Route::put('/semesters/current', [AdminController::class, 'setCurrent']);

        // Approvals
        // Route::post('/admin/approve-user/{id}', [AdminController::class, 'approveUser']);
        // Route::delete('/admin/reject-user/{id}', [AdminController::class, 'rejectUser']);
        Route::post('/admin/users/{id}/approve', [AdminController::class, 'approveUser']);
        Route::post('/admin/users/{id}/reject',  [AdminController::class, 'rejectUser']);
    });

});

/*
|--------------------------------------------------------------------------
| Optional: simple health check (public)
|--------------------------------------------------------------------------
*/
Route::get('/health', fn () => response()->json(['ok' => true]));
