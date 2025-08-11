<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{

    public function listApprovedAdmins()
    {
    // Matches AllAdmins.jsx expectation: adminId, name, department, role
    return User::query()
        ->where('role', 'admin')
        ->where('is_approved', true)
        ->select(['id as adminId', 'name', 'department', 'role'])
        ->orderBy('id', 'asc')
        ->get();
    }

    public function listPendingUsers()
    {
    // Matches AdminDashboard.jsx expectation: userId, name, department, role
    return User::query()
        ->where('is_approved', false)
        ->select(['id as userId', 'name', 'department', 'role'])
        ->orderBy('id', 'asc')
        ->get();
    }

     public function listApprovedSupervisors()
    {
    $rows = Supervisor::query()
        ->with(['user:id,name,department,role,is_approved'])
        ->whereHas('user', function ($q) {
            $q->where('role', 'supervisor')->where('is_approved', true);
        })
        ->orderBy('supervisor_id', 'asc')
        ->get();

    $payload = $rows->map(function ($s) {
        return [
            'supervisorId' => $s->supervisor_id,
            'name'         => optional($s->user)->name,
            'degree'       => $s->educational_degree ?? 'Not specified',
            'department'   => optional($s->user)->department,
            'role'         => optional($s->user)->role,
            'projects'     => 3, // <-- fixed number here
        ];
    });

    return response()->json($payload);
    }

    public function approveUser($id)
{
    $user = User::findOrFail($id);

    if ($user->is_approved) {
        return response()->json(['message' => 'User is already approved.'], 400);
    }

    // Create role-specific record (PKs are *_id FKs to users.id)
    switch ($user->role) {
        case 'student':
            Student::firstOrCreate(
                ['student_id' => $user->id],
                ['department' => $user->department, 'phone_number' => $user->phone_number]
            );
            break;

        case 'supervisor':
            Supervisor::firstOrCreate(
                ['supervisor_id' => $user->id],
                [
                    'department'         => $user->department,
                    'phone_number'       => $user->phone_number,
                    'educational_degree' => 'Not specified'
                ]
            );
            break;

        case 'admin':
            Admin::firstOrCreate(['admin_id' => $user->id]);
            break;

        default:
            return response()->json(['message' => 'Unsupported role.'], 422);
    }

    // Mark approved
    $user->is_approved = true;
    $user->save();

    // Send approval email
    Mail::raw(
        "Hello {$user->name},\n\nYour PROTRACK account has been approved. You can now sign in and start using the platform.\n\nBest regards,\nPROTRACK Team",
        function ($message) use ($user) {
            $message->to($user->email)->subject('PROTRACK Account Approved');
        }
    );

    return response()->json(['message' => 'User approved successfully.']);
}

public function rejectUser($id)
{
    $user = User::findOrFail($id);

    if ($user->is_approved) {
        return response()->json(['message' => 'Cannot reject an approved user.'], 400);
    }

    // Send rejection email
    Mail::raw(
        "Hello {$user->name},\n\nYour registration request on PROTRACK has been rejected by the administrator.\nIf you believe this is a mistake, please contact support.\n\nBest regards,\nPROTRACK Team",
        function ($message) use ($user) {
            $message->to($user->email)->subject('PROTRACK Registration Rejected');
        }
    );

    // Delete user (any dependent rows won’t exist yet since not approved)
    $user->delete();

    return response()->json(['message' => 'User has been rejected and removed.']);
}


}
