<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ProfilePhotoController;
use App\Http\Controllers\MeController;

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
|--------------------------------------------------------------------------
*/
Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {

    // General user info
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/me/password', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // ===== Student-only =====
    Route::middleware('role:student')->group(function () {
        Route::get('/student/dashboard', fn () => response()->json(['message' => 'Welcome Student']));

        // رأس الصفحة والفريق الحالي والأعضاء
        Route::get('/student/header',       [StudentController::class, 'header']);
        Route::get('/student/team',         [StudentController::class, 'currentTeam']);
        Route::get('/student/team/members', [StudentController::class, 'teamMembers']);

        // طلبات فريقي (كأدمن): تعتمد على وجود دالة pendingRequests في الكنترولر
        Route::get('/student/team/requests',                      [StudentController::class, 'pendingRequests']);
        Route::post('/student/team/requests/{studentId}/approve', [StudentController::class, 'approveRequest']);
        Route::post('/student/team/requests/{studentId}/reject',  [StudentController::class, 'rejectRequest']);
        Route::delete('/student/team/members/{studentId}',        [StudentController::class, 'removeMember']);

        // الدعوات/الطلبات الموجهة إليّ كطالب
        Route::get('/student/my-join-requests',                  [StudentController::class, 'myJoinRequests']);
        Route::post('/student/my-join-requests/{teamId}/accept', [StudentController::class, 'acceptMyInvite']);
        Route::post('/student/my-join-requests/{teamId}/reject', [StudentController::class, 'rejectMyInvite']);

        // ===== Create/Edit Team page (الإضافات الجديدة) =====
        Route::get('/student/create-team/init',                 [StudentController::class, 'createTeamInit']);
        Route::post('/student/create-team/upsert',              [StudentController::class, 'upsertTeam']);
        Route::post('/student/create-team/invite/{studentId}',  [StudentController::class, 'inviteStudent']);
        // إن احتجت لاحقًا:
        // Route::delete('/student/create-team/invite-or-member/{studentId}', [StudentController::class, 'removeInviteOrMember']);
        // Route::post('/student/create-team/make-admin/{studentId}',         [StudentController::class, 'makeAdmin']);
    });

    // ===== Supervisor-only =====
    Route::middleware('role:supervisor')->group(function () {
        Route::get('/supervisor/dashboard', fn () => response()->json(['message' => 'Welcome Supervisor']));
    });

    // ===== Admin-only =====
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', fn () => response()->json(['message' => 'Welcome Admin']));

        Route::get('/admin/students',      [AdminController::class, 'listApprovedStudents']);
        Route::get('/admin/supervisors',   [AdminController::class, 'listApprovedSupervisors']);
        Route::get('/admin/admins',        [AdminController::class, 'listApprovedAdmins']);
        Route::get('/admin/pending-users', [AdminController::class, 'listPendingUsers']);

        Route::get('/semesters/current',   [AdminController::class, 'current']);
        Route::put('/semesters/current',   [AdminController::class, 'setCurrent']);

        Route::post('/admin/users/{id}/approve', [AdminController::class, 'approveUser']);
        Route::post('/admin/users/{id}/reject',  [AdminController::class, 'rejectUser']);

        Route::post('/admin/addAdmin',      [AdminController::class, 'addAdmin']);
        Route::post('/admin/addSupervisor', [AdminController::class, 'addSupervisor']);
        Route::post('/admin/addStudent',    [AdminController::class, 'addStudent']);
    });

});

// تحديث بياناتي الأساسية (مثلاً رقم الجوال)
Route::middleware('auth:api')->put('/me', [MeController::class,'update']);

// رفع الصورة الشخصية
Route::middleware('auth:api')->group(function () {
    Route::post('/me/photo', [ProfilePhotoController::class, 'update']); // أو PUT حسب تفضيلك
});

/*
|--------------------------------------------------------------------------
| Optional: health check
|--------------------------------------------------------------------------
*/
Route::get('/health', fn () => response()->json(['ok' => true]));
