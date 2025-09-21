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
use App\Http\Controllers\SupervisorController;

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
/*     Route::middleware('role:student')->group(function () {
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
    }); */

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



/*     Route::middleware('auth:api')->prefix('student')->group(function () {

    // Dashboard - My Team Members (+ counters)
    Route::get('/dashboard/my-team', [StudentController::class, 'dashboardMyTeam']);

    // Admin actions on members
    Route::delete('/team/{teamId}/member/{studentId}', [StudentController::class, 'removeMember']);
    Route::post('/team/{teamId}/leave', [StudentController::class, 'leaveTeam']);

    // Incoming invites (hide if user already approved)
    Route::get('/incoming-invites', [StudentController::class, 'incomingInvites']);
    Route::post('/incoming-invites/{teamId}/accept', [StudentController::class, 'acceptInvite']);
    Route::post('/incoming-invites/{teamId}/reject', [StudentController::class, 'rejectInvite']);

    // Create/Edit Team
    Route::post('/team/save', [StudentController::class, 'saveTeam']); // body: { team_name }

    // People I can invite
    Route::get('/invite/people', [StudentController::class, 'peopleICanInvite']); // query: name,phone,studentId,email
    Route::post('/invite/{studentId}', [StudentController::class, 'sendInvite']);

    
Route::get('/student/projects/{projectId}/overview', [StudentController::class, 'projectOverview']);
Route::post('/student/projects/{projectId}/posts',     [StudentController::class, 'addProjectPost']);

Route::get('/student/tasks/{taskId}/thread',   [StudentController::class, 'taskThread']);
Route::post('/student/tasks/{taskId}/submit',  [StudentController::class, 'submitTask']);
Route::post('/student/tasks/{taskId}/comments',[StudentController::class, 'addTaskComment']);
Route::get('/student/projects/current', [StudentController::class, 'currentProject']);

}); */


});

// تحديث بياناتي الأساسية (مثلاً رقم الجوال)
Route::middleware('auth:api')->put('/me', [MeController::class,'update']);

// رفع الصورة الشخصية
Route::middleware('auth:api')->group(function () {
    Route::post('/me/photo', [ProfilePhotoController::class, 'update']); // أو PUT حسب تفضيلك
});


Route::middleware('auth:api')->get('/supervisor/my-projects', [SupervisorController::class, 'myProjects']);

Route::middleware('auth:api')->group(function () {
    Route::post('/supervisor/projects', [SupervisorController::class, 'store']);
    Route::post('/supervisor/projects/{projectId}', [SupervisorController::class, 'update']); // يمكنك تبديلها إلى PUT إن رغبت
    Route::get('/supervisor/projects/{projectId}', [SupervisorController::class, 'show']);
    // Supervisor – incoming team applications
    Route::get('/supervisor/incoming-requests', [SupervisorController::class, 'incomingRequests']);
    Route::get('/supervisor/team/{teamId}/members', [SupervisorController::class, 'teamMembers']);
    Route::delete('/supervisor/projects/{projectId}', [SupervisorController::class, 'destroy']); 
    Route::get('/supervisor/tasks/{taskId}',  [SupervisorController::class, 'getTask']);
    Route::post('/supervisor/tasks/{taskId}', [SupervisorController::class, 'updateTask']);
    Route::patch(
        '/admin/supervisors/{supervisorId}/projects-limit',
        [AdminController::class, 'updateSupervisorProjectsLimit']
    )->whereNumber('supervisorId');
     Route::patch(
        '/supervisor/team-applications/{teamId}/{projectId}',
        [SupervisorController::class, 'updateTeamApplicationStatus']
    );

    Route::get('/supervisor/previous-projects', [SupervisorController::class, 'previousReservedProjects']);
    Route::post('/supervisor/projects/{project}/activate', [SupervisorController::class, 'activatePreviousProject']);
    Route::get('/supervisor/projects/{projectId}/details', [SupervisorController::class, 'projectDetails']);
    Route::post('/supervisor/projects/{projectId}/posts',   [SupervisorController::class, 'addProjectPost']);
    Route::post('/supervisor/projects/{projectId}/tasks',   [SupervisorController::class, 'addProjectTask']);
});

Route::middleware('auth:api')->group(function () {
    Route::get('/student/applications/overview', [StudentController::class, 'applicationsOverview']);

    // Apply to a project (admin only, blocks if team has Pending/Approved)
    Route::post('/student/applications/apply/{projectId}', [StudentController::class, 'applyToProject'])
        ->whereNumber('projectId');

    // Project details (for StudentProjectDetails page)
    Route::get('/student/projects/{id}', [StudentController::class, 'projectDetails'])
        ->whereNumber('id');

    Route::get('/student/tasks/{task}/details', [StudentController::class, 'taskDetails'])
        ->whereNumber('task');

});

Route::middleware('auth:api')->prefix('student')->group(function () {

    // Dashboard - My Team Members (+ counters)
    Route::get('/dashboard/my-team', [StudentController::class, 'dashboardMyTeam']);

    // Admin actions on members
    Route::delete('/team/{teamId}/member/{studentId}', [StudentController::class, 'removeMember']);
    Route::post('/team/{teamId}/leave', [StudentController::class, 'leaveTeam']);

    // Incoming invites (hide if user already approved)
    Route::get('/incoming-invites', [StudentController::class, 'incomingInvites']);
    Route::post('/incoming-invites/{teamId}/accept', [StudentController::class, 'acceptInvite']);
    Route::post('/incoming-invites/{teamId}/reject', [StudentController::class, 'rejectInvite']);

    // Create/Edit Team
    Route::post('/team/save', [StudentController::class, 'saveTeam']); // body: { team_name }

    // People I can invite
    Route::get('/invite/people', [StudentController::class, 'peopleICanInvite']); // query: name,phone,studentId,email
    Route::post('/invite/{studentId}', [StudentController::class, 'sendInvite']);
});

Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {
    Route::prefix('supervisor')->group(function () {

        // Task details page data
        Route::get('/tasks/{taskId}/submissions', [SupervisorController::class, 'getTaskSubmissions']); // table data + task title

        // View popup: files, grade, comments
        Route::get('/tasks/{taskId}/submissions/{studentId}', [SupervisorController::class, 'getStudentSubmission']);

        // Save grade (0..10)
        Route::post('/tasks/{taskId}/submissions/{studentId}/grade', [SupervisorController::class, 'saveStudentGrade']);

        // Add a comment (author = supervisor)
        Route::post('/tasks/{taskId}/comments', [SupervisorController::class, 'addComment']);

         Route::get('/tasks/{taskId}/comments/{studentId}', [SupervisorController::class, 'getCommentsForStudent']);


        Route::get('/supervisor/tasks/{taskId}/comments/{studentId}', [SupervisorController::class, 'getCommentsForStudent']);

    });
});



// All of this remains INSIDE your outer group: Route::middleware(['jwt.cookie','auth:api'])->group(function () { ... })
Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {

    // Other student endpoints you already have
    Route::get('applications/overview', [StudentController::class, 'applicationsOverview']);
    Route::post('applications/apply/{projectId}', [StudentController::class, 'applyToProject'])->whereNumber('projectId');
    Route::get('projects/{id}', [StudentController::class, 'projectDetails'])->whereNumber('id');


            // Student: My Project overview
        Route::get('/student/my-project', [StudentController::class, 'myProject']);

        // Project posts
        Route::get('/student/projects/{project}/posts', [StudentController::class, 'getProjectPosts']);
        Route::post('/student/projects/{project}/posts', [StudentController::class, 'addProjectPost']);

        // Project tasks + final grade
        Route::get('/student/projects/{project}/tasks', [StudentController::class, 'getProjectTasks']);

        // Task submission read/create/update
        Route::get('/student/tasks/{task}/submission', [StudentController::class, 'getSubmission']);
        Route::post('/student/tasks/{task}/submission', [StudentController::class, 'createSubmission']);
        Route::post('/student/tasks/{task}/submission/update', [StudentController::class, 'updateSubmission']);

        // Task comments
        Route::get('/student/tasks/{task}/comments', [StudentController::class, 'getComments']);
        Route::post('/student/tasks/{task}/comments', [StudentController::class, 'addComment']);

});





/*
|--------------------------------------------------------------------------
| Optional: health check
|--------------------------------------------------------------------------
*/
Route::get('/health', fn () => response()->json(['ok' => true]));