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
    /**
     * Approved Admins with department name
     */
    public function listApprovedAdmins()
    {
        $rows = User::query()
            ->with(['dept:id,name,Name'])
            ->where('role', 'admin')
            ->where('is_approved', true)
            ->orderBy('id', 'asc')
            ->get();

        $payload = $rows->map(function ($u) {
            return [
                'adminId'    => $u->id,
                'name'       => $u->name,
                'department' => optional($u->dept)->name
                                ?? optional($u->dept)->Name
                                ?? (string) $u->department,
                'role'       => $u->role,
            ];
        });

        return response()->json($payload);
    }

    /**
     * Pending users (now returns department NAME instead of numeric id)
     * Matches AdminDashboard.jsx expectation: [{ userId, name, department, role }]
     */
    public function listPendingUsers()
    {
        $rows = User::query()
            ->with(['dept:id,name,Name'])
            ->where('is_approved', false)
            ->select(['id', 'name', 'department', 'role'])
            ->orderBy('id', 'asc')
            ->get();

        $payload = $rows->map(function ($u) {
            return [
                'userId'     => $u->id,
                'name'       => $u->name,
                'department' => optional($u->dept)->name
                                ?? optional($u->dept)->Name
                                ?? (string) $u->department,
                'role'       => $u->role,
            ];
        });

        return response()->json($payload);
    }

    /**
     * Approved Supervisors with real projects count and department name
     */
    public function listApprovedSupervisors()
    {
        $rows = Supervisor::query()
            ->with([
                'user:id,name,department,role,is_approved',
                'user.dept:id,name,Name',
            ])
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
                'department'   => optional(optional($s->user)->dept)->name
                                  ?? optional(optional($s->user)->dept)->Name
                                  ?? (string) optional($s->user)->department,
                'role'         => optional($s->user)->role,
                'projects'     => $s->projects()->count(),
            ];
        });

        return response()->json($payload);
    }

    /**
     * Approved Students with department name
     */
    public function listApprovedStudents()
    {
        $rows = Student::query()
            ->with([
                'user:id,name,department,role,is_approved',
                'user.dept:id,name,Name',
            ])
            ->whereHas('user', function ($q) {
                $q->where('role', 'student')->where('is_approved', true);
            })
            ->orderBy('student_id', 'asc')
            ->get();

        $payload = $rows->map(function ($s) {
            return [
                'studentId'  => $s->student_id,
                'name'       => optional($s->user)->name,
                'department' => optional(optional($s->user)->dept)->name
                                ?? optional(optional($s->user)->dept)->Name
                                ?? (string) optional($s->user)->department,
                'role'       => optional($s->user)->role,
            ];
        });

        return response()->json($payload);
    }

    /**
     * Approve user by ID and create role-specific record
     */
    public function approveUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->is_approved) {
            return response()->json(['message' => 'User is already approved.'], 400);
        }

        switch ($user->role) {
            case 'student':
                Student::firstOrCreate(['student_id' => $user->id]);
                break;

            case 'supervisor':
                Supervisor::firstOrCreate(
                    ['supervisor_id' => $user->id],
                    ['educational_degree' => 'Not specified']
                );
                break;

            case 'admin':
                Admin::firstOrCreate(['admin_id' => $user->id]);
                break;

            default:
                return response()->json(['message' => 'Unsupported role.'], 422);
        }

        $user->is_approved = true;
        $user->save();

        Mail::raw(
            "Hello {$user->name},\n\nYour PROTRACK account has been approved. You can now sign in and start using the platform.\n\nBest regards,\nPROTRACK Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('PROTRACK Account Approved');
            }
        );

        return response()->json(['message' => 'User approved successfully.']);
    }

    /**
     * Reject user by ID (only if not approved yet)
     */
    public function rejectUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->is_approved) {
            return response()->json(['message' => 'Cannot reject an approved user.'], 400);
        }

        Mail::raw(
            "Hello {$user->name},\n\nYour registration request on PROTRACK has been rejected by the administrator.\nIf you believe this is a mistake, please contact support.\n\nBest regards,\nPROTRACK Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('PROTRACK Registration Rejected');
            }
        );

        $user->delete();

        return response()->json(['message' => 'User has been rejected and removed.']);
    }
}
